'use client';

import { useCallback } from 'react';
import type { ScmMigrationResult, Remediation } from '@/lib/unified-migrator/scm/types';

export default function ScmResultPanel({ result }: { result: ScmMigrationResult }) {
  const { scm, panorama, artifacts } = result;
  const s = scm.stats;

  const download = useCallback((id: string) => {
    const a = artifacts.find((x) => x.id === id);
    if (!a) return;
    const blob = new Blob([a.content], { type: a.mimeType });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = a.fileName;
    el.click();
    URL.revokeObjectURL(url);
  }, [artifacts]);

  const auto = scm.remediations.filter((r) => r.status === 'auto-remapped');
  const flagged = scm.remediations.filter((r) => r.status === 'flagged');
  const informational = scm.remediations.filter((r) => r.status === 'informational');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-white font-semibold">Panorama → Strata Cloud Manager</h3>
            <p className="text-white/40 text-xs mt-0.5">
              Source: <span className="font-mono text-white/60">{panorama.hostname}</span> · PAN-OS{' '}
              <span className="font-mono text-white/60">{panorama.swVersion}</span>
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
            {s.flagged === 0 ? 'Fully automated' : `${s.autoRemapped} auto · ${s.flagged} need a manual step`}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Folders" value={s.folders} hint="from device-groups" />
        <Stat label="Snippets" value={s.snippets} hint="from templates" />
        <Stat label="Security Rules" value={s.securityRules} />
        <Stat label="NAT Rules" value={s.natRules} />
        <Stat label="Addresses" value={s.addresses} />
        <Stat label="Address Groups" value={s.addressGroups} />
        <Stat label="Services" value={s.services} />
        <Stat label="Service Groups" value={s.serviceGroups} />
        <Stat label="App Groups" value={s.applicationGroups} />
        <Stat label="Logical Routers" value={s.logicalRouters} hint="from virtual routers" />
        <Stat label="Static Routes" value={s.staticRoutes} hint="auto-migrated" />
      </div>

      {/* Coverage check */}
      {scm.coverage.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="text-white font-semibold mb-1">Coverage check</h3>
          <p className="text-white/40 text-xs mb-4">Independent count from the raw config vs what was migrated — a quick sanity check before upload.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left pb-2">Section</th>
                <th className="text-right pb-2">Found in XML</th>
                <th className="text-right pb-2">Migrated</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {scm.coverage.map((c) => {
                const short = c.parsed < c.rawEntries;
                return (
                  <tr key={c.section} className="border-t border-white/[0.04]">
                    <td className="py-2">{c.section}</td>
                    <td className="py-2 text-right">{c.rawEntries}</td>
                    <td className={`py-2 text-right ${short ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {c.parsed}{short ? ' ⚠' : ' ✓'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Limitation coverage */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-emerald-300 text-2xl font-bold">{s.autoRemapped}</p>
          <p className="text-emerald-200/70 text-xs mt-1">SCM limitations overcome automatically</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-amber-300 text-2xl font-bold">{s.flagged}</p>
          <p className="text-amber-200/70 text-xs mt-1">Items needing a native SCM step (documented)</p>
        </div>
      </div>

      {/* Folder tree */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="text-white font-semibold mb-4">Folder hierarchy</h3>
        <ul className="space-y-1.5 text-sm">
          {scm.folders.map((f) => {
            const depth = folderDepth(scm.folders, f.name);
            return (
              <li key={f.name} className="text-white/70" style={{ paddingLeft: depth * 18 }}>
                <span className="text-blue-300 font-medium">{f.name}</span>
                {f.name !== 'Shared' && <span className="text-white/30"> · device-group</span>}
                <span className="text-white/40 text-xs ml-2">
                  {f.rules.length} rule(s){f.deviceSerials.length ? ` · ${f.deviceSerials.length} firewall(s)` : ''}
                </span>
              </li>
            );
          })}
        </ul>
        {scm.snippets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.04]">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Snippets</p>
            <div className="flex flex-wrap gap-2">
              {scm.snippets.map((sn) => (
                <span key={sn.name} className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/70">
                  {sn.name} <span className="text-white/30">({sn.source})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auto-remapped */}
      {auto.length > 0 && (
        <RemediationList
          title="Limitations overcome automatically"
          tone="emerald"
          items={auto}
        />
      )}

      {/* Flagged */}
      {flagged.length > 0 && (
        <RemediationList
          title="Needs a manual step in SCM"
          tone="amber"
          items={flagged}
        />
      )}

      {/* Informational verification checks */}
      {informational.length > 0 && (
        <RemediationList
          title="Verification checks"
          tone="amber"
          items={informational}
        />
      )}

      {/* Parse notes */}
      {panorama.notes.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
          <h3 className="text-orange-300 font-semibold mb-2 text-sm">Notes</h3>
          <ul className="space-y-1 text-sm text-white/60">
            {panorama.notes.map((n, i) => <li key={i}>• {n}</li>)}
          </ul>
        </div>
      )}

      {/* Clientless VPN mapping */}
      {scm.clientlessVpn && scm.clientlessVpn.applications.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
          <h3 className="text-emerald-300 font-semibold mb-1">
            Clientless VPN → {scm.clientlessVpn.target === 'explicit-proxy' ? 'Explicit Proxy' : scm.clientlessVpn.target === 'gp-app' ? 'GlobalProtect app' : 'Prisma Access Clientless VPN'}
          </h3>
          <p className="text-white/45 text-xs mb-3">
            {scm.clientlessVpn.applications.length} published web app(s) mapped to Mobile Users. Attach the SAML/IdP auth profile + portal certificate in SCM to finish.
          </p>
          <ul className="text-xs text-white/60 font-mono space-y-0.5 max-h-44 overflow-y-auto">
            {scm.clientlessVpn.applications.slice(0, 60).map((a, i) => (
              <li key={i}>{a.name}{a.url ? ` — ${a.url}` : ''} <span className="text-white/30">({a.template}/{a.gateway})</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Prisma Access (Panorama cloud_services) */}
      {scm.prismaAccess && (scm.prismaAccess.remoteNetworks.length > 0 || scm.prismaAccess.serviceConnections.length > 0 || scm.prismaAccess.mobileUsers) && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
          <h3 className="text-emerald-300 font-semibold mb-1">Prisma Access (Panorama-managed)</h3>
          <p className="text-white/45 text-xs mb-4">
            Migrated from the cloud_services plugin. In SCM, re-create these under Workflows → Prisma Access Setup; IPSec pre-shared keys must be re-entered (not exported).
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <Stat label="Remote Networks" value={scm.prismaAccess.remoteNetworks.length} />
            <Stat label="Service Connections" value={scm.prismaAccess.serviceConnections.length} />
            <Stat label="Mobile Users" value={scm.prismaAccess.mobileUsers ? 1 : 0} hint={scm.prismaAccess.mobileUsers ? 'configured' : 'none'} />
          </div>
          {scm.prismaAccess.remoteNetworks.length > 0 && (
            <ul className="text-xs text-white/60 font-mono space-y-0.5 max-h-44 overflow-y-auto">
              {scm.prismaAccess.remoteNetworks.slice(0, 60).map((r, i) => (
                <li key={i}>RN: {r.name} {r.region ? `· ${r.region}` : ''} {r.subnets.length ? `· ${r.subnets.join(', ')}` : ''}{r.bgp ? ' · BGP' : ''}</li>
              ))}
              {scm.prismaAccess.serviceConnections.slice(0, 30).map((s, i) => (
                <li key={`sc${i}`}>SC: {s.name} {s.region ? `· ${s.region}` : ''} {s.subnets.length ? `· ${s.subnets.join(', ')}` : ''}{s.bgp ? ' · BGP' : ''}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Interfaces */}
      {scm.interfaces.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="text-white font-semibold mb-1">Interfaces ({scm.interfaces.filter((i) => i.ip).length} with IP)</h3>
          <p className="text-white/40 text-xs mb-3">Informational for SCM (Prisma Access uses IPSec tunnels); migrated directly to a PAN-OS target.</p>
          <ul className="text-xs text-white/60 font-mono grid sm:grid-cols-2 gap-x-6 gap-y-0.5 max-h-44 overflow-y-auto">
            {scm.interfaces.slice(0, 60).map((i, idx) => (
              <li key={idx}>{i.name} {i.ip ? `→ ${i.ip}` : ''} <span className="text-white/30">({i.template})</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate cleanup */}
      {scm.dedup?.enabled && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-200">
          <span className="font-semibold">Duplicate cleanup:</span> merged {scm.dedup.objectsMerged} object(s) across {scm.dedup.groups.length} group(s).
        </div>
      )}

      {/* Downloads */}
      <div className="flex flex-wrap gap-3">
        {artifacts.map((a) => (
          <button
            key={a.id}
            id={`download-${a.id}-btn`}
            onClick={() => download(a.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-white/80 text-sm rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
      {hint && <p className="text-white/25 text-[10px] mt-0.5">{hint}</p>}
    </div>
  );
}

function RemediationList({ title, tone, items }: { title: string; tone: 'emerald' | 'amber'; items: Remediation[] }) {
  const border = tone === 'emerald' ? 'border-emerald-500/20' : 'border-amber-500/20';
  const head = tone === 'emerald' ? 'text-emerald-300' : 'text-amber-300';
  return (
    <div className={`rounded-xl border ${border} bg-white/[0.02] p-6`}>
      <h3 className={`${head} font-semibold mb-4`}>{title}</h3>
      <div className="space-y-4">
        {items.map((r, i) => (
          <div key={`${r.code}-${i}`} className="border-t border-white/[0.04] pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.06] text-white/70">{r.code}</span>
              <span className="text-white/90 text-sm font-medium">{r.feature}</span>
              <SeverityPill severity={r.severity} />
            </div>
            <p className="text-white/60 text-sm mt-1.5">{r.detail}</p>
            <p className="text-white/40 text-xs mt-1">
              <span className="text-white/50">SCM alternative:</span> {r.scmAlternative} ·{' '}
              <span className="text-white/50">{r.locations.length}</span> item(s)
            </p>
            {r.locations.length > 0 && (
              <details className="mt-1.5">
                <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60">Show affected items</summary>
                <ul className="mt-1.5 space-y-0.5 text-xs text-white/40 max-h-40 overflow-y-auto font-mono">
                  {r.locations.slice(0, 100).map((l, j) => <li key={j}>{l}</li>)}
                  {r.locations.length > 100 && <li>… and {r.locations.length - 100} more</li>}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeverityPill({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const map = {
    high: 'bg-red-500/15 text-red-300 border-red-500/20',
    medium: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    low: 'bg-white/[0.06] text-white/50 border-white/[0.1]',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[severity]}`}>{severity}</span>;
}

function folderDepth(folders: { name: string; parent?: string }[], name: string, guard = 0): number {
  if (guard > 20) return 0;
  const f = folders.find((x) => x.name === name);
  if (!f || !f.parent) return 0;
  return 1 + folderDepth(folders, f.parent, guard + 1);
}
