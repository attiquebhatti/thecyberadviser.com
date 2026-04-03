import { AuditStore } from './auditStore.js';

export class AuditService {
    /**
     * Captures a comprehensive audit event with detailed metadata.
     * @param {string} actor - The user ID/Role performing the action.
     * @param {string} action - The action enum (e.g., UPLOAD_CONFIG).
     * @param {string} target - The object being acted upon.
     * @param {object} details - Any supplementary data / state snapshots.
     * @param {boolean} success - Whether the action succeeded.
     */
    static async log(actor, action, target, details = {}, success = true) {
        // In a real app, this would be fetched from a server or WebRTC.
        // For local-only security, we placeholder the source.
        const ip = "127.0.0.1 (Local Session)"; 
        
        const entry = {
            id: `AUDIT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            timestamp: new Date().toISOString(),
            actor: actor || 'Local_User',
            ip,
            action,
            target: target || 'N/A',
            details,
            success
        };

        try {
            const immutableEntry = await AuditStore.appendEntry(entry);
            console.log(`[COMPLIANCE-AUDIT] ${action} logged for ${target} by ${actor}. Hash: ${immutableEntry.hash.slice(0, 8)}...`);
            return immutableEntry;
        } catch (err) {
            console.error(`[CRITICAL] Audit logging failed for action: ${action}`, err);
        }
    }

    /**
     * Automated evidence package generator.
     */
    static async generateEvidencePackage(projectId = 'ALL') {
        const logs = await AuditStore.getLogs();
        const filtered = projectId === 'ALL' ? logs : logs.filter(l => l.target === projectId || (l.details && l.details.projectId === projectId));
        
        const integrity = await AuditStore.validateIntegrity();
        
        return {
            packageId: `EVIDENCE-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            integrityStatus: integrity.valid ? 'VERIFIED_TAMPER_FREE' : 'TAMPER_DETECTED',
            scope: projectId,
            logs: filtered
        };
    }
}

// Action Enums for unified tracking
export const AuditAction = {
    UPLOAD: 'UPLOAD_CONFIG',
    PARSE: 'PARSE_CONFIG',
    MIGRATION_RUN: 'MIGRATION_EXEC',
    DOWNLOAD: 'DOWNLOAD_OUTPUT',
    VALIDATION_FAIL: 'VALIDATION_FAILURE',
    DELETE_ATTEMPT: 'DELETE_PROJECT_ATTEMPT',
    DELETE_SUCCESS: 'DELETE_PROJECT_SUCCESS',
    ROLE_CHANGE: 'ROLE_MODIFICATION',
    VAULT_UNLOCKED: 'VAULT_PASSPHRASE_ENTERED',
    VAULT_WIPE: 'VAULT_SECURE_WIPE',
    LOGIN_FAIL: 'AUTH_LEAST_PRIVILEGE_VIOLATION'
};
