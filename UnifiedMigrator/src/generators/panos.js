/**
 * PAN-OS Generator — Enhanced
 * Reads the upgraded IR schema (addresses, addressGroups, services, serviceGroups,
 * policies, natRules, staticRoutes, zones) with exceptions and confidence metadata.
 */

export class PanosGenerator {
    constructor(parsedData) {
        this.data = parsedData;
        this.logs = [];
    }

    generate() {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<config version="10.0.0" urldb="paloaltonetworks">
  <mgt-config>
    <password-complexity>
      <enabled>yes</enabled>
      <minimum-length>8</minimum-length>
    </password-complexity>
  </mgt-config>
  <shared>
    <application/>
    <application-group/>
    <service/>
    <service-group/>
  </shared>
  <devices>
    <entry name="localhost.localdomain">
      <network>
        <interface/>
        <virtual-router>
          <entry name="default">
            <protocol>
              <bgp><enable>no</enable></bgp>
              <rip><enable>no</enable></rip>
              <ospf><enable>no</enable></ospf>
              <ospfv3><enable>no</enable></ospfv3>
            </protocol>
            <routing-table>
              <ip>
                <static-route>
                  ${this.buildStaticRoutes()}
                </static-route>
              </ip>
            </routing-table>
          </entry>
        </virtual-router>
      </network>
      <vsys>
        <entry name="vsys1">
          <application/>
          <application-group/>
          <zone>
            ${this.buildZones()}
          </zone>
          <service>
            ${this.buildServices()}
          </service>
          <service-group>
            ${this.buildServiceGroups()}
          </service-group>
          <schedule/>
          <address>
            ${this.buildAddresses()}
          </address>
          <address-group>
            ${this.buildAddressGroups()}
          </address-group>
          <rulebase>
            <security>
              <rules>
                ${this.buildPolicies()}
              </rules>
            </security>
            <nat>
              <rules>
                ${this.buildNatRules()}
              </rules>
            </nat>
          </rulebase>
          <import>
            <network>
              <virtual-router>
                <member>default</member>
              </virtual-router>
            </network>
          </import>
        </entry>
      </vsys>
    </entry>
  </devices>
</config>`;

        return xml;
    }

    logInfo(msg) { this.logs.push({ level: 'info', message: msg }); }
    logWarning(msg) { this.logs.push({ level: 'warning', message: msg }); }
    getLogs() { return this.logs; }

    // --- XML Builders ---

    buildAddresses() {
        if (!this.data.addresses || !this.data.addresses.length) return '';
        let xml = '';
        this.data.addresses.forEach(addr => {
            let addrVal = (addr.value || '').replace(/"/g, '');
            const safeName = this.escapeXml(this.sanitizeName(addr.name));

            if (addr.type === 'ip-netmask') {
                xml += `<entry name="${safeName}"><ip-netmask>${this.escapeXml(addrVal)}</ip-netmask>`;
            } else if (addr.type === 'fqdn') {
                xml += `<entry name="${safeName}"><fqdn>${this.escapeXml(addrVal)}</fqdn>`;
            } else if (addr.type === 'ip-range') {
                xml += `<entry name="${safeName}"><ip-range>${this.escapeXml(addrVal)}</ip-range>`;
            } else {
                xml += `<entry name="${safeName}"><ip-netmask>${this.escapeXml(addrVal)}</ip-netmask>`;
                this.logWarning(`Address '${addr.name}' type '${addr.type}' mapped to ip-netmask as fallback.`);
            }

            if (addr.description) {
                xml += `<description>${this.escapeXml(addr.description)}</description>`;
            }

            // Embed exception comments
            if (addr.exceptions && addr.exceptions.length > 0) {
                xml += `<description>${this.escapeXml((addr.description || '') + ' [EXCEPTIONS: ' + addr.exceptions.map(e => e.reason).join('; ') + ']')}</description>`;
            }

            xml += `</entry>\n`;
        });
        return xml;
    }

    buildAddressGroups() {
        if (!this.data.addressGroups || !this.data.addressGroups.length) return '';
        let xml = '';
        this.data.addressGroups.forEach(grp => {
            xml += `<entry name="${this.escapeXml(this.sanitizeName(grp.name))}"><static>\n`;
            grp.members.forEach(member => {
                xml += `<member>${this.escapeXml(member)}</member>\n`;
            });
            xml += `</static></entry>\n`;
        });
        return xml;
    }

    buildServices() {
        if (!this.data.services || !this.data.services.length) return '';
        let xml = '';
        this.data.services.forEach(svc => {
            const proto = (svc.protocol || 'tcp').toLowerCase();
            const safeName = this.escapeXml(this.sanitizeName(svc.name));
            if (proto === 'tcp' || proto === 'udp') {
                xml += `<entry name="${safeName}"><protocol><${proto}><port>${this.escapeXml(svc.port || '0')}</port></${proto}></protocol></entry>\n`;
            } else {
                this.logWarning(`Service ${svc.name} protocol ${svc.protocol} not directly mapped.`);
                // Still emit it with a comment
                xml += `<entry name="${safeName}"><protocol><tcp><port>0</port></tcp></protocol><description>UNSUPPORTED_PROTO: ${this.escapeXml(svc.protocol)}</description></entry>\n`;
            }
        });
        return xml;
    }

    buildServiceGroups() {
        if (!this.data.serviceGroups || !this.data.serviceGroups.length) return '';
        let xml = '';
        this.data.serviceGroups.forEach(grp => {
            xml += `<entry name="${this.escapeXml(this.sanitizeName(grp.name))}"><members>\n`;
            grp.members.forEach(member => {
                xml += `<member>${this.escapeXml(member)}</member>\n`;
            });
            xml += `</members></entry>\n`;
        });
        return xml;
    }

    buildPolicies() {
        if (!this.data.policies || !this.data.policies.length) return '';
        let xml = '';

        // Sort by _ruleOrder to preserve original order
        const sorted = [...this.data.policies].sort((a, b) => (a._ruleOrder || 0) - (b._ruleOrder || 0));

        sorted.forEach(pol => {
            const safeName = this.escapeXml(this.sanitizeName(pol.name));
            xml += `<entry name="${safeName}">\n`;

            // Zones
            xml += `<from>\n`;
            (pol.from || ['any']).forEach(zone => xml += `<member>${this.escapeXml(zone)}</member>\n`);
            xml += `</from>\n`;

            xml += `<to>\n`;
            (pol.to || ['any']).forEach(zone => xml += `<member>${this.escapeXml(zone)}</member>\n`);
            xml += `</to>\n`;

            // Addresses
            xml += `<source>\n`;
            (pol.source || ['any']).forEach(src => xml += `<member>${this.escapeXml(src)}</member>\n`);
            xml += `</source>\n`;

            xml += `<destination>\n`;
            (pol.destination || ['any']).forEach(dst => xml += `<member>${this.escapeXml(dst)}</member>\n`);
            xml += `</destination>\n`;

            xml += `<source-user>\n<member>any</member>\n</source-user>\n`;
            xml += `<category>\n<member>any</member>\n</category>\n`;
            xml += `<application>\n<member>any</member>\n</application>\n`;

            // Service
            xml += `<service>\n`;
            (pol.service || ['any']).forEach(svc => xml += `<member>${this.escapeXml(svc)}</member>\n`);
            xml += `</service>\n`;

            // Action
            xml += `<action>${this.escapeXml(pol.action)}</action>\n`;

            // Description with confidence and exceptions
            let desc = pol.description || '';
            if (pol.confidence !== undefined && pol.confidence < 100) {
                desc += ` [Confidence: ${pol.confidence}%]`;
            }
            if (pol.exceptions && pol.exceptions.length > 0) {
                desc += ` [EXCEPTIONS: ${pol.exceptions.map(e => e.reason).join('; ')}]`;
            }
            if (desc) {
                xml += `<description>${this.escapeXml(desc.trim())}</description>\n`;
            }

            // Status
            if (pol.disabled) {
                xml += `<disabled>yes</disabled>\n`;
            }

            // Log
            if (pol.logEnd || pol.action === 'deny') {
                xml += `<log-end>yes</log-end>\n`;
            }
            if (pol.logStart) {
                xml += `<log-start>yes</log-start>\n`;
            }

            xml += `</entry>\n`;
        });
        return xml;
    }

    buildNatRules() {
        if (!this.data.natRules || !this.data.natRules.length) return '';
        let xml = '';

        const sorted = [...this.data.natRules].sort((a, b) => (a._ruleOrder || 0) - (b._ruleOrder || 0));

        sorted.forEach(nat => {
            const safeName = this.escapeXml(this.sanitizeName(nat.name));
            xml += `<entry name="${safeName}">\n`;

            // Source translation
            xml += `<source-translation>\n`;
            if (nat.natType === 'static' || nat.natType === 'static_bidirectional' || nat.natType === 'identity' || nat.natType === 'static_pat') {
                xml += `<static-ip>\n`;
                xml += `<translated-address>${this.escapeXml(nat.translatedPacket.srcAddress || 'any')}</translated-address>\n`;
                if (nat.natType === 'static_bidirectional') {
                    xml += `<bi-directional>yes</bi-directional>\n`;
                }
                xml += `</static-ip>\n`;
            } else if (nat.natType === 'dynamic' || nat.natType === 'dynamic_ippool') {
                xml += `<dynamic-ip-and-port>\n`;
                xml += `<translated-address>\n<member>${this.escapeXml(nat.translatedPacket.srcAddress || 'any')}</member>\n</translated-address>\n`;
                xml += `</dynamic-ip-and-port>\n`;
            } else if (nat.natType === 'pat' || nat.natType === 'pat_interface') {
                xml += `<dynamic-ip-and-port>\n`;
                if (nat.translatedPacket.srcAddress === 'interface') {
                    xml += `<interface-address><interface>any</interface></interface-address>\n`;
                } else {
                    xml += `<translated-address>\n<member>${this.escapeXml(nat.translatedPacket.srcAddress || 'any')}</member>\n</translated-address>\n`;
                }
                xml += `</dynamic-ip-and-port>\n`;
            } else {
                // Unknown type
                xml += `<!-- UNSUPPORTED NAT TYPE: ${this.escapeXml(nat.natType)} -->\n`;
                xml += `<dynamic-ip-and-port><interface-address><interface>any</interface></interface-address></dynamic-ip-and-port>\n`;
            }
            xml += `</source-translation>\n`;

            // Destination translation (if applicable)
            if (nat.translatedPacket.dstAddress) {
                xml += `<destination-translation>\n`;
                xml += `<translated-address>${this.escapeXml(nat.translatedPacket.dstAddress)}</translated-address>\n`;
                if (nat.translatedPacket.port) {
                    xml += `<translated-port>${this.escapeXml(nat.translatedPacket.port)}</translated-port>\n`;
                }
                xml += `</destination-translation>\n`;
            }

            // Original packet match
            xml += `<from><member>${this.escapeXml(nat.originalPacket.srcZone || 'any')}</member></from>\n`;
            xml += `<to><member>${this.escapeXml(nat.originalPacket.dstZone || 'any')}</member></to>\n`;
            xml += `<source><member>${this.escapeXml(nat.originalPacket.srcAddress || 'any')}</member></source>\n`;
            xml += `<destination><member>${this.escapeXml(nat.originalPacket.dstAddress || 'any')}</member></destination>\n`;

            // Exceptions metadata
            if (nat.exceptions && nat.exceptions.length > 0) {
                xml += `<description>EXCEPTIONS: ${this.escapeXml(nat.exceptions.map(e => e.reason).join('; '))}</description>\n`;
            }

            xml += `</entry>\n`;
        });

        return xml;
    }

    buildStaticRoutes() {
        if (!this.data.staticRoutes || !this.data.staticRoutes.length) return '';
        let xml = '';
        this.data.staticRoutes.forEach(route => {
            xml += `<entry name="${this.escapeXml(this.sanitizeName(route.name))}">
                <destination>${this.escapeXml(route.destination)}</destination>
                <nexthop><ip-address>${this.escapeXml(route.nexthop)}</ip-address></nexthop>
                ${route.metric ? `<metric>${this.escapeXml(route.metric)}</metric>` : ''}
            </entry>\n`;
        });
        return xml;
    }

    buildZones() {
        if (!this.data.zones || !this.data.zones.length) return '';
        let xml = '';
        this.data.zones.forEach(zone => {
            xml += `<entry name="${this.escapeXml(zone.name)}">
                <network><${zone.type}>\n`;
            zone.interfaces.forEach(intf => {
                xml += `<member>${this.escapeXml(intf)}</member>\n`;
            });
            xml += `</${zone.type}></network>
            </entry>\n`;
        });
        return xml;
    }

    // --- Helpers ---

    sanitizeName(name) {
        if (!name) return 'unnamed';
        // PAN-OS name max 63 chars, only alphanumeric, hyphens, underscores, dots
        return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 63);
    }

    escapeXml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString().replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
            }
        });
    }
}
