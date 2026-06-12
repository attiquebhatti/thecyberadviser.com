'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from './ui/Button';
import { CQAvatar } from './ui/Avatar';

const BASE = '/tools/cyberquiz';

export function CQNavbar() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="sticky top-24 z-40 w-full glass border-b border-[#2d2d44]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={BASE} className="flex items-center gap-2">
          <img src="/logos/CyberQuiz.png" alt="CyberQuiz" className="h-14 w-auto object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href={`${BASE}#features`} className="text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">Features</Link>
          <Link href={`${BASE}#pricing`} className="text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">Pricing</Link>

          {user ? (
            <div className="flex items-center gap-3">
              <CQButton size="sm" onClick={() => router.push(`${BASE}/dashboard`)}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </CQButton>
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors">
                  <CQAvatar seed={user.id} size={32} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#16213e] border border-[#2d2d44] shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-[#2d2d44]">
                      <p className="text-sm font-medium text-[#f1f5f9] truncate">{user.displayName || user.email}</p>
                      <p className="text-xs text-[#94a3b8] capitalize">{user.tier || 'free'} plan</p>
                    </div>
                    <button onClick={() => { router.push(`${BASE}/settings`); setUserMenuOpen(false); }} className="w-full px-3 py-2 flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5 transition-colors">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full px-3 py-2 flex items-center gap-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CQButton variant="ghost" size="sm" onClick={() => router.push(`${BASE}/auth`)}>Log In</CQButton>
              <CQButton size="sm" onClick={() => router.push(`${BASE}/auth?tab=signup`)}>Get Started Free</CQButton>
            </div>
          )}
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5 text-[#f1f5f9]" /> : <Menu className="w-5 h-5 text-[#f1f5f9]" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#2d2d44] px-4 py-3 space-y-2">
          {user ? (
            <>
              <CQButton variant="ghost" className="w-full justify-start" onClick={() => { router.push(`${BASE}/dashboard`); setMenuOpen(false); }}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </CQButton>
              <CQButton variant="ghost" className="w-full justify-start" onClick={() => { router.push(`${BASE}/settings`); setMenuOpen(false); }}>
                <Settings className="w-4 h-4" /> Settings
              </CQButton>
              <CQButton variant="danger" className="w-full justify-start" onClick={() => { signOut(); setMenuOpen(false); }}>
                <LogOut className="w-4 h-4" /> Sign out
              </CQButton>
            </>
          ) : (
            <>
              <CQButton variant="ghost" className="w-full" onClick={() => { router.push(`${BASE}/auth`); setMenuOpen(false); }}>Log In</CQButton>
              <CQButton className="w-full" onClick={() => { router.push(`${BASE}/auth?tab=signup`); setMenuOpen(false); }}>Get Started Free</CQButton>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
