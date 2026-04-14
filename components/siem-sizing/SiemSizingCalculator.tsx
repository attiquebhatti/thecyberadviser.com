'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  ChartColumn,
  Cpu,
  Database,
  HardDrive,
  LayoutDashboard,
  Network,
  RadioTower,
  Server,
  Shield,
  Users,
  Workflow,
} from 'lucide-react';
import {
  DEFAULT_COMPRESSION_RATIO,
  DEFAULT_RETENTION_DAYS,
  SIEM_PLATFORM_CONFIG,
  SIEM_PLATFORM_ORDER,
} from '@/config/siem-sizing-platforms';
import { calculateSiemSizing } from '@/lib/siem-sizing/engine';
import type { InfrastructureRow, SiemPlatformKey, SiemSizingInput, SiemSizingMode } from '@/types/siem-sizing';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const DEFAULT_INPUT: SiemSizingInput = {
  mode: 'simple',
  platform: 'wazuh',
  employees: 250,
  networkEquipment: 10,
  endpoints: 250,
  servers: 20,
  networkSources: 10,
  cloudSources: 5,
  retentionDays: DEFAULT_RETENTION_DAYS,
  compressionRatio: DEFAULT_COMPRESSION_RATIO,
  highAvailability: false,
};

const PLATFORM_ICONS: Record<SiemPlatformKey, typeof Shield> = {
  wazuh: Shield,
  splunk: ChartColumn,
  qradar: Database,
  sentinel: Workflow,
  logrhythm: RadioTower,
  graylog: HardDrive,
  cortexxsoar: Cpu,
};

function roundCapacityLabel(valueGb: number) {
  if (valueGb >= 1024) {
    return `${(valueGb / 1024).toFixed(1)} TB`;
  }

  return `${valueGb.toFixed(1)} GB`;
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function Field({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium text-slate-200">{label}</Label>
      <p className="text-sm leading-6 text-slate-400">{helper}</p>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(numberValue(event.target.value))}
        className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white"
      />
    </div>
  );
}

function PlatformCard({
  platformKey,
  active,
  onSelect,
}: {
  platformKey: SiemPlatformKey;
  active: boolean;
  onSelect: (key: SiemPlatformKey) => void;
}) {
  const platform = SIEM_PLATFORM_CONFIG[platformKey];
  const Icon = PLATFORM_ICONS[platformKey];

  return (
    <button
      type="button"
      onClick={() => onSelect(platformKey)}
      className={cn(
        'rounded-[1.35rem] border p-4 text-left transition-all duration-300',
        active
          ? 'border-[#6BD348]/60 bg-[#6BD348]/10 shadow-[0_12px_30px_rgba(107,211,72,0.08)]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-obsidian-950/60 text-[#6BD348]">
          <Icon className="h-5 w-5" />
        </div>
        <Badge
          variant="outline"
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em]',
            active ? 'border-[#6BD348]/40 text-[#6BD348]' : 'border-white/10 text-slate-500'
          )}
        >
          {platform.shortLabel}
        </Badge>
      </div>
      <div className="mt-5">
        <p className="text-base font-semibold text-white">{platform.label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{platform.summary}</p>
      </div>
    </button>
  );
}

function NodeBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Server;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <Icon className="mx-auto h-5 w-5 text-[#6BD348]" />
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#6BD348]/80">{label}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-obsidian-950/60 text-[#6BD348]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-200/80">{label}</p>
          <p className="mt-1 text-xl font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TableCapacityCell({ row, field }: { row: InfrastructureRow; field: 'ramGb' | 'diskGb' }) {
  return <>{roundCapacityLabel(row[field])}</>;
}

export default function SiemSizingCalculator() {
  const [input, setInput] = useState<SiemSizingInput>(DEFAULT_INPUT);

  const result = useMemo(() => calculateSiemSizing(input), [input]);

  const setMode = (mode: SiemSizingMode) => setInput((current) => ({ ...current, mode }));
  const setPlatform = (platform: SiemPlatformKey) => setInput((current) => ({ ...current, platform }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px] xl:grid-cols-[minmax(0,1.15fr)_430px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="card-premium overflow-hidden rounded-[2rem] border border-white/10">
          <CardHeader className="space-y-6 p-7 md:p-8">
            <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-[#6BD348] px-3 py-1 text-black hover:bg-[#6BD348]">Free Tool</Badge>
              <Badge variant="outline" className="rounded-full border-white/15 px-3 py-1 text-slate-200">
                Beta
              </Badge>
            </div>

            <div className="space-y-3">
              <CardTitle className="text-3xl text-white md:text-4xl">SIEM Sizing Calculator</CardTitle>
              <p className="max-w-3xl text-base leading-7 text-slate-400">
                Estimate the storage, compute, and cost requirements for your SIEM or SOAR deployment.
                Designed for SOC architects and security engineers.
              </p>
            </div>

            <Tabs value={input.mode} onValueChange={(value) => setMode(value as SiemSizingMode)} className="w-full">
              <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                <TabsTrigger value="simple" className="rounded-xl data-[state=active]:bg-[#6BD348] data-[state=active]:text-black">
                  Simple
                </TabsTrigger>
                <TabsTrigger value="advanced" className="rounded-xl data-[state=active]:bg-[#6BD348] data-[state=active]:text-black">
                  Advanced
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-8 p-7 pt-0 md:p-8 md:pt-0">
            <section className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Platform</h3>
                <p className="text-sm leading-6 text-slate-400">
                  Choose the SIEM or SOAR platform profile to apply the right ingestion and agent coefficients.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {SIEM_PLATFORM_ORDER.map((platformKey) => (
                  <PlatformCard
                    key={platformKey}
                    platformKey={platformKey}
                    active={input.platform === platformKey}
                    onSelect={setPlatform}
                  />
                ))}
              </div>
            </section>

            {input.mode === 'simple' ? (
              <section className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Number of employees"
                  helper="Total employees in scope for endpoint and user-centric telemetry assumptions."
                  value={input.employees}
                  onChange={(value) => setInput((current) => ({ ...current, employees: value }))}
                />
                <Field
                  label="Network equipment"
                  helper="Firewalls, switches, routers, proxies, access points, and similar network sources."
                  value={input.networkEquipment}
                  onChange={(value) => setInput((current) => ({ ...current, networkEquipment: value }))}
                />
              </section>
            ) : (
              <section className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Endpoints"
                  helper="Workstations, laptops, or endpoint agents contributing telemetry."
                  value={input.endpoints}
                  onChange={(value) => setInput((current) => ({ ...current, endpoints: value }))}
                />
                <Field
                  label="Servers"
                  helper="Windows, Linux, and infrastructure servers sending host or application logs."
                  value={input.servers}
                  onChange={(value) => setInput((current) => ({ ...current, servers: value }))}
                />
                <Field
                  label="Network sources"
                  helper="Routers, firewalls, IDS/IPS, VPN, and other network telemetry sources."
                  value={input.networkSources}
                  onChange={(value) => setInput((current) => ({ ...current, networkSources: value }))}
                />
                <Field
                  label="Cloud / SaaS sources"
                  helper="Cloud-native services, SaaS apps, identity logs, and API-driven log feeds."
                  value={input.cloudSources}
                  onChange={(value) => setInput((current) => ({ ...current, cloudSources: value }))}
                />
                <Field
                  label="Retention days"
                  helper="Number of days of searchable data to keep before aging or archiving."
                  value={input.retentionDays}
                  onChange={(value) => setInput((current) => ({ ...current, retentionDays: value || DEFAULT_RETENTION_DAYS }))}
                />
                <Field
                  label="Compression ratio"
                  helper="Effective compression ratio for indexed or stored data. Default baseline is 7."
                  value={input.compressionRatio}
                  onChange={(value) => setInput((current) => ({ ...current, compressionRatio: value || DEFAULT_COMPRESSION_RATIO }))}
                />

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <p className="text-base font-semibold text-white">High availability</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Force distributed architecture even for smaller workloads that need node separation and resilience.
                      </p>
                    </div>
                    <Switch
                      checked={input.highAvailability}
                      onCheckedChange={(checked) => setInput((current) => ({ ...current, highAvailability: checked }))}
                    />
                  </div>
                </div>
              </section>
            )}

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
              Transparent sizing assumptions are stored in reusable platform config and a pure calculation engine,
              so you can tune formulas later without rewriting the UI.
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="space-y-6 lg:sticky lg:top-28">
          <Card className="overflow-hidden rounded-[2rem] border border-[#6BD348]/20 bg-[radial-gradient(circle_at_top,_rgba(107,211,72,0.14),_transparent_38%),linear-gradient(180deg,_rgba(18,20,32,0.98),_rgba(10,12,20,0.98))] text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
            <CardHeader className="space-y-3 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-[#6BD348]">
                <BadgeCheck className="h-4 w-4" />
                Recommended Architecture
              </div>
              <CardTitle className="text-3xl text-white">{result.architecture.type}</CardTitle>
              <p className="text-sm leading-6 text-slate-300">{result.architecture.explanation}</p>
            </CardHeader>
            <CardContent className="space-y-5 p-7 pt-0">
              <div className="grid grid-cols-2 gap-3">
                {result.architecture.allInOneNodes > 0 ? (
                  <NodeBadge icon={Server} label="All-in-one node" value={result.architecture.allInOneNodes} />
                ) : (
                  <>
                    <NodeBadge icon={Server} label="Master node" value={result.architecture.masterNodes} />
                    <NodeBadge icon={HardDrive} label="Indexer nodes" value={result.architecture.indexerNodes} />
                    <NodeBadge icon={LayoutDashboard} label="Dashboard nodes" value={result.architecture.dashboardNodes} />
                    <NodeBadge icon={RadioTower} label="Worker nodes" value={result.architecture.workerNodes} />
                  </>
                )}
              </div>

              <div className="grid gap-3">
                <StatCard icon={Users} label="Estimated agents" value={String(result.estimatedAgents)} />
                <StatCard icon={Database} label="Estimated daily volume" value={roundCapacityLabel(result.estimatedDailyVolumeGb)} />
                <StatCard
                  icon={Shield}
                  label={`Estimated storage (${result.retentionDays} days)`}
                  value={roundCapacityLabel(result.estimatedStorageGb)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium rounded-[2rem] border border-white/10">
            <CardHeader className="p-7 pb-4">
              <CardTitle className="text-2xl text-white">Infrastructure Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-7 pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-400">Component</TableHead>
                      <TableHead className="text-slate-400">Qty</TableHead>
                      <TableHead className="text-slate-400">vCPU</TableHead>
                      <TableHead className="text-slate-400">RAM</TableHead>
                      <TableHead className="text-slate-400">Disk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.architecture.rows.map((row) => (
                      <TableRow key={row.component} className="border-white/10 hover:bg-white/[0.02]">
                        <TableCell className="font-medium text-white">{row.component}</TableCell>
                        <TableCell className="text-slate-300">{row.qty}</TableCell>
                        <TableCell className="text-slate-300">{row.vcpu}</TableCell>
                        <TableCell className="text-slate-300">
                          <TableCapacityCell row={row} field="ramGb" />
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <TableCapacityCell row={row} field="diskGb" />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                      <TableCell className="font-semibold text-white">Total</TableCell>
                      <TableCell className="font-semibold text-white">{result.totals.qty}</TableCell>
                      <TableCell className="font-semibold text-white">{result.totals.vcpu}</TableCell>
                      <TableCell className="font-semibold text-white">{roundCapacityLabel(result.totals.ramGb)}</TableCell>
                      <TableCell className="font-semibold text-white">{roundCapacityLabel(result.totals.diskGb)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
                Need more precision? Switch to Advanced mode for per-source configuration and retention tuning.
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-obsidian-950/60 text-[#6BD348]">
                    <Network className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">How sizing is calculated</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Daily volume is modeled from source counts and platform coefficients. Storage is estimated as
                      daily ingest multiplied by retention and divided by the compression ratio.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

