import { Metadata } from 'next';
import { Section, SectionHeader } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import { ProfileImage } from '@/components/about/ProfileImage';
import { Shield, Target, Briefcase, Award, CircleCheck as CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | The Cyber Adviser',
  description:
    'Strategic cybersecurity advisor specializing in Zero Trust architecture, SASE transformation, and enterprise security leadership.',
};

const paloAltoNetworksSolutions = {
  'Strata Firewalls': [
    'Strata NGFW',
    'Advanced Threat Prevention',
    'Advanced URL Filtering',
    'DNS Security',
    'WildFire',
    'Panorama',
    'SD-WAN on Strata',
    'App-ID / User-ID / Device-ID policy design',
  ],
  'Prisma SASE': [
    'Prisma Access',
    'Prisma Browser',
    'Prisma SD-WAN',
  ],
  'Cloud & SOC Platform': [
    'Cortex XDR',
    'Cortex XSOAR',
    'Cortex XSIAM',
    'Prisma Cloud',
  ],
};

const otherSecuritySolutions = [
  'Check Point',
  'Fortinet / FortiGate',
  'Cisco',
  'HP / HPE',
  'Other enterprise security and networking technologies',
];

const principles = [
  {
    icon: Target,
    title: 'Strategic Alignment',
    description:
      'Security investments must align with business objectives. Every recommendation is grounded in measurable outcomes and organizational context.',
  },
  {
    icon: Shield,
    title: 'Zero Trust Foundation',
    description:
      'Trust nothing, verify everything. Modern security architectures require continuous verification of identity, device, and context.',
  },
  {
    icon: Briefcase,
    title: 'Pragmatic Implementation',
    description:
      'Theory without execution delivers nothing. Strategies are designed for real-world constraints, timelines, and organizational capabilities.',
  },
  {
    icon: Award,
    title: 'Continuous Improvement',
    description:
      'Security posture is never static. Frameworks are built for adaptation, measurement, and iterative enhancement.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Section className="pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-[0.2em] mb-5">
              About
            </p>
            <h1 className="text-balance">
              Strategic Cybersecurity Advisory for{' '}
              <span className="text-amber-500">Enterprise Transformation</span>
            </h1>
            <div className="mt-6 space-y-4 text-lg text-slate-400 leading-relaxed">
              <p>
                With over fifteen years of experience architecting security
                solutions for global enterprises, I bring a unique perspective
                that bridges technical depth with executive strategy.
              </p>
              <p>
                My practice focuses on helping organizations navigate the
                complexities of modern security transformation. From Zero Trust
                architecture design to SASE implementation, I guide enterprises
                through the strategic and technical decisions that define their
                security posture.
              </p>
              <p>
                I have led security initiatives across Fortune 500 organizations,
                advising boards and executive teams on risk management,
                compliance frameworks, and security investment priorities.
              </p>
            </div>
          </div>

          <ProfileImage />
        </div>
      </Section>

      <Section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-obsidian-900/20 to-transparent" />

        <div className="relative">
          <SectionHeader
            eyebrow="Expertise"
            title="Core Competencies"
            description="Deep expertise across the full spectrum of enterprise security, with primary specialization in Palo Alto Networks solutions."
          />

          <div className="mt-12 space-y-10">
            <div>
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Palo Alto Networks Solutions
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Primary area of specialization with deep expertise across the complete platform portfolio
                </p>
              </div>

              <div className="space-y-8">
                {Object.entries(paloAltoNetworksSolutions).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-lg font-semibold text-amber-500 mb-4 tracking-wide">
                      {category}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {items.map((item) => (
                        <div
                          key={item}
                          className="group flex items-center gap-3 p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-amber-500/20 hover:bg-white/[0.03] transition-all duration-300"
                        >
                          <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/15 transition-colors duration-300">
                            <CheckCircle2 className="w-4 h-4 text-amber-500" />
                          </div>
                          <span className="text-slate-300 font-medium text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/[0.06]">
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">
                  Other Security Solutions
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Additional expertise across leading enterprise security and networking platforms
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherSecuritySolutions.map((item) => (
                  <div
                    key={item}
                    className="group flex items-center gap-3 p-4 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.02] transition-all duration-300"
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-slate-400 font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Philosophy"
          title="Guiding Principles"
          description="The foundational beliefs that shape every engagement and recommendation."
        />

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {principles.map((principle) => (
            <div
              key={principle.title}
              className="group relative rounded-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-2xl border border-white/[0.04] group-hover:border-white/[0.08] transition-colors duration-500" />

              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              </div>

              <div className="relative p-8 md:p-10">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-6">
                  <principle.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {principle.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {principle.description}
                </p>
              </div>
            </div>
          ))}
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
          <h2 className="text-white">Ready to Discuss Your Security Challenges?</h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 leading-relaxed">
            Schedule a confidential consultation to explore how strategic
            security advisory can support your organization&apos;s transformation
            objectives.
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
