// ────────────────────────────────────────────────────────────────
// Panorama → Strata Cloud Manager — Pipeline Orchestrator
// ────────────────────────────────────────────────────────────────
//
// parse → map → remediate → generate
//
// Runs entirely client-side (the uploaded Panorama config never leaves
// the browser). Parallel to the generic runMigration() used for the
// other vendor → PAN-OS conversions.
//

import { parsePanorama, rawSectionCounts } from '@/lib/unified-migrator/scm/panorama-parser';
import { mapToScm } from '@/lib/unified-migrator/scm/mapper';
import { applyRemediations } from '@/lib/unified-migrator/scm/limitations';
import { generateScmArtifacts } from '@/lib/unified-migrator/scm/generator';
import type { CoverageRow, ScmMigrationResult } from '@/lib/unified-migrator/scm/types';

export function runScmMigration(xml: string): ScmMigrationResult {
  const panorama = parsePanorama(xml);
  const scm = mapToScm(panorama);
  applyRemediations(panorama, scm);
  scm.coverage = buildCoverage(xml, scm);
  const artifacts = generateScmArtifacts(scm);
  return { panorama, scm, artifacts };
}

function buildCoverage(xml: string, scm: ScmMigrationResult['scm']): CoverageRow[] {
  const raw = rawSectionCounts(xml);
  const s = scm.stats;
  const rows: CoverageRow[] = [
    { section: 'address', rawEntries: raw['address'], parsed: s.addresses },
    { section: 'address-group', rawEntries: raw['address-group'], parsed: s.addressGroups },
    { section: 'service', rawEntries: raw['service'], parsed: s.services },
    { section: 'service-group', rawEntries: raw['service-group'], parsed: s.serviceGroups },
    { section: 'application-group', rawEntries: raw['application-group'], parsed: s.applicationGroups },
    { section: 'security-rules', rawEntries: raw['security-rules'], parsed: s.securityRules },
    { section: 'nat-rules', rawEntries: raw['nat-rules'], parsed: s.natRules },
  ];
  return rows;
}
