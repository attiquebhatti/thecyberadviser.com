'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Globe, BookOpen, Play, GitFork, Loader2 } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQBadge } from '@/components/cyberquiz/ui/Badge';
import { CQGameModeSelector } from '@/components/cyberquiz/GameModeSelector';
import { CQQuizCardSkeleton } from '@/components/cyberquiz/ui/Skeleton';
import { CQNavbar } from '@/components/cyberquiz/CQNavbar';
import type { Quiz } from '@/lib/cyberquiz/types';

const BASE = '/tools/cyberquiz';

export default function ExplorePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState<string | null>(null);
  const [launchQuiz, setLaunchQuiz] = useState<Quiz | null>(null);

  useEffect(() => { loadQuizzes(); }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await cqApi.exploreQuizzes({ search, limit: 50 });
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuizzes();
  };

  const handleFork = async (quiz: Quiz) => {
    if (!user) { router.push(`${BASE}/auth`); return; }
    setForking(quiz.id);
    try {
      const forked = await cqApi.forkQuiz(quiz.id);
      router.push(`${BASE}/quiz/${forked.id}/edit`);
    } catch (err) {
      console.error(err);
    } finally {
      setForking(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <CQNavbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-[#6bd348]" />
            <h1 className="text-3xl font-black font-display">Explore Quizzes</h1>
          </div>
          <p className="text-[#94a3b8]">Discover and fork publicly shared quizzes</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search quizzes by topic, subject…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] transition-colors"
            />
          </div>
          <CQButton type="submit" size="sm">
            <Search className="w-4 h-4" /> Search
          </CQButton>
        </form>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <CQQuizCardSkeleton key={i} />)}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-[#2d2d44] mx-auto mb-4" />
            <p className="text-[#94a3b8]">No public quizzes found{search ? ` for "${search}"` : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass glass-hover rounded-xl p-5"
              >
                <div className="mb-3">
                  <h3 className="font-semibold text-[#f1f5f9] mb-1 line-clamp-2">{quiz.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {quiz.subject && <CQBadge variant="purple" className="text-xs">{quiz.subject}</CQBadge>}
                    {quiz.grade_level && <CQBadge variant="gray" className="text-xs">{quiz.grade_level}</CQBadge>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#94a3b8] mb-4">
                  <span>{quiz.question_count || 0} questions</span>
                  {quiz.play_count != null && <span>{quiz.play_count} plays</span>}
                  {quiz.fork_count != null && <span>{quiz.fork_count} forks</span>}
                </div>
                <div className="flex gap-2">
                  <CQButton size="sm" className="flex-1" onClick={() => {
                    if (!user) { router.push(`${BASE}/auth`); return; }
                    setLaunchQuiz(quiz);
                  }}>
                    <Play className="w-3.5 h-3.5" /> Play
                  </CQButton>
                  <CQButton size="sm" variant="ghost" onClick={() => handleFork(quiz)} disabled={!!forking}>
                    {forking === quiz.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitFork className="w-3.5 h-3.5" />}
                    Fork
                  </CQButton>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {launchQuiz && (
        <CQGameModeSelector quiz={launchQuiz} open={!!launchQuiz} onClose={() => setLaunchQuiz(null)} />
      )}
    </div>
  );
}
