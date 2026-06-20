'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Users, UserPlus, Search, BookOpen, Zap, MessageSquare, AlertCircle, Shield,
} from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

const BASE = '/tools/cyberquiz';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  tier: string;
  role: 'standard' | 'admin';
  isSuperAdmin: boolean;
  createdAt: string | null;
  quizzes: number;
  sessions: number;
  chatbotQuestions: number;
  toolsUsed: string[];
}

interface Summary {
  total: number;
  newThisWeek: number;
  newThisMonth: number;
  tierCounts: Record<string, number>;
  totalQuizzes: number;
  totalSessions: number;
  totalChatbotQuestions: number;
}

const TIER_COLOR: Record<string, string> = {
  free: '#94a3b8', educator: '#06b6d4', pro: '#7c3aed', enterprise: '#FFC300',
};

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('qa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(`${BASE}/auth?tab=login&redirect=${encodeURIComponent(`${BASE}/admin/users`)}`); return; }
    fetch('/api/admin/users', { headers: authHeaders() })
      .then(async (res) => {
        if (res.status === 403) { setAllowed(false); return; }
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load users');
        const data = await res.json();
        setUsers(data.users);
        setSummary(data.summary);
        setAllowed(true);
      })
      .catch((e) => { setError(e.message); setAllowed(true); });
  }, [loading, user, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q));
  }, [users, query]);

  const changeRole = async (u: AdminUser, role: 'standard' | 'admin') => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}/role`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update role');
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading || !user || allowed === null) {
    return <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#7c3aed] animate-spin" /></div>;
  }
  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-[#ef4444] mx-auto mb-3" />
          <p className="text-[#f1f5f9] font-semibold mb-1">Admin access only</p>
          <p className="text-sm text-[#94a3b8] mb-5">This page is restricted to the site owner.</p>
          <button onClick={() => router.push(`${BASE}/dashboard`)} className="text-sm text-[#7c3aed] hover:underline">Back to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#f1f5f9] flex items-center gap-2"><Users className="w-5 h-5 text-[#7c3aed]" /> Global Admin · Users</h1>
            <p className="text-sm text-[#94a3b8]">Everyone signed up across your tools — manage roles &amp; see tool usage</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-start gap-2 text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        {/* Summary cards */}
        {summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={summary.total} color="#7c3aed" />
              <StatCard icon={UserPlus} label="New This Week" value={summary.newThisWeek} color="#22c55e" />
              <StatCard icon={UserPlus} label="New This Month" value={summary.newThisMonth} color="#06b6d4" />
              <StatCard icon={BookOpen} label="Quizzes Created" value={summary.totalQuizzes} color="#FFC300" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.tierCounts).map(([tier, n]) => (
                <span key={tier} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ color: TIER_COLOR[tier] || '#94a3b8', borderColor: `${TIER_COLOR[tier] || '#94a3b8'}40`, background: `${TIER_COLOR[tier] || '#94a3b8'}14` }}>
                  {tier}: {n}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…"
            className="w-full rounded-lg bg-[#1a1a2e] border border-[#2d2d44] pl-9 pr-4 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:border-[#7c3aed]/60" />
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-[#2d2d44] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a2e] text-[#94a3b8]">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">User</th>
                  <th className="text-left font-semibold px-4 py-3">Role</th>
                  <th className="text-left font-semibold px-4 py-3">Tools Used</th>
                  <th className="text-left font-semibold px-4 py-3">Tier</th>
                  <th className="text-left font-semibold px-4 py-3">Signed Up</th>
                  <th className="text-center font-semibold px-4 py-3" title="Quizzes created"><BookOpen className="w-4 h-4 inline" /></th>
                  <th className="text-center font-semibold px-4 py-3" title="Sessions hosted"><Zap className="w-4 h-4 inline" /></th>
                  <th className="text-center font-semibold px-4 py-3" title="Chatbot questions"><MessageSquare className="w-4 h-4 inline" /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-[#64748b] py-10">No users match your search.</td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.id} className="border-t border-[#2d2d44] hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(u.displayName || u.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#f1f5f9] font-medium truncate">{u.displayName || '—'}</p>
                          <p className="text-[#64748b] text-xs truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#FFC300] bg-[#FFC300]/10" title="Site owner — cannot be changed">
                          <Shield className="w-3 h-3" /> Owner
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value as 'standard' | 'admin')}
                          className="rounded-lg bg-[#0f0f1a] border border-[#2d2d44] px-2 py-1 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#7c3aed]/60 cursor-pointer"
                        >
                          <option value="standard">Standard User</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.toolsUsed.length === 0 ? (
                          <span className="text-[#64748b] text-xs">—</span>
                        ) : u.toolsUsed.map((t) => (
                          <span key={t} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#06b6d4] bg-[#06b6d4]/12">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                        style={{ color: TIER_COLOR[u.tier] || '#94a3b8', background: `${TIER_COLOR[u.tier] || '#94a3b8'}18` }}>
                        {u.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-center text-[#cbd5e1]">{u.quizzes}</td>
                    <td className="px-4 py-3 text-center text-[#cbd5e1]">{u.sessions}</td>
                    <td className="px-4 py-3 text-center text-[#cbd5e1]">{u.chatbotQuestions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-[#64748b] flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Quizzes created</span>
          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Sessions hosted</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Chatbot questions</span>
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[#2d2d44] bg-[#1a1a2e] p-4">
      <div className="flex items-center gap-2 text-[#94a3b8] text-xs font-medium mb-2">
        <Icon className="w-4 h-4" style={{ color }} /> {label}
      </div>
      <p className="text-2xl font-bold text-[#f1f5f9]">{value}</p>
    </div>
  );
}
