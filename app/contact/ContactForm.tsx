"use client";

import React, { useMemo, useState } from "react";

type FormState = {
  fullName: string;
  email: string;
  company: string;
  topic: string;
  details: string;
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    company: "",
    topic: "Architecture Review",
    details: "",
  });

  const isValid = useMemo(() => {
    return form.email.trim().length > 3 && form.details.trim().length > 10;
  }, [form.email, form.details]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = `Consultation Request — ${form.topic}`;
    const body = [
      `Full Name: ${form.fullName || "-"}`,
      `Corporate Email: ${form.email || "-"}`,
      `Company: ${form.company || "-"}`,
      `Topic: ${form.topic || "-"}`,
      "",
      "Requirement Details:",
      form.details || "-",
      "",
      "Preferred next step:",
      "- Share available slots for a 30-min discovery call",
    ].join("\n");

    const mailto = `mailto:attique@ipcare.ae?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  }

  return (
    <div className="relative rounded-2xl border border-[#003566] bg-[#001D3D]/35 p-7 md:p-8 shadow-2xl overflow-hidden">
      {/* subtle top accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FFC300]/20 via-[#FFC300]/90 to-[#FFC300]/20" />

      {/* soft glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#FFC300]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#003566]/30 blur-3xl opacity-60" />

      <div className="relative">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
          Send an inquiry
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Share your goal and current bottleneck. I’ll respond with next steps and availability.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500
                           focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 focus:border-[#FFC300]/40 transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">
                Company
              </label>
              <input
                id="company"
                type="text"
                autoComplete="organization"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="Company / Program"
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500
                           focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 focus:border-[#FFC300]/40 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">
                Corporate email <span className="text-[#FFC300]">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="john@company.com"
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500
                           focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 focus:border-[#FFC300]/40 transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="topic" className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">
                Topic
              </label>
              <select
                id="topic"
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white
                           focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 focus:border-[#FFC300]/40 transition"
              >
                <option>Architecture Review</option>
                <option>Prisma / SASE / ZTNA</option>
                <option>NGFW / Segmentation</option>
                <option>SOC Automation (XSOAR)</option>
                <option>Incident Response Advisory</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="details" className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">
              Requirement details <span className="text-[#FFC300]">*</span>
            </label>
            <textarea
              id="details"
              rows={5}
              required
              value={form.details}
              onChange={(e) => update("details", e.target.value)}
              placeholder="Example: We're migrating from legacy VPN to ZTNA for ~4,000 users across GCC/APAC. Current pain: latency on M365 + inconsistent access policy. Target: phased rollout without downtime..."
              className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500
                         focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 focus:border-[#FFC300]/40 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full rounded-xl py-4 font-black uppercase tracking-[0.25em]
                       bg-[#FFC300] text-[#000814] shadow-xl
                       hover:bg-[#FFD60A] transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send inquiry
          </button>

          <p className="text-xs text-slate-400">
            This opens your email client with a pre-filled message (no form backend required).
          </p>
        </form>
      </div>
    </div>
  );
}