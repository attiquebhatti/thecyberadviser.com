'use client';

import { motion } from 'framer-motion';
import { VendorIcon } from '@/components/shared/VendorLogos';
import { AccentTerms } from '@/components/shared/AccentTerms';

export function TrustStrip() {
  const platforms = [
    {
      name: 'Palo Alto Networks',
      category: 'Primary Specialization',
      summary: 'Strata, Prisma, and Cortex platforms',
      accent: 'from-[#F04E23]/18 via-[#F04E23]/8 to-transparent',
      border: 'hover:border-[#F04E23]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(240,78,35,0.18)]',
    },
    {
      name: 'Microsoft Azure',
      category: 'Cloud Architecture',
      summary: 'Landing zones, identity, and secure transit',
      accent: 'from-[#0078D4]/18 via-[#50E6FF]/10 to-transparent',
      border: 'hover:border-[#50E6FF]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(80,230,255,0.16)]',
    },
    {
      name: 'Amazon Web Services',
      category: 'Cloud Security',
      summary: 'Inspection patterns, routing, and resilience',
      accent: 'from-[#FF9900]/18 via-[#FF9900]/8 to-transparent',
      border: 'hover:border-[#FF9900]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(255,153,0,0.18)]',
    },
    {
      name: 'Google Cloud',
      category: 'Hybrid Cloud',
      summary: 'Secure connectivity and service edge design',
      accent: 'from-[#4285F4]/18 via-[#34A853]/8 to-transparent',
      border: 'hover:border-[#4285F4]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(66,133,244,0.16)]',
    },
    {
      name: 'Zscaler',
      category: 'SASE',
      summary: 'Zero Trust access and internet security',
      accent: 'from-[#0094D8]/18 via-[#6DD5FA]/10 to-transparent',
      border: 'hover:border-[#6DD5FA]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(109,213,250,0.16)]',
    },
    {
      name: 'CrowdStrike',
      category: 'Endpoint Security',
      summary: 'Falcon visibility, response, and alignment',
      accent: 'from-[#E01F3D]/18 via-[#E01F3D]/8 to-transparent',
      border: 'hover:border-[#E01F3D]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(224,31,61,0.16)]',
    },
    {
      name: 'Netskope',
      category: 'SSE',
      summary: 'Data protection and cloud app governance',
      accent: 'from-[#00AEEF]/18 via-[#7C4DFF]/8 to-transparent',
      border: 'hover:border-[#00AEEF]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(0,174,239,0.16)]',
    },
    {
      name: 'Fortigate',
      category: 'Network Security',
      summary: 'Firewall strategy and operational hardening',
      accent: 'from-[#EE3124]/18 via-[#EE3124]/8 to-transparent',
      border: 'hover:border-[#EE3124]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(238,49,36,0.16)]',
    },
    {
      name: 'Check Point',
      category: 'Enterprise Firewall',
      summary: 'Policy optimization and architecture guidance',
      accent: 'from-[#E31B23]/18 via-[#E31B23]/8 to-transparent',
      border: 'hover:border-[#E31B23]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(227,27,35,0.16)]',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-obsidian-950 py-20 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[1100px] -translate-x-1/2 rounded-full bg-[#FFC300]/[0.03] blur-[150px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <p className="mb-6 text-sm font-black uppercase tracking-[0.4em] text-[#FFC300]">
            Expertise Across Platforms
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
            Advisory depth across the security and cloud platforms most teams actually run.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 md:text-lg">
            Platform fluency that spans architecture, migration planning, operations, and modernization across the vendors shaping enterprise security.
          </p>
          <div className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-[#FFC300]/50 to-transparent" />
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
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3"
        >
          {platforms.map((platform) => (
            <motion.div
              key={platform.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-xl transition-all duration-500 ${platform.border} ${platform.glow}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${platform.accent} opacity-80`} />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

              <div className="relative flex h-full flex-col">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div className="flex h-16 w-20 items-center justify-center rounded-2xl border border-white/10 bg-obsidian-950/70 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <VendorIcon name={platform.name} className="h-10 w-12" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {platform.category}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">
                    {platform.name}
                  </h3>
                  <p className="max-w-[28ch] text-sm leading-6 text-slate-400">
                    <AccentTerms text={platform.summary} />
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    In Active Practice
                  </span>
                  <div className="h-2 w-2 rounded-full bg-[#FFC300]/70 shadow-[0_0_18px_rgba(255,195,0,0.45)] transition-all duration-500 group-hover:scale-125" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
