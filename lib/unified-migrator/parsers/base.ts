import {
  AddressGroup,
  AddressObject,
  ConversionClassification,
  CoverageCounters,
  InterfaceObject,
  LoggingProfile,
  MigrationIR,
  NatRule,
  ParseException,
  ParseInput,
  ParseResult,
  ParserLog,
  ReferenceMember,
  RuleEndpointSet,
  ScheduleObject,
  SecurityPolicy,
  ServiceGroup,
  ServiceObject,
  SourceAuditTrace,
  SourceVendor,
  StaticRoute,
  UnrecognizedLine,
  VersionInfo,
  VersionProfile,
  VpnObject,
  ZoneObject,
} from '@/lib/unified-migrator/types';
import {
  canonicalName,
  classifyEntity,
  computeConfidence,
  confidenceBucket,
  createReference,
  fingerprint,
  sanitizeName,
  uniqueName,
} from '@/lib/unified-migrator/utils';

export abstract class BaseParser {
  protected readonly lines: string[];
  protected readonly logs: ParserLog[] = [];
  protected readonly ir: MigrationIR;
  protected readonly names = new Set<string>();
  protected readonly unrecognizedLines: UnrecognizedLine[] = [];

  constructor(
    protected readonly input: ParseInput,
    protected readonly vendor: Exclude<SourceVendor, 'unknown'>,
    protected readonly versionInfo: VersionInfo,
    protected readonly profile: VersionProfile
  ) {
    this.lines = input.content.split(/\r?\n/);
    this.ir = {
      metadata: {
        sourceVendor: vendor,
        sourceVersion: versionInfo.raw,
        version: versionInfo,
        generatedAt: new Date().toISOString(),
      },
      addresses: [],
      addressGroups: [],
      services: [],
      serviceGroups: [],
      policies: [],
      natRules: [],
      interfaces: [],
      zones: [],
      staticRoutes: [],
      schedules: [],
      vpns: [],
      loggingProfiles: [],
    };
  }

  abstract parse(): ParseResult;

  // ── Logging ──────────────────────────────────────────────────

  protected info(message: string) {
    this.logs.push({ level: 'info', message });
  }

  protected warning(message: string) {
    this.logs.push({ level: 'warning', message });
  }

  protected trackUnrecognized(line: string, lineNumber: number) {
    this.unrecognizedLines.push({ line: lineNumber, content: line });
    this.logs.push({
      level: 'warning',
      message: `Line ${lineNumber}: unrecognized — ${line.slice(0, 120)}`,
    });
  }

  // ── Exception helpers ────────────────────────────────────────

  protected exception(
    code: string,
    category: ParseException['category'],
    severity: ParseException['severity'],
    construct: string,
    reason: string,
    remediation: string,
    rawContext?: string
  ): ParseException {
    return {
      code,
      category,
      severity,
      construct,
      reason,
      remediation,
      rawContext,
      silentlyDropped: false,
    };
  }

  // ── Reference helpers ────────────────────────────────────────

  protected reference(
    kind: ReferenceMember['kind'],
    originalName: string,
    explicitRef?: string
  ): ReferenceMember {
    return createReference(kind, originalName, explicitRef);
  }

  protected anySet(): RuleEndpointSet {
    return {
      refs: [createReference('literal', 'any', 'any')],
      includesAny: true,
    };
  }

  protected resolveLiteralMembers(
    values: string[],
    kind: ReferenceMember['kind']
  ): RuleEndpointSet {
    if (
      values.length === 0 ||
      values.includes('any') ||
      values.includes('Any') ||
      values.includes('all') ||
      values.includes('ALL')
    ) {
      return this.anySet();
    }
    return {
      refs: values.map((value) => this.reference(kind, value)),
      includesAny: false,
    };
  }

  // ── Entity base ──────────────────────────────────────────────

  protected entityBase(
    name: string,
    start: number,
    end = start,
    exceptions: ParseException[] = [],
    order?: number
  ) {
    const confidence = computeConfidence(exceptions);
    const safe = canonicalName(name);
    const lineRange = { start, end };
    const classification = classifyEntity(exceptions);
    const auditTrace: SourceAuditTrace = {
      sourceEntity: name,
      sourceVendor: this.vendor,
      sourceLines: lineRange,
    };

    return {
      id: `${this.vendor}:${safe}:${start}`,
      name,
      canonicalName: safe,
      sourceName: name,
      sourceVendor: this.vendor,
      sourceVersion: this.versionInfo.raw,
      sourceLineRange: lineRange,
      order,
      fingerprint: fingerprint([this.vendor, name, start, end]),
      exceptions,
      confidence,
      confidenceBucket: confidenceBucket(confidence),
      classification,
      sourceAuditTrace: auditTrace,
    };
  }

  // ── Finalize helpers ─────────────────────────────────────────

  protected finalizeEntity<
    T extends { exceptions: ParseException[]; confidence?: number }
  >(entity: T): T {
    const confidence = computeConfidence(entity.exceptions);
    return {
      ...entity,
      confidence,
      confidenceBucket: confidenceBucket(confidence),
      classification: classifyEntity(entity.exceptions),
    };
  }

  protected pushAddress(entity: AddressObject) {
    this.ir.addresses.push(this.finalizeEntity(entity));
  }

  protected pushAddressGroup(entity: AddressGroup) {
    this.ir.addressGroups.push(this.finalizeEntity(entity));
  }

  protected pushService(entity: ServiceObject) {
    this.ir.services.push(this.finalizeEntity(entity));
  }

  protected pushServiceGroup(entity: ServiceGroup) {
    this.ir.serviceGroups.push(this.finalizeEntity(entity));
  }

  protected pushPolicy(entity: SecurityPolicy) {
    this.ir.policies.push(this.finalizeEntity(entity));
  }

  protected pushNatRule(entity: NatRule) {
    this.ir.natRules.push(this.finalizeEntity(entity));
  }

  protected pushInterface(entity: InterfaceObject) {
    this.ir.interfaces.push(this.finalizeEntity(entity));
  }

  protected pushZone(entity: ZoneObject) {
    this.ir.zones.push(this.finalizeEntity(entity));
  }

  protected pushStaticRoute(entity: StaticRoute) {
    this.ir.staticRoutes.push(this.finalizeEntity(entity));
  }

  protected pushSchedule(entity: ScheduleObject) {
    this.ir.schedules.push(this.finalizeEntity(entity));
  }

  protected pushVpn(entity: VpnObject) {
    this.ir.vpns.push(this.finalizeEntity(entity));
  }

  protected pushLoggingProfile(entity: LoggingProfile) {
    this.ir.loggingProfiles.push(this.finalizeEntity(entity));
  }

  // ── Unique name delegation ────────────────────────────────────

  protected uniqueName(raw: string) {
    return uniqueName(this.names, raw);
  }

  // ── Build result ──────────────────────────────────────────────

  protected buildResult(): ParseResult {
    const coverage = coverageFromIr(this.ir);
    return {
      ir: this.ir,
      parserLogs: this.logs,
      lintFindings: [],
      detectedVendor: this.vendor,
      detectedVersion: this.versionInfo.raw,
      coverage,
      versionProfile: this.profile,
      unrecognizedLines: this.unrecognizedLines,
    };
  }
}

export function coverageFromIr(ir: MigrationIR): CoverageCounters {
  const byParsed = <T extends { exceptions: ParseException[] }>(items: T[]) => ({
    parsed: items.filter((item) => item.exceptions.length === 0).length,
    total: items.length,
  });

  return {
    addresses: byParsed(ir.addresses),
    addressGroups: byParsed(ir.addressGroups),
    services: byParsed(ir.services),
    serviceGroups: byParsed(ir.serviceGroups),
    policies: byParsed(ir.policies),
    natRules: byParsed(ir.natRules),
    interfaces: byParsed(ir.interfaces),
    zones: byParsed(ir.zones),
    staticRoutes: byParsed(ir.staticRoutes),
    schedules: byParsed(ir.schedules),
    vpns: byParsed(ir.vpns),
    loggingProfiles: byParsed(ir.loggingProfiles),
  };
}
