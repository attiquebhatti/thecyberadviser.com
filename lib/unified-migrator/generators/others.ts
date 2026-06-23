// ────────────────────────────────────────────────────────────────
// Best-effort target generators: FortiGate, Cisco ASA, Check Point,
// Prisma Access. Each takes the vendor-neutral MigrationIR and emits
// that vendor's configuration for the core constructs (addresses,
// groups, services, security policies, NAT, tags, interfaces) plus a
// coverage report. Consistent with the existing heuristic converters —
// strong starting points, not guaranteed line-for-line importable.
// ────────────────────────────────────────────────────────────────

import type {
  GeneratedArtifact,
  GeneratorAdapter,
  GeneratorOptions,
  MigrationIR,
  RuleEndpointSet,
} from '@/lib/unified-migrator/types';

// ── shared helpers ──────────────────────────────────────────────

const names = (set: RuleEndpointSet): string[] =>
  set.includesAny || set.refs.length === 0 ? ['any'] : set.refs.map((r) => r.originalName);

function cidrToMask(cidr: string): { ip: string; mask: string } {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr ?? '32', 10);
  if (isNaN(prefix)) return { ip, mask: '255.255.255.255' };
  const maskNum = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const mask = [24, 16, 8, 0].map((s) => (maskNum >> s) & 0xff).join('.');
  return { ip, mask };
}

function reportArtifact(ir: MigrationIR, target: string): GeneratedArtifact {
  const summary = {
    target,
    generatedAt: new Date().toISOString(),
    counts: {
      addresses: ir.addresses.length,
      addressGroups: ir.addressGroups.length,
      services: ir.services.length,
      serviceGroups: ir.serviceGroups.length,
      tags: ir.tags.length,
      policies: ir.policies.length,
      natRules: ir.natRules.length,
      interfaces: ir.interfaces.length,
      zones: ir.zones.length,
    },
    note: 'Best-effort conversion. Review advanced features (security profiles, VPN, dynamic routing) manually before import.',
  };
  return {
    id: 'report-json',
    label: 'Migration Report',
    mimeType: 'application/json',
    fileName: `${target}-migration-report.json`,
    content: JSON.stringify(summary, null, 2),
  };
}

// ── FortiGate ───────────────────────────────────────────────────

export class FortigateGenerator implements GeneratorAdapter {
  generate(ir: MigrationIR): GeneratedArtifact[] {
    const c: string[] = [];
    if (ir.addresses.length) {
      c.push('config firewall address');
      for (const a of ir.addresses) {
        c.push(`  edit "${a.name}"`);
        if (a.type === 'fqdn') { c.push('    set type fqdn'); c.push(`    set fqdn "${a.value}"`); }
        else if (a.type === 'ip-range') { const [s, e] = a.value.split('-'); c.push('    set type iprange'); c.push(`    set start-ip ${s}`); c.push(`    set end-ip ${e || s}`); }
        else { const { ip, mask } = cidrToMask(a.value); c.push(`    set subnet ${ip} ${mask}`); }
        c.push('  next');
      }
      c.push('end');
    }
    if (ir.addressGroups.length) {
      c.push('config firewall addrgrp');
      for (const g of ir.addressGroups) {
        c.push(`  edit "${g.name}"`);
        c.push(`    set member ${g.members.map((m) => `"${m.originalName}"`).join(' ') || '"none"'}`);
        c.push('  next');
      }
      c.push('end');
    }
    if (ir.services.length) {
      c.push('config firewall service custom');
      for (const s of ir.services) {
        c.push(`  edit "${s.name}"`);
        if (s.protocol === 'tcp' || s.protocol === 'udp') c.push(`    set ${s.protocol}-portrange ${s.port}`);
        c.push('  next');
      }
      c.push('end');
    }
    if (ir.serviceGroups.length) {
      c.push('config firewall service group');
      for (const g of ir.serviceGroups) {
        c.push(`  edit "${g.name}"`);
        c.push(`    set member ${g.members.map((m) => `"${m.originalName}"`).join(' ') || '"ALL"'}`);
        c.push('  next');
      }
      c.push('end');
    }
    if (ir.interfaces.length) {
      c.push('config system interface');
      for (const i of ir.interfaces) {
        c.push(`  edit "${i.name}"`);
        if (i.ip && i.ip !== 'dhcp') { const { ip, mask } = cidrToMask(i.ip); c.push(`    set ip ${ip} ${mask}`); c.push('    set allowaccess ping'); }
        else if (i.ip === 'dhcp') c.push('    set mode dhcp');
        c.push('  next');
      }
      c.push('end');
    }
    if (ir.policies.length) {
      c.push('config firewall policy');
      ir.policies.forEach((p, idx) => {
        c.push(`  edit ${idx + 1}`);
        c.push(`    set name "${p.name.slice(0, 35)}"`);
        c.push(`    set srcintf ${names(p.from).map((n) => `"${n}"`).join(' ')}`);
        c.push(`    set dstintf ${names(p.to).map((n) => `"${n}"`).join(' ')}`);
        c.push(`    set srcaddr ${names(p.source).map((n) => `"${n}"`).join(' ')}`);
        c.push(`    set dstaddr ${names(p.destination).map((n) => `"${n}"`).join(' ')}`);
        c.push(`    set service ${names(p.service).map((n) => `"${n}"`).join(' ')}`);
        c.push(`    set action ${p.action === 'allow' ? 'accept' : 'deny'}`);
        c.push('    set schedule "always"');
        if (p.logging.atEnd) c.push('    set logtraffic all');
        if (p.disabled) c.push('    set status disable');
        c.push('  next');
      });
      c.push('end');
    }
    return [
      { id: 'fortigate-cli', label: 'FortiGate CLI', mimeType: 'text/plain', fileName: 'fortigate-config.txt', content: c.join('\n') },
      reportArtifact(ir, 'fortigate'),
    ];
  }
}

// ── Cisco ASA ───────────────────────────────────────────────────

export class CiscoAsaGenerator implements GeneratorAdapter {
  generate(ir: MigrationIR): GeneratedArtifact[] {
    const c: string[] = [];
    for (const a of ir.addresses) {
      c.push(`object network ${a.name}`);
      if (a.type === 'fqdn') c.push(`  fqdn ${a.value}`);
      else if (a.type === 'ip-range') { const [s, e] = a.value.split('-'); c.push(`  range ${s} ${e || s}`); }
      else if (a.value.includes('/')) { const { ip, mask } = cidrToMask(a.value); c.push(a.value.endsWith('/32') ? `  host ${ip}` : `  subnet ${ip} ${mask}`); }
      else c.push(`  host ${a.value}`);
    }
    for (const g of ir.addressGroups) {
      c.push(`object-group network ${g.name}`);
      for (const m of g.members) c.push(`  network-object object ${m.originalName}`);
    }
    for (const s of ir.services) {
      if (s.protocol === 'tcp' || s.protocol === 'udp') { c.push(`object service ${s.name}`); c.push(`  service ${s.protocol} destination eq ${s.port}`); }
    }
    for (const g of ir.serviceGroups) {
      c.push(`object-group service ${g.name}`);
      for (const m of g.members) c.push(`  service-object object ${m.originalName}`);
    }
    for (const i of ir.interfaces) {
      if (!i.ip) continue;
      c.push(`interface ${i.name}`);
      if (i.zone) c.push(`  nameif ${i.zone}`);
      if (i.ip === 'dhcp') c.push('  ip address dhcp');
      else { const { ip, mask } = cidrToMask(i.ip); c.push(`  ip address ${ip} ${mask}`); }
    }
    ir.policies.forEach((p) => {
      const acl = (names(p.to)[0] || 'global') + '_access_in';
      const action = p.action === 'allow' ? 'permit' : 'deny';
      const src = names(p.source).map((n) => (n === 'any' ? 'any' : `object ${n}`));
      const dst = names(p.destination).map((n) => (n === 'any' ? 'any' : `object ${n}`));
      const svc = names(p.service)[0];
      c.push(`access-list ${acl} extended ${action} ip ${src[0]} ${dst[0]}${svc !== 'any' ? ` ! service: ${svc}` : ''}`);
    });
    return [
      { id: 'cisco-asa-cli', label: 'Cisco ASA CLI', mimeType: 'text/plain', fileName: 'cisco-asa-config.txt', content: c.join('\n') },
      reportArtifact(ir, 'cisco-asa'),
    ];
  }
}

// ── Check Point (mgmt CLI / set-style, best-effort) ─────────────

export class CheckpointGenerator implements GeneratorAdapter {
  generate(ir: MigrationIR): GeneratedArtifact[] {
    const c: string[] = [];
    c.push('# Check Point mgmt_cli — best-effort. Run via mgmt_cli or import as needed.');
    for (const a of ir.addresses) {
      if (a.type === 'fqdn') c.push(`mgmt_cli add dns-domain name "${a.name}" # fqdn ${a.value}`);
      else if (a.type === 'ip-range') { const [s, e] = a.value.split('-'); c.push(`mgmt_cli add address-range name "${a.name}" ip-address-first ${s} ip-address-last ${e || s}`); }
      else if (a.value.includes('/') && !a.value.endsWith('/32')) { const { ip, mask } = cidrToMask(a.value); c.push(`mgmt_cli add network name "${a.name}" subnet ${ip} subnet-mask ${mask}`); }
      else c.push(`mgmt_cli add host name "${a.name}" ip-address ${a.value.replace('/32', '')}`);
    }
    for (const g of ir.addressGroups) {
      c.push(`mgmt_cli add group name "${g.name}" members.1 ${g.members.map((m) => `"${m.originalName}"`).join(' members.2 ')}`);
    }
    for (const s of ir.services) {
      if (s.protocol === 'tcp' || s.protocol === 'udp') c.push(`mgmt_cli add service-${s.protocol} name "${s.name}" port ${s.port}`);
    }
    for (const g of ir.serviceGroups) {
      c.push(`mgmt_cli add service-group name "${g.name}" members ${g.members.map((m) => `"${m.originalName}"`).join(' ')}`);
    }
    ir.policies.forEach((p, idx) => {
      const action = p.action === 'allow' ? 'Accept' : 'Drop';
      c.push(
        `mgmt_cli add access-rule layer "Network" position ${idx + 1} name "${p.name}" ` +
        `source "${names(p.source).join(',')}" destination "${names(p.destination).join(',')}" ` +
        `service "${names(p.service).join(',')}" action "${action}"${p.disabled ? ' enabled false' : ''}`
      );
    });
    return [
      { id: 'checkpoint-cli', label: 'Check Point mgmt_cli', mimeType: 'text/plain', fileName: 'checkpoint-config.txt', content: c.join('\n') },
      reportArtifact(ir, 'checkpoint'),
    ];
  }
}

// ── Prisma Access (PAN-OS set-CLI, folder-oriented) ─────────────

export class PrismaAccessGenerator implements GeneratorAdapter {
  generate(ir: MigrationIR): GeneratedArtifact[] {
    const c: string[] = [];
    c.push('# Prisma Access (Strata Cloud Manager) — set commands. Apply under the appropriate Folder/Snippet.');
    for (const a of ir.addresses) c.push(`set shared address "${a.name}" ${a.type} ${a.value}`);
    for (const g of ir.addressGroups) for (const m of g.members) c.push(`set shared address-group "${g.name}" static "${m.originalName}"`);
    for (const s of ir.services) if (s.protocol === 'tcp' || s.protocol === 'udp') c.push(`set shared service "${s.name}" protocol ${s.protocol} port ${s.port}`);
    for (const g of ir.serviceGroups) for (const m of g.members) c.push(`set shared service-group "${g.name}" members "${m.originalName}"`);
    for (const t of ir.tags) c.push(`set shared tag "${t.name}"${t.color ? ` color "${t.color}"` : ''}`);
    ir.policies.forEach((p) => {
      const base = `set rulebase security rules "${p.name}"`;
      c.push(`${base} from [ ${names(p.from).join(' ')} ] to [ ${names(p.to).join(' ')} ] source [ ${names(p.source).join(' ')} ] destination [ ${names(p.destination).join(' ')} ] application any service [ ${names(p.service).join(' ')} ] action ${p.action}`);
    });
    return [
      { id: 'prisma-access-cli', label: 'Prisma Access set Commands', mimeType: 'text/plain', fileName: 'prisma-access-config.txt', content: c.join('\n') },
      reportArtifact(ir, 'prisma-access'),
    ];
  }
}
