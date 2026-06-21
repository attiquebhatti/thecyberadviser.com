// ────────────────────────────────────────────────────────────────
// PanoramaModel → ScmModel
// ────────────────────────────────────────────────────────────────
//
// Structural mapping (no remediation yet — that runs next, in
// limitations.ts):
//
//   Panorama shared        → SCM Global objects + a root "Shared" folder
//                            carrying the shared pre/post rulebase
//   Panorama device-group  → SCM Folder (1:1, parent-dg nesting preserved;
//                            top-level DGs descend from the "Shared" folder)
//   Panorama template      → SCM Snippet (network/device config)
//   Panorama template-stack→ SCM Snippet (records which templates/firewalls bind)
//
// SCM folders inherit objects and rules from their parent and from the
// predefined top folder, exactly like Panorama device-groups inherit
// from shared — so this 1:1 placement preserves rule precedence and
// object shadowing.
//

import type {
  PanObjectBag,
  PanoramaModel,
  ScmFolder,
  ScmLogicalRouter,
  ScmModel,
  ScmObjectBag,
  ScmRule,
  ScmSnippet,
  ScmStats,
} from '@/lib/unified-migrator/scm/types';

const SHARED_FOLDER = 'Shared';

function toObjectBag(bag: PanObjectBag): ScmObjectBag {
  return {
    addresses: dedupe(bag.addresses),
    addressGroups: dedupe(bag.addressGroups),
    services: dedupe(bag.services),
    serviceGroups: dedupe(bag.serviceGroups),
    applicationGroups: dedupe(bag.applicationGroups),
    tags: dedupe(bag.tags),
    externalLists: dedupe(bag.externalLists),
    schedules: dedupe(bag.schedules),
  };
}

function dedupe<T extends { name: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const it of items) map.set(it.name, it); // last wins
  return Array.from(map.values());
}

function rulesFromBag(bag: PanObjectBag): ScmRule[] {
  const rules: ScmRule[] = [];
  for (const r of bag.preSecurity) rules.push({ name: r.name, type: 'security', phase: 'pre', security: r });
  for (const r of bag.postSecurity) rules.push({ name: r.name, type: 'security', phase: 'post', security: r });
  for (const r of bag.preNat) rules.push({ name: r.name, type: 'nat', phase: 'pre', nat: r });
  for (const r of bag.postNat) rules.push({ name: r.name, type: 'nat', phase: 'post', nat: r });
  return rules;
}

export function mapToScm(pan: PanoramaModel): ScmModel {
  const global = toObjectBag(pan.shared);

  const folders: ScmFolder[] = [];

  // Root "Shared" folder carries shared rules (objects already in Global).
  const sharedRules = rulesFromBag(pan.shared);
  folders.push({
    name: SHARED_FOLDER,
    parent: undefined,
    snippets: [],
    objects: emptyBag(),
    rules: sharedRules,
    deviceSerials: [],
    source: 'Panorama shared scope (pre/post rulebase). Objects migrated to Global.',
  });

  // Each device-group → folder.
  const dgNames = new Set(pan.deviceGroups.map((d) => d.name));
  for (const dg of pan.deviceGroups) {
    const parent = dg.parent && dgNames.has(dg.parent) ? dg.parent : SHARED_FOLDER;
    folders.push({
      name: dg.name,
      parent,
      snippets: [],
      objects: toObjectBag(dg.objects),
      rules: rulesFromBag(dg.objects),
      deviceSerials: dg.deviceSerials,
      source: `Panorama device-group "${dg.name}"${dg.parent ? ` (parent: ${dg.parent})` : ''}.`,
    });
  }

  // Templates + template-stacks → snippets.
  const snippets: ScmSnippet[] = [];
  for (const t of pan.templates) {
    const notes: string[] = [];
    if (t.zones.length) notes.push(`Zones: ${t.zones.join(', ')}`);
    if (t.interfaces.length) notes.push(`Interfaces: ${t.interfaces.join(', ')}`);
    if (t.virtualRouterNames.length) notes.push(`Virtual routers: ${t.virtualRouterNames.join(', ')}`);
    snippets.push({
      name: t.name,
      source: 'template',
      objects: emptyBag(),
      configNotes: notes,
    });
  }
  for (const ts of pan.templateStacks) {
    snippets.push({
      name: ts.name,
      source: 'template-stack',
      objects: emptyBag(),
      configNotes: [
        `Member templates (priority order): ${ts.templates.join(' → ') || '(none)'}`,
        ts.deviceSerials.length ? `Bound firewalls: ${ts.deviceSerials.join(', ')}` : 'No firewalls bound.',
      ],
    });
  }

  // Virtual routers → SCM logical routers (deduped by name across templates).
  const lrByName = new Map<string, ScmLogicalRouter>();
  for (const t of pan.templates) {
    for (const vr of t.virtualRouters) {
      const existing = lrByName.get(vr.name);
      if (existing) {
        // merge static routes (avoid dup names) + OR the bgp flag
        const seen = new Set(existing.staticRoutes.map((r) => r.name));
        for (const r of vr.staticRoutes) if (!seen.has(r.name)) existing.staticRoutes.push(r);
        existing.hasBgp = existing.hasBgp || vr.hasBgp;
      } else {
        lrByName.set(vr.name, {
          name: vr.name,
          fromTemplate: t.name,
          staticRoutes: [...vr.staticRoutes],
          hasBgp: vr.hasBgp,
        });
      }
    }
  }
  const logicalRouters = Array.from(lrByName.values());

  const stats = computeStats(folders, snippets, global, logicalRouters);

  return { global, folders, snippets, logicalRouters, remediations: [], coverage: [], stats };
}

function emptyBag(): ScmObjectBag {
  return {
    addresses: [],
    addressGroups: [],
    services: [],
    serviceGroups: [],
    applicationGroups: [],
    tags: [],
    externalLists: [],
    schedules: [],
  };
}

function computeStats(
  folders: ScmFolder[],
  snippets: ScmSnippet[],
  global: ScmObjectBag,
  logicalRouters: ScmLogicalRouter[]
): ScmStats {
  let addresses = global.addresses.length;
  let addressGroups = global.addressGroups.length;
  let services = global.services.length;
  let serviceGroups = global.serviceGroups.length;
  let applicationGroups = global.applicationGroups.length;
  let securityRules = 0;
  let natRules = 0;
  for (const f of folders) {
    addresses += f.objects.addresses.length;
    addressGroups += f.objects.addressGroups.length;
    services += f.objects.services.length;
    serviceGroups += f.objects.serviceGroups.length;
    applicationGroups += f.objects.applicationGroups.length;
    securityRules += f.rules.filter((r) => r.type === 'security').length;
    natRules += f.rules.filter((r) => r.type === 'nat').length;
  }
  return {
    folders: folders.length,
    snippets: snippets.length,
    addresses,
    addressGroups,
    services,
    serviceGroups,
    applicationGroups,
    securityRules,
    natRules,
    logicalRouters: logicalRouters.length,
    staticRoutes: logicalRouters.reduce((n, lr) => n + lr.staticRoutes.length, 0),
    autoRemapped: 0,
    flagged: 0,
  };
}
