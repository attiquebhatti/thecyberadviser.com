'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Plus, Trash2, Eye, EyeOff, BookOpen, AlertCircle, X, Upload, CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { atcApi, AdminCourse } from '@/lib/chatbot/api';

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadCourses = useCallback(() => {
    atcApi.adminListCourses().then(setCourses).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/tools/cyberquiz/auth?tab=login&redirect=${encodeURIComponent('/tools/ai-chatbot/admin/cohorts')}`);
      return;
    }
    atcApi.me().then((me) => {
      setIsAdmin(me.isAdmin);
      if (me.isAdmin) loadCourses();
    }).catch(() => setIsAdmin(false));
  }, [loading, user, router, loadCourses]);

  if (loading || !user || isAdmin === null) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-[#FFC300] animate-spin" /></div>;
  }

  if (!isAdmin) {
    return <div className="max-w-md mx-auto px-4 text-center py-16"><p className="text-red-400">Admin access required.</p></div>;
  }

  const toggleListed = async (c: AdminCourse) => {
    try {
      await atcApi.adminUpdateCourse(c.id, { isListed: !c.is_listed });
      loadCourses();
    } catch (e: any) { setError(e.message); }
  };

  const deleteCourse = async (c: AdminCourse) => {
    if (!confirm(`Delete "${c.name}"? This removes all its transcripts, embeddings, and question logs. This cannot be undone.`)) return;
    try {
      await atcApi.adminDeleteCourse(c.id);
      loadCourses();
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-[#FFC300] text-xs font-semibold uppercase tracking-[0.2em] mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tools/ai-chatbot/admin/logs" className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:border-[#FFC300]/40 hover:text-white transition-all">
            Logs
          </Link>
          <Link href="/tools/ai-chatbot/admin/persona" className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:border-[#FFC300]/40 hover:text-white transition-all">
            Persona
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[#0a0e1a] bg-gradient-to-r from-[#FFC300] to-[#FFB703] hover:from-[#FFD60A] hover:to-[#FFC300] transition-all"
          >
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {courses === null ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-[#FFC300] animate-spin" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No courses yet. Create your first one to start uploading transcripts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#FFC300]/80">{c.course_code}</span>
                  {!c.is_listed && <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-white/[0.05] px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                <p className="text-white font-semibold mt-0.5">{c.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {c.published_count} published · {c.transcript_count} total transcript{c.transcript_count === 1 ? '' : 's'}
                  {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/tools/ai-chatbot/admin/upload?course=${c.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 border border-white/10 hover:border-[#FFC300]/40 hover:text-white transition-all"
                  title="Upload transcripts"
                >
                  <Upload className="w-4 h-4" /> Transcripts
                </Link>
                <button onClick={() => toggleListed(c)} title={c.is_listed ? 'Hide from students' : 'Make visible'}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  {c.is_listed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteCourse(c)} title="Delete course"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadCourses(); }}
        />
      )}
    </div>
  );
}

function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await atcApi.adminCreateCourse({
        name: name.trim(),
        courseCode: courseCode.trim(),
        expiresAt: expiresAt || null,
      });
      onCreated();
    } catch (e: any) {
      setError(e.message); setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#11161f] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">New Course</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Course Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. PCNSE Prep — June Batch"
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FFC300]/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Course Code</label>
            <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required placeholder="e.g. PCNSE"
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FFC300]/50 uppercase" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Access Expiry <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-4 py-2.5 text-white focus:outline-none focus:border-[#FFC300]/50" />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#0a0e1a] bg-gradient-to-r from-[#FFC300] to-[#FFB703] hover:from-[#FFD60A] hover:to-[#FFC300] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><CheckCircle2 className="w-4 h-4" /> Create</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
