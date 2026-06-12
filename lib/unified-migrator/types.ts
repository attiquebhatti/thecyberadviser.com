// ────────────────────────────────────────────────────────────────
// UnifiedMigrator — Canonical Type Definitions
// ────────────────────────────────────────────────────────────────

export type SourceVendor =
  | 'cisco-asa'
  | 'fortigate'
  | 'checkpoint'
  | 'pan-os'
  | 'unknown';

export type TargetVendor = 'pan-os' | 'cisco-asa' | 'fortigate' | 'checkpoint';

export type ConfidenceBucket = 'high' | 'medium' | 'low';

export type ExceptionSeverity = 'high' | 'medium' | 'low';

export type ConversionClassification =
  | 'exact'
  | 'partial'
  | 'manual_review'
  | 'unsupported';

export type ExceptionCategory =
  | 'syntax'
  | 'version'
  | 'unsupported'
  | 'lossiness'
  | 'naming'
  | 'normalization'
  | 'semantic';

export type NatRuleType =
  | 'static'
  | 'dynamic'
  | 'pat'
  | 'pat_interface'
  | 'static_pat'
  | 'dynamic_ippool'
  | 'identity'
  | 'hairpin'
  | 'unknown';

export interface SourceLineRange {
  start: number;
  end: number;
}

export interface ParseException {
  code: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  construct: string;
  reason: string;
  remediation: string;
  rawContext?: string;
  silentlyDropped: false;
}

export interface LintFinding {
  level: 'info' | 'warning' | 'error';
  message: string;
  line?: number;
}

export interface ParserLog {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface VersionInfo {
  vendor: SourceVendor;
  raw: string;
  family: string;
  major?: number;
  minor?: number;
}

export interface VersionProfile {
  vendor: Exclude<SourceVendor, 'unknown'>;
  family: string;
  features: Record<string, boolean>;
}

export interface ReferenceMember {
  ref: string;
  kind:
    | 'address'
    | 'address-group'
    | 'service'
    | 'service-group'
    | 'zone'
    | 'interface'
    | 'schedule'
    | 'vpn'
    | 'profile'
    | 'literal'
    | 'unknown';
  originalName: string;
}

export interface LoggingBehavior {
  atStart: boolean;
  atEnd: boolean;
  profile?: string;
  forwardingProfile?: string;
}

export interface ScheduleBinding {
  refs: string[];
  mode: 'always' | 'named';
}

export interface SourceAuditTrace {
  sourceEntity: string;
  sourceVendor: SourceVendor;
  sourceLines: SourceLineRange;
  targetEntity?: string;
  targetVendor?: TargetVendor;
}

export interface MigrationEntityBase {
  id: string;
  name: string;
  canonicalName: string;
  sourceName: string;
  sourceVendor: SourceVendor;
  sourceVersion: string;
  sourceLineRange: SourceLineRange;
  order?: number;
  fingerprint: string;
  exceptions: ParseException[];
  confidence: number;
  confidenceBucket: ConfidenceBucket;
  classification: ConversionClassification;
  sourceAuditTrace: SourceAuditTrace;
  description?: string;
}

export interface AddressObject extends MigrationEntityBase {
  type: 'ip-netmask' | 'ip-range' | 'fqdn';
  value: string;
}

export interface AddressGroup extends MigrationEntityBase {
  members: ReferenceMember[];
  nestedDepth: number;
}

export interface ServiceObject extends MigrationEntityBase {
  protocol: string;
  port: string;
  sourcePort?: string;
}

export interface ServiceGroup extends MigrationEntityBase {
  members: ReferenceMember[];
  nestedDepth: number;
}

export interface RuleEndpointSet {
  refs: ReferenceMember[];
  includesAny: boolean;
}

export interface SecurityPolicy extends MigrationEntityBase {
  order: number;
  from: RuleEndpointSet;
  to: RuleEndpointSet;
  source: RuleEndpointSet;
  destination: RuleEndpointSet;
  service: RuleEndpointSet;
  action: 'allow' | 'deny';
  disabled: boolean;
  logging: LoggingBehavior;
  schedule: ScheduleBinding;
  profiles: string[];
}

export interface PacketMatch {
  srcZone?: string;
  dstZone?: string;
  srcAddress?: string;
  dstAddress?: string;
  service?: string;
  port?: string;
}

export interface NatRule extends MigrationEntityBase {
  order: number;
  natType: NatRuleType;
  originalPacket: PacketMatch;
  translatedPacket: PacketMatch;
  bidirectional: boolean;
}

export interface InterfaceObject extends MigrationEntityBase {
  type: 'layer3';
  ip?: string;
  zone?: string;
}

export interface ZoneObject extends MigrationEntityBase {
  type: 'layer3';
  interfaces: ReferenceMember[];
}

export interface StaticRoute extends MigrationEntityBase {
  destination: string;
  nexthop: string;
  interface?: string;
  metric?: string;
}

export interface ScheduleObject extends MigrationEntityBase {
  mode: 'always' | 'recurring' | 'once' | 'unknown';
  rawDefinition: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: string[];
}

export interface VpnObject extends MigrationEntityBase {
  type: 'ipsec';
  peer?: string;
  ikeVersion?: 'ikev1' | 'ikev2' | 'unknown';
  tunnelInterface?: string;
  ikeProposal?: string;
  peerAddress?: string;
  localNetwork?: string;
  remoteNetwork?: string;
}

export interface LoggingProfile extends MigrationEntityBase {
  kind: 'log-forwarding' | 'vendor-native';
}

export interface UnrecognizedLine {
  line: number;
  content: string;
}

export interface CategoryConfidence {
  addresses: number;
  addressGroups: number;
  services: number;
  serviceGroups: number;
  policies: number;
  natRules: number;
  interfaces: number;
  zones: number;
  staticRoutes: number;
  schedules: number;
  vpns: number;
  loggingProfiles: number;
}

export interface MigrationIR {
  metadata: {
    sourceVendor: SourceVendor;
    sourceVersion: string;
    version: VersionInfo;
    generatedAt: string;
    normalizedAt?: string;
  };
  addresses: AddressObject[];
  addressGroups: AddressGroup[];
  services: ServiceObject[];
  serviceGroups: ServiceGroup[];
  policies: SecurityPolicy[];
  natRules: NatRule[];
  interfaces: InterfaceObject[];
  zones: ZoneObject[];
  staticRoutes: StaticRoute[];
  schedules: ScheduleObject[];
  vpns: VpnObject[];
  loggingProfiles: LoggingProfile[];
  categoryConfidence?: CategoryConfidence;
}

export interface CoverageCounters {
  addresses: { parsed: number; total: number };
  addressGroups: { parsed: number; total: number };
  services: { parsed: number; total: number };
  serviceGroups: { parsed: number; total: number };
  policies: { parsed: number; total: number };
  natRules: { parsed: number; total: number };
  interfaces: { parsed: number; total: number };
  zones: { parsed: number; total: number };
  staticRoutes: { parsed: number; total: number };
  schedules: { parsed: number; total: number };
  vpns: { parsed: number; total: number };
  loggingProfiles: { parsed: number; total: number };
}

export interface ParseInput {
  fileName: string;
  content: string;
  selectedVendor?: SourceVendor;
  targetVendor?: TargetVendor;
}

export interface ParseResult {
  ir: MigrationIR;
  parserLogs: ParserLog[];
  lintFindings: LintFinding[];
  detectedVendor: SourceVendor;
  detectedVersion: string;
  coverage: CoverageCounters;
  versionProfile?: VersionProfile;
  unrecognizedLines: UnrecognizedLine[];
}

export interface GeneratorOptions {
  targetVendor: TargetVendor;
  targetVersion: string;
}

export interface GeneratedArtifact {
  id: 'panos-xml' | 'panos-cli' | 'report-json' | 'rollback-bundle';
  label: string;
  mimeType: string;
  fileName: string;
  content: string;
}

export interface SemanticFinding {
  type: 'policy-broadening' | 'policy-narrowing' | 'nat-drift' | 'object-expansion' | 'coverage-gap';
  severity: ExceptionSeverity;
  sourceEntity: string;
  detail: string;
  recommendation: string;
}

export interface ValidationFinding {
  severity: 'high' | 'medium' | 'low';
  category: 'syntax' | 'naming' | 'coverage' | 'semantic';
  title: string;
  detail: string;
}

export interface ConfidenceSummary {
  high: number;
  medium: number;
  low: number;
}

export interface EntitySummaryRow {
  label: string;
  total: number;
  parsed: number;
  automatedRate: number;
}

export interface ClassificationSummary {
  exact: number;
  partial: number;
  manualReview: number;
  unsupported: number;
}

export interface ExceptionReportItem {
  entityType: string;
  entityName: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  code: string;
  reason: string;
  remediation: string;
}

export interface ValidationReport {
  syntaxValid: boolean;
  summary: EntitySummaryRow[];
  overallAutomatedRate: number;
  confidence: ConfidenceSummary;
  categoryConfidence: CategoryConfidence;
  classificationSummary: ClassificationSummary;
  semanticFindings: SemanticFinding[];
  exceptions: ExceptionReportItem[];
  findings: ValidationFinding[];
}

export interface ParserAdapter {
  vendor: Exclude<SourceVendor, 'unknown'>;
  parse(input: ParseInput, version: VersionInfo, profile: VersionProfile): ParseResult;
}

export interface GeneratorAdapter {
  generate(ir: MigrationIR, options: GeneratorOptions): GeneratedArtifact[];
}

export interface Validator {
  validate(
    ir: MigrationIR,
    artifacts: GeneratedArtifact[],
    parseResult: ParseResult
  ): ValidationReport;
}

export interface MigrationRunResult {
  parseResult: ParseResult;
  artifacts: GeneratedArtifact[];
  validationReport: ValidationReport;
}
