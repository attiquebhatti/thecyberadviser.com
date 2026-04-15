'use client';

import { motion } from 'framer-motion';
import { VendorIcon } from '@/components/shared/VendorLogos';
import Link from 'next/link';

export function TrustStrip() {
  const platforms = [
    {
      name: 'Palo Alto Networks',
      category: 'Primary Specialization',
      summary: 'Strata, Prisma, and Cortex platforms',
      href: '/knowledge-base?category=PALO+ALTO',
      accent: 'from-[#F04E23]/18 via-[#F04E23]/8 to-transparent',
      border: 'hover:border-[#F04E23]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(240,78,35,0.18)]',
    },
    {
      name: 'Microsoft Azure',
      category: 'Cloud Architecture',
      summary: 'Landing zones, identity, and secure transit',
      href: '/knowledge-base?category=ARCHITECTURE',
      accent: 'from-[#0078D4]/18 via-[#50E6FF]/10 to-transparent',
      border: 'hover:border-[#50E6FF]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(80,230,255,0.16)]',
    },
    {
      name: 'Amazon Web Services',
      category: 'Cloud Security',
      summary: 'Inspection patterns, routing, and resilience',
      href: '/knowledge-base?category=ARCHITECTURE',
      accent: 'from-[#FF9900]/18 via-[#FF9900]/8 to-transparent',
      border: 'hover:border-[#FF9900]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(255,153,0,0.18)]',
    },
    {
      name: 'Google Cloud',
      category: 'Hybrid Cloud',
      summary: 'Secure connectivity and service edge design',
      href: '/knowledge-base?category=ARCHITECTURE',
      accent: 'from-[#4285F4]/18 via-[#34A853]/8 to-transparent',
      border: 'hover:border-[#4285F4]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(66,133,244,0.16)]',
    },
    {
      name: 'Zscaler',
      category: 'SASE',
      summary: 'Zero Trust access and internet security',
      href: '/knowledge-base?category=ARCHITECTURE',
      accent: 'from-[#0094D8]/18 via-[#6DD5FA]/10 to-transparent',
      border: 'hover:border-[#6DD5FA]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(109,213,250,0.16)]',
    },
    {
      name: 'CrowdStrike',
      category: 'Endpoint Security',
      summary: 'Falcon visibility, response, and alignment',
      href: '/knowledge-base?category=ARCHITECTURE',
      accent: 'from-[#E01F3D]/18 via-[#E01F3D]/8 to-transparent',
      border: 'hover:border-[#E01F3D]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(224,31,61,0.16)]',
    },
    {
      name: 'Netskope',
      category: 'SSE',
      summary: 'Data protection and cloud app governance',
      href: '/knowledge-base?category=ARCHITECTURE',
      accent: 'from-[#00AEEF]/18 via-[#7C4DFF]/8 to-transparent',
      border: 'hover:border-[#00AEEF]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(0,174,239,0.16)]',
    },
    {
      name: 'Fortigate',
      category: 'Network Security',
      summary: 'Firewall strategy and operational hardening',
      href: '/knowledge-base?category=FORTINET',
      accent: 'from-[#EE3124]/18 via-[#EE3124]/8 to-transparent',
      border: 'hover:border-[#EE3124]/35',
      glow: 'group-hover:shadow-[0_20px_50px_rgba(238,49,36,0.16)]',
    },
    {
      name: 'Check Point',
      category: 'Enterprise Firewall',
      summary: 'Policy optimization and architecture guidance',
      href: '/knowledge-base?category=CHECK+POINT',
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
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-amber-500 to-amber-500/0" />
            <span className="text-amber-500 text-sm font-semibold uppercase tracking-[0.2em]">
              Expertise Across Platforms
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Advisory depth across the security and cloud platforms 
            <br />
            <span className="text-slate-400">most teams actually run.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Platform fluency that spans architecture, migration planning, operations, and modernization across the vendors shaping enterprise security.
          </p>
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
          {platforms.map((platform) => (
            <motion.div
              key={platform.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Link
                href={platform.href}
                className={`group relative block overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-xl transition-all duration-500 ${platform.border} ${platform.glow}`}
                style={{
                  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.07), 0 20px 40px rgba(0,0,0,0.4)`,
                } as React.CSSProperties}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${platform.accent} opacity-80`} />
                
                {/* Gradient top accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl transition-all duration-500 group-hover:opacity-100 opacity-30 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex h-full flex-col">
                  {/* Icon + Category badge */}
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-obsidian-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <VendorIcon name={platform.name} className="h-7 w-7" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {platform.category}
                    </span>
                  </div>

                  {/* Title + Summary */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {platform.name}
                    </h3>
                    <p className="max-w-[28ch] text-sm leading-relaxed text-slate-400 font-light">
                      {platform.summary}
                    </p>
                  </div>

                  {/* Footer status */}
                  <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      In Active Practice
                    </span>
                    <div className="h-2 w-2 rounded-full bg-[#FFC300]/70 shadow-[0_0_18px_rgba(255,195,0,0.45)] transition-all duration-500 group-hover:scale-125" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

