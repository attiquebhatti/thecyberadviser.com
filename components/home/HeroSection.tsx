import { CTAButton } from '@/components/shared/CTAButton';
import { Shield, Lock, Cloud, Network } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative flex items-center pt-24 pb-16 md:pb-20 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-obsidian-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-gradient-radial from-amber-500/[0.05] via-transparent to-transparent" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-radial from-amber-500/[0.03] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-amber-500 to-amber-500/0" />
            <span className="text-amber-500 text-sm font-semibold uppercase tracking-[0.2em]">
              Cybersecurity Advisory
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] tracking-tight">
            Architecting
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                Enterprise Security
              </span>
            </span>
            <br />
            <span className="text-slate-400">for the Modern Era</span>
          </h1>

          <p className="mt-6 text-xl md:text-2xl text-slate-400 leading-relaxed max-w-2xl font-light">
            Strategic advisory for global enterprises navigating Zero Trust transformation,
            SASE architecture, and security modernization at scale.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <CTAButton href="/contact" variant="primary" size="lg">
              Schedule Consultation
            </CTAButton>
            <CTAButton href="/knowledge-base" variant="secondary" size="lg" showArrow>
              Explore Insights
            </CTAButton>
          </div>
        </div>

        <div className="mt-16 lg:mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {[
              { icon: Shield, label: 'Zero Trust', desc: 'Architecture' },
              { icon: Network, label: 'SASE', desc: 'Transformation' },
              { icon: Cloud, label: 'Cloud', desc: 'Security' },
              { icon: Lock, label: 'Executive', desc: 'Advisory' },
            ].map((item, index) => (
              <div key={item.label} className="group relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-5 md:p-6 rounded-2xl border border-white/[0.04] group-hover:border-white/[0.08] transition-colors duration-500">
                  <div className="w-11 h-11 mb-4 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-lg font-semibold text-white mb-1">{item.label}</div>
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
