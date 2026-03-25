import { Section } from '@/components/layout/Section';
import { CTAButton } from '@/components/shared/CTAButton';

export function CTASection() {
  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-obsidian-950" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-[#FFC300]/0 to-[#FFC300]" />
            <span className="text-[#FFC300] text-sm font-semibold uppercase tracking-[0.2em]">
              Get Started
            </span>
            <div className="h-px w-12 bg-gradient-to-r from-[#FFC300] to-[#FFC300]/0" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Ready to Transform
            <br />
            <span className="text-slate-400">Your Security Posture?</span>
          </h2>

          <p className="mt-8 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Schedule a confidential consultation to discuss your enterprise
            security challenges and explore strategic solutions tailored to your
            organization.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center">
            <CTAButton href="/contact" variant="primary" size="lg">
              Schedule Consultation
            </CTAButton>
            <CTAButton href="/portfolio" variant="secondary" size="lg" showArrow>
              View Case Studies
            </CTAButton>
          </div>

          <div className="mt-16 pt-16 border-t border-white/[0.04]">
            <p className="text-slate-500 text-sm mb-6">
              Typical engagement areas
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {[
                'Zero Trust Architecture',
                'SASE Transformation',
                'Cloud Security',
                'Executive Advisory',
              ].map((item) => (
                <span key={item} className="text-slate-400 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
