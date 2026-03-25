import { Section } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';

export function PhilosophySection() {
  return (
    <Section className="relative">
      <div className="absolute inset-0 bg-obsidian-950" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-[#FFC300] to-[#FFC300]/0" />
              <span className="text-[#FFC300] text-sm font-semibold uppercase tracking-[0.2em]">
                Philosophy
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-10">
              Security as a
              <br />
              <span className="text-slate-400">Strategic Enabler</span>
            </h2>

            <div className="space-y-6 text-lg text-slate-400 leading-[1.8]">
              <p>
                Modern enterprises require security strategies that accelerate
                transformation rather than constrain it. The traditional
                perimeter-centric model has given way to identity-driven,
                context-aware architectures that enable secure access from any
                location.
              </p>
              <p>
                My approach integrates Zero Trust principles with pragmatic
                implementation strategies, balancing security imperatives against
                operational realities. The goal is not security for its own sake,
                but enabling organizations to operate confidently in distributed
                environments.
              </p>
              <p>
                From board-level strategy to technical architecture, I bridge the
                gap between security vision and operational execution, ensuring
                that security investments deliver measurable business outcomes.
              </p>
            </div>

            <div className="mt-12">
              <CTAButton href="/about" variant="secondary" showArrow>
                Learn More About My Approach
              </CTAButton>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-40">
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-br from-[#FFC300]/10 via-transparent to-transparent blur-3xl opacity-40" />

                <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden group transition-all duration-500 hover:border-[#FFC300]/30 hover:shadow-[#FFC300]/5">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 rounded-t-2xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

                  <div className="relative p-10 md:p-12">
                    <div className="text-6xl text-[#FFC300]/20 font-serif leading-none mb-6">
                      &ldquo;
                    </div>

                    <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed">
                      Security architecture is not about building walls. It&rsquo;s about
                      enabling secure access to the right resources, for the right
                      people, at the right time.
                    </blockquote>

                    <div className="mt-10 pt-8 border-t border-white/[0.06]">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFC300]/20 to-[#FFD60A]/10 flex items-center justify-center border border-[#FFC300]/20">
                          <span className="text-[#FFC300] font-semibold text-lg">CA</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">The Cyber Adviser</div>
                          <div className="text-sm text-slate-500">
                            Strategic Security Consultant
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
