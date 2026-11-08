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
      ? 'bg-[#C44848] hover:bg-[#A83838] text-white'
      : variant === 'success'
      ? 'bg-[#27845C] hover:bg-[#1E6A49] text-white'
      : 'bg-[#741C2B] hover:bg-[#5D1521] text-white';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#292827]/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-[14px] bg-[#FFFFFF] border border-[#E7E0D8] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E7E0D8] bg-[#F5F3EF]/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-[#C44848]/10 text-[#C44848]'
                  : variant === 'success'
                  ? 'bg-[#27845C]/10 text-[#27845C]'
                  : 'bg-[#741C2B]/10 text-[#741C2B]'
              }`}
            >
              {variant === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-[16px] font-black text-[#292827] truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#77736E] hover:text-[#292827] hover:bg-[#E7E0D8]/50 transition-colors cursor-pointer"
            aria-label="Cerrar diálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[13px] text-[#292827]">
          {description && (
            <p className="text-[#77736E] leading-relaxed">{description}</p>
          )}
          {children}
        </div>

        <div className="px-5 py-3.5 border-t border-[#E7E0D8] bg-[#F5F3EF]/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-[12px] border border-[#E7E0D8] bg-[#FFFFFF] text-[13px] font-bold text-[#292827] hover:bg-[#F5F3EF] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || disabled}
            className={`px-4 py-2 rounded-[12px] text-[13px] font-bold transition-colors shadow-2xs disabled:opacity-45 cursor-pointer ${btnStyle}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
