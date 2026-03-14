import { Section } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import { Shield, Network, Cloud, Users, Workflow, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    icon: Shield,
    title: 'Zero Trust',
    subtitle: 'Architecture',
    description:
      'Comprehensive Zero Trust architecture design and implementation roadmaps tailored to enterprise environments.',
    href: '/services',
  },
  {
    icon: Network,
    title: 'SASE',
    subtitle: 'Transformation',
    description:
      'Strategic guidance on Secure Access Service Edge adoption, including Prisma Access deployment and optimization.',
    href: '/services',
  },
  {
    icon: Cloud,
    title: 'Cloud',
    subtitle: 'Security',
    description:
      'Multi-cloud security posture management, workload protection, and cloud-native security architecture.',
    href: '/services',
  },
  {
    icon: Users,
    title: 'Executive',
    subtitle: 'Advisory',
    description:
      'Board-level security strategy, risk communication, and alignment of security investments with business objectives.',
    href: '/services',
  },
  {
    icon: Workflow,
    title: 'Security Automation',
    subtitle: 'Cortex XSOAR & XSIAM',
    description:
      'Security orchestration, automation, and response (SOAR) implementation with Cortex XSOAR and extended security intelligence with XSIAM.',
    href: '/services',
  },
];

export function ServicesGrid() {
  return (
    <Section className="relative">
      <div className="absolute inset-0 bg-obsidian-950" />

      <div className="relative">
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-amber-500 to-amber-500/0" />
            <span className="text-amber-500 text-sm font-semibold uppercase tracking-[0.2em]">
              Services
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Strategic Security
            <br />
            <span className="text-slate-400">Expertise</span>
          </h2>

          <p className="text-xl text-slate-400 leading-relaxed">
            Comprehensive advisory services spanning architecture, transformation,
            and executive alignment for enterprises navigating complex security challenges.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {services.map((service, index) => (
            <Link
              key={service.title}
              href={service.href}
              className="group relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-2xl border border-white/[0.04] group-hover:border-white/[0.08] transition-colors duration-500" />
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              </div>

              <div className="relative p-8 md:p-10 flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/15 transition-colors duration-300">
                    <service.icon className="w-7 h-7 text-amber-500" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-amber-500 transition-colors duration-300">
                        {service.title}
                      </h3>
                      <div className="text-sm text-slate-500 mt-1">{service.subtitle}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                  </div>
                  <p className="mt-3 text-slate-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <CTAButton href="/services" variant="secondary" showArrow>
            Explore All Services
          </CTAButton>
        </div>
      </div>
    </Section>
  );
}
