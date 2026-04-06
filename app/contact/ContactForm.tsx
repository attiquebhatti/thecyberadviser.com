"use client";

import React, { useMemo, useState } from "react";

type FormState = {
  fullName: string;
  email: string;
  company: string;
  topic: string;
  details: string;
};

type SubmitState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    company: "",
    topic: "Architecture Review",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(null);

  const isValid = useMemo(() => {
    return form.email.trim().length > 3 && form.details.trim().length > 10;
  }, [form.email, form.details]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitState(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result?.error || "Unable to send your inquiry right now."
        );
      }

      setForm({
        fullName: "",
        email: "",
        company: "",
        topic: "Architecture Review",
        details: "",
      });
      setSubmitState({
        type: "success",
        text: "Inquiry sent successfully. A response should follow shortly.",
      });
    } catch (error) {
      setSubmitState({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to send your inquiry right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#003566] bg-[#001D3D]/35 p-7 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:border-[#FFC300]/50 hover:shadow-[#FFC300]/10 md:p-8">
      <div className="absolute left-0 top-0 h-1.5 w-full rounded-t-2xl bg-[#FFC300]/20 transition-colors duration-500 group-hover:bg-[#FFC300]" />

      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFC300]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#003566]/30 blur-3xl opacity-60" />

      <div className="relative">
        <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
          Send an inquiry
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Share your goal and current bottleneck. I&apos;ll respond with next
          steps and availability.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-xs font-black uppercase tracking-[0.25em] text-slate-300"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#FFC300]/40 focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 transition"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="company"
                className="text-xs font-black uppercase tracking-[0.25em] text-slate-300"
              >
                Company
              </label>
              <input
                id="company"
                type="text"
                autoComplete="organization"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="Company / Program"
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#FFC300]/40 focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-black uppercase tracking-[0.25em] text-slate-300"
              >
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
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#FFC300]/40 focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 transition"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="topic"
                className="text-xs font-black uppercase tracking-[0.25em] text-slate-300"
              >
                Topic
              </label>
              <select
                id="topic"
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                className="w-full rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white focus:border-[#FFC300]/40 focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 transition"
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
            <label
              htmlFor="details"
              className="text-xs font-black uppercase tracking-[0.25em] text-slate-300"
            >
              Requirement details <span className="text-[#FFC300]">*</span>
            </label>
            <textarea
              id="details"
              rows={5}
              required
              value={form.details}
              onChange={(e) => update("details", e.target.value)}
              placeholder="Example: We're migrating from legacy VPN to ZTNA for ~4,000 users across GCC/APAC. Current pain: latency on M365 + inconsistent access policy. Target: phased rollout without downtime..."
              className="w-full resize-none rounded-xl border border-[#003566] bg-[#000814]/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#FFC300]/40 focus:outline-none focus:ring-2 focus:ring-[#FFC300]/50 transition"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full rounded-xl bg-[#FFC300] py-4 font-black uppercase tracking-[0.25em] text-[#000814] shadow-xl transition hover:bg-[#FFD60A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send inquiry"}
          </button>

          {submitState && (
            <p
              className={`text-sm ${
                submitState.type === "success"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {submitState.text}
            </p>
          )}

          <p className="text-xs text-slate-400">
            Your inquiry is sent directly from the site and does not require a
            local email client.
          </p>
        </form>
      </div>
    </div>
  );
}
