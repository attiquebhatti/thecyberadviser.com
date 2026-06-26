'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy, BarChart3, Brain, Shield, Star, ChevronRight, Check } from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

const BASE = '/tools/cyberquiz';

const FEATURES = [
  { icon: Zap,      color: '#6bd348', title: '8 Game Modes',          desc: 'From Classic Blitz to Battle Royale and Gold Rush — every session is unique.' },
  { icon: Brain,    color: '#6bd348', title: 'AI Quiz Generation',     desc: 'Generate full quizzes in seconds from any topic using Groq AI.' },
  { icon: Users,    color: '#6bd348', title: 'Live Multiplayer',       desc: 'Real-time Socket.io gameplay. Host or join with a 6-digit code.' },
  { icon: Shield,   color: '#6bd348', title: 'PANW Question Banks',    desc: 'Curated PCNSE, XDR, XSIAM, Prisma and more — built for cybersecurity pros.' },
  { icon: BarChart3,color: '#6bd348', title: 'Full Analytics',         desc: 'Session heatmaps, performance trends, and per-question accuracy.' },
  { icon: Trophy,   color: '#6bd348', title: 'Live Leaderboards',      desc: 'Dynamic rank changes and real-time score updates keep players engaged.' },
];

const STATS = [
  { value: '8',     label: 'Game modes' },
  { value: '6-digit', label: 'Join codes' },
  { value: 'Real-time', label: 'Multiplayer' },
  { value: 'AI', label: 'Quiz generation' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create or generate a quiz', desc: 'Build from scratch or let AI generate a quiz on any cybersecurity topic.' },
  { step: '02', title: 'Choose a game mode',        desc: 'Pick from 8 modes to match the energy you want — competitive, team, or casual.' },
  { step: '03', title: 'Share the code',            desc: 'Players join with a 6-digit code — no account required to play.' },
  { step: '04', title: 'Review results',            desc: 'See individual answers, accuracy heatmaps, and score breakdowns after.' },
];

const TIERS = [
  {
    id: 'free', label: 'Free', price: '$0', color: '#94a3b8',
    features: ['50 players/session', '10 quizzes', '3 game modes', '10 AI generations/mo'],
    cta: 'Get Started', primary: false,
  },
  {
    id: 'educator', label: 'Educator', price: '$8/mo', color: '#6bd348',
    features: ['500 players', 'Unlimited quizzes', 'All 8 modes', 'Unlimited AI', 'PANW question banks'],
    cta: 'Start Educator', primary: true,
  },
  {
    id: 'pro', label: 'Pro', price: '$16/mo', color: '#6bd348',
    features: ['1,000 players', 'Custom branding', 'Priority support', 'Everything in Educator'],
    cta: 'Go Pro', primary: false,
  },
];

export default function CyberQuizLanding() {
  const { user } = useAuthStore();
  const authTarget = user ? `${BASE}/dashboard` : `${BASE}/auth?tab=signup`;

  // Start a Stripe subscription checkout for a paid tier (requires login).
  const startCheckout = async (tier: 'educator' | 'pro') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('qa_token') : null;
    if (!token) {
      window.location.href = `${BASE}/auth?tab=login&redirect=${encodeURIComponent(`${BASE}#pricing`)}`;
      return;
    }
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Could not start checkout. Please try again.');
    } catch {
      alert('Could not start checkout. Please try again.');
    }
  };

  return (
    <div className="cqx-page min-h-screen text-[#f1f5f9]">

      {/* Hero */}
      <section className="cqx-grid relative overflow-hidden px-4 pt-10 pb-16 text-center">
        <div className="relative max-w-4xl mx-auto">
          <div className="cqx-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-[#9be072] mb-6">
            <Star className="w-3.5 h-3.5" /> Cybersecurity Quiz Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-5 leading-tight tracking-tight">
            Learn faster.<br />
            <span className="cqx-gradient-text cqx-text-glow">Play smarter.</span>
          </h1>
          <p className="text-lg text-[#a5b4c8] max-w-2xl mx-auto mb-8">
            Real-time multiplayer quizzes with AI generation, 8 game modes, and curated PANW question banks — built for cybersecurity professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {user ? (
              <Link
                href={`${BASE}/dashboard`}
                className="cqx-btn inline-flex items-center gap-2 text-[#04130c] font-semibold rounded-xl px-8 py-3 text-base cursor-pointer"
              >
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href={`${BASE}/auth?tab=signup`}
                  className="cqx-btn inline-flex items-center gap-2 text-[#04130c] font-semibold rounded-xl px-8 py-3 text-base cursor-pointer"
                >
                  Get Started Free <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`${BASE}/join`}
                  className="inline-flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] text-[#f1f5f9] border border-[#2d2d44] hover:border-[#6bd348]/50 font-semibold rounded-xl px-8 py-3 text-base transition-colors cursor-pointer"
                >
                  Join a Session
                </Link>
              </>
            )}
          </div>

          {/* Stat strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="cqx-card rounded-2xl px-4 py-4">
                <div className="text-xl md:text-2xl font-black cqx-gradient-text">{s.value}</div>
                <div className="text-xs text-[#8b97ad] mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Everything you need to run great quizzes</h2>
          <p className="text-[#a5b4c8]">Designed from the ground up for cybersecurity education.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="cqx-card rounded-2xl p-5"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
                  style={{
                    background: `${f.color}1f`,
                    boxShadow: `inset 0 0 0 1px ${f.color}40, 0 0 26px -8px ${f.color}aa`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-[#f1f5f9] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#a5b4c8] leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-4 py-16 border-y border-white/[0.06] bg-[#070710]/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-3">How it works</h2>
            <p className="text-[#a5b4c8]">From zero to live session in under 2 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="cqx-card rounded-2xl p-5 flex gap-5"
              >
                <div className="text-4xl font-black cqx-gradient-text shrink-0 leading-none">{step.step}</div>
                <div>
                  <h3 className="font-bold text-[#f1f5f9] mb-1">{step.title}</h3>
                  <p className="text-sm text-[#a5b4c8] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Simple pricing</h2>
          <p className="text-[#a5b4c8]">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-6 border transition-all ${
                tier.primary
                  ? 'cqx-ring-popular bg-[#6bd348]/[0.06] md:-translate-y-2'
                  : 'border-[#2d2d44] bg-white/[0.02]'
              }`}
            >
              {tier.primary && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 cqx-btn text-[#04130c] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold mb-1" style={{ color: tier.color }}>{tier.label}</h3>
              <div className="text-3xl font-black text-[#f1f5f9] mb-4">{tier.price}</div>
              <ul className="space-y-2.5 mb-6">
                {tier.features.map(f => (
                  <li key={f} className="text-sm text-[#cbd5e1] flex items-center gap-2.5">
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${tier.color}26` }}
                    >
                      <Check className="w-3 h-3" style={{ color: tier.color }} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {tier.id === 'free' ? (
                <Link
                  href={authTarget}
                  className="w-full inline-flex items-center justify-center rounded-xl font-semibold py-2.5 text-sm transition-colors cursor-pointer bg-white/[0.04] hover:bg-white/[0.09] text-[#f1f5f9] border border-[#2d2d44] hover:border-[#6bd348]/50"
                >
                  {tier.cta}
                </Link>
              ) : (
                <button
                  onClick={() => startCheckout(tier.id as 'educator' | 'pro')}
                  className={`w-full inline-flex items-center justify-center rounded-xl font-semibold py-2.5 text-sm transition-colors cursor-pointer ${
                    tier.primary
                      ? 'cqx-btn text-[#04130c]'
                      : 'bg-white/[0.04] hover:bg-white/[0.09] text-[#f1f5f9] border border-[#2d2d44] hover:border-[#6bd348]/50'
                  }`}
                >
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-16 text-center border-t border-white/[0.06] bg-[#070710]/60">
        <div className="cqx-grid absolute inset-0" aria-hidden />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            Ready to <span className="cqx-gradient-text cqx-text-glow">level up</span> your training?
          </h2>
          <p className="text-[#a5b4c8] mb-7">Join cybersecurity professionals already using CyberQuiz to run better sessions.</p>
          <Link
            href={authTarget}
            className="cqx-btn inline-flex items-center gap-2 text-[#04130c] font-semibold rounded-xl px-10 py-3 text-base cursor-pointer"
          >
            {user ? 'Go to Dashboard' : 'Start for Free'} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#1a1a2e] px-4 py-6 text-center text-sm text-[#6a6a8a]">
        <p>CyberQuiz — a tool by <Link href="/" className="text-[#6bd348] hover:underline">thecyberadviser.com</Link></p>
      </footer>
    </div>
  );
}
