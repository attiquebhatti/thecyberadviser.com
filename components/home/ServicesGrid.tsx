import Image from 'next/image';
import { Section } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import { Shield, Network, Cloud, Users, Workflow, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { VendorIcon } from '@/components/shared/VendorLogos';

const services = [
  {
    icon: Shield,
    title: 'Zero Trust',
    subtitle: 'Architecture',
    description:
      'Comprehensive Zero Trust architecture design and implementation roadmaps tailored to enterprise environments.',
    href: '/services',
    vendors: ['Palo Alto Networks', 'Zscaler']
  },
  {
    icon: Network,
    title: 'SASE',
    subtitle: 'Transformation',
    description:
      'Strategic guidance on Secure Access Service Edge adoption, including Prisma Access and Netskope deployment.',
    href: '/services',
    vendors: ['Palo Alto Networks', 'Netskope']
  },
  {
    icon: Cloud,
    title: 'Cloud',
    subtitle: 'Security',
    description:
      'Multi-cloud security posture management, workload protection, and cloud-native security architecture.',
    href: '/services',
    vendors: ['Microsoft Azure', 'Amazon Web Services', 'Google Cloud']
  },
  {
    icon: Users,
    title: 'Executive',
    subtitle: 'Advisory',
    description:
      'Board-level security strategy, risk communication, and alignment of security investments with business objectives.',
    href: '/services',
    vendors: ['Check Point', 'CrowdStrike']
  },
  {
    icon: Workflow,
    title: 'Security Automation',
    subtitle: 'Cortex XSOAR & XSIAM',
    description:
      'Security orchestration, automation, and response (SOAR) implementation with Cortex XSOAR and XSIAM.',
    href: '/services',
    vendors: ['Palo Alto Networks', 'Fortigate']
  },
];

export function ServicesGrid() {
  return (
    <Section className="relative">
      <div className="absolute inset-0 bg-obsidian-950" />

      <div className="relative">
        <div className="mb-20 grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 max-w-3xl">
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

          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem]">
                  <Image
                    src="/images/slides/slide-3.png"
                    alt="SASE architecture design"
                    fill
                    className="object-cover object-center"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem]">
                    <Image
                      src="/images/slides/slide-4.png"
                      alt="Cortex XDR visibility"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-[#FFC300]/15 bg-[#FFC300]/[0.04] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFC300]">
                    Delivery Lens
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Architecture guidance backed by platform-level operational context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {services.map((service, index) => (
            <Link
              key={service.title}
              href={service.href}
              className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-[#FFC300]/10"
            >
              <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-[#FFC300]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 border border-white/[0.04] group-hover:border-[#FFC300]/30 transition-colors duration-500" />
              
              {/* interactive top highlight */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 rounded-t-2xl"></div>

              <div className="relative p-8 md:p-10 flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-[#FFC300]/10 flex items-center justify-center group-hover:bg-[#FFC300]/20 transition-colors duration-300">
                    <service.icon className="w-7 h-7 text-[#FFC300]" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-[#FFC300] transition-colors duration-300">
                        {service.title}
                      </h3>
                      <div className="text-sm text-slate-500 mt-1">{service.subtitle}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-[#FFC300] group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                  </div>
                  <p className="mt-3 text-slate-400 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Vendor Logos */}
                  <div className="mt-6 flex items-center gap-4 border-t border-white/5 pt-6">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Powered By</span>
                    <div className="flex items-center gap-3">
                      {service.vendors.map((vendor) => (
                        <div key={vendor} className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" title={vendor}>
                          <VendorIcon name={vendor} className="w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
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
