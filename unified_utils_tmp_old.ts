import {
  ConfidenceBucket,
  MigrationEntityBase,
  ParseException,
  SourceLineRange,
  SourceVendor,
} from '@/lib/unified-migrator/types';

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

export function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 63) || 'unnamed';
}

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

export function createEntityBase(
  name: string,
  sourceVendor: SourceVendor,
  sourceVersion: string,
  sourceLineRange: SourceLineRange,
  exceptions: ParseException[] = []
) {
  const confidence = computeConfidence(exceptions);

  return {
    name,
    sourceVendor,
    sourceVersion,
    sourceLineRange,
    exceptions,
    confidence,
    confidenceBucket: confidenceBucket(confidence),
  } satisfies Pick<
    MigrationEntityBase,
    | 'name'
    | 'sourceVendor'
    | 'sourceVersion'
    | 'sourceLineRange'
    | 'exceptions'
    | 'confidence'
    | 'confidenceBucket'
  >;
}

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

export function scrubSensitiveContent(content: string) {
  return content
    .replace(/(pre-shared-key|psk|password|passwd)\s+\S+/gi, '$1 [REDACTED]')
    .replace(/(set\s+(?:psksecret|password|passwd)\s+)"[^"]*"/gi, '$1 "[REDACTED]"');
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

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
      severity: exception.severity,
      reason: exception.reason,
      remediation: exception.remediation,
    }))
  );
}
