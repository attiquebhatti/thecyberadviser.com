// ────────────────────────────────────────────────────────────────
// SCM### Limitation-Remediation Engine
// ────────────────────────────────────────────────────────────────
//
// The SCM onboarding tool flags a fixed set of constructs it cannot
// take from a Panorama config (each with an SCM### code). This engine
// detects every one of them and either:
//
//   • auto-remaps it to the SCM-supported equivalent (mutating the
//     ScmModel in place), or
//   • flags it with a concrete manual remediation step when SCM has no
//     equivalent — never silently dropping it.
//
// Codes handled (from the onboarding validation report):
//   SCM112  per-rule target/devices         → folder-scoped placement
//   SCM193  group-by-tag on rules           → tags / snippets
//   SCM115  User-ID master device (DG)      → Cloud Identity Engine
//   SCM68   group-mapping (template)        → Cloud Identity Engine
//   SCM121  Cloud Identity Engine block     → native CIE onboarding
//   SCM142  BGP address-family identifier   → device-level routing
//   SCM144  virtual-router settings         → device-level logical router
//   SCM140  GP portal default-browser       → GP app config in SCM
//   SCM117  saas-user-list on rules         → SaaS policy recommendation
//   SCM118  saas-tenant-list                → SaaS policy recommendation
//   SCM137  GlobalProtect Clientless VPN    → (unsupported) GP app / ZTNA
//

import type {
  ExceptionLevel,
  PanoramaModel,
  Remediation,
  RemediationStatus,
  ScmModel,
} from '@/lib/unified-migrator/scm/types';

interface Acc {
  remediations: Remediation[];
}

function add(
  acc: Acc,
  code: string,
  feature: string,
  status: RemediationStatus,
  severity: ExceptionLevel,
  scmAlternative: string,
  detail: string,
  locations: string[]
) {
  if (locations.length === 0) return; // only report what actually exists
  acc.remediations.push({ code, feature, status, severity, scmAlternative, detail, locations });
}

export function applyRemediations(pan: PanoramaModel, scm: ScmModel): void {
  const acc: Acc = { remediations: [] };

  // ── SCM112 — per-rule target/devices ──────────────────────────
  // Folder placement already scopes a rule to the firewalls assigned
  // to that folder, so we drop the per-rule target and rely on the
  // folder. A *negated* target (apply to all EXCEPT) has no folder
  // equivalent, so those are flagged for review.
  {
    const remapped: string[] = [];
    const review: string[] = [];
    for (const f of scm.folders) {
      for (const r of f.rules) {
        const rule = r.security || r.nat;
        if (!rule?.target) continue;
        const loc = `${f.name} / ${r.type}:${r.name}`;
        if (rule.target.negate) review.push(`${loc} (negated → all except ${rule.target.devices.join(', ') || 'listed'})`);
        else remapped.push(`${loc}${rule.target.devices.length ? ` → ${rule.target.devices.length} firewall(s)` : ''}`);
        rule.target = undefined; // remediated: rely on folder scoping
      }
    }
    add(
      acc, 'SCM112', 'Per-rule target / device scoping', 'auto-remapped', 'medium',
      'Folder-scoped rule placement',
      'Each Panorama device-group became an SCM folder, so its rules already apply only to the firewalls assigned to that folder. The per-rule target/devices setting was removed as redundant. Verify the right firewalls are assigned to each folder in SCM.',
      remapped
    );
    add(
      acc, 'SCM112', 'Per-rule target with NEGATE (all-except)', 'flagged', 'high',
      'Split folder / explicit rule scoping',
      'These rules targeted "all firewalls except a list" — SCM has no per-rule negated target. Recreate the exclusion by placing these firewalls in a separate folder or by splitting the rule.',
      review
    );
  }

  // ── SCM193 — group-by-tag on rules ────────────────────────────
  {
    const locs: string[] = [];
    for (const f of scm.folders) {
      for (const r of f.rules) {
        const rule = r.security;
        if (!rule?.groupTag) continue;
        locs.push(`${f.name} / ${r.name} (group: ${rule.groupTag})`);
        // Keep the tag (supported); drop the visual group-by-tag ordering.
        if (rule.groupTag && !rule.tags.includes(rule.groupTag)) rule.tags.push(rule.groupTag);
        rule.groupTag = undefined;
      }
    }
    add(
      acc, 'SCM193', 'Group rules by tag', 'auto-remapped', 'low',
      'Tags / snippets',
      'Group-by-tag is a Panorama display feature and does not affect enforcement. The grouping tag was preserved as a normal rule tag (SCM supports tag-based filtering and snippet organization), and the unsupported group-tag attribute was removed.',
      locs
    );
  }

  // ── SCM117 — saas-user-list on rules ──────────────────────────
  {
    const locs: string[] = [];
    for (const f of scm.folders) {
      for (const r of f.rules) {
        const rule = r.security;
        if (!rule?.saasUserList) continue;
        locs.push(`${f.name} / ${r.name}`);
        rule.saasUserList = undefined; // rule migrates; attribute can't
      }
    }
    add(
      acc, 'SCM117', 'SaaS user list (SaaS policy recommendation)', 'flagged', 'medium',
      'SCM SaaS Security / policy recommendation',
      'The security rules migrate normally, but their saas-user-list reference (used for SaaS policy recommendation) has no direct SCM import. Recreate the SaaS user exemptions through SCM SaaS Security policy recommendations after import.',
      locs
    );
  }

  // ── SCM118 — saas-tenant-list ─────────────────────────────────
  {
    const hasSaas =
      acc.remediations.some((r) => r.code === 'SCM117') ||
      pan.templates.some((t) => /saas-tenant|tenant-restrictions/i.test(t.rawXml));
    add(
      acc, 'SCM118', 'SaaS tenant list (SaaS policy recommendation)', 'flagged', 'medium',
      'SCM SaaS Security / tenant restrictions',
      'SaaS tenant lists are not importable. Re-define tenant restrictions in SCM SaaS Security after import.',
      hasSaas ? ['Tenant restrictions referenced by SaaS policy'] : []
    );
  }

  // ── SCM115 — User-ID master device on device-groups ───────────
  {
    const locs = pan.deviceGroups
      .filter((d) => d.userIdMasterDevice)
      .map((d) => `${d.name} (master: ${d.userIdMasterDevice})`);
    add(
      acc, 'SCM115', 'User-ID master device', 'auto-remapped', 'medium',
      'Cloud Identity Engine',
      'SCM has no per-folder User-ID master device — user-to-IP and group information is provided centrally by the Cloud Identity Engine. The master-device setting was dropped; onboard the Cloud Identity Engine in SCM so the migrated rules keep their user/group matching.',
      locs
    );
  }

  // ── SCM68 — group-mapping in templates ────────────────────────
  {
    const locs = pan.templates.filter((t) => t.hasGroupMapping).map((t) => `template:${t.name}`);
    add(
      acc, 'SCM68', 'Group mapping (User Identification)', 'flagged', 'medium',
      'Cloud Identity Engine',
      'LDAP/AD group-mapping settings are not migrated. Configure the Cloud Identity Engine in SCM to supply group membership, then confirm group-based rules resolve correctly.',
      locs
    );
  }

  // ── SCM121 — Cloud Identity Engine block in templates ─────────
  {
    const locs = pan.templates.filter((t) => t.hasCloudIdentityEngine).map((t) => `template:${t.name}`);
    add(
      acc, 'SCM121', 'Cloud Identity Engine configuration', 'flagged', 'medium',
      'Native CIE onboarding',
      'Cloud Identity Engine is a tenant-level integration, not template-pushed config. Re-onboard CIE directly in SCM (Identity Services) rather than importing the template block.',
      locs
    );
  }

  // ── SCM142 — BGP address-family identifier ────────────────────
  {
    const locs = pan.templates
      .filter((t) => t.bgpAddressFamilies.length)
      .map((t) => `template:${t.name} (${Array.from(new Set(t.bgpAddressFamilies)).join(', ')})`);
    add(
      acc, 'SCM142', 'BGP address-family identifier', 'flagged', 'medium',
      'Device-level routing configuration',
      'BGP address-family settings are configured per device in SCM rather than via template. Recreate the BGP address families on the relevant logical routers in SCM Network configuration.',
      locs
    );
  }

  // ── SCM144 — virtual-router settings ──────────────────────────
  // Static routes are now auto-migrated into SCM logical routers (see the
  // scm-logical-routers artifact). Dynamic routing / redistribution still
  // needs a review pass, and BGP specifics are covered by SCM142.
  {
    const withStatic = scm.logicalRouters.filter((lr) => lr.staticRoutes.length);
    const autoLocs = withStatic.map((lr) => `logical-router:${lr.name} (${lr.staticRoutes.length} static route(s))`);
    add(
      acc, 'SCM144', 'Virtual router → logical router (static routes)', 'auto-remapped', 'medium',
      'SCM logical router static routes',
      'Each Panorama virtual router was converted to an SCM logical router and its static routes were generated as ready-to-apply config (see the "SCM Logical Routers" download). Apply them to the matching logical router in SCM, then confirm interface assignments.',
      autoLocs
    );
    const dynamicLocs = scm.logicalRouters.filter((lr) => lr.hasBgp).map((lr) => `logical-router:${lr.name} (dynamic routing/redistribution)`);
    add(
      acc, 'SCM144', 'Virtual router dynamic routing / redistribution', 'flagged', 'medium',
      'Device-level logical router',
      'Dynamic routing protocols (OSPF/RIP), route redistribution, and PBF are not auto-migrated. Recreate these on the logical router in SCM Network configuration.',
      dynamicLocs
    );
  }

  // ── SCM140 — GP portal default-browser ────────────────────────
  {
    const locs = pan.templates.filter((t) => t.gpDefaultBrowser).map((t) => `template:${t.name}`);
    add(
      acc, 'SCM140', 'GlobalProtect portal "Default Browser" app setting', 'flagged', 'low',
      'GlobalProtect app configuration in SCM',
      'The portal Default-Browser app setting is not imported. If required, set the equivalent GlobalProtect app behavior in SCM Mobile Users / GlobalProtect configuration.',
      locs
    );
  }

  // ── SCM137 — GlobalProtect Clientless VPN ─────────────────────
  {
    const locs = pan.templates
      .filter((t) => /clientless-vpn/i.test(t.rawXml))
      .map((t) => `template:${t.name}`);
    add(
      acc, 'SCM137', 'GlobalProtect Clientless VPN', 'flagged', 'high',
      'GlobalProtect app / ZTNA browser access',
      'Clientless VPN is not available in Strata Cloud Manager / Prisma Access. Migrate affected users to the GlobalProtect app, or publish those internal web apps through Prisma Access ZTNA / browser-based access instead.',
      locs
    );
  }

  // ── Integrity check — rule references to undefined objects ────
  // A correctness aid for the upload: flags address/service/group names
  // used by rules that aren't defined anywhere in the migrated config
  // (so they're either predefined in SCM or need to be created first).
  {
    const defined = new Set<string>();
    const addBag = (b: { addresses: any[]; addressGroups: any[]; services: any[]; serviceGroups: any[]; applicationGroups: any[]; externalLists: any[] }) => {
      for (const x of b.addresses) defined.add(x.name);
      for (const x of b.addressGroups) defined.add(x.name);
      for (const x of b.services) defined.add(x.name);
      for (const x of b.serviceGroups) defined.add(x.name);
      for (const x of b.applicationGroups) defined.add(x.name);
      for (const x of b.externalLists) defined.add(x.name);
    };
    addBag(scm.global);
    for (const f of scm.folders) addBag(f.objects);

    const isLiteral = (s: string) =>
      s === 'any' ||
      /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(s) || // IPv4 / CIDR
      /^\d{1,3}(\.\d{1,3}){3}-\d{1,3}(\.\d{1,3}){3}$/.test(s) || // range
      /:/.test(s); // IPv6-ish

    const undefinedRefs = new Map<string, string[]>(); // name → locations
    const note = (refName: string, where: string) => {
      if (!undefinedRefs.has(refName)) undefinedRefs.set(refName, []);
      const arr = undefinedRefs.get(refName)!;
      if (arr.length < 8) arr.push(where);
    };
    for (const f of scm.folders) {
      for (const r of f.rules) {
        const sec = r.security;
        const nat = r.nat;
        const addrRefs = [...(sec?.source || []), ...(sec?.destination || []), ...(nat?.source || []), ...(nat?.destination || [])];
        for (const ref of addrRefs) if (!isLiteral(ref) && !defined.has(ref)) note(ref, `${f.name}/${r.name}`);
        const svcRefs = [...(sec?.service || []), ...(nat?.service ? [nat.service] : [])];
        for (const ref of svcRefs) if (ref !== 'any' && ref !== 'application-default' && !defined.has(ref)) note(ref, `${f.name}/${r.name}`);
      }
    }
    const locs = Array.from(undefinedRefs.entries()).slice(0, 80).map(([n, w]) => `${n} (e.g. ${w[0]})`);
    if (locs.length) {
      acc.remediations.push({
        code: 'CHECK',
        feature: 'Object references not defined in this config',
        status: 'informational',
        severity: 'low',
        scmAlternative: 'Verify these are predefined in SCM, or create them before import',
        detail: `${undefinedRefs.size} object name(s) are referenced by rules but not defined in the Panorama config (they may be predefined services/regions/EDLs, or live in a config section not exported). Confirm they exist in SCM so rules don't fail validation on import.`,
        locations: locs,
      });
    }
  }

  // Attach + update stats.
  scm.remediations = acc.remediations;
  scm.stats.autoRemapped = acc.remediations.filter((r) => r.status === 'auto-remapped').reduce((n, r) => n + r.locations.length, 0);
  scm.stats.flagged = acc.remediations.filter((r) => r.status === 'flagged').reduce((n, r) => n + r.locations.length, 0);
}
