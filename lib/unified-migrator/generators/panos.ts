import {
  GeneratedArtifact,
  GeneratorAdapter,
  GeneratorOptions,
  MigrationIR,
} from '@/lib/unified-migrator/types';
import { escapeXml } from '@/lib/unified-migrator/utils';

export class PanosGenerator implements GeneratorAdapter {
  generate(ir: MigrationIR, options: GeneratorOptions): GeneratedArtifact[] {
    const xml = this.buildXml(ir);
    const cli = this.buildCli(ir);

    return [
      {
        id: 'panos-xml',
        label: 'PAN-OS XML Config',
        mimeType: 'application/xml',
        fileName: 'panos-config.xml',
        content: xml,
      },
      {
        id: 'panos-cli',
        label: 'PAN-OS CLI Commands',
        mimeType: 'text/plain',
        fileName: 'panos-set-commands.txt',
        content: cli,
      },
    ];
  }

  private buildXml(ir: MigrationIR): string {
    const parts: string[] = ['<?xml version="1.0"?>', '<config version="10.1.0" urldb="paloaltonetworks">'];

    // ── Addresses ──
    if (ir.addresses.length) {
      parts.push('  <shared>');
      parts.push('    <address>');
      ir.addresses.forEach((addr) => {
        const tag = addr.type;
        parts.push(
          `      <entry name="${escapeXml(addr.name)}">`,
          `        <${tag}>${escapeXml(addr.value)}</${tag}>`,
          addr.description ? `        <description>${escapeXml(addr.description)}</description>` : '',
          '      </entry>'
        );
      });
      parts.push('    </address>');

      // ── Address Groups ──
      if (ir.addressGroups.length) {
        parts.push('    <address-group>');
        ir.addressGroups.forEach((group) => {
          parts.push(`      <entry name="${escapeXml(group.name)}">`);
          parts.push('        <static>');
          group.members.forEach((m) => {
            parts.push(`          <member>${escapeXml(m.originalName)}</member>`);
          });
          parts.push('        </static>');
          parts.push('      </entry>');
        });
        parts.push('    </address-group>');
      }

      // ── Services ──
      if (ir.services.length) {
        parts.push('    <service>');
        ir.services.forEach((svc) => {
          parts.push(
            `      <entry name="${escapeXml(svc.name)}">`,
            '        <protocol>',
            `          <${svc.protocol}>`,
            `            <port>${escapeXml(svc.port)}</port>`,
            svc.sourcePort ? `            <source-port>${escapeXml(svc.sourcePort)}</source-port>` : '',
            `          </${svc.protocol}>`,
            '        </protocol>',
            '      </entry>'
          );
        });
        parts.push('    </service>');
      }

      // ── Service Groups ──
      if (ir.serviceGroups.length) {
        parts.push('    <service-group>');
        ir.serviceGroups.forEach((group) => {
          parts.push(`      <entry name="${escapeXml(group.name)}">`);
          parts.push('        <members>');
          group.members.forEach((m) => {
            parts.push(`          <member>${escapeXml(m.originalName)}</member>`);
          });
          parts.push('        </members>');
          parts.push('      </entry>');
        });
        parts.push('    </service-group>');
      }

      parts.push('  </shared>');
    }

    // ── Zones ──
    if (ir.zones.length) {
      parts.push('  <devices><entry name="localhost.localdomain"><vsys><entry name="vsys1">');
      parts.push('    <zone>');
      ir.zones.forEach((zone) => {
        parts.push(`      <entry name="${escapeXml(zone.name)}">`);
        parts.push('        <network>');
        parts.push(`          <${zone.type}>`);
        zone.interfaces.forEach((iface) => {
          parts.push(`            <member>${escapeXml(iface.originalName)}</member>`);
        });
        parts.push(`          </${zone.type}>`);
        parts.push('        </network>');
        parts.push('      </entry>');
      });
      parts.push('    </zone>');

      // ── Security Policies ──
      if (ir.policies.length) {
        parts.push('    <rulebase><security><rules>');
        ir.policies.forEach((policy) => {
          parts.push(`      <entry name="${escapeXml(policy.name)}">`);
          parts.push(memberListXml('from', policy.from));
          parts.push(memberListXml('to', policy.to));
          parts.push(memberListXml('source', policy.source));
          parts.push(memberListXml('destination', policy.destination));
          parts.push(memberListXml('service', policy.service));
          parts.push('        <application><member>any</member></application>');
          parts.push(`        <action>${policy.action === 'allow' ? 'allow' : 'deny'}</action>`);
          if (policy.disabled) parts.push('        <disabled>yes</disabled>');
          if (policy.logging.atStart) parts.push('        <log-start>yes</log-start>');
          if (policy.logging.atEnd) parts.push('        <log-end>yes</log-end>');
          if (policy.description) {
            parts.push(`        <description>${escapeXml(policy.description)}</description>`);
          }
          parts.push('      </entry>');
        });
        parts.push('    </rules></security></rulebase>');
      }

      // ── NAT Rules ──
      if (ir.natRules.length) {
        parts.push('    <rulebase><nat><rules>');
        ir.natRules.forEach((rule) => {
          parts.push(`      <entry name="${escapeXml(rule.name)}">`);
          parts.push(
            buildNatOriginalPacket(rule.originalPacket),
            `        <source-translation>${buildSourceTranslation(rule.natType, rule.translatedPacket.srcAddress)}</source-translation>`,
            rule.bidirectional ? '        <bi-directional>yes</bi-directional>' : '',
            '      </entry>'
          );
        });
        parts.push('    </rules></nat></rulebase>');
      }

      parts.push('  </entry></vsys></entry></devices>');
    }

    // ── Static Routes ──
    if (ir.staticRoutes.length) {
      parts.push('  <devices><entry name="localhost.localdomain"><network><virtual-router><entry name="default">');
      parts.push('    <routing-table><ip><static-route>');
      ir.staticRoutes.forEach((route) => {
        parts.push(
          `      <entry name="${escapeXml(route.name)}">`,
          `        <destination>${escapeXml(route.destination)}</destination>`,
          '        <nexthop>',
          `          <ip-address>${escapeXml(route.nexthop)}</ip-address>`,
          '        </nexthop>',
          route.interface ? `        <interface>${escapeXml(route.interface)}</interface>` : '',
          route.metric ? `        <metric>${route.metric}</metric>` : '',
          '      </entry>'
        );
      });
      parts.push('    </static-route></ip></routing-table>');
      parts.push('  </entry></virtual-router></network></entry></devices>');
    }

    parts.push('</config>');
    return parts.filter(Boolean).join('\n');
  }

  private buildCli(ir: MigrationIR): string {
    const cmds: string[] = [];

    ir.addresses.forEach((addr) => {
      cmds.push(`set address "${addr.name}" ${addr.type} ${addr.value}`);
    });

    ir.addressGroups.forEach((group) => {
      group.members.forEach((m) => {
        cmds.push(`set address-group "${group.name}" static "${m.originalName}"`);
      });
    });

    ir.services.forEach((svc) => {
      cmds.push(
        `set service "${svc.name}" protocol ${svc.protocol} port ${svc.port}`
      );
    });

    ir.serviceGroups.forEach((group) => {
      group.members.forEach((m) => {
        cmds.push(`set service-group "${group.name}" members "${m.originalName}"`);
      });
    });

    ir.zones.forEach((zone) => {
      zone.interfaces.forEach((iface) => {
        cmds.push(`set zone "${zone.name}" network ${zone.type} "${iface.originalName}"`);
      });
    });

    ir.policies.forEach((policy) => {
      const prefix = `set rulebase security rules "${policy.name}"`;
      const fromNames = policy.from.includesAny ? ['any'] : policy.from.refs.map((r) => r.originalName);
      const toNames = policy.to.includesAny ? ['any'] : policy.to.refs.map((r) => r.originalName);
      const srcNames = policy.source.includesAny ? ['any'] : policy.source.refs.map((r) => r.originalName);
      const dstNames = policy.destination.includesAny ? ['any'] : policy.destination.refs.map((r) => r.originalName);
      const svcNames = policy.service.includesAny ? ['any'] : policy.service.refs.map((r) => r.originalName);
      fromNames.forEach((z) => cmds.push(`${prefix} from "${z}"`));
      toNames.forEach((z) => cmds.push(`${prefix} to "${z}"`));
      srcNames.forEach((s) => cmds.push(`${prefix} source "${s}"`));
      dstNames.forEach((d) => cmds.push(`${prefix} destination "${d}"`));
      svcNames.forEach((s) => cmds.push(`${prefix} service "${s}"`));
      cmds.push(`${prefix} application any`);
      cmds.push(`${prefix} action ${policy.action}`);
      if (policy.logging.atEnd) cmds.push(`${prefix} log-end yes`);
    });

    ir.natRules.forEach((rule) => {
      const prefix = `set rulebase nat rules "${rule.name}"`;
      if (rule.originalPacket.srcZone) cmds.push(`${prefix} from "${rule.originalPacket.srcZone}"`);
      if (rule.originalPacket.dstZone) cmds.push(`${prefix} to "${rule.originalPacket.dstZone}"`);
      if (rule.originalPacket.srcAddress) cmds.push(`${prefix} source "${rule.originalPacket.srcAddress}"`);
      if (rule.originalPacket.dstAddress) cmds.push(`${prefix} destination "${rule.originalPacket.dstAddress}"`);
      if (rule.translatedPacket.srcAddress) {
        cmds.push(`${prefix} source-translation translated-address "${rule.translatedPacket.srcAddress}"`);
      }
    });

    ir.staticRoutes.forEach((route) => {
      cmds.push(
        `set network virtual-router default routing-table ip static-route "${route.name}" destination ${route.destination} nexthop ip-address ${route.nexthop}`
      );
    });

    return cmds.join('\n');
  }
}

// ── Helpers ────────────────────────────────────────────────────

function memberListXml(tag: string, set: { refs: Array<{ originalName: string }>; includesAny: boolean }) {
  const members = set.includesAny
    ? '<member>any</member>'
    : set.refs.map((r) => `<member>${escapeXml(r.originalName)}</member>`).join('');
  return `        <${tag}>${members}</${tag}>`;
}

function buildNatOriginalPacket(packet: { srcZone?: string; dstZone?: string; srcAddress?: string; dstAddress?: string }) {
  const parts: string[] = [];
  if (packet.srcZone) parts.push(`        <from><member>${escapeXml(packet.srcZone)}</member></from>`);
  if (packet.dstZone) parts.push(`        <to><member>${escapeXml(packet.dstZone)}</member></to>`);
  if (packet.srcAddress) parts.push(`        <source><member>${escapeXml(packet.srcAddress)}</member></source>`);
  if (packet.dstAddress) parts.push(`        <destination><member>${escapeXml(packet.dstAddress)}</member></destination>`);
  return parts.join('\n');
}

function buildSourceTranslation(type: string, translatedAddress?: string) {
  if (!translatedAddress) {
    return '<dynamic-ip-and-port><interface-address><interface>any</interface></interface-address></dynamic-ip-and-port>';
  }
  if (type === 'static' || type === 'identity' || type === 'static_pat') {
    return `<static-ip><translated-address>${escapeXml(translatedAddress)}</translated-address></static-ip>`;
  }
  if (translatedAddress === 'interface') {
    return '<dynamic-ip-and-port><interface-address><interface>any</interface></interface-address></dynamic-ip-and-port>';
  }
  return `<dynamic-ip-and-port><translated-address><member>${escapeXml(translatedAddress)}</member></translated-address></dynamic-ip-and-port>`;
}

import type { RuleEndpointSet } from '@/lib/unified-migrator/types';
