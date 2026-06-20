'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Upload, FileText, CheckCircle2, AlertCircle, Clock, X, Trash2, ArrowLeft, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { atcApi, AdminCourse, AdminTranscript } from '@/lib/chatbot/api';

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  pending:        { label: 'Pending',     color: '#94a3b8', icon: Clock },
  review_needed:  { label: 'Review',      color: '#FFC300', icon: FileText },
  processing:     { label: 'Processing',  color: '#3b82f6', icon: Loader2 },
  published:      { label: 'Published',   color: '#22c55e', icon: CheckCircle2 },
  failed:         { label: 'Failed',      color: '#ef4444', icon: AlertCircle },
};

function UploadPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuthStore();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [transcripts, setTranscripts] = useState<AdminTranscript[]>([]);
  const [error, setError] = useState('');
  const [reviewId, setReviewId] = useState<number | null>(null);

  const loadTranscripts = useCallback((cid: number) => {
    atcApi.adminListTranscripts(cid).then(setTranscripts).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/tools/cyberquiz/auth?tab=login&redirect=${encodeURIComponent('/tools/ai-chatbot/admin/upload')}`);
      return;
    }
    atcApi.me().then((me) => {
      setIsAdmin(me.isAdmin);
      if (me.isAdmin) {
        atcApi.adminListCourses().then((cs) => {
          setCourses(cs);
          const pre = parseInt(params.get('course') || '', 10);
          const initial = !isNaN(pre) && cs.some((c) => c.id === pre) ? pre : cs[0]?.id ?? null;
          setCourseId(initial);
          if (initial) loadTranscripts(initial);
        }).catch((e) => setError(e.message));
      }
    }).catch(() => setIsAdmin(false));
  }, [loading, user, router, params, loadTranscripts]);

  // Poll while any transcript is processing.
  useEffect(() => {
    if (!courseId) return;
    const anyProcessing = transcripts.some((t) => t.status === 'processing');
    if (!anyProcessing) return;
    const timer = setInterval(() => loadTranscripts(courseId), 2500);
    return () => clearInterval(timer);
  }, [transcripts, courseId, loadTranscripts]);

  if (loading || !user || isAdmin === null) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-[#FFC300] animate-spin" /></div>;
  }
  if (!isAdmin) {
    return <div className="max-w-md mx-auto px-4 text-center py-16"><p className="text-red-400">Admin access required.</p></div>;
  }

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <Link href="/tools/ai-chatbot/admin/cohorts" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <p className="text-[#FFC300] text-xs font-semibold uppercase tracking-[0.2em] mb-1">Admin</p>
      <h1 className="text-2xl font-bold text-white mb-6">Transcripts</h1>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {/* Course selector */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Course</label>
        <select
          value={courseId ?? ''}
          onChange={(e) => { const id = parseInt(e.target.value, 10); setCourseId(id); loadTranscripts(id); }}
          className="w-full sm:w-auto rounded-lg bg-white/[0.04] border border-white/[0.1] px-4 py-2.5 text-white focus:outline-none focus:border-[#FFC300]/50"
        >
          {courses.map((c) => <option key={c.id} value={c.id} className="bg-[#11161f]">{c.course_code} — {c.name}</option>)}
        </select>
      </div>

      {courseId && (
        <UploadForm
          courseId={courseId}
          nextSession={(transcripts.reduce((max, t) => Math.max(max, t.session_number), 0)) + 1}
          onUploaded={() => loadTranscripts(courseId)}
          onError={setError}
        />
      )}

      {/* Transcript list */}
      <div className="mt-8 space-y-3">
        {transcripts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No transcripts uploaded for this course yet.</p>
        ) : (
          transcripts.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.pending;
            const Icon = meta.icon;
            return (
              <div key={t.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">Session {t.session_number}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${meta.color}1a`, color: meta.color }}>
                      <Icon className={`w-3 h-3 ${t.status === 'processing' ? 'animate-spin' : ''}`} /> {meta.label}
                    </span>
                  </div>
                  <p className="text-white font-medium mt-1 truncate">{t.title || t.file_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.text_length ? `${t.text_length.toLocaleString()} chars` : '—'}
                    {t.chunk_count > 0 && ` · ${t.chunk_count} chunks`}
                    {t.status === 'failed' && t.processing_error && <span className="text-red-400"> · {t.processing_error}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(t.status === 'review_needed' || t.status === 'published' || t.status === 'failed') && (
                    <button onClick={() => setReviewId(t.id)} className="px-3 py-2 rounded-lg text-sm text-slate-300 border border-white/10 hover:border-[#FFC300]/40 hover:text-white transition-all">
                      {t.status === 'published' ? 'View' : 'Review & Publish'}
                    </button>
                  )}
                  <button onClick={async () => {
                    if (!confirm('Delete this transcript and its embeddings?')) return;
                    try { await atcApi.adminDeleteTranscript(t.id); loadTranscripts(courseId!); } catch (e: any) { setError(e.message); }
                  }} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {reviewId !== null && (
        <ReviewModal
          transcriptId={reviewId}
          onClose={() => setReviewId(null)}
          onChanged={() => { if (courseId) loadTranscripts(courseId); }}
        />
      )}

      {selectedCourse && !selectedCourse.is_listed && (
        <p className="mt-8 text-xs text-slate-500 text-center">
          This course is <span className="text-[#FFC300]">hidden</span> — only you can see and query it until you make it visible.
        </p>
      )}
    </div>
  );
}

function UploadForm({ courseId, nextSession, onUploaded, onError }: {
  courseId: number; nextSession: number; onUploaded: () => void; onError: (e: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [sessionNumber, setSessionNumber] = useState(nextSession);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setSessionNumber(nextSession); }, [nextSession]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { onError('Select a file first.'); return; }
    setUploading(true); onError('');
    try {
      const fd = new FormData();
      fd.set('cohortId', String(courseId));
      fd.set('sessionNumber', String(sessionNumber));
      fd.set('title', title);
      fd.set('file', file);
      await atcApi.adminUploadTranscript(fd);
      setFile(null); setTitle('');
      onUploaded();
    } catch (e: any) {
      onError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Session #</label>
          <input type="number" min={1} value={sessionNumber} onChange={(e) => setSessionNumber(parseInt(e.target.value, 10) || 1)}
            className="w-24 rounded-lg bg-white/[0.04] border border-white/[0.1] px-4 py-2.5 text-white focus:outline-none focus:border-[#FFC300]/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Title <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Day 1 — Architecture & Deployment"
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FFC300]/50" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-300 border border-white/10 hover:border-[#FFC300]/40 cursor-pointer transition-all">
          <FileText className="w-4 h-4" />
          {file ? file.name : 'Choose file (.txt, .pdf, .docx)'}
          <input type="file" accept=".txt,.vtt,.pdf,.docx" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button type="submit" disabled={uploading || !file}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[#0a0e1a] bg-gradient-to-r from-[#FFC300] to-[#FFB703] hover:from-[#FFD60A] hover:to-[#FFC300] transition-all disabled:opacity-40">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
        </button>
      </div>
    </form>
  );
}

function ReviewModal({ transcriptId, onClose, onChanged }: { transcriptId: number; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    atcApi.adminGetTranscript(transcriptId).then((d) => { setDetail(d); setText(d.raw_text || ''); }).catch((e) => setError(e.message));
  }, [transcriptId]);

  useEffect(() => { load(); }, [load]);

  // Poll while processing so the modal reflects publish completion.
  useEffect(() => {
    if (detail?.status !== 'processing') return;
    const timer = setInterval(load, 2500);
    return () => clearInterval(timer);
  }, [detail?.status, load]);

  if (!detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative"><Loader2 className="w-6 h-6 text-[#FFC300] animate-spin" /></div>
      </div>
    );
  }

  const published = detail.status === 'published';
  const processing = detail.status === 'processing';

  const saveEdits = async () => {
    setBusy(true); setError('');
    try { await atcApi.adminUpdateTranscript(transcriptId, { rawText: text }); await load(); onChanged(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const publish = async () => {
    setBusy(true); setError('');
    try {
      await atcApi.adminUpdateTranscript(transcriptId, { rawText: text });
      await atcApi.adminPublishTranscript(transcriptId);
      await load(); onChanged();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.1] bg-[#11161f] shadow-2xl flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-bold text-white">Session {detail.session_number}{detail.title ? ` — ${detail.title}` : ''}</h2>
            <p className="text-xs text-slate-500">{detail.status === 'published' ? `Published · ${detail.chunk_count} chunks` : 'Review the extracted text, then publish'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={published || processing}
            spellCheck={false}
            className="w-full h-[50vh] rounded-lg bg-black/30 border border-white/[0.08] p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-[#FFC300]/40 resize-none"
          />
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mt-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
          {processing ? (
            <span className="inline-flex items-center gap-2 text-sm text-blue-400"><Loader2 className="w-4 h-4 animate-spin" /> Embedding… this can take a minute</span>
          ) : published ? (
            <span className="inline-flex items-center gap-2 text-sm text-[#22c55e]"><CheckCircle2 className="w-4 h-4" /> Published & queryable</span>
          ) : (
            <>
              <button onClick={saveEdits} disabled={busy} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50">
                Save Edits
              </button>
              <button onClick={publish} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#0a0e1a] bg-gradient-to-r from-[#FFC300] to-[#FFB703] hover:from-[#FFD60A] hover:to-[#FFC300] transition-all disabled:opacity-50">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Working…</> : <><CheckCircle2 className="w-4 h-4" /> Publish</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-[#FFC300] animate-spin" /></div>}>
      <UploadPageInner />
    </Suspense>
  );
}
