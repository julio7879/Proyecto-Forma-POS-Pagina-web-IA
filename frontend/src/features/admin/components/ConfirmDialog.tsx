import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'vino' | 'danger' | 'success';
  isLoading?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'vino',
  isLoading = false,
  disabled = false,
  onConfirm,
  onCancel,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const btnStyle =
    variant === 'danger'
      ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white border border-[#EF4444]/50'
      : variant === 'success'
      ? 'bg-[#10B981] hover:bg-[#059669] text-white border border-[#10B981]/50'
      : 'bg-gradient-to-r from-[#741C2B] to-[#912537] hover:from-[#912537] hover:to-[#A32E43] text-white border border-white/20';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-3xl backdrop-blur-2xl bg-[#1A060B]/95 border border-white/[0.18] shadow-2xl overflow-hidden text-white relative">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.04] flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/40'
                  : variant === 'success'
                  ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40'
                  : 'bg-[#741C2B]/30 text-[#E5BE90] border border-[#741C2B]/50'
              }`}
            >
              {variant === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-[16px] font-black text-white truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar diálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[13px] text-white/80 relative z-10">
          {description && (
            <p className="text-white/70 leading-relaxed">{description}</p>
          )}
          {children}
        </div>

        <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.03] flex items-center justify-end gap-2.5 relative z-10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 text-[13px] font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || disabled}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-md disabled:opacity-45 cursor-pointer ${btnStyle}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
