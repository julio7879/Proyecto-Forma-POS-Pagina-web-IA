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
      className={`rounded-[14px] bg-[#FFFFFF] border border-[#E7E0D8] p-10 text-center flex flex-col items-center justify-center shadow-2xs ${className}`}
    >
      <div className="w-12 h-12 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] text-[#741C2B] flex items-center justify-center mb-3.5 shadow-2xs">
        <Icon className="w-6 h-6 text-[#C49A68]" />
      </div>
      <h4 className="text-[15px] font-black text-[#292827] tracking-tight">
        {title}
      </h4>
      {description && (
        <p className="text-[13px] text-[#77736E] mt-1 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-[12px] bg-[#741C2B] hover:bg-[#5E1622] text-white text-[13px] font-bold transition-colors cursor-pointer shadow-2xs"
        >
          {actionLabel}
        </button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default EmptyState;
