/**
 * BaseParser - Foundational class for all vendor parsers
 * Provides unified IR schema, deterministic normalization, exception tracking, and confidence scoring.
 */
export class BaseParser {
    constructor(configText) {
        this.lines = configText.split('\n').map(l => l.trimEnd());
        this.currentLineIndex = 0;
        
        // Upgraded IR Schema for Lossless Representation
        this.data = {
            addresses: [],
            addressGroups: [],
            services: [],
            serviceGroups: [],
            policies: [],
            natRules: [],
            staticRoutes: [],
            zones: []
        };
        
        this.logs = [];
    }

    // Abstract method to be overridden by vendor parsers
    parse() {
        throw new Error('parse() must be implemented by vendor specific parser.');
    }

    logInfo(msg) { this.logs.push({ level: 'info', message: msg }); }
    logWarning(msg) { this.logs.push({ level: 'warning', message: msg }); }
    logError(msg) { this.logs.push({ level: 'error', message: msg }); }
    
    addException(entity, type, severity, reason, rawContext) {
        if (!entity.exceptions) {
            entity.exceptions = [];
        }
        entity.exceptions.push({ type, severity, reason, rawContext });
    }

    computeConfidence(entity) {
        if (!entity.exceptions || entity.exceptions.length === 0) {
            entity.confidence = 100;
            return 100;
        }

        let penalty = 0;
        for (const ex of entity.exceptions) {
            switch (ex.severity) {
                case 'high': penalty += 40; break;
                case 'medium': penalty += 15; break;
                case 'low': penalty += 5; break;
            }
        }

        const score = Math.max(0, 100 - penalty);
        entity.confidence = score;
        return score;
    }

    normalize() {
        // Enforce deterministic sorting (e.g., sort objects alphabetically)
        // Rule order is intentionally preserved (not sorted)
        
        this.data.addresses.sort((a, b) => a.name.localeCompare(b.name));
        this.data.addressGroups.sort((a, b) => a.name.localeCompare(b.name));
        this.data.services.sort((a, b) => a.name.localeCompare(b.name));
        this.data.serviceGroups.sort((a, b) => a.name.localeCompare(b.name));
        this.data.zones.sort((a, b) => a.name.localeCompare(b.name));
        this.data.staticRoutes.sort((a, b) => a.name.localeCompare(b.name));
        
        // Compute confidence for all entities
        const computeAll = (arr) => arr.forEach(item => this.computeConfidence(item));
        
        computeAll(this.data.addresses);
        computeAll(this.data.addressGroups);
        computeAll(this.data.services);
        computeAll(this.data.serviceGroups);
        computeAll(this.data.policies);
        computeAll(this.data.natRules);
        computeAll(this.data.staticRoutes);
        computeAll(this.data.zones);
    }

    getLogs() {
        return this.logs;
    }
}
