import Image from 'next/image';
import { CTAButton } from '@/components/shared/CTAButton';
import { Shield, Lock, Cloud, Network, Workflow } from 'lucide-react';

const capabilityCards = [
  { icon: Shield, label: 'Zero Trust', desc: 'Architecture' },
  { icon: Network, label: 'SASE', desc: 'Transformation' },
  { icon: Cloud, label: 'Cloud', desc: 'Security' },
  { icon: Lock, label: 'Executive', desc: 'Advisory' },
  { icon: Workflow, label: 'Security Automation', desc: 'XSOAR & XSIAM' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 md:pt-28 md:pb-14 lg:pt-32 lg:pb-16">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#000814]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[1400px] bg-gradient-radial from-[#FFC300]/[0.05] via-transparent to-transparent" />
        <div className="absolute top-1/4 right-0 h-[600px] w-[600px] bg-gradient-radial from-[#003566]/[0.16] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-[#FFC300] to-[#FFC300]/0" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFC300]">
                Cybersecurity Advisory
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl xl:text-8xl">
              Architecting
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#FFD60A] via-[#FFC300] to-[#e59b00] bg-clip-text text-transparent">
                  Enterprise Security
                </span>
              </span>
              <br />
              <span className="text-slate-400">for the Modern Era</span>
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-light leading-relaxed text-slate-400 md:text-2xl">
              Strategic advisory for global enterprises navigating Zero Trust
              transformation, SASE architecture, and security modernization at scale.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <CTAButton href="/contact" variant="primary" size="lg">
                Schedule Consultation
              </CTAButton>
              <CTAButton
                href="/knowledge-base"
                variant="secondary"
                size="lg"
                showArrow
              >
                Explore Insights
              </CTAButton>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-[#FFC300]/8 via-transparent to-[#003566]/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#003566]/70 bg-[#001D3D]/70 p-3 shadow-2xl shadow-black/30">
              <div className="overflow-hidden rounded-[1.25rem] border border-[#003566]/60 bg-[#000814]">
                <div className="flex items-center justify-between border-b border-[#003566]/60 bg-[#001D3D]/80 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFC300]">
                      Architecture Preview
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Enterprise security reference design
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FFC300]/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#003566]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#003566]" />
                  </div>
                </div>

                <div className="relative aspect-[4/3] bg-[#000814] p-4 md:p-5">
                  <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#003566]/50 bg-[#001D3D]/40">
                    <Image
                      src="/images/home-architecture.jpg"
                      alt="Enterprise security architecture diagram"
                      fill
                      priority
                      className="object-contain object-center"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#000814]/20 via-transparent to-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-[#003566]/60 bg-[#001D3D]/70 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#FFC300]">
                      Focus
                    </p>
                    <p className="mt-1 text-xs text-slate-300">Zero Trust</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#FFC300]">
                      Platform
                    </p>
                    <p className="mt-1 text-xs text-slate-300">Prisma / Cortex</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#FFC300]">
                      Outcome
                    </p>
                    <p className="mt-1 text-xs text-slate-300">Production-ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-14">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
            {capabilityCards.map((item) => (
              <div key={item.label} className="group relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative rounded-2xl border border-white/[0.04] p-5 transition-colors duration-500 group-hover:border-white/[0.08] md:p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFC300]/10">
                    <item.icon className="h-5 w-5 text-[#FFC300]" />
                  </div>
                  <div className="mb-1 text-lg font-semibold text-white">
                    {item.label}
                  </div>
                  <div className="text-sm text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
