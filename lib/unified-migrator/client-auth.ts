import {
  DEFAULT_USERS,
  hasPermission,
  UnifiedMigratorPermission,
  UnifiedMigratorRole,
  UnifiedMigratorUser,
} from '@/lib/unified-migrator/rbac';

const STORAGE_KEY = 'unifiedMigrator.currentUserId';

export function getDefaultUser() {
  return DEFAULT_USERS[2];
}

export function getClientUser() {
  if (typeof window === 'undefined') return getDefaultUser();
  const storedId = window.localStorage.getItem(STORAGE_KEY);
  return DEFAULT_USERS.find((user) => user.id === storedId) || getDefaultUser();
}

export function setClientUser(userId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, userId);
}

export function clientCan(
  user: UnifiedMigratorUser,
  permission: UnifiedMigratorPermission
) {
  return hasPermission(user.role, permission);
}

export function headersForUser(user: UnifiedMigratorUser) {
  return {
    'x-unified-role': user.role,
    'x-unified-user-id': user.id,
  };
}

export function roleLabel(role: UnifiedMigratorRole) {
  switch (role) {
    case 'super-admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'standard-user':
      return 'Standard User';
    case 'read-only-auditor':
      return 'Read-Only Auditor';
  }
}
