'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface Props { socket: Socket | null; }
type BannerState = 'hidden' | 'disconnected' | 'reconnected';

export function CQConnectionBanner({ socket }: Props) {
  const [state, setState] = useState<BannerState>('hidden');

  useEffect(() => {
    if (!socket) return;
    let timer: ReturnType<typeof setTimeout>;

    const onDisconnect = () => { clearTimeout(timer); setState('disconnected'); };
    const onConnect    = () => {
      clearTimeout(timer);
      setState('reconnected');
      timer = setTimeout(() => setState('hidden'), 2500);
    };

    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    return () => { socket.off('disconnect', onDisconnect); socket.off('connect', onConnect); clearTimeout(timer); };
  }, [socket]);

  return (
    <AnimatePresence>
      {state !== 'hidden' && (
        <motion.div
          key={state}
          initial={{ y: -56, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -56, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-lg ${
            state === 'disconnected' ? 'bg-amber-500 text-amber-950' : 'bg-emerald-500 text-emerald-950'
          }`}
        >
          {state === 'disconnected'
            ? <><WifiOff className="w-4 h-4 animate-pulse" /> Connection lost — reconnecting…</>
            : <><Wifi className="w-4 h-4" /> Reconnected!</>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
