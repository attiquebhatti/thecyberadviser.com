/**
 * AuditLogger - Track administrative and sensitive actions
 */
export class AuditLogger {
    constructor() {
        this.STORAGE_KEY = 'um_audit_logs';
    }

    /**
     * Log a sensitive action
     * @param {Object} user Current user object {id, role, name}
     * @param {String} action Action identifier (e.g. 'INSIGHTS_RESET')
     * @param {Object} details Additional context
     */
    log(user, action, details = {}) {
        const logs = this.getLogs();
        const event = {
            timestamp: new Date().toISOString(),
            userId: user.id || 'system',
            userRole: user.role,
            userName: user.name || 'Anonymous',
            action,
            details,
            status: 'SUCCESS'
        };

        logs.unshift(event); // Newest first
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs.slice(0, 500))); // Limit to 500
        
        console.log(`[AUDIT] ${user.role} ${user.name} performed ${action}`, details);
    }

    getLogs() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    purge() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
