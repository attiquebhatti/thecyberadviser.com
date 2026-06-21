// ────────────────────────────────────────────────────────────────
// UnifiedMigrator — Pipeline Orchestrator
// ────────────────────────────────────────────────────────────────
//
// Pipeline: ingest → parse → normalize → translate → validate → report
//

import { CiscoAsaParser } from '@/lib/unified-migrator/parsers/cisco-asa';
import { FortigateParser } from '@/lib/unified-migrator/parsers/fortigate';
import { CheckpointParser } from '@/lib/unified-migrator/parsers/checkpoint';
import { PanosParser } from '@/lib/unified-migrator/parsers/pan-os';
import { getGenerator } from '@/lib/unified-migrator/generators/index';
import { PostValidator } from '@/lib/unified-migrator/validators/post-validate';
import { detectVendor, detectVersion } from '@/lib/unified-migrator/ingestion/detect';
import { lintInput } from '@/lib/unified-migrator/ingestion/lint';
import {
  createVersionProfile,
  normalizeIr,
  parseVersionInfo,
  scrubSensitiveContent,
} from '@/lib/unified-migrator/utils';
import { dedupeIr } from '@/lib/unified-migrator/dedup';
import {
  DEFAULT_MIGRATION_OPTIONS,
  type GeneratedArtifact,
  type ManagementWarning,
  type MigrationOptions,
  type MigrationRunResult,
  type ParseInput,
  type ParseResult,
  type TargetVendor,
} from '@/lib/unified-migrator/types';

/**
 * Main entry point — runs the full migration pipeline.
 */
export function runMigration(
  input: ParseInput,
  targetVendor: TargetVendor = 'pan-os',
  options: MigrationOptions = DEFAULT_MIGRATION_OPTIONS
): MigrationRunResult {
  // 0. Security — proactive scrubbing
  input.content = scrubSensitiveContent(input.content);

  // 1. Ingest — detect vendor & version
  const detectedVendor = detectVendor(input);
  const detectedVersionRaw = detectVersion(detectedVendor, input.content);
  const lintFindings = lintInput(detectedVendor, input);

  if (detectedVendor === 'unknown') {
    throw new Error(
      'Unsupported vendor. UnifiedMigrator supports Cisco ASA, FortiGate, Check Point, and PAN-OS text/XML exports.'
    );
  }

  // 2. Parse — dispatch to vendor parser
  const versionInfo = parseVersionInfo(detectedVendor, detectedVersionRaw);
  const profile = createVersionProfile(versionInfo);
  const parseResult = dispatchParser(input, detectedVendor, versionInfo, profile);

  // Merge lint findings from ingestion stage
  parseResult.lintFindings = [...parseResult.lintFindings, ...lintFindings];
  parseResult.detectedVendor = detectedVendor;
  parseResult.detectedVersion = detectedVersionRaw;
  parseResult.versionProfile = profile;

  // 3. Normalize IR
  normalizeIr(parseResult.ir);

  // 3b. Optional duplicate cleanup (opt-in via questionnaire)
  const dedupReport = dedupeIr(parseResult.ir, options.cleanupDuplicates);

  // 3c. Management-IP safety (PAN-OS target only — a real firewall you commit to)
  let managementWarning: ManagementWarning | undefined;
  if (targetVendor === 'pan-os') {
    if (options.managementIp.mode === 'assign' && options.managementIp.newIp) {
      managementWarning = {
        severity: 'medium',
        message: `A new management IP (${options.managementIp.newIp}) will be set in the generated config. Confirm it is reachable on your network before committing.`,
      };
    } else {
      managementWarning = {
        severity: 'high',
        message:
          'Management IP is carried over unchanged. If the target firewall uses a different management network, change the mgmt IP BEFORE committing — otherwise you will lose remote access after commit.',
      };
    }
  }

  // 4. Translate — generate target config
  const generator = getGenerator(targetVendor);
  const generatorOptions = { targetVendor, targetVersion: '10.1' };
  const generatedArtifacts = generator.generate(parseResult.ir, generatorOptions);

  // 5. Validate — post-generation checks
  const validator = new PostValidator();
  const validationReport = validator.validate(
    parseResult.ir,
    generatedArtifacts,
    parseResult
  );

  // 6. Report — build report & rollback artifacts
  const reportArtifact: GeneratedArtifact = {
    id: 'report-json',
    label: 'Migration Report',
    mimeType: 'application/json',
    fileName: 'unified-migrator-report.json',
    content: JSON.stringify(
      {
        parseResult: {
          detectedVendor: parseResult.detectedVendor,
          detectedVersion: parseResult.detectedVersion,
          coverage: parseResult.coverage,
          lintFindings: parseResult.lintFindings,
          unrecognizedLines: parseResult.unrecognizedLines,
        },
        validationReport,
      },
      null,
      2
    ),
  };

  const rollbackArtifact: GeneratedArtifact = {
    id: 'rollback-bundle',
    label: 'Rollback Bundle',
    mimeType: 'application/json',
    fileName: 'unified-migrator-rollback.json',
    content: JSON.stringify(
      {
        manifest: {
          sourceFileName: input.fileName,
          sourceVendor: parseResult.detectedVendor,
          sourceVersion: parseResult.detectedVersion,
          targetVendor,
          generatedAt: new Date().toISOString(),
          bundleType: 'rollback',
        },
        sourceConfig: scrubSensitiveContent(input.content),
      },
      null,
      2
    ),
  };

  return {
    parseResult,
    artifacts: [...generatedArtifacts, reportArtifact, rollbackArtifact],
    validationReport,
    dedupReport,
    managementWarning,
    options,
  };
}

// ── Parser dispatch ────────────────────────────────────────────

function dispatchParser(
  input: ParseInput,
  vendor: Exclude<typeof input.selectedVendor, 'unknown' | undefined>,
  versionInfo: ReturnType<typeof parseVersionInfo>,
  profile: ReturnType<typeof createVersionProfile>
): ParseResult {
  switch (vendor) {
    case 'cisco-asa':
      return new CiscoAsaParser(input, versionInfo, profile).parse();
    case 'fortigate':
      return new FortigateParser(input, versionInfo, profile).parse();
    case 'checkpoint':
      return new CheckpointParser(input, versionInfo, profile).parse();
    case 'pan-os':
      return new PanosParser(input, versionInfo, profile).parse();
    default:
      throw new Error(`No parser registered for vendor: ${vendor}`);
  }
}
