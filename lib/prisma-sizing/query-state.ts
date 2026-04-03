import { defaultPrismaSizingInput } from '@/lib/prisma-sizing/validators';
import {
  deploymentTypes,
  loggingOptions,
  redundancyLevels,
  regionOptions,
  resilienceModels,
  sizingModes,
  throughputUnits,
  type CalculatorInput,
  type SearchParams,
} from '@/types/prisma-sizing';

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readNumber(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(readString(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(value: string | string[] | undefined, fallback: boolean) {
  const parsed = readString(value)?.toLowerCase();
  if (parsed === 'true') return true;
  if (parsed === 'false') return false;
  return fallback;
}

function readEnum<T extends readonly string[]>(
  value: string | string[] | undefined,
  allowed: T,
  fallback: T[number]
): T[number] {
  const parsed = readString(value);
  return parsed && allowed.includes(parsed as T[number]) ? (parsed as T[number]) : fallback;
}

export function parsePrismaSizingPrefill(searchParams?: SearchParams): Partial<CalculatorInput> {
  if (!searchParams) {
    return {};
  }

  const regionsRaw = readString(searchParams.regions);
  const requiredRegions = regionsRaw
    ? regionsRaw
        .split(',')
        .map((region) => region.trim())
        .filter((region): region is (typeof regionOptions)[number] =>
          regionOptions.includes(region as (typeof regionOptions)[number])
        )
    : defaultPrismaSizingInput.requiredRegions;

  return {
    mode: readEnum(searchParams.mode, sizingModes, defaultPrismaSizingInput.mode),
    deploymentType: readEnum(
      searchParams.deploymentType,
      deploymentTypes,
      defaultPrismaSizingInput.deploymentType
    ),
    ngfwLogRatePerSecond: readNumber(
      searchParams.ngfwLogRatePerSecond,
      defaultPrismaSizingInput.ngfwLogRatePerSecond
    ),
    branchSites: readNumber(searchParams.branchSites, defaultPrismaSizingInput.branchSites),
    branchUsersPerSite: readNumber(
      searchParams.branchUsersPerSite,
      defaultPrismaSizingInput.branchUsersPerSite
    ),
    mobileUsers: readNumber(searchParams.mobileUsers, defaultPrismaSizingInput.mobileUsers),
    privateApps: readNumber(searchParams.privateApps, defaultPrismaSizingInput.privateApps),
    serviceConnections: readNumber(
      searchParams.serviceConnections,
      defaultPrismaSizingInput.serviceConnections
    ),
    throughput: {
      value: readNumber(searchParams.throughputValue, defaultPrismaSizingInput.throughput.value),
      unit: readEnum(
        searchParams.throughputUnit,
        throughputUnits,
        defaultPrismaSizingInput.throughput.unit
      ),
    },
    redundancyLevel: readEnum(
      searchParams.redundancyLevel,
      redundancyLevels,
      defaultPrismaSizingInput.redundancyLevel
    ),
    totalMobileUsers: readNumber(
      searchParams.totalMobileUsers,
      defaultPrismaSizingInput.totalMobileUsers
    ),
    concurrentUsers: readNumber(
      searchParams.concurrentUsers,
      defaultPrismaSizingInput.concurrentUsers
    ),
    remoteNetworkCount: readNumber(
      searchParams.remoteNetworkCount,
      defaultPrismaSizingInput.remoteNetworkCount
    ),
    averageBandwidthPerSiteMbps: readNumber(
      searchParams.averageBandwidthPerSiteMbps,
      defaultPrismaSizingInput.averageBandwidthPerSiteMbps
    ),
    smallBranches: readNumber(searchParams.smallBranches, defaultPrismaSizingInput.smallBranches),
    mediumBranches: readNumber(
      searchParams.mediumBranches,
      defaultPrismaSizingInput.mediumBranches
    ),
    largeBranches: readNumber(searchParams.largeBranches, defaultPrismaSizingInput.largeBranches),
    ztnaApps: readNumber(searchParams.ztnaApps, defaultPrismaSizingInput.ztnaApps),
    ztnaConnectors: readNumber(
      searchParams.ztnaConnectors,
      defaultPrismaSizingInput.ztnaConnectors
    ),
    dcServiceConnections: readNumber(
      searchParams.dcServiceConnections,
      defaultPrismaSizingInput.dcServiceConnections
    ),
    cloudServiceConnections: readNumber(
      searchParams.cloudServiceConnections,
      defaultPrismaSizingInput.cloudServiceConnections
    ),
    requiredRegions,
    loggingRetention: readEnum(
      searchParams.loggingRetention,
      loggingOptions,
      defaultPrismaSizingInput.loggingRetention
    ),
    ademEnabled: readBoolean(searchParams.ademEnabled, defaultPrismaSizingInput.ademEnabled),
    resilienceModel: readEnum(
      searchParams.resilienceModel,
      resilienceModels,
      defaultPrismaSizingInput.resilienceModel
    ),
    cleanPipeEnabled: readBoolean(
      searchParams.cleanPipeEnabled,
      defaultPrismaSizingInput.cleanPipeEnabled
    ),
    localBreakoutEnabled: readBoolean(
      searchParams.localBreakoutEnabled,
      defaultPrismaSizingInput.localBreakoutEnabled
    ),
  };
}
