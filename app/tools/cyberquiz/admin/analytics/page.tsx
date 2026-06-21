'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Activity, Users, UserPlus, MousePointerClick, Eye,
  Globe, FileText, Radio, AlertCircle, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

const BASE = '/tools/cyberquiz';

interface Insights {
  activeNow: number;
  totals: { activeUsers: number; newUsers: number; sessions: number; pageViews: number };
  trend: { date: string; users: number }[];
  topPages: { path: string; views: number }[];
  topCountries: { country: string; users: number }[];
  channels: { channel: string; sessions: number }[];
  rangeDays: number;
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('qa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState(28);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(`${BASE}/auth?tab=login&redirect=${encodeURIComponent(`${BASE}/admin/analytics`)}`); return; }
    fetch(`/api/admin/analytics?days=${days}`, { headers: authHeaders() })
      .then(async (res) => {
        if (res.status === 403) { setAllowed(false); return; }
        const data = await res.json();
        setAllowed(true);
        if (data.configured === false) { setConfigured(false); return; }
        if (data.error) { setError(data.error); return; }
        setConfigured(true);
        setInsights(data.insights);
      })
      .catch((e) => { setError(e.message); setAllowed(true); });
  }, [loading, user, router, days]);

  if (loading || !user || allowed === null) {
    return <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#10b981] animate-spin" /></div>;
  }
  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-[#ef4444] mx-auto mb-3" />
          <p className="text-[#f1f5f9] font-semibold mb-1">Admin access only</p>
          <button onClick={() => router.push(`${BASE}/dashboard`)} className="text-sm text-[#10b981] hover:underline">Back to dashboard</button>
        </div>
      </div>
    );
  }

  const maxTrend = insights ? Math.max(1, ...insights.trend.map((t) => t.users)) : 1;

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#f1f5f9] flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#10b981]" /> Website Traffic</h1>
              <p className="text-sm text-[#94a3b8]">Live insights from Google Analytics</p>
            </div>
          </div>
          {configured && (
            <select value={days} onChange={(e) => { setInsights(null); setDays(parseInt(e.target.value, 10)); }}
              className="rounded-lg bg-[#0f0f1a] border border-[#2d2d44] px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#10b981]/60">
              <option value={7}>Last 7 days</option>
              <option value={28}>Last 28 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {!configured ? (
          <div className="rounded-xl border border-[#FFC300]/30 bg-[#FFC300]/[0.05] p-6 text-center">
            <Radio className="w-8 h-8 text-[#FFC300] mx-auto mb-3" />
            <p className="text-[#f1f5f9] font-semibold mb-1">Google Analytics not connected yet</p>
            <p className="text-sm text-[#94a3b8]">Add your GA4 service-account credentials to enable this dashboard.</p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        ) : !insights ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-[#10b981] animate-spin" /></div>
        ) : (
          <>
            {/* Realtime + headline stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/[0.06] p-4">
                <div className="flex items-center gap-2 text-[#22c55e] text-xs font-medium mb-2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" /></span>
                  Active Now
                </div>
                <p className="text-2xl font-bold text-[#f1f5f9]">{insights.activeNow}</p>
              </div>
              <Stat icon={Users} label="Active Users" value={insights.totals.activeUsers} color="#10b981" />
              <Stat icon={UserPlus} label="New Users" value={insights.totals.newUsers} color="#06b6d4" />
              <Stat icon={MousePointerClick} label="Sessions" value={insights.totals.sessions} color="#FFC300" />
              <Stat icon={Eye} label="Page Views" value={insights.totals.pageViews} color="#ec4899" />
            </div>

            {/* Trend */}
            <div className="rounded-xl border border-[#2d2d44] bg-[#1a1a2e] p-5">
              <p className="text-sm font-semibold text-[#f1f5f9] mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#10b981]" /> Daily Active Users</p>
              <div className="flex items-end gap-1 h-40">
                {insights.trend.map((t) => (
                  <div key={t.date} className="flex-1 group relative flex flex-col justify-end items-center">
                    <div className="w-full rounded-t bg-gradient-to-t from-[#10b981] to-[#a855f7] transition-all hover:opacity-80"
                      style={{ height: `${(t.users / maxTrend) * 100}%`, minHeight: t.users > 0 ? '2px' : '0' }} />
                    <span className="absolute -top-6 text-[10px] text-[#cbd5e1] opacity-0 group-hover:opacity-100 whitespace-nowrap bg-[#0f0f1a] px-1.5 py-0.5 rounded border border-[#2d2d44]">
                      {t.users} · {t.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top pages */}
              <Panel icon={FileText} title="Top Pages">
                {insights.topPages.map((p) => (
                  <Row key={p.path} left={p.path} right={p.views.toLocaleString()} />
                ))}
              </Panel>
              {/* Countries */}
              <Panel icon={Globe} title="Top Countries">
                {insights.topCountries.map((c) => (
                  <Row key={c.country} left={c.country} right={c.users.toLocaleString()} />
                ))}
              </Panel>
            </div>

            {/* Channels */}
            <Panel icon={Radio} title="Traffic Sources">
              {insights.channels.map((c) => (
                <Row key={c.channel} left={c.channel} right={c.sessions.toLocaleString()} />
              ))}
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[#2d2d44] bg-[#1a1a2e] p-4">
      <div className="flex items-center gap-2 text-[#94a3b8] text-xs font-medium mb-2"><Icon className="w-4 h-4" style={{ color }} /> {label}</div>
      <p className="text-2xl font-bold text-[#f1f5f9]">{value.toLocaleString()}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#2d2d44] bg-[#1a1a2e] p-5">
      <p className="text-sm font-semibold text-[#f1f5f9] mb-3 flex items-center gap-2"><Icon className="w-4 h-4 text-[#10b981]" /> {title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-[#2d2d44]/50 last:border-0">
      <span className="text-[#cbd5e1] truncate">{left || '—'}</span>
      <span className="text-[#94a3b8] font-medium shrink-0">{right}</span>
    </div>
  );
}
