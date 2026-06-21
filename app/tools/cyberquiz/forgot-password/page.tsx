'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, KeyRound } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { CQButton } from '@/components/cyberquiz/ui/Button';

const BASE = '/tools/cyberquiz';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetInfo, setResetInfo] = useState<{ token: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await cqApi.forgotPassword(email);
      if (res.resetToken) setResetInfo({ token: res.resetToken });
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <div className="absolute top-4 left-4">
        <button onClick={() => router.push(`${BASE}/auth`)} className="text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">← Back to Sign In</button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-[#10b981]" />
          </div>
          <h1 className="text-2xl font-black font-display mb-2">Reset Password</h1>
          <p className="text-[#94a3b8] text-sm">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="glass rounded-2xl p-6">
          {resetInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30">
                <p className="text-[#4ade80] font-medium text-sm mb-1">Reset token generated</p>
                <p className="text-xs text-[#94a3b8] break-all font-mono">{resetInfo.token}</p>
              </div>
              <CQButton className="w-full" onClick={() => router.push(`${BASE}/reset-password?token=${resetInfo.token}`)}>
                Continue to Reset
              </CQButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#10b981] transition-colors text-sm"
                />
              </div>
              {error && <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-sm text-[#f87171]">{error}</div>}
              <CQButton type="submit" loading={loading} className="w-full">Send Reset Link</CQButton>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
