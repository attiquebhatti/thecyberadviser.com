'use client';

import { useMemo, useState } from 'react';
import { Section, SectionHeader } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import {
  Globe,
  Network,
  Radar,
  Workflow,
  Search,
  Shield,
  Building2,
  Server,
  Lock,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

const filterOptions = [
  'All',
  'Prisma Access',
  'Prisma SD-WAN',
  'Cortex XDR',
  'Cortex XSOAR',
  'Cortex XSIAM',
  'Palo Alto NGFW',
  'FortiGate',
  'Check Point',
] as const;

type FilterOption = (typeof filterOptions)[number];

const projects = [
  {
    icon: Globe,
    category: 'Prisma Access',
    title: 'Global Prisma Access Rollout for Distributed Workforce',
    summary:
      'Designed and delivered a Prisma Access deployment for a geographically distributed enterprise, replacing fragmented remote-access controls with a unified cloud-delivered security model.',
    scope: [
      'Prisma Access design and rollout',
      'Remote user access policy design',
      'GlobalProtect integration',
      'Split tunneling and routing optimization',
    ],
  },
  {
    icon: Globe,
    category: 'Prisma Access',
    title: 'Legacy VPN to Prisma Access Migration',
    summary:
      'Led a phased migration from legacy VPN infrastructure to Prisma Access, improving scalability, user experience, and policy consistency across remote and branch users.',
    scope: [
      'Migration planning and transition sequencing',
      'Policy translation and standardization',
      'User cutover strategy',
      'Operational handover and documentation',
    ],
  },
  {
    icon: Network,
    category: 'Prisma SD-WAN',
    title: 'Multi-Branch Prisma SD-WAN Transformation',
    summary:
      'Implemented Prisma SD-WAN across branch locations to modernize connectivity, improve application performance, and simplify branch security operations.',
    scope: [
      'Branch connectivity architecture',
      'Application-aware traffic steering',
      'Link failover and resiliency design',
      'Branch operational standardization',
    ],
  },
  {
    icon: Network,
    category: 'Prisma SD-WAN',
    title: 'MPLS to Prisma SD-WAN Modernization Program',
    summary:
      'Re-architected branch connectivity from traditional MPLS dependency to a more agile Prisma SD-WAN model aligned with cloud-first enterprise requirements.',
    scope: [
      'WAN modernization roadmap',
      'Hybrid transport onboarding',
      'Traffic segmentation strategy',
      'Performance and resiliency tuning',
    ],
  },
  {
    icon: Workflow,
    category: 'Cortex XSOAR',
    title: 'Phishing Response Automation with Cortex XSOAR',
    summary:
      'Built automated phishing investigation and response workflows using Cortex XSOAR to reduce repetitive analyst effort and speed incident handling.',
    scope: [
      'Phishing playbook design',
      'Mailbox and threat intel integrations',
      'Automated artifact extraction',
      'SOC workflow optimization',
    ],
  },
  {
    icon: Workflow,
    category: 'Cortex XSOAR',
    title: 'Incident Orchestration Across Multi-Vendor Security Stack',
    summary:
      'Integrated Cortex XSOAR with firewalls, EDR, email security, and ticketing platforms to orchestrate consistent response actions across multiple tools.',
    scope: [
      'API integrations',
      'Response orchestration workflows',
      'Automated notifications and case handling',
      'Escalation and approval logic',
    ],
  },
  {
    icon: Radar,
    category: 'Cortex XDR',
    title: 'Cortex XDR Deployment for Endpoint Threat Detection',
    summary:
      'Implemented Cortex XDR to improve endpoint visibility, strengthen threat detection coverage, and streamline analyst investigation workflows.',
    scope: [
      'Agent deployment strategy',
      'Detection policy tuning',
      'Alert triage workflow design',
      'Operational onboarding for SOC teams',
    ],
  },
  {
    icon: Search,
    category: 'Cortex XSIAM',
    title: 'Cortex XSIAM Readiness and Security Operations Transformation',
    summary:
      'Supported a SOC transformation initiative around Cortex XSIAM, focusing on data onboarding, detection maturity, and automation-driven operating model improvements.',
    scope: [
      'XSIAM onboarding strategy',
      'Use case alignment',
      'Detection and correlation planning',
      'SOC operating model refinement',
    ],
  },
  {
    icon: Search,
    category: 'Cortex XSIAM',
    title: 'Detection Engineering and Log Use Case Rationalization',
    summary:
      'Mapped log sources and detection priorities into a more focused XSIAM-aligned use case framework to improve signal quality and analyst efficiency.',
    scope: [
      'Log source prioritization',
      'Use case rationalization',
      'Alert enrichment planning',
      'Investigation workflow improvements',
    ],
  },
  {
    icon: Shield,
    category: 'Palo Alto NGFW',
    title: 'Enterprise NGFW Segmentation with Palo Alto Networks',
    summary:
      'Delivered a next-generation firewall implementation program centered on policy modernization, segmentation, and improved visibility for business-critical environments.',
    scope: [
      'NGFW design and deployment',
      'Segmentation and security zoning',
      'Policy optimization',
      'Threat prevention enablement',
    ],
  },
  {
    icon: Shield,
    category: 'Palo Alto NGFW',
    title: 'Panorama-Led Firewall Standardization Program',
    summary:
      'Standardized multi-site Palo Alto firewall operations using Panorama for centralized policy management, governance, and lifecycle administration.',
    scope: [
      'Panorama architecture',
      'Template and device group strategy',
      'Policy governance model',
      'Operational runbook development',
    ],
  },
  {
    icon: Building2,
    category: 'FortiGate',
    title: 'FortiGate Branch Security Refresh',
    summary:
      'Implemented FortiGate-based branch security modernization to strengthen perimeter protection, improve consistency, and simplify distributed operations.',
    scope: [
      'FortiGate deployment planning',
      'Policy and NAT review',
      'VPN and branch security design',
      'Operational hardening',
    ],
  },
  {
    icon: Server,
    category: 'FortiGate',
    title: 'Fortinet Security Fabric and Management Integration',
    summary:
      'Improved operational visibility and manageability by aligning FortiGate deployments with centralized logging, management, and security fabric capabilities.',
    scope: [
      'FortiManager integration',
      'FortiAnalyzer onboarding',
      'Policy governance alignment',
      'Security operations visibility improvement',
    ],
  },
  {
    icon: Lock,
    category: 'Check Point',
    title: 'Check Point Firewall Estate Optimization',
    summary:
      'Reviewed and optimized an existing Check Point firewall environment to improve rule quality, administrative consistency, and operational resilience.',
    scope: [
      'Policy cleanup and optimization',
      'Rulebase governance',
      'NAT and access review',
      'Operations improvement recommendations',
    ],
  },
  {
    icon: Briefcase,
    category: 'Check Point',
    title: 'Check Point to Modernized Security Architecture Transition Support',
    summary:
      'Supported a transition program involving Check Point infrastructure, helping define migration priorities, coexistence patterns, and modernization pathways.',
    scope: [
      'Transition planning',
      'Coexistence architecture',
      'Risk-controlled migration sequencing',
      'Documentation and stakeholder alignment',
    ],
  },
];

const highlights = [
  'Prisma Access and cloud-delivered security programs',
  'Prisma SD-WAN branch and WAN transformation',
  'Cortex XDR, XSOAR, and XSIAM operations maturity',
  'Palo Alto Networks NGFW implementation and optimization',
  'FortiGate and Check Point enterprise security delivery',
];

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return projects;
    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter]);

  return (
    <>
      <Section className="pt-24 pb-8 md:pt-28 md:pb-10 lg:pt-32 lg:pb-12">
        <SectionHeader
          eyebrow="Portfolio"
          title="Selected Security Transformation Projects"
          description="A focused portfolio of implementation and advisory engagements across Prisma Access, Prisma SD-WAN, Cortex operations platforms, and enterprise firewall modernization."
          className="max-w-4xl"
        />

        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {highlights.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{item}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'border-amber-400/40 bg-amber-500/10 text-amber-400'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.14] hover:text-white',
                ].join(' ')}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </Section>

      <Section className="pt-0 pb-12 md:pb-14 lg:pb-16">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            Showing{' '}
            <span className="font-semibold text-white">
              {filteredProjects.length}
            </span>{' '}
            project{filteredProjects.length === 1 ? '' : 's'}
            {activeFilter !== 'All' && (
              <>
                {' '}
                in <span className="font-semibold text-amber-400">{activeFilter}</span>
              </>
            )}
          </p>

          {activeFilter !== 'All' && (
            <button
              type="button"
              onClick={() => setActiveFilter('All')}
              className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          {filteredProjects.map((project, index) => (
            <div
              key={project.title}
              className="group relative rounded-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-2xl border border-white/[0.04] transition-colors duration-500 group-hover:border-white/[0.08]" />
              <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              </div>

              <div className="relative p-6 md:p-7 lg:p-8">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">
                      Project {String(index + 1).padStart(2, '0')} // {project.category}
                    </p>
                    <h3 className="text-2xl font-semibold text-white">
                      {project.title}
                    </h3>
                  </div>

                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <project.icon className="h-6 w-6" />
                  </div>
                </div>

                <p className="text-base leading-relaxed text-slate-400 md:text-lg">
                  {project.summary}
                </p>

                <div className="mt-6">
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-500">
                    Project Scope
                  </h4>

                  <ul className="space-y-3">
                    {project.scope.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-6 py-10 text-center">
            <p className="text-slate-300">
              No projects found for this category yet.
            </p>
          </div>
        )}
      </Section>

      <Section className="relative py-14 md:py-16 lg:py-[4.5rem]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-obsidian-900/20 to-transparent" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
            Let&apos;s Talk
          </p>

          <h2 className="text-white">Need a Similar Security Transformation?</h2>

          <p className="mt-5 text-lg leading-relaxed text-slate-400 md:text-xl">
            Whether you are planning a Prisma Access deployment, a Cortex-driven
            SOC modernization, or a firewall refresh across Palo Alto Networks,
            FortiGate, or Check Point, I can help shape the strategy and execution.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CTAButton href="/contact" variant="primary" size="lg">
              Schedule Consultation
            </CTAButton>
            <CTAButton href="/services" variant="ghost" showArrow>
              Explore Services
            </CTAButton>
          </div>
        </div>
      </Section>
    </>
  );
}
