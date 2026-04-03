'use client';

import React, { useState, useEffect } from 'react';
import { getAuditLog, exportAuditEvidence } from '@/lib/unified-migrator/desktop-storage';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAuditLog().then((data) => {
        setLogs(data.reverse());
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#020914] border border-white/[0.08] rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold">Cryptographic Audit Chain</h2>
              <p className="text-white/40 text-xs">Tamper-evident event log (SHA-256 Hash Chain)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-white/20 py-12 italic">No audit events recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-blue-400 text-xs font-mono font-bold tracking-wider">{log.action}</span>
                    <span className="text-white/20 text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[11px] text-white/50 mb-3">
                    <div>
                      <span className="text-white/20 block uppercase tracking-tighter mb-0.5">User Role</span>
                      <span className={log.userId === 'admin' ? 'text-amber-400/80' : 'text-emerald-400/80'}>{log.userId}</span>
                    </div>
                    <div>
                      <span className="text-white/20 block uppercase tracking-tighter mb-0.5">Event ID</span>
                      <span className="font-mono">{log.id}</span>
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 border border-white/[0.02]">
                    <span className="text-white/20 block text-[9px] uppercase mb-1">Cryptographic Hash (SHA-256)</span>
                    <p className="text-white/30 font-mono text-[9px] break-all leading-tight">
                      Current: {log.hash}
                    </p>
                    <p className="text-white/10 font-mono text-[8px] break-all mt-1">
                      Prev: {log.previousHash}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end gap-3 bg-white/[0.01]">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            Close
          </button>
          <button 
            onClick={async () => {
              const success = await exportAuditEvidence();
              if (success) onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Signed Evidence Package
          </button>
        </div>
      </div>
    </div>
  );
}
