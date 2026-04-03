export type SiemSizingMode = 'simple' | 'advanced';

export type SiemPlatformKey =
  | 'wazuh'
  | 'splunk'
  | 'qradar'
  | 'sentinel'
  | 'logrhythm'
  | 'graylog'
  | 'cortexxsoar';

export type ArchitectureType = 'Single node' | 'Distributed';

export interface SiemPlatformConfig {
  label: string;
  shortLabel: string;
  summary: string;
  employeeAgentFactor: number;
  networkAgentFactor: number;
  endpointGbPerDay: number;
  serverGbPerDay: number;
  networkGbPerDay: number;
  cloudGbPerDay: number;
}

export interface SiemSizingInput {
  mode: SiemSizingMode;
  platform: SiemPlatformKey;
  employees: number;
  networkEquipment: number;
  endpoints: number;
  servers: number;
  networkSources: number;
  cloudSources: number;
  retentionDays: number;
  compressionRatio: number;
  highAvailability: boolean;
}

export interface InfrastructureRow {
  component: string;
  qty: number;
  vcpu: number;
  ramGb: number;
  diskGb: number;
}

export interface ArchitectureRecommendation {
  type: ArchitectureType;
  explanation: string;
  masterNodes: number;
  indexerNodes: number;
  dashboardNodes: number;
  workerNodes: number;
  allInOneNodes: number;
  rows: InfrastructureRow[];
}

export interface InfrastructureTotals {
  qty: number;
  vcpu: number;
  ramGb: number;
  diskGb: number;
}

export interface SiemSizingResult {
  platform: SiemPlatformKey;
  mode: SiemSizingMode;
  estimatedEndpointAgents: number;
  estimatedNetworkAgents: number;
  estimatedAgents: number;
  estimatedDailyVolumeGb: number;
  estimatedStorageGb: number;
  retentionDays: number;
  compressionRatio: number;
  architecture: ArchitectureRecommendation;
  totals: InfrastructureTotals;
}
