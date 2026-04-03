'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Download,
  FileText,
  Info,
  Layers3,
  Network,
  Printer,
  Router,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePrismaSizingEmbedHeight } from '@/hooks/use-prisma-sizing-embed-height';
import { buildPrismaSizingRecommendation } from '@/lib/prisma-sizing/rules-engine';
import {
  buildPrismaSizingExportPayload,
  formatPrismaSizingSummary,
} from '@/lib/prisma-sizing/summary';
import { defaultPrismaSizingInput } from '@/lib/prisma-sizing/validators';
import {
  deploymentTypes,
  loggingOptions,
  redundancyLevels,
  regionOptions,
  resilienceModels,
  throughputUnits,
  type CalculatorInput,
  type DeploymentType,
} from '@/types/prisma-sizing';

type Props = {
  initialValues?: Partial<CalculatorInput>;
  variant?: 'embed' | 'site';
};

const deploymentLabels: Record<DeploymentType, string> = {
  ngfw: 'Next-Generation Firewall',
  'remote-networks': 'Remote Networks',
  'mobile-users': 'Mobile Users',
  ztna: 'ZTNA',
  'service-connections': 'Service Connections',
  'branch-offices': 'Branch Offices',
  'mixed-deployment': 'Mixed Deployment',
};

const deploymentTileDescriptions: Record<DeploymentType, string> = {
  ngfw: 'NGFW log storage estimation',
  'remote-networks': 'Bandwidth and SPN planning',
  'mobile-users': 'User and logging demand',
  ztna: 'Private app and connector focus',
  'service-connections': 'Hybrid connectivity sizing',
  'branch-offices': 'Branch traffic and footprint',
  'mixed-deployment': 'Combined enterprise rollout',
};

const deploymentTileBadges: Record<DeploymentType, string> = {
  ngfw: 'NGFW',
  'remote-networks': 'RN',
  'mobile-users': 'MU',
  ztna: 'ZTNA',
  'service-connections': 'SC',
  'branch-offices': 'BO',
  'mixed-deployment': 'MX',
};

const deploymentIcons: Record<DeploymentType, typeof Router> = {
  ngfw: FileText,
  'remote-networks': Router,
  'mobile-users': Users,
  ztna: ShieldCheck,
  'service-connections': Network,
  'branch-offices': Building2,
  'mixed-deployment': Layers3,
};

const surfaceCardClass =
  'rounded-[2rem] border border-white/[0.08] bg-[#111522] shadow-[0_22px_70px_rgba(0,0,0,0.38)]';
const fieldClass =
  'border-white/[0.08] bg-[#090d18] text-slate-100 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-[#FFC300]/45';
const selectTriggerClass =
  'border-white/[0.08] bg-[#090d18] text-slate-100 focus:ring-1 focus:ring-[#FFC300]/45';
const checkboxRowClass =
  'flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#151a29] px-4 py-3 text-sm text-slate-300';

function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#151a29] text-[#FFC300]"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs border-slate-700 bg-slate-950 text-slate-100">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function PrintMetricChart({
  items,
}: {
  items: Array<{ label: string; value: number; display: string }>;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0);

        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-[13px]">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-900">{item.display}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFC300] to-[#E7A900]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrismaAccessSizingEmbed({ initialValues, variant = 'embed' }: Props) {
  const [input, setInput] = useState<CalculatorInput>({
    ...defaultPrismaSizingInput,
    ...initialValues,
    mode: 'simple',
    throughput: {
      ...defaultPrismaSizingInput.throughput,
      ...initialValues?.throughput,
    },
    requiredRegions: initialValues?.requiredRegions ?? defaultPrismaSizingInput.requiredRegions,
  });

  const result = useMemo(() => buildPrismaSizingRecommendation(input), [input]);
  const [lastValidRecommendation, setLastValidRecommendation] = useState(
    result.success ? result.data : undefined
  );
  const [resultPulse, setResultPulse] = useState(false);
  const recommendation = result.success ? result.data : lastValidRecommendation;
  const isSimple = true;
  const isSiteVariant = variant === 'site';
  const resultStatusText = result.success
    ? 'Estimate updated'
    : 'Showing last valid estimate while you edit';

  useEffect(() => {
    if (result.success) {
      setLastValidRecommendation(result.data);
      setResultPulse(true);
      const timer = window.setTimeout(() => setResultPulse(false), 320);
      return () => window.clearTimeout(timer);
    }
  }, [result]);

  usePrismaSizingEmbedHeight(true, [input, recommendation]);

  function update<K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function updateToggle(
    key: 'ademEnabled' | 'cleanPipeEnabled' | 'localBreakoutEnabled',
    checked: boolean
  ) {
    setInput((current) => ({ ...current, [key]: checked }));
  }

  function updateThroughputValue(value: number) {
    setInput((current) => ({
      ...current,
      throughput: { ...current.throughput, value },
    }));
  }

  async function copySummary() {
    if (!recommendation) return;
    await navigator.clipboard.writeText(formatPrismaSizingSummary(input, recommendation));
  }

  function exportJson() {
    if (!recommendation) return;
    const payload = buildPrismaSizingExportPayload(input, recommendation);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prisma-access-sizing-estimate.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  const getKpiValue = (label: string) =>
    recommendation?.kpis.find((item) => item.label === label)?.value ?? '-';
  const deploymentFocus = input.deploymentType;
  const showUserInputs =
    deploymentFocus === 'mobile-users' || deploymentFocus === 'mixed-deployment' || deploymentFocus === 'ztna';
  const showNetworkInputs =
    deploymentFocus === 'remote-networks' || deploymentFocus === 'branch-offices' || deploymentFocus === 'mixed-deployment';
  const showNgfwInputs = deploymentFocus === 'ngfw' || deploymentFocus === 'mixed-deployment';
  const showZtnaInputs = deploymentFocus === 'ztna' || deploymentFocus === 'mixed-deployment';
  const showServiceInputs =
    deploymentFocus === 'service-connections' || deploymentFocus === 'mixed-deployment';

  const deploymentFocusCopy: Record<DeploymentType, { title: string; helper: string }> = {
    'remote-networks': {
      title: 'Remote network planning',
      helper: 'Focus on branch counts, users per branch, and bandwidth planning for SPNs.',
    },
    ngfw: {
      title: 'NGFW logging planning',
      helper: 'Focus on average log rate and retention to estimate Strata Logging Service storage for NGFW logs.',
    },
    'mobile-users': {
      title: 'Mobile user planning',
      helper: 'Focus on total users, retention, and regional resilience for mobile access.',
    },
    ztna: {
      title: 'ZTNA planning',
      helper: 'Focus on users, private apps, connectors, and logging assumptions.',
    },
    'service-connections': {
      title: 'Service connection planning',
      helper: 'Focus on service connection count, throughput, and regional architecture choices.',
    },
    'branch-offices': {
      title: 'Branch office planning',
      helper: 'Focus on branch population, remote network count, and branch bandwidth demand.',
    },
    'mixed-deployment': {
      title: 'Mixed deployment planning',
      helper: 'Use the broader input set when the design combines mobile users, branches, ZTNA, and service connections.',
    },
  };

  const printReportRows = recommendation
    ? [
        { label: 'Deployment mode', value: 'Smart estimator' },
        { label: 'Deployment type', value: deploymentLabels[input.deploymentType] },
        { label: 'Recommended tier', value: recommendation.recommendedTier },
        { label: 'Recommended regions', value: recommendation.recommendedRegions.join(', ') },
        { label: 'HA model', value: recommendation.recommendedHaModel },
        { label: 'Estimated logging storage', value: getKpiValue('Estimated logging storage') },
        { label: 'Per-branch bandwidth', value: getKpiValue('Per-branch bandwidth') },
        { label: 'Estimated throughput', value: getKpiValue('Estimated throughput') },
      ]
    : [];

  const printInputRows = recommendation
    ? [
        { label: 'Mobile users', value: isSimple ? String(input.mobileUsers) : String(input.totalMobileUsers) },
        { label: 'NGFW logs / second', value: String(input.ngfwLogRatePerSecond) },
        { label: 'Branch users per site', value: String(input.branchUsersPerSite) },
        { label: 'Branch sites / remote networks', value: String(input.branchSites || recommendation.normalized.totalRemoteFootprint) },
        { label: 'Private / ZTNA apps', value: String(recommendation.normalized.ztnaApps) },
        { label: 'Service connections', value: String(recommendation.normalized.totalServiceConnections) },
        { label: 'Logging retention', value: input.loggingRetention },
        { label: 'Redundancy level', value: input.redundancyLevel },
        { label: 'Regions', value: input.requiredRegions.join(', ') || 'Not specified' },
      ]
    : [];

  const chartItems = recommendation
    ? [
        {
          label: 'Logging storage',
          value: recommendation.computedMetrics.estimatedLoggingStorageGb,
          display: getKpiValue('Estimated logging storage'),
        },
        {
          label: 'Per-branch bandwidth',
          value: recommendation.computedMetrics.branchBandwidthPerSiteMbps,
          display: getKpiValue('Per-branch bandwidth'),
        },
        {
          label: 'Remote footprint',
          value: recommendation.normalized.totalRemoteFootprint,
          display: getKpiValue('Estimated remote networks'),
        },
        {
          label: 'Throughput',
          value: recommendation.computedMetrics.throughputGbps,
          display: getKpiValue('Estimated throughput'),
        },
      ]
    : [];

  return (
    <TooltipProvider>
      <div
        className={
          isSiteVariant
            ? 'px-0 py-0 text-slate-100'
            : 'min-h-screen bg-[#050914] px-3 py-3 text-slate-100 sm:px-4'
        }
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_380px]">
            <section className="space-y-4 print:hidden" aria-label="Calculator input panel">
              <Card className={surfaceCardClass}>
                <CardHeader className="space-y-5 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <Badge className="rounded-full border border-[#FFC300]/30 bg-[#FFC300]/12 px-3 py-1 text-[#FFD966] hover:bg-[#FFC300]/12">
                        Smart interactive estimator
                      </Badge>
                      <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight text-white">
                          Prisma Access Sizing Calculator
                        </h1>
                        <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                          Enter the few planning inputs that matter most. The calculator will estimate
                          logging storage, per-branch SPN bandwidth, and an architectural recommendation.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-[#151a29] px-4 py-3 text-sm text-slate-300">
                      <div className="mb-2 flex items-center gap-2 font-medium text-white">
                        <ShieldCheck className="h-4 w-4 text-[#FFC300]" />
                        {resultStatusText}
                      </div>
                      <p>Compact input panel, clear recommendation card, and instant client-side updates.</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {deploymentTypes.map((type) => {
                      const Icon = deploymentIcons[type];
                      const active = input.deploymentType === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => update('deploymentType', type)}
                          aria-pressed={active}
                          className={`group flex min-h-[132px] flex-col justify-between rounded-3xl border px-4 py-4 text-left transition-all duration-300 ${
                            active
                              ? 'border-[#FFC300] bg-[linear-gradient(180deg,rgba(255,195,0,0.18),rgba(255,195,0,0.06))] text-white shadow-[0_0_28px_rgba(255,195,0,0.12)] ring-1 ring-[#FFC300]/20'
                              : 'border-white/[0.08] bg-[#151a29] text-slate-300 hover:-translate-y-0.5 hover:border-[#FFC300]/30 hover:text-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                                  active
                                    ? 'border-[#FFC300]/45 bg-[#0f1320] text-[#FFD966]'
                                    : 'border-white/[0.08] bg-[#0f1320] text-slate-400 group-hover:text-[#FFD966]'
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                                  active
                                    ? 'border-[#FFC300]/35 bg-[#FFC300]/10 text-[#FFD966]'
                                    : 'border-white/[0.08] bg-[#111522] text-slate-500'
                                }`}
                              >
                                {deploymentTileBadges[type]}
                              </div>
                            </div>
                            <div className="pt-1">
                              <Image
                                src="/images/header-logo.png"
                                alt="The Cyber Adviser"
                                width={44}
                                height={48}
                                className={`h-9 w-auto opacity-80 transition ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="text-sm font-semibold">{deploymentLabels[type]}</div>
                            <div
                              className={`text-xs leading-5 ${
                                active ? 'text-[#F5D67A]' : 'text-slate-400'
                              }`}
                            >
                              {deploymentTileDescriptions[type]}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {!result.success ? (
                    <Alert className="rounded-3xl border-[#FFC300]/25 bg-[#241c0b] text-[#FFE39A]">
                      <AlertTitle>Validation needs attention</AlertTitle>
                      <AlertDescription>
                        {result.errors.slice(0, 2).join(' ')} Your previous valid estimate is still shown on the right.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                    <div className="rounded-3xl border border-white/[0.08] bg-[#151a29] px-4 py-4">
                      <div className="text-sm font-semibold text-white">
                        {deploymentFocusCopy[deploymentFocus].title}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {deploymentFocusCopy[deploymentFocus].helper}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {showUserInputs ? (
                      <div className="space-y-2">
                      <div className="flex min-h-[24px] items-center gap-2">
                          <Label htmlFor="prisma-users-total" className="text-slate-200">
                            {isSimple ? 'Number of users' : 'Total mobile users'}
                          </Label>
                          <Hint text="Primary driver for mobile user scale and estimated Strata logging storage." />
                        </div>
                        <Input
                          className={fieldClass}
                          id="prisma-users-total"
                          type="number"
                          min={0}
                          value={isSimple ? input.mobileUsers : input.totalMobileUsers}
                          onChange={(event) =>
                            isSimple
                              ? update('mobileUsers', Number(event.target.value) || 0)
                              : update('totalMobileUsers', Number(event.target.value) || 0)
                          }
                        />
                      </div>
                    ) : null}

                    {showNetworkInputs ? (
                      <div className="space-y-2">
                      <div className="flex min-h-[24px] items-center gap-2">
                          <Label htmlFor="prisma-branch-users-per-site" className="text-slate-200">
                            Users per branch
                          </Label>
                          <Hint text="Used to estimate the remote network SPN bandwidth required for each branch." />
                        </div>
                        <Input
                          className={fieldClass}
                          id="prisma-branch-users-per-site"
                          type="number"
                          min={0}
                          value={input.branchUsersPerSite}
                          onChange={(event) => update('branchUsersPerSite', Number(event.target.value) || 0)}
                        />
                      </div>
                    ) : null}

                    {showNetworkInputs ? (
                      <div className="space-y-2">
                        <Label htmlFor="prisma-branch-sites" className="text-slate-200">
                          Branch sites / remote networks
                        </Label>
                        <Input
                          className={fieldClass}
                          id="prisma-branch-sites"
                          type="number"
                          min={0}
                          value={isSimple ? input.branchSites : input.remoteNetworkCount}
                          onChange={(event) =>
                            isSimple
                              ? update('branchSites', Number(event.target.value) || 0)
                              : update('remoteNetworkCount', Number(event.target.value) || 0)
                          }
                        />
                      </div>
                    ) : null}

                    {showNgfwInputs ? (
                      <div className="space-y-2">
                        <div className="flex min-h-[24px] items-center gap-2">
                          <Label htmlFor="prisma-ngfw-log-rate" className="text-slate-200">
                            NGFW logs per second
                          </Label>
                          <Hint text="Used to estimate Strata Logging Service storage for Next-Generation Firewall logs." />
                        </div>
                        <Input
                          className={fieldClass}
                          id="prisma-ngfw-log-rate"
                          type="number"
                          min={0}
                          value={input.ngfwLogRatePerSecond}
                          onChange={(event) => update('ngfwLogRatePerSecond', Number(event.target.value) || 0)}
                        />
                      </div>
                    ) : null}

                    {showZtnaInputs ? (
                      <div className="space-y-2">
                        <Label htmlFor="prisma-ztna-apps" className="text-slate-200">
                          {isSimple ? 'Private apps' : 'ZTNA apps'}
                        </Label>
                        <Input
                          className={fieldClass}
                          id="prisma-ztna-apps"
                          type="number"
                          min={0}
                          value={isSimple ? input.privateApps : input.ztnaApps}
                          onChange={(event) =>
                            isSimple
                              ? update('privateApps', Number(event.target.value) || 0)
                              : update('ztnaApps', Number(event.target.value) || 0)
                          }
                        />
                      </div>
                    ) : null}

                    {showServiceInputs ? (
                      <div className="space-y-2">
                        <Label htmlFor="prisma-service-connections" className="text-slate-200">
                          Service connections
                        </Label>
                        <Input
                          className={fieldClass}
                          id="prisma-service-connections"
                          type="number"
                          min={0}
                          value={isSimple ? input.serviceConnections : input.dcServiceConnections + input.cloudServiceConnections}
                          onChange={(event) =>
                              isSimple
                                ? update('serviceConnections', Number(event.target.value) || 0)
                                : update('dcServiceConnections', Number(event.target.value) || 0)
                          }
                        />
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="prisma-logging-retention" className="text-slate-200">
                        Logging retention
                      </Label>
                      <Select
                        value={input.loggingRetention}
                        onValueChange={(value) =>
                          update('loggingRetention', value as CalculatorInput['loggingRetention'])
                        }
                      >
                        <SelectTrigger className={selectTriggerClass} id="prisma-logging-retention">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {loggingOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prisma-redundancy-level" className="text-slate-200">
                        Redundancy level
                      </Label>
                      <Select
                        value={input.redundancyLevel}
                        onValueChange={(value) =>
                          update('redundancyLevel', value as CalculatorInput['redundancyLevel'])
                        }
                      >
                        <SelectTrigger className={selectTriggerClass} id="prisma-redundancy-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {redundancyLevels.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prisma-resilience-model" className="text-slate-200">
                        Resilience model
                      </Label>
                      <Select
                        value={input.resilienceModel}
                        onValueChange={(value) =>
                          update('resilienceModel', value as CalculatorInput['resilienceModel'])
                        }
                      >
                        <SelectTrigger className={selectTriggerClass} id="prisma-resilience-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resilienceModels.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/[0.08] bg-[#151a29] px-4 py-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Modeled throughput</div>
                        <p className="text-xs text-slate-400">
                          Adjustable for overall deployment sizing. Keep it simple and use the slider.
                        </p>
                      </div>
                      <div className="rounded-full border border-[#FFC300]/20 bg-[#FFC300]/10 px-3 py-1 text-sm font-semibold text-[#FFD966]">
                        {input.throughput.value} {input.throughput.unit}
                      </div>
                    </div>
                    <Slider
                      min={1}
                      max={100}
                      step={1}
                      value={[input.throughput.value]}
                      onValueChange={(value) => updateThroughputValue(value[0] ?? input.throughput.value)}
                    />
                    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                      <Input
                        className={fieldClass}
                        id="prisma-throughput-value"
                        type="number"
                        min={1}
                        value={input.throughput.value}
                        onChange={(event) => updateThroughputValue(Number(event.target.value) || 0)}
                      />
                      <Select
                        value={input.throughput.unit}
                        onValueChange={(value) =>
                          setInput((current) => ({
                            ...current,
                            throughput: {
                              ...current.throughput,
                              unit: value as CalculatorInput['throughput']['unit'],
                            },
                          }))
                        }
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {throughputUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {regionOptions.map((region) => {
                      const checked = input.requiredRegions.includes(region);
                      return (
                        <label key={region} className={checkboxRowClass}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) =>
                              update(
                                'requiredRegions',
                                next
                                  ? [...input.requiredRegions, region]
                                  : input.requiredRegions.filter((item) => item !== region)
                              )
                            }
                          />
                          <span>{region}</span>
                        </label>
                      );
                    })}
                  </div>

                  {!isSimple ? (
                    <div className="rounded-3xl border border-white/[0.08] bg-[#151a29] px-4 py-4">
                      <div className="mb-3 text-sm font-semibold text-white">Advanced inputs</div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {showUserInputs ? (
                          <div className="space-y-2">
                            <Label htmlFor="prisma-concurrent-users" className="text-slate-200">
                              Concurrent users
                            </Label>
                            <Input
                              className={fieldClass}
                              id="prisma-concurrent-users"
                              type="number"
                              min={0}
                              value={input.concurrentUsers}
                              onChange={(event) => update('concurrentUsers', Number(event.target.value) || 0)}
                            />
                          </div>
                        ) : null}
                        {showNetworkInputs ? (
                          <div className="space-y-2">
                            <Label htmlFor="prisma-average-bandwidth" className="text-slate-200">
                              Avg bandwidth / site (Mbps)
                            </Label>
                            <Input
                              className={fieldClass}
                              id="prisma-average-bandwidth"
                              type="number"
                              min={0}
                              value={input.averageBandwidthPerSiteMbps}
                              onChange={(event) =>
                                update('averageBandwidthPerSiteMbps', Number(event.target.value) || 0)
                              }
                            />
                          </div>
                        ) : null}
                        {showZtnaInputs ? (
                          <div className="space-y-2">
                            <Label htmlFor="prisma-ztna-connectors" className="text-slate-200">
                              ZTNA connectors
                            </Label>
                            <Input
                              className={fieldClass}
                              id="prisma-ztna-connectors"
                              type="number"
                              min={0}
                              value={input.ztnaConnectors}
                              onChange={(event) => update('ztnaConnectors', Number(event.target.value) || 0)}
                            />
                          </div>
                        ) : null}
                        {showServiceInputs ? (
                          <div className="space-y-2">
                            <Label htmlFor="prisma-cloud-service-connections" className="text-slate-200">
                              Cloud service connections
                            </Label>
                            <Input
                              className={fieldClass}
                              id="prisma-cloud-service-connections"
                              type="number"
                              min={0}
                              value={input.cloudServiceConnections}
                              onChange={(event) =>
                                update('cloudServiceConnections', Number(event.target.value) || 0)
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className={checkboxRowClass}>
                      <Checkbox
                        checked={input.ademEnabled}
                        onCheckedChange={(checked) => updateToggle('ademEnabled', Boolean(checked))}
                      />
                      <span>ADEM / telemetry</span>
                    </label>
                    <label className={checkboxRowClass}>
                      <Checkbox
                        checked={input.cleanPipeEnabled}
                        onCheckedChange={(checked) => updateToggle('cleanPipeEnabled', Boolean(checked))}
                      />
                      <span>Clean pipe</span>
                    </label>
                    <label className={checkboxRowClass}>
                      <Checkbox
                        checked={input.localBreakoutEnabled}
                        onCheckedChange={(checked) => updateToggle('localBreakoutEnabled', Boolean(checked))}
                      />
                      <span>Local breakout</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4 xl:self-start" aria-label="Calculator results">
              {!recommendation ? (
                <Card className={surfaceCardClass}>
                  <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
                    <p className="text-lg font-semibold text-white">Enter your inputs to generate a recommendation</p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                      The summary stays visible while you edit, so you can compare outcomes quickly.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="hidden print:block">
                    <div className="space-y-8 rounded-none border-0 bg-white text-slate-900 shadow-none">
                      <div className="border-b border-slate-200 pb-6">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C89B00]">
                          Prisma Access Architectural Estimate
                        </div>
                        <h2 className="mt-3 text-3xl font-bold text-slate-950">Prisma Access Sizing Report</h2>
                        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                          {recommendation.summary} This report is optimized for workshops, proposal notes, and internal planning reviews.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold text-slate-950">Recommendation overview</h3>
                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                              <tbody>
                                {printReportRows.map((row) => (
                                  <tr key={row.label} className="border-b border-slate-200 last:border-b-0">
                                    <td className="w-[42%] bg-slate-50 px-4 py-3 font-medium text-slate-600">
                                      {row.label}
                                    </td>
                                    <td className="px-4 py-3 text-slate-900">{row.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold text-slate-950">Input assumptions</h3>
                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                              <tbody>
                                {printInputRows.map((row) => (
                                  <tr key={row.label} className="border-b border-slate-200 last:border-b-0">
                                    <td className="w-[42%] bg-slate-50 px-4 py-3 font-medium text-slate-600">
                                      {row.label}
                                    </td>
                                    <td className="px-4 py-3 text-slate-900">{row.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6">
                        <div className="rounded-2xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold text-slate-950">Architecture table</h3>
                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold">Component</th>
                                  <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                                  <th className="px-4 py-3 text-left font-semibold">Capacity</th>
                                  <th className="px-4 py-3 text-left font-semibold">Region</th>
                                </tr>
                              </thead>
                              <tbody>
                                {recommendation.architectureRows.map((row) => (
                                  <tr key={row.component} className="border-t border-slate-200 align-top">
                                    <td className="px-4 py-3 font-medium text-slate-900">{row.component}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.quantity}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.capacity}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.region}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold text-slate-950">Scale graph</h3>
                          <p className="mt-2 text-sm text-slate-600">
                            Relative scale across the main planning dimensions in this estimate.
                          </p>
                          <div className="mt-5">
                            <PrintMetricChart items={chartItems} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold text-slate-950">Recommendations and advisories</h3>
                          <div className="mt-4 space-y-3">
                            <ul className="space-y-2 text-sm leading-6 text-slate-700">
                              <li>{recommendation.remoteNetworkRecommendation}</li>
                              <li>{recommendation.mobileUserRecommendation}</li>
                              <li>{recommendation.ztnaRecommendation}</li>
                              <li>{recommendation.serviceConnectionGuidance}</li>
                              <li>{recommendation.loggingRecommendation}</li>
                            </ul>
                            <ul className="space-y-2 text-sm leading-6 text-slate-700">
                              {recommendation.advisoryNotes.map((note) => (
                                <li key={note.title}>
                                  <span className="font-semibold text-slate-900">{note.title}:</span> {note.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold text-slate-950">Assumptions and disclaimer</h3>
                          <div className="mt-4 space-y-3">
                            {recommendation.assumptions.map((item) => (
                              <div
                                key={item}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                              >
                                {item}
                              </div>
                            ))}
                            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700">
                              <div className="mb-2 font-semibold text-slate-900">Workshop-ready summary</div>
                              <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
                                {formatPrismaSizingSummary(input, recommendation)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card
                    className={`overflow-hidden rounded-[2rem] border border-[#FFC300]/20 bg-[radial-gradient(circle_at_top,_rgba(255,195,0,0.14),_transparent_38%),linear-gradient(180deg,_rgba(18,20,32,0.98),_rgba(10,12,20,0.98))] text-white shadow-[0_24px_80px_rgba(0,0,0,0.4)] transition-all duration-300 print:hidden ${
                      resultPulse ? 'scale-[1.01] shadow-[0_28px_90px_rgba(255,195,0,0.16)]' : ''
                    }`}
                  >
                    <CardHeader className="space-y-4 pb-4">
                      <div>
                        <div className="text-sm font-medium text-[#FFC300]">Recommend Purchase</div>
                        <CardTitle className="mt-2 text-2xl !text-white">Prisma Access Estimate</CardTitle>
                        <p className="mt-3 text-sm leading-6 text-white/90">
                          Clear estimate for storage, branch bandwidth, and deployment scale.
                        </p>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/80">
                          Total Strata Logging Service
                        </div>
                        <div className="mt-3 text-4xl font-bold text-white">
                          {getKpiValue('Recommended purchase')}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-white/85">
                          Modeled demand: {getKpiValue('Estimated logging storage')}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex min-h-[188px] flex-col rounded-3xl border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="text-xs uppercase tracking-[0.18em] text-white/80">
                            Per-Branch SPN Bandwidth
                          </div>
                          <div className="mt-3 text-3xl font-bold text-white">
                            {getKpiValue('Per-branch bandwidth')}
                          </div>
                          <div className="mt-3 text-sm leading-6 text-white/85">
                            Estimated remote network bandwidth required for each branch.
                          </div>
                        </div>
                        <div className="flex min-h-[188px] flex-col rounded-3xl border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="text-xs uppercase tracking-[0.18em] text-white/80">
                            Recommended Tier
                          </div>
                          <div className="mt-3 text-3xl font-bold text-white">
                            {recommendation.recommendedTier}
                          </div>
                          <div className="mt-3 break-words text-sm leading-6 text-white/85">
                            {recommendation.recommendedHaModel}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/80">Deployment focus</span>
                          <span className="text-right font-semibold text-white">
                            {deploymentLabels[input.deploymentType]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/80">Recommended regions</span>
                          <span className="text-right font-semibold text-white">
                            {recommendation.recommendedRegions.join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/80">NGFW storage</span>
                          <span className="font-semibold text-white">
                            {recommendation.normalized.estimatedNgfwStorageGb > 0
                              ? `${(recommendation.normalized.estimatedNgfwStorageGb / 1000).toFixed(2)} TB`
                              : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/80">Prisma Access storage</span>
                          <span className="font-semibold text-white">
                            {`${(
                              (recommendation.normalized.estimatedMobileUserStorageGb +
                                recommendation.normalized.estimatedRemoteNetworkStorageGb) /
                              1000
                            ).toFixed(2)} TB`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/80">Estimated throughput</span>
                          <span className="font-semibold text-white">
                            {getKpiValue('Estimated throughput')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/80">Estimated remote networks</span>
                          <span className="font-semibold text-white">
                            {getKpiValue('Estimated remote networks')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/80">Estimated mobile users</span>
                          <span className="font-semibold text-white">
                            {getKpiValue('Estimated mobile users')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={copySummary} className="rounded-full bg-[#FFC300] text-black hover:bg-[#FFD54D]">
                          Copy summary
                        </Button>
                        <Button
                          variant="outline"
                          onClick={exportJson}
                          className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export JSON
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.print()}
                          className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#111522] px-4 py-4 text-sm leading-6 text-slate-400 print:hidden">
                    Architectural estimate only. Heuristic assumptions are editable and intended for planning use, not official licensing or final sizing.
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

