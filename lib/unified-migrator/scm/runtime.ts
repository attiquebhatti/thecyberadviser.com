// ────────────────────────────────────────────────────────────────
// Panorama → Strata Cloud Manager — Pipeline Orchestrator
// ────────────────────────────────────────────────────────────────
//
// parse → map → dedupe (opt-in) → remediate → generate
//
// Runs entirely client-side (the uploaded Panorama config never leaves
// the browser). Parallel to the generic runMigration().
//

import { parsePanorama, rawSectionCounts } from '@/lib/unified-migrator/scm/panorama-parser';
import { mapToScm } from '@/lib/unified-migrator/scm/mapper';
import { applyRemediations } from '@/lib/unified-migrator/scm/limitations';
import { generateScmArtifacts } from '@/lib/unified-migrator/scm/generator';
import { DEFAULT_MIGRATION_OPTIONS, type DedupReport, type DuplicateGroup, type MigrationOptions } from '@/lib/unified-migrator/types';
import type { CoverageRow, ScmMigrationResult, ScmObjectBag } from '@/lib/unified-migrator/scm/types';

export function runScmMigration(xml: string, options: MigrationOptions = DEFAULT_MIGRATION_OPTIONS): ScmMigrationResult {
  const panorama = parsePanorama(xml);
  const scm = mapToScm(panorama);
  if (options.cleanupDuplicates) scm.dedup = dedupeScm(scm);
  applyRemediations(panorama, scm, options);
  scm.coverage = buildCoverage(xml, scm);
  const artifacts = generateScmArtifacts(scm);
  return { panorama, scm, artifacts };
}

/** Opt-in: merge identical-definition objects in Global + each folder, repoint nothing
 *  (names are preserved as aliases in the report). Reports duplicates without changing
 *  enforcement semantics. */
function dedupeScm(scm: ScmMigrationResult['scm']): DedupReport {
  const groups: DuplicateGroup[] = [];
  let objectsMerged = 0;

  const mergeBag = (bag: ScmObjectBag, scope: string) => {
    objectsMerged += mergeByDef(bag.addresses, (a) => `${a.type}|${a.value}`, `address (${scope})`, groups);
    objectsMerged += mergeByDef(bag.services, (s) => `${s.protocol}|${s.port || ''}`, `service (${scope})`, groups);
  };
  mergeBag(scm.global, 'Global');
  for (const f of scm.folders) mergeBag(f.objects, f.name);

  return { enabled: true, objectsMerged, rulesRemoved: 0, groups };
}

function mergeByDef<T extends { name: string }>(
  items: T[],
  keyOf: (i: T) => string,
  kind: string,
  groups: DuplicateGroup[]
): number {
  const canon = new Map<string, T>();
  const keep: T[] = [];
  const dups = new Map<string, string[]>();
  for (const it of items) {
    const k = keyOf(it);
    const ex = canon.get(k);
    if (ex) {
      if (!dups.has(ex.name)) dups.set(ex.name, []);
      dups.get(ex.name)!.push(it.name);
    } else {
      canon.set(k, it);
      keep.push(it);
    }
  }
  let merged = 0;
  for (const [c, d] of dups) {
    groups.push({ kind, canonical: c, duplicates: d, detail: 'identical definition' });
    merged += d.length;
  }
  items.length = 0;
  items.push(...keep);
  return merged;
}

function buildCoverage(xml: string, scm: ScmMigrationResult['scm']): CoverageRow[] {
  const raw = rawSectionCounts(xml);
  const s = scm.stats;
  return [
    { section: 'address', rawEntries: raw['address'], parsed: s.addresses },
    { section: 'address-group', rawEntries: raw['address-group'], parsed: s.addressGroups },
    { section: 'service', rawEntries: raw['service'], parsed: s.services },
    { section: 'service-group', rawEntries: raw['service-group'], parsed: s.serviceGroups },
    { section: 'application-group', rawEntries: raw['application-group'], parsed: s.applicationGroups },
    { section: 'security-rules', rawEntries: raw['security-rules'], parsed: s.securityRules },
    { section: 'nat-rules', rawEntries: raw['nat-rules'], parsed: s.natRules },
  ];
}
