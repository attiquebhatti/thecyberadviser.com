'use client';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, Loader2 } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { CQButton } from '@/components/cyberquiz/ui/Button';

const BASE = '/tools/cyberquiz';

export default function JoinPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');

  const handleChange = (idx: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    setError('');
    if (v && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter' && code.length === 6) handleJoin();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      refs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleJoin = async () => {
    if (code.length < 6) { setError('Please enter the full 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      const session = await cqApi.joinSession(code);
      router.push(`${BASE}/play/${session.join_code}`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Session not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 left-4">
        <button onClick={() => router.push(BASE)} className="text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">← Back</button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center mx-auto mb-6">
          <LogIn className="w-8 h-8 text-[#7c3aed]" />
        </div>
        <h1 className="text-3xl font-black font-display mb-2">Join Session</h1>
        <p className="text-[#94a3b8] mb-10">Enter the 6-digit code from your host</p>

        <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-[#1a1a2e] text-[#f1f5f9] focus:outline-none transition-all
                ${d ? 'border-[#7c3aed] bg-[#7c3aed]/10' : 'border-[#2d2d44] focus:border-[#7c3aed]'}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-sm text-[#f87171] mb-4">{error}</div>
        )}

        <CQButton
          size="lg"
          className="w-full text-base"
          onClick={handleJoin}
          loading={loading}
          disabled={code.length < 6}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</> : 'Join Now'}
        </CQButton>
      </motion.div>
    </div>
  );
}
