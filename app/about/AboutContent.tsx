'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import { AccentTerms } from '@/components/shared/AccentTerms';
import { ProfileImage } from '@/components/about/ProfileImage';
import { Shield, Target, Briefcase, Award, CircleCheck as CheckCircle2 } from 'lucide-react';

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

export function AboutContent() {
  return (
    <>
      <Section className="pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-[#FFC300] text-sm font-semibold uppercase tracking-[0.2em] mb-5">
              About
            </p>
            <h1 className="text-balance">
              Strategic Cybersecurity Advisory for{' '}
              <span className="text-[#FFC300]">Enterprise Transformation</span>
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

              <div className="space-y-12">
                {Object.entries(paloAltoNetworksSolutions).map(([category, items]) => (
                  <div key={category}>
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1
                          }
                        }
                      }}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: "-50px" }}
                      className="grid md:grid-cols-2 gap-4"
                    >
                      {items.map((item) => (
                        <motion.div
                          key={item}
                          variants={{
                            hidden: { opacity: 0, scale: 0.95 },
                            show: { opacity: 1, scale: 1 }
                          }}
                          whileHover={{ scale: 1.02 }}
                          className="group relative rounded-2xl border border-white/[0.08] bg-obsidian-900/40 backdrop-blur-xl transition-all duration-500 hover:border-[#FFC300]/40 overflow-hidden shadow-2xl"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-[#FFC300]/10 group-hover:bg-[#FFC300] transition-colors duration-500" />
                          
                          <div className="flex items-center gap-4 p-5">
                            <div className="w-10 h-10 rounded-xl bg-[#FFC300]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FFC300]/20 transition-all duration-300">
                              <CheckCircle2 className="w-4 h-4 text-[#FFC300]" />
                            </div>
                            <span className="text-slate-200 font-semibold text-sm tracking-wide"><AccentTerms text={item} /></span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-12 border-t border-white/[0.06]">
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                  Other Security Solutions
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Additional expertise across leading enterprise security and networking platforms
                </p>
              </div>

              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {otherSecuritySolutions.map((item) => (
                  <motion.div
                    key={item}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative rounded-2xl border border-white/[0.08] bg-obsidian-900/40 backdrop-blur-xl transition-all duration-500 hover:border-[#FFC300]/40 overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/[0.05] group-hover:bg-[#FFC300] transition-colors duration-500" />
                    <div className="flex items-center gap-4 p-5">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FFC300]/20 transition-all duration-300">
                        <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-[#FFC300]" />
                      </div>
                      <span className="text-slate-300 font-semibold text-sm tracking-wide group-hover:text-white transition-colors">{item}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
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
          className="mt-12 grid md:grid-cols-2 gap-5"
        >
          {principles.map((principle) => (
            <motion.div
              key={principle.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5 }}
              className="group relative rounded-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-[#FFC300]/5 overflow-hidden border border-white/[0.04] hover:border-[#FFC300]/30"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 rounded-t-2xl"></div>

              <div className="relative p-8 md:p-10">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#FFC300]/10 text-[#FFC300] mb-6 transition-colors group-hover:bg-[#FFC300]/20">
                  <principle.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 transition-colors group-hover:text-[#FFC300]">
                  {principle.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {principle.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-radial from-[#FFC300]/[0.06] via-transparent to-transparent opacity-60" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[#FFC300] text-sm font-semibold uppercase tracking-[0.2em] mb-5">
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
