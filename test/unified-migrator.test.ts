import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';

const moduleResolver = Module as typeof Module & {
  _resolveFilename: (
    request: string,
    parent: NodeModule | null | undefined,
    isMain: boolean,
    options: unknown
  ) => string;
};

const originalResolveFilename = moduleResolver._resolveFilename;
const projectRoot = process.cwd();

moduleResolver._resolveFilename = function (
  request: string,
  parent: NodeModule | null | undefined,
  isMain: boolean,
  options: unknown
) {
  if (request.startsWith('@/')) {
    request = path.join(projectRoot, request.slice(2));
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

import { runMigration } from '../lib/unified-migrator/runtime';

function fixture(name: string) {
  return fs.readFileSync(path.join(process.cwd(), 'test', 'fixtures', name), 'utf8');
}

function run(fileName: string, vendor: 'cisco-asa' | 'fortigate' | 'checkpoint') {
  return runMigration({
    fileName,
    content: fixture(fileName),
    selectedVendor: vendor,
  });
}

console.log('Running ASA...');
const asa = run('cisco-asa.txt', 'cisco-asa');
console.log('Asserting ASA...');
assert.equal(asa.parseResult.detectedVendor, 'cisco-asa');
assert.equal(asa.parseResult.ir.policies.length, 1);
assert.equal(asa.parseResult.ir.policies[0].order, 0);
assert.ok(asa.artifacts.find((artifact) => artifact.id === 'panos-xml')?.content.includes('<config'), 'ASA panos-xml missing <config');
assert.ok(asa.artifacts.find((artifact) => artifact.id === 'panos-cli')?.content.includes('set rulebase security rules'), 'ASA panos-cli missing rules');

console.log('Running FortiGate...');
const forti = run('fortigate.conf', 'fortigate');
console.log('Asserting FortiGate...');
assert.equal(forti.parseResult.detectedVendor, 'fortigate');
console.log('FortiGate zones:', forti.parseResult.ir.zones.map(z => z.name));
console.log('FortiGate natRules:', forti.parseResult.ir.natRules.length);
console.log('FortiGate summary labels:', forti.validationReport.summary.map(r => r.label));
assert.ok(forti.parseResult.ir.zones.some((zone) => zone.name === 'trust'), 'FortiGate missing trust zone');
assert.ok(forti.parseResult.ir.natRules.length >= 1, 'FortiGate missing natrules');
assert.ok(forti.validationReport.summary.some((row) => row.label === 'policies'), 'FortiGate validation report missing policies');

console.log('Running Check Point...');
const checkpoint = run('checkpoint.txt', 'checkpoint');
console.log('Asserting Check Point...');
assert.equal(checkpoint.parseResult.detectedVendor, 'checkpoint');
assert.equal(checkpoint.parseResult.ir.addressGroups[0].members[0].ref, 'web1');
assert.ok(checkpoint.validationReport.overallAutomatedRate > 0, 'Check point overallAutomatedRate is 0');

console.log('Asserting Rollback...');
const rollback = asa.artifacts.find((artifact) => artifact.id === 'rollback-bundle');
assert.ok(rollback, 'rollback missing');
assert.ok(rollback?.content.includes('"sourceConfig"'), 'rollback sourceConfig missing');

console.log('UnifiedMigrator tests passed');
