import assert from 'node:assert/strict';
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

import { calculateSiemSizing } from '../lib/siem-sizing/engine';

console.log('Testing simple mode sizing...');
const simpleResult = calculateSiemSizing({
  mode: 'simple',
  platform: 'wazuh',
  employees: 250,
  networkEquipment: 10,
  endpoints: 250,
  servers: 20,
  networkSources: 10,
  cloudSources: 5,
  retentionDays: 90,
  compressionRatio: 7,
  highAvailability: false,
});
assert.equal(simpleResult.estimatedEndpointAgents, 50);
assert.equal(simpleResult.estimatedNetworkAgents, 4);
assert.equal(simpleResult.estimatedAgents, 54);
assert.equal(simpleResult.estimatedDailyVolumeGb, 15);
assert.equal(simpleResult.architecture.type, 'Distributed');

console.log('Testing advanced mode storage calculation...');
const advancedResult = calculateSiemSizing({
  mode: 'advanced',
  platform: 'splunk',
  employees: 0,
  networkEquipment: 0,
  endpoints: 600,
  servers: 75,
  networkSources: 30,
  cloudSources: 10,
  retentionDays: 180,
  compressionRatio: 6,
  highAvailability: true,
});
assert.equal(advancedResult.estimatedAgents, 715);
assert.equal(advancedResult.architecture.type, 'Distributed');
assert.ok(advancedResult.estimatedStorageGb > 2000);

console.log('Testing single-node recommendation...');
const compactResult = calculateSiemSizing({
  mode: 'advanced',
  platform: 'cortexxsoar',
  employees: 0,
  networkEquipment: 0,
  endpoints: 20,
  servers: 2,
  networkSources: 3,
  cloudSources: 1,
  retentionDays: 30,
  compressionRatio: 7,
  highAvailability: false,
});
assert.equal(compactResult.architecture.type, 'Single node');
assert.equal(compactResult.architecture.allInOneNodes, 1);

console.log('SIEM sizing tests passed');
