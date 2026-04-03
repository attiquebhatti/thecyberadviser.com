/**
 * Compliance-Grade Audit Store (Tamper-Evident)
 * Implements a "Log Chain" where each entry contains a hash of the previous one.
 */

export class AuditStore {
    static async getLogs() {
        const saved = localStorage.getItem('unifiedMigratorComplianceAudit');
        return saved ? JSON.parse(saved) : [];
    }

    static async saveLogs(logs) {
        localStorage.setItem('unifiedMigratorComplianceAudit', JSON.stringify(logs));
    }

    /**
     * Generates a SHA-256 hash of a string using Web Crypto API.
     */
    static async generateHash(data) {
        const msgUint8 = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Adds an entry and links it to the previous one via SHA-256.
     */
    static async appendEntry(entry) {
        const logs = await this.getLogs();
        const lastEntry = logs[logs.length - 1];
        const previousHash = lastEntry ? lastEntry.hash : "ROOT_GENESIS_BLOCK";

        // Create the string to hash (Entry data + Previous Hash)
        const dataToHash = JSON.stringify(entry) + previousHash;
        const currentHash = await this.generateHash(dataToHash);

        const immutableEntry = {
            ...entry,
            previousHash,
            hash: currentHash
        };

        logs.push(immutableEntry);
        await this.saveLogs(logs);
        return immutableEntry;
    }

    /**
     * Validates the entire chain for integrity.
     */
    static async validateIntegrity() {
        const logs = await this.getLogs();
        for (let i = 0; i < logs.length; i++) {
            const entry = logs[i];
            const prevHash = i === 0 ? "ROOT_GENESIS_BLOCK" : logs[i - 1].hash;
            
            // Re-calculate the expected hash
            const { hash, previousHash, ...cleanEntry } = entry; 
            const dataToHash = JSON.stringify(cleanEntry) + prevHash;
            const expectedHash = await this.generateHash(dataToHash);

            if (hash !== expectedHash || previousHash !== prevHash) {
                return { valid: false, brokenIndex: i, entryId: entry.id };
            }
        }
        return { valid: true };
    }
}
