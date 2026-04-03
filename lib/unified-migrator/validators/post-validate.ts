import {
  ClassificationSummary,
  ConfidenceSummary,
  EntitySummaryRow,
  ExceptionReportItem,
  GeneratedArtifact,
  MigrationIR,
  ParseResult,
  SemanticFinding,
  ValidationFinding,
  ValidationReport,
  Validator,
} from '@/lib/unified-migrator/types';
import {
  allEntities,
  calculateCategoryConfidence,
  confidenceBucket,
  flattenExceptions,
} from '@/lib/unified-migrator/utils';

export class PostValidator implements Validator {
  validate(
    ir: MigrationIR,
    artifacts: GeneratedArtifact[],
    parseResult: ParseResult
  ): ValidationReport {
    const findings: ValidationFinding[] = [
      ...this.syntaxFindings(artifacts),
      ...this.namingFindings(ir),
      ...this.semanticFindings(ir),
      ...this.coverageFindings(parseResult),
    ];

    const semanticResults = this.semanticEquivalenceCheck(ir);
    const classification = this.buildClassificationSummary(ir);
    const summary = this.buildEntitySummary(parseResult);
    const overallAutomatedRate = this.computeOverallRate(summary);
    const confidence = this.buildConfidenceSummary(ir);
    const categoryConfidence = calculateCategoryConfidence(ir);

    const exceptions: ExceptionReportItem[] = [
      ...flattenExceptions('address', ir.addresses),
      ...flattenExceptions('addressGroup', ir.addressGroups),
      ...flattenExceptions('service', ir.services),
      ...flattenExceptions('serviceGroup', ir.serviceGroups),
      ...flattenExceptions('policy', ir.policies),
      ...flattenExceptions('natRule', ir.natRules),
      ...flattenExceptions('interface', ir.interfaces),
      ...flattenExceptions('zone', ir.zones),
      ...flattenExceptions('staticRoute', ir.staticRoutes),
      ...flattenExceptions('schedule', ir.schedules),
      ...flattenExceptions('vpn', ir.vpns),
      ...flattenExceptions('loggingProfile', ir.loggingProfiles),
    ];

    const xmlArtifact = artifacts.find((a) => a.id === 'panos-xml');
    const syntaxValid = xmlArtifact
      ? this.syntaxFindings(artifacts).filter((f) => f.severity === 'high').length === 0
      : true;

    return {
      syntaxValid,
      summary,
      overallAutomatedRate,
      confidence,
      categoryConfidence,
      classificationSummary: classification,
      semanticFindings: semanticResults,
      exceptions,
      findings,
    };
  }

  // ── Syntax findings ──────────────────────────────────────────

  private syntaxFindings(artifacts: GeneratedArtifact[]): ValidationFinding[] {
    const findings: ValidationFinding[] = [];
    const xml = artifacts.find((a) => a.id === 'panos-xml');
    if (!xml) return findings;

    if (!xml.content.startsWith('<?xml')) {
      findings.push({
        severity: 'high',
        category: 'syntax',
        title: 'Missing XML declaration',
        detail: 'Generated PAN-OS XML does not begin with an XML declaration.',
      });
    }

    const configOpen = (xml.content.match(/<config\b/g) || []).length;
    const configClose = (xml.content.match(/<\/config>/g) || []).length;
    if (configOpen !== configClose) {
      findings.push({
        severity: 'high',
        category: 'syntax',
        title: 'Unbalanced config root',
        detail: 'Generated XML has mismatched <config> tags.',
      });
    }

    return findings;
  }

  // ── Naming findings ──────────────────────────────────────────

  private namingFindings(ir: MigrationIR): ValidationFinding[] {
    const findings: ValidationFinding[] = [];
    const names = new Set<string>();

    for (const entity of allEntities(ir)) {
      if (names.has(entity.name)) {
        findings.push({
          severity: 'medium',
          category: 'naming',
          title: 'Duplicate logical name detected',
          detail: `${entity.name} appears more than once in the normalized IR.`,
        });
      }
      names.add(entity.name);
    }

    return findings;
  }

  // ── Semantic findings ────────────────────────────────────────

  private semanticFindings(ir: MigrationIR): ValidationFinding[] {
    const findings: ValidationFinding[] = [];

    ir.policies.forEach((policy) => {
      if (policy.service.includesAny && policy.action === 'allow') {
        findings.push({
          severity: 'medium',
          category: 'semantic',
          title: 'Broad allow rule',
          detail: `Policy ${policy.name} allows any service and should be reviewed for App-ID tightening.`,
        });
      }
    });

    ir.natRules.forEach((rule) => {
      if (rule.natType === 'unknown') {
        findings.push({
          severity: 'high',
          category: 'semantic',
          title: 'Unsupported NAT logic',
          detail: `NAT rule ${rule.name} requires manual rebuild in PAN-OS.`,
        });
      }
    });

    return findings;
  }

  // ── Coverage findings ────────────────────────────────────────

  private coverageFindings(parseResult: ParseResult): ValidationFinding[] {
    return Object.entries(parseResult.coverage)
      .filter(([, value]) => value.total > 0 && value.parsed < value.total)
      .map(([key, value]) => ({
        severity: 'low' as const,
        category: 'coverage' as const,
        title: `${key} need review`,
        detail: `${value.total - value.parsed} ${key} item(s) were only partially converted.`,
      }));
  }

  // ── Semantic equivalence ─────────────────────────────────────

  private semanticEquivalenceCheck(ir: MigrationIR): SemanticFinding[] {
    const findings: SemanticFinding[] = [];

    // Policy broadening detection
    ir.policies.forEach((policy) => {
      if (
        policy.source.includesAny &&
        policy.destination.includesAny &&
        policy.service.includesAny &&
        policy.action === 'allow'
      ) {
        findings.push({
          type: 'policy-broadening',
          severity: 'high',
          sourceEntity: policy.name,
          detail: `Policy ${policy.name} has any/any/any with allow — extremely broad.`,
          recommendation: 'Restrict source, destination, or service to reduce attack surface.',
        });
      }
    });

    // NAT drift detection
    ir.natRules.forEach((rule) => {
      if (rule.natType === 'unknown') {
        findings.push({
          type: 'nat-drift',
          severity: 'high',
          sourceEntity: rule.name,
          detail: `NAT rule ${rule.name} could not be classified and may cause drift.`,
          recommendation: 'Manually verify this NAT rule in the target platform.',
        });
      }
    });

    // Object expansion (flattened groups)
    ir.addressGroups.forEach((group) => {
      if (group.nestedDepth > 2) {
        findings.push({
          type: 'object-expansion',
          severity: 'medium',
          sourceEntity: group.name,
          detail: `Address group ${group.name} has nesting depth ${group.nestedDepth}. Flattening may change behavior.`,
          recommendation: 'Review the expanded membership after migration.',
        });
      }
    });

    return findings;
  }

  // ── Summary builders ─────────────────────────────────────────

  private buildEntitySummary(parseResult: ParseResult): EntitySummaryRow[] {
    return Object.entries(parseResult.coverage).map(([label, counter]) => ({
      label,
      total: counter.total,
      parsed: counter.parsed,
      automatedRate: counter.total > 0 ? Math.round((counter.parsed / counter.total) * 100) : 100,
    }));
  }

  private computeOverallRate(summary: EntitySummaryRow[]): number {
    const totalEntities = summary.reduce((acc, row) => acc + row.total, 0);
    const parsedEntities = summary.reduce((acc, row) => acc + row.parsed, 0);
    return totalEntities > 0 ? Math.round((parsedEntities / totalEntities) * 100) : 100;
  }

  private buildConfidenceSummary(ir: MigrationIR): ConfidenceSummary {
    const entities = allEntities(ir);
    return {
      high: entities.filter((e) => confidenceBucket(e.confidence) === 'high').length,
      medium: entities.filter((e) => confidenceBucket(e.confidence) === 'medium').length,
      low: entities.filter((e) => confidenceBucket(e.confidence) === 'low').length,
    };
  }

  private buildClassificationSummary(ir: MigrationIR): ClassificationSummary {
    const entities = allEntities(ir);
    return {
      exact: entities.filter((e) => e.classification === 'exact').length,
      partial: entities.filter((e) => e.classification === 'partial').length,
      manualReview: entities.filter((e) => e.classification === 'manual_review').length,
      unsupported: entities.filter((e) => e.classification === 'unsupported').length,
    };
  }
}
