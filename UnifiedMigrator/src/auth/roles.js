/**
 * UnifiedMigrator RBAC Model
 * Roles: SUPER_ADMIN, ADMIN, STANDARD, AUDITOR
 */

export const ROLES = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    STANDARD: 'Standard User',
    AUDITOR: 'Read-Only Auditor'
};

export const PERMISSIONS = {
    PROJECT_DELETE: 'project:delete',
    INSIGHTS_RESET: 'insights:reset',
    HISTORY_PURGE: 'history:purge',
    MAPPINGS_MODIFY: 'mappings:modify',
    CONFIG_UPLOAD: 'config:upload',
    MIGRATION_RUN: 'migration:run',
    MANUAL_OVERRIDE_APPROVE: 'override:approve',
    USER_MANAGE: 'user:manage',
    AUDIT_EXPORT: 'audit:export',
    REPORTS_VIEW: 'reports:view',
    CONFIG_DOWNLOAD: 'config:download'
};

const PERMISSION_MATRIX = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.ADMIN]: [
        PERMISSIONS.PROJECT_DELETE,
        PERMISSIONS.INSIGHTS_RESET,
        PERMISSIONS.HISTORY_PURGE,
        PERMISSIONS.MAPPINGS_MODIFY,
        PERMISSIONS.CONFIG_UPLOAD,
        PERMISSIONS.MIGRATION_RUN,
        PERMISSIONS.MANUAL_OVERRIDE_APPROVE,
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.AUDIT_EXPORT,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.CONFIG_DOWNLOAD
    ],
    [ROLES.STANDARD]: [
        PERMISSIONS.CONFIG_UPLOAD,
        PERMISSIONS.MIGRATION_RUN,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.CONFIG_DOWNLOAD
    ],
    [ROLES.AUDITOR]: [
        PERMISSIONS.REPORTS_VIEW
    ]
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, permission) {
    if (!PERMISSION_MATRIX[role]) return false;
    return PERMISSION_MATRIX[role].includes(permission);
}
