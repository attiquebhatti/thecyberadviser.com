import { BaseParser } from '@/lib/unified-migrator/parsers/base';
import { ParseInput, VersionInfo, VersionProfile } from '@/lib/unified-migrator/types';
import { fingerprint } from '@/lib/unified-migrator/utils';

/**
 * FortiGate parser — handles FortiOS `config ... end` block structure.
 */
export class FortigateParser extends BaseParser {
  private ruleOrder = 0;

  constructor(input: ParseInput, version: VersionInfo, profile: VersionProfile) {
    super(input, 'fortigate', version, profile);
  }

  parse() {
    let index = 0;
    while (index < this.lines.length) {
      const line = this.lines[index].trim();

      if (line === 'config firewall address') {
        index = this.parseBlock(index + 1, (block, start) => this.parseAddress(block, start));
      } else if (line === 'config firewall addrgrp') {
        index = this.parseBlock(index + 1, (block, start) => this.parseAddressGroup(block, start));
      } else if (line === 'config firewall service custom') {
        index = this.parseBlock(index + 1, (block, start) => this.parseService(block, start));
      } else if (line === 'config firewall service group') {
        index = this.parseBlock(index + 1, (block, start) => this.parseServiceGroup(block, start));
      } else if (line === 'config firewall policy') {
        index = this.parseBlock(index + 1, (block, start) => this.parsePolicy(block, start));
      } else if (line === 'config firewall vip') {
        index = this.parseBlock(index + 1, (block, start) => this.parseVip(block, start));
      } else if (line === 'config firewall central-snat-map') {
        index = this.parseBlock(index + 1, (block, start) => this.parseCentralSnat(block, start));
      } else if (line === 'config system interface') {
        index = this.parseBlock(index + 1, (block, start) => this.parseInterface(block, start));
      } else if (line === 'config router static') {
        index = this.parseBlock(index + 1, (block, start) => this.parseStaticRoute(block, start));
      } else if (line === 'config system zone') {
        index = this.parseBlock(index + 1, (block, start) => this.parseZone(block, start));
      } else if (line.startsWith('config firewall schedule recurring') || line.startsWith('config firewall schedule onetime')) {
        index = this.parseBlock(index + 1, (block, start) => this.parseSchedule(block, start));
      } else if (line.startsWith('config vpn ipsec phase1-interface')) {
        index = this.parseBlock(index + 1, (block, start) => this.parseVpnPhase1(block, start));
      } else {
        if (line && !line.startsWith('#') && line !== 'end') {
          // Track lines outside known config blocks
          // Don't track common top-level directives
          if (!line.startsWith('config ') && !line.startsWith('set ') && !line.startsWith('next')) {
            this.trackUnrecognized(line, index + 1);
          }
        }
        index += 1;
      }
    }
    return this.buildResult();
  }

  // ── Block parser ──────────────────────────────────────────

  private parseBlock(
    startIndex: number,
    handler: (block: Map<string, string>, startLine: number) => void
  ): number {
    let index = startIndex;
    let editBlock: Map<string, string> | null = null;
    let editStart = startIndex;

    while (index < this.lines.length) {
      const raw = this.lines[index];
      const trimmed = raw.trim();

      if (trimmed === 'end') {
        if (editBlock) handler(editBlock, editStart);
        return index + 1;
      }

      if (trimmed.startsWith('edit ')) {
        if (editBlock) handler(editBlock, editStart);
        editBlock = new Map();
        editBlock.set('__name__', trimmed.slice(5).replace(/"/g, '').trim());
        editStart = index + 1;
      } else if (trimmed === 'next') {
        if (editBlock) handler(editBlock, editStart);
        editBlock = null;
      } else if (trimmed.startsWith('set ')) {
        if (editBlock) {
          const spaceIndex = trimmed.indexOf(' ', 4);
          if (spaceIndex > 0) {
            const key = trimmed.slice(4, spaceIndex);
            const value = trimmed.slice(spaceIndex + 1).replace(/^"|"$/g, '');
            editBlock.set(key, value);
          }
        }
      }

      index += 1;
    }

    if (editBlock) handler(editBlock, editStart);
    return index;
  }

  // ── Individual entity handlers ────────────────────────────

  private parseAddress(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'unnamed');
    const type = block.get('type') || 'ipmask';
    const exceptions = [];

    let addrType: 'ip-netmask' | 'ip-range' | 'fqdn' = 'ip-netmask';
    let value = '';

    if (type === 'ipmask' || type === 'subnet') {
      const subnet = block.get('subnet') || '';
      const [ip, mask] = subnet.split(/\s+/);
      value = ip ? `${ip}/${maskToCidr(mask || '255.255.255.255')}` : '0.0.0.0/0';
    } else if (type === 'iprange') {
      addrType = 'ip-range';
      value = `${block.get('start-ip') || '0.0.0.0'}-${block.get('end-ip') || '0.0.0.0'}`;
    } else if (type === 'fqdn') {
      addrType = 'fqdn';
      value = block.get('fqdn') || name;
    } else {
      exceptions.push(
        this.exception(
          'unsupported_addr_type',
          'unsupported',
          'medium',
          'address',
          `Address type ${type} is not fully supported.`,
          'Review this address object manually after migration.'
        )
      );
      value = '0.0.0.0/0';
    }

    this.pushAddress({
      ...this.entityBase(name, startLine, startLine, exceptions),
      type: addrType,
      value,
      description: block.get('comment'),
      exceptions,
      fingerprint: fingerprint([name, addrType, value]),
    });
  }

  private parseAddressGroup(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'unnamed');
    const memberStr = block.get('member') || '';
    const members = splitQuotedValues(memberStr).map((m) =>
      this.reference('address', m)
    );

    this.pushAddressGroup({
      ...this.entityBase(name, startLine),
      members,
      nestedDepth: 1,
      description: block.get('comment'),
      exceptions: [],
      fingerprint: fingerprint([name, ...members.map((m) => m.ref)]),
    });
  }

  private parseService(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'unnamed');
    const protocol = (block.get('protocol') || 'TCP/UDP/SCTP').toLowerCase();
    const tcpRange = block.get('tcp-portrange') || '';
    const udpRange = block.get('udp-portrange') || '';
    const port = tcpRange || udpRange || '0';
    const proto = tcpRange ? 'tcp' : udpRange ? 'udp' : protocol.includes('tcp') ? 'tcp' : 'udp';

    this.pushService({
      ...this.entityBase(name, startLine),
      protocol: proto,
      port: port.split(':')[0] || '0',
      sourcePort: port.includes(':') ? port.split(':')[1] : undefined,
      description: block.get('comment'),
      exceptions: [],
      fingerprint: fingerprint([name, proto, port]),
    });
  }

  private parseServiceGroup(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'unnamed');
    const memberStr = block.get('member') || '';
    const members = splitQuotedValues(memberStr).map((m) =>
      this.reference('service', m)
    );

    this.pushServiceGroup({
      ...this.entityBase(name, startLine),
      members,
      nestedDepth: 1,
      exceptions: [],
      fingerprint: fingerprint([name, ...members.map((m) => m.ref)]),
    });
  }

  private parsePolicy(block: Map<string, string>, startLine: number) {
    const id = block.get('__name__') || String(this.ruleOrder + 1);
    const name = this.uniqueName(`fg-policy-${id}`);
    const srcIntf = splitQuotedValues(block.get('srcintf'));
    const dstIntf = splitQuotedValues(block.get('dstintf'));
    const srcAddr = splitQuotedValues(block.get('srcaddr'));
    const dstAddr = splitQuotedValues(block.get('dstaddr'));
    const service = splitQuotedValues(block.get('service'));
    const action = (block.get('action') || 'deny').toLowerCase() === 'accept' ? 'allow' : 'deny';
    const logtraffic = block.get('logtraffic') || 'utm';

    this.pushPolicy({
      ...this.entityBase(name, startLine, startLine, [], this.ruleOrder),
      order: this.ruleOrder,
      from: this.resolveLiteralMembers(srcIntf, 'zone'),
      to: this.resolveLiteralMembers(dstIntf, 'zone'),
      source: this.resolveLiteralMembers(srcAddr, 'address'),
      destination: this.resolveLiteralMembers(dstAddr, 'address'),
      service: this.resolveLiteralMembers(service, 'service'),
      action,
      disabled: block.get('status') === 'disable',
      logging: {
        atStart: logtraffic === 'all',
        atEnd: logtraffic !== 'disable',
        profile: block.get('logtraffic-start') === 'enable' ? 'all' : undefined,
      },
      schedule: {
        refs: block.get('schedule') ? [block.get('schedule')!] : [],
        mode: block.get('schedule') && block.get('schedule') !== 'always' ? 'named' : 'always',
      },
      profiles: [],
      description: block.get('comments'),
      exceptions: [],
      fingerprint: fingerprint([name, this.ruleOrder, action]),
    });
    this.ruleOrder += 1;

    const natEnabled = block.get('nat') === 'enable';
    if (natEnabled) {
      const natName = this.uniqueName(`policy-nat-${id}`);
      const pool = block.get('ippool') === 'enable' ? block.get('poolname') : 'interface';
      this.pushNatRule({
        ...this.entityBase(natName, startLine, startLine, [], this.ir.natRules.length),
        order: this.ir.natRules.length,
        natType: pool === 'interface' ? 'pat_interface' : 'dynamic',
        originalPacket: {
          srcZone: srcIntf[0] || 'any',
          dstZone: dstIntf[0] || 'any',
          srcAddress: srcAddr.join(',') || 'all',
          dstAddress: dstAddr.join(',') || 'all',
        },
        translatedPacket: {
          srcAddress: pool?.replace(/"/g, ''),
        },
        bidirectional: false,
        exceptions: [],
        fingerprint: fingerprint([natName, srcAddr.join(','), dstAddr.join(','), pool || 'interface']),
      });
    }
  }

  private parseVip(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'vip');
    const extIp = block.get('extip') || '';
    const mappedIp = block.get('mappedip') || '';
    const natType = block.get('type') === 'static-nat' ? 'static' as const : 'pat' as const;

    this.pushNatRule({
      ...this.entityBase(name, startLine, startLine, [], this.ir.natRules.length),
      order: this.ir.natRules.length,
      natType,
      originalPacket: {
        dstAddress: extIp.split('-')[0] || 'any',
      },
      translatedPacket: {
        dstAddress: mappedIp.replace(/"/g, '').split('-')[0] || 'any',
      },
      bidirectional: false,
      exceptions: [],
      fingerprint: fingerprint([name, natType, extIp, mappedIp]),
    });
  }

  private parseCentralSnat(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(`central-snat-${block.get('__name__') || this.ir.natRules.length + 1}`);
    const srcAddr = block.get('orig-addr') || 'any';
    const dstAddr = block.get('dst-addr') || 'any';
    const translatedAddr = block.get('nat-ippool') || 'interface';

    this.pushNatRule({
      ...this.entityBase(name, startLine, startLine, [], this.ir.natRules.length),
      order: this.ir.natRules.length,
      natType: translatedAddr === 'interface' ? 'pat_interface' : 'dynamic',
      originalPacket: {
        srcZone: block.get('srcintf')?.replace(/"/g, ''),
        dstZone: block.get('dstintf')?.replace(/"/g, ''),
        srcAddress: srcAddr.replace(/"/g, ''),
        dstAddress: dstAddr.replace(/"/g, ''),
      },
      translatedPacket: {
        srcAddress: translatedAddr.replace(/"/g, ''),
      },
      bidirectional: false,
      exceptions: [],
      fingerprint: fingerprint([name, srcAddr, dstAddr, translatedAddr]),
    });
  }

  private parseInterface(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'unknown');
    const ip = block.get('ip') || undefined;
    const zone = block.get('zone') || undefined;

    this.pushInterface({
      ...this.entityBase(name, startLine),
      type: 'layer3',
      ip,
      zone,
      exceptions: [],
      fingerprint: fingerprint([name, ip, zone]),
    });

    // Auto-create zone from interface's zone field
    if (zone) {
      const existing = this.ir.zones.find((z) => z.name === zone);
      if (!existing) {
        this.pushZone({
          ...this.entityBase(zone, startLine),
          type: 'layer3',
          interfaces: [this.reference('interface', name)],
          exceptions: [],
          fingerprint: fingerprint([zone, name]),
        });
      } else {
        existing.interfaces.push(this.reference('interface', name));
      }
    }
  }

  private parseStaticRoute(block: Map<string, string>, startLine: number) {
    const id = block.get('__name__') || String(this.ir.staticRoutes.length + 1);
    const name = this.uniqueName(`route-${id}`);
    const dst = block.get('dst') || '0.0.0.0 0.0.0.0';
    const [ip, mask] = dst.split(/\s+/);
    const destination = `${ip}/${maskToCidr(mask || '0.0.0.0')}`;
    const gateway = block.get('gateway') || '0.0.0.0';

    this.pushStaticRoute({
      ...this.entityBase(name, startLine),
      destination,
      nexthop: gateway,
      interface: block.get('device')?.replace(/"/g, ''),
      metric: block.get('distance'),
      exceptions: [],
      fingerprint: fingerprint([name, destination, gateway]),
    });
  }

  private parseZone(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'unknown');
    const memberStr = block.get('interface') || '';
    const interfaces = splitQuotedValues(memberStr).map((m) =>
      this.reference('interface', m)
    );

    // Don't duplicate zones already created by interfaces
    const existing = this.ir.zones.find((z) => z.name === name);
    if (existing) {
      interfaces.forEach((iface) => {
        if (!existing.interfaces.find((ei) => ei.ref === iface.ref)) {
          existing.interfaces.push(iface);
        }
      });
      return;
    }

    this.pushZone({
      ...this.entityBase(name, startLine),
      type: 'layer3',
      interfaces,
      exceptions: [],
      fingerprint: fingerprint([name, ...interfaces.map((i) => i.ref)]),
    });
  }

  private parseSchedule(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'schedule');
    this.pushSchedule({
      ...this.entityBase(name, startLine),
      mode: block.get('end-date') ? 'once' : 'recurring',
      rawDefinition: [...block.entries()]
        .filter(([k]) => k !== '__name__')
        .map(([k, v]) => `${k} ${v}`)
        .join('; '),
      startTime: block.get('start-time'),
      endTime: block.get('end-time'),
      daysOfWeek: block.get('day')?.split(/\s+/),
      exceptions: [],
      fingerprint: fingerprint([name]),
    });
  }

  private parseVpnPhase1(block: Map<string, string>, startLine: number) {
    const name = this.uniqueName(block.get('__name__') || 'vpn');
    this.pushVpn({
      ...this.entityBase(name, startLine),
      type: 'ipsec',
      peer: block.get('remote-gw'),
      ikeVersion: block.get('ike-version') === '2' ? 'ikev2' : 'ikev1',
      tunnelInterface: block.get('interface')?.replace(/"/g, ''),
      peerAddress: block.get('remote-gw'),
      ikeProposal: block.get('proposal'),
      exceptions: [],
      fingerprint: fingerprint([name, block.get('remote-gw')]),
    });
  }
}

// ── Helpers ────────────────────────────────────────────────────

function splitQuotedValues(value?: string): string[] {
  if (!value) return [];
  return [...value.matchAll(/"([^"]+)"|(\S+)/g)].map(
    (match) => match[1] || match[2]
  );
}

function maskToCidr(mask: string): string {
  const octets = mask.split('.');
  if (octets.length !== 4) return '32';
  return String(
    octets.reduce((total, octet) => {
      const bits = Number.parseInt(octet, 10).toString(2);
      return total + bits.split('').filter((v) => v === '1').length;
    }, 0)
  );
}
