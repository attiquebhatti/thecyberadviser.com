import Link from 'next/link';

export const metadata = {
  title: 'Architecture Portfolio | Attique Bhatti',
  description: 'Production-grade security deployments and measurable outcomes across the GCC.',
};

export default function PortfolioPage() {
  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-[#000814] selection:bg-[#FFC300] selection:text-[#000814] pb-24">

      {/* 1. PORTFOLIO HEADER - Commanding Authority */}
      <section className="w-full pt-32 pb-14 px-8 text-center border-b border-[#003566]/50">
        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-6">
          Production <span className="text-slate-500">Impact</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
          Measurable outcomes from 15 years of engineering high-availability security for critical infrastructures in Dubai and the wider GCC region.
        </p>
      </section>

      {/* 2. CASE STUDIES - Metrics-First Layout */}
      <section className="w-full py-16 px-8">
        <div className="max-w-[1200px] mx-auto space-y-20">

          {/* CASE STUDY 01: SASE */}
          <div className="flex flex-col space-y-10 group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
              <div className="space-y-4">
                <span className="text-[#FFC300] font-mono text-sm uppercase tracking-[0.3em] font-bold">Project 01 // Financial Sector</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Global Prisma SASE Migration</h2>
              </div>
              <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed">
                Replaced legacy MPLS with a cloud-native Zero Trust architecture for 5,000+ distributed users, ensuring 100% encryption of data-in-motion without compromising performance.
              </p>
            </div>

            {/* MASSIVE METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-[#003566]">
              <div className="flex flex-col">
                <span className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-2 group-hover:text-[#FFC300] transition-colors">45%</span>
                <span className="text-xs text-[#FFC300] font-mono uppercase tracking-[0.4em] font-bold">Latency Reduction</span>
              </div>
              <div className="flex flex-col">
                <span className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-2 group-hover:text-[#FFC300] transition-colors">Zero</span>
                <span className="text-xs text-[#FFC300] font-mono uppercase tracking-[0.4em] font-bold">Trust Enforcement</span>
              </div>
              <div className="flex flex-col">
                <span className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-2 group-hover:text-[#FFC300] transition-colors">100%</span>
                <span className="text-xs text-[#FFC300] font-mono uppercase tracking-[0.4em] font-bold">Visibility Gained</span>
              </div>
            </div>
          </div>

          {/* CASE STUDY 02: SOC AUTOMATION */}
          <div className="flex flex-col space-y-10 group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
              <div className="space-y-4">
                <span className="text-[#FFC300] font-mono text-sm uppercase tracking-[0.3em] font-bold">Project 02 // Government</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Cortex XSOAR Orchestration</h2>
              </div>
              <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed">
                Engineered custom Python-based playbooks to automate phishing triage and incident response. Unified 15+ siloed security tools into a single orchestration plane.
              </p>
            </div>

            {/* MASSIVE METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-[#003566]">
              <div className="flex flex-col">
                <span className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-2 group-hover:text-[#FFC300] transition-colors">90%</span>
                <span className="text-xs text-[#FFC300] font-mono uppercase tracking-[0.4em] font-bold">Automation Level</span>
              </div>
              <div className="flex flex-col">
                <span className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-2 group-hover:text-[#FFC300] transition-colors">&lt;5m</span>
                <span className="text-xs text-[#FFC300] font-mono uppercase tracking-[0.4em] font-bold">Response Time</span>
              </div>
              <div className="flex flex-col">
                <span className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-2 group-hover:text-[#FFC300] transition-colors">24/7</span>
                <span className="text-xs text-[#FFC300] font-mono uppercase tracking-[0.4em] font-bold">Autonomous Hunting</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FOOTER CTA */}
      <section className="w-full max-w-[900px] mx-auto px-8 py-20 text-center border-t border-[#003566]/50">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Need Similar Outcomes?</h2>
        <Link href="/contact" className="inline-block px-12 py-5 bg-[#FFC300] text-[#000814] font-black text-lg hover:bg-[#FFD60A] transition-all shadow-2xl uppercase tracking-widest">
          Initiate Review
        </Link>
      </section>

    </main>
  );
}