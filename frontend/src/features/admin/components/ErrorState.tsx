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
      className={`rounded-[14px] bg-[#FFFFFF] border border-[#C44848]/35 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-[12px] bg-[#C44848]/10 border border-[#C44848]/25 text-[#C44848] flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[14px] font-black text-[#292827]">{title}</h4>
          <p className="text-[13px] text-[#77736E] mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-[12px] bg-[#C44848] hover:bg-[#A93B3B] text-white text-[13px] font-bold inline-flex items-center gap-2 transition-colors shrink-0 self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
