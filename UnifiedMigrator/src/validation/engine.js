/**
 * BehavioralEngine - Semantic Policy Comparison & Drift Detection
 */
export class BehavioralEngine {
    constructor() {
        this.driftTypes = {
            SERVICE_BROADENING: 'Service Broadening',
            ADDRESS_EXPANSION: 'Address Expansion',
            NAT_MISMATCH: 'NAT Logic Change',
            RULE_SHADOWING: 'Potential Shadowing'
        };
    }

    /**
     * Compare two sets of rules (source vs target IR)
     * Returns matching stats and drift warnings.
     */
    compare(sourceIr, targetIr) {
        const results = {
            totalRules: sourceIr.policies.length,
            matches: { exact: 0, near: 0, partial: 0, manual: 0 },
            driftWarnings: [],
            ruleAnalysis: []
        };

        sourceIr.policies.forEach((srcRule, index) => {
            // Find corresponding target rule (usually by name or index if ordered)
            const targetRule = this.findTargetRule(srcRule, targetIr.policies, index);
            
            if (!targetRule) {
                results.matches.manual++;
                results.ruleAnalysis.push({ name: srcRule.name, status: 'ERROR', reason: 'Missing in target' });
                return;
            }

            const analysis = this.analyzeEquivalence(srcRule, targetRule, sourceIr, targetIr);
            results.ruleAnalysis.push(analysis);

            // Tally scoring
            if (analysis.score >= 95) results.matches.exact++;
            else if (analysis.score >= 80) results.matches.near++;
            else if (analysis.score >= 50) results.matches.partial++;
            else results.matches.manual++;

            // Collect warnings
            if (analysis.drifts.length > 0) {
                results.driftWarnings.push({ rule: srcRule.name, drifts: analysis.drifts });
            }
        });

        return results;
    }

    findTargetRule(srcRule, targetPolicies, index) {
        // First try by name
        const byName = targetPolicies.find(p => p.name === srcRule.name);
        if (byName) return byName;
        
        // Fallback to index if it's a 1-to-1 migration
        return targetPolicies[index];
    }

    analyzeEquivalence(srcRule, targetRule, srcIr, tgtIr) {
        const drifts = [];
        let score = 100;

        // 1. Action Check
        if (srcRule.action.toLowerCase() !== targetRule.action.toLowerCase()) {
            drifts.push({ type: 'CRITICAL', msg: `Action changed from ${srcRule.action} to ${targetRule.action}` });
            score -= 50;
        }

        // 2. Service Broadening Check
        const srcSvcCount = this.getServicePortCount(srcRule.services, srcIr);
        const tgtSvcCount = this.getServicePortCount(targetRule.services, tgtIr);
        
        if (tgtSvcCount > srcSvcCount && srcSvcCount > 0) {
            drifts.push({ type: this.driftTypes.SERVICE_BROADENING, msg: `Service scope increased from ${srcSvcCount} ports to ${tgtSvcCount}` });
            score -= 15;
        }

        // 3. Address Expansion Check
        const srcAddrComplexity = this.getAddressComplexity(srcRule.srcAddr, srcIr);
        const tgtAddrComplexity = this.getAddressComplexity(targetRule.srcAddr, tgtIr);

        if (tgtAddrComplexity > srcAddrComplexity) {
            drifts.push({ type: this.driftTypes.ADDRESS_EXPANSION, msg: 'Target source address set covers more IP space than source' });
            score -= 10;
        }

        return {
            name: srcRule.name,
            score: Math.max(0, score),
            drifts,
            status: score >= 95 ? 'MATCH' : (score >= 70 ? 'REVIEW' : 'MANUAL')
        };
    }

    getServicePortCount(services, ir) {
        // Simplified heuristic: count individual ports/ranges
        if (!services || services.includes('any')) return 65535;
        let count = 0;
        services.forEach(svcName => {
            const svc = ir.services.find(s => s.name === svcName);
            if (svc && svc.port) count += 1; // Simplification
            // Recursively check groups if needed...
        });
        return count || 1;
    }

    getAddressComplexity(addrList, ir) {
        if (!addrList || addrList.includes('any')) return 1000000;
        return addrList.length; // Placeholder for CIDR calculation
    }
}
