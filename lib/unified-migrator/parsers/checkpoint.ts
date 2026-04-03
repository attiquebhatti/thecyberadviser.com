import { BaseParser } from '@/lib/unified-migrator/parsers/base';
import { ParseInput, VersionInfo, VersionProfile } from '@/lib/unified-migrator/types';
import { fingerprint } from '@/lib/unified-migrator/utils';

export class CheckpointParser extends BaseParser {
  private ruleOrder = 0;

  constructor(input: ParseInput, version: VersionInfo, profile: VersionProfile) {
    super(input, 'checkpoint', version, profile);
  }

  parse() {
    for (let index = 0; index < this.lines.length; index += 1) {
      const line = this.lines[index].trim();
      if (line.startsWith('add host ')) this.parseHost(line, index + 1);
      else if (line.startsWith('add network ')) this.parseNetwork(line, index + 1);
      else if (line.startsWith('add address-range ')) this.parseRange(line, index + 1);
      else if (line.startsWith('add group ')) this.parseGroup(line, index + 1);
      else if (line.startsWith('set group ')) this.parseGroupMember(line);
      else if (line.startsWith('add service-tcp ')) this.parseService(line, 'tcp', index + 1);
      else if (line.startsWith('add service-udp ')) this.parseService(line, 'udp', index + 1);
      else if (line.startsWith('add service-group ')) this.parseServiceGroup(line, index + 1);
      else if (line.startsWith('add access-rule ')) this.parsePolicy(line, index + 1);
      else if (line.startsWith('add nat-rule ')) this.parseNat(line, index + 1);
      else if (line.startsWith('add time ') || line.startsWith('add time-group ')) this.parseSchedule(line, index + 1);
    }
    return this.buildResult();
  }

  private parseHost(line: string, lineNumber: number) {
    const args = parseArgs(line);
    const ip = args['ip-address'] || args['ipv4-address'];
    if (!args.name || !ip) return;
    const name = this.uniqueName(args.name);
    this.pushAddress({
      ...this.entityBase(name, lineNumber),
      type: 'ip-netmask',
      value: `${ip}/32`,
      exceptions: [],
      fingerprint: fingerprint([name, ip]),
    });
  }

  private parseNetwork(line: string, lineNumber: number) {
    const args = parseArgs(line);
    if (!args.name || !args.subnet4 || !args['mask-length4']) return;
    const name = this.uniqueName(args.name);
    this.pushAddress({
      ...this.entityBase(name, lineNumber),
      type: 'ip-netmask',
      value: `${args.subnet4}/${args['mask-length4']}`,
      exceptions: [],
      fingerprint: fingerprint([name, args.subnet4, args['mask-length4']]),
    });
  }

  private parseRange(line: string, lineNumber: number) {
    const args = parseArgs(line);
    if (!args.name || !args['ip-address-first'] || !args['ip-address-last']) return;
    const name = this.uniqueName(args.name);
    this.pushAddress({
      ...this.entityBase(name, lineNumber),
      type: 'ip-range',
      value: `${args['ip-address-first']}-${args['ip-address-last']}`,
      exceptions: [],
      fingerprint: fingerprint([name, args['ip-address-first'], args['ip-address-last']]),
    });
  }

  private parseGroup(line: string, lineNumber: number) {
    const args = parseArgs(line);
    if (!args.name) return;
    const name = this.uniqueName(args.name);
    this.pushAddressGroup({
      ...this.entityBase(name, lineNumber),
      members: [],
      nestedDepth: 1,
      exceptions: [],
      fingerprint: fingerprint([name]),
    });
  }

  private parseGroupMember(line: string) {
    const args = parseArgs(line);
    if (!args.name || !args['members.add']) return;
    const group = this.ir.addressGroups.find((candidate) => candidate.name === args.name);
    if (group) {
      group.members.push(this.reference('address', args['members.add']));
      group.nestedDepth = Math.max(group.nestedDepth, args['members.add'].includes('group') ? 2 : 1);
      group.fingerprint = fingerprint([group.name, ...group.members.map((member) => member.ref)]);
    }
  }

  private parseService(line: string, protocol: string, lineNumber: number) {
    const args = parseArgs(line);
    if (!args.name) return;
    const name = this.uniqueName(args.name);
    const exceptions = args.port
      ? []
      : [
          this.exception(
            'service_missing_port',
            'lossiness',
            'medium',
            'service',
            `Service ${name} has no explicit port.`,
            'Set the destination port manually in PAN-OS.'
          ),
        ];

    this.pushService({
      ...this.entityBase(name, lineNumber, lineNumber, exceptions),
      protocol,
      port: args.port || '0',
      exceptions,
      fingerprint: fingerprint([name, protocol, args.port || '0']),
    });
  }

  private parseServiceGroup(line: string, lineNumber: number) {
    const args = parseArgs(line);
    if (!args.name) return;
    const name = this.uniqueName(args.name);
    const members = splitCsv(args.members).map((member) => this.reference('service', member));
    this.pushServiceGroup({
      ...this.entityBase(name, lineNumber),
      members,
      nestedDepth: 1,
      exceptions: [],
      fingerprint: fingerprint([name, ...members.map((member) => member.ref)]),
    });
  }

  private parsePolicy(line: string, lineNumber: number) {
    const args = parseArgs(line);
    const name = this.uniqueName(args.name || `Rule-${this.ruleOrder + 1}`);
    this.pushPolicy({
      ...this.entityBase(name, lineNumber, lineNumber, [], this.ruleOrder),
      order: this.ruleOrder,
      from: this.anySet(),
      to: this.anySet(),
      source: args.source === 'Any' || !args.source ? this.anySet() : this.resolveLiteralMembers([args.source], 'address-group'),
      destination:
        args.destination === 'Any' || !args.destination
          ? this.anySet()
          : this.resolveLiteralMembers([args.destination], 'address-group'),
      service: args.service === 'Any' || !args.service ? this.anySet() : this.resolveLiteralMembers([args.service], 'service'),
      action: (args.action || 'Drop').toLowerCase() === 'accept' ? 'allow' : 'deny',
      disabled: false,
      logging: {
        atStart: false,
        atEnd: true,
      },
      schedule: {
        refs: args.time ? [args.time] : [],
        mode: args.time ? 'named' : 'always',
      },
      profiles: [],
      exceptions: [],
      fingerprint: fingerprint([name, this.ruleOrder, args.source, args.destination, args.service]),
    });
    this.ruleOrder += 1;
  }

  private parseNat(line: string, lineNumber: number) {
    const args = parseArgs(line);
    const method = (args.method || '').toLowerCase();
    const natType =
      method === 'static'
        ? 'static'
        : method === 'hide' || method === 'dynamic'
          ? 'dynamic'
          : method === 'identity'
            ? 'identity'
            : 'unknown';
    const exceptions =
      natType === 'unknown'
        ? [
            this.exception(
              'unsupported_nat_method',
              'unsupported',
              'high',
              'nat-rule',
              `Check Point NAT method ${args.method || 'unknown'} is not fully supported.`,
              'Rebuild this NAT rule manually in PAN-OS.'
            ),
          ]
        : [];
    this.pushNatRule({
      ...this.entityBase(`cp-nat-${this.ir.natRules.length + 1}`, lineNumber, lineNumber, exceptions, this.ir.natRules.length),
      order: this.ir.natRules.length,
      natType,
      originalPacket: {
        srcAddress: args['original-source'],
        dstAddress: args['original-destination'],
      },
      translatedPacket: {
        srcAddress: args['translated-source'],
        dstAddress: args['translated-destination'],
      },
      bidirectional: natType === 'static' || natType === 'identity',
      exceptions,
      fingerprint: fingerprint([method, args['original-source'], args['translated-source']]),
    });
  }

  private parseSchedule(line: string, lineNumber: number) {
    const args = parseArgs(line);
    if (!args.name) return;
    const name = this.uniqueName(args.name);
    this.pushSchedule({
      ...this.entityBase(name, lineNumber),
      mode: 'recurring',
      rawDefinition: line,
      exceptions: [],
      fingerprint: fingerprint([name, line]),
    });
  }
}

function parseArgs(line: string) {
  const result: Record<string, string> = {};
  for (const match of line.matchAll(/(\S+)\s+(?:"([^"]+)"|(\S+))/g)) {
    result[match[1]] = match[2] || match[3];
  }
  return result;
}

function splitCsv(value?: string) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}
