import { Metadata } from 'next';
import { Section, SectionHeader } from '@/components/layout/Section';
import Link from 'next/link';
import DownloadButton from '@/components/tools/DownloadButton';

export const metadata: Metadata = {
  title: 'Download UnifiedMigrator Desktop | The Cyber Adviser',
  description:
    'Download the UnifiedMigrator desktop application for offline, air-gapped firewall configuration migration. Supports Windows with macOS and Linux coming soon.',
};

export default function DownloadPage() {
  return (
    <>
      <Section className="pt-24 pb-4 md:pt-28 md:pb-6 lg:pt-32 lg:pb-8">
        <SectionHeader
          eyebrow="Desktop Application"
          title="UnifiedMigrator for Desktop"
          description="Run firewall migrations locally on your machine — fully offline, fully secure."
          className="max-w-4xl"
        />
      </Section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Hero CTA */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 md:p-12 mb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-emerald-500/5" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Download for Windows
              </h2>
              <p className="text-white/60 mb-6 max-w-lg">
                Install UnifiedMigrator on your Windows machine.
                Upload firewall configs, run migrations, and download results —
                all without an internet connection.
              </p>
              <div className="flex flex-wrap gap-4">
                <DownloadButton
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors duration-200"
                  id="download-windows-btn"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download for Windows (.exe)
                </DownloadButton>
                <span className="inline-flex items-center gap-2 px-6 py-3 border border-white/[0.12] text-white/40 rounded-lg cursor-not-allowed">
                  macOS — Coming Soon
                </span>
              </div>
              <p className="text-xs text-white/30 mt-4">
                Version 1.0.0 · Requires Windows 10 or later · 64-bit
              </p>
            </div>

            <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/[0.08] flex items-center justify-center">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
              </svg>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.12] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center mb-4 text-blue-400">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Supported Platforms */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 mb-12">
          <h3 className="text-lg font-semibold text-white mb-6">Platform Support</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <PlatformCard name="Windows" status="available" detail="Windows 10/11, 64-bit" />
            <PlatformCard name="macOS" status="planned" detail="macOS 12+ (Apple Silicon & Intel)" />
            <PlatformCard name="Linux" status="planned" detail="Ubuntu 20.04+, AppImage" />
          </div>
        </div>

        {/* How It Works */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 mb-12">
          <h3 className="text-lg font-semibold text-white mb-6">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {index + 1}
                </div>
                <h4 className="text-white font-medium mb-1">{step.title}</h4>
                <p className="text-white/40 text-sm">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 mb-12">
          <h3 className="text-lg font-semibold text-white mb-4">Security & Compliance</h3>
          <ul className="grid md:grid-cols-2 gap-3 text-sm text-white/50">
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              AES-256-GCM encrypted project storage
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              SHA-256 tamper-evident audit log
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              Auto-scrubbing of passwords and PSKs
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              Context isolation &amp; sandboxed renderer
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              Secure temp file wiping on exit
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              Role-based access control (RBAC)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              No data leaves your machine
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              Exportable compliance evidence packages
            </li>
          </ul>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/tools"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            ← Back to UnifiedMigrator Web
          </Link>
        </div>
      </section>
    </>
  );
}

// ── Data ────────────────────────────────────────────────────────

function PlatformCard({ name, status, detail }: { name: string; status: 'available' | 'planned'; detail: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-white/[0.06]">
      <div className={`w-3 h-3 rounded-full ${status === 'available' ? 'bg-emerald-400' : 'bg-white/20'}`} />
      <div>
        <p className="text-white font-medium">{name}</p>
        <p className="text-white/40 text-xs">{detail}</p>
        <p className={`text-xs mt-1 ${status === 'available' ? 'text-emerald-400' : 'text-white/30'}`}>
          {status === 'available' ? 'Available Now' : 'Coming Soon'}
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: 'Fully Offline',
    description: 'Run migrations in air-gapped environments. No internet connection required after installation.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>,
  },
  {
    title: 'Local-First Security',
    description: 'Config files never leave your machine. All processing happens locally with AES-256 encryption at rest.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  },
  {
    title: 'Multi-Vendor Migration',
    description: 'Convert between Cisco ASA, FortiGate, Check Point, and Palo Alto PAN-OS configurations.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
  },
  {
    title: 'Tamper-Evident Audit',
    description: 'Every action is logged in a SHA-256 hash chain. Export compliance evidence packages for review.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  },
  {
    title: 'Confidence Scoring',
    description: 'Per-entity conversion confidence with exact, partial, manual review, and unsupported classifications.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>,
  },
  {
    title: 'Instant Downloads',
    description: 'Download migrated configs, rollback bundles, and validation reports with a single click.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  },
];

const STEPS = [
  { title: 'Install', detail: 'Download and run the installer' },
  { title: 'Upload', detail: 'Select your firewall config file' },
  { title: 'Convert', detail: 'Choose source & target vendor, run migration' },
  { title: 'Download', detail: 'Get your migrated config and reports' },
];
