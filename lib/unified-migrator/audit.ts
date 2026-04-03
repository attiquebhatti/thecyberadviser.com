import {
  UnifiedMigratorPermission,
  UnifiedMigratorRole,
  UnifiedMigratorUser,
} from '@/lib/unified-migrator/rbac';

export interface AuditActor {
  id: string;
  name: string;
  role: UnifiedMigratorRole;
}

export interface UnifiedMigratorAuditEvent {
  id: string;
  timestamp: string;
  actor: AuditActor;
  action: string;
  permission?: UnifiedMigratorPermission;
  target: string;
  outcome: 'allowed' | 'denied';
  detail?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const AUDIT_STORE_KEY = '__unifiedMigratorAuditStore';

function getAuditStore() {
  const globalStore = globalThis as typeof globalThis & {
    [AUDIT_STORE_KEY]?: UnifiedMigratorAuditEvent[];
  };

  if (!globalStore[AUDIT_STORE_KEY]) {
    globalStore[AUDIT_STORE_KEY] = [];
  }

  return globalStore[AUDIT_STORE_KEY]!;
}

export function recordAuditEvent(
  actor: UnifiedMigratorUser,
  event: Omit<UnifiedMigratorAuditEvent, 'id' | 'timestamp' | 'actor'>
) {
  const record: UnifiedMigratorAuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    actor: {
      id: actor.id,
      name: actor.name,
      role: actor.role,
    },
    ...event,
  };

  getAuditStore().push(record);
  return record;
}

export function listAuditEvents() {
  return [...getAuditStore()].sort((left, right) =>
    right.timestamp.localeCompare(left.timestamp)
  );
}

export function exportAuditEvents() {
  return JSON.stringify(listAuditEvents(), null, 2);
}
