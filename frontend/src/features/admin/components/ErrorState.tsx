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
      className={`relative rounded-3xl bg-rose-50/90 border border-rose-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden text-[#0F172A] ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-300 to-transparent pointer-events-none" />

      <div className="flex items-start gap-3.5 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 text-rose-800 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[14px] font-black text-rose-950">{title}</h4>
          <p className="text-[13px] text-rose-800 mt-0.5 leading-relaxed font-medium">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-[13px] font-bold inline-flex items-center gap-2 transition-colors shrink-0 self-start sm:self-center cursor-pointer shadow-sm relative z-10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
