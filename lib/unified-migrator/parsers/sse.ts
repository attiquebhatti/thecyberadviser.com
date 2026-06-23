// ────────────────────────────────────────────────────────────────
// SSE → IR parsers: Netskope and Zscaler (ZIA) JSON policy exports.
// ────────────────────────────────────────────────────────────────
//
// Netskope and Zscaler manage policy in their cloud portals/APIs, so
// the realistic input is a JSON policy export rather than a firewall
// CLI file. These parsers are deliberately tolerant: they walk the JSON
// for rule-like arrays and pull out name / action / source / destination
// / service, creating address & service objects for IP/port literals and
// keeping URL-categories, apps and users as named references. Best-effort —
// SSE constructs that have no firewall equivalent are recorded as notes.
//

import { BaseParser } from '@/lib/unified-migrator/parsers/base';
import { ParseInput, VersionInfo, VersionProfile, RuleEndpointSet } from '@/lib/unified-migrator/types';
import { fingerprint } from '@/lib/unified-migrator/utils';

const isIpLike = (s: string) =>
  /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(s) || /^\d{1,3}(\.\d{1,3}){3}-\d{1,3}(\.\d{1,3}){3}$/.test(s);

function asArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return [v];
  return [];
}

/** Pull string tokens out of a heterogeneous policy field (array of strings or
 *  objects with name/id/ipAddress). */
function tokens(v: any): string[] {
  const out: string[] = [];
  for (const item of asArray(v)) {
    if (typeof item === 'string') out.push(item);
    else if (item && typeof item === 'object') {
      const t = item.name || item.id || item.ipAddress || item.ip || item.value || item.url;
      if (t) out.push(String(t));
    }
  }
  return out;
}

abstract class SseJsonParser extends BaseParser {
  /** keys whose arrays hold the policy rules for this vendor. */
  protected abstract ruleKeys: string[];
  /** field-name candidates per rule. */
  protected abstract fields: {
    name: string[]; action: string[]; source: string[]; destination: string[]; service: string[];
  };

  parse() {
    let data: any;
    try {
      data = JSON.parse(this.input.content);
    } catch {
      this.logs.push({ level: 'error', message: 'Expected a JSON policy export. Could not parse the file as JSON.' });
      return this.buildResult();
    }

    const rules = this.collectRules(data);
    if (rules.length === 0) {
      this.logs.push({ level: 'warning', message: 'No recognizable policy rules found in the JSON export.' });
    }

    const seenAddr = new Set<string>();
    const seenSvc = new Set<string>();
    const pick = (obj: any, keys: string[]) => keys.map((k) => obj?.[k]).find((v) => v !== undefined);

    rules.forEach((r, i) => {
      const name = String(pick(r, this.fields.name) ?? `rule-${i + 1}`);
      const rawAction = String(pick(r, this.fields.action) ?? 'allow').toLowerCase();
      const action: 'allow' | 'deny' = /allow|accept|permit/.test(rawAction) ? 'allow' : 'deny';

      const ensureAddrs = (vals: string[]): RuleEndpointSet => {
        if (vals.length === 0) return this.anySet();
        for (const v of vals) {
          if (isIpLike(v) && !seenAddr.has(v)) {
            seenAddr.add(v);
            this.pushAddress({
              ...this.entityBase(v, 1),
              type: v.includes('-') ? 'ip-range' : 'ip-netmask',
              value: v,
              exceptions: [],
              fingerprint: fingerprint([v]),
            });
          }
        }
        return this.resolveLiteralMembers(vals, 'address');
      };

      const ensureSvcs = (vals: string[]): RuleEndpointSet => {
        if (vals.length === 0) return this.anySet();
        for (const v of vals) {
          const m = v.match(/(tcp|udp)[/ :-]*(\d+)/i) || v.match(/^(\d+)$/);
          if (m && !seenSvc.has(v)) {
            seenSvc.add(v);
            const proto = (m.length === 3 ? m[1].toLowerCase() : 'tcp') as 'tcp' | 'udp';
            const port = m.length === 3 ? m[2] : m[1];
            this.pushService({
              ...this.entityBase(v, 1),
              protocol: proto,
              port,
              exceptions: [],
              fingerprint: fingerprint([v, proto, port]),
            });
          }
        }
        return this.resolveLiteralMembers(vals, 'service');
      };

      this.pushPolicy({
        ...this.entityBase(name, 1, 1, [], i),
        order: i,
        from: this.anySet(),
        to: this.anySet(),
        source: ensureAddrs(tokens(pick(r, this.fields.source))),
        destination: ensureAddrs(tokens(pick(r, this.fields.destination))),
        service: ensureSvcs(tokens(pick(r, this.fields.service))),
        action,
        disabled: r.state === 'DISABLED' || r.enabled === false || r.status === 'disable',
        logging: { atStart: false, atEnd: true },
        schedule: { refs: [], mode: 'always' },
        profiles: [],
        exceptions: [],
        fingerprint: fingerprint([name, i]),
      });
    });

    return this.buildResult();
  }

  private collectRules(data: any): any[] {
    if (Array.isArray(data)) return data;
    const out: any[] = [];
    for (const key of this.ruleKeys) {
      if (Array.isArray(data?.[key])) out.push(...data[key]);
    }
    // fallback: any top-level array of objects that look like rules
    if (out.length === 0 && data && typeof data === 'object') {
      for (const v of Object.values(data)) {
        if (Array.isArray(v) && v.some((x) => x && typeof x === 'object' && (x.name || x.action || x.access))) {
          out.push(...(v as any[]));
        }
      }
    }
    return out;
  }
}

export class NetskopeParser extends SseJsonParser {
  protected ruleKeys = ['rules', 'policies', 'data', 'realtime_policies', 'ruleList'];
  protected fields = {
    name: ['name', 'rule_name', 'ruleName'],
    action: ['action', 'access', 'rule_action'],
    source: ['srcIps', 'source', 'sourceIps', 'src', 'users', 'userGroups'],
    destination: ['dstIps', 'destination', 'destinationIps', 'dst', 'apps', 'categories', 'urls'],
    service: ['service', 'services', 'ports', 'nwServices'],
  };
  constructor(input: ParseInput, version: VersionInfo, profile: VersionProfile) {
    super(input, 'netskope', version, profile);
  }
}

export class ZscalerParser extends SseJsonParser {
  protected ruleKeys = ['rules', 'firewallRules', 'urlFilteringRules', 'policies', 'data'];
  protected fields = {
    name: ['name', 'ruleName'],
    action: ['action', 'access'],
    source: ['srcIps', 'srcIpGroups', 'sourceIps', 'departments', 'users'],
    destination: ['destIpGroups', 'destIps', 'destIpCategories', 'urlCategories', 'destinations', 'appServices'],
    service: ['nwServices', 'nwServiceGroups', 'services', 'destPorts'],
  };
  constructor(input: ParseInput, version: VersionInfo, profile: VersionProfile) {
    super(input, 'zscaler', version, profile);
  }
}
