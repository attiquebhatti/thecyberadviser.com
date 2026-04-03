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

import {
  buildPrismaSizingRecommendation,
  computePrismaSizingMetrics,
  normalizePrismaSizingInput,
} from '../lib/prisma-sizing/rules-engine';
import {
  defaultPrismaSizingInput,
  validatePrismaSizingInput,
} from '../lib/prisma-sizing/validators';

console.log('Testing throughput normalization...');
const normalized = normalizePrismaSizingInput({
  ...defaultPrismaSizingInput,
  mode: 'advanced',
  throughput: { value: 5000, unit: 'Mbps' },
  totalMobileUsers: 12000,
  concurrentUsers: 3000,
  remoteNetworkCount: 50,
  smallBranches: 5,
  mediumBranches: 4,
  largeBranches: 1,
  averageBandwidthPerSiteMbps: 120,
  ztnaApps: 20,
  dcServiceConnections: 3,
  cloudServiceConnections: 2,
});
assert.equal(normalized.throughputGbps, 5);
assert.equal(normalized.effectiveConcurrentMobileUsers, 3000);
assert.equal(normalized.totalRemoteFootprint, 60);
assert.equal(normalized.totalServiceConnections, 5);

console.log('Testing computed metrics...');
const metrics = computePrismaSizingMetrics(
  {
    ...defaultPrismaSizingInput,
    mode: 'advanced',
    totalMobileUsers: 12000,
    concurrentUsers: 3000,
    ademEnabled: true,
    cleanPipeEnabled: true,
    localBreakoutEnabled: false,
  },
  normalized
);
assert.ok(metrics.scaleScore > 0);
assert.equal(metrics.throughputGbps, 5);

console.log('Testing concurrency rejection...');
const invalidConcurrency = validatePrismaSizingInput({
  ...defaultPrismaSizingInput,
  totalMobileUsers: 100,
  concurrentUsers: 200,
});
assert.equal(invalidConcurrency.success, false);
if (!invalidConcurrency.success) {
  assert.ok(
    invalidConcurrency.errors.some((error) =>
      error.includes('Concurrent users cannot exceed total mobile users')
    )
  );
}

console.log('Testing negative value rejection...');
const invalidNegative = validatePrismaSizingInput({
  ...defaultPrismaSizingInput,
  mobileUsers: -5,
});
assert.equal(invalidNegative.success, false);
if (!invalidNegative.success) {
  assert.ok(invalidNegative.errors.some((error) => error.includes('Value cannot be negative')));
}

console.log('Testing mixed deployment recommendation...');
const mixedResult = buildPrismaSizingRecommendation({
  ...defaultPrismaSizingInput,
  mode: 'advanced',
  deploymentType: 'mixed-deployment',
  totalMobileUsers: 18000,
  concurrentUsers: 7000,
  remoteNetworkCount: 120,
  averageBandwidthPerSiteMbps: 200,
  smallBranches: 20,
  mediumBranches: 12,
  largeBranches: 6,
  ztnaApps: 40,
  ztnaConnectors: 6,
  dcServiceConnections: 4,
  cloudServiceConnections: 4,
  throughput: { value: 25, unit: 'Gbps' },
  requiredRegions: ['North America', 'Europe'],
});
assert.equal(mixedResult.success, true);
if (mixedResult.success) {
  assert.ok(['Scale', 'Enterprise Plus', 'Global Strategic'].includes(mixedResult.data.recommendedTier));
  assert.ok(mixedResult.data.recommendedRegions.length >= 2);
  assert.ok(mixedResult.data.serviceConnectionGuidance.length > 0);
}

console.log('Testing advisory generation...');
if (mixedResult.success) {
  assert.ok(
    mixedResult.data.advisoryNotes.some((note) =>
      note.title.toLowerCase().includes('multi-region') ||
      note.title.toLowerCase().includes('mixed deployment')
    )
  );
}

console.log('Testing calibrated remote-network storage sample...');
const remoteSample = buildPrismaSizingRecommendation({
  ...defaultPrismaSizingInput,
  deploymentType: 'remote-networks',
  throughput: { value: 2000, unit: 'Mbps' },
  loggingRetention: '30-days',
  mobileUsers: 0,
  branchUsersPerSite: 0,
  ngfwLogRatePerSecond: 0,
});
assert.equal(remoteSample.success, true);
if (remoteSample.success) {
  assert.equal(remoteSample.data.kpis.find((item) => item.label === 'Recommended purchase')?.value, '6 TB');
}

console.log('Testing calibrated mobile-user storage sample...');
const mobileSample = buildPrismaSizingRecommendation({
  ...defaultPrismaSizingInput,
  deploymentType: 'mobile-users',
  mobileUsers: 2500,
  loggingRetention: '90-days',
  throughput: { value: 1, unit: 'Mbps' },
  ngfwLogRatePerSecond: 0,
});
assert.equal(mobileSample.success, true);
if (mobileSample.success) {
  assert.equal(mobileSample.data.kpis.find((item) => item.label === 'Recommended purchase')?.value, '6 TB');
}

console.log('Testing calibrated NGFW storage sample...');
const ngfwSample = buildPrismaSizingRecommendation({
  ...defaultPrismaSizingInput,
  deploymentType: 'ngfw',
  ngfwLogRatePerSecond: 2000,
  loggingRetention: '30-days',
  mobileUsers: 0,
  throughput: { value: 1, unit: 'Mbps' },
});
assert.equal(ngfwSample.success, true);
if (ngfwSample.success) {
  assert.equal(ngfwSample.data.kpis.find((item) => item.label === 'Recommended purchase')?.value, '12 TB');
}
console.log('Prisma sizing tests passed');

