// ────────────────────────────────────────────────────────────────
// Panorama → Strata Cloud Manager (SCM) — Type Definitions
// ────────────────────────────────────────────────────────────────
//
// Two models live here:
//
//   PanoramaModel — a hierarchy-aware representation of a Panorama
//   running-config XML export (templates, template-stacks,
//   device-groups, shared, pre/post rulebases).
//
//   ScmModel — the Strata Cloud Manager configuration model that we
//   migrate INTO: a Folder hierarchy + reusable Snippets + scoped
//   objects and rulebases. This is what the generator serializes.
//
// The bridge between them (mapper.ts) and the limitation-remediation
// engine (limitations.ts) are what let us "overcome" the constraints
// the SCM onboarding tool flags (the SCM### codes).
//

// ── Shared primitives ───────────────────────────────────────────

export type ScmRuleType = 'security' | 'nat';
export type ScmRulebasePhase = 'pre' | 'post';

/** Where an object/rule lives once migrated into SCM. */
export type ScmScopeKind = 'global' | 'snippet' | 'folder';

export interface ScmScope {
  kind: ScmScopeKind;
  /** Folder or snippet name; undefined for 'global'. */
  name?: string;
}

// ── Panorama-side model (parser output) ─────────────────────────

export interface PanAddress {
  name: string;
  type: 'ip-netmask' | 'ip-range' | 'ip-wildcard' | 'fqdn';
  value: string;
  description?: string;
  tags: string[];
}

export interface PanGroupMember {
  name: string;
}

export interface PanAddressGroup {
  name: string;
  /** static member names, or undefined when this is a dynamic group. */
  staticMembers?: string[];
  /** dynamic-address-group match expression (tag-based), if any. */
  dynamicFilter?: string;
  description?: string;
  tags: string[];
}

export interface PanService {
  name: string;
  protocol: 'tcp' | 'udp' | 'other';
  port?: string;
  sourcePort?: string;
  description?: string;
  tags: string[];
}

export interface PanServiceGroup {
  name: string;
  members: string[];
  tags: string[];
}

export interface PanApplicationGroup {
  name: string;
  members: string[];
}

export interface PanTag {
  name: string;
  color?: string;
  comments?: string;
}

export interface PanExternalList {
  name: string;
  type: 'ip' | 'domain' | 'url' | 'unknown';
  url?: string;
  recurring?: string;
  description?: string;
}

export interface PanSchedule {
  name: string;
  kind: 'recurring' | 'non-recurring' | 'unknown';
  raw: string;
}

export interface PanRuleEndpoint {
  /** member names; ['any'] means any. */
  members: string[];
}

export interface PanSecurityRule {
  name: string;
  uuid?: string;
  fromZones: string[];
  toZones: string[];
  source: string[];
  destination: string[];
  sourceUser: string[];
  application: string[];
  service: string[];
  category: string[];
  action: string;
  disabled: boolean;
  logStart: boolean;
  logEnd: boolean;
  logForwarding?: string;
  profileSetting?: string;
  profileGroup?: string;
  schedule?: string;
  tags: string[];
  groupTag?: string;       // group-by-tag (SCM193)
  negateSource: boolean;
  negateDestination: boolean;
  description?: string;
  /** per-rule target/devices scoping (SCM112). */
  target?: PanRuleTarget;
  /** saas-user-list reference (SCM117). */
  saasUserList?: string;
  rulebase: ScmRulebasePhase;
}

export interface PanRuleTarget {
  /** explicit firewall serials this rule targets. */
  devices: string[];
  /** when true the rule applies to all EXCEPT the listed devices. */
  negate: boolean;
}

export interface PanNatRule {
  name: string;
  uuid?: string;
  fromZones: string[];
  toZones: string[];
  source: string[];
  destination: string[];
  service?: string;
  sourceTranslation?: PanNatTranslation;
  destinationTranslation?: PanNatTranslation;
  bidirectional: boolean;
  disabled: boolean;
  tags: string[];
  description?: string;
  target?: PanRuleTarget;  // SCM112
  rulebase: ScmRulebasePhase;
}

export interface PanNatTranslation {
  kind: 'static-ip' | 'dynamic-ip' | 'dynamic-ip-and-port' | 'static' | 'destination' | 'unknown';
  translatedAddress?: string[];
  translatedPort?: string;
  /** for dynamic-ip-and-port using the egress interface address. */
  interface?: string;
}

/** A bag of objects + rulebases — used by both shared and each device-group. */
export interface PanObjectBag {
  addresses: PanAddress[];
  addressGroups: PanAddressGroup[];
  services: PanService[];
  serviceGroups: PanServiceGroup[];
  applicationGroups: PanApplicationGroup[];
  tags: PanTag[];
  externalLists: PanExternalList[];
  schedules: PanSchedule[];
  preSecurity: PanSecurityRule[];
  postSecurity: PanSecurityRule[];
  preNat: PanNatRule[];
  postNat: PanNatRule[];
}

export interface PanDeviceGroup {
  name: string;
  parent?: string;            // parent device-group (hierarchy)
  objects: PanObjectBag;
  /** user-id master device (SCM115). */
  userIdMasterDevice?: string;
  /** member firewall serials, if listed under <devices>. */
  deviceSerials: string[];
}

export interface PanStaticRouteEntry {
  name: string;
  destination: string;
  nexthopType: 'ip-address' | 'next-vr' | 'fqdn' | 'discard' | 'none';
  nexthop?: string;
  interface?: string;
  metric?: string;
  adminDistance?: string;
}

export interface PanVirtualRouter {
  name: string;
  staticRoutes: PanStaticRouteEntry[];
  hasBgp: boolean;
  interfaces: string[];
}

export interface PanInterface {
  name: string;
  ip?: string;
  template: string;
  comment?: string;
}

export interface PanClientlessApp {
  name: string;
  url?: string;
  gateway: string;
  template: string;
}

export interface PanTemplate {
  name: string;
  /** raw network/device config blocks we carry as snippet content. */
  hasGroupMapping: boolean;       // SCM68
  hasCloudIdentityEngine: boolean; // SCM121
  bgpAddressFamilies: string[];   // SCM142
  virtualRouterNames: string[];   // SCM144 context
  virtualRouters: PanVirtualRouter[]; // SCM144 — parsed for auto-migration
  gpDefaultBrowser: boolean;      // SCM140
  zones: string[];
  interfaces: string[];
  interfaceDetails: PanInterface[]; // name + IP, for interface-IP migration
  clientlessApps: PanClientlessApp[]; // SCM137 — GP Clientless VPN apps
  rawXml: string;
}

export interface PanTemplateStack {
  name: string;
  templates: string[];   // member template names, in priority order
  deviceSerials: string[];
}

export interface PanoramaModel {
  hostname: string;
  swVersion: string;
  shared: PanObjectBag;
  deviceGroups: PanDeviceGroup[];
  templates: PanTemplate[];
  templateStacks: PanTemplateStack[];
  /** parse-time notes / unrecognized constructs. */
  notes: string[];
}

// ── Remediation channel (the SCM### engine output) ──────────────

export type RemediationStatus = 'auto-remapped' | 'flagged' | 'informational';

export interface Remediation {
  /** SCM onboarding-tool code, e.g. 'SCM112'. */
  code: string;
  feature: string;
  status: RemediationStatus;
  /** human-readable: what we did, or what the user must do. */
  detail: string;
  /** where it applies (folder/snippet/rule names). */
  locations: string[];
  /** the SCM-supported alternative we applied or recommend. */
  scmAlternative: string;
  severity: ExceptionLevel;
}

export type ExceptionLevel = 'high' | 'medium' | 'low';

// ── SCM-side model (mapper output → generator input) ────────────

export interface ScmObjectBag {
  addresses: PanAddress[];
  addressGroups: PanAddressGroup[];
  services: PanService[];
  serviceGroups: PanServiceGroup[];
  applicationGroups: PanApplicationGroup[];
  tags: PanTag[];
  externalLists: PanExternalList[];
  schedules: PanSchedule[];
}

/** An SCM logical router migrated from a Panorama virtual router. */
export interface ScmLogicalRouter {
  name: string;
  fromTemplate: string;
  staticRoutes: PanStaticRouteEntry[];
  hasBgp: boolean;
}

/** Per-section coverage cross-check (independent raw count vs parsed). */
export interface CoverageRow {
  section: string;
  rawEntries: number;
  parsed: number;
}

export interface ScmRule {
  name: string;
  type: ScmRuleType;
  phase: ScmRulebasePhase;
  /** the original Panorama rule, post-remediation. */
  security?: PanSecurityRule;
  nat?: PanNatRule;
}

export interface ScmFolder {
  name: string;
  parent?: string;
  /** snippets pushed to this folder (template-stack mapping). */
  snippets: string[];
  objects: ScmObjectBag;
  rules: ScmRule[];
  /** firewall serials that landed in this folder (informational). */
  deviceSerials: string[];
  /** notes about how this folder was derived. */
  source: string;
}

export interface ScmSnippet {
  name: string;
  /** derived from a Panorama template or template-stack. */
  source: 'template' | 'template-stack';
  objects: ScmObjectBag;
  /** config notes carried for the user (network/zone/interface summary). */
  configNotes: string[];
}

/** Mobile Users → Clientless VPN (or Explicit Proxy) mapped from GP clientless config. */
export interface ScmClientlessVpn {
  target: import('@/lib/unified-migrator/types').ClientlessVpnTarget;
  applications: PanClientlessApp[];
}

export interface ScmModel {
  /** the Global (shared) scope. */
  global: ScmObjectBag;
  folders: ScmFolder[];
  snippets: ScmSnippet[];
  logicalRouters: ScmLogicalRouter[];
  interfaces: PanInterface[];
  clientlessVpn?: ScmClientlessVpn;
  remediations: Remediation[];
  coverage: CoverageRow[];
  dedup?: import('@/lib/unified-migrator/types').DedupReport;
  stats: ScmStats;
}

export interface ScmStats {
  folders: number;
  snippets: number;
  addresses: number;
  addressGroups: number;
  services: number;
  serviceGroups: number;
  applicationGroups: number;
  securityRules: number;
  natRules: number;
  logicalRouters: number;
  staticRoutes: number;
  autoRemapped: number;
  flagged: number;
}

// ── Pipeline result ─────────────────────────────────────────────

export interface ScmArtifact {
  id: string;
  label: string;
  mimeType: string;
  fileName: string;
  content: string;
}

export interface ScmMigrationResult {
  panorama: PanoramaModel;
  scm: ScmModel;
  artifacts: ScmArtifact[];
}
