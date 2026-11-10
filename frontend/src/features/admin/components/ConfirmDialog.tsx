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
      ? 'bg-rose-700 hover:bg-rose-800 text-white border border-rose-800'
      : variant === 'success'
      ? 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800'
      : 'bg-[#741C2B] hover:bg-[#5E1623] text-white border border-[#741C2B]';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden text-[#0F172A] relative">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/20 to-transparent pointer-events-none" />

        <div className="px-5 py-4 border-b border-slate-100 bg-[#F8FAFC] flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : variant === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-[#741C2B]/10 text-[#741C2B] border border-[#741C2B]/20'
              }`}
            >
              {variant === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-[16px] font-black text-[#0F172A] truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar diálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[13px] text-[#475569] relative z-10">
          {description && (
            <p className="text-[#475569] leading-relaxed font-medium">{description}</p>
          )}
          {children}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 bg-[#F8FAFC] flex items-center justify-end gap-2.5 relative z-10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-[13px] font-bold text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || disabled}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm disabled:opacity-45 cursor-pointer ${btnStyle}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
