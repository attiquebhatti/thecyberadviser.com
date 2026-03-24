/**
 * FortiGate Parser — Enhanced
 * Extends BaseParser for exception tracking, confidence scoring,
 * deterministic normalization, NAT handling, schedules, and logging behavior.
 */
import { BaseParser } from './base.js';

export class FortigateParser extends BaseParser {
    constructor(configText) {
        super(configText);
        this._nameRegistry = new Set();
        this._ruleOrderIndex = 0;
    }

    parse() {
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();

            if (line.startsWith('config firewall address')) {
                this.parseFirewallAddress();
            } else if (line.startsWith('config firewall addrgrp')) {
                this.parseFirewallAddressGroup();
            } else if (line.startsWith('config firewall service custom')) {
                this.parseFirewallService();
            } else if (line.startsWith('config firewall service group')) {
                this.parseFirewallServiceGroup();
            } else if (line.startsWith('config firewall policy')) {
                this.parseFirewallPolicy();
            } else if (line.startsWith('config firewall vip')) {
                this.parseVIP();
            } else if (line.startsWith('config firewall ippool')) {
                this.parseIPPool();
            } else if (line.startsWith('config router static')) {
                this.parseStaticRoute();
            } else if (line.startsWith('config system interface')) {
                this.parseInterfaces();
            } else if (line.startsWith('config system zone')) {
                this.parseSystemZones();
            } else if (line.startsWith('config firewall central-snat-map')) {
                this.parseCentralSNAT();
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

    // --- Parsing sub-blocks ---

    parseFirewallAddress() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let rawName = match[1];
                    let name = this._uniqueName(rawName);
                    let address = { name, type: 'ip-netmask', value: '', exceptions: [], _rawLines: [line] };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set subnet')) {
                            const parts = this.parseSetCommand(innerLine);
                            if (parts.length >= 2) {
                                address.value = `${parts[0]}/${this.maskToCidr(parts[1])}`;
                            } else if (parts.length === 1 && parts[0].includes('/')) {
                                address.value = parts[0];
                            }
                        } else if (innerLine.startsWith('set type fqdn')) {
                            address.type = 'fqdn';
                        } else if (innerLine.startsWith('set type ipmask')) {
                            address.type = 'ip-netmask';
                        } else if (innerLine.startsWith('set type iprange')) {
                            address.type = 'ip-range';
                        } else if (innerLine.startsWith('set type wildcard')) {
                            address.type = 'wildcard';
                        } else if (innerLine.startsWith('set fqdn')) {
                            const parts = this.parseSetCommand(innerLine);
                            if (parts.length > 0) address.value = parts[0];
                        } else if (innerLine.startsWith('set start-ip')) {
                            address._startIp = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set end-ip')) {
                            address._endIp = this.parseSetCommand(innerLine)[0];
                            address.value = `${address._startIp}-${address._endIp}`;
                        } else if (innerLine.startsWith('set wildcard')) {
                            const parts = this.parseSetCommand(innerLine);
                            if (parts.length >= 2) address.value = `${parts[0]}/${parts[1]}`;
                        } else if (innerLine.startsWith('set comment')) {
                            address.description = this.parseSetCommand(innerLine).join(' ');
                        } else if (innerLine.startsWith('set associated-interface')) {
                            address.associatedInterface = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set ')) {
                            // Track but don't fail
                            this.addException(address, 'unsupported_attribute', 'low', `Unrecognized attribute: ${innerLine}`, innerLine);
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    if (address.value) {
                        this.data.addresses.push(address);
                    } else {
                        this.addException(address, 'empty_object', 'medium', `Address '${name}' has no value.`, line);
                        address.value = '0.0.0.0/0';
                        this.data.addresses.push(address);
                        this.logWarning(`Address object '${name}' has no value, added with placeholder.`);
                    }
                }
            }
            this.currentLineIndex++;
        }
    }

    parseFirewallAddressGroup() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let name = this._uniqueName(match[1]);
                    let group = { name, members: [], exceptions: [], _rawLines: [line] };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set member')) {
                            group.members = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set comment')) {
                            group.description = this.parseSetCommand(innerLine).join(' ');
                        } else if (innerLine.startsWith('set ')) {
                            this.addException(group, 'unsupported_attribute', 'low', `Unrecognized attribute: ${innerLine}`, innerLine);
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    if (group.members.length > 0) {
                        this.data.addressGroups.push(group);
                    } else {
                        this.addException(group, 'empty_group', 'medium', `Address Group '${name}' is empty.`, line);
                        this.data.addressGroups.push(group);
                        this.logWarning(`Address Group '${name}' is empty.`);
                    }
                }
            }
            this.currentLineIndex++;
        }
    }

    parseFirewallService() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let name = this._uniqueName(match[1]);
                    let service = { name, protocol: 'tcp', port: '', exceptions: [], _rawLines: [line] };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set tcp-portrange')) {
                            service.protocol = 'tcp';
                            service.port = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set udp-portrange')) {
                            service.protocol = 'udp';
                            service.port = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set sctp-portrange')) {
                            service.protocol = 'sctp';
                            service.port = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set protocol')) {
                            const proto = this.parseSetCommand(innerLine)[0];
                            if (proto === 'ICMP') {
                                service.protocol = 'icmp';
                            } else if (proto === 'IP') {
                                service.protocol = 'ip';
                            } else if (proto !== 'TCP/UDP/SCTP') {
                                service.protocol = proto;
                            }
                        } else if (innerLine.startsWith('set icmptype')) {
                            service.icmpType = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set icmpcode')) {
                            service.icmpCode = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set comment')) {
                            service.description = this.parseSetCommand(innerLine).join(' ');
                        } else if (innerLine.startsWith('set protocol-number')) {
                            service.protocolNumber = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set ')) {
                            this.addException(service, 'unsupported_attribute', 'low', `Unrecognized attribute: ${innerLine}`, innerLine);
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    if (service.port || service.protocol === 'icmp' || service.protocol === 'ip') {
                        this.data.services.push(service);
                    } else if (!line.includes('ALL')) {
                        this.addException(service, 'missing_port', 'medium', `Service '${name}' missing port range.`, line);
                        this.data.services.push(service);
                        this.logWarning(`Service '${name}' missing port range.`);
                    }
                }
            }
            this.currentLineIndex++;
        }
    }

    parseFirewallServiceGroup() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let name = this._uniqueName(match[1]);
                    let group = { name, members: [], exceptions: [], _rawLines: [line] };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set member')) {
                            group.members = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set comment')) {
                            group.description = this.parseSetCommand(innerLine).join(' ');
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    this.data.serviceGroups.push(group);
                }
            }
            this.currentLineIndex++;
        }
    }

    parseFirewallPolicy() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+(\d+)/);
                if (match) {
                    let policy = {
                        name: `Rule-${match[1]}`,
                        _ruleOrder: this._ruleOrderIndex,
                        from: [],
                        to: [],
                        source: [],
                        destination: [],
                        service: [],
                        action: 'deny',
                        logStart: false,
                        logEnd: false,
                        disabled: false,
                        schedule: 'always',
                        exceptions: [],
                        _rawLines: [line]
                    };

                    let insideEdit = true;
                    let policyHasNat = false;
                    let natType = null;
                    let ippool = null;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set name')) {
                            policy.name = this.parseSetCommand(innerLine)[0] || policy.name;
                        } else if (innerLine.startsWith('set srcintf')) {
                            policy.from = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set dstintf')) {
                            policy.to = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set srcaddr')) {
                            policy.source = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set dstaddr')) {
                            policy.destination = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set service')) {
                            policy.service = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set action')) {
                            policy.action = this.parseSetCommand(innerLine)[0] === 'accept' ? 'allow' : 'deny';
                        } else if (innerLine.startsWith('set status')) {
                            policy.disabled = this.parseSetCommand(innerLine)[0] === 'disable';
                        } else if (innerLine.startsWith('set schedule')) {
                            policy.schedule = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set logtraffic')) {
                            const log = this.parseSetCommand(innerLine)[0];
                            if (log === 'all' || log === 'utm') {
                                policy.logEnd = true;
                                policy.logStart = true;
                            } else if (log === 'disable') {
                                policy.logEnd = false;
                                policy.logStart = false;
                            }
                        } else if (innerLine.startsWith('set logtraffic-start')) {
                            policy.logStart = this.parseSetCommand(innerLine)[0] === 'enable';
                        } else if (innerLine.startsWith('set nat enable')) {
                            policyHasNat = true;
                        } else if (innerLine === 'set nat enable') {
                            policyHasNat = true;
                        } else if (innerLine.startsWith('set ippool')) {
                            ippool = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set poolname')) {
                            natType = 'dynamic_ippool';
                            ippool = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set comments')) {
                            policy.description = this.parseSetCommand(innerLine).join(' ');
                        } else if (innerLine.startsWith('set groups')) {
                            policy.userGroups = this.parseSetCommand(innerLine);
                        } else if (innerLine.startsWith('set utm-status')) {
                            policy.utmStatus = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set ')) {
                            // Track but don't fail
                            this.addException(policy, 'unsupported_attribute', 'low', `Unrecognized policy attribute: ${innerLine}`, innerLine);
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    // Clean up ALL/all/any placeholders
                    if (policy.source.includes('all')) policy.source = ['any'];
                    if (policy.destination.includes('all')) policy.destination = ['any'];
                    if (policy.service.includes('ALL')) policy.service = ['any'];
                    if (policy.from.includes('any')) policy.from = ['any'];
                    if (policy.to.includes('any')) policy.to = ['any'];

                    this._ruleOrderIndex++;
                    this.data.policies.push(policy);

                    // If policy has NAT enabled, create a NAT rule
                    if (policyHasNat) {
                        let natRule = {
                            name: `policy-nat-${policy.name}`,
                            _ruleOrder: this.data.natRules.length,
                            natType: natType || 'pat_interface',
                            originalPacket: {
                                srcZone: policy.from[0] || 'any',
                                dstZone: policy.to[0] || 'any',
                                srcAddress: policy.source[0] || 'any',
                                dstAddress: policy.destination[0] || 'any'
                            },
                            translatedPacket: {
                                srcAddress: ippool || 'interface'
                            },
                            exceptions: [],
                            _rawLines: [`from policy ${policy.name}`]
                        };
                        this.data.natRules.push(natRule);
                    }
                }
            }
            this.currentLineIndex++;
        }
    }

    parseVIP() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let vipName = match[1];
                    let natRule = {
                        name: `vip-${vipName}`,
                        _ruleOrder: this.data.natRules.length,
                        natType: 'static',
                        originalPacket: {},
                        translatedPacket: {},
                        exceptions: [],
                        _rawLines: [line]
                    };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set extip')) {
                            natRule.originalPacket.dstAddress = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set mappedip')) {
                            natRule.translatedPacket.dstAddress = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set extintf')) {
                            natRule.originalPacket.dstZone = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set portforward enable')) {
                            natRule.natType = 'static_pat';
                        } else if (innerLine.startsWith('set extport')) {
                            natRule.originalPacket.port = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set mappedport')) {
                            natRule.translatedPacket.port = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set comment')) {
                            natRule.description = this.parseSetCommand(innerLine).join(' ');
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    // Also create address object for the VIP
                    if (natRule.originalPacket.dstAddress) {
                        this.data.addresses.push({
                            name: this._uniqueName(vipName),
                            type: 'ip-netmask',
                            value: `${natRule.originalPacket.dstAddress}/32`,
                            exceptions: []
                        });
                    }

                    this.data.natRules.push(natRule);
                }
            }
            this.currentLineIndex++;
        }
    }

    parseIPPool() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let natRule = {
                        name: `ippool-${match[1]}`,
                        _ruleOrder: this.data.natRules.length,
                        natType: 'dynamic',
                        originalPacket: {},
                        translatedPacket: {},
                        exceptions: [],
                        _rawLines: [line]
                    };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set startip')) {
                            natRule.translatedPacket.startIp = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set endip')) {
                            natRule.translatedPacket.endIp = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set type')) {
                            const poolType = this.parseSetCommand(innerLine)[0];
                            if (poolType === 'overload') natRule.natType = 'pat';
                            else if (poolType === 'one-to-one') natRule.natType = 'static';
                        } else if (innerLine.startsWith('set comments')) {
                            natRule.description = this.parseSetCommand(innerLine).join(' ');
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    this.data.natRules.push(natRule);
                }
            }
            this.currentLineIndex++;
        }
    }

    parseCentralSNAT() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+(\d+)/);
                if (match) {
                    let natRule = {
                        name: `central-snat-${match[1]}`,
                        _ruleOrder: this.data.natRules.length,
                        natType: 'dynamic',
                        originalPacket: {},
                        translatedPacket: {},
                        exceptions: [],
                        _rawLines: [line]
                    };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set srcintf')) {
                            natRule.originalPacket.srcZone = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set dstintf')) {
                            natRule.originalPacket.dstZone = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set orig-addr')) {
                            natRule.originalPacket.srcAddress = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set dst-addr')) {
                            natRule.originalPacket.dstAddress = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set nat-ippool')) {
                            natRule.translatedPacket.srcAddress = this.parseSetCommand(innerLine)[0];
                            natRule.natType = 'dynamic_ippool';
                        } else if (innerLine.startsWith('set nat')) {
                            if (innerLine.includes('enable')) natRule.natType = 'pat_interface';
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    this.data.natRules.push(natRule);
                }
            }
            this.currentLineIndex++;
        }
    }

    parseStaticRoute() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+(\d+)/);
                if (match) {
                    let route = {
                        name: `Route-${match[1]}`,
                        destination: '',
                        nexthop: '',
                        interface: '',
                        metric: '0',
                        exceptions: [],
                        _rawLines: [line]
                    };

                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set dst')) {
                            const parts = this.parseSetCommand(innerLine);
                            if (parts.length >= 2) {
                                route.destination = `${parts[0]}/${this.maskToCidr(parts[1])}`;
                            } else if (parts.length === 1 && parts[0].includes('/')) {
                                route.destination = parts[0];
                            }
                        } else if (innerLine.startsWith('set gateway')) {
                            route.nexthop = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set device')) {
                            route.interface = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set distance')) {
                            route.metric = this.parseSetCommand(innerLine)[0];
                        } else if (innerLine.startsWith('set comment')) {
                            route.description = this.parseSetCommand(innerLine).join(' ');
                        }

                        if (insideEdit) this.currentLineIndex++;
                    }

                    if (route.destination && route.nexthop) {
                        this.data.staticRoutes.push(route);
                    } else if (route.destination && route.interface) {
                        // Connected route (no nexthop, just interface)
                        route.nexthop = route.interface;
                        this.data.staticRoutes.push(route);
                    } else {
                        this.addException(route, 'incomplete_route', 'medium', `Route ${route.name} missing destination or nexthop.`, line);
                        this.data.staticRoutes.push(route);
                    }
                }
            }
            this.currentLineIndex++;
        }
    }

    parseInterfaces() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let intf = { name: match[1], type: 'layer3', ip: '', vdom: '' };
                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set ip')) {
                            intf.ip = this.parseSetCommand(innerLine).join(' ');
                        } else if (innerLine.startsWith('set vdom')) {
                            intf.vdom = this.parseSetCommand(innerLine)[0];
                        }
                        if (insideEdit) this.currentLineIndex++;
                    }
                    this.data.zones.push({ name: intf.name, type: 'layer3', interfaces: [intf.name], exceptions: [] });
                }
            }
            this.currentLineIndex++;
        }
    }

    parseSystemZones() {
        this.currentLineIndex++;
        while (this.currentLineIndex < this.lines.length) {
            const line = this.lines[this.currentLineIndex].trim();
            if (line === 'end') break;

            if (line.startsWith('edit')) {
                let match = line.match(/^edit\s+"?([^"]+)"?/);
                if (match) {
                    let zone = { name: match[1], type: 'layer3', interfaces: [], exceptions: [] };
                    let insideEdit = true;
                    this.currentLineIndex++;

                    while (insideEdit && this.currentLineIndex < this.lines.length) {
                        const innerLine = this.lines[this.currentLineIndex].trim();
                        if (innerLine === 'next') {
                            insideEdit = false;
                        } else if (innerLine.startsWith('set interface')) {
                            zone.interfaces = this.parseSetCommand(innerLine);
                        }
                        if (insideEdit) this.currentLineIndex++;
                    }
                    this.data.zones.push(zone);
                }
            }
            this.currentLineIndex++;
        }
    }

    // --- Utils ---

    parseSetCommand(line) {
        const parts = line.split(/\s+/).slice(2);
        return parts.map(p => p.replace(/"/g, ''));
    }

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
}
