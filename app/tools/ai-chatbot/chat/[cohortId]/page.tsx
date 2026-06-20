'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Loader2, Send, ArrowLeft, ThumbsUp, ThumbsDown, ChevronDown, BookOpen, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { atcApi, streamChat, sendFeedback, ChatSource } from '@/lib/chatbot/api';
import { courseLogo } from '@/lib/chatbot/courseLogos';

// Explicit markdown styling (Tailwind's reset strips list markers, and the
// typography plugin isn't installed — so we style each element directly).
const MD = {
  h1: (p: any) => <h3 className="text-base font-bold text-white mt-3 mb-1.5" {...p} />,
  h2: (p: any) => <h3 className="text-base font-bold text-white mt-3 mb-1.5" {...p} />,
  h3: (p: any) => <h4 className="text-[15px] font-bold text-white mt-3 mb-1.5" {...p} />,
  p:  (p: any) => <p className="my-2" {...p} />,
  ul: (p: any) => <ul className="list-disc pl-5 my-2 space-y-1 marker:text-[#FFC300]" {...p} />,
  ol: (p: any) => <ol className="list-decimal pl-5 my-2 space-y-1 marker:text-[#FFC300] marker:font-semibold" {...p} />,
  li: (p: any) => <li className="pl-1 leading-relaxed" {...p} />,
  strong: (p: any) => <strong className="font-bold text-white" {...p} />,
  em: (p: any) => <em className="italic text-slate-300" {...p} />,
  code: (p: any) => <code className="px-1.5 py-0.5 rounded bg-black/40 text-[#FFC300] text-[13px] font-mono" {...p} />,
  a: (p: any) => <a className="text-[#FFC300] underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...p} />,
  blockquote: (p: any) => <blockquote className="border-l-2 border-[#FFC300]/40 pl-3 italic text-slate-400 my-2" {...p} />,
};

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  logId?: number | null;
  feedback?: 1 | -1;
  streaming?: boolean;
}

export default function ChatPage() {
  const params = useParams<{ cohortId: string }>();
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const cohortId = parseInt(params.cohortId, 10);

  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [accessError, setAccessError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/tools/cyberquiz/auth?tab=login&redirect=${encodeURIComponent(`/tools/ai-chatbot/chat/${params.cohortId}`)}`);
      return;
    }
    // Resolve the course name (from the catalog the user can see).
    atcApi.courses()
      .then((cs) => {
        const c = cs.find((x) => x.id === cohortId);
        if (c) { setCourseName(`${c.course_code} — ${c.name}`); setCourseCode(c.course_code); }
        else {
          // Could be a hidden course the admin is viewing; fall back to a generic label.
          atcApi.me().then((me) => { if (!me.isAdmin) setAccessError('This course is not available.'); });
        }
      })
      .catch(() => {});
  }, [loading, user, router, cohortId, params.cohortId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || sending) return;

    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setSending(true);

    // All updaters below are PURE (no mutation of existing message objects) so
    // React 18 StrictMode's double-invocation can't double-append tokens.
    const patchLast = (patch: (m: Msg) => Msg) => setMessages((prev) => {
      if (prev.length === 0) return prev;
      const lastIdx = prev.length - 1;
      if (prev[lastIdx].role !== 'assistant') return prev;
      const next = prev.slice();
      next[lastIdx] = patch(next[lastIdx]);
      return next;
    });

    try {
      const logId = await streamChat(cohortId, q, history, {
        onToken: (t) => patchLast((m) => ({ ...m, content: m.content + t })),
        onSources: (s) => patchLast((m) => ({ ...m, sources: s })),
      });
      patchLast((m) => ({ ...m, streaming: false, logId }));
    } catch (err: any) {
      patchLast((m) => ({ ...m, content: `Error: ${err.message}`, streaming: false }));
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, cohortId]);

  const rate = async (idx: number, value: 1 | -1) => {
    const msg = messages[idx];
    if (!msg.logId) return;
    try {
      await sendFeedback(msg.logId, value);
      setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, feedback: value } : m)));
    } catch { /* non-fatal */ }
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-[#FFC300] animate-spin" /></div>;
  }
  if (accessError) {
    return (
      <div className="max-w-md mx-auto px-4 text-center py-16">
        <p className="text-red-400 mb-4">{accessError}</p>
        <Link href="/tools/ai-chatbot" className="text-sm text-[#FFC300] hover:underline">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      <div className="flex items-center gap-3 py-4 border-b border-white/[0.06]">
        <Link href="/tools/ai-chatbot" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        {courseCode && (
          <img src={courseLogo(courseCode)} alt="" className="h-7 w-auto max-w-[120px] object-contain shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FFC300]">AI Training Chatbot</p>
          <p className="text-white font-semibold truncate">{courseName || `Course #${cohortId}`}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-8 h-8 text-[#FFC300]/60 mx-auto mb-4" />
            <p className="text-slate-400">Ask a question about anything covered in this course.</p>
            <p className="text-xs text-slate-600 mt-2">Answers come only from the session transcripts, with citations.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {m.role === 'user' ? (
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#FFC300] text-[#0a0e1a] px-4 py-2.5 font-medium">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[88%] w-full">
                <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-slate-200">
                  {m.content === '' && m.streaming ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFC300]" />
                  ) : (
                    <div className="text-[15px] leading-relaxed space-y-2.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{m.content}</ReactMarkdown>
                    </div>
                  )}
                  {m.sources && m.sources.length > 0 && <SourcesBlock sources={m.sources} />}
                </div>
                {!m.streaming && m.logId && (
                  <div className="flex items-center gap-1 mt-1.5 ml-1">
                    <button onClick={() => rate(i, 1)} className={`p-1.5 rounded-md transition-all ${m.feedback === 1 ? 'text-[#22c55e]' : 'text-slate-600 hover:text-slate-300'}`}>
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => rate(i, -1)} className={`p-1.5 rounded-md transition-all ${m.feedback === -1 ? 'text-red-400' : 'text-slate-600 hover:text-slate-300'}`}>
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="py-4 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }}
            placeholder="Ask about the course…"
            rows={1}
            className="flex-1 resize-none rounded-xl bg-white/[0.04] border border-white/[0.1] px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FFC300]/50 max-h-32"
          />
          <button type="submit" disabled={sending || !input.trim()}
            className="p-3 rounded-xl text-[#0a0e1a] bg-gradient-to-r from-[#FFC300] to-[#FFB703] hover:from-[#FFD60A] hover:to-[#FFC300] transition-all disabled:opacity-40 shrink-0">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function SourcesBlock({ sources }: { sources: ChatSource[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
        <BookOpen className="w-3.5 h-3.5" />
        {sources.length} source{sources.length === 1 ? '' : 's'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {sources.map((s) => (
            <li key={s.session} className="text-xs text-slate-400">
              <span className="text-[#FFC300]">Session {s.session}</span>{s.title ? ` — ${s.title}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
