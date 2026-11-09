import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error al sincronizar la información',
  message,
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`relative rounded-3xl backdrop-blur-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden text-white ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#EF4444]/50 to-transparent pointer-events-none" />

      <div className="flex items-start gap-3.5 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#F87171] flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[14px] font-black text-white">{title}</h4>
          <p className="text-[13px] text-white/70 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-bold inline-flex items-center gap-2 transition-colors shrink-0 self-start sm:self-center cursor-pointer shadow-md relative z-10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
