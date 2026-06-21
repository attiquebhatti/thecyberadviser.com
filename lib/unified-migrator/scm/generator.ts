// ────────────────────────────────────────────────────────────────
// ScmModel → importable SCM bundle (artifacts)
// ────────────────────────────────────────────────────────────────
//
// Produces, all client-side and downloadable:
//
//   scm-config.xml             A cleaned, SCM-ready PAN-OS-style config
//                              rebuilt from the post-remediation model:
//                              Global objects in <shared>, each folder as
//                              a <device-group>, with every flagged
//                              construct (per-rule target, group-tag,
//                              saas-user-list, …) already removed — so
//                              SCM onboarding ingests it without the
//                              blocking limitations.
//   scm-set-commands.txt       set-CLI for objects + rules (review / partial apply)
//   scm-remediation-report.md  what was auto-remapped vs. needs manual work
//   scm-mapping.json           full machine-readable folder/snippet/object/rule map
//

import { escapeXml } from '@/lib/unified-migrator/utils';
import type {
  PanNatRule,
  PanSecurityRule,
  ScmArtifact,
  ScmFolder,
  ScmModel,
  ScmObjectBag,
} from '@/lib/unified-migrator/scm/types';

export function generateScmArtifacts(scm: ScmModel): ScmArtifact[] {
  const artifacts: ScmArtifact[] = [
    {
      id: 'scm-config-xml',
      label: 'SCM-Ready Config (XML)',
      mimeType: 'application/xml',
      fileName: 'scm-config.xml',
      content: buildXml(scm),
    },
    {
      id: 'scm-set-cli',
      label: 'SCM set Commands',
      mimeType: 'text/plain',
      fileName: 'scm-set-commands.txt',
      content: buildCli(scm),
    },
    {
      id: 'scm-remediation-report',
      label: 'Remediation Report',
      mimeType: 'text/markdown',
      fileName: 'scm-remediation-report.md',
      content: buildReport(scm),
    },
    {
      id: 'scm-mapping-json',
      label: 'Migration Mapping (JSON)',
      mimeType: 'application/json',
      fileName: 'scm-mapping.json',
      content: JSON.stringify(scm, null, 2),
    },
  ];

  // Only include the logical-router bundle when there's routing to migrate.
  if (scm.logicalRouters.some((lr) => lr.staticRoutes.length)) {
    artifacts.splice(2, 0, {
      id: 'scm-logical-routers',
      label: 'SCM Logical Routers',
      mimeType: 'text/plain',
      fileName: 'scm-logical-routers.txt',
      content: buildLogicalRouters(scm),
    });
  }

  // Clientless VPN / Explicit Proxy mapping (Mobile Users).
  if (scm.clientlessVpn && scm.clientlessVpn.applications.length) {
    artifacts.push({
      id: 'scm-clientless-vpn',
      label: 'Clientless VPN',
      mimeType: 'text/plain',
      fileName: 'scm-clientless-vpn.txt',
      content: buildClientless(scm),
    });
  }

  return artifacts;
}

function buildClientless(scm: ScmModel): string {
  const cv = scm.clientlessVpn!;
  const label =
    cv.target === 'explicit-proxy' ? 'Prisma Access Explicit Proxy'
    : cv.target === 'gp-app' ? 'GlobalProtect app'
    : 'Prisma Access Mobile Users → Clientless VPN';
  const out: string[] = [];
  out.push(`# Clientless VPN migration → ${label}`);
  out.push('# Published web applications migrated from GlobalProtect Clientless VPN.');
  out.push('# Manual finish in SCM: attach SAML/IdP auth profile + portal certificate.');
  out.push('');
  out.push('Application | URL/Domain | Source gateway | Template');
  out.push('-'.repeat(70));
  for (const a of cv.applications) {
    out.push(`${a.name} | ${a.url || '-'} | ${a.gateway || '-'} | ${a.template}`);
  }
  return out.join('\n');
}

// ── Logical routers (static routes) ─────────────────────────────

function buildLogicalRouters(scm: ScmModel): string {
  const out: string[] = [];
  out.push('# Strata Cloud Manager — Logical Router static routes');
  out.push('# Migrated from Panorama virtual routers. Review interface/next-hop, then apply.');
  out.push('# (BGP/OSPF and redistribution are not included — recreate those in SCM.)');
  out.push('');
  for (const lr of scm.logicalRouters) {
    out.push(`## Logical router: ${lr.name}  (from template: ${lr.fromTemplate})${lr.hasBgp ? '  [also has BGP — migrate separately]' : ''}`);
    if (!lr.staticRoutes.length) {
      out.push('  (no static routes)');
      out.push('');
      continue;
    }
    out.push('  Name | Destination | Next hop | Interface | Metric');
    out.push('  ' + '-'.repeat(60));
    for (const r of lr.staticRoutes) {
      const nh = r.nexthopType === 'discard' ? 'discard' : (r.nexthop || '-');
      out.push(`  ${r.name} | ${r.destination} | ${r.nexthopType}:${nh} | ${r.interface || '-'} | ${r.metric || '-'}`);
    }
    out.push('');
    out.push('  # set commands:');
    for (const r of lr.staticRoutes) {
      const base = `set network logical-router "${lr.name}" vrf default routing-table ip static-route "${r.name}" destination ${r.destination}`;
      if (r.nexthopType === 'ip-address' && r.nexthop) out.push(`  ${base} nexthop ip-address ${r.nexthop}`);
      else if (r.nexthopType === 'next-vr' && r.nexthop) out.push(`  ${base} nexthop next-lr "${r.nexthop}"`);
      else if (r.nexthopType === 'discard') out.push(`  ${base} nexthop discard`);
      else out.push(`  ${base}`);
      if (r.interface) out.push(`  ${base} interface ${r.interface}`);
      if (r.metric) out.push(`  ${base} metric ${r.metric}`);
    }
    out.push('');
  }
  return out.join('\n');
}

// ── XML ─────────────────────────────────────────────────────────

function buildXml(scm: ScmModel): string {
  const p: string[] = ['<?xml version="1.0"?>', '<config version="11.2.0" urldb="paloaltonetworks">'];

  // Shared scope = Global objects + the "Shared" folder rulebase.
  const sharedFolder = scm.folders.find((f) => f.name === 'Shared');
  p.push('  <shared>');
  emitObjects(p, scm.global, 4);
  if (sharedFolder) emitRulebases(p, sharedFolder, 4);
  p.push('  </shared>');

  // Device-group equivalents (every folder except the synthetic Shared root).
  const dgFolders = scm.folders.filter((f) => f.name !== 'Shared');
  if (dgFolders.length) {
    p.push('  <devices>', '    <entry name="localhost.localdomain">', '      <device-group>');
    for (const f of dgFolders) {
      p.push(`        <entry name="${escapeXml(f.name)}">`);
      emitObjects(p, f.objects, 10);
      emitRulebases(p, f, 10);
      if (f.parent && f.parent !== 'Shared') {
        p.push(`          <parent-dg>${escapeXml(f.parent)}</parent-dg>`);
      }
      p.push('        </entry>');
    }
    p.push('      </device-group>', '    </entry>', '  </devices>');
  }

  p.push('</config>');
  return p.filter(Boolean).join('\n');
}

function pad(n: number): string {
  return ' '.repeat(n);
}

function emitObjects(p: string[], bag: ScmObjectBag, indent: number) {
  const i = pad(indent);
  const i2 = pad(indent + 2);
  const i3 = pad(indent + 4);

  if (bag.tags.length) {
    p.push(`${i}<tag>`);
    for (const t of bag.tags) {
      p.push(`${i2}<entry name="${escapeXml(t.name)}">`);
      if (t.color) p.push(`${i3}<color>${escapeXml(t.color)}</color>`);
      if (t.comments) p.push(`${i3}<comments>${escapeXml(t.comments)}</comments>`);
      p.push(`${i2}</entry>`);
    }
    p.push(`${i}</tag>`);
  }

  if (bag.addresses.length) {
    p.push(`${i}<address>`);
    for (const a of bag.addresses) {
      p.push(`${i2}<entry name="${escapeXml(a.name)}">`);
      p.push(`${i3}<${a.type}>${escapeXml(a.value)}</${a.type}>`);
      if (a.description) p.push(`${i3}<description>${escapeXml(a.description)}</description>`);
      emitTags(p, a.tags, indent + 4);
      p.push(`${i2}</entry>`);
    }
    p.push(`${i}</address>`);
  }

  if (bag.addressGroups.length) {
    p.push(`${i}<address-group>`);
    for (const g of bag.addressGroups) {
      p.push(`${i2}<entry name="${escapeXml(g.name)}">`);
      if (g.dynamicFilter) {
        p.push(`${i3}<dynamic><filter>${escapeXml(g.dynamicFilter)}</filter></dynamic>`);
      } else {
        p.push(`${i3}<static>`);
        for (const m of g.staticMembers || []) p.push(`${pad(indent + 6)}<member>${escapeXml(m)}</member>`);
        p.push(`${i3}</static>`);
      }
      emitTags(p, g.tags, indent + 4);
      p.push(`${i2}</entry>`);
    }
    p.push(`${i}</address-group>`);
  }

  if (bag.services.length) {
    p.push(`${i}<service>`);
    for (const s of bag.services) {
      p.push(`${i2}<entry name="${escapeXml(s.name)}">`);
      if (s.protocol === 'tcp' || s.protocol === 'udp') {
        p.push(`${i3}<protocol><${s.protocol}><port>${escapeXml(s.port || '')}</port>${
          s.sourcePort ? `<source-port>${escapeXml(s.sourcePort)}</source-port>` : ''
        }</${s.protocol}></protocol>`);
      }
      emitTags(p, s.tags, indent + 4);
      p.push(`${i2}</entry>`);
    }
    p.push(`${i}</service>`);
  }

  if (bag.serviceGroups.length) {
    p.push(`${i}<service-group>`);
    for (const g of bag.serviceGroups) {
      p.push(`${i2}<entry name="${escapeXml(g.name)}">`);
      p.push(`${i3}<members>`);
      for (const m of g.members) p.push(`${pad(indent + 6)}<member>${escapeXml(m)}</member>`);
      p.push(`${i3}</members>`);
      p.push(`${i2}</entry>`);
    }
    p.push(`${i}</service-group>`);
  }

  if (bag.applicationGroups.length) {
    p.push(`${i}<application-group>`);
    for (const g of bag.applicationGroups) {
      p.push(`${i2}<entry name="${escapeXml(g.name)}">`);
      p.push(`${i3}<members>`);
      for (const m of g.members) p.push(`${pad(indent + 6)}<member>${escapeXml(m)}</member>`);
      p.push(`${i3}</members>`);
      p.push(`${i2}</entry>`);
    }
    p.push(`${i}</application-group>`);
  }

  if (bag.externalLists.length) {
    p.push(`${i}<external-list>`);
    for (const e of bag.externalLists) {
      p.push(`${i2}<entry name="${escapeXml(e.name)}">`);
      if (e.type !== 'unknown') {
        p.push(`${i3}<type><${e.type}>${e.url ? `<url>${escapeXml(e.url)}</url>` : ''}</${e.type}></type>`);
      }
      p.push(`${i2}</entry>`);
    }
    p.push(`${i}</external-list>`);
  }
}

function emitTags(p: string[], tags: string[], indent: number) {
  if (!tags.length) return;
  const i = pad(indent);
  p.push(`${i}<tag>${tags.map((t) => `<member>${escapeXml(t)}</member>`).join('')}</tag>`);
}

function emitRulebases(p: string[], f: ScmFolder, indent: number) {
  const i = pad(indent);
  const preSec = f.rules.filter((r) => r.type === 'security' && r.phase === 'pre').map((r) => r.security!);
  const postSec = f.rules.filter((r) => r.type === 'security' && r.phase === 'post').map((r) => r.security!);
  const preNat = f.rules.filter((r) => r.type === 'nat' && r.phase === 'pre').map((r) => r.nat!);
  const postNat = f.rules.filter((r) => r.type === 'nat' && r.phase === 'post').map((r) => r.nat!);

  const phase = (label: 'pre-rulebase' | 'post-rulebase', sec: PanSecurityRule[], nat: PanNatRule[]) => {
    if (!sec.length && !nat.length) return;
    p.push(`${i}<${label}>`);
    if (sec.length) {
      p.push(`${pad(indent + 2)}<security><rules>`);
      for (const r of sec) emitSecurityRule(p, r, indent + 6);
      p.push(`${pad(indent + 2)}</rules></security>`);
    }
    if (nat.length) {
      p.push(`${pad(indent + 2)}<nat><rules>`);
      for (const r of nat) emitNatRule(p, r, indent + 6);
      p.push(`${pad(indent + 2)}</rules></nat>`);
    }
    p.push(`${i}</${label}>`);
  };

  phase('pre-rulebase', preSec, preNat);
  phase('post-rulebase', postSec, postNat);
}

function memberBlock(tag: string, vals: string[], indent: number): string {
  return `${pad(indent)}<${tag}>${vals.map((v) => `<member>${escapeXml(v)}</member>`).join('')}</${tag}>`;
}

function emitSecurityRule(p: string[], r: PanSecurityRule, indent: number) {
  const i = pad(indent);
  const i2 = pad(indent + 2);
  p.push(`${i}<entry name="${escapeXml(r.name)}"${r.uuid ? ` uuid="${escapeXml(r.uuid)}"` : ''}>`);
  p.push(memberBlock('from', r.fromZones, indent + 2));
  p.push(memberBlock('to', r.toZones, indent + 2));
  p.push(memberBlock('source', r.source, indent + 2));
  p.push(memberBlock('destination', r.destination, indent + 2));
  if (r.sourceUser.length) p.push(memberBlock('source-user', r.sourceUser, indent + 2));
  p.push(memberBlock('application', r.application, indent + 2));
  p.push(memberBlock('service', r.service, indent + 2));
  if (r.category.length) p.push(memberBlock('category', r.category, indent + 2));
  p.push(`${i2}<action>${escapeXml(r.action)}</action>`);
  if (r.negateSource) p.push(`${i2}<negate-source>yes</negate-source>`);
  if (r.negateDestination) p.push(`${i2}<negate-destination>yes</negate-destination>`);
  if (r.disabled) p.push(`${i2}<disabled>yes</disabled>`);
  if (r.logStart) p.push(`${i2}<log-start>yes</log-start>`);
  if (r.logEnd) p.push(`${i2}<log-end>yes</log-end>`);
  if (r.logForwarding) p.push(`${i2}<log-setting>${escapeXml(r.logForwarding)}</log-setting>`);
  if (r.profileGroup) p.push(`${i2}<profile-setting><group><member>${escapeXml(r.profileGroup)}</member></group></profile-setting>`);
  if (r.schedule) p.push(`${i2}<schedule>${escapeXml(r.schedule)}</schedule>`);
  if (r.tags.length) emitTags(p, r.tags, indent + 2);
  if (r.description) p.push(`${i2}<description>${escapeXml(r.description)}</description>`);
  p.push(`${i}</entry>`);
}

function emitNatRule(p: string[], r: PanNatRule, indent: number) {
  const i = pad(indent);
  const i2 = pad(indent + 2);
  p.push(`${i}<entry name="${escapeXml(r.name)}"${r.uuid ? ` uuid="${escapeXml(r.uuid)}"` : ''}>`);
  p.push(memberBlock('from', r.fromZones, indent + 2));
  p.push(memberBlock('to', r.toZones, indent + 2));
  p.push(memberBlock('source', r.source, indent + 2));
  p.push(memberBlock('destination', r.destination, indent + 2));
  if (r.service) p.push(`${i2}<service>${escapeXml(r.service)}</service>`);
  if (r.sourceTranslation) {
    const st = r.sourceTranslation;
    if (st.kind === 'static-ip' && st.translatedAddress?.length) {
      p.push(`${i2}<source-translation><static-ip><translated-address>${escapeXml(st.translatedAddress[0])}</translated-address>${
        r.bidirectional ? '<bi-directional>yes</bi-directional>' : ''
      }</static-ip></source-translation>`);
    } else if (st.kind === 'dynamic-ip-and-port') {
      const inner = st.interface
        ? `<interface-address><interface>${escapeXml(st.interface)}</interface></interface-address>`
        : `<translated-address>${(st.translatedAddress || []).map((a) => `<member>${escapeXml(a)}</member>`).join('')}</translated-address>`;
      p.push(`${i2}<source-translation><dynamic-ip-and-port>${inner}</dynamic-ip-and-port></source-translation>`);
    } else if (st.kind === 'dynamic-ip' && st.translatedAddress?.length) {
      p.push(`${i2}<source-translation><dynamic-ip><translated-address>${st.translatedAddress.map((a) => `<member>${escapeXml(a)}</member>`).join('')}</translated-address></dynamic-ip></source-translation>`);
    }
  }
  const dt = r.destinationTranslation;
  if (dt?.translatedAddress?.length) {
    p.push(`${i2}<destination-translation><translated-address>${escapeXml(dt.translatedAddress[0])}</translated-address>${
      dt.translatedPort ? `<translated-port>${escapeXml(dt.translatedPort)}</translated-port>` : ''
    }</destination-translation>`);
  }
  if (r.disabled) p.push(`${i2}<disabled>yes</disabled>`);
  if (r.tags.length) emitTags(p, r.tags, indent + 2);
  if (r.description) p.push(`${i2}<description>${escapeXml(r.description)}</description>`);
  p.push(`${i}</entry>`);
}

// ── set-CLI ─────────────────────────────────────────────────────

function buildCli(scm: ScmModel): string {
  const c: string[] = [];
  c.push('# Strata Cloud Manager — set commands (review / partial apply)');
  c.push('# Global (shared) objects');
  emitCliObjects(c, scm.global, 'shared');
  for (const f of scm.folders) {
    const scope = f.name === 'Shared' ? 'shared' : `device-group "${f.name}"`;
    if (f.name !== 'Shared') {
      c.push(`\n# Folder: ${f.name}`);
      emitCliObjects(c, f.objects, scope);
    }
    for (const r of f.rules) {
      if (r.security) emitCliSecurity(c, r.security, scope);
      if (r.nat) emitCliNat(c, r.nat, scope);
    }
  }
  return c.join('\n');
}

function emitCliObjects(c: string[], bag: ScmObjectBag, scope: string) {
  for (const a of bag.addresses) c.push(`set ${scope} address "${a.name}" ${a.type} ${a.value}`);
  for (const g of bag.addressGroups) {
    if (g.dynamicFilter) c.push(`set ${scope} address-group "${g.name}" dynamic filter "${g.dynamicFilter}"`);
    else for (const m of g.staticMembers || []) c.push(`set ${scope} address-group "${g.name}" static "${m}"`);
  }
  for (const s of bag.services) {
    if (s.protocol === 'tcp' || s.protocol === 'udp') c.push(`set ${scope} service "${s.name}" protocol ${s.protocol} port ${s.port || ''}`);
  }
  for (const g of bag.serviceGroups) for (const m of g.members) c.push(`set ${scope} service-group "${g.name}" members "${m}"`);
  for (const g of bag.applicationGroups) for (const m of g.members) c.push(`set ${scope} application-group "${g.name}" members "${m}"`);
}

function emitCliSecurity(c: string[], r: PanSecurityRule, scope: string) {
  const base = `set ${scope} ${r.rulebase}-rulebase security rules "${r.name}"`;
  c.push(`${base} from [ ${r.fromZones.join(' ')} ] to [ ${r.toZones.join(' ')} ] source [ ${r.source.join(' ')} ] destination [ ${r.destination.join(' ')} ] application [ ${r.application.join(' ')} ] service [ ${r.service.join(' ')} ] action ${r.action}`);
}

function emitCliNat(c: string[], r: PanNatRule, scope: string) {
  const base = `set ${scope} ${r.rulebase}-rulebase nat rules "${r.name}"`;
  c.push(`${base} from [ ${r.fromZones.join(' ')} ] to [ ${r.toZones.join(' ')} ] source [ ${r.source.join(' ')} ] destination [ ${r.destination.join(' ')} ]${r.service ? ` service ${r.service}` : ''}`);
}

// ── Remediation report (markdown) ───────────────────────────────

function buildReport(scm: ScmModel): string {
  const s = scm.stats;
  const lines: string[] = [];
  lines.push('# Panorama → Strata Cloud Manager — Migration Report', '');
  lines.push('## Summary', '');
  lines.push(`- **Folders** (from device-groups): ${s.folders}`);
  lines.push(`- **Snippets** (from templates / template-stacks): ${s.snippets}`);
  lines.push(`- **Address objects**: ${s.addresses}  |  **Address groups**: ${s.addressGroups}`);
  lines.push(`- **Service objects**: ${s.services}  |  **Service groups**: ${s.serviceGroups}  |  **Application groups**: ${s.applicationGroups}`);
  lines.push(`- **Security rules**: ${s.securityRules}  |  **NAT rules**: ${s.natRules}`);
  lines.push(`- **Logical routers**: ${s.logicalRouters}  |  **Static routes migrated**: ${s.staticRoutes}`);
  lines.push(`- **Interfaces (with IP)**: ${scm.interfaces.filter((i) => i.ip).length}  |  **Clientless VPN apps**: ${scm.clientlessVpn?.applications.length || 0}`);
  lines.push(`- **Auto-remapped items**: ${s.autoRemapped}  |  **Flagged for manual step**: ${s.flagged}`);
  if (scm.dedup?.enabled) {
    lines.push(`- **Duplicate cleanup**: ${scm.dedup.objectsMerged} object(s) merged across ${scm.dedup.groups.length} group(s)`);
  }
  lines.push('');

  if (scm.interfaces.length) {
    lines.push('## Interfaces', '');
    for (const i of scm.interfaces.slice(0, 60)) {
      lines.push(`- \`${i.name}\` ${i.ip ? `→ ${i.ip}` : '(no IP)'}  _(template: ${i.template})_`);
    }
    lines.push('', '_Interface IPs are informational for SCM/Prisma Access (which uses IPSec tunnels for Remote Networks / Service Connections). They migrate directly when the target is a PAN-OS firewall._', '');
  }

  if (scm.dedup?.enabled && scm.dedup.groups.length) {
    lines.push('## Duplicate cleanup', '');
    for (const g of scm.dedup.groups.slice(0, 60)) {
      lines.push(`- **${g.kind}** — kept \`${g.canonical}\`, merged: ${g.duplicates.map((d) => `\`${d}\``).join(', ')}`);
    }
    lines.push('');
  }

  if (scm.coverage.length) {
    lines.push('## Coverage check (independent count vs migrated)', '');
    lines.push('| Section | Found in XML | Migrated |');
    lines.push('|---|---|---|');
    for (const c of scm.coverage) {
      const flag = c.parsed < c.rawEntries ? ' ⚠️' : '';
      lines.push(`| ${c.section} | ${c.rawEntries} | ${c.parsed}${flag} |`);
    }
    lines.push('');
    lines.push('_A ⚠️ means fewer items were migrated than counted in the raw config — investigate before import. (Counts can differ legitimately when the same object name is defined in both shared and a device-group; SCM keeps the most specific.)_', '');
  }

  const auto = scm.remediations.filter((r) => r.status === 'auto-remapped');
  const flagged = scm.remediations.filter((r) => r.status === 'flagged');

  lines.push('## Limitations overcome automatically', '');
  if (!auto.length) lines.push('_None detected._', '');
  for (const r of auto) {
    lines.push(`### ✅ ${r.code} — ${r.feature}`);
    lines.push(`**SCM alternative:** ${r.scmAlternative}`, '');
    lines.push(r.detail, '');
    lines.push(`**Applied to ${r.locations.length} item(s):**`);
    for (const l of r.locations.slice(0, 50)) lines.push(`- ${l}`);
    if (r.locations.length > 50) lines.push(`- … and ${r.locations.length - 50} more`);
    lines.push('');
  }

  lines.push('## Limitations needing a manual step in SCM', '');
  if (!flagged.length) lines.push('_None — everything was handled automatically._', '');
  for (const r of flagged) {
    const icon = r.severity === 'high' ? '⛔' : '⚠️';
    lines.push(`### ${icon} ${r.code} — ${r.feature}  _(severity: ${r.severity})_`);
    lines.push(`**SCM alternative:** ${r.scmAlternative}`, '');
    lines.push(r.detail, '');
    lines.push(`**Affects ${r.locations.length} item(s):**`);
    for (const l of r.locations.slice(0, 50)) lines.push(`- ${l}`);
    if (r.locations.length > 50) lines.push(`- … and ${r.locations.length - 50} more`);
    lines.push('');
  }

  const informational = scm.remediations.filter((r) => r.status === 'informational');
  if (informational.length) {
    lines.push('## Verification checks', '');
    for (const r of informational) {
      lines.push(`### ℹ️ ${r.code} — ${r.feature}`);
      lines.push(r.detail, '');
      for (const l of r.locations.slice(0, 80)) lines.push(`- ${l}`);
      lines.push('');
    }
  }

  lines.push('## Folder hierarchy', '');
  for (const f of scm.folders) {
    lines.push(`- **${f.name}**${f.parent ? ` ← ${f.parent}` : ' (root)'} — ${f.rules.length} rule(s), ${f.objects.addresses.length} address obj`);
  }
  lines.push('');
  lines.push('> Import `scm-config.xml` through SCM onboarding. All constructs the onboarding tool previously flagged as blocking have been remediated or are documented above for the few that require a native SCM feature.');
  return lines.join('\n');
}
