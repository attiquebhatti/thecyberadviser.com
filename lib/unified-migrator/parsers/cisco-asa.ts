import { BaseParser } from '@/lib/unified-migrator/parsers/base';
import { ParseInput, VersionInfo, VersionProfile } from '@/lib/unified-migrator/types';
import {
  cidrFromMask,
  cidrFromWildcard,
  fingerprint,
} from '@/lib/unified-migrator/utils';

export class CiscoAsaParser extends BaseParser {
  private ruleOrder = 0;
  private pendingInterfaces = new Map<string, number>();

  constructor(input: ParseInput, version: VersionInfo, profile: VersionProfile) {
    super(input, 'cisco-asa', version, profile);
  }

  parse() {
    let remark = '';
    for (let index = 0; index < this.lines.length; index += 1) {
      const line = this.lines[index].trim();

      if (line.startsWith('interface ')) {
        const interfaceName = line.slice('interface '.length).trim();
        this.pendingInterfaces.set(interfaceName, index + 1);
      } else if (line.startsWith('nameif ')) {
        this.parseNameif(line, index + 1);
      } else if (line.startsWith('object network ')) {
        index = this.parseObjectNetwork(index);
      } else if (line.startsWith('object-group network ')) {
        index = this.parseNetworkGroup(index);
      } else if (line.startsWith('object service ')) {
        index = this.parseService(index);
      } else if (line.startsWith('object-group service ')) {
        index = this.parseServiceGroup(index);
      } else if (line.startsWith('access-list ') && line.includes(' remark ')) {
        remark = line.slice(line.indexOf(' remark ') + ' remark '.length).trim();
      } else if (line.startsWith('access-list ')) {
        this.parseAccessList(line, index + 1, remark);
        remark = '';
      } else if (line.startsWith('nat ')) {
        this.parseNatRule(line, index + 1);
      } else if (line.startsWith('route ')) {
        this.parseRoute(line, index + 1);
      } else if (line.startsWith('crypto map ') || line.startsWith('tunnel-group ')) {
        this.parseVpnHint(line, index + 1);
      } else if (line && !line.startsWith('!') && !line.startsWith(':')) {
        // Don't track common structural lines
        if (
          !line.startsWith('hostname ') &&
          !line.startsWith('enable ') &&
          !line.startsWith('passwd ') &&
          !line.startsWith('names') &&
          !line.startsWith('dns ') &&
          !line.startsWith(' ')
        ) {
          this.trackUnrecognized(line, index + 1);
        }
      }
    }

    return this.buildResult();
  }

  private parseNameif(line: string, lineNumber: number) {
    const zoneName = line.slice('nameif '.length).trim();
    const [interfaceName] = [...this.pendingInterfaces.entries()].pop() ?? [zoneName, lineNumber];

    this.pushInterface({
      ...this.entityBase(interfaceName, lineNumber),
      type: 'layer3',
      zone: zoneName,
      exceptions: [],
      fingerprint: fingerprint([interfaceName, zoneName]),
    });

    this.pushZone({
      ...this.entityBase(zoneName, lineNumber),
      type: 'layer3',
      interfaces: [this.reference('interface', interfaceName)],
      exceptions: [],
      fingerprint: fingerprint([zoneName, interfaceName]),
    });
  }

  private parseObjectNetwork(startIndex: number) {
    const header = this.lines[startIndex].trim();
    const rawName = header.slice('object network '.length).trim();
    const name = this.uniqueName(rawName);
    const exceptions = [];
    let value = '';
    let type: 'ip-netmask' | 'ip-range' | 'fqdn' = 'ip-netmask';
    let description = '';
    let index = startIndex + 1;

    while (index < this.lines.length) {
      const line = this.lines[index];
      const trimmed = line.trim();

      if (!trimmed || trimmed === '!' || (/^[a-z]/i.test(trimmed) && !line.startsWith(' '))) {
        break;
      }

      if (trimmed.startsWith('host ')) {
        value = `${trimmed.slice(5).trim()}/32`;
      } else if (trimmed.startsWith('subnet ')) {
        const [network, mask] = trimmed.slice(7).trim().split(/\s+/);
        value = `${network}/${cidrFromMask(mask)}`;
      } else if (trimmed.startsWith('range ')) {
        type = 'ip-range';
        value = trimmed.slice(6).trim().replace(/\s+/, '-');
      } else if (trimmed.startsWith('fqdn ')) {
        type = 'fqdn';
        value = trimmed.slice(5).trim();
      } else if (trimmed.startsWith('description ')) {
        description = trimmed.slice('description '.length).trim();
      } else if (trimmed.startsWith('nat ')) {
        this.parseObjectNat(name, trimmed, index + 1);
      } else {
        exceptions.push(
          this.exception(
            'unsupported_construct',
            'unsupported',
            'low',
            'address',
            `Unsupported network object attribute: ${trimmed}`,
            'Review the source object and update it manually after migration.',
            trimmed
          )
        );
      }

      index += 1;
    }

    if (!value) {
      exceptions.push(
        this.exception(
          'missing_value',
          'lossiness',
          'medium',
          'address',
          `Address object ${name} has no concrete value.`,
          'Populate the object manually in PAN-OS before cutover.'
        )
      );
      value = '0.0.0.0/0';
    }

    this.pushAddress({
      ...this.entityBase(name, startIndex + 1, index, exceptions),
      type,
      value,
      description,
      exceptions,
      fingerprint: fingerprint([name, type, value]),
    });

    return index - 1;
  }

  private parseNetworkGroup(startIndex: number) {
    const header = this.lines[startIndex].trim();
    const name = this.uniqueName(header.slice('object-group network '.length).trim());
    const members: { ref: string; kind: 'address' | 'address-group'; originalName: string }[] = [];
    const exceptions = [];
    let description = '';
    let index = startIndex + 1;

    while (index < this.lines.length) {
      const line = this.lines[index];
      const trimmed = line.trim();

      if (!trimmed || trimmed === '!' || (/^[a-z]/i.test(trimmed) && !line.startsWith(' '))) {
        break;
      }

      if (trimmed.startsWith('network-object object ')) {
        const ref = trimmed.slice('network-object object '.length).trim();
        members.push(this.reference('address', ref) as typeof members[0]);
      } else if (trimmed.startsWith('group-object ')) {
        const ref = trimmed.slice('group-object '.length).trim();
        members.push(this.reference('address-group', ref) as typeof members[0]);
      } else if (trimmed.startsWith('network-object host ')) {
        const host = trimmed.slice('network-object host '.length).trim();
        const hostName = this.uniqueName(`H-${host}`);
        this.pushAddress({
          ...this.entityBase(hostName, index + 1),
          type: 'ip-netmask',
          value: `${host}/32`,
          exceptions: [],
          fingerprint: fingerprint([hostName, host]),
        });
        members.push(this.reference('address', hostName) as typeof members[0]);
      } else if (trimmed.startsWith('network-object ')) {
        const [network, wildcard] = trimmed.slice('network-object '.length).trim().split(/\s+/);
        const inlineName = this.uniqueName(`NET-${network}`);
        this.pushAddress({
          ...this.entityBase(inlineName, index + 1),
          type: 'ip-netmask',
          value: `${network}/${cidrFromWildcard(wildcard)}`,
          exceptions: [],
          fingerprint: fingerprint([inlineName, network, wildcard]),
        });
        members.push(this.reference('address', inlineName) as typeof members[0]);
      } else if (trimmed.startsWith('description ')) {
        description = trimmed.slice('description '.length).trim();
      } else {
        exceptions.push(
          this.exception(
            'unsupported_construct',
            'unsupported',
            'low',
            'address-group',
            `Unsupported address group attribute: ${trimmed}`,
            'Review nested or special members manually after migration.',
            trimmed
          )
        );
      }

      index += 1;
    }

    this.pushAddressGroup({
      ...this.entityBase(name, startIndex + 1, index),
      members,
      nestedDepth: members.some((m) => m.kind === 'address-group') ? 2 : 1,
      description,
      exceptions:
        members.length > 0
          ? exceptions
          : [
              ...exceptions,
              this.exception(
                'empty_group',
                'lossiness',
                'medium',
                'address-group',
                `Address group ${name} has no members.`,
                'Populate the group manually or remove it if unused.'
              ),
            ],
      fingerprint: fingerprint([name, ...members.map((m) => m.ref)]),
    });

    return index - 1;
  }

  private parseService(startIndex: number) {
    const header = this.lines[startIndex].trim();
    const name = this.uniqueName(header.slice('object service '.length).trim());
    const exceptions = [];
    let protocol = 'tcp';
    let port = '';
    let sourcePort: string | undefined;
    let description = '';
    let index = startIndex + 1;

    while (index < this.lines.length) {
      const line = this.lines[index];
      const trimmed = line.trim();

      if (!trimmed || trimmed === '!' || (/^[a-z]/i.test(trimmed) && !line.startsWith(' '))) {
        break;
      }

      if (trimmed.startsWith('service tcp destination eq ')) {
        protocol = 'tcp';
        port = trimmed.slice('service tcp destination eq '.length).trim();
      } else if (trimmed.startsWith('service udp destination eq ')) {
        protocol = 'udp';
        port = trimmed.slice('service udp destination eq '.length).trim();
      } else if (trimmed.startsWith('service tcp destination range ')) {
        protocol = 'tcp';
        port = trimmed.slice('service tcp destination range '.length).trim().replace(/\s+/, '-');
      } else if (trimmed.startsWith('service udp destination range ')) {
        protocol = 'udp';
        port = trimmed.slice('service udp destination range '.length).trim().replace(/\s+/, '-');
      } else if (trimmed.startsWith('service tcp source range ')) {
        protocol = 'tcp';
        sourcePort = trimmed.slice('service tcp source range '.length).trim().replace(/\s+/, '-');
      } else if (trimmed.startsWith('service udp source range ')) {
        protocol = 'udp';
        sourcePort = trimmed.slice('service udp source range '.length).trim().replace(/\s+/, '-');
      } else if (trimmed.startsWith('service icmp ')) {
        protocol = 'icmp';
        port = trimmed.slice('service icmp '.length).trim();
      } else if (trimmed.startsWith('description ')) {
        description = trimmed.slice('description '.length).trim();
      } else {
        exceptions.push(
          this.exception(
            'unsupported_construct',
            'unsupported',
            'low',
            'service',
            `Unsupported service attribute: ${trimmed}`,
            'Review this service definition manually after migration.',
            trimmed
          )
        );
      }

      index += 1;
    }

    if (!port && protocol !== 'icmp') {
      exceptions.push(
        this.exception(
          'missing_port',
          'lossiness',
          'medium',
          'service',
          `Service ${name} has no destination port.`,
          'Set the required destination port or map it to application-default manually.'
        )
      );
    }

    this.pushService({
      ...this.entityBase(name, startIndex + 1, index, exceptions),
      protocol,
      port: port || '0',
      sourcePort,
      description,
      exceptions,
      fingerprint: fingerprint([name, protocol, port]),
    });

    return index - 1;
  }

  private parseServiceGroup(startIndex: number) {
    const header = this.lines[startIndex].trim();
    const name = this.uniqueName(header.split(/\s+/)[2] ?? 'service-group');
    const members: { ref: string; kind: 'service'; originalName: string }[] = [];
    const exceptions = [];
    let index = startIndex + 1;

    while (index < this.lines.length) {
      const line = this.lines[index];
      const trimmed = line.trim();

      if (!trimmed || trimmed === '!' || (/^[a-z]/i.test(trimmed) && !line.startsWith(' '))) {
        break;
      }

      if (trimmed.startsWith('port-object eq ')) {
        const port = trimmed.slice('port-object eq '.length).trim();
        const memberName = this.uniqueName(`S-tcp-${port}`);
        this.pushService({
          ...this.entityBase(memberName, index + 1),
          protocol: 'tcp',
          port,
          exceptions: [],
          fingerprint: fingerprint([memberName, 'tcp', port]),
        });
        members.push(this.reference('service', memberName) as typeof members[0]);
      } else if (trimmed.startsWith('group-object ')) {
        members.push(this.reference('service', trimmed.slice('group-object '.length).trim()) as typeof members[0]);
      } else if (trimmed.startsWith('service-object ')) {
        members.push(this.reference('service', trimmed.slice('service-object '.length).trim()) as typeof members[0]);
      } else {
        exceptions.push(
          this.exception(
            'unsupported_construct',
            'unsupported',
            'low',
            'service-group',
            `Unsupported service group attribute: ${trimmed}`,
            'Review this service-group member manually.',
            trimmed
          )
        );
      }

      index += 1;
    }

    this.pushServiceGroup({
      ...this.entityBase(name, startIndex + 1, index),
      members,
      nestedDepth: 1,
      exceptions,
      fingerprint: fingerprint([name, ...members.map((m) => m.ref)]),
    });

    return index - 1;
  }

  private parseAccessList(line: string, lineNumber: number, remark: string) {
    const parts = line.split(/\s+/);
    if (parts.length < 5) return;

    const aclName = parts[1];
    const action = parts[3] === 'permit' ? 'allow' : 'deny';
    const protocol = parts[4] || 'ip';
    let cursor = 5;
    const exceptions = [];
    const source = this.parseAclAddress(parts, cursor, lineNumber);
    cursor = source.nextIndex;
    const destination = this.parseAclAddress(parts, cursor, lineNumber);
    cursor = destination.nextIndex;
    let service = this.anySet();

    if (cursor < parts.length && parts[cursor] === 'eq') {
      const port = parts[cursor + 1];
      const serviceName = this.uniqueName(`S-${protocol}-${port}`);
      this.pushService({
        ...this.entityBase(serviceName, lineNumber),
        protocol,
        port,
        exceptions: [],
        fingerprint: fingerprint([serviceName, protocol, port]),
      });
      service = this.resolveLiteralMembers([serviceName], 'service');
    } else if (!['ip', 'object-group'].includes(protocol)) {
      service = this.resolveLiteralMembers([protocol], 'service');
      exceptions.push(
        this.exception(
          'application_guess',
          'lossiness',
          'low',
          'policy',
          `Protocol ${protocol} was carried as a service placeholder.`,
          'Map this rule to an explicit service or App-ID during review.'
        )
      );
    }

    const logEnd = parts.includes('log');

    this.pushPolicy({
      ...this.entityBase(`${aclName}-${this.ruleOrder + 1}`, lineNumber, lineNumber, exceptions, this.ruleOrder),
      order: this.ruleOrder,
      from: this.anySet(),
      to: this.anySet(),
      source: source.set,
      destination: destination.set,
      service,
      action,
      disabled: false,
      logging: { atStart: false, atEnd: logEnd },
      schedule: { refs: [], mode: 'always' },
      profiles: [],
      description: remark || aclName,
      exceptions,
      fingerprint: fingerprint([aclName, this.ruleOrder, action]),
    });

    this.ruleOrder += 1;
  }

  private parseAclAddress(parts: string[], index: number, lineNumber: number) {
    if (parts[index] === 'host' && parts[index + 1]) {
      const host = parts[index + 1];
      const name = this.uniqueName(`H-${host}`);
      this.pushAddress({
        ...this.entityBase(name, lineNumber),
        type: 'ip-netmask',
        value: `${host}/32`,
        exceptions: [],
        fingerprint: fingerprint([name, host]),
      });
      return { set: this.resolveLiteralMembers([name], 'address'), nextIndex: index + 2 };
    }

    if (parts[index] === 'object' || parts[index] === 'object-group') {
      return {
        set: this.resolveLiteralMembers([parts[index + 1]], parts[index] === 'object-group' ? 'address-group' : 'address'),
        nextIndex: index + 2,
      };
    }

    if (parts[index] === 'any' || parts[index] === 'any4') {
      return { set: this.anySet(), nextIndex: index + 1 };
    }

    if (parts[index] && /^\d/.test(parts[index]) && parts[index + 1] && /^\d/.test(parts[index + 1])) {
      const address = parts[index];
      const wildcard = parts[index + 1];
      const name = this.uniqueName(`NET-${address}`);
      this.pushAddress({
        ...this.entityBase(name, lineNumber),
        type: 'ip-netmask',
        value: `${address}/${cidrFromWildcard(wildcard)}`,
        exceptions: [],
        fingerprint: fingerprint([name, address, wildcard]),
      });
      return { set: this.resolveLiteralMembers([name], 'address'), nextIndex: index + 2 };
    }

    return { set: this.anySet(), nextIndex: index };
  }

  private parseNatRule(line: string, lineNumber: number) {
    const zoneMatch = line.match(/\(([^,]+),([^)]+)\)/);
    const originalPacket: {
      srcZone: string;
      dstZone: string;
      srcAddress?: string;
      dstAddress?: string;
    } = {
      srcZone: zoneMatch?.[1]?.trim() || 'any',
      dstZone: zoneMatch?.[2]?.trim() || 'any',
    };
    const translatedPacket: {
      srcAddress?: string;
      dstAddress?: string;
    } = {};
    const exceptions = [];
    let natType: 'static' | 'dynamic' | 'pat_interface' | 'unknown' | 'identity' = 'unknown';

    if (line.includes('source static')) {
      natType = 'static';
      const match = line.match(/source\s+static\s+(\S+)\s+(\S+)/);
      if (match) {
        originalPacket.srcAddress = match[1];
        translatedPacket.srcAddress = match[2];
        if (match[1] === match[2]) natType = 'identity';
      }
    } else if (line.includes('source dynamic') && line.includes('interface')) {
      natType = 'pat_interface';
      const match = line.match(/source\s+dynamic\s+(\S+)/);
      if (match) originalPacket.srcAddress = match[1];
      translatedPacket.srcAddress = 'interface';
    } else if (line.includes('source dynamic')) {
      natType = 'dynamic';
      const match = line.match(/source\s+dynamic\s+(\S+)\s+(\S+)/);
      if (match) {
        originalPacket.srcAddress = match[1];
        translatedPacket.srcAddress = match[2];
      }
    }

    const destinationMatch = line.match(/destination\s+static\s+(\S+)\s+(\S+)/);
    if (destinationMatch) {
      originalPacket.dstAddress = destinationMatch[1];
      translatedPacket.dstAddress = destinationMatch[2];
    }

    if (natType === 'unknown') {
      exceptions.push(
        this.exception(
          'unsupported_nat',
          'unsupported',
          'high',
          'nat-rule',
          `NAT rule could not be classified: ${line}`,
          'Rebuild this NAT rule manually in PAN-OS.',
          line
        )
      );
    }

    this.pushNatRule({
      ...this.entityBase(`nat-${this.ir.natRules.length + 1}`, lineNumber, lineNumber, exceptions, this.ir.natRules.length),
      order: this.ir.natRules.length,
      natType,
      originalPacket,
      translatedPacket,
      bidirectional: natType === 'identity',
      exceptions,
      fingerprint: fingerprint([natType, originalPacket.srcAddress, translatedPacket.srcAddress]),
    });
  }

  private parseObjectNat(objectName: string, line: string, lineNumber: number) {
    const zoneMatch = line.match(/\(([^,]+),([^)]+)\)/);
    const translatedMatch = line.match(/static\s+(\S+)/);
    const natType = line.includes('dynamic interface')
      ? 'pat_interface'
      : line.includes('dynamic ')
        ? 'dynamic'
        : translatedMatch?.[1] === objectName
          ? 'identity'
          : 'static';

    this.pushNatRule({
      ...this.entityBase(`obj-nat-${objectName}`, lineNumber, lineNumber, [], this.ir.natRules.length),
      order: this.ir.natRules.length,
      natType,
      originalPacket: {
        srcZone: zoneMatch?.[1]?.trim() || 'any',
        dstZone: zoneMatch?.[2]?.trim() || 'any',
        srcAddress: objectName,
      },
      translatedPacket: {
        srcAddress:
          natType === 'pat_interface'
            ? 'interface'
            : translatedMatch?.[1] || line.match(/dynamic\s+(\S+)/)?.[1] || 'any',
      },
      bidirectional: natType === 'identity',
      exceptions: [],
      fingerprint: fingerprint([natType, objectName]),
    });
  }

  private parseRoute(line: string, lineNumber: number) {
    const parts = line.split(/\s+/);
    if (parts.length < 5) return;

    this.pushStaticRoute({
      ...this.entityBase(`route-${this.ir.staticRoutes.length + 1}`, lineNumber),
      destination: `${parts[2]}/${cidrFromMask(parts[3])}`,
      nexthop: parts[4],
      interface: parts[1],
      metric: parts[5] || '1',
      exceptions: [],
      fingerprint: fingerprint([parts[2], parts[4]]),
    });
  }

  private parseVpnHint(line: string, lineNumber: number) {
    // Basic VPN object creation for crypto map / tunnel-group lines
    const name = this.uniqueName(`vpn-hint-${this.ir.vpns.length + 1}`);
    this.pushVpn({
      ...this.entityBase(name, lineNumber),
      type: 'ipsec',
      exceptions: [
        this.exception(
          'vpn_deferred',
          'unsupported',
          'medium',
          'vpn',
          `VPN configuration detected but deferred: ${line.slice(0, 100)}`,
          'VPN tunnel configuration requires manual migration.'
        ),
      ],
      fingerprint: fingerprint([name, line.slice(0, 60)]),
    });
  }
}
