/**
 * Cisco ASA Parser — Enhanced
 * Extends BaseParser for exception tracking, confidence scoring,
 * deterministic normalization, and comprehensive NAT handling.
 */
import { BaseParser } from './base.js';

export class CiscoParser extends BaseParser {
    constructor(configText) {
        super(configText);
        this._nameRegistry = new Set();
        this._ruleOrderIndex = 0;
    }

    parse() {
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();

            if (line.startsWith('object network')) {
                this.parseObjectNetwork(line);
            } else if (line.startsWith('object-group network')) {
                this.parseObjectGroupNetwork(line);
            } else if (line.startsWith('object service')) {
                this.parseObjectService(line);
            } else if (line.startsWith('object-group service')) {
                this.parseObjectGroupService(line);
            } else if (line.startsWith('access-list')) {
                this.parseAccessList(line);
            } else if (line.startsWith('route ')) {
                this.parseRoute(line);
            } else if (line.startsWith('nat ') || line.startsWith('object network') === false && line.trim().startsWith('nat ')) {
                this.parseNat(line);
            } else if (line.startsWith('nameif')) {
                this.parseInterface(line);
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

    // --- Parsing Modules ---

    parseObjectNetwork(line) {
        let rawName = line.substring(15).trim();
        let name = this._uniqueName(rawName);
        let address = { name, type: 'ip-netmask', value: '', exceptions: [], _rawLines: [line], _sourceLineStart: this.currentLineIndex + 1 };

        this.currentLineIndex++;
        let hasNat = false;
        while (this.currentLineIndex < this.lines.length) {
            const innerLine = this.lines[this.currentLineIndex].trim();
            if (innerLine === '!' || (innerLine.startsWith('object ') && !innerLine.startsWith('object network ' + rawName)) || innerLine === '') {
                this.currentLineIndex--;
                break;
            }

            address._rawLines.push(innerLine);

            if (innerLine.startsWith('host ')) {
                address.value = `${innerLine.substring(5).trim()}/32`;
            } else if (innerLine.startsWith('subnet ')) {
                const parts = innerLine.substring(7).trim().split(' ');
                if (parts.length >= 2) {
                    address.value = `${parts[0]}/${this.maskToCidr(parts[1])}`;
                }
            } else if (innerLine.startsWith('fqdn ')) {
                address.type = 'fqdn';
                address.value = innerLine.substring(5).trim();
            } else if (innerLine.startsWith('range ')) {
                address.type = 'ip-range';
                address.value = innerLine.substring(6).trim();
            } else if (innerLine.startsWith('nat ')) {
                hasNat = true;
                this._parseObjectNat(innerLine, rawName);
            } else if (innerLine.startsWith('description ')) {
                address.description = innerLine.substring(12).trim();
            } else {
                this.addException(address, 'unsupported_construct', 'low', `Unrecognized line in object network: ${innerLine}`, innerLine);
                this.logWarning(`Unrecognized line in object network '${name}': ${innerLine}`);
            }

            this.currentLineIndex++;
        }

        if (address.value) {
            this.data.addresses.push(address);
        } else if (!hasNat) {
            this.addException(address, 'empty_object', 'medium', `Address object '${name}' has no value.`, line);
            address.value = '0.0.0.0/0';
            this.data.addresses.push(address);
            this.logWarning(`Address object '${name}' has no value, added with placeholder.`);
        }
    }

    parseObjectGroupNetwork(line) {
        let rawName = line.substring(21).trim();
        let name = this._uniqueName(rawName);
        let group = { name, members: [], exceptions: [], _rawLines: [line], _sourceLineStart: this.currentLineIndex + 1 };

        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const innerLine = this.lines[this.currentLineIndex].trim();
            if (innerLine === '!' || innerLine.startsWith('object') || innerLine === '') {
                this.currentLineIndex--;
                break;
            }

            group._rawLines.push(innerLine);

            if (innerLine.startsWith('network-object object ')) {
                group.members.push(innerLine.substring(22).trim());
            } else if (innerLine.startsWith('group-object ') || innerLine.startsWith('gropu-object ')) {
                group.members.push(innerLine.split(' ')[1].trim());
            } else if (innerLine.startsWith('network-object host ')) {
                const ip = innerLine.substring(20).trim();
                const objName = this._uniqueName(`H-${ip}`);
                this.data.addresses.push({ name: objName, type: 'ip-netmask', value: `${ip}/32`, exceptions: [] });
                group.members.push(objName);
            } else if (innerLine.startsWith('network-object ')) {
                // network-object 10.0.0.0 255.255.255.0
                const parts = innerLine.substring(15).trim().split(' ');
                if (parts.length >= 2) {
                    const objName = this._uniqueName(`NET-${parts[0]}_${this.maskToCidr(parts[1])}`);
                    this.data.addresses.push({ name: objName, type: 'ip-netmask', value: `${parts[0]}/${this.maskToCidr(parts[1])}`, exceptions: [] });
                    group.members.push(objName);
                }
            } else if (innerLine.startsWith('description ')) {
                group.description = innerLine.substring(12).trim();
            } else {
                this.addException(group, 'unsupported_construct', 'low', `Unrecognized line in address group: ${innerLine}`, innerLine);
            }

            this.currentLineIndex++;
        }

        if (group.members.length > 0) {
            this.data.addressGroups.push(group);
        } else {
            this.addException(group, 'empty_group', 'medium', `Address group '${name}' is empty.`, line);
            this.data.addressGroups.push(group);
            this.logWarning(`Address group '${name}' is empty.`);
        }
    }

    parseObjectService(line) {
        let rawName = line.substring(15).trim();
        let name = this._uniqueName(rawName);
        let service = { name, protocol: 'tcp', port: '', exceptions: [], _rawLines: [line] };

        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const innerLine = this.lines[this.currentLineIndex].trim();
            if (innerLine === '!' || innerLine.startsWith('object') || innerLine === '') {
                this.currentLineIndex--;
                break;
            }

            service._rawLines.push(innerLine);

            if (innerLine.startsWith('service tcp destination eq ')) {
                service.protocol = 'tcp';
                service.port = innerLine.substring(27).trim();
            } else if (innerLine.startsWith('service udp destination eq ')) {
                service.protocol = 'udp';
                service.port = innerLine.substring(27).trim();
            } else if (innerLine.startsWith('service tcp destination range ')) {
                service.protocol = 'tcp';
                const range = innerLine.substring(29).trim().replace(' ', '-');
                service.port = range;
            } else if (innerLine.startsWith('service udp destination range ')) {
                service.protocol = 'udp';
                const range = innerLine.substring(29).trim().replace(' ', '-');
                service.port = range;
            } else if (innerLine.startsWith('service ')) {
                // Generic: service tcp|udp source|destination ...
                const tokens = innerLine.split(' ');
                if (tokens.length >= 2) service.protocol = tokens[1];
                if (tokens.length >= 4 && tokens[2] === 'destination' && tokens[3] === 'eq') {
                    service.port = tokens[4] || '';
                } else if (tokens.length >= 4 && tokens[2] === 'destination' && tokens[3] === 'range') {
                    service.port = tokens.slice(4).join('-');
                } else {
                    this.addException(service, 'partial_parse', 'low', `Service line partially parsed: ${innerLine}`, innerLine);
                }
            } else if (innerLine.startsWith('description ')) {
                service.description = innerLine.substring(12).trim();
            } else {
                this.addException(service, 'unsupported_construct', 'low', `Unrecognized line in service: ${innerLine}`, innerLine);
            }

            this.currentLineIndex++;
        }

        if (service.port) {
            this.data.services.push(service);
        } else {
            this.addException(service, 'missing_port', 'medium', `Service '${name}' missing port.`, line);
            this.data.services.push(service);
            this.logWarning(`Service '${name}' missing port.`);
        }
    }

    parseObjectGroupService(line) {
        let parts = line.split(' ');
        if (parts.length < 3) return;

        let protocol = parts.length > 3 ? parts[3] : 'tcp';
        let rawName = parts.length > 3 ? parts[3] : parts[2];
        // object-group service NAME tcp|udp
        if (parts.length >= 4) {
            rawName = parts[2];
            protocol = parts[3];
        } else {
            rawName = parts[2];
            protocol = 'tcp';
        }

        let name = this._uniqueName(rawName);
        let group = { name, members: [], exceptions: [], _rawLines: [line] };

        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const innerLine = this.lines[this.currentLineIndex].trim();
            if (innerLine === '!' || innerLine.startsWith('object') || innerLine === '') {
                this.currentLineIndex--;
                break;
            }

            group._rawLines.push(innerLine);

            if (innerLine.startsWith('port-object eq ')) {
                const port = innerLine.substring(15).trim();
                const memberName = this._uniqueName(`S-${protocol}-${port}`);
                this.data.services.push({ name: memberName, protocol, port, exceptions: [] });
                group.members.push(memberName);
            } else if (innerLine.startsWith('port-object range ')) {
                const range = innerLine.substring(18).trim().replace(' ', '-');
                const memberName = this._uniqueName(`S-${protocol}-${range}`);
                this.data.services.push({ name: memberName, protocol, port: range, exceptions: [] });
                group.members.push(memberName);
            } else if (innerLine.startsWith('group-object ')) {
                group.members.push(innerLine.substring(13).trim());
            } else if (innerLine.startsWith('service-object ')) {
                const memberName = innerLine.substring(15).trim();
                group.members.push(memberName);
            } else if (innerLine.startsWith('description ')) {
                group.description = innerLine.substring(12).trim();
            } else {
                this.addException(group, 'unsupported_construct', 'low', `Unrecognized in service group: ${innerLine}`, innerLine);
            }

            this.currentLineIndex++;
        }

        if (group.members.length > 0) {
            this.data.serviceGroups.push(group);
        } else {
            this.addException(group, 'empty_group', 'medium', `Service group '${name}' is empty.`, line);
            this.data.serviceGroups.push(group);
        }
    }

    parseAccessList(line) {
        let parts = line.split(/\s+/);
        if (parts.length < 5) return;

        let aclName = parts[1];
        let action = parts[3] === 'permit' ? 'allow' : 'deny';
        let protocol = parts[4] || 'ip';

        let policy = {
            name: `${aclName}-${this._ruleOrderIndex + 1}`,
            _ruleOrder: this._ruleOrderIndex,
            from: ['any'],
            to: ['any'],
            source: ['any'],
            destination: ['any'],
            service: ['any'],
            action: action,
            description: aclName,
            disabled: false,
            logEnd: false,
            logStart: false,
            exceptions: [],
            _rawLines: [line]
        };

        // Try to extract source/dest from known ACL pattern
        // access-list NAME extended permit|deny PROTO SRC DST [eq PORT]
        if (parts.length > 5) {
            let idx = 5;
            // Source
            if (parts[idx] === 'host' && parts.length > idx + 1) {
                const hostName = this._uniqueName(`H-${parts[idx + 1]}`);
                this.data.addresses.push({ name: hostName, type: 'ip-netmask', value: `${parts[idx + 1]}/32`, exceptions: [] });
                policy.source = [hostName];
                idx += 2;
            } else if (parts[idx] === 'object' && parts.length > idx + 1) {
                policy.source = [parts[idx + 1]];
                idx += 2;
            } else if (parts[idx] === 'object-group' && parts.length > idx + 1) {
                policy.source = [parts[idx + 1]];
                idx += 2;
            } else if (parts[idx] === 'any' || parts[idx] === 'any4') {
                policy.source = ['any'];
                idx += 1;
            } else if (parts[idx] && parts[idx].match(/^\d/)) {
                // Inline IP + mask
                if (parts.length > idx + 1 && parts[idx + 1].match(/^\d/)) {
                    const objName = this._uniqueName(`NET-${parts[idx]}`);
                    this.data.addresses.push({ name: objName, type: 'ip-netmask', value: `${parts[idx]}/${this.wildcardToCidr(parts[idx + 1])}`, exceptions: [] });
                    policy.source = [objName];
                    idx += 2;
                } else {
                    idx += 1;
                }
            }

            // Destination
            if (idx < parts.length) {
                if (parts[idx] === 'host' && parts.length > idx + 1) {
                    const hostName = this._uniqueName(`H-${parts[idx + 1]}`);
                    this.data.addresses.push({ name: hostName, type: 'ip-netmask', value: `${parts[idx + 1]}/32`, exceptions: [] });
                    policy.destination = [hostName];
                    idx += 2;
                } else if (parts[idx] === 'object' && parts.length > idx + 1) {
                    policy.destination = [parts[idx + 1]];
                    idx += 2;
                } else if (parts[idx] === 'object-group' && parts.length > idx + 1) {
                    policy.destination = [parts[idx + 1]];
                    idx += 2;
                } else if (parts[idx] === 'any' || parts[idx] === 'any4') {
                    policy.destination = ['any'];
                    idx += 1;
                } else if (parts[idx] && parts[idx].match(/^\d/)) {
                    if (parts.length > idx + 1 && parts[idx + 1].match(/^\d/)) {
                        const objName = this._uniqueName(`NET-${parts[idx]}`);
                        this.data.addresses.push({ name: objName, type: 'ip-netmask', value: `${parts[idx]}/${this.wildcardToCidr(parts[idx + 1])}`, exceptions: [] });
                        policy.destination = [objName];
                        idx += 2;
                    } else {
                        idx += 1;
                    }
                }
            }

            // Service
            if (idx < parts.length && parts[idx] === 'eq') {
                policy.service = [`S-${protocol}-${parts[idx + 1]}`];
                const svcName = this._uniqueName(`S-${protocol}-${parts[idx + 1]}`);
                this.data.services.push({ name: svcName, protocol, port: parts[idx + 1], exceptions: [] });
                policy.service = [svcName];
            } else if (protocol !== 'ip' && protocol !== 'object-group') {
                policy.service = [`application-${protocol}`];
            }

            // Log keyword at end
            if (parts[parts.length - 1] === 'log') {
                policy.logEnd = true;
            }
        }

        this._ruleOrderIndex++;
        this.data.policies.push(policy);
        this.logInfo(`Cisco ACL '${aclName}' rule parsed with enhanced source/dest extraction.`);
    }

    parseRoute(line) {
        let parts = line.split(' ').filter(p => p !== '');
        if (parts.length >= 5) {
            let route = {
                name: `route-${this.data.staticRoutes.length + 1}`,
                interface: parts[1],
                destination: parts[2] === '0.0.0.0' && parts[3] === '0.0.0.0' ? '0.0.0.0/0' : `${parts[2]}/${this.maskToCidr(parts[3])}`,
                nexthop: parts[4],
                metric: parts[5] || '1',
                exceptions: [],
                _rawLines: [line]
            };
            this.data.staticRoutes.push(route);
        }
    }

    parseNat(line) {
        // nat (inside,outside) source static OBJ_A OBJ_A destination static OBJ_B OBJ_B
        // nat (inside,outside) source dynamic any interface
        // nat (inside,outside) after-auto source dynamic any pat-pool PAT_POOL
        let natRule = {
            name: `nat-${this.data.natRules.length + 1}`,
            _ruleOrder: this.data.natRules.length,
            natType: 'unknown',
            originalPacket: {},
            translatedPacket: {},
            exceptions: [],
            _rawLines: [line]
        };

        const interfaceMatch = line.match(/\(([^,]+),([^)]+)\)/);
        if (interfaceMatch) {
            natRule.originalPacket.srcZone = interfaceMatch[1].trim();
            natRule.originalPacket.dstZone = interfaceMatch[2].trim();
        }

        if (line.includes('source static') && line.includes('destination static')) {
            natRule.natType = 'static_bidirectional';
        } else if (line.includes('source static')) {
            natRule.natType = 'static';
        } else if (line.includes('source dynamic') && line.includes('pat-pool')) {
            natRule.natType = 'pat';
        } else if (line.includes('source dynamic') && line.includes('interface')) {
            natRule.natType = 'pat_interface';
        } else if (line.includes('source dynamic')) {
            natRule.natType = 'dynamic';
        } else {
            natRule.natType = 'unknown';
            this.addException(natRule, 'unsupported_nat', 'high', `NAT rule type could not be determined: ${line}`, line);
        }

        // Extract object references
        const staticMatch = line.match(/source\s+static\s+(\S+)\s+(\S+)/);
        if (staticMatch) {
            natRule.originalPacket.srcAddress = staticMatch[1];
            natRule.translatedPacket.srcAddress = staticMatch[2];
        }
        const dynamicMatch = line.match(/source\s+dynamic\s+(\S+)\s+(\S+)/);
        if (dynamicMatch) {
            natRule.originalPacket.srcAddress = dynamicMatch[1];
            natRule.translatedPacket.srcAddress = dynamicMatch[2];
        }
        const dstMatch = line.match(/destination\s+static\s+(\S+)\s+(\S+)/);
        if (dstMatch) {
            natRule.originalPacket.dstAddress = dstMatch[1];
            natRule.translatedPacket.dstAddress = dstMatch[2];
        }

        this.data.natRules.push(natRule);
        this.logInfo(`NAT rule parsed: type=${natRule.natType}`);
    }

    _parseObjectNat(line, objectName) {
        // Object-level NAT (inside the 'object network' block)
        let natRule = {
            name: `obj-nat-${objectName}`,
            _ruleOrder: this.data.natRules.length,
            natType: 'unknown',
            originalPacket: { srcAddress: objectName },
            translatedPacket: {},
            exceptions: [],
            _rawLines: [line]
        };

        const interfaceMatch = line.match(/\(([^,]+),([^)]+)\)/);
        if (interfaceMatch) {
            natRule.originalPacket.srcZone = interfaceMatch[1].trim();
            natRule.originalPacket.dstZone = interfaceMatch[2].trim();
        }

        if (line.includes('static ')) {
            natRule.natType = 'static';
            const staticMatch = line.match(/static\s+(\S+)/);
            if (staticMatch) {
                natRule.translatedPacket.srcAddress = staticMatch[1];
            }
            // Check for identity NAT
            if (natRule.translatedPacket.srcAddress === objectName) {
                natRule.natType = 'identity';
            }
        } else if (line.includes('dynamic interface')) {
            natRule.natType = 'pat_interface';
            natRule.translatedPacket.srcAddress = 'interface';
        } else if (line.includes('dynamic pat-pool')) {
            natRule.natType = 'pat';
            const patMatch = line.match(/pat-pool\s+(\S+)/);
            if (patMatch) natRule.translatedPacket.srcAddress = patMatch[1];
        } else if (line.includes('dynamic ')) {
            natRule.natType = 'dynamic';
            const dynMatch = line.match(/dynamic\s+(\S+)/);
            if (dynMatch) natRule.translatedPacket.srcAddress = dynMatch[1];
        } else {
            this.addException(natRule, 'unsupported_nat', 'high', `Object-level NAT type could not be determined: ${line}`, line);
        }

        this.data.natRules.push(natRule);
    }

    parseInterface(line) {
        let name = line.substring(7).trim();
        this.data.zones.push({ name, type: 'layer3', interfaces: [name], exceptions: [] });
    }

    // --- Utility ---

    maskToCidr(mask) {
        if (!mask) return '32';
        const parts = mask.split('.');
        if (parts.length !== 4) return '32';
        let cidr = 0;
        for (let i = 0; i < 4; i++) {
            const bin = parseInt(parts[i], 10).toString(2);
            cidr += (bin.match(/1/g) || []).length;
        }
        return cidr;
    }

    wildcardToCidr(wildcard) {
        if (!wildcard) return '32';
        const parts = wildcard.split('.');
        if (parts.length !== 4) return '32';
        let cidr = 0;
        for (let i = 0; i < 4; i++) {
            const inv = 255 - parseInt(parts[i], 10);
            cidr += inv.toString(2).split('').filter(b => b === '1').length;
        }
        return cidr;
    }
}
