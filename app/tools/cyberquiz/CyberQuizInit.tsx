'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

export function CyberQuizInit({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();
  useEffect(() => { initialize(); }, [initialize]);
  return <>{children}</>;
}
