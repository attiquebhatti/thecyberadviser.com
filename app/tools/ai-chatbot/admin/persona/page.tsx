'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, AlertCircle, CheckCircle2, History, RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { atcApi, PersonaVersion } from '@/lib/chatbot/api';

export default function AdminPersonaPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [active, setActive] = useState<PersonaVersion | null>(null);
  const [history, setHistory] = useState<PersonaVersion[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    atcApi.adminGetPersona().then((d) => {
      setActive(d.active);
      setHistory(d.history);
      setText(d.active?.prompt_text || '');
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/tools/cyberquiz/auth?tab=login&redirect=${encodeURIComponent('/tools/ai-chatbot/admin/persona')}`);
      return;
    }
    atcApi.me().then((me) => { setIsAdmin(me.isAdmin); if (me.isAdmin) load(); }).catch(() => setIsAdmin(false));
  }, [loading, user, router, load]);

  if (loading || !user || isAdmin === null) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-[#FFC300] animate-spin" /></div>;
  }
  if (!isAdmin) {
    return <div className="max-w-md mx-auto px-4 text-center py-16"><p className="text-red-400">Admin access required.</p></div>;
  }

  const dirty = text.trim() !== (active?.prompt_text || '').trim();

  const publish = async () => {
    setBusy(true); setError(''); setSaved(false);
    try {
      await atcApi.adminPublishPersona(text);
      load();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <Link href="/tools/ai-chatbot/admin/cohorts" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <p className="text-[#FFC300] text-xs font-semibold uppercase tracking-[0.2em] mb-1">Admin</p>
      <h1 className="text-2xl font-bold text-white mb-2">Persona / System Prompt</h1>
      <p className="text-sm text-slate-400 mb-6">
        Controls the bot&apos;s voice and grounding rules across all courses. Publishing creates a new active version; the previous one is kept in history.
      </p>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="w-full h-[44vh] rounded-xl bg-black/30 border border-white/[0.08] p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-[#FFC300]/40 resize-none"
      />

      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <div className="text-xs text-slate-500">
          {active ? `Active version #${active.id} · published ${new Date(active.created_at).toLocaleString()}` : 'No active version'}
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="inline-flex items-center gap-1.5 text-sm text-[#22c55e]"><CheckCircle2 className="w-4 h-4" /> Published</span>}
          {dirty && (
            <button onClick={() => setText(active?.prompt_text || '')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-all">
              <RotateCcw className="w-4 h-4" /> Revert
            </button>
          )}
          <button onClick={publish} disabled={busy || !dirty || !text.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0a0e1a] bg-gradient-to-r from-[#FFC300] to-[#FFB703] hover:from-[#FFD60A] hover:to-[#FFC300] transition-all disabled:opacity-40">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><CheckCircle2 className="w-4 h-4" /> Publish New Version</>}
          </button>
        </div>
      </div>

      {/* Version history */}
      {history.length > 1 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><History className="w-4 h-4 text-[#FFC300]" /> Version History</h2>
          <div className="space-y-2">
            {history.map((v) => (
              <details key={v.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
                <summary className="px-4 py-3 cursor-pointer flex items-center gap-2 text-sm">
                  <span className="font-medium text-white">Version #{v.id}</span>
                  {v.is_active && <span className="text-[10px] font-semibold uppercase tracking-wide text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full">Active</span>}
                  <span className="text-xs text-slate-500 ml-auto">{new Date(v.created_at).toLocaleString()} · {v.created_by}</span>
                </summary>
                <div className="px-4 pb-4">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-3 mt-2 max-h-60 overflow-y-auto">{v.prompt_text}</pre>
                  {!v.is_active && (
                    <button onClick={() => setText(v.prompt_text)} className="mt-2 text-xs text-[#FFC300] hover:underline">
                      Load into editor
                    </button>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
