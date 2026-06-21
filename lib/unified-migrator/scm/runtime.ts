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

import { parsePanorama } from '@/lib/unified-migrator/scm/panorama-parser';
import { mapToScm } from '@/lib/unified-migrator/scm/mapper';
import { applyRemediations } from '@/lib/unified-migrator/scm/limitations';
import { generateScmArtifacts } from '@/lib/unified-migrator/scm/generator';
import type { ScmMigrationResult } from '@/lib/unified-migrator/scm/types';

export function runScmMigration(xml: string): ScmMigrationResult {
  const panorama = parsePanorama(xml);
  const scm = mapToScm(panorama);
  applyRemediations(panorama, scm);
  const artifacts = generateScmArtifacts(scm);
  return { panorama, scm, artifacts };
}
