// ────────────────────────────────────────────────────────────────
// Panorama running-config XML → PanoramaModel
// ────────────────────────────────────────────────────────────────
//
// Hierarchy-aware parser built on the browser-native DOMParser. The
// whole migration runs client-side (configs never leave the machine),
// so we can lean on a real XML parser rather than fragile regex — this
// is essential for Panorama exports, which nest device-groups,
// templates and pre/post rulebases many levels deep.
//

import type {
  PanAddress,
  PanAddressGroup,
  PanApplicationGroup,
  PanClientlessApp,
  PanDeviceGroup,
  PanExternalList,
  PanInterface,
  PrismaAccessConfig,
  PanNatRule,
  PanNatTranslation,
  PanObjectBag,
  PanoramaModel,
  PanRuleTarget,
  PanSchedule,
  PanSecurityRule,
  PanService,
  PanServiceGroup,
  PanStaticRouteEntry,
  PanTag,
  PanTemplate,
  PanTemplateStack,
  PanVirtualRouter,
  ScmRulebasePhase,
} from '@/lib/unified-migrator/scm/types';

// ── DOM helpers ─────────────────────────────────────────────────

function getDoc(xml: string): Document {
  if (typeof DOMParser === 'undefined') {
    throw new Error(
      'Panorama → SCM migration must run in the browser (DOMParser unavailable in this context).'
    );
  }
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  // Browser DOMParser reports failures via a <parsererror> node; guard the
  // call since non-browser DOM shims may not implement querySelector.
  const err = typeof doc.querySelector === 'function' ? doc.querySelector('parsererror') : null;
  if (err) {
    throw new Error('The uploaded file is not valid XML. Export the Panorama running-config as XML and retry.');
  }
  if (!doc.documentElement) {
    throw new Error('The uploaded file is not valid XML. Export the Panorama running-config as XML and retry.');
  }
  return doc;
}

/** All `<section><entry>…` entries under `parent` (aggregates if the
 *  section element appears more than once). */
function entries(parent: Element | null, section: string): Element[] {
  if (!parent) return [];
  return directChildren(parent, section).flatMap((sec) => directChildren(sec, 'entry'));
}

/** Element-only children, via childNodes (works in browser and DOM shims). */
function elementChildren(parent: Element): Element[] {
  const out: Element[] = [];
  const nodes = parent.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i] as any;
    if (n.nodeType === 1) out.push(n as Element);
  }
  return out;
}

function directChild(parent: Element, tag: string): Element | null {
  for (const child of elementChildren(parent)) {
    if (child.tagName === tag) return child;
  }
  return null;
}

function directChildren(parent: Element, tag: string): Element[] {
  return elementChildren(parent).filter((c) => c.tagName === tag);
}

/** All descendant elements with the given tag, at any depth. */
function findDescendants(parent: Element, tag: string): Element[] {
  const out: Element[] = [];
  const walk = (el: Element) => {
    for (const child of elementChildren(el)) {
      if (child.tagName === tag) out.push(child);
      walk(child);
    }
  };
  walk(parent);
  return out;
}

/** Serialized inner XML of an element (browser innerHTML, or a serializer fallback). */
function innerXml(el: Element): string {
  const html = (el as any).innerHTML;
  if (typeof html === 'string') return html;
  if (typeof XMLSerializer !== 'undefined') {
    const ser = new XMLSerializer();
    return elementChildren(el).map((c) => ser.serializeToString(c as any)).join('');
  }
  return '';
}

/** Resolve a dotted path of direct children, e.g. "pre-rulebase.security.rules". */
function descend(parent: Element | null, path: string): Element | null {
  let cur: Element | null = parent;
  for (const seg of path.split('.')) {
    if (!cur) return null;
    cur = directChild(cur, seg);
  }
  return cur;
}

function text(parent: Element | null, tag: string): string | undefined {
  if (!parent) return undefined;
  const el = directChild(parent, tag);
  const t = el?.textContent?.trim();
  return t || undefined;
}

/** <tag><member>x</member><member>y</member></tag> → ['x','y']. */
function members(parent: Element | null, tag: string): string[] {
  if (!parent) return [];
  const el = directChild(parent, tag);
  if (!el) return [];
  return directChildren(el, 'member')
    .map((m) => m.textContent?.trim() || '')
    .filter(Boolean);
}

function boolTag(parent: Element | null, tag: string): boolean {
  return text(parent, tag) === 'yes';
}

const name = (el: Element) => el.getAttribute('name') || '';

// ── Object-bag extraction (shared OR a device-group entry) ───────

function parseObjectBag(scope: Element | null, phaseRoot: Element | null = scope): PanObjectBag {
  return {
    addresses: parseAddresses(scope),
    addressGroups: parseAddressGroups(scope),
    services: parseServices(scope),
    serviceGroups: parseServiceGroups(scope),
    applicationGroups: parseApplicationGroups(scope),
    tags: parseTags(scope),
    externalLists: parseExternalLists(scope),
    schedules: parseSchedules(scope),
    preSecurity: parseSecurityRules(phaseRoot, 'pre'),
    postSecurity: parseSecurityRules(phaseRoot, 'post'),
    preNat: parseNatRules(phaseRoot, 'pre'),
    postNat: parseNatRules(phaseRoot, 'post'),
  };
}

function parseAddresses(scope: Element | null): PanAddress[] {
  return entries(scope, 'address').map((e) => {
    let type: PanAddress['type'] = 'ip-netmask';
    let value = '';
    for (const t of ['ip-netmask', 'ip-range', 'ip-wildcard', 'fqdn'] as const) {
      const v = text(e, t);
      if (v !== undefined) {
        type = t;
        value = v;
        break;
      }
    }
    return {
      name: name(e),
      type,
      value,
      description: text(e, 'description'),
      tags: members(e, 'tag'),
    };
  });
}

function parseAddressGroups(scope: Element | null): PanAddressGroup[] {
  return entries(scope, 'address-group').map((e) => {
    const staticEl = directChild(e, 'static');
    const dynamicEl = directChild(e, 'dynamic');
    return {
      name: name(e),
      staticMembers: staticEl
        ? directChildren(staticEl, 'member').map((m) => m.textContent?.trim() || '').filter(Boolean)
        : undefined,
      dynamicFilter: dynamicEl ? text(dynamicEl, 'filter') : undefined,
      description: text(e, 'description'),
      tags: members(e, 'tag'),
    };
  });
}

function parseServices(scope: Element | null): PanService[] {
  return entries(scope, 'service').map((e) => {
    const proto = directChild(e, 'protocol');
    let protocol: PanService['protocol'] = 'other';
    let port: string | undefined;
    let sourcePort: string | undefined;
    if (proto) {
      const tcp = directChild(proto, 'tcp');
      const udp = directChild(proto, 'udp');
      const pe = tcp || udp;
      if (tcp) protocol = 'tcp';
      else if (udp) protocol = 'udp';
      if (pe) {
        port = text(pe, 'port');
        sourcePort = text(pe, 'source-port');
      }
    }
    return {
      name: name(e),
      protocol,
      port,
      sourcePort,
      description: text(e, 'description'),
      tags: members(e, 'tag'),
    };
  });
}

function parseServiceGroups(scope: Element | null): PanServiceGroup[] {
  return entries(scope, 'service-group').map((e) => ({
    name: name(e),
    members: members(e, 'members'),
    tags: members(e, 'tag'),
  }));
}

function parseApplicationGroups(scope: Element | null): PanApplicationGroup[] {
  return entries(scope, 'application-group').map((e) => ({
    name: name(e),
    members: members(e, 'members'),
  }));
}

function parseTags(scope: Element | null): PanTag[] {
  return entries(scope, 'tag').map((e) => ({
    name: name(e),
    color: text(e, 'color'),
    comments: text(e, 'comments'),
  }));
}

function parseExternalLists(scope: Element | null): PanExternalList[] {
  return entries(scope, 'external-list').map((e) => {
    const typeEl = directChild(e, 'type');
    let type: PanExternalList['type'] = 'unknown';
    let url: string | undefined;
    let recurring: string | undefined;
    if (typeEl) {
      for (const t of ['ip', 'domain', 'url'] as const) {
        const inner = directChild(typeEl, t);
        if (inner) {
          type = t;
          url = text(inner, 'url');
          const rec = directChild(inner, 'recurring');
          if (rec) recurring = rec.firstElementChild?.tagName;
          break;
        }
      }
    }
    return { name: name(e), type, url, recurring, description: text(e, 'description') };
  });
}

function parseSchedules(scope: Element | null): PanSchedule[] {
  return entries(scope, 'schedule').map((e) => {
    const st = directChild(e, 'schedule-type');
    let kind: PanSchedule['kind'] = 'unknown';
    if (st) {
      if (directChild(st, 'recurring')) kind = 'recurring';
      else if (directChild(st, 'non-recurring')) kind = 'non-recurring';
    }
    return { name: name(e), kind, raw: innerXml(e) };
  });
}

// ── Rule parsing ────────────────────────────────────────────────

function rulesRoot(phaseRoot: Element | null, phase: ScmRulebasePhase, kind: 'security' | 'nat'): Element | null {
  // Panorama: <pre-rulebase><security><rules> / <post-rulebase><nat><rules>
  return descend(phaseRoot, `${phase}-rulebase.${kind}.rules`);
}

function parseTarget(e: Element): PanRuleTarget | undefined {
  const t = directChild(e, 'target');
  if (!t) return undefined;
  const devicesEl = directChild(t, 'devices');
  const devices = devicesEl ? directChildren(devicesEl, 'entry').map(name).filter(Boolean) : [];
  const negate = boolTag(t, 'negate');
  if (devices.length === 0 && !negate) return undefined;
  return { devices, negate };
}

function endpoint(e: Element, tag: string): string[] {
  const m = members(e, tag);
  return m.length ? m : ['any'];
}

function parseSecurityRules(phaseRoot: Element | null, phase: ScmRulebasePhase): PanSecurityRule[] {
  const root = rulesRoot(phaseRoot, phase, 'security');
  if (!root) return [];
  return directChildren(root, 'entry').map((e) => {
    const profileEl = directChild(e, 'profile-setting');
    const profileGroup = profileEl ? members(profileEl, 'group')[0] : undefined;
    return {
      name: name(e),
      uuid: e.getAttribute('uuid') || undefined,
      fromZones: endpoint(e, 'from'),
      toZones: endpoint(e, 'to'),
      source: endpoint(e, 'source'),
      destination: endpoint(e, 'destination'),
      sourceUser: members(e, 'source-user'),
      application: endpoint(e, 'application'),
      service: endpoint(e, 'service'),
      category: members(e, 'category'),
      action: text(e, 'action') || 'allow',
      disabled: boolTag(e, 'disabled'),
      logStart: boolTag(e, 'log-start'),
      logEnd: boolTag(e, 'log-end'),
      logForwarding: text(e, 'log-setting'),
      profileGroup,
      profileSetting: profileEl ? 'group' : undefined,
      schedule: text(e, 'schedule'),
      tags: members(e, 'tag'),
      groupTag: text(e, 'group-tag'),
      negateSource: boolTag(e, 'negate-source'),
      negateDestination: boolTag(e, 'negate-destination'),
      description: text(e, 'description'),
      target: parseTarget(e),
      saasUserList: directChild(e, 'saas-user-list') ? 'present' : undefined,
      rulebase: phase,
    };
  });
}

function parseNatTranslation(parent: Element, tag: 'source-translation' | 'destination-translation'): PanNatTranslation | undefined {
  const el = directChild(parent, tag);
  if (!el) return undefined;
  if (tag === 'destination-translation') {
    return {
      kind: 'destination',
      translatedAddress: text(el, 'translated-address') ? [text(el, 'translated-address') as string] : undefined,
      translatedPort: text(el, 'translated-port'),
    };
  }
  const dipp = directChild(el, 'dynamic-ip-and-port');
  if (dipp) {
    const ifaceAddr = directChild(dipp, 'interface-address');
    if (ifaceAddr) {
      return { kind: 'dynamic-ip-and-port', interface: text(ifaceAddr, 'interface') };
    }
    return { kind: 'dynamic-ip-and-port', translatedAddress: members(dipp, 'translated-address') };
  }
  const dip = directChild(el, 'dynamic-ip');
  if (dip) return { kind: 'dynamic-ip', translatedAddress: members(dip, 'translated-address') };
  const sip = directChild(el, 'static-ip');
  if (sip) return { kind: 'static-ip', translatedAddress: text(sip, 'translated-address') ? [text(sip, 'translated-address') as string] : undefined };
  return { kind: 'unknown' };
}

function parseNatRules(phaseRoot: Element | null, phase: ScmRulebasePhase): PanNatRule[] {
  const root = rulesRoot(phaseRoot, phase, 'nat');
  if (!root) return [];
  return directChildren(root, 'entry').map((e) => {
    const srcXlate = parseNatTranslation(e, 'source-translation');
    const sip = directChild(e, 'source-translation');
    const bidirectional = sip ? boolTag(directChild(sip, 'static-ip') || e, 'bi-directional') : false;
    return {
      name: name(e),
      uuid: e.getAttribute('uuid') || undefined,
      fromZones: endpoint(e, 'from'),
      toZones: endpoint(e, 'to'),
      source: endpoint(e, 'source'),
      destination: endpoint(e, 'destination'),
      service: text(e, 'service'),
      sourceTranslation: srcXlate,
      destinationTranslation: parseNatTranslation(e, 'destination-translation'),
      bidirectional,
      disabled: boolTag(e, 'disabled'),
      tags: members(e, 'tag'),
      description: text(e, 'description'),
      target: parseTarget(e),
      rulebase: phase,
    };
  });
}

// ── Templates & template-stacks ─────────────────────────────────

function parseStaticRoutes(vrEntry: Element): PanStaticRouteEntry[] {
  // routing-table → ip → static-route → entry  (also tolerate logical-router vrf layout)
  const srRoots = findDescendants(vrEntry, 'static-route');
  const out: PanStaticRouteEntry[] = [];
  for (const sr of srRoots) {
    for (const r of directChildren(sr, 'entry')) {
      const nh = directChild(r, 'nexthop');
      let nexthopType: PanStaticRouteEntry['nexthopType'] = 'none';
      let nexthop: string | undefined;
      if (nh) {
        if (text(nh, 'ip-address')) { nexthopType = 'ip-address'; nexthop = text(nh, 'ip-address'); }
        else if (text(nh, 'next-vr')) { nexthopType = 'next-vr'; nexthop = text(nh, 'next-vr'); }
        else if (text(nh, 'fqdn')) { nexthopType = 'fqdn'; nexthop = text(nh, 'fqdn'); }
        else if (directChild(nh, 'discard')) { nexthopType = 'discard'; }
      }
      out.push({
        name: name(r),
        destination: text(r, 'destination') || '',
        nexthopType,
        nexthop,
        interface: text(r, 'interface'),
        metric: text(r, 'metric'),
        adminDistance: text(r, 'admin-dist'),
      });
    }
  }
  return out;
}

function parseVirtualRouters(e: Element): PanVirtualRouter[] {
  // virtual-router (classic) or logical-router (newer) entries, at any depth.
  const vrParents = [...findDescendants(e, 'virtual-router'), ...findDescendants(e, 'logical-router')];
  const out: PanVirtualRouter[] = [];
  for (const vp of vrParents) {
    for (const vr of directChildren(vp, 'entry')) {
      out.push({
        name: name(vr),
        staticRoutes: parseStaticRoutes(vr),
        hasBgp: findDescendants(vr, 'bgp').length > 0,
        interfaces: members(vr, 'interface'),
      });
    }
  }
  return out;
}

function parseInterfaceDetails(e: Element, templateName: string): PanInterface[] {
  // network/interface/ethernet/entry[@name]/layer3/ip/entry[@name=<cidr>]
  const out: PanInterface[] = [];
  for (const eth of findDescendants(e, 'ethernet')) {
    for (const iface of directChildren(eth, 'entry')) {
      const l3 = directChild(iface, 'layer3');
      let ip: string | undefined;
      if (l3) {
        const ipEl = directChild(l3, 'ip');
        if (ipEl) ip = directChildren(ipEl, 'entry').map(name).filter(Boolean)[0];
        if (!ip && directChild(l3, 'dhcp-client')) ip = 'dhcp';
      }
      out.push({ name: name(iface), ip, template: templateName, comment: text(iface, 'comment') });
    }
  }
  return out;
}

function parseClientlessApps(e: Element, templateName: string): PanClientlessApp[] {
  const out: PanClientlessApp[] = [];
  for (const cv of findDescendants(e, 'clientless-vpn')) {
    // climb to the enclosing gateway entry name if available
    let gw = '';
    let p: any = (cv as any).parentNode;
    while (p && p.nodeType === 1) {
      if (p.tagName === 'entry') { gw = p.getAttribute('name') || ''; break; }
      p = p.parentNode;
    }
    for (const appsEl of directChildren(cv, 'applications')) {
      for (const app of directChildren(appsEl, 'entry')) {
        out.push({
          name: name(app),
          url: text(app, 'application-domain') || text(app, 'landing-page') || undefined,
          gateway: gw,
          template: templateName,
        });
      }
    }
  }
  return out;
}

function parseTemplate(e: Element): PanTemplate {
  const raw = innerXml(e);
  const virtualRouters = parseVirtualRouters(e);
  return {
    name: name(e),
    hasGroupMapping: /<group-mapping>/.test(raw),
    hasCloudIdentityEngine: /<cloud-identity-engine>/.test(raw),
    bgpAddressFamilies: Array.from(raw.matchAll(/<address-family-identifier>([^<]+)<\/address-family-identifier>/g)).map((m) => m[1]),
    virtualRouterNames: virtualRouters.map((v) => v.name),
    virtualRouters,
    gpDefaultBrowser: /<default-browser>/.test(raw),
    zones: Array.from(raw.matchAll(/<zone>[\s\S]*?<entry name="([^"]+)"/g)).map((m) => m[1]),
    interfaces: Array.from(raw.matchAll(/<ethernet>[\s\S]*?<entry name="([^"]+)"/g)).map((m) => m[1]),
    interfaceDetails: parseInterfaceDetails(e, name(e)),
    clientlessApps: parseClientlessApps(e, name(e)),
    rawXml: raw,
  };
}

function parseTemplateStack(e: Element): PanTemplateStack {
  const devicesEl = directChild(e, 'devices');
  return {
    name: name(e),
    templates: members(e, 'templates'),
    deviceSerials: devicesEl ? directChildren(devicesEl, 'entry').map(name).filter(Boolean) : [],
  };
}

// ── Device groups ───────────────────────────────────────────────

function parseDeviceGroup(e: Element): PanDeviceGroup {
  const devicesEl = directChild(e, 'devices');
  // User-ID master device can appear as <master-device><device>serial</device>.
  const masterEl = directChild(e, 'master-device');
  return {
    name: name(e),
    parent: text(e, 'parent-dg'),
    objects: parseObjectBag(e, e),
    userIdMasterDevice: masterEl ? text(masterEl, 'device') : undefined,
    deviceSerials: devicesEl ? directChildren(devicesEl, 'entry').map(name).filter(Boolean) : [],
  };
}

// ── Coverage cross-check ────────────────────────────────────────
//
// Independent (regex-based) count of <entry> elements per section,
// computed straight from the raw XML — deliberately NOT reusing the
// DOM traversal above, so it can catch anything the structured parser
// silently misses. Surfaced in the report as a sanity check.

/** Count <entry> inside every <wrapper>…</wrapper> block (wrappers don't self-nest). */
function countEntriesIn(xml: string, wrapper: string): number {
  let total = 0;
  const re = new RegExp(`<${wrapper}>([\\s\\S]*?)</${wrapper}>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    total += (m[1].match(/<entry\b/g) || []).length;
  }
  return total;
}

export function rawSectionCounts(xml: string): Record<string, number> {
  // security/nat rules: count entries within each rulebase kind block.
  // Strip nested <target> blocks first — their <entry> firewall-serials would
  // otherwise be miscounted as rules.
  const ruleEntries = (kind: 'security' | 'nat') => {
    let total = 0;
    const re = new RegExp(`<${kind}>\\s*<rules>([\\s\\S]*?)</rules>\\s*</${kind}>`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml))) {
      const body = m[1].replace(/<target>[\s\S]*?<\/target>/g, '');
      total += (body.match(/<entry\b/g) || []).length;
    }
    return total;
  };
  return {
    address: countEntriesIn(xml, 'address'),
    'address-group': countEntriesIn(xml, 'address-group'),
    service: countEntriesIn(xml, 'service'),
    'service-group': countEntriesIn(xml, 'service-group'),
    'application-group': countEntriesIn(xml, 'application-group'),
    'security-rules': ruleEntries('security'),
    'nat-rules': ruleEntries('nat'),
  };
}

// ── Top-level parse ─────────────────────────────────────────────

// ── Panorama-managed Prisma Access (cloud_services plugin) ──────
function parsePrismaAccess(root: Element | null): PrismaAccessConfig | undefined {
  if (!root) return undefined;
  const cs = findDescendants(root, 'cloud_services')[0] || findDescendants(root, 'cloud-services')[0];
  if (!cs) return undefined;

  // remote-networks / service-connection(s) onboarding entries.
  const onboardingEntries = (parentTag: string): Element[] => {
    const parent = findDescendants(cs, parentTag)[0];
    if (!parent) return [];
    const onb = directChild(parent, 'onboarding');
    return onb ? directChildren(onb, 'entry') : directChildren(parent, 'entry');
  };

  const remoteNetworks = onboardingEntries('remote-networks').map((e) => ({
    name: name(e),
    region: text(e, 'region'),
    ipsecTunnel: text(e, 'ipsec-tunnel'),
    subnets: members(e, 'subnets'),
    spn: text(e, 'spn-name'),
    bgp: findDescendants(e, 'bgp').length > 0,
  }));

  const serviceConnections = [
    ...onboardingEntries('service-connection'),
    ...onboardingEntries('service-connections'),
  ].map((e) => ({
    name: name(e),
    region: text(e, 'region') || text(e, 'location'),
    ipsecTunnel: text(e, 'ipsec-tunnel'),
    subnets: members(e, 'subnets'),
    bgp: findDescendants(e, 'bgp').length > 0,
  }));

  const muParent = findDescendants(cs, 'mobile-users')[0];
  let mobileUsers;
  if (muParent) {
    const gws = findDescendants(muParent, 'gateways')[0];
    const regionSet = new Set(
      findDescendants(muParent, 'region').map((r) => r.textContent?.trim() || '').filter(Boolean)
    );
    const ipPools = findDescendants(muParent, 'ip-pools').flatMap((el) =>
      directChildren(el, 'member').map((m) => m.textContent?.trim() || '')
    ).filter(Boolean);
    mobileUsers = {
      enabled: true,
      gateways: gws ? directChildren(gws, 'entry').map(name).filter(Boolean) : [],
      ipPools,
      regions: Array.from(regionSet),
    };
  }

  const infrastructureSubnet =
    text(findDescendants(cs, 'network')[0] || cs, 'infrastructure-subnet') ||
    text(cs, 'infra-subnet') ||
    undefined;

  if (!remoteNetworks.length && !serviceConnections.length && !mobileUsers) return undefined;
  return { remoteNetworks, serviceConnections, mobileUsers, infrastructureSubnet };
}

export function parsePanorama(xml: string): PanoramaModel {
  const doc = getDoc(xml);
  const config = doc.documentElement; // <config>
  const notes: string[] = [];

  // Shared scope.
  const sharedEl = directChild(config, 'shared');
  const shared = parseObjectBag(sharedEl, sharedEl);

  // devices → entry[name=localhost.localdomain]
  const devicesRoot = directChild(config, 'devices');
  const deviceEntry = devicesRoot ? directChildren(devicesRoot, 'entry')[0] : null;
  const hostname = deviceEntry ? name(deviceEntry) : 'localhost.localdomain';
  const swVersion =
    text(deviceEntry, 'sw-version') ||
    text(deviceEntry, 'software-version') ||
    config.getAttribute('version') ||
    'unknown';

  const deviceGroups: PanDeviceGroup[] = entries(deviceEntry, 'device-group').map(parseDeviceGroup);
  const templates: PanTemplate[] = entries(deviceEntry, 'template').map(parseTemplate);
  const templateStacks: PanTemplateStack[] = entries(deviceEntry, 'template-stack').map(parseTemplateStack);
  const prismaAccess = parsePrismaAccess(deviceEntry) || parsePrismaAccess(config);

  if (!sharedEl && deviceGroups.length === 0) {
    notes.push(
      'No <shared> or <device-group> sections found. This may be a single-firewall config rather than a Panorama export.'
    );
  }

  return {
    hostname,
    swVersion,
    shared,
    deviceGroups,
    templates,
    templateStacks,
    prismaAccess,
    notes,
  };
}
