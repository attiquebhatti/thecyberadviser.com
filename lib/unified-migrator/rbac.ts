export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  STANDARD_USER: 'standard-user',
  READ_ONLY_AUDITOR: 'read-only-auditor',
} as const;

export type UnifiedMigratorRole = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  PROJECT_DELETE: 'project.delete',
  INSIGHTS_RESET: 'insights.reset',
  HISTORY_PURGE: 'history.purge',
  VENDOR_MAPPING_MODIFY: 'vendor-mapping.modify',
  MANUAL_OVERRIDE_APPROVE: 'manual-override.approve',
  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',
  AUDIT_LOG_EXPORT_FULL: 'audit-log.export-full',
  CONFIG_UPLOAD: 'config.upload',
  MIGRATION_RUN: 'migration.run',
  RESULTS_VIEW: 'results.view',
  MIGRATED_CONFIG_DOWNLOAD: 'migrated-config.download',
  REPORT_DOWNLOAD: 'report.download',
  PROJECT_VIEW: 'project.view',
  AUDIT_LOG_VIEW: 'audit-log.view',
  REPORT_VIEW: 'report.view',
} as const;

export type UnifiedMigratorPermission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface UnifiedMigratorUser {
  id: string;
  name: string;
  role: UnifiedMigratorRole;
}

export interface PermissionMatrixRow {
  permission: UnifiedMigratorPermission;
  label: string;
  roles: UnifiedMigratorRole[];
}

const SUPER_ADMIN_ALL: UnifiedMigratorPermission[] = Object.values(PERMISSIONS);

const ADMIN_PERMISSIONS: UnifiedMigratorPermission[] = [
  PERMISSIONS.PROJECT_DELETE,
  PERMISSIONS.INSIGHTS_RESET,
  PERMISSIONS.HISTORY_PURGE,
  PERMISSIONS.VENDOR_MAPPING_MODIFY,
  PERMISSIONS.MANUAL_OVERRIDE_APPROVE,
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.ROLE_MANAGE,
  PERMISSIONS.AUDIT_LOG_EXPORT_FULL,
  PERMISSIONS.CONFIG_UPLOAD,
  PERMISSIONS.MIGRATION_RUN,
  PERMISSIONS.RESULTS_VIEW,
  PERMISSIONS.MIGRATED_CONFIG_DOWNLOAD,
  PERMISSIONS.REPORT_DOWNLOAD,
  PERMISSIONS.PROJECT_VIEW,
  PERMISSIONS.AUDIT_LOG_VIEW,
  PERMISSIONS.REPORT_VIEW,
];

const STANDARD_USER_PERMISSIONS: UnifiedMigratorPermission[] = [
  PERMISSIONS.CONFIG_UPLOAD,
  PERMISSIONS.MIGRATION_RUN,
  PERMISSIONS.RESULTS_VIEW,
  PERMISSIONS.MIGRATED_CONFIG_DOWNLOAD,
  PERMISSIONS.REPORT_DOWNLOAD,
  PERMISSIONS.PROJECT_VIEW,
  PERMISSIONS.REPORT_VIEW,
];

const AUDITOR_PERMISSIONS: UnifiedMigratorPermission[] = [
  PERMISSIONS.PROJECT_VIEW,
  PERMISSIONS.AUDIT_LOG_VIEW,
  PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.RESULTS_VIEW,
];

export const ROLE_PERMISSIONS: Record<
  UnifiedMigratorRole,
  UnifiedMigratorPermission[]
> = {
  [ROLES.SUPER_ADMIN]: SUPER_ADMIN_ALL,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.STANDARD_USER]: STANDARD_USER_PERMISSIONS,
  [ROLES.READ_ONLY_AUDITOR]: AUDITOR_PERMISSIONS,
};

export const DEFAULT_USERS: UnifiedMigratorUser[] = [
  { id: 'usr-super-admin', name: 'Avery Super Admin', role: ROLES.SUPER_ADMIN },
  { id: 'usr-admin', name: 'Morgan Admin', role: ROLES.ADMIN },
  { id: 'usr-standard', name: 'Jordan Operator', role: ROLES.STANDARD_USER },
  { id: 'usr-auditor', name: 'Riley Auditor', role: ROLES.READ_ONLY_AUDITOR },
];

export const PERMISSION_MATRIX: PermissionMatrixRow[] = [
  {
    permission: PERMISSIONS.PROJECT_DELETE,
    label: 'Delete projects',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.INSIGHTS_RESET,
    label: 'Reset insights',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.HISTORY_PURGE,
    label: 'Purge history',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.VENDOR_MAPPING_MODIFY,
    label: 'Modify vendor mappings',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.MANUAL_OVERRIDE_APPROVE,
    label: 'Approve manual overrides',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.USER_MANAGE,
    label: 'Manage users',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.ROLE_MANAGE,
    label: 'Manage roles',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.AUDIT_LOG_EXPORT_FULL,
    label: 'Export full audit logs',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    permission: PERMISSIONS.CONFIG_UPLOAD,
    label: 'Upload config files',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STANDARD_USER],
  },
  {
    permission: PERMISSIONS.MIGRATION_RUN,
    label: 'Run allowed migrations',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STANDARD_USER],
  },
  {
    permission: PERMISSIONS.RESULTS_VIEW,
    label: 'View results',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STANDARD_USER, ROLES.READ_ONLY_AUDITOR],
  },
  {
    permission: PERMISSIONS.MIGRATED_CONFIG_DOWNLOAD,
    label: 'Download migrated configs',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STANDARD_USER],
  },
  {
    permission: PERMISSIONS.REPORT_DOWNLOAD,
    label: 'Download reports',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STANDARD_USER],
  },
  {
    permission: PERMISSIONS.AUDIT_LOG_VIEW,
    label: 'View audit logs',
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.READ_ONLY_AUDITOR],
  },
];

export function hasPermission(
  role: UnifiedMigratorRole,
  permission: UnifiedMigratorPermission
) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(
  user: UnifiedMigratorUser,
  permission: UnifiedMigratorPermission,
  actionLabel?: string
) {
  if (!hasPermission(user.role, permission)) {
    throw new Error(
      `Access denied for ${actionLabel || permission}. Required permission: ${permission}.`
    );
  }
}
