'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Download, ThumbsUp, ThumbsDown, ChevronDown, AlertCircle, Filter,
} from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { atcApi, AdminCourse, QuestionLog, LogFilters } from '@/lib/chatbot/api';

export default function AdminLogsPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [rows, setRows] = useState<QuestionLog[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const [filters, setFilters] = useState<LogFilters>({ feedback: '', limit: 50, offset: 0 });

  const load = useCallback((f: LogFilters) => {
    atcApi.adminLogs(f).then((d) => { setRows(d.rows); setTotal(d.total); }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/tools/cyberquiz/auth?tab=login&redirect=${encodeURIComponent('/tools/ai-chatbot/admin/logs')}`);
      return;
    }
    atcApi.me().then((me) => {
      setIsAdmin(me.isAdmin);
      if (me.isAdmin) {
        atcApi.adminListCourses().then(setCourses).catch(() => {});
        load(filters);
      }
    }).catch(() => setIsAdmin(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, router]);

  const applyFilter = (patch: Partial<LogFilters>) => {
    const next = { ...filters, ...patch, offset: 0 };
    setFilters(next);
    load(next);
  };

  if (loading || !user || isAdmin === null) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-[#FFC300] animate-spin" /></div>;
  }
  if (!isAdmin) {
    return <div className="max-w-md mx-auto px-4 text-center py-16"><p className="text-red-400">Admin access required.</p></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <Link href="/tools/ai-chatbot/admin/cohorts" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-[#FFC300] text-xs font-semibold uppercase tracking-[0.2em] mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-white">Question Logs <span className="text-slate-500 text-base font-normal">({total})</span></h1>
        </div>
        <a href={atcApi.adminLogsExportUrl(filters)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 border border-white/10 hover:border-[#FFC300]/40 transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap text-sm">
        <Filter className="w-4 h-4 text-slate-500" />
        <select value={filters.course ?? ''} onChange={(e) => applyFilter({ course: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          className="rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-white focus:outline-none focus:border-[#FFC300]/50">
          <option value="" className="bg-[#11161f]">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id} className="bg-[#11161f]">{c.course_code}</option>)}
        </select>
        <select value={filters.feedback ?? ''} onChange={(e) => applyFilter({ feedback: e.target.value as any })}
          className="rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-white focus:outline-none focus:border-[#FFC300]/50">
          <option value="" className="bg-[#11161f]">All feedback</option>
          <option value="1" className="bg-[#11161f]">👍 Thumbs up</option>
          <option value="-1" className="bg-[#11161f]">👎 Thumbs down</option>
          <option value="0" className="bg-[#11161f]">No feedback</option>
        </select>
        <input type="date" value={filters.from ?? ''} onChange={(e) => applyFilter({ from: e.target.value })}
          className="rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-white focus:outline-none focus:border-[#FFC300]/50" />
        <span className="text-slate-600">→</span>
        <input type="date" value={filters.to ?? ''} onChange={(e) => applyFilter({ to: e.target.value })}
          className="rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-white focus:outline-none focus:border-[#FFC300]/50" />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12">No questions logged yet for this filter.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#FFC300]/80">{r.course_code ?? '—'}</span>
                    {r.feedback === 1 && <ThumbsUp className="w-3 h-3 text-[#22c55e]" />}
                    {r.feedback === -1 && <ThumbsDown className="w-3 h-3 text-red-400" />}
                    <span className="text-[11px] text-slate-600">{new Date(r.created_at).toLocaleString()}</span>
                    {r.user_email && <span className="text-[11px] text-slate-600">· {r.user_email}</span>}
                  </div>
                  <p className="text-sm text-white mt-1 truncate">{r.question}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} />
              </button>
              {expanded === r.id && (
                <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-3 mb-1">Question</p>
                  <p className="text-sm text-slate-200">{r.question}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-3 mb-1">Response</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{r.response}</p>
                  {r.sources && r.sources.length > 0 && (
                    <p className="text-xs text-slate-500 mt-3">Sources: {r.sources.map((s) => `Session ${s.session}`).join(', ')}</p>
                  )}
                  {r.feedback_text && (
                    <p className="text-xs text-slate-400 mt-2 italic">Feedback note: “{r.feedback_text}”</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > (filters.limit ?? 50) && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={(filters.offset ?? 0) === 0}
            onClick={() => { const f = { ...filters, offset: Math.max(0, (filters.offset ?? 0) - (filters.limit ?? 50)) }; setFilters(f); load(f); }}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-300 border border-white/10 disabled:opacity-30 hover:bg-white/5">Prev</button>
          <span className="text-xs text-slate-500">{(filters.offset ?? 0) + 1}–{Math.min((filters.offset ?? 0) + (filters.limit ?? 50), total)} of {total}</span>
          <button disabled={(filters.offset ?? 0) + (filters.limit ?? 50) >= total}
            onClick={() => { const f = { ...filters, offset: (filters.offset ?? 0) + (filters.limit ?? 50) }; setFilters(f); load(f); }}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-300 border border-white/10 disabled:opacity-30 hover:bg-white/5">Next</button>
        </div>
      )}
    </div>
  );
}
