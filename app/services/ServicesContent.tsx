'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import {
  Shield,
  Network,
  Cloud,
  Lock,
  TriangleAlert as AlertTriangle,
  Users,
  ArrowRight,
  CircleCheck as CheckCircle2,
  Layers,
  GraduationCap,
  Workflow,
} from 'lucide-react';

const services = [
  {
    icon: Network,
    title: 'SASE & Prisma Access Consultation',
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
];

export function ServicesContent() {
  return (
    <>
      <Section className="pt-24 pb-8 md:pt-28 md:pb-10 lg:pt-32 lg:pb-12">
        <SectionHeader
          eyebrow="Services"
          title="Strategic Security Expertise"
          description="Comprehensive advisory services spanning architecture, transformation, and executive alignment for enterprises navigating complex security challenges."
          className="max-w-4xl"
        />
      </Section>

      <Section className="pt-0 pb-12 md:pb-14 lg:pb-16">
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-4 md:space-y-5"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group relative rounded-2xl transition-all duration-500 hover:shadow-[#FFC300]/5 overflow-hidden border border-white/[0.08] bg-obsidian-900/40 backdrop-blur-xl hover:border-[#FFC300]/40 shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 rounded-t-2xl"></div>

              <div className="relative p-6 md:p-8 lg:p-10">
                <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
                  <div>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFC300]/10 text-[#FFC300] md:h-14 md:w-14">
                      <service.icon className="h-6 w-6 md:h-7 md:w-7" />
                    </div>

                    <h3 className="mb-4 text-2xl font-semibold text-white">
                      {service.title}
                    </h3>

                    <p className="text-base leading-relaxed text-slate-400 md:text-lg">
                      {service.description}
                    </p>

                    <div className="mt-6">
                      <CTAButton href="/contact" variant="ghost" showArrow>
                        Discuss This Service
                      </CTAButton>
                    </div>
                  </div>

                  <div className="lg:pt-2">
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#FFC300]">
                      Key Outcomes
                    </h4>

                    <ul className="space-y-3">
                      {service.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#FFC300]/10">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#FFC300]" />
                          </div>
                          <span className="text-slate-300">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section className="relative py-12 md:py-14 lg:py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-obsidian-900/20 to-transparent" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeader
              eyebrow="Engagement Model"
              title="How We Work Together"
              align="left"
            />

            <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-400 md:text-lg">
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

          <div className="space-y-3">
            {[
              {
                step: 1,
                title: 'Discovery',
                desc: 'Understand your environment, constraints, and transformation objectives.',
              },
              {
                step: 2,
                title: 'Strategy',
                desc: 'Develop actionable recommendations aligned with business objectives.',
              },
              {
                step: 3,
                title: 'Execution',
                desc: 'Guide implementation with hands-on expertise and stakeholder alignment.',
              },
            ].map((item, index) => (
              <div key={item.step}>
                <div className="rounded-xl border border-white/[0.08] bg-obsidian-900/40 backdrop-blur-xl p-5 md:p-6 shadow-xl transition-all duration-500 hover:border-[#FFC300]/30">
                  <div className="mb-3 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFC300]/10 font-semibold text-[#FFC300]">
                      {item.step}
                    </div>
                    <h4 className="text-lg font-semibold text-white">
                      {item.title}
                    </h4>
                  </div>
                  <p className="pl-14 text-slate-400">{item.desc}</p>
                </div>

                {index < 2 && (
                  <div className="flex items-center justify-center py-1.5">
                    <ArrowRight className="h-5 w-5 rotate-90 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="relative overflow-hidden py-14 md:py-16 lg:py-18">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-[#FFC300]/[0.06] via-transparent to-transparent opacity-60" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#FFC300]">
            Get Started
          </p>

          <h2 className="text-white">Ready to Transform Your Security Posture?</h2>

          <p className="mt-5 text-lg leading-relaxed text-slate-400 md:text-xl">
            Schedule a consultation to discuss your security challenges and explore
            how strategic advisory can accelerate your transformation.
          </p>

          <div className="mt-8">
            <CTAButton href="/contact" variant="primary" size="lg">
              Schedule Consultation
            </CTAButton>
          </div>
        </div>
      </Section>
    </>
  );
}
