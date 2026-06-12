'use client';
import { useState, useEffect } from 'react';

export interface LocalUser {
  id: string;
  email: string;
  displayName: string;
  tier: string;
}

function decodeToken(token: string): LocalUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (decoded.exp && Date.now() / 1000 > decoded.exp) return null;
    if (!decoded.email) return null;
    return { id: decoded.id, email: decoded.email, displayName: decoded.displayName || decoded.email, tier: decoded.tier || 'free' };
  } catch {
    return null;
  }
}

export function useLocalUser() {
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    const read = () => {
      const token = localStorage.getItem('qa_token');
      setUser(token ? decodeToken(token) : null);
    };
    read();

    // Cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'qa_token') read();
    };
    // Same-tab sync via custom event dispatched on login/logout
    const onAuth = () => read();
    window.addEventListener('storage', onStorage);
    window.addEventListener('cq-auth-change', onAuth);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cq-auth-change', onAuth);
    };
  }, []);

  const signOut = () => {
    localStorage.removeItem('qa_token');
    setUser(null);
    window.dispatchEvent(new Event('cq-auth-change'));
  };

  return { user, signOut };
}
