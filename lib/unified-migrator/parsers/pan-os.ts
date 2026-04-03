import { BaseParser } from '@/lib/unified-migrator/parsers/base';
import { ParseInput, VersionInfo, VersionProfile } from '@/lib/unified-migrator/types';
import { canonicalName, fingerprint } from '@/lib/unified-migrator/utils';

export class PanosParser extends BaseParser {
  constructor(input: ParseInput, version: VersionInfo, profile: VersionProfile) {
    super(input, 'pan-os', version, profile);
  }

  parse() {
    const xml = this.input.content;
    this.parseAddresses(xml);
    this.parseAddressGroups(xml);
    this.parseServices(xml);
    this.parseServiceGroups(xml);
    this.parseZones(xml);
    this.parsePolicies(xml);
    this.parseNatRules(xml);
    this.parseStaticRoutes(xml);
    return this.buildResult();
  }

  private parseAddresses(xml: string) {
    for (const match of xml.matchAll(/<address>[\s\S]*?<entry name="([^"]+)">[\s\S]*?<(ip-netmask|ip-range|fqdn)>([^<]+)<\/\2>[\s\S]*?<\/entry>/g)) {
      const [, name, type, value] = match;
      this.pushAddress({
        ...this.entityBase(name, 1),
        type: type as 'ip-netmask' | 'ip-range' | 'fqdn',
        value,
        exceptions: [],
        fingerprint: fingerprint([name, type, value]),
      });
    }
  }

  private parseAddressGroups(xml: string) {
    for (const match of xml.matchAll(/<address-group>[\s\S]*?<entry name="([^"]+)">[\s\S]*?<static>([\s\S]*?)<\/static>[\s\S]*?<\/entry>/g)) {
      const [, name, membersXml] = match;
      const members = Array.from(membersXml.matchAll(/<member>([^<]+)<\/member>/g), (member) =>
        this.reference('address', member[1], canonicalName(member[1]))
      );
      this.pushAddressGroup({
        ...this.entityBase(name, 1),
        members,
        nestedDepth: 1,
        exceptions: [],
        fingerprint: fingerprint([name, ...members.map((member) => member.ref)]),
      });
    }
  }

  private parseServices(xml: string) {
    for (const match of xml.matchAll(/<service>[\s\S]*?<entry name="([^"]+)">[\s\S]*?<protocol><(tcp|udp)><port>([^<]+)<\/port><\/\2><\/protocol>[\s\S]*?<\/entry>/g)) {
      const [, name, protocol, port] = match;
      this.pushService({
        ...this.entityBase(name, 1),
        protocol,
        port,
        exceptions: [],
        fingerprint: fingerprint([name, protocol, port]),
      });
    }
  }

  private parseServiceGroups(xml: string) {
    for (const match of xml.matchAll(/<service-group>[\s\S]*?<entry name="([^"]+)">[\s\S]*?<members>([\s\S]*?)<\/members>[\s\S]*?<\/entry>/g)) {
      const [, name, membersXml] = match;
      const members = Array.from(membersXml.matchAll(/<member>([^<]+)<\/member>/g), (member) =>
        this.reference('service', member[1], canonicalName(member[1]))
      );
      this.pushServiceGroup({
        ...this.entityBase(name, 1),
        members,
        nestedDepth: 1,
        exceptions: [],
        fingerprint: fingerprint([name, ...members.map((member) => member.ref)]),
      });
    }
  }

  private parseZones(xml: string) {
    for (const match of xml.matchAll(/<zone>[\s\S]*?<entry name="([^"]+)">[\s\S]*?<layer3>([\s\S]*?)<\/layer3>[\s\S]*?<\/entry>/g)) {
      const [, name, membersXml] = match;
      const interfaces = Array.from(membersXml.matchAll(/<member>([^<]+)<\/member>/g), (member) =>
        this.reference('interface', member[1], canonicalName(member[1]))
      );
      this.pushZone({
        ...this.entityBase(name, 1),
        type: 'layer3',
        interfaces,
        exceptions: [],
        fingerprint: fingerprint([name, ...interfaces.map((item) => item.ref)]),
      });
    }
  }

  private parsePolicies(xml: string) {
    let order = 0;
    for (const match of xml.matchAll(/<rules>[\s\S]*?<entry name="([^"]+)">([\s\S]*?)<\/entry>/g)) {
      const [, name, body] = match;
      const zoneMembers = (tag: string) =>
        Array.from(body.matchAll(new RegExp(`<${tag}>[\\s\\S]*?<member>([^<]+)<\\/member>[\\s\\S]*?<\\/${tag}>`, 'g')), (member) =>
          member[1]
        );
      const refsFor = (tag: string, kind: 'address' | 'service' | 'interface') => {
        const section = body.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || '';
        const values = Array.from(section.matchAll(/<member>([^<]+)<\/member>/g), (member) => member[1]);
        return values.length === 0 || values.includes('any')
          ? this.anySet()
          : this.resolveLiteralMembers(values, kind);
      };
      this.pushPolicy({
        ...this.entityBase(name, 1, 1, [], order),
        order,
        from: refsFor('from', 'interface'),
        to: refsFor('to', 'interface'),
        source: refsFor('source', 'address'),
        destination: refsFor('destination', 'address'),
        service: refsFor('service', 'service'),
        action: body.includes('<action>deny</action>') ? 'deny' : 'allow',
        disabled: body.includes('<disabled>yes</disabled>'),
        logging: {
          atStart: body.includes('<log-start>yes</log-start>'),
          atEnd: body.includes('<log-end>yes</log-end>'),
        },
        schedule: { refs: [], mode: 'always' },
        profiles: [],
        exceptions: zoneMembers('application').length > 0 ? [] : [],
        fingerprint: fingerprint([name, order]),
      });
      order += 1;
    }
  }

  private parseNatRules(xml: string) {
    let order = 0;
    for (const match of xml.matchAll(/<nat>[\s\S]*?<entry name="([^"]+)">([\s\S]*?)<\/entry>/g)) {
      const [, name, body] = match;
      const getValue = (tag: string) => body.match(new RegExp(`<${tag}>([^<]+)<\\/${tag}>`))?.[1];
      const getMember = (tag: string) =>
        body.match(new RegExp(`<${tag}>[\\s\\S]*?<member>([^<]+)<\\/member>[\\s\\S]*?<\\/${tag}>`))?.[1];
      let natType: 'static' | 'dynamic' | 'pat_interface' | 'identity' | 'hairpin' | 'unknown' = 'unknown';
      if (body.includes('<static-ip>')) natType = 'static';
      else if (body.includes('<interface-address>')) natType = 'pat_interface';
      else if (body.includes('<dynamic-ip-and-port>')) natType = 'dynamic';
      if (getMember('from') === getMember('to')) natType = 'hairpin';

      this.pushNatRule({
        ...this.entityBase(name, 1, 1, natType === 'unknown' ? [
          this.exception(
            'unknown_panos_nat',
            'unsupported',
            'medium',
            'pan-os nat rule',
            `Could not classify PAN-OS NAT rule ${name}.`,
            'Review the NAT rule manually.'
          ),
        ] : [], order),
        order,
        natType,
        originalPacket: {
          srcZone: getMember('from'),
          dstZone: getMember('to'),
          srcAddress: getMember('source'),
          dstAddress: getMember('destination'),
        },
        translatedPacket: {
          srcAddress: getValue('translated-address'),
        },
        bidirectional: body.includes('<bi-directional>yes</bi-directional>'),
        exceptions: natType === 'unknown' ? [
          this.exception(
            'unknown_panos_nat',
            'unsupported',
            'medium',
            'pan-os nat rule',
            `Could not classify PAN-OS NAT rule ${name}.`,
            'Review the NAT rule manually.'
          ),
        ] : [],
        fingerprint: fingerprint([name, natType]),
      });
      order += 1;
    }
  }

  private parseStaticRoutes(xml: string) {
    for (const match of xml.matchAll(/<static-route>[\s\S]*?<entry name="([^"]+)">[\s\S]*?<destination>([^<]+)<\/destination>[\s\S]*?<ip-address>([^<]+)<\/ip-address>[\s\S]*?(?:<metric>([^<]+)<\/metric>)?[\s\S]*?<\/entry>/g)) {
      const [, name, destination, nexthop, metric] = match;
      this.pushStaticRoute({
        ...this.entityBase(name, 1),
        destination,
        nexthop,
        metric,
        exceptions: [],
        fingerprint: fingerprint([name, destination, nexthop, metric]),
      });
    }
  }
}
