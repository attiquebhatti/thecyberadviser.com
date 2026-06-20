'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

// Reuses CyberQuiz's auth store directly — same session, no separate login for this tool.
export function ChatbotInit({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();
  useEffect(() => { initialize(); }, [initialize]);
  return <>{children}</>;
}
