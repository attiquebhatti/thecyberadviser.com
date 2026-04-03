import type {
  CalculatorInput,
  PrismaSizingExportPayload,
  RecommendationOutput,
} from '@/types/prisma-sizing';

const deploymentTypeLabels: Record<CalculatorInput['deploymentType'], string> = {
  ngfw: 'Next-Generation Firewall',
  'remote-networks': 'Remote Networks',
  'mobile-users': 'Mobile Users',
  ztna: 'ZTNA',
  'service-connections': 'Service Connections',
  'branch-offices': 'Branch Offices',
  'mixed-deployment': 'Mixed Deployment',
};

function formatBool(value: boolean) {
  return value ? 'Yes' : 'No';
}

function formatInputBlock(input: CalculatorInput) {
  const majorInputs = [
    `NGFW logs per second: ${input.ngfwLogRatePerSecond}`,
    `Throughput: ${input.throughput.value} ${input.throughput.unit}`,
    `Redundancy level: ${input.redundancyLevel}`,
    `Required regions: ${input.requiredRegions.join(', ')}`,
    `Branch users per site: ${input.branchUsersPerSite}`,
  ];

  if (input.mode === 'simple') {
    majorInputs.push(`Branch sites / remote networks: ${input.branchSites}`);
    majorInputs.push(`Mobile users: ${input.mobileUsers}`);
    majorInputs.push(`Private apps: ${input.privateApps}`);
    majorInputs.push(`Service connections: ${input.serviceConnections}`);
  } else {
    majorInputs.push(`Total mobile users: ${input.totalMobileUsers}`);
    majorInputs.push(`Concurrent users: ${input.concurrentUsers}`);
    majorInputs.push(`Remote networks: ${input.remoteNetworkCount}`);
    majorInputs.push(`Average site bandwidth: ${input.averageBandwidthPerSiteMbps} Mbps`);
    majorInputs.push(`Branches (S/M/L): ${input.smallBranches}/${input.mediumBranches}/${input.largeBranches}`);
    majorInputs.push(`ZTNA apps: ${input.ztnaApps}`);
    majorInputs.push(`ZTNA connectors: ${input.ztnaConnectors}`);
    majorInputs.push(`DC service connections: ${input.dcServiceConnections}`);
    majorInputs.push(`Cloud service connections: ${input.cloudServiceConnections}`);
  }

  majorInputs.push(`Logging retention: ${input.loggingRetention}`);
  majorInputs.push(`ADEM enabled: ${formatBool(input.ademEnabled)}`);
  majorInputs.push(`Clean pipe assumptions: ${formatBool(input.cleanPipeEnabled)}`);
  majorInputs.push(`Local internet breakout: ${formatBool(input.localBreakoutEnabled)}`);

  return majorInputs.map((line) => `- ${line}`).join('\n');
}

export function formatPrismaSizingSummary(
  input: CalculatorInput,
  recommendation: RecommendationOutput
) {
  return [
    'Prisma Access Sizing Calculator Summary',
    '',
    `Deployment mode: ${input.mode === 'simple' ? 'Simple' : 'Advanced'}`,
    `Selected deployment type(s): ${deploymentTypeLabels[input.deploymentType]}`,
    '',
    'Major inputs',
    formatInputBlock(input),
    '',
    'Recommendations',
    `- Recommended Strata Logging Service purchase: ${recommendation.kpis.find((item) => item.label === 'Recommended purchase')?.value ?? '-'}`,
    `- Recommended tier: ${recommendation.recommendedTier}`,
    `- Recommended regions: ${recommendation.recommendedRegions.join(', ')}`,
    `- HA model: ${recommendation.recommendedHaModel}`,
    `- Estimated Strata logging storage: ${recommendation.kpis.find((item) => item.label === 'Estimated logging storage')?.value ?? '-'}`,
    `- Estimated per-branch remote network bandwidth: ${recommendation.kpis.find((item) => item.label === 'Per-branch bandwidth')?.value ?? '-'}`,
    `- Remote network recommendation: ${recommendation.remoteNetworkRecommendation}`,
    `- Mobile user recommendation: ${recommendation.mobileUserRecommendation}`,
    `- ZTNA recommendation: ${recommendation.ztnaRecommendation}`,
    `- Service connection guidance: ${recommendation.serviceConnectionGuidance}`,
    `- Logging recommendation: ${recommendation.loggingRecommendation}`,
    '',
    'Advisory notes',
    ...recommendation.advisoryNotes.map((note) => `- ${note.title}: ${note.description}`),
    '',
    'Disclaimer',
    recommendation.assumptions[0] ?? '',
  ].join('\n');
}

export function buildPrismaSizingExportPayload(
  input: CalculatorInput,
  recommendation: RecommendationOutput
): PrismaSizingExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    rawInput: input,
    normalizedInput: recommendation.normalized,
    computedMetrics: recommendation.computedMetrics,
    recommendation,
    advisoryNotes: recommendation.advisoryNotes,
    architectureTable: recommendation.architectureRows,
  };
}
