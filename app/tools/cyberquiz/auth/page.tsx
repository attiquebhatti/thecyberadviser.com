'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from '@/components/cyberquiz/ui/Button';

const BASE = '/tools/cyberquiz';

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, user } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'signup'>(params.get('tab') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) { router.replace(`${BASE}/dashboard`); return; }

    const oauthToken = params.get('oauthToken');
    const oauthError = params.get('oauthError');
    if (oauthToken) {
      localStorage.setItem('qa_token', oauthToken);
      cqApi.getMe().then(me => { setUser(me); router.replace(`${BASE}/dashboard`); }).catch(() => setError('OAuth login failed'));
    } else if (oauthError) {
      const code = decodeURIComponent(oauthError);
      const messages: Record<string, string> = {
        google_not_configured: 'Google sign-in is not yet configured. Please use email and password.',
        google_denied:         'Google sign-in was cancelled.',
        google_token:          'Google sign-in failed — could not exchange token. Please try again.',
        google_failed:         'Google sign-in failed — database not connected. Please use email and password for now.',
        access_denied:         'Google sign-in was cancelled.',
      };
      setError(messages[code] ?? code);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (tab === 'login') {
        res = await cqApi.login(email, password);
      } else {
        res = await cqApi.signup(email, password, displayName || email.split('@')[0]);
      }
      localStorage.setItem('qa_token', res.token);
      setUser(res.user);
      router.push(`${BASE}/dashboard`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const oauthBase = '/api/cyberquiz/auth';

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 pt-8 pb-12">
      <div className="absolute top-4 left-4">
        <button onClick={() => router.push(BASE)} className="text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
          ← Back
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black font-display mb-2">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-[#94a3b8]">
            {tab === 'login' ? "Sign in to your CyberQuiz account" : "Start quizzing for free"}
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex rounded-lg bg-[#0f0f1a] p-1 mb-6 gap-1">
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-[#7c3aed] text-white' : 'text-[#94a3b8] hover:text-[#f1f5f9]'}`}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* OAuth */}
          <div className="mb-6">
            <a href={`${oauthBase}/google`} className="flex items-center justify-center gap-3 w-full py-2.5 rounded-lg border border-[#2d2d44] hover:border-[#3d3d5a] text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2d2d44]" /></div>
            <div className="relative flex justify-center text-xs text-[#4a4a6a] bg-[#1a1a2e] px-3 w-fit mx-auto">or</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
                <input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#94a3b8]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {tab === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => router.push(`${BASE}/forgot-password`)} className="text-xs text-[#7c3aed] hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-sm text-[#f87171]">{error}</div>
            )}

            <CQButton type="submit" loading={loading} className="w-full" size="md">
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </CQButton>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#7c3aed]" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
