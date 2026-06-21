'use client';

import type { MigrationOptions, ManagementIpMode, TargetVendor } from '@/lib/unified-migrator/types';

interface Props {
  options: MigrationOptions;
  onChange: (o: MigrationOptions) => void;
  targetVendor: TargetVendor | 'scm';
  fileName: string;
  onRun: () => void;
  onCancel: () => void;
}

export default function MigrationOptionsPanel({ options, onChange, targetVendor, fileName, onRun, onCancel }: Props) {
  const set = (patch: Partial<MigrationOptions>) => onChange({ ...options, ...patch });
  const isPanos = targetVendor === 'pan-os';

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-white font-semibold">Migration options</h3>
          <p className="text-white/40 text-xs mt-0.5">
            Review before running · <span className="font-mono text-white/60">{fileName}</span> →{' '}
            <span className="text-white/70">{isPanos ? 'PAN-OS' : 'Strata Cloud Manager'}</span>
          </p>
        </div>
      </div>

      {/* Duplicate cleanup */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={options.cleanupDuplicates}
          onChange={(e) => set({ cleanupDuplicates: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500 cursor-pointer"
        />
        <span>
          <span className="text-white/90 text-sm font-medium group-hover:text-white">Clean up duplicates</span>
          <span className="block text-white/40 text-xs mt-0.5">
            Merge objects with identical definitions and drop redundant rules. A report lists everything changed.
          </span>
        </span>
      </label>

      {/* Management IP — PAN-OS target only */}
      {isPanos ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <p className="text-amber-300 text-sm font-semibold mb-1">Management IP</p>
          <p className="text-white/45 text-xs mb-3">
            After you commit to the target firewall, an unreachable mgmt IP means you lose remote access. Choose how to handle it.
          </p>
          <div className="space-y-2">
            {([
              ['keep', 'Keep the source management IP'],
              ['assign', 'Assign a new management IP'],
              ['manual', "I'll change it myself before commit (acknowledge risk)"],
            ] as [ManagementIpMode, string][]).map(([mode, label]) => (
              <label key={mode} className="flex items-center gap-2.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="mgmtMode"
                  checked={options.managementIp.mode === mode}
                  onChange={() => set({ managementIp: { ...options.managementIp, mode } })}
                  className="h-3.5 w-3.5 accent-amber-500 cursor-pointer"
                />
                <span className="text-white/80">{label}</span>
              </label>
            ))}
          </div>
          {options.managementIp.mode === 'assign' && (
            <input
              type="text"
              placeholder="e.g. 10.0.0.5/24"
              value={options.managementIp.newIp || ''}
              onChange={(e) => set({ managementIp: { ...options.managementIp, newIp: e.target.value } })}
              className="mt-3 w-full max-w-xs bg-white/[0.05] border border-white/[0.12] rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-white/60 text-xs">
            <span className="text-white/80 font-medium">Management IP:</span> not applicable — Strata Cloud Manager is
            cloud-managed (no firewall management IP to lock yourself out of). Clientless VPN maps to Prisma Access
            Mobile Users; interface IPs are carried as informational notes.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onRun}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors cursor-pointer"
        >
          Run Migration
        </button>
        <button
          onClick={onCancel}
          className="text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
