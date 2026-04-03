import rules from '@/config/prisma-sizing-rules.json';
import { validatePrismaSizingInput } from '@/lib/prisma-sizing/validators';
import type {
  AdvisoryNote,
  ArchitectureRow,
  CalculatorInput,
  ComputedMetrics,
  NormalizedInput,
  PrismaSizingRules,
  RecommendationOutput,
  RegionOption,
  RulesEngineResult,
} from '@/types/prisma-sizing';

const sizingRules = rules as PrismaSizingRules;

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatThroughputGbps(value: number) {
  return `${value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} Gbps`;
}

function formatBandwidthMbps(value: number) {
  return value >= 1000
    ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} Gbps`
    : `${Math.round(value)} Mbps`;
}

function formatStorageGb(value: number) {
  return value >= 1000
    ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} TB`
    : `${Math.round(value)} GB`;
}

function formatStorageTbFixed(valueGb: number) {
  return `${(valueGb / 1000).toFixed(2)} TB`;
}

export function normalizePrismaSizingInput(input: CalculatorInput): NormalizedInput {
  const throughputGbps =
    input.throughput.value * sizingRules.normalization.throughputToGbps[input.throughput.unit];
  const totalUsers = input.mode === 'simple' ? input.mobileUsers : input.totalMobileUsers;
  const effectiveConcurrentMobileUsers =
    input.mode === 'simple'
      ? Math.round(totalUsers * sizingRules.normalization.defaultConcurrentRatio)
      : Math.min(input.concurrentUsers, totalUsers);
  const branchUsersPerSite =
    input.branchUsersPerSite || sizingRules.normalization.defaultBranchUsersPerSite;
  const deploymentMultiplier =
    sizingRules.normalization.deploymentMultipliers[input.deploymentType];
  const branchComplexityScore =
    input.smallBranches * sizingRules.normalization.branchWeights.small +
    input.mediumBranches * sizingRules.normalization.branchWeights.medium +
    input.largeBranches * sizingRules.normalization.branchWeights.large;
  const totalRemoteFootprint =
    input.mode === 'simple'
      ? input.branchSites
      : input.remoteNetworkCount + input.smallBranches + input.mediumBranches + input.largeBranches;
  const remoteNetworkAggregateBandwidthGbps =
    input.mode === 'simple'
      ? throughputGbps
      : (
          input.remoteNetworkCount * input.averageBandwidthPerSiteMbps +
          input.smallBranches * sizingRules.normalization.branchBandwidthMbps.small +
          input.mediumBranches * sizingRules.normalization.branchBandwidthMbps.medium +
          input.largeBranches * sizingRules.normalization.branchBandwidthMbps.large
        ) / 1000;
  const branchBandwidthPerSiteMbps = Math.max(
    branchUsersPerSite *
      sizingRules.normalization.branchUserBandwidthMbps.perUser *
      deploymentMultiplier.branchBandwidth,
    sizingRules.normalization.branchUserBandwidthMbps.minimumPerSite
  );
  const ztnaApps = input.mode === 'simple' ? input.privateApps : input.ztnaApps;
  const totalServiceConnections =
    input.mode === 'simple'
      ? input.serviceConnections
      : input.dcServiceConnections + input.cloudServiceConnections;
  const recommendedConnectorFloor =
    sizingRules.thresholds.connectorsPerApps.find((item: any) => ztnaApps <= item.maxApps)?.connectors ?? 2;
  const mixedDeploymentComplexityScore =
    totalUsers / 1000 + totalRemoteFootprint / 15 + ztnaApps / 10 + totalServiceConnections / 2;
  const retentionDays = sizingRules.normalization.loggingRetentionDays[input.loggingRetention];
  const estimatedMobileUserStorageGb =
    totalUsers *
    sizingRules.normalization.storageEstimation.mobileUserGbPerUserPerDay *
    retentionDays *
    (input.deploymentType === 'mobile-users' || input.deploymentType === 'mixed-deployment'
      ? deploymentMultiplier.loggingStorage
      : 0);
  const estimatedRemoteNetworkStorageGb =
    input.throughput.value *
    (input.throughput.unit === 'Gbps' ? 1000 : 1) *
    sizingRules.normalization.storageEstimation.remoteNetworkGbPerMbpsPerDay *
    retentionDays *
    (input.deploymentType === 'remote-networks' ||
    input.deploymentType === 'branch-offices' ||
    input.deploymentType === 'mixed-deployment'
      ? deploymentMultiplier.loggingStorage
      : 0);
  const estimatedNgfwStorageGb =
    input.ngfwLogRatePerSecond *
    sizingRules.normalization.storageEstimation.ngfwGbPerLogRatePerSecondPerDay *
    retentionDays *
    (input.deploymentType === 'ngfw' || input.deploymentType === 'mixed-deployment' ? 1 : 0);
  const estimatedLoggingStorageGb =
    estimatedMobileUserStorageGb + estimatedRemoteNetworkStorageGb + estimatedNgfwStorageGb;
  const recommendedPurchaseStorageTb = Math.max(1, Math.ceil(estimatedLoggingStorageGb / 1000));

  return {
    throughputGbps,
    effectiveConcurrentMobileUsers,
    remoteNetworkAggregateBandwidthGbps,
    branchBandwidthPerSiteMbps,
    branchComplexityScore,
    mixedDeploymentComplexityScore,
    totalServiceConnections,
    totalUsers,
    totalRemoteFootprint,
    ztnaApps,
    recommendedConnectorFloor: Math.max(
      input.mode === 'advanced' ? input.ztnaConnectors : 0,
      recommendedConnectorFloor
    ),
    estimatedNgfwStorageGb,
    estimatedRemoteNetworkStorageGb,
    estimatedMobileUserStorageGb,
    estimatedLoggingStorageGb,
    recommendedPurchaseStorageTb,
    selectedRegions: input.requiredRegions,
  };
}

function expandRegions(
  regions: RegionOption[],
  targetCount: number,
  redundancyLevel: CalculatorInput['redundancyLevel']
) {
  const minRegions = sizingRules.thresholds.minimumRegionsByRedundancy[redundancyLevel];
  const finalCount = Math.max(targetCount, minRegions, regions.length);
  if (regions.length >= finalCount) return regions;
  const extras = sizingRules.metadata.supportedRegions.filter((region: RegionOption) => !regions.includes(region));
  return [...regions, ...extras].slice(0, finalCount);
}

export function computePrismaSizingMetrics(
  input: CalculatorInput,
  normalized: NormalizedInput
): ComputedMetrics {
  const scaleScore =
    normalized.throughputGbps +
    normalized.effectiveConcurrentMobileUsers / 1000 +
    normalized.remoteNetworkAggregateBandwidthGbps / 2 +
    normalized.branchComplexityScore +
    normalized.mixedDeploymentComplexityScore +
    input.requiredRegions.length +
    (input.ademEnabled ? sizingRules.normalization.featureUplifts.ademEnabled : 0) +
    (input.cleanPipeEnabled ? sizingRules.normalization.featureUplifts.cleanPipeEnabled : 0) +
    (input.localBreakoutEnabled ? sizingRules.normalization.featureUplifts.localBreakoutEnabled : 0);

  return {
    scaleScore,
    throughputGbps: normalized.throughputGbps,
    effectiveConcurrentMobileUsers: normalized.effectiveConcurrentMobileUsers,
    remoteNetworkAggregateBandwidthGbps: normalized.remoteNetworkAggregateBandwidthGbps,
    branchBandwidthPerSiteMbps: normalized.branchBandwidthPerSiteMbps,
    branchComplexityScore: normalized.branchComplexityScore,
    mixedDeploymentComplexityScore: normalized.mixedDeploymentComplexityScore,
    totalServiceConnections: normalized.totalServiceConnections,
    totalRemoteFootprint: normalized.totalRemoteFootprint,
    estimatedNgfwStorageGb: normalized.estimatedNgfwStorageGb,
    estimatedRemoteNetworkStorageGb: normalized.estimatedRemoteNetworkStorageGb,
    estimatedMobileUserStorageGb: normalized.estimatedMobileUserStorageGb,
    estimatedLoggingStorageGb: normalized.estimatedLoggingStorageGb,
    recommendedPurchaseStorageTb: normalized.recommendedPurchaseStorageTb,
  };
}

export function buildPrismaSizingRecommendation(input: CalculatorInput): RulesEngineResult {
  const validation = validatePrismaSizingInput(input);
  if (!validation.success) return validation;

  const safeInput = validation.data;
  const normalized = normalizePrismaSizingInput(safeInput);
  const computedMetrics = computePrismaSizingMetrics(safeInput, normalized);
  const scaleScore = computedMetrics.scaleScore;

  const band =
    sizingRules.thresholds.scoreBands.find((item: any) => scaleScore <= item.maxScore) ??
    sizingRules.thresholds.scoreBands[sizingRules.thresholds.scoreBands.length - 1];
  const recommendedRegions = expandRegions(safeInput.requiredRegions, band.regions, safeInput.redundancyLevel);
  const loggingRecommendation =
    sizingRules.thresholds.logging.find((item: any) => item.option === safeInput.loggingRetention)?.recommendation ??
    'Document logging retention expectations separately.';

  const advisoryNotes: AdvisoryNote[] = [
    {
      level: 'info',
      title: 'Iframe-safe V1 embed',
      description:
        'This route is optimized for iframe embedding so the logic stays local, fast, and operationally simple.',
    },
  ];

  if (recommendedRegions.length > 1) {
    advisoryNotes.push({
      level: 'warning',
      title: 'Multi-region deployment recommended',
      description: 'The current heuristic score suggests a multi-region posture for resilience and maintenance headroom.',
    });
  }

  if (normalized.throughputGbps >= sizingRules.thresholds.advisories.highThroughputGbps) {
    advisoryNotes.push({
      level: 'attention',
      title: 'High throughput needs resilience planning',
      description: 'High aggregate bandwidth should be validated with failover, breakout, and concentration-risk design review.',
    });
  }

  if (
    safeInput.deploymentType === 'mixed-deployment' ||
    normalized.mixedDeploymentComplexityScore >= sizingRules.thresholds.advisories.mixedComplexityScore
  ) {
    advisoryNotes.push({
      level: 'warning',
      title: 'Mixed deployment complexity is elevated',
      description: 'Combined mobile, branch, ZTNA, and service assumptions are useful for planning but should be broken down during detailed design.',
    });
  }

  const architectureRows: ArchitectureRow[] = [
    {
      component: 'Mobile User Capacity Pool',
      quantity: formatNumber(normalized.totalUsers),
      capacity: formatThroughputGbps(normalized.effectiveConcurrentMobileUsers / 1000),
      region: recommendedRegions.join(', '),
      notes: 'Heuristic estimate based on effective concurrent demand.',
    },
    {
      component: 'Remote Networks / Branches',
      quantity: formatNumber(normalized.totalRemoteFootprint),
      capacity: formatThroughputGbps(normalized.remoteNetworkAggregateBandwidthGbps),
      region: recommendedRegions.join(', '),
      notes: 'Aggregated site bandwidth heuristic using editable local rules.',
    },
    {
      component: 'Remote Network SPN Per Branch',
      quantity: formatNumber(safeInput.branchSites || normalized.totalRemoteFootprint),
      capacity: formatBandwidthMbps(normalized.branchBandwidthPerSiteMbps),
      region: recommendedRegions.join(', '),
      notes: 'Editable heuristic derived from branch users per site for SPN bandwidth planning.',
    },
    {
      component: 'ZTNA Connector Pool',
      quantity: formatNumber(normalized.recommendedConnectorFloor),
      capacity: `${formatNumber(normalized.ztnaApps)} apps`,
      region: recommendedRegions.join(', '),
      notes: 'Connector guidance is estimate-only and intended for planning conversations.',
    },
    {
      component: 'Service Connections',
      quantity: formatNumber(normalized.totalServiceConnections),
      capacity: 'Hybrid service reachability',
      region: recommendedRegions.join(', '),
      notes: band.serviceGuidance,
    },
    {
      component: 'NGFW Logging',
      quantity: formatNumber(safeInput.ngfwLogRatePerSecond),
      capacity: formatStorageTbFixed(normalized.estimatedNgfwStorageGb),
      region: recommendedRegions.join(', '),
      notes: 'Calibrated log-rate storage estimate based on provided NGFW logs per second.',
    },
    {
      component: 'HA / Resilience',
      quantity: '1 model',
      capacity: band.haModel,
      region: recommendedRegions.join(', '),
      notes: `Selected resilience input: ${safeInput.resilienceModel}.`,
    },
  ];

  const output: RecommendationOutput = {
    recommendedTier: band.tier,
    recommendedRegions,
    recommendedHaModel: band.haModel,
    remoteNetworkRecommendation: band.networkGuidance,
    mobileUserRecommendation: band.mobileGuidance,
    ztnaRecommendation: band.ztnaGuidance,
    serviceConnectionGuidance: band.serviceGuidance,
    loggingRecommendation,
    summary: `Estimated ${normalized.recommendedPurchaseStorageTb} TB purchase recommendation with ${formatStorageTbFixed(
      normalized.estimatedLoggingStorageGb
    )} modeled storage demand and ${formatBandwidthMbps(normalized.branchBandwidthPerSiteMbps)} per-branch SPN bandwidth.`,
    advisoryNotes,
    architectureRows,
    cards: [
      { title: 'Mobile Users', headline: formatNumber(normalized.totalUsers), detail: band.mobileGuidance },
      { title: 'Logging Storage', headline: formatStorageTbFixed(normalized.estimatedLoggingStorageGb), detail: `${loggingRecommendation} Includes calibrated Prisma Access and NGFW storage assumptions when selected.` },
      { title: 'Per-Branch SPN Bandwidth', headline: formatBandwidthMbps(normalized.branchBandwidthPerSiteMbps), detail: 'Estimated remote network bandwidth requirement based on branch users per site.' },
      { title: 'Remote Networks', headline: formatNumber(normalized.totalRemoteFootprint), detail: `${band.networkGuidance} Estimated per-branch SPN bandwidth: ${formatBandwidthMbps(normalized.branchBandwidthPerSiteMbps)}.` },
      { title: 'ZTNA', headline: `${normalized.recommendedConnectorFloor} connectors`, detail: band.ztnaGuidance },
      { title: 'Service Connections', headline: formatNumber(normalized.totalServiceConnections), detail: band.serviceGuidance },
      { title: 'Regions', headline: String(recommendedRegions.length), detail: recommendedRegions.join(', ') },
      { title: 'Recommended Purchase', headline: `${normalized.recommendedPurchaseStorageTb} TB`, detail: `Rounded purchase recommendation from ${formatStorageTbFixed(normalized.estimatedLoggingStorageGb)} modeled storage demand.` },
      { title: 'Management Plane', headline: 'Cloud managed', detail: 'Client-safe estimate logic with no backend dependency.' },
      { title: 'HA / Resilience', headline: band.haModel, detail: `Heuristic score band selected for scale score ${Math.round(scaleScore)}.` },
    ],
    kpis: [
      { label: 'Estimated mobile users', value: formatNumber(normalized.totalUsers) },
      { label: 'Estimated logging storage', value: formatStorageTbFixed(normalized.estimatedLoggingStorageGb) },
      { label: 'Recommended purchase', value: `${normalized.recommendedPurchaseStorageTb} TB` },
      { label: 'Per-branch bandwidth', value: formatBandwidthMbps(normalized.branchBandwidthPerSiteMbps) },
      { label: 'Estimated remote networks', value: formatNumber(normalized.totalRemoteFootprint) },
      { label: 'Estimated throughput', value: formatThroughputGbps(normalized.throughputGbps) },
      { label: 'Estimated service connections', value: formatNumber(normalized.totalServiceConnections) },
      { label: 'Estimated ZTNA apps', value: formatNumber(normalized.ztnaApps) },
      { label: 'Recommended regions', value: recommendedRegions.join(', ') },
    ],
    assumptions: [
      sizingRules.metadata.disclaimer,
      'V1 intentionally uses local client-safe heuristics for fast, low-risk embedding.',
      'Logging storage is estimated from user count, retention, and editable per-user-per-day storage assumptions.',
      'Per-branch SPN bandwidth is estimated from branch users per site using editable local heuristics.',
      'Official sizing logic can later replace these formulas without changing the embed contract.',
    ],
    normalized,
    computedMetrics,
  };

  return { success: true, data: output };
}

export const prismaSizingDisclaimer = sizingRules.metadata.disclaimer;
