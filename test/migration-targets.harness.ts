// Node harness: verify the new SSE sources (Netskope/Zscaler JSON) and the
// any-to-any target generators (PAN-OS, Prisma Access, FortiGate, Cisco ASA,
// Check Point). No DOMParser needed — the generic pipeline is pure.

import Module from 'node:module';
import * as path from 'path';

const moduleResolver = Module as any;
const orig = moduleResolver._resolveFilename;
const root = process.cwd();
moduleResolver._resolveFilename = function (req: string, ...rest: any[]) {
  if (req.startsWith('@/')) return orig.call(this, path.join(root, req.slice(2)), ...rest);
  return orig.call(this, req, ...rest);
};

import { runMigration } from '../lib/unified-migrator/runtime';
import { DEFAULT_MIGRATION_OPTIONS, type TargetVendor } from '../lib/unified-migrator/types';

const assert = (c: boolean, m: string) => console.log(c ? 'PASS' : 'FAIL', '-', m);

const netskope = JSON.stringify({
  rules: [
    { name: 'Allow-Web', action: 'allow', srcIps: ['10.1.1.0/24'], dstIps: ['any'], service: ['tcp/443'] },
    { name: 'Block-Bad', action: 'block', srcIps: ['10.2.2.5'], dstIps: ['1.2.3.4'], service: ['tcp/80'] },
  ],
});
const zscaler = JSON.stringify({
  firewallRules: [
    { name: 'FW-Allow-DNS', action: 'ALLOW', srcIps: ['192.168.1.0/24'], destIps: ['8.8.8.8'], nwServices: ['udp/53'] },
  ],
});

console.log('=== Netskope source parse ===');
const ns = runMigration({ fileName: 'netskope.json', content: netskope, selectedVendor: 'netskope' }, 'prisma-access', DEFAULT_MIGRATION_OPTIONS);
console.log('detectedVendor:', ns.parseResult.detectedVendor, '| policies:', ns.parseResult.ir.policies.length, '| addresses:', ns.parseResult.ir.addresses.length, '| services:', ns.parseResult.ir.services.length);
assert(ns.parseResult.ir.policies.length === 2, 'Netskope: 2 policies parsed');
assert(ns.parseResult.ir.addresses.some((a) => a.value === '10.1.1.0/24'), 'Netskope: address 10.1.1.0/24 created');
assert(ns.parseResult.ir.services.some((s) => s.port === '443'), 'Netskope: service tcp/443 created');
assert(ns.parseResult.ir.policies[1].action === 'deny', 'Netskope: block → deny');
assert(!!ns.artifacts.find((a) => a.id === 'prisma-access-cli'), 'Prisma Access artifact generated');

console.log('\n=== Zscaler source parse ===');
const zs = runMigration({ fileName: 'zscaler.json', content: zscaler, selectedVendor: 'zscaler' }, 'prisma-access', DEFAULT_MIGRATION_OPTIONS);
assert(zs.parseResult.ir.policies.length === 1, 'Zscaler: 1 policy parsed');
assert(zs.parseResult.ir.policies[0].action === 'allow', 'Zscaler: ALLOW → allow');
assert(zs.parseResult.ir.services.some((s) => s.port === '53' && s.protocol === 'udp'), 'Zscaler: udp/53 service');

console.log('\n=== Any-to-any targets (Netskope source → each target) ===');
const targets: { t: TargetVendor; artId: string; needle: RegExp }[] = [
  { t: 'pan-os', artId: 'panos-cli', needle: /set address|set rulebase/ },
  { t: 'prisma-access', artId: 'prisma-access-cli', needle: /set shared address|set rulebase security/ },
  { t: 'fortigate', artId: 'fortigate-cli', needle: /config firewall address|config firewall policy/ },
  { t: 'cisco-asa', artId: 'cisco-asa-cli', needle: /object network|access-list/ },
  { t: 'checkpoint', artId: 'checkpoint-cli', needle: /mgmt_cli add (host|network)|add access-rule/ },
];
for (const { t, artId, needle } of targets) {
  const res = runMigration({ fileName: 'netskope.json', content: netskope, selectedVendor: 'netskope' }, t, DEFAULT_MIGRATION_OPTIONS);
  const art = res.artifacts.find((a) => a.id === artId);
  const ok = !!art && needle.test(art.content);
  assert(ok, `target ${t}: ${artId} generated with expected syntax`);
}

console.log('\n=== Cisco ASA → FortiGate (firewall-to-firewall) ===');
const asaCfg = [
  'object network web-srv',
  ' host 10.5.5.5',
  'access-list outside_in extended permit ip any object web-srv',
].join('\n');
const asa2forti = runMigration({ fileName: 'asa.conf', content: asaCfg, selectedVendor: 'cisco-asa' }, 'fortigate', DEFAULT_MIGRATION_OPTIONS);
assert(!!asa2forti.artifacts.find((a) => a.id === 'fortigate-cli'), 'Cisco ASA → FortiGate artifact generated');
