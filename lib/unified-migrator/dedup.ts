// ────────────────────────────────────────────────────────────────
// Duplicate detection & cleanup (opt-in) — generic MigrationIR
// ────────────────────────────────────────────────────────────────
//
// Two kinds of duplication are handled:
//   • Objects with an identical definition but different names — the
//     first name is kept (canonical), the rest are merged into it and
//     every reference is repointed.
//   • Security/NAT rules that are exact functional duplicates — later
//     copies are dropped (the earlier rule already matches the traffic).
//
// Runs only when the user enables "clean up duplicates"; otherwise a
// disabled report is returned and the IR is untouched.
//

import type { DedupReport, DuplicateGroup, MigrationIR, ReferenceMember } from '@/lib/unified-migrator/types';

export function dedupeIr(ir: MigrationIR, enabled: boolean): DedupReport {
  if (!enabled) {
    return { enabled: false, objectsMerged: 0, rulesRemoved: 0, groups: [] };
  }
  const groups: DuplicateGroup[] = [];
  const rename = new Map<string, string>(); // duplicate name → canonical name

  // ── Objects: merge identical definitions ──
  mergeByDefinition(ir.addresses, (a) => `${a.type}|${a.value}`, 'address', groups, rename);
  mergeByDefinition(ir.services, (s) => `${s.protocol}|${s.port}|${s.sourcePort || ''}`, 'service', groups, rename);
  mergeByDefinition(
    ir.addressGroups,
    (g) => 'ag|' + [...g.members.map((m) => m.ref)].sort().join(','),
    'address-group',
    groups,
    rename
  );
  mergeByDefinition(
    ir.serviceGroups,
    (g) => 'sg|' + [...g.members.map((m) => m.ref)].sort().join(','),
    'service-group',
    groups,
    rename
  );

  const objectsMerged = rename.size;

  // Repoint references everywhere a merged name might appear.
  if (objectsMerged) {
    const fix = (ref: ReferenceMember) => {
      const to = rename.get(ref.ref);
      if (to) {
        ref.ref = to;
        ref.originalName = to;
      }
    };
    for (const g of [...ir.addressGroups, ...ir.serviceGroups]) g.members.forEach(fix);
    for (const p of ir.policies) {
      [p.source, p.destination, p.service, p.from, p.to].forEach((set) => set.refs.forEach(fix));
    }
  }

  // ── Rules: drop exact functional duplicates ──
  const rulesRemoved = dropDuplicateRules(ir, groups);

  return { enabled: true, objectsMerged, rulesRemoved, groups };
}

function mergeByDefinition<T extends { name: string }>(
  items: T[],
  keyOf: (item: T) => string,
  kind: string,
  groups: DuplicateGroup[],
  rename: Map<string, string>
) {
  const canonical = new Map<string, T>();
  const keep: T[] = [];
  const dupsByCanon = new Map<string, string[]>();
  for (const item of items) {
    const key = keyOf(item);
    const existing = canonical.get(key);
    if (existing) {
      rename.set(item.name, existing.name);
      if (!dupsByCanon.has(existing.name)) dupsByCanon.set(existing.name, []);
      dupsByCanon.get(existing.name)!.push(item.name);
    } else {
      canonical.set(key, item);
      keep.push(item);
    }
  }
  for (const [canon, dups] of dupsByCanon) {
    groups.push({ kind, canonical: canon, duplicates: dups, detail: 'identical definition' });
  }
  // mutate the array in place to keep only canonicals
  items.length = 0;
  items.push(...keep);
}

function dropDuplicateRules(ir: MigrationIR, groups: DuplicateGroup[]): number {
  let removed = 0;
  const ruleKey = (r: any, kind: string) =>
    kind === 'security'
      ? [
          'sec',
          setKey(r.from), setKey(r.to), setKey(r.source), setKey(r.destination),
          setKey(r.service), r.action,
        ].join('||')
      : [
          'nat',
          (r.originalPacket?.srcZone || ''), (r.originalPacket?.dstZone || ''),
          (r.originalPacket?.srcAddress || ''), (r.originalPacket?.dstAddress || ''),
          (r.translatedPacket?.srcAddress || ''),
        ].join('||');

  const dedupeList = (list: any[], kind: string) => {
    const seen = new Map<string, string>(); // key → first rule name
    const keep: any[] = [];
    const dupNames: string[] = [];
    for (const r of list) {
      const k = ruleKey(r, kind);
      const first = seen.get(k);
      if (first) {
        removed += 1;
        dupNames.push(r.name);
      } else {
        seen.set(k, r.name);
        keep.push(r);
      }
    }
    if (dupNames.length) {
      groups.push({ kind: `${kind}-rule`, canonical: '(earlier rule)', duplicates: dupNames, detail: 'identical match criteria' });
    }
    list.length = 0;
    list.push(...keep);
  };

  dedupeList(ir.policies, 'security');
  dedupeList(ir.natRules, 'nat');
  return removed;
}

function setKey(set: { refs: { ref: string }[]; includesAny: boolean } | undefined): string {
  if (!set) return '';
  if (set.includesAny) return 'any';
  return [...set.refs.map((r) => r.ref)].sort().join(',');
}
