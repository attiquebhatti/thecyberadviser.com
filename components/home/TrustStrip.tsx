export function TrustStrip() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="absolute inset-0 bg-obsidian-950" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] mb-4">
            Trusted by Industry Leaders
          </p>
          <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
          {[
            {
              stat: '15+',
              label: 'Years advising Fortune 500 enterprises on security transformation',
            },
            {
              stat: '100M+',
              label: 'End users protected through Zero Trust and SASE implementations',
            },
            {
              stat: '50+',
              label: 'Enterprise engagements across financial services, healthcare, and technology',
            },
          ].map((item, index) => (
            <div
              key={item.stat}
              className="relative bg-obsidian-950 p-10 md:p-12"
            >
              <div className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                {item.stat}
              </div>
              <p className="text-slate-400 leading-relaxed">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-16 border-t border-white/[0.04]">
          <p className="text-center text-slate-500 text-sm mb-10 uppercase tracking-[0.15em]">
            Expertise Across Platforms
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
            {[
              'Palo Alto Networks',
              'Microsoft Azure',
              'Amazon Web Services',
              'Google Cloud',
              'Zscaler',
              'CrowdStrike',
            ].map((platform) => (
              <span
                key={platform}
                className="text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors duration-300"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
