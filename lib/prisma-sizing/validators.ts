import { z } from 'zod';
import {
  deploymentTypes,
  loggingOptions,
  redundancyLevels,
  regionOptions,
  resilienceModels,
  sizingModes,
  throughputUnits,
  type CalculatorInput,
  type ValidationResult,
} from '@/types/prisma-sizing';

const nonNegative = z.coerce.number().min(0, 'Value cannot be negative');

export const prismaSizingSchema = z
  .object({
    mode: z.enum(sizingModes),
    deploymentType: z.enum(deploymentTypes),
    ngfwLogRatePerSecond: nonNegative,
    branchSites: nonNegative,
    branchUsersPerSite: nonNegative,
    mobileUsers: nonNegative,
    privateApps: nonNegative,
    serviceConnections: nonNegative,
    throughput: z.object({
      value: z.coerce.number().min(1, 'Throughput must be at least 1'),
      unit: z.enum(throughputUnits),
    }),
    redundancyLevel: z.enum(redundancyLevels),
    totalMobileUsers: nonNegative,
    concurrentUsers: nonNegative,
    remoteNetworkCount: nonNegative,
    averageBandwidthPerSiteMbps: nonNegative,
    smallBranches: nonNegative,
    mediumBranches: nonNegative,
    largeBranches: nonNegative,
    ztnaApps: nonNegative,
    ztnaConnectors: nonNegative,
    dcServiceConnections: nonNegative,
    cloudServiceConnections: nonNegative,
    requiredRegions: z.array(z.enum(regionOptions)).min(1, 'Select at least one region'),
    loggingRetention: z.enum(loggingOptions),
    ademEnabled: z.boolean(),
    resilienceModel: z.enum(resilienceModels),
    cleanPipeEnabled: z.boolean(),
    localBreakoutEnabled: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.concurrentUsers > values.totalMobileUsers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['concurrentUsers'],
        message: 'Concurrent users cannot exceed total mobile users.',
      });
    }

    if (values.redundancyLevel === 'mission-critical' && values.requiredRegions.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requiredRegions'],
        message: 'Mission-critical redundancy requires at least two regions.',
      });
    }
  });

export function validatePrismaSizingInput(input: CalculatorInput): ValidationResult {
  const parsed = prismaSizingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

export const defaultPrismaSizingInput: CalculatorInput = {
  mode: 'simple',
  deploymentType: 'mixed-deployment',
  ngfwLogRatePerSecond: 0,
  branchSites: 24,
  branchUsersPerSite: 120,
  mobileUsers: 2500,
  privateApps: 12,
  serviceConnections: 2,
  throughput: {
    value: 4,
    unit: 'Gbps',
  },
  redundancyLevel: 'enhanced',
  totalMobileUsers: 6000,
  concurrentUsers: 2200,
  remoteNetworkCount: 40,
  averageBandwidthPerSiteMbps: 150,
  smallBranches: 12,
  mediumBranches: 8,
  largeBranches: 3,
  ztnaApps: 18,
  ztnaConnectors: 4,
  dcServiceConnections: 2,
  cloudServiceConnections: 2,
  requiredRegions: ['North America', 'Europe'],
  loggingRetention: '30-days',
  ademEnabled: true,
  resilienceModel: 'dual-region-active-passive',
  cleanPipeEnabled: true,
  localBreakoutEnabled: true,
};
