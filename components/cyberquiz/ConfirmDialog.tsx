'use client';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
}

export function CQConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'default', onConfirm,
}: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-150">
          <div className="flex items-start gap-3 mb-2">
            {variant === 'danger' && (
              <div className="w-9 h-9 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              </div>
            )}
            <AlertDialog.Title className="text-lg font-bold text-[#f1f5f9]">{title}</AlertDialog.Title>
          </div>
          {description && (
            <AlertDialog.Description className="text-sm text-[#94a3b8] mb-6">{description}</AlertDialog.Description>
          )}
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5 transition-colors">
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${variant === 'danger' ? 'bg-[#ef4444] hover:bg-[#dc2626]' : 'bg-[#6bd348] hover:bg-[#5cbf3c]'}`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export default CQConfirmDialog;
