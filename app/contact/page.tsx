import Link from "next/link";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Consultation | Attique Bhatti",
  description:
    "Schedule a technical deep-dive or architecture review with Attique Bhatti, Enterprise Security Consultant.",
};

export default function ContactPage() {
  return (
    <main className="relative w-full min-h-screen bg-[#000814] selection:bg-[#FFC300] selection:text-[#000814] overflow-hidden">
      {/* Background polish */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,195,0,0.10),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />

      {/* Header */}
      <section className="relative w-full max-w-[1200px] mx-auto px-8 pt-28 pb-10">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#FFC300]/80">
          Contact
        </p>

        <h1 className="mt-4 text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.02]">
          Let's talk{" "}
          <span className="text-slate-500 block md:inline">about your environment.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed">
          Available for strategic consulting, architecture reviews, and enterprise-grade security deployments across the GCC.
        </p>

        {/* small trust chips */}
        <div className="mt-8 flex flex-wrap gap-3">
          {["GCC + Global", "Response: 24–48h", "Architecture-first", "Production-ready"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-[#003566] bg-[#003566]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-200/80"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="relative w-full max-w-[1200px] mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* Left: Direct channel */}
          <div className="rounded-2xl border border-[#003566] bg-[#001D3D]/20 p-8 md:p-10">
            <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Direct channel
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Prefer a quick route? Email or call — I'll reply with next steps.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                  Email
                </p>
                <a
                  href="mailto:attique@ipcare.ae"
                  className="mt-2 block text-2xl md:text-3xl font-bold text-white hover:text-[#FFC300] transition"
                >
                  attique@ipcare.ae
                </a>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                  Phone
                </p>
                <a
                  href="tel:+971569383383"
                  className="mt-2 block text-2xl md:text-3xl font-bold text-white hover:text-[#FFC300] transition"
                >
                  +971 56 938 3383
                </a>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-[#003566]">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                Operational status
              </p>
              <div className="mt-4 flex items-center gap-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC300] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFC300]" />
                </span>
                <span className="text-base text-white font-medium">
                  Currently accepting new enterprise projects
                </span>
              </div>

              <div className="mt-8 space-y-3 text-sm text-slate-300">
                <p className="text-slate-200 font-semibold">To move fast, include:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Current architecture + key bottleneck</li>
                  <li>Target outcome (performance, security, compliance)</li>
                  <li>Scale (users/sites/cloud/DC) and timeline</li>
                </ul>
              </div>

              <div className="mt-10">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-3 rounded-xl border border-[#003566] bg-[#003566]/20 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-200/90 hover:border-[#FFC300]/40 hover:bg-[#003566]/40 transition"
                >
                  View services <span className="text-[#FFC300]">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <ContactForm />
        </div>
      </section>
    </main>
  );
}