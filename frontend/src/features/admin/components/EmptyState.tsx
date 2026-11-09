import React from 'react';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = PackageOpen,
  actionLabel,
  onAction,
  children,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-3xl backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] p-10 text-center flex flex-col items-center justify-center shadow-[0_12px_30px_rgba(0,0,0,0.3)] overflow-hidden text-white ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-[#E5BE90] flex items-center justify-center mb-3.5 shadow-sm relative z-10">
        <Icon className="w-6 h-6 text-[#E5BE90]" />
      </div>
      <h4 className="text-[15px] font-black text-white tracking-tight relative z-10">
        {title}
      </h4>
      {description && (
        <p className="text-[13px] text-white/70 mt-1 max-w-md leading-relaxed relative z-10">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#741C2B] to-[#912537] hover:from-[#912537] hover:to-[#A32E43] text-white text-[13px] font-bold transition-all cursor-pointer shadow-md relative z-10 border border-white/20"
        >
          {actionLabel}
        </button>
      )}
      {children && <div className="mt-4 relative z-10">{children}</div>}
    </div>
  );
};
