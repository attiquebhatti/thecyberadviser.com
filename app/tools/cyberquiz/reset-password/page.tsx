'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { CQButton } from '@/components/cyberquiz/ui/Button';

const BASE = '/tools/cyberquiz';

function ResetContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await cqApi.resetPassword(token, newPw);
      setDone(true);
      setTimeout(() => router.push(`${BASE}/auth`), 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#7c3aed]" />
          </div>
          <h1 className="text-2xl font-black font-display mb-2">Set New Password</h1>
          <p className="text-[#94a3b8] text-sm">Choose a strong password for your account</p>
        </div>

        <div className="glass rounded-2xl p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-[#4ade80] font-semibold">Password updated! Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="New password (min. 8 chars)"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#94a3b8]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#7c3aed] transition-colors text-sm"
                />
              </div>
              {error && <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-sm text-[#f87171]">{error}</div>}
              <CQButton type="submit" loading={loading} className="w-full">Update Password</CQButton>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#7c3aed]" /></div>}>
      <ResetContent />
    </Suspense>
  );
}
