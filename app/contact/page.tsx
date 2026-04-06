import Link from "next/link";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Consultation | Attique Bhatti",
  description:
    "Schedule a technical deep-dive or architecture review with Attique Bhatti, Enterprise Security Consultant.",
};

export default function ContactPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#000814] selection:bg-[#FFC300] selection:text-[#000814]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,195,0,0.10),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />

      <section className="relative mx-auto w-full max-w-[1200px] px-8 pb-10 pt-28">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#FFC300]/80">
          Contact
        </p>

        <h1 className="mt-4 text-5xl font-bold leading-[1.02] tracking-tight text-white md:text-7xl">
          Let&apos;s talk{" "}
          <span className="block text-slate-500 md:inline">
            about your environment.
          </span>
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
          Available for strategic consulting, architecture reviews, and
          enterprise-grade security deployments across the GCC.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {[
            "GCC + Global",
            "Response: 24-48h",
            "Architecture-first",
            "Production-ready",
          ].map((t) => (
            <span
              key={t}
              className="rounded-full border border-[#003566] bg-[#003566]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-200/80"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[1200px] px-8 pb-20">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="group relative overflow-hidden rounded-2xl border border-[#003566] bg-[#001D3D]/40 p-8 shadow-2xl shadow-black/20 transition-all duration-500 hover:scale-[1.01] hover:border-[#FFC300]/50 hover:shadow-[#FFC300]/10 md:p-10">
            <div className="absolute left-0 top-0 h-1.5 w-full rounded-t-2xl bg-[#FFC300]/20 transition-colors duration-500 group-hover:bg-[#FFC300]" />

            <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
              Direct channel
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Prefer a quick route? Email or call - I&apos;ll reply with next
              steps.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                  Email
                </p>
                <a
                  href="mailto:attique@thecyberadviser.com"
                  className="mt-2 block text-2xl font-bold text-white transition hover:text-[#FFC300] md:text-3xl"
                >
                  attique@thecyberadviser.com
                </a>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                  Phone
                </p>
                <a
                  href="tel:+971569383383"
                  className="mt-2 block text-2xl font-bold text-white transition hover:text-[#FFC300] md:text-3xl"
                >
                  +971 56 938 3383
                </a>
              </div>
            </div>

            <div className="mt-10 border-t border-[#003566] pt-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                Operational status
              </p>
              <div className="mt-4 flex items-center gap-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFC300] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FFC300]" />
                </span>
                <span className="text-base font-medium text-white">
                  Currently accepting new enterprise projects
                </span>
              </div>

              <div className="mt-8 space-y-3 text-sm text-slate-300">
                <p className="font-semibold text-slate-200">
                  To move fast, include:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Current architecture + key bottleneck</li>
                  <li>Target outcome (performance, security, compliance)</li>
                  <li>Scale (users/sites/cloud/DC) and timeline</li>
                </ul>
              </div>

              <div className="mt-10">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-3 rounded-xl border border-[#003566] bg-[#003566]/20 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-200/90 transition hover:border-[#FFC300]/40 hover:bg-[#003566]/40"
                >
                  View services <span className="text-[#FFC300]">-&gt;</span>
                </Link>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}
