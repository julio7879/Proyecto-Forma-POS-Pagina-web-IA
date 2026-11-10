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
      className={`relative rounded-3xl bg-white border border-slate-200/90 p-10 text-center flex flex-col items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden text-[#0F172A] ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/20 to-transparent pointer-events-none" />

      <div className="w-12 h-12 rounded-2xl bg-[#741C2B]/10 border border-[#741C2B]/20 text-[#741C2B] flex items-center justify-center mb-3.5 shadow-2xs relative z-10">
        <Icon className="w-6 h-6 text-[#741C2B]" />
      </div>
      <h4 className="text-[15px] font-black text-[#0F172A] tracking-tight relative z-10">
        {title}
      </h4>
      {description && (
        <p className="text-[13px] text-[#475569] font-medium mt-1 max-w-md leading-relaxed relative z-10">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-[#741C2B] hover:bg-[#5E1623] text-white text-[13px] font-bold transition-all cursor-pointer shadow-sm relative z-10 border border-[#741C2B]"
        >
          {actionLabel}
        </button>
      )}
      {children && <div className="mt-4 relative z-10">{children}</div>}
    </div>
  );
};
