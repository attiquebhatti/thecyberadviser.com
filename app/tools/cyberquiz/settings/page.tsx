'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Shield, CreditCard, LogOut, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQAvatar } from '@/components/cyberquiz/ui/Avatar';
import { CQBadge } from '@/components/cyberquiz/ui/Badge';

const BASE = '/tools/cyberquiz';

const TIERS = [
  { id: 'free',     label: 'Free',     price: '$0',     color: '#6b7280', features: ['50 players/session', '10 quizzes', '3 game modes', '10 AI generations/month'] },
  { id: 'educator', label: 'Educator', price: '$8/mo',  color: '#6bd348', features: ['500 players', 'Unlimited quizzes', 'All 8 modes', 'Unlimited AI'] },
  { id: 'pro',      label: 'Pro',      price: '$16/mo', color: '#06b6d4', features: ['1,000 players', 'Custom branding', 'Priority support'] },
];

export default function SettingsPage() {
  const { user, signOut, updateUser } = useAuthStore();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const [currentPw, setCurrentPw]  = useState('');
  const [newPw, setNewPw]          = useState('');
  const [confirmPw, setConfirmPw]  = useState('');
  const [showPw, setShowPw]        = useState(false);
  const [changingPw, setChangingPw]= useState(false);
  const [pwError, setPwError]      = useState('');
  const [pwSuccess, setPwSuccess]  = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true); setError('');
    try {
      const updated = await cqApi.updateProfile({ displayName });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      await cqApi.changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: unknown) {
      setPwError((err as Error).message || 'Password change failed');
    } finally {
      setChangingPw(false);
    }
  };

  if (!user) {
    router.push(`${BASE}/auth`);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="sticky top-24 z-30 bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#94a3b8] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[#f1f5f9]">Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile */}
        <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#6bd348]" />
            <h2 className="font-semibold text-[#f1f5f9]">Profile</h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <CQAvatar seed={user.id} size={64} />
            <div>
              <p className="font-medium text-[#f1f5f9]">{user.displayName || 'Anonymous'}</p>
              <p className="text-sm text-[#94a3b8]">{user.email}</p>
              <CQBadge variant={user.tier === 'educator' ? 'purple' : user.tier === 'pro' ? 'cyan' : 'gray'} className="mt-1 capitalize">
                {user.tier || 'free'} plan
              </CQBadge>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Display Name</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Email</label>
              <input
                value={user.email || ''}
                disabled
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] opacity-50 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-[#f87171] mt-2">{error}</p>}
          <CQButton className="mt-4" loading={saving} onClick={handleSave}>
            <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Changes'}
          </CQButton>
        </div>

        {/* Change Password */}
        <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[#6bd348]" />
            <h2 className="font-semibold text-[#f1f5f9]">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Current password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                required
                className="w-full px-3 pr-10 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] transition-colors text-sm"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#94a3b8]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input type={showPw ? 'text' : 'password'} placeholder="New password (min. 8 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] transition-colors text-sm" />
            <input type={showPw ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] transition-colors text-sm" />
            {pwError && <p className="text-sm text-[#f87171]">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-[#6bd348]">Password changed successfully</p>}
            <CQButton type="submit" loading={changingPw} size="sm">
              <Lock className="w-4 h-4" /> Update Password
            </CQButton>
          </form>
        </div>

        {/* Billing */}
        <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[#6bd348]" />
            <h2 className="font-semibold text-[#f1f5f9]">Plan</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIERS.map(tier => (
              <div key={tier.id} className={`p-4 rounded-xl border-2 transition-all ${user.tier === tier.id ? 'border-[#6bd348] bg-[#6bd348]/10' : 'border-[#2d2d44]'}`}>
                <p className="font-bold text-[#f1f5f9]">{tier.label}</p>
                <p className="text-lg font-black" style={{ color: tier.color }}>{tier.price}</p>
                <ul className="mt-2 space-y-1">
                  {tier.features.map((f, i) => <li key={i} className="text-xs text-[#94a3b8]">✓ {f}</li>)}
                </ul>
                {user.tier === tier.id
                  ? <p className="text-xs text-[#6bd348] mt-2 text-center font-medium">Current plan</p>
                  : <CQButton size="sm" className="w-full mt-3" variant={tier.id === 'educator' ? 'primary' : 'ghost'}>Upgrade</CQButton>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#ef4444]" />
            <h2 className="font-semibold text-[#f87171]">Account</h2>
          </div>
          <CQButton variant="danger" onClick={() => { signOut(); router.push(BASE); }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </CQButton>
        </div>
      </div>
    </div>
  );
}
