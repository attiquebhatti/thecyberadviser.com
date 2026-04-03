import { NextRequest, NextResponse } from 'next/server';

import { recordAuditEvent } from '@/lib/unified-migrator/audit';
import {
  assertPermission,
  DEFAULT_USERS,
  UnifiedMigratorPermission,
  UnifiedMigratorRole,
  UnifiedMigratorUser,
} from '@/lib/unified-migrator/rbac';

export function getRequestUser(request: NextRequest): UnifiedMigratorUser {
  const roleHeader = request.headers.get('x-unified-role') as UnifiedMigratorRole | null;
  const userHeader = request.headers.get('x-unified-user-id');
  return (
    DEFAULT_USERS.find((user) => user.role === roleHeader) ||
    DEFAULT_USERS.find((user) => user.id === userHeader) ||
    DEFAULT_USERS[2]
  );
}

export function authorizeRequest(
  request: NextRequest,
  permission: UnifiedMigratorPermission,
  action: string,
  target: string
) {
  const user = getRequestUser(request);

  try {
    assertPermission(user, permission, action);
    recordAuditEvent(user, {
      action,
      permission,
      target,
      outcome: 'allowed',
    });
    return { ok: true as const, user };
  } catch (error) {
    recordAuditEvent(user, {
      action,
      permission,
      target,
      outcome: 'denied',
      detail: error instanceof Error ? error.message : 'Access denied.',
    });
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: error instanceof Error ? error.message : 'Access denied.' },
        { status: 403 }
      ),
    };
  }
}

export function okJson<T>(payload: T) {
  return NextResponse.json(payload, { status: 200 });
}
