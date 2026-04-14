'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { runMigration } from '@/lib/unified-migrator/runtime';
import type {
  MigrationRunResult,
  SourceVendor,
  TargetVendor,
} from '@/lib/unified-migrator/types';
import { saveProjectLocally, appendAuditLog, isDesktopMode, listProjectsLocally, loadProjectLocally, exportAuditEvidence } from '@/lib/unified-migrator/desktop-storage';
import AuditLogModal from '@/components/tools/AuditLogModal';

type AppRole = 'admin' | 'standard';

interface ProjectListItem {
  id: string;
  name: string;
  vendor: string;
  createdAt: string;
}

type AppState = 'idle' | 'loading' | 'done' | 'error';

export default function MigratorClient() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<MigrationRunResult | null>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [sourceVendor, setSourceVendor] = useState<SourceVendor | 'auto'>('auto');
  const [targetVendor, setTargetVendor] = useState<TargetVendor>('pan-os');
  const [role, setRole] = useState<AppRole>('admin');
  const [recentProjects, setRecentProjects] = useState<ProjectListItem[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent projects in desktop mode
  const refreshProjects = useCallback(async () => {
    if (isDesktopMode()) {
      const projects = await listProjectsLocally();
      // Sort by newest
      setRecentProjects(projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    }
  }, []);

  useState(() => {
    refreshProjects();
  });

  const loadProject = useCallback(async (id: string) => {
    setState('loading');
    try {
      const project = await loadProjectLocally(id);
      if (project && project.result) {
        setResult(project.result);
        setFileName(project.name);
        setSourceVendor(project.vendor as any);
        setState('done');
      } else {
        setError('Project could not be loaded');
        setState('error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load project: ${message}`);
      setState('error');
    }
  }, []);

  const onFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setState('loading');
      setError('');
      setResult(null);

      try {
        const content = await file.text();
        if (!content || content.trim().length === 0) {
          throw new Error('File is empty or unreadable');
        }
        const migrationResult = runMigration(
          {
            fileName: file.name,
            content,
            selectedVendor: sourceVendor === 'auto' ? undefined : sourceVendor,
            targetVendor,
          },
          targetVendor
        );

        // Save project and log securely in local mode
        const projectData = {
          id: `proj_${Date.now()}`,
          name: file.name,
          vendor: migrationResult.parseResult.detectedVendor,
          createdAt: new Date().toISOString(),
          result: migrationResult
        };
        saveProjectLocally(projectData).catch(console.error);
        
        appendAuditLog('MIGRATION_RUN', {
          fileName: file.name,
          detectedVendor: migrationResult.parseResult.detectedVendor,
          targetVendor,
          automatedRate: migrationResult.validationReport.overallAutomatedRate
        }, role).catch(console.error);

        setResult(migrationResult);
        setState('done');
        refreshProjects();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Migration failed');
        setState('error');
      }
    },
    [sourceVendor, targetVendor, role, refreshProjects]
  );

  const downloadArtifact = useCallback(
    (id: string) => {
      if (!result) return;
      const artifact = result.artifacts.find((a) => a.id === id);
      if (!artifact) return;
      const blob = new Blob([artifact.content], { type: artifact.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.fileName;
      a.click();
      URL.revokeObjectURL(url);
    },
    [result]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar for Desktop Mode */}
        {isDesktopMode() && (
          <div className="lg:w-64 flex-shrink-0 space-y-4">
            <h3 className="text-white/40 text-xs uppercase tracking-wider font-semibold px-2">Recent Projects</h3>
            <div className="space-y-2">
              {recentProjects.length === 0 ? (
                <p className="text-white/20 text-xs px-2 italic">No local projects found</p>
              ) : (
                recentProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadProject(p.id)}
                    className="w-full text-left p-3 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] transition-colors group"
                  >
                    <p className="text-white/80 text-sm font-medium truncate group-hover:text-blue-400">
                      {p.name}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-white/30 uppercase">{p.vendor}</span>
                      <span className="text-[10px] text-white/20">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <div className="pt-4 border-t border-white/[0.04]">
              <Link 
                href="/tools/download" 
                className="block text-xs text-blue-400/60 hover:text-blue-400 px-2 transition-colors"
                id="sidebar-version-tag"
              >
                UnifiedMigrator Desktop v1.0.0
              </Link>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-8">
          {/* Role Enforcement Tooling */}
          <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">Local Security Context</h3>
                <p className="text-white/40 text-xs">{isDesktopMode() ? 'Offline Desktop Mode (Encrypted)' : 'Hosted Web Mode'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs text-white/50">Simulate Role:</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as AppRole)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-white text-xs focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="admin" className="bg-[#020914] text-white">Full Admin</option>
                <option value="standard" className="bg-[#020914] text-white">Standard User</option>
              </select>
              {role === 'admin' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAuditModalOpen(true)}
                className="px-3 py-1.5 border border-blue-500/30 text-blue-300 text-xs font-medium rounded-md hover:bg-blue-500/10 transition-colors"
                id="view-audit-btn"
              >
                View Audit Chain
              </button>
              <button 
                onClick={async () => {
                  const success = await exportAuditEvidence();
                  if (success) alert('Audit Evidence exported successfully as signed JSON.');
                }}
                className="px-3 py-1.5 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-md hover:bg-amber-500/10 transition-colors"
                id="export-audit-btn"
              >
                Export Evidence Package
              </button>
            </div>
          )}
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap gap-4 items-end">
            {/* Source Vendor */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Source Vendor</label>
              <select
                id="source-vendor-select"
                value={sourceVendor}
                onChange={(e) => setSourceVendor(e.target.value as SourceVendor | 'auto')}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="auto" className="bg-[#020914] text-white">Auto-detect</option>
                <option value="cisco-asa" className="bg-[#020914] text-white">Cisco ASA</option>
                <option value="fortigate" className="bg-[#020914] text-white">FortiGate</option>
                <option value="checkpoint" className="bg-[#020914] text-white">Check Point</option>
                <option value="pan-os" className="bg-[#020914] text-white">PAN-OS</option>
              </select>
            </div>

            {/* Target Vendor */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Target Vendor</label>
              <select
                id="target-vendor-select"
                value={targetVendor}
                onChange={(e) => setTargetVendor(e.target.value as TargetVendor)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="pan-os" className="bg-[#020914] text-white">Palo Alto PAN-OS</option>
              </select>
            </div>

            {/* Upload Button */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Config File</label>
              <button
                id="upload-config-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {fileName || 'Upload Config'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.conf,.cfg,.xml,.json"
                className="hidden"
                onChange={onFileSelect}
              />
            </div>
          </div>

          {/* Desktop Download CTA */}
          <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
            <span className="text-white/60 text-sm flex-1">
              Need offline or air-gapped migration?
            </span>
            <Link
              href="/tools/download"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors whitespace-nowrap"
              id="download-desktop-btn"
            >
              Download Desktop Version →
            </Link>
          </div>

          {/* Loading State */}
          {state === 'loading' && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-sm">Running migration…</p>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {state === 'done' && result && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <SummaryCard
                  label="Detected Vendor"
                  value={result.parseResult.detectedVendor}
                  color="blue"
                />
                <SummaryCard
                  label="Detected Version"
                  value={result.parseResult.detectedVersion}
                  color="blue"
                />
                <SummaryCard
                  label="Automated Rate"
                  value={`${result.validationReport.overallAutomatedRate}%`}
                  color={result.validationReport.overallAutomatedRate >= 80 ? 'emerald' : 'amber'}
                />
                <SummaryCard
                  label="Syntax Valid"
                  value={result.validationReport.syntaxValid ? 'Yes' : 'No'}
                  color={result.validationReport.syntaxValid ? 'emerald' : 'red'}
                />
              </div>

              {/* Classification Summary */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-white font-semibold mb-4">Conversion Classification</h3>
                <div className="grid sm:grid-cols-4 gap-4">
                  <ClassCard label="Exact" count={result.validationReport.classificationSummary.exact} color="emerald" />
                  <ClassCard label="Partial" count={result.validationReport.classificationSummary.partial} color="amber" />
                  <ClassCard label="Manual Review" count={result.validationReport.classificationSummary.manualReview} color="orange" />
                  <ClassCard label="Unsupported" count={result.validationReport.classificationSummary.unsupported} color="red" />
                </div>
              </div>

              {/* Confidence Summary */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-white font-semibold mb-4">Confidence Breakdown</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <ClassCard label="High Confidence" count={result.validationReport.confidence.high} color="emerald" />
                  <ClassCard label="Medium Confidence" count={result.validationReport.confidence.medium} color="amber" />
                  <ClassCard label="Low Confidence" count={result.validationReport.confidence.low} color="red" />
                </div>
              </div>

              {/* Entity Coverage Table */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-white font-semibold mb-4">Entity Coverage</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-xs uppercase tracking-wider">
                      <th className="text-left pb-3">Category</th>
                      <th className="text-right pb-3">Parsed</th>
                      <th className="text-right pb-3">Total</th>
                      <th className="text-right pb-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/70">
                    {result.validationReport.summary
                      .filter((row) => row.total > 0)
                      .map((row) => (
                        <tr key={row.label} className="border-t border-white/[0.04]">
                          <td className="py-2 capitalize">{row.label}</td>
                          <td className="py-2 text-right">{row.parsed}</td>
                          <td className="py-2 text-right">{row.total}</td>
                          <td className="py-2 text-right">
                            <span
                              className={
                                row.automatedRate >= 80
                                  ? 'text-emerald-400'
                                  : row.automatedRate >= 50
                                    ? 'text-amber-400'
                                    : 'text-red-400'
                              }
                            >
                              {row.automatedRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Semantic Findings */}
              {result.validationReport.semanticFindings.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
                  <h3 className="text-amber-300 font-semibold mb-3">Semantic Findings</h3>
                  <ul className="space-y-2 text-sm">
                    {result.validationReport.semanticFindings.map((finding, i) => (
                      <li key={i} className="text-white/60">
                        <span className="font-medium text-amber-300">{finding.sourceEntity}:</span>{' '}
                        {finding.detail}
                        <span className="text-white/30 block text-xs mt-0.5">→ {finding.recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lint Findings */}
              {result.parseResult.lintFindings.length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h3 className="text-white font-semibold mb-3">Pre-Parse Lint Findings</h3>
                  <ul className="space-y-1.5 text-sm">
                    {result.parseResult.lintFindings.map((finding, i) => (
                      <li key={i} className="text-white/50">
                        <span className={`inline-block w-16 text-xs font-mono ${finding.level === 'error' ? 'text-red-400' : finding.level === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
                          [{finding.level}]
                        </span>
                        {finding.line && <span className="text-white/30 mr-2">L{finding.line}</span>}
                        {finding.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unrecognized Lines */}
              {result.parseResult.unrecognizedLines.length > 0 && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
                  <h3 className="text-orange-300 font-semibold mb-3">
                    Unrecognized Lines ({result.parseResult.unrecognizedLines.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-xs font-mono text-white/40">
                    {result.parseResult.unrecognizedLines.slice(0, 20).map((ul) => (
                      <div key={ul.line}>
                        <span className="text-orange-400/60 inline-block w-12">L{ul.line}</span>
                        {ul.content.slice(0, 100)}
                      </div>
                    ))}
                    {result.parseResult.unrecognizedLines.length > 20 && (
                      <div className="text-orange-400/40">… and {result.parseResult.unrecognizedLines.length - 20} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Download Buttons */}
              <div className="flex flex-wrap gap-3">
                {result.artifacts.map((artifact) => (
                  <button
                    key={artifact.id}
                    id={`download-${artifact.id}-btn`}
                    onClick={() => downloadArtifact(artifact.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-white/80 text-sm rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {artifact.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {state === 'idle' && (
            <div
              className="rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center cursor-pointer hover:border-white/[0.16] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-white/40 text-sm mb-1">
                Drop a firewall config file here, or click to browse
              </p>
              <p className="text-white/20 text-xs">
                Supports Cisco ASA, FortiGate, Check Point, and PAN-OS formats
              </p>
            </div>
          )}
        </div>
      </div>

      <AuditLogModal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)} 
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
  };
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-semibold ${colorMap[color] || 'text-white'}`}>{value}</p>
    </div>
  );
}

function ClassCard({ label, count, color }: { label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 border-emerald-500/20',
    amber: 'text-amber-400 border-amber-500/20',
    orange: 'text-orange-400 border-orange-500/20',
    red: 'text-red-400 border-red-500/20',
  };
  return (
    <div className={`rounded-lg border bg-white/[0.01] p-4 text-center ${colorMap[color] || 'text-white border-white/[0.06]'}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs mt-1 opacity-60">{label}</p>
    </div>
  );
}
