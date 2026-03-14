import { Metadata } from 'next';
import { Section, SectionHeader } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import { Shield, Network, Cloud, Lock, TriangleAlert as AlertTriangle, Users, ArrowRight, CircleCheck as CheckCircle2, Layers, GraduationCap, Workflow } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Services | The Cyber Adviser',
  description:
    'Comprehensive cybersecurity advisory services including Zero Trust strategy, SASE implementation, cloud security, and executive advisory.',
};

const services = [
  {
    icon: Shield,
    title: 'Zero Trust Strategy & Architecture',
    description:
      'Comprehensive Zero Trust framework design that transforms security from perimeter-based to identity-centric. From maturity assessment to implementation roadmap, I guide enterprises through every stage of Zero Trust adoption.',
    outcomes: [
      'Zero Trust maturity assessment and gap analysis',
      'Architecture design and implementation roadmap',
      'Identity and access management strategy',
      'Micro-segmentation planning and execution',
      'Continuous verification framework design',
    ],
  },
  {
    icon: Network,
    title: 'SASE & Prisma Access Advisory',
    description:
      'Strategic guidance for Secure Access Service Edge transformation, with deep expertise in Palo Alto Networks Prisma Access. From initial architecture to operational optimization, I ensure SASE deployments deliver on their transformational promise.',
    outcomes: [
      'SASE readiness assessment and vendor selection',
      'Prisma Access architecture and deployment',
      'Split tunneling and routing optimization',
      'GlobalProtect and mobile security strategy',
      'Operational runbook and escalation design',
    ],
  },
  {
    icon: Cloud,
    title: 'Cloud Security Architecture',
    description:
      'Multi-cloud security posture management and workload protection strategies that enable secure cloud adoption. I help enterprises build security into cloud foundations rather than bolting it on after deployment.',
    outcomes: [
      'Cloud security posture assessment',
      'Multi-cloud security architecture',
      'Workload protection strategy',
      'Container and Kubernetes security',
      'Infrastructure as Code security integration',
    ],
  },
  {
    icon: Lock,
    title: 'Network Security Modernization',
    description:
      'Legacy network security transformation that maintains business continuity while enabling modern capabilities. From firewall consolidation to micro-segmentation, I guide enterprises through infrastructure modernization.',
    outcomes: [
      'Network security assessment and roadmap',
      'Firewall architecture and policy optimization',
      'VPN to ZTNA migration planning',
      'Hybrid connectivity security design',
      'East-west traffic security strategy',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Incident Readiness & Response',
    description:
      'Security operations assessment and incident response planning that minimizes business impact when incidents occur. I help organizations build resilient operations that can detect, respond, and recover effectively.',
    outcomes: [
      'Security operations maturity assessment',
      'Incident response plan development',
      'Playbook design and tabletop exercises',
      'Detection engineering strategy',
      'Business continuity integration',
    ],
  },
  {
    icon: Users,
    title: 'Executive Security Advisory',
    description:
      'Board-level security strategy and risk communication that aligns security investments with business objectives. I help executive teams understand cyber risk and make informed decisions about security priorities.',
    outcomes: [
      'Board-level risk communication',
      'Security investment prioritization',
      'Compliance and governance strategy',
      'Executive briefings and education',
      'Strategic roadmap development',
    ],
  },
  {
    icon: Layers,
    title: 'Security Architecture Consulting',
    description:
      'Practical enterprise security architecture advisory focused on designing, reviewing, and optimizing security architectures that work reliably in production environments. This includes secure access design, Zero Trust planning, platform transitions, and post-implementation optimization.',
    outcomes: [
      'Prisma SASE architecture',
      'SD-WAN and Prisma Access design',
      'Legacy VPN / MPLS migration planning',
      'Post-deployment optimization',
      'Zero Trust design',
      'ZTNA implementation strategy',
      'Identity-based access control',
      'Microsegmentation planning',
      'Platform transitions',
      'Vendor migration and consolidation',
      'Infrastructure integration including Ubiquiti / Fortinet where applicable',
      'Capability assessments and target-state design',
      'Post-implementation performance tuning and scaling',
      'Policy rationalization',
      'Operational runbook development',
    ],
  },
  {
    icon: GraduationCap,
    title: 'Enterprise Technical Training',
    description:
      'Official instruction plus hands-on enterprise training for teams that need operational competence, not theory-only sessions. Focus on real-world administration, deployment, tuning, and certification-oriented preparation across major security platforms.',
    outcomes: [
      'Palo Alto Networks training',
      'Prisma SASE (SD-WAN and Access)',
      'Strata Firewalls (PCNSA / PCNSE prep)',
      'Cortex XDR and XSOAR fundamentals and use cases',
      'Panorama operations and policy workflows',
      'Check Point SmartConsole administration',
      'Firewall policy and NAT design',
      'VPN configuration and troubleshooting',
      'Threat prevention tuning',
      'Fortinet / FortiGate configuration and hardening',
      'FortiAnalyzer / FortiManager operations',
      'Security Fabric fundamentals',
      'Corporate on-site training where feasible',
      'Remote instructor-led sessions',
      'Custom curriculum development',
      'Certification preparation tracks',
    ],
  },
  {
    icon: Workflow,
    title: 'SOC Automation & Orchestration',
    description:
      'Security operations automation services focused on reducing MTTR and increasing SOC efficiency through intelligent automation workflows, phishing automation, XDR / SIEM integrations, and incident response orchestration.',
    outcomes: [
      'Cortex XSOAR playbook design and implementation',
      'API integrations with 3rd-party tools',
      'Workflow logic optimization',
      'Phishing automation',
      'Email triage and classification',
      'Automated artifact extraction',
      'Response orchestration and notifications',
      'XDR / SIEM integration',
      'Multi-source log ingestion',
      'Correlation rule design support',
      'Alert enrichment automation',
      'Incident response automation',
      'End-to-end IR orchestration',
      'Automated evidence collection',
      'Containment workflows and guardrails',
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <Section className="pt-28 pb-14">
        <SectionHeader
          eyebrow="Services"
          title="Strategic Security Expertise"
          description="Comprehensive advisory services spanning architecture, transformation, and executive alignment for enterprises navigating complex security challenges."
        />
      </Section>

      <Section className="pt-0">
        <div className="space-y-5">
          {services.map((service) => (
            <div
              key={service.title}
              className="group relative rounded-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-2xl border border-white/[0.04] group-hover:border-white/[0.08] transition-colors duration-500" />

              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              </div>

              <div className="relative p-7 md:p-10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                  <div>
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-6">
                      <service.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-5">
                      {service.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed text-lg">
                      {service.description}
                    </p>
                    <div className="mt-8">
                      <CTAButton href="/contact" variant="ghost" showArrow>
                        Discuss This Service
                      </CTAButton>
                    </div>
                  </div>

                  <div className="lg:pt-4">
                    <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-[0.15em] mb-5">
                      Key Outcomes
                    </h4>
                    <ul className="space-y-4">
                      {service.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                          <span className="text-slate-300">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-obsidian-900/20 to-transparent" />

        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeader
              eyebrow="Engagement Model"
              title="How We Work Together"
              align="left"
            />
            <div className="mt-8 space-y-5 text-lg text-slate-400 leading-relaxed">
              <p>
                Every engagement begins with understanding your organization&apos;s
                unique context, challenges, and objectives. From there, I develop
                tailored strategies that balance security imperatives with
                operational realities.
              </p>
              <p>
                Whether you need a focused assessment, strategic roadmap, or
                ongoing advisory relationship, I adapt my approach to deliver
                measurable outcomes within your constraints.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { step: 1, title: 'Discovery', desc: 'Understand your environment, constraints, and transformation objectives.' },
              { step: 2, title: 'Strategy', desc: 'Develop actionable recommendations aligned with business objectives.' },
              { step: 3, title: 'Execution', desc: 'Guide implementation with hands-on expertise and stakeholder alignment.' },
            ].map((item, index) => (
              <div key={item.step}>
                <div className="p-6 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-semibold">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-white text-lg">{item.title}</h4>
                  </div>
                  <p className="text-slate-400 pl-14">
                    {item.desc}
                  </p>
                </div>
                {index < 2 && (
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-radial from-amber-500/[0.06] via-transparent to-transparent opacity-60" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-amber-500 text-sm font-semibold uppercase tracking-[0.2em] mb-5">
            Get Started
          </p>
          <h2 className="text-white">Ready to Transform Your Security Posture?</h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 leading-relaxed">
            Schedule a consultation to discuss your security challenges and explore
            how strategic advisory can accelerate your transformation.
          </p>
          <div className="mt-10">
            <CTAButton href="/contact" variant="primary" size="lg">
              Schedule Consultation
            </CTAButton>
          </div>
        </div>
      </Section>
    </>
  );
}
