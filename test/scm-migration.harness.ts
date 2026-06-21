// Node harness: polyfill DOMParser with @xmldom/xmldom and run the
// full Panorama → SCM pipeline against the sample config. This drives
// the REAL parser + mapper + remediation engine + generator end-to-end
// (the browser uses the native DOMParser; the logic is identical).

import * as fs from 'fs';
import * as path from 'path';
import Module from 'node:module';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

// Resolve the "@/..." path alias (same shim the other tests use).
const moduleResolver = Module as any;
const originalResolve = moduleResolver._resolveFilename;
const projectRoot = process.cwd();
moduleResolver._resolveFilename = function (request: string, ...rest: any[]) {
  if (request.startsWith('@/')) {
    return originalResolve.call(this, path.join(projectRoot, request.slice(2)), ...rest);
  }
  return originalResolve.call(this, request, ...rest);
};

(globalThis as any).DOMParser = DOMParser;
(globalThis as any).XMLSerializer = XMLSerializer;

import { runScmMigration } from '../lib/unified-migrator/scm/runtime';

const xml = fs.readFileSync(path.join(__dirname, 'scm-sample-panorama.xml'), 'utf8');
const res = runScmMigration(xml);

console.log('=== PANORAMA PARSE ===');
console.log('hostname:', res.panorama.hostname, '| sw:', res.panorama.swVersion);
console.log('device-groups:', res.panorama.deviceGroups.map((d) => `${d.name}${d.parent ? '←' + d.parent : ''}`).join(', '));
console.log('templates:', res.panorama.templates.map((t) => t.name).join(', '));
console.log('template-stacks:', res.panorama.templateStacks.map((t) => t.name).join(', '));
console.log('shared addresses:', res.panorama.shared.addresses.map((a) => a.name).join(', '));

console.log('\n=== SCM MODEL ===');
console.log('stats:', JSON.stringify(res.scm.stats));
console.log('folders:', res.scm.folders.map((f) => `${f.name}${f.parent ? '←' + f.parent : ''}(${f.rules.length}r)`).join(', '));
console.log('snippets:', res.scm.snippets.map((s) => `${s.name}:${s.source}`).join(', '));
console.log('global addresses:', res.scm.global.addresses.map((a) => a.name).join(', '));

console.log('\n=== REMEDIATIONS ===');
for (const r of res.scm.remediations) {
  console.log(`${r.status === 'auto-remapped' ? '✅' : '⚠️'} ${r.code} [${r.severity}] ${r.feature} → ${r.locations.length} item(s)`);
  for (const l of r.locations) console.log('     -', l);
}

console.log('\n=== ASSERTIONS ===');
const assert = (cond: boolean, msg: string) => console.log(cond ? 'PASS' : 'FAIL', '-', msg);
const codes = new Set(res.scm.remediations.map((r) => r.code));
assert(res.panorama.deviceGroups.length === 3, '3 device-groups parsed');
assert(res.scm.folders.length === 4, '4 SCM folders (Shared + 3 DGs)');
const cancen = res.scm.folders.find((f) => f.name === 'AZCANCEN-Transit-DG');
assert(cancen?.parent === 'AZ-GLOBAL-DG', 'parent-dg nesting preserved');
assert(res.scm.snippets.length === 3, '3 snippets (2 templates + 1 stack)');
assert(codes.has('SCM112'), 'SCM112 (target) detected');
assert(codes.has('SCM193'), 'SCM193 (group-tag) detected');
assert(codes.has('SCM117'), 'SCM117 (saas-user-list) detected');
assert(codes.has('SCM115'), 'SCM115 (master device) detected');
assert(codes.has('SCM68'), 'SCM68 (group-mapping) detected');
assert(codes.has('SCM121'), 'SCM121 (cloud identity engine) detected');
assert(codes.has('SCM142'), 'SCM142 (BGP AFI) detected');
assert(codes.has('SCM140'), 'SCM140 (GP default browser) detected');
assert(codes.has('SCM137'), 'SCM137 (clientless VPN) detected');

// target/group-tag/saas should be stripped from emitted rules.
const cyglass = res.scm.folders.flatMap((f) => f.rules).find((r) => r.name === 'Allow Cyglass');
assert(cyglass?.security?.target === undefined, 'SCM112: per-rule target stripped from rule');
assert(cyglass?.security?.groupTag === undefined, 'SCM193: group-tag stripped from rule');
assert((cyglass?.security?.tags || []).includes('Outbound'), 'SCM193: group-tag preserved as a tag');

const xmlArt = res.artifacts.find((a) => a.id === 'scm-config-xml');
assert(!!xmlArt && !/<target>/.test(xmlArt.content), 'output XML contains NO <target> blocks');
assert(!!xmlArt && !/<group-tag>/.test(xmlArt.content), 'output XML contains NO <group-tag>');
assert(!!xmlArt && !/<saas-user-list>/.test(xmlArt.content), 'output XML contains NO <saas-user-list>');
assert(!!xmlArt && /<parent-dg>AZ-GLOBAL-DG<\/parent-dg>/.test(xmlArt.content), 'output XML preserves parent-dg');
assert(!!xmlArt && /Inbound-HTTPS-DNAT/.test(xmlArt.content), 'output XML includes DNAT rule');

// dump a slice of the generated XML for eyeballing
console.log('\n=== scm-config.xml (first 1800 chars) ===');
console.log(xmlArt!.content.slice(0, 1800));

console.log('\n=== remediation report (first 1200 chars) ===');
console.log(res.artifacts.find((a) => a.id === 'scm-remediation-report')!.content.slice(0, 1200));
