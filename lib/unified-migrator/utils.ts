import {
  CategoryConfidence,
  ConfidenceBucket,
  ConversionClassification,
  ExceptionCategory,
  MigrationEntityBase,
  MigrationIR,
  ParseException,
  ReferenceMember,
  SourceLineRange,
  SourceVendor,
  TargetVendor,
  VersionInfo,
  VersionProfile,
} from '@/lib/unified-migrator/types';

// ── Confidence ─────────────────────────────────────────────────

export function confidenceBucket(score: number): ConfidenceBucket {
  if (score >= 85) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

export function computeConfidence(exceptions: ParseException[]): number {
  if (exceptions.length === 0) return 100;
  const penalty = exceptions.reduce((total, exception) => {
    switch (exception.severity) {
      case 'high':
        return total + 35;
      case 'medium':
        return total + 15;
      default:
        return total + 5;
    }
  }, 0);
  return Math.max(0, 100 - penalty);
}

// ── Classification ─────────────────────────────────────────────

export function classifyEntity(
  exceptions: ParseException[]
): ConversionClassification {
  if (exceptions.length === 0) return 'exact';
  const hasHigh = exceptions.some((e) => e.severity === 'high');
  const hasUnsupported = exceptions.some(
    (e) => e.category === 'unsupported'
  );
  if (hasUnsupported) return 'unsupported';
  if (hasHigh) return 'manual_review';
  return 'partial';
}

// ── Naming ─────────────────────────────────────────────────────

const PANOS_RESERVED = new Set([
  'any', 'all', 'none', 'application-default', 'default',
  'trust', 'untrust', 'dmz', 'loopback', 'tunnel',
]);

const ASA_RESERVED = new Set([
  'any', 'any4', 'any6', 'host', 'interface',
]);

const FORTI_RESERVED = new Set([
  'all', 'none', 'ALL', 'NONE',
]);

export function sanitizeName(name: string, targetVendor?: TargetVendor) {
  const maxLen = targetVendor === 'fortigate' ? 79 : 63;
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, maxLen) || 'unnamed';
}

export function canonicalName(name: string) {
  return sanitizeName(name).toLowerCase();
}

export function detectReservedKeywordCollision(
  name: string,
  targetVendor: TargetVendor
): boolean {
  const lower = name.toLowerCase();
  switch (targetVendor) {
    case 'pan-os':
      return PANOS_RESERVED.has(lower);
    case 'cisco-asa':
      return ASA_RESERVED.has(lower);
    case 'fortigate':
      return FORTI_RESERVED.has(name);
    default:
      return false;
  }
}

export function uniqueName(registry: Set<string>, rawName: string) {
  let candidate = rawName.trim() || 'unnamed';
  let suffix = 1;
  while (registry.has(candidate)) {
    candidate = `${rawName}_dup${suffix}`;
    suffix += 1;
  }
  registry.add(candidate);
  return candidate;
}

export function resolveNamingConflicts(ir: MigrationIR, targetVendor: TargetVendor) {
  const globalNames = new Set<string>();
  const rename = (entity: MigrationEntityBase) => {
    let safe = sanitizeName(entity.name, targetVendor);
    if (detectReservedKeywordCollision(safe, targetVendor)) {
      safe = `obj_${safe}`;
    }
    let candidate = safe;
    let suffix = 1;
    while (globalNames.has(candidate)) {
      candidate = `${safe}_${suffix}`;
      suffix += 1;
    }
    globalNames.add(candidate);
    entity.name = candidate;
    entity.canonicalName = candidate.toLowerCase();
  };

  const allEntities = [
    ...ir.addresses,
    ...ir.addressGroups,
    ...ir.services,
    ...ir.serviceGroups,
    ...ir.policies,
    ...ir.natRules,
    ...ir.interfaces,
    ...ir.zones,
    ...ir.staticRoutes,
    ...ir.schedules,
    ...ir.vpns,
    ...ir.loggingProfiles,
  ];

  allEntities.forEach(rename);
}

// ── XML ────────────────────────────────────────────────────────

export function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return character;
    }
  });
}

// ── Fingerprint ────────────────────────────────────────────────

export function fingerprint(parts: Array<string | number | undefined>) {
  return parts
    .filter((part) => part !== undefined && part !== '')
    .map((part) => String(part).trim())
    .join('|');
}

// ── Reference helpers ──────────────────────────────────────────

export function createReference(
  kind: ReferenceMember['kind'],
  originalName: string,
  explicitRef?: string
): ReferenceMember {
  return {
    ref: explicitRef || canonicalName(originalName),
    kind,
    originalName,
  };
}

export function createAnySet() {
  return {
    refs: [createReference('literal', 'any', 'any')],
    includesAny: true,
  };
}

// ── Entity factory ─────────────────────────────────────────────

export function createEntityBase(
  name: string,
  sourceVendor: SourceVendor,
  sourceVersion: string,
  sourceLineRange: SourceLineRange,
  exceptions: ParseException[] = [],
  order?: number
) {
  const confidence = computeConfidence(exceptions);
  const safeCanonicalName = canonicalName(name);

  return {
    id: `${sourceVendor}:${safeCanonicalName}:${sourceLineRange.start}`,
    name,
    canonicalName: safeCanonicalName,
    sourceName: name,
    sourceVendor,
    sourceVersion,
    sourceLineRange,
    order,
    fingerprint: fingerprint([
      sourceVendor,
      name,
      sourceLineRange.start,
      sourceLineRange.end,
    ]),
    exceptions,
    confidence,
    confidenceBucket: confidenceBucket(confidence),
    classification: classifyEntity(exceptions),
    sourceAuditTrace: {
      sourceEntity: name,
      sourceVendor,
      sourceLines: sourceLineRange,
    },
  };
}

export function createException(
  code: string,
  category: ExceptionCategory,
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

// ── CIDR helpers ───────────────────────────────────────────────

export function cidrFromMask(mask: string) {
  const octets = mask.split('.');
  if (octets.length !== 4) return '32';
  return String(
    octets.reduce((total, octet) => {
      const bits = Number.parseInt(octet, 10).toString(2);
      return total + bits.split('').filter((value) => value === '1').length;
    }, 0)
  );
}

export function cidrFromWildcard(mask: string) {
  const octets = mask.split('.');
  if (octets.length !== 4) return '32';
  return String(
    octets.reduce((total, octet) => {
      const bits = (255 - Number.parseInt(octet, 10)).toString(2);
      return total + bits.split('').filter((value) => value === '1').length;
    }, 0)
  );
}

// ── Version helpers ────────────────────────────────────────────

export function parseVersionInfo(vendor: SourceVendor, raw: string): VersionInfo {
  const match = raw.match(/(\d+)(?:\.(\d+))?/);
  return {
    vendor,
    raw,
    family: raw,
    major: match ? Number(match[1]) : undefined,
    minor: match?.[2] ? Number(match[2]) : undefined,
  };
}

export function createVersionProfile(version: VersionInfo): VersionProfile {
  const major = version.major ?? 0;
  if (version.vendor === 'cisco-asa') {
    return {
      vendor: 'cisco-asa',
      family: version.raw,
      features: {
        objectNat: major >= 8,
        manualNat: major >= 8,
        fqdnObjects: major >= 8,
      },
    };
  }
  if (version.vendor === 'fortigate') {
    return {
      vendor: 'fortigate',
      family: version.raw,
      features: {
        centralSnat: major >= 5,
        vipPortForward: major >= 5,
        schedules: true,
      },
    };
  }
  if (version.vendor === 'checkpoint') {
    return {
      vendor: 'checkpoint',
      family: version.raw,
      features: {
        mgmtApiExports: true,
        natRules: true,
      },
    };
  }
  return {
    vendor: 'pan-os',
    family: version.raw,
    features: {
      xmlConfig: true,
      rulebase: true,
      natRules: true,
    },
  };
}

// ── IR Normalization ───────────────────────────────────────────

export function normalizeIr(ir: MigrationIR) {
  const sortedReferences = (refs: ReferenceMember[]) =>
    [...refs].sort((left, right) =>
      `${left.kind}:${left.ref}:${left.originalName}`.localeCompare(
        `${right.kind}:${right.ref}:${right.originalName}`
      )
    );

  ir.addresses.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.addressGroups.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.services.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.serviceGroups.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.interfaces.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.zones.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.staticRoutes.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.schedules.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.vpns.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.loggingProfiles.sort((l, r) => l.canonicalName.localeCompare(r.canonicalName));
  ir.policies.sort((l, r) => l.order - r.order);
  ir.natRules.sort((l, r) => l.order - r.order);

  ir.addressGroups.forEach((group) => {
    group.members = sortedReferences(group.members);
    group.fingerprint = fingerprint([
      group.canonicalName,
      ...group.members.map((m) => `${m.kind}:${m.ref}`),
    ]);
  });
  ir.serviceGroups.forEach((group) => {
    group.members = sortedReferences(group.members);
    group.fingerprint = fingerprint([
      group.canonicalName,
      ...group.members.map((m) => `${m.kind}:${m.ref}`),
    ]);
  });
  ir.zones.forEach((zone) => {
    zone.interfaces = sortedReferences(zone.interfaces);
  });

  ir.metadata.normalizedAt = new Date().toISOString();
  ir.categoryConfidence = calculateCategoryConfidence(ir);
  return ir;
}

export function calculateCategoryConfidence(ir: MigrationIR): CategoryConfidence {
  const average = (items: Array<{ confidence: number }>) =>
    items.length > 0
      ? Math.round(items.reduce((t, i) => t + i.confidence, 0) / items.length)
      : 100;

  return {
    addresses: average(ir.addresses),
    addressGroups: average(ir.addressGroups),
    services: average(ir.services),
    serviceGroups: average(ir.serviceGroups),
    policies: average(ir.policies),
    natRules: average(ir.natRules),
    interfaces: average(ir.interfaces),
    zones: average(ir.zones),
    staticRoutes: average(ir.staticRoutes),
    schedules: average(ir.schedules),
    vpns: average(ir.vpns),
    loggingProfiles: average(ir.loggingProfiles),
  };
}

// ── Sensitive content scrubbing ────────────────────────────────

export function scrubSensitiveContent(content: string) {
  return content
    .replace(/(pre-shared-key|psk|password|passwd)\s+\S+/gi, '$1 [REDACTED]')
    .replace(/(set\s+(?:psksecret|password|passwd)\s+)"[^"]*"/gi, '$1 "[REDACTED]"');
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

// ── Exception flattening ───────────────────────────────────────

export function flattenExceptions(
  entityType: string,
  entities: Array<{
    name: string;
    exceptions: ParseException[];
  }>
) {
  return entities.flatMap((entity) =>
    entity.exceptions.map((exception) => ({
      entityType,
      entityName: entity.name,
      category: exception.category,
      severity: exception.severity,
      code: exception.code,
      reason: exception.reason,
      remediation: exception.remediation,
    }))
  );
}

// ── All entities helper ────────────────────────────────────────

export function allEntities(ir: MigrationIR) {
  return [
    ...ir.addresses,
    ...ir.addressGroups,
    ...ir.services,
    ...ir.serviceGroups,
    ...ir.policies,
    ...ir.natRules,
    ...ir.interfaces,
    ...ir.zones,
    ...ir.staticRoutes,
    ...ir.schedules,
    ...ir.vpns,
    ...ir.loggingProfiles,
  ];
}
