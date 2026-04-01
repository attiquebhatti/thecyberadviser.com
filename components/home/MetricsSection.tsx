import Image from 'next/image';
import { Section } from '@/components/layout/Section';

export function MetricsSection() {
  return (
    <Section className="relative">
      <div className="absolute inset-0 bg-obsidian-950" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-40">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-gradient-to-r from-[#FFC300] to-[#FFC300]/0" />
                <span className="text-[#FFC300] text-sm font-semibold uppercase tracking-[0.2em]">
                  Track Record
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                Measurable
                <br />
                <span className="text-slate-400">Impact</span>
              </h2>

              <p className="text-xl text-slate-400 leading-relaxed">
                Enterprise-grade security outcomes delivered through strategic
                architecture, proven methodologies, and deep operational expertise.
              </p>

              <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="relative overflow-hidden rounded-[1rem] border border-white/[0.05]">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src="/images/slides/slide-1.png"
                      alt="Enterprise security reference design"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 border-t border-white/[0.06] bg-obsidian-950/90 px-4 py-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFC300]/60">Scope</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">Enterprise</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFC300]/60">Pattern</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">Zero Trust</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFC300]/60">Mode</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">Operational</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-6">
              {[
                {
                  value: '99.9%',
                  label: 'Deployment Success Rate',
                  detail: 'Zero-downtime transformations across mission-critical environments',
                },
                {
                  value: '100M+',
                  label: 'Users Protected',
                  detail: 'End users secured through Zero Trust and SASE implementations globally',
                },
                {
                  value: '50+',
                  label: 'Enterprise Engagements',
                  detail: 'Strategic transformations across financial services, healthcare, and technology',
                },
                {
                  value: '15+',
                  label: 'Years of Experience',
                  detail: 'Advising Fortune 500 enterprises on security architecture and strategy',
                },
              ].map((metric, index) => (
                <div
                  key={metric.label}
                  className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-[#FFC300]/10"
                >
                  <div className="absolute inset-0 border border-white/[0.04] group-hover:border-[#FFC300]/30 transition-colors duration-500" />
                  
                  {/* interactive top highlight */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 rounded-t-2xl"></div>

                  <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8 md:gap-14">
                    <div className="md:w-48 lg:w-56 flex-shrink-0">
                      <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                        {metric.value}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {metric.label}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {metric.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
