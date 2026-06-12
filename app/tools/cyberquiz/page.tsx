'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy, BarChart3, Brain, Shield, Star, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

const BASE = '/tools/cyberquiz';

const FEATURES = [
  { icon: Zap,      color: '#7c3aed', title: '8 Game Modes',          desc: 'From Classic Blitz to Battle Royale and Gold Rush — every session is unique.' },
  { icon: Brain,    color: '#06b6d4', title: 'AI Quiz Generation',     desc: 'Generate full quizzes in seconds from any topic using Groq AI.' },
  { icon: Users,    color: '#22c55e', title: 'Live Multiplayer',       desc: 'Real-time Socket.io gameplay. Host or join with a 6-digit code.' },
  { icon: Shield,   color: '#f59e0b', title: 'PANW Question Banks',    desc: 'Curated PCNSE, XDR, XSIAM, Prisma and more — built for cybersecurity pros.' },
  { icon: BarChart3,color: '#ef4444', title: 'Full Analytics',         desc: 'Session heatmaps, performance trends, and per-question accuracy.' },
  { icon: Trophy,   color: '#818cf8', title: 'Live Leaderboards',      desc: 'Dynamic rank changes and real-time score updates keep players engaged.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create or generate a quiz', desc: 'Build from scratch or let AI generate a quiz on any cybersecurity topic.' },
  { step: '02', title: 'Choose a game mode',        desc: 'Pick from 8 modes to match the energy you want — competitive, team, or casual.' },
  { step: '03', title: 'Share the code',            desc: 'Players join with a 6-digit code — no account required to play.' },
  { step: '04', title: 'Review results',            desc: 'See individual answers, accuracy heatmaps, and score breakdowns after.' },
];

const TIERS = [
  {
    id: 'free', label: 'Free', price: '$0', color: '#6b7280',
    features: ['50 players/session', '10 quizzes', '3 game modes', '10 AI generations/mo'],
    cta: 'Get Started', primary: false,
  },
  {
    id: 'educator', label: 'Educator', price: '$8/mo', color: '#7c3aed',
    features: ['500 players', 'Unlimited quizzes', 'All 8 modes', 'Unlimited AI', 'PANW question banks'],
    cta: 'Start Educator', primary: true,
  },
  {
    id: 'pro', label: 'Pro', price: '$16/mo', color: '#06b6d4',
    features: ['1,000 players', 'Custom branding', 'Priority support', 'Everything in Educator'],
    cta: 'Go Pro', primary: false,
  },
];

export default function CyberQuizLanding() {
  const { user } = useAuthStore();
  const authTarget = user ? `${BASE}/dashboard` : `${BASE}/auth?tab=signup`;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-[#f1f5f9]">

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-8 pb-14 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-[#7c3aed]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-sm text-[#a78bfa] mb-5">
            <Star className="w-3.5 h-3.5" /> Cybersecurity Quiz Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-5 leading-tight">
            Learn faster.<br />
            <span className="cq-gradient-text">Play smarter.</span>
          </h1>
          <p className="text-lg text-[#94a3b8] max-w-2xl mx-auto mb-8">
            Real-time multiplayer quizzes with AI generation, 8 game modes, and curated PANW question banks — built for cybersecurity professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {user ? (
              <Link
                href={`${BASE}/dashboard`}
                className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-8 py-3 text-base transition-colors"
              >
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href={`${BASE}/auth?tab=signup`}
                  className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-8 py-3 text-base transition-colors"
                >
                  Get Started Free <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`${BASE}/join`}
                  className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-[#f1f5f9] border border-[#2d2d44] font-semibold rounded-lg px-8 py-3 text-base transition-colors"
                >
                  Join a Session
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-14 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Everything you need to run great quizzes</h2>
          <p className="text-[#94a3b8]">Designed from the ground up for cybersecurity education.</p>
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
                className="glass glass-hover rounded-2xl p-5"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-[#f1f5f9] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-14 bg-[#080810]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-3">How it works</h2>
            <p className="text-[#94a3b8]">From zero to live session in under 2 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5"
              >
                <div className="text-4xl font-black text-[#2d2d44] shrink-0">{step.step}</div>
                <div>
                  <h3 className="font-bold text-[#f1f5f9] mb-1">{step.title}</h3>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-14 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Simple pricing</h2>
          <p className="text-[#94a3b8]">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl p-6 border-2 transition-all ${tier.primary ? 'border-[#7c3aed] bg-[#7c3aed]/5' : 'border-[#2d2d44] bg-[#1a1a2e]'}`}
            >
              {tier.primary && (
                <div className="text-xs font-bold text-[#a78bfa] uppercase tracking-wider mb-2">Most Popular</div>
              )}
              <h3 className="text-xl font-bold mb-1" style={{ color: tier.color }}>{tier.label}</h3>
              <div className="text-3xl font-black text-[#f1f5f9] mb-4">{tier.price}</div>
              <ul className="space-y-2 mb-5">
                {tier.features.map(f => (
                  <li key={f} className="text-sm text-[#94a3b8] flex items-center gap-2">
                    <span className="text-[#22c55e]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={authTarget}
                className={`w-full inline-flex items-center justify-center rounded-lg font-semibold py-2 text-sm transition-colors ${
                  tier.primary
                    ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'
                    : 'bg-transparent hover:bg-white/10 text-[#f1f5f9] border border-[#2d2d44]'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-14 text-center bg-[#080810]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            Ready to level up your training?
          </h2>
          <p className="text-[#94a3b8] mb-7">Join cybersecurity professionals already using CyberQuiz to run better sessions.</p>
          <Link
            href={authTarget}
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-10 py-3 text-base transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Start for Free'} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#1a1a2e] px-4 py-6 text-center text-sm text-[#4a4a6a]">
        <p>CyberQuiz — a tool by <Link href="/" className="text-[#7c3aed] hover:underline">thecyberadviser.com</Link></p>
      </footer>
    </div>
  );
}
