'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, MessageSquareText, ShieldCheck, Loader2, BookOpen, ChevronRight, Settings } from 'lucide-react';
import { courseLogo } from '@/lib/chatbot/courseLogos';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { atcApi, ChatbotCourse } from '@/lib/chatbot/api';

export default function AiChatbotLandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();

  const [courses, setCourses] = useState<ChatbotCourse[] | null>(null);
  const [coursesError, setCoursesError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    atcApi.courses().then(setCourses).catch((e) => setCoursesError(e.message));
    atcApi.me().then((me) => setIsAdmin(me.isAdmin)).catch(() => setIsAdmin(false));
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="text-center mb-14">
        <p className="text-[#FFC300] text-sm font-semibold uppercase tracking-[0.2em] mb-4">
          AI Training Chatbot
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
          Post-Training Q&amp;A, in Attique&apos;s Voice
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
          Ask follow-up questions about PANW course content, 24/7. Answers are grounded
          strictly in what was covered in the sessions — direct, technically precise, no fluff.
        </p>

        <div className="mt-8">
          {authLoading ? (
            <Loader2 className="w-5 h-5 text-[#FFC300] animate-spin mx-auto" />
          ) : !user ? (
            <Link
              href={`/tools/cyberquiz/auth?tab=login&redirect=${encodeURIComponent('/tools/ai-chatbot')}`}
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-[#0a0e1a] bg-gradient-to-r from-[#FFC300] to-[#FFB703] hover:from-[#FFD60A] hover:to-[#FFC300] transition-all shadow-lg shadow-[#FFC300]/20"
            >
              Log In to Continue
            </Link>
          ) : null}
        </div>
      </div>

      {user && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#FFC300]" /> Available Courses
            </h2>
            {isAdmin && (
              <Link
                href="/tools/ai-chatbot/admin/cohorts"
                className="inline-flex items-center gap-1.5 text-sm text-slate-300 border border-white/10 hover:border-[#FFC300]/40 hover:text-white px-3 py-1.5 rounded-lg transition-all"
              >
                <Settings className="w-4 h-4" /> Manage Courses
              </Link>
            )}
          </div>
          {courses === null && !coursesError && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-[#FFC300] animate-spin" />
            </div>
          )}
          {coursesError && <p className="text-sm text-red-400">{coursesError}</p>}
          {courses && courses.length === 0 && (
            <p className="text-sm text-slate-500">No courses are available yet. Check back soon.</p>
          )}
          {courses && courses.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/tools/ai-chatbot/chat/${c.id}`)}
                  className="text-left rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-[#FFC300]/40 hover:bg-white/[0.04] p-5 transition-all flex items-center gap-4"
                >
                  <div className="w-16 h-12 flex items-center justify-center shrink-0">
                    <img src={courseLogo(c.course_code)} alt="" className="max-h-10 max-w-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#FFC300]/80 mb-1">{c.course_code}</p>
                    <p className="text-white font-semibold">{c.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.session_count} session{c.session_count === 1 ? '' : 's'} available</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <GraduationCap className="w-7 h-7 text-[#FFC300] mb-4" />
          <h3 className="text-white font-semibold mb-2">Open to Everyone</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Log in with your existing site account — the same one you use for CyberQuiz — to ask
            questions about any published course.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <MessageSquareText className="w-7 h-7 text-[#FFC300] mb-4" />
          <h3 className="text-white font-semibold mb-2">Answers, Not Fluff</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            No &ldquo;Great question!&rdquo; No generic disclaimers. Direct, technically precise answers
            with session citations.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <ShieldCheck className="w-7 h-7 text-[#FFC300] mb-4" />
          <h3 className="text-white font-semibold mb-2">Grounded, Not Guessed</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            If it wasn&apos;t covered in class, the bot says so — it never fabricates an answer.
          </p>
        </div>
      </div>
    </div>
  );
}
