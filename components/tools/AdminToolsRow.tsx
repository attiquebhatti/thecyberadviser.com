'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Users } from 'lucide-react';

// Admin-only row on the Tools page: Insights (combined dashboard) + Users.
// Hidden entirely for non-admins; the underlying APIs also enforce admin
// server-side, so this is just UI gating.
export default function AdminToolsRow() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('qa_token') : null;
    if (!token) return;
    fetch('/api/admin/check', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-wider text-[#6BD348] font-semibold mb-3">Admin</p>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/tools/cyberquiz/analytics"
          className="card-premium rounded-3xl border border-[#6BD348]/20 hover:border-[#6BD348]/50 transition-colors group block"
        >
          <div className="p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6BD348]/12 text-[#6BD348] mb-4" style={{ boxShadow: 'inset 0 0 0 1px rgba(107,211,72,0.25)' }}>
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-white group-hover:text-[#6BD348] transition-colors">Insights</h3>
            <p className="mt-3 body-default">
              Combined admin dashboard — site traffic, Config Migration usage (who ran what, when), and CyberQuiz / Chatbot activity.
            </p>
          </div>
        </Link>

        <Link
          href="/tools/cyberquiz/admin/users"
          className="card-premium rounded-3xl border border-[#6BD348]/20 hover:border-[#6BD348]/50 transition-colors group block"
        >
          <div className="p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6BD348]/12 text-[#6BD348] mb-4" style={{ boxShadow: 'inset 0 0 0 1px rgba(107,211,72,0.25)' }}>
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-white group-hover:text-[#6BD348] transition-colors">Users</h3>
            <p className="mt-3 body-default">
              Everyone who has signed up across your tools, with roles. Promote or demote standard ↔ admin.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
