export const sizingModes = ['simple', 'advanced'] as const;
export const deploymentTypes = [
  'ngfw',
  'remote-networks',
  'mobile-users',
  'ztna',
  'service-connections',
  'branch-offices',
  'mixed-deployment',
] as const;
export const redundancyLevels = ['standard', 'enhanced', 'mission-critical'] as const;
export const throughputUnits = ['Mbps', 'Gbps'] as const;
export const loggingOptions = ['7-days', '30-days', '90-days', '12-month'] as const;
export const regionOptions = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Middle East',
  'Latin America',
] as const;
export const resilienceModels = [
  'single-region-standard',
  'dual-region-active-passive',
  'dual-region-active-active',
  'regional-ha-plus-breakout',
] as const;

export type SizingMode = (typeof sizingModes)[number];
export type DeploymentType = (typeof deploymentTypes)[number];
export type RedundancyLevel = (typeof redundancyLevels)[number];
export type ThroughputUnit = (typeof throughputUnits)[number];
export type LoggingOption = (typeof loggingOptions)[number];
export type RegionOption = (typeof regionOptions)[number];
export type ResilienceModel = (typeof resilienceModels)[number];
export type SearchParams = Record<string, string | string[] | undefined>;

export type CalculatorInput = {
  mode: SizingMode;
  deploymentType: DeploymentType;
  ngfwLogRatePerSecond: number;
  branchSites: number;
  branchUsersPerSite: number;
  mobileUsers: number;
  privateApps: number;
  serviceConnections: number;
  throughput: {
    value: number;
    unit: ThroughputUnit;
  };
  redundancyLevel: RedundancyLevel;
  totalMobileUsers: number;
  concurrentUsers: number;
  remoteNetworkCount: number;
  averageBandwidthPerSiteMbps: number;
  smallBranches: number;
  mediumBranches: number;
  largeBranches: number;
  ztnaApps: number;
  ztnaConnectors: number;
  dcServiceConnections: number;
  cloudServiceConnections: number;
  requiredRegions: RegionOption[];
  loggingRetention: LoggingOption;
  ademEnabled: boolean;
  resilienceModel: ResilienceModel;
  cleanPipeEnabled: boolean;
  localBreakoutEnabled: boolean;
};

export type NormalizedInput = {
  throughputGbps: number;
  effectiveConcurrentMobileUsers: number;
  remoteNetworkAggregateBandwidthGbps: number;
  branchBandwidthPerSiteMbps: number;
  branchComplexityScore: number;
  mixedDeploymentComplexityScore: number;
  totalServiceConnections: number;
  totalUsers: number;
  totalRemoteFootprint: number;
  ztnaApps: number;
  recommendedConnectorFloor: number;
  estimatedNgfwStorageGb: number;
  estimatedRemoteNetworkStorageGb: number;
  estimatedMobileUserStorageGb: number;
  estimatedLoggingStorageGb: number;
  recommendedPurchaseStorageTb: number;
  selectedRegions: RegionOption[];
};

export type ComputedMetrics = {
  scaleScore: number;
  throughputGbps: number;
  effectiveConcurrentMobileUsers: number;
  remoteNetworkAggregateBandwidthGbps: number;
  branchBandwidthPerSiteMbps: number;
  branchComplexityScore: number;
  mixedDeploymentComplexityScore: number;
  totalServiceConnections: number;
  totalRemoteFootprint: number;
  estimatedNgfwStorageGb: number;
  estimatedRemoteNetworkStorageGb: number;
  estimatedMobileUserStorageGb: number;
  estimatedLoggingStorageGb: number;
  recommendedPurchaseStorageTb: number;
};

export type AdvisoryNote = {
  level: 'info' | 'warning' | 'attention';
  title: string;
  description: string;
};

export type ArchitectureRow = {
  component: string;
  quantity: string;
  capacity: string;
  region: string;
  notes: string;
};

export type RecommendationCard = {
  title: string;
  headline: string;
  detail: string;
};

export type RecommendationOutput = {
  recommendedTier: string;
  recommendedRegions: RegionOption[];
  recommendedHaModel: string;
  remoteNetworkRecommendation: string;
  mobileUserRecommendation: string;
  ztnaRecommendation: string;
  serviceConnectionGuidance: string;
  loggingRecommendation: string;
  summary: string;
  advisoryNotes: AdvisoryNote[];
  architectureRows: ArchitectureRow[];
  cards: RecommendationCard[];
  kpis: Array<{ label: string; value: string }>;
  assumptions: string[];
  normalized: NormalizedInput;
  computedMetrics: ComputedMetrics;
};

export type PrismaSizingExportPayload = {
  exportedAt: string;
  rawInput: CalculatorInput;
  normalizedInput: NormalizedInput;
  computedMetrics: ComputedMetrics;
  recommendation: RecommendationOutput;
  advisoryNotes: AdvisoryNote[];
  architectureTable: ArchitectureRow[];
};

export type ValidationResult =
  | { success: true; data: CalculatorInput }
  | { success: false; errors: string[] };

export type RulesEngineResult =
  | { success: true; data: RecommendationOutput }
  | { success: false; errors: string[] };

export type PrismaSizingRules = {
  metadata: {
    disclaimer: string;
    supportedRegions: RegionOption[];
  };
  normalization: {
    throughputToGbps: Record<ThroughputUnit, number>;
    defaultConcurrentRatio: number;
    defaultBranchUsersPerSite: number;
    branchWeights: {
      small: number;
      medium: number;
      large: number;
    };
    branchBandwidthMbps: {
      small: number;
      medium: number;
      large: number;
    };
    featureUplifts: {
      ademEnabled: number;
      cleanPipeEnabled: number;
      localBreakoutEnabled: number;
    };
    branchUserBandwidthMbps: {
      perUser: number;
      minimumPerSite: number;
    };
    loggingStorageGbPerUserPerDay: number;
    loggingRetentionDays: Record<LoggingOption, number>;
    deploymentMultipliers: Record<
      DeploymentType,
      {
        branchBandwidth: number;
        loggingStorage: number;
      }
    >;
    storageEstimation: {
      mobileUserGbPerUserPerDay: number;
      remoteNetworkGbPerMbpsPerDay: number;
      ngfwGbPerLogRatePerSecondPerDay: number;
    };
  };
  thresholds: {
    connectorsPerApps: Array<{
      maxApps: number;
      connectors: number;
    }>;
    logging: Array<{
      option: LoggingOption;
      recommendation: string;
    }>;
    minimumRegionsByRedundancy: Record<RedundancyLevel, number>;
    scoreBands: Array<{
      maxScore: number;
      tier: string;
      regions: number;
      haModel: ResilienceModel;
      mobileGuidance: string;
      networkGuidance: string;
      ztnaGuidance: string;
      serviceGuidance: string;
    }>;
    advisories: {
      highThroughputGbps: number;
      mixedComplexityScore: number;
    };
  };
};
