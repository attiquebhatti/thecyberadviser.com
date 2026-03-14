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
                <div className="h-px w-12 bg-gradient-to-r from-amber-500 to-amber-500/0" />
                <span className="text-amber-500 text-sm font-semibold uppercase tracking-[0.2em]">
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
                  className="group relative"
                >
                  <div className="absolute inset-0 rounded-2xl border border-white/[0.04] group-hover:border-white/[0.08] transition-colors duration-500" />
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                  </div>

                  <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                    <div className="md:w-32 flex-shrink-0">
                      <div className="text-5xl md:text-6xl font-bold text-white tracking-tight">
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
