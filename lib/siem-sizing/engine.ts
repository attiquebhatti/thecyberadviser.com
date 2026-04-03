import {
  DEFAULT_COMPRESSION_RATIO,
  DEFAULT_RETENTION_DAYS,
  SIEM_PLATFORM_CONFIG,
} from '@/config/siem-sizing-platforms';
import type {
  ArchitectureRecommendation,
  InfrastructureRow,
  InfrastructureTotals,
  SiemSizingInput,
  SiemSizingResult,
} from '@/types/siem-sizing';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function safeNumber(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function buildTotals(rows: InfrastructureRow[]): InfrastructureTotals {
  return rows.reduce<InfrastructureTotals>(
    (acc, row) => ({
      qty: acc.qty + row.qty,
      vcpu: acc.vcpu + row.qty * row.vcpu,
      ramGb: acc.ramGb + row.qty * row.ramGb,
      diskGb: acc.diskGb + row.qty * row.diskGb,
    }),
    { qty: 0, vcpu: 0, ramGb: 0, diskGb: 0 }
  );
}

function buildArchitecture(input: {
  agents: number;
  dailyVolumeGb: number;
  storageGb: number;
  highAvailability: boolean;
}): ArchitectureRecommendation {
  const { agents, dailyVolumeGb, storageGb, highAvailability } = input;
  const isDistributed = highAvailability || dailyVolumeGb > 8 || agents > 50;

  if (!isDistributed) {
    const allInOneCpu = dailyVolumeGb > 4 ? 8 : 4;
    const allInOneRam = dailyVolumeGb > 4 ? 16 : 8;
    const allInOneDisk = Math.max(120, Math.ceil(storageGb + 50));

    return {
      type: 'Single node',
      explanation:
        'A single-node deployment is sufficient for this workload and keeps the platform compact for smaller SOC environments.',
      masterNodes: 0,
      indexerNodes: 0,
      dashboardNodes: 0,
      workerNodes: 0,
      allInOneNodes: 1,
      rows: [
        {
          component: 'All-in-one node',
          qty: 1,
          vcpu: allInOneCpu,
          ramGb: allInOneRam,
          diskGb: allInOneDisk,
        },
      ],
    };
  }

  const indexerNodes = dailyVolumeGb > 120 ? 3 : dailyVolumeGb > 40 ? 2 : 1;
  const workerNodes = dailyVolumeGb > 150 || agents > 1500 ? Math.max(1, Math.ceil(agents / 1000) - 1) : 0;
  const indexerDisk = Math.max(120, Math.ceil(storageGb / indexerNodes));
  const indexerCpu = dailyVolumeGb > 80 ? 8 : 4;
  const indexerRam = dailyVolumeGb > 80 ? 16 : 8;

  return {
    type: 'Distributed',
    explanation:
      'A distributed architecture is recommended to separate control, indexing, and presentation roles as ingest and resilience requirements increase.',
    masterNodes: 1,
    indexerNodes,
    dashboardNodes: 1,
    workerNodes,
    allInOneNodes: 0,
    rows: [
      {
        component: 'Master node',
        qty: 1,
        vcpu: 4,
        ramGb: 8,
        diskGb: 50,
      },
      {
        component: 'Indexer nodes',
        qty: indexerNodes,
        vcpu: indexerCpu,
        ramGb: indexerRam,
        diskGb: indexerDisk,
      },
      {
        component: 'Dashboard nodes',
        qty: 1,
        vcpu: 2,
        ramGb: 4,
        diskGb: 50,
      },
      ...(workerNodes > 0
        ? [
            {
              component: 'Worker nodes',
              qty: workerNodes,
              vcpu: 4,
              ramGb: 8,
              diskGb: 50,
            },
          ]
        : []),
    ],
  };
}

export function calculateSiemSizing(input: SiemSizingInput): SiemSizingResult {
  const platform = SIEM_PLATFORM_CONFIG[input.platform];

  const retentionDays = Math.max(1, safeNumber(input.retentionDays) || DEFAULT_RETENTION_DAYS);
  const compressionRatio = clamp(
    safeNumber(input.compressionRatio) || DEFAULT_COMPRESSION_RATIO,
    1,
    20
  );

  const employees = safeNumber(input.employees);
  const networkEquipment = safeNumber(input.networkEquipment);
  const endpoints = safeNumber(input.endpoints);
  const servers = safeNumber(input.servers);
  const networkSources = safeNumber(input.networkSources);
  const cloudSources = safeNumber(input.cloudSources);

  const estimatedEndpointAgents =
    input.mode === 'simple' ? Math.ceil(employees * platform.employeeAgentFactor) : Math.ceil(endpoints);

  const estimatedNetworkAgents =
    input.mode === 'simple' ? Math.ceil(networkEquipment * platform.networkAgentFactor) : Math.ceil(networkSources);

  const estimatedAgents =
    input.mode === 'simple'
      ? estimatedEndpointAgents + estimatedNetworkAgents
      : estimatedEndpointAgents + Math.ceil(servers) + estimatedNetworkAgents + Math.ceil(cloudSources);

  const dailyVolumeGb =
    input.mode === 'simple'
      ? employees * platform.endpointGbPerDay + networkEquipment * platform.networkGbPerDay
      : endpoints * platform.endpointGbPerDay +
        servers * platform.serverGbPerDay +
        networkSources * platform.networkGbPerDay +
        cloudSources * platform.cloudGbPerDay;

  const estimatedDailyVolumeGb = round1(dailyVolumeGb);
  const estimatedStorageGb = round1((dailyVolumeGb * retentionDays) / compressionRatio);

  const architecture = buildArchitecture({
    agents: estimatedAgents,
    dailyVolumeGb: estimatedDailyVolumeGb,
    storageGb: estimatedStorageGb,
    highAvailability: input.highAvailability,
  });

  return {
    platform: input.platform,
    mode: input.mode,
    estimatedEndpointAgents,
    estimatedNetworkAgents,
    estimatedAgents,
    estimatedDailyVolumeGb,
    estimatedStorageGb,
    retentionDays,
    compressionRatio,
    architecture,
    totals: buildTotals(architecture.rows),
  };
}
