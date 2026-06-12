'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

export default function CyberQuizLayout({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-[#f1f5f9] pt-24">
      {children}
    </div>
  );
}
