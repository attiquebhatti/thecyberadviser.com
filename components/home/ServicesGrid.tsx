'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Section } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';
import { Shield, Network, Cloud, Users, Workflow } from 'lucide-react';
import Link from 'next/link';
import { VendorIcon } from '@/components/shared/VendorLogos';

const services = [
  {
    icon: Shield,
    title: 'Zero Trust',
    category: 'Architecture',
    description:
      'Comprehensive Zero Trust architecture design and implementation roadmaps tailored to enterprise environments.',
    href: '/services',
    vendors: ['Palo Alto Networks', 'Zscaler'],
    accent: 'from-[#FFC300]/18 via-[#FFC300]/8 to-transparent',
    border: 'hover:border-[#FFC300]/35',
    glow: 'group-hover:shadow-[0_20px_50px_rgba(255,195,0,0.18)]',
  },
  {
    icon: Network,
    title: 'SASE',
    category: 'Transformation',
    description:
      'Strategic guidance on Secure Access Service Edge adoption, including Prisma Access and Netskope deployment.',
    href: '/services',
    vendors: ['Palo Alto Networks', 'Netskope'],
    accent: 'from-[#00AEEF]/18 via-[#00AEEF]/8 to-transparent',
    border: 'hover:border-[#00AEEF]/35',
    glow: 'group-hover:shadow-[0_20px_50px_rgba(0,174,239,0.16)]',
  },
  {
    icon: Cloud,
    title: 'Cloud Security',
    category: 'Multi-Cloud',
    description:
      'Multi-cloud security posture management, workload protection, and cloud-native security architecture.',
    href: '/services',
    vendors: ['Microsoft Azure', 'Amazon Web Services', 'Google Cloud'],
    accent: 'from-[#0078D4]/18 via-[#50E6FF]/10 to-transparent',
    border: 'hover:border-[#50E6FF]/35',
    glow: 'group-hover:shadow-[0_20px_50px_rgba(80,230,255,0.16)]',
  },
  {
    icon: Users,
    title: 'Executive Advisory',
    category: 'Strategic',
    description:
      'Board-level security strategy, risk communication, and alignment of security investments with business objectives.',
    href: '/services',
    vendors: ['Check Point', 'CrowdStrike'],
    accent: 'from-[#E01F3D]/18 via-[#E01F3D]/8 to-transparent',
    border: 'hover:border-[#E01F3D]/35',
    glow: 'group-hover:shadow-[0_20px_50px_rgba(224,31,61,0.16)]',
  },
  {
    icon: Workflow,
    title: 'Security Automation',
    category: 'Cortex XSOAR & XSIAM',
    description:
      'Security orchestration, automation, and response (SOAR) implementation with Cortex XSOAR and XSIAM.',
    href: '/services',
    vendors: ['Palo Alto Networks', 'Fortigate'],
    accent: 'from-[#6BD348]/18 via-[#6BD348]/8 to-transparent',
    border: 'hover:border-[#6BD348]/35',
    glow: 'group-hover:shadow-[0_20px_50px_rgba(107,211,72,0.16)]',
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

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Link
                href={service.href}
                className={`group relative block overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-xl transition-all duration-500 ${service.border} ${service.glow}`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${service.accent} opacity-80`} />
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                <div className="relative flex h-full flex-col">
                  {/* Icon + Category badge */}
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-obsidian-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <service.icon className="h-7 w-7 text-[#FFC300]" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {service.category}
                    </span>
                  </div>

                  {/* Title + Description */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {service.title}
                    </h3>
                    <p className="max-w-[28ch] text-sm leading-6 text-slate-400">
                      {service.description}
                    </p>
                  </div>

                  {/* Vendor Logos */}
                  <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                    <span className="text-[10px] uppercase font-bold tracking-[0.22em] text-slate-600">Powered By</span>
                    <div className="flex items-center gap-2">
                      {service.vendors.map((vendor) => (
                        <div key={vendor} className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" title={vendor}>
                          <VendorIcon name={vendor} className="w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer status */}
                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      In Active Practice
                    </span>
                    <div className="h-2 w-2 rounded-full bg-[#FFC300]/70 shadow-[0_0_18px_rgba(255,195,0,0.45)] transition-all duration-500 group-hover:scale-125" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 flex justify-center">
          <CTAButton href="/services" variant="secondary" showArrow>
            Explore All Services
          </CTAButton>
        </div>
      </div>
    </Section>
  );
}

