/**
 * Check Point Parser — Enhanced
 * Extends BaseParser for exception tracking, confidence scoring,
 * deterministic normalization, and support for groups, services, policies, and NAT.
 */
import { BaseParser } from './base.js';

export class CheckpointParser extends BaseParser {
    constructor(configText) {
        super(configText);
        this._nameRegistry = new Set();
        this._ruleOrderIndex = 0;
    }

    parse() {
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();

            if (line.match(/^add host /)) {
                this.parseHost(line);
            } else if (line.match(/^add network /)) {
                this.parseNetwork(line);
            } else if (line.match(/^add group /)) {
                this.parseGroup(line);
            } else if (line.match(/^set group /)) {
                this.parseGroupMember(line);
            } else if (line.match(/^add service-tcp /)) {
                this.parseServiceTcp(line);
            } else if (line.match(/^add service-udp /)) {
                this.parseServiceUdp(line);
            } else if (line.match(/^add service /)) {
                this.parseService(line);
            } else if (line.match(/^add access-rule /)) {
                this.parseAccessRule(line);
            } else if (line.match(/^add nat-rule /)) {
                this.parseNatRule(line);
            } else if (line.match(/^add address-range /)) {
                this.parseAddressRange(line);
            } else {
                // Track lines we couldn't classify
                if (line && !line.startsWith('#') && line.length > 3) {
                    this.logInfo(`Skipped unrecognized line: ${line.substring(0, 80)}`);
                }
            }

            this.currentLineIndex++;
        }

        this.normalize();
        return this.data;
    }

    // --- Name Conflict Resolution ---
    _uniqueName(name) {
        let finalName = name;
        let counter = 1;
        while (this._nameRegistry.has(finalName)) {
            finalName = `${name}_dup${counter}`;
            counter++;
        }
        this._nameRegistry.add(finalName);
        return finalName;
    }

    _extractNamedParam(parts, paramName) {
        const idx = parts.indexOf(paramName);
        if (idx >= 0 && idx + 1 < parts.length) {
            return parts[idx + 1].replace(/"/g, '');
        }
        return null;
    }

    // --- Parsing Functions ---

    // "add host name myHost ip-address 1.1.1.1"
    parseHost(line) {
        const parts = line.split(/\s+/);
        let name = this._extractNamedParam(parts, 'name');
        let ip = this._extractNamedParam(parts, 'ip-address') || this._extractNamedParam(parts, 'ipv4-address');

        if (name && ip) {
            name = this._uniqueName(name);
            this.data.addresses.push({
                name,
                type: 'ip-netmask',
                value: `${ip}/32`,
                exceptions: [],
                _rawLines: [line]
            });
        } else {
            this.logWarning(`Could not parse host line: ${line}`);
        }
    }

    // "add network name myNet subnet4 10.0.0.0 mask-length4 24"
    parseNetwork(line) {
        const parts = line.split(/\s+/);
        let name = this._extractNamedParam(parts, 'name');
        let subnet = this._extractNamedParam(parts, 'subnet4') || this._extractNamedParam(parts, 'subnet');
        let mask = this._extractNamedParam(parts, 'mask-length4') || this._extractNamedParam(parts, 'mask-length');

        if (name && subnet && mask) {
            name = this._uniqueName(name);
            this.data.addresses.push({
                name,
                type: 'ip-netmask',
                value: `${subnet}/${mask}`,
                exceptions: [],
                _rawLines: [line]
            });
        } else {
            this.logWarning(`Could not parse network line: ${line}`);
        }
    }

    // "add address-range name myRange ip-address-first 1.1.1.1 ip-address-last 1.1.1.10"
    parseAddressRange(line) {
        const parts = line.split(/\s+/);
        let name = this._extractNamedParam(parts, 'name');
        let first = this._extractNamedParam(parts, 'ip-address-first') || this._extractNamedParam(parts, 'ipv4-address-first');
        let last = this._extractNamedParam(parts, 'ip-address-last') || this._extractNamedParam(parts, 'ipv4-address-last');

        if (name && first && last) {
            name = this._uniqueName(name);
            this.data.addresses.push({
                name,
                type: 'ip-range',
                value: `${first}-${last}`,
                exceptions: [],
                _rawLines: [line]
            });
        }
    }

    // "add group name myGroup"
    parseGroup(line) {
        const parts = line.split(/\s+/);
        let name = this._extractNamedParam(parts, 'name');

        if (name) {
            name = this._uniqueName(name);
            this.data.addressGroups.push({
                name,
                members: [],
                exceptions: [],
                _rawLines: [line]
            });
        }
    }

    // "set group name myGroup members.add myHost1"
    parseGroupMember(line) {
        const parts = line.split(/\s+/);
        let groupName = this._extractNamedParam(parts, 'name');
        let memberIdx = parts.indexOf('members.add');

        if (groupName && memberIdx >= 0 && memberIdx + 1 < parts.length) {
            let member = parts[memberIdx + 1].replace(/"/g, '');
            const group = this.data.addressGroups.find(g => g.name === groupName);
            if (group) {
                group.members.push(member);
                group._rawLines.push(line);
            } else {
                // Group not yet created, create it
                const newName = this._uniqueName(groupName);
                this.data.addressGroups.push({
                    name: newName,
                    members: [member],
                    exceptions: [],
                    _rawLines: [line]
                });
            }
        }
    }

    // "add service-tcp name myService port 443"
    parseServiceTcp(line) {
        const parts = line.split(/\s+/);
        let name = this._extractNamedParam(parts, 'name');
        let port = this._extractNamedParam(parts, 'port');

        if (name && port) {
            name = this._uniqueName(name);
            this.data.services.push({
                name,
                protocol: 'tcp',
                port,
                exceptions: [],
                _rawLines: [line]
            });
        }
    }

    // "add service-udp name myService port 53"
    parseServiceUdp(line) {
        const parts = line.split(/\s+/);
        let name = this._extractNamedParam(parts, 'name');
        let port = this._extractNamedParam(parts, 'port');

        if (name && port) {
            name = this._uniqueName(name);
            this.data.services.push({
                name,
                protocol: 'udp',
                port,
                exceptions: [],
                _rawLines: [line]
            });
        }
    }

    // Generic service
    parseService(line) {
        const parts = line.split(/\s+/);
        let name = this._extractNamedParam(parts, 'name');
        let port = this._extractNamedParam(parts, 'port');
        let protocol = this._extractNamedParam(parts, 'protocol') || 'tcp';

        if (name) {
            name = this._uniqueName(name);
            let svc = {
                name,
                protocol,
                port: port || '',
                exceptions: [],
                _rawLines: [line]
            };
            if (!port) {
                this.addException(svc, 'missing_port', 'low', `Service '${name}' has no port defined.`, line);
            }
            this.data.services.push(svc);
        }
    }

    // "add access-rule layer "Network" name "Allow_Web" position top source "web_servers" destination "internet" service "HTTPS" action "Accept""
    parseAccessRule(line) {
        const parts = this._parseQuotedArgs(line);
        let name = parts['name'] || `Rule-${this._ruleOrderIndex + 1}`;
        let source = parts['source'] || 'Any';
        let destination = parts['destination'] || 'Any';
        let service = parts['service'] || 'Any';
        let action = parts['action'] || 'Drop';

        let policy = {
            name: this._uniqueName(name),
            _ruleOrder: this._ruleOrderIndex,
            from: ['any'],
            to: ['any'],
            source: source === 'Any' ? ['any'] : [source],
            destination: destination === 'Any' ? ['any'] : [destination],
            service: service === 'Any' ? ['any'] : [service],
            action: action.toLowerCase() === 'accept' ? 'allow' : 'deny',
            disabled: false,
            logEnd: true,
            logStart: false,
            exceptions: [],
            _rawLines: [line]
        };

        this._ruleOrderIndex++;
        this.data.policies.push(policy);
    }

    // "add nat-rule package "Standard" position top original-source "internal_net" translated-source "nat_pool" method "static""
    parseNatRule(line) {
        const parts = this._parseQuotedArgs(line);

        let natRule = {
            name: `cp-nat-${this.data.natRules.length + 1}`,
            _ruleOrder: this.data.natRules.length,
            natType: 'unknown',
            originalPacket: {},
            translatedPacket: {},
            exceptions: [],
            _rawLines: [line]
        };

        if (parts['original-source']) natRule.originalPacket.srcAddress = parts['original-source'];
        if (parts['original-destination']) natRule.originalPacket.dstAddress = parts['original-destination'];
        if (parts['translated-source']) natRule.translatedPacket.srcAddress = parts['translated-source'];
        if (parts['translated-destination']) natRule.translatedPacket.dstAddress = parts['translated-destination'];

        let method = (parts['method'] || '').toLowerCase();
        if (method === 'static') {
            natRule.natType = 'static';
        } else if (method === 'hide' || method === 'dynamic') {
            natRule.natType = 'dynamic';
        } else {
            natRule.natType = 'unknown';
            this.addException(natRule, 'unsupported_nat', 'medium', `NAT method '${method}' is not fully supported.`, line);
        }

        this.data.natRules.push(natRule);
    }

    // --- Utility: Parse key-value pairs with quoted values ---
    _parseQuotedArgs(line) {
        const result = {};
        const regex = /(\S+)\s+"([^"]+)"/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            result[match[1]] = match[2];
        }
        return result;
    }
}
