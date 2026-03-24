/**
 * FortiGate Output Generator — Enhanced
 * Reads the upgraded IR schema and generates FortiOS CLI configuration.
 */

export class OutputFortigateGenerator {
    constructor(parsedData) {
        this.data = parsedData;
        this.output = [];
    }

    generate() {
        // Address Objects
        this.output.push('config firewall address');
        (this.data.addresses || []).forEach(addr => {
            this.output.push(`    edit "${addr.name}"`);
            if (addr.type === 'ip-netmask' || addr.type === 'ip-mask') {
                this.output.push(`        set type ipmask`);
                // Convert CIDR to subnet mask for FortiGate
                const val = addr.value || '';
                if (val.includes('/')) {
                    const [ip, cidr] = val.split('/');
                    this.output.push(`        set subnet ${ip} ${this._cidrToMask(parseInt(cidr))}`);
                } else {
                    this.output.push(`        set subnet ${val}`);
                }
            } else if (addr.type === 'fqdn') {
                this.output.push(`        set type fqdn`);
                this.output.push(`        set fqdn "${addr.value}"`);
            } else if (addr.type === 'ip-range') {
                this.output.push(`        set type iprange`);
                const parts = (addr.value || '').split('-');
                if (parts.length === 2) {
                    this.output.push(`        set start-ip ${parts[0]}`);
                    this.output.push(`        set end-ip ${parts[1]}`);
                }
            }
            if (addr.description) {
                this.output.push(`        set comment "${addr.description}"`);
            }
            // Add exception comments
            if (addr.exceptions && addr.exceptions.length > 0) {
                this.output.push(`        set comment "EXCEPTIONS: ${addr.exceptions.map(e => e.reason).join('; ')}"`);
            }
            this.output.push('    next');
        });
        this.output.push('end');
        this.output.push('');

        // Address Groups
        if (this.data.addressGroups && this.data.addressGroups.length > 0) {
            this.output.push('config firewall addrgrp');
            this.data.addressGroups.forEach(grp => {
                this.output.push(`    edit "${grp.name}"`);
                if (grp.members.length > 0) {
                    this.output.push(`        set member ${grp.members.map(m => `"${m}"`).join(' ')}`);
                }
                this.output.push('    next');
            });
            this.output.push('end');
            this.output.push('');
        }

        // Services
        if (this.data.services && this.data.services.length > 0) {
            this.output.push('config firewall service custom');
            this.data.services.forEach(svc => {
                this.output.push(`    edit "${svc.name}"`);
                const proto = (svc.protocol || 'tcp').toLowerCase();
                if (proto === 'tcp') {
                    this.output.push(`        set tcp-portrange ${svc.port || '0'}`);
                } else if (proto === 'udp') {
                    this.output.push(`        set udp-portrange ${svc.port || '0'}`);
                }
                this.output.push('    next');
            });
            this.output.push('end');
            this.output.push('');
        }

        // Service Groups
        if (this.data.serviceGroups && this.data.serviceGroups.length > 0) {
            this.output.push('config firewall service group');
            this.data.serviceGroups.forEach(grp => {
                this.output.push(`    edit "${grp.name}"`);
                if (grp.members.length > 0) {
                    this.output.push(`        set member ${grp.members.map(m => `"${m}"`).join(' ')}`);
                }
                this.output.push('    next');
            });
            this.output.push('end');
            this.output.push('');
        }

        // Policies
        this.output.push('config firewall policy');
        const sortedPolicies = [...(this.data.policies || [])].sort((a, b) => (a._ruleOrder || 0) - (b._ruleOrder || 0));
        sortedPolicies.forEach((rule, idx) => {
            this.output.push(`    edit ${idx + 1}`);
            this.output.push(`        set name "${rule.name}"`);
            this.output.push(`        set srcintf ${(rule.from || ['any']).map(z => `"${z}"`).join(' ')}`);
            this.output.push(`        set dstintf ${(rule.to || ['any']).map(z => `"${z}"`).join(' ')}`);
            this.output.push(`        set srcaddr ${(rule.source || ['all']).map(s => s === 'any' ? '"all"' : `"${s}"`).join(' ')}`);
            this.output.push(`        set dstaddr ${(rule.destination || ['all']).map(d => d === 'any' ? '"all"' : `"${d}"`).join(' ')}`);
            this.output.push(`        set action ${rule.action === 'allow' ? 'accept' : 'deny'}`);
            this.output.push(`        set schedule "${rule.schedule || 'always'}"`);
            this.output.push(`        set service ${(rule.service || ['ALL']).map(s => s === 'any' ? '"ALL"' : `"${s}"`).join(' ')}`);
            if (rule.logEnd) this.output.push(`        set logtraffic all`);
            if (rule.disabled) this.output.push(`        set status disable`);
            if (rule.description) this.output.push(`        set comments "${rule.description}"`);
            this.output.push('    next');
        });
        this.output.push('end');
        this.output.push('');

        // Static Routes
        if (this.data.staticRoutes && this.data.staticRoutes.length > 0) {
            this.output.push('config router static');
            this.data.staticRoutes.forEach((route, idx) => {
                this.output.push(`    edit ${idx + 1}`);
                if (route.destination) {
                    const [ip, cidr] = (route.destination || '0.0.0.0/0').split('/');
                    this.output.push(`        set dst ${ip} ${this._cidrToMask(parseInt(cidr || '0'))}`);
                }
                if (route.nexthop) this.output.push(`        set gateway ${route.nexthop}`);
                if (route.interface) this.output.push(`        set device "${route.interface}"`);
                this.output.push('    next');
            });
            this.output.push('end');
        }

        return this.output.join('\n');
    }

    _cidrToMask(cidr) {
        let mask = [];
        for (let i = 0; i < 4; i++) {
            let n = Math.min(cidr, 8);
            mask.push(256 - Math.pow(2, 8 - n));
            cidr -= n;
        }
        return mask.join('.');
    }
}
