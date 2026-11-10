import React from 'react';

export type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'champagne'
  | 'vino'
  | 'info';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  icon?: React.ComponentType<{ className?: string }>;
  dot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  warning: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
  error: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
  neutral: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
  champagne: 'bg-amber-50/80 text-[#78350F] border-amber-300 font-bold',
  vino: 'bg-[#741C2B] text-white border-[#741C2B] font-bold shadow-xs',
  info: 'bg-sky-50 text-sky-800 border-sky-300 font-bold',
};

const DOT_STYLES: Record<StatusBadgeVariant, string> = {
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-rose-600',
  neutral: 'bg-slate-500',
  champagne: 'bg-[#B45309]',
  vino: 'bg-white',
  info: 'bg-sky-600',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon: Icon,
  dot = false,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const badgeClasses = [
    'inline-flex items-center gap-1.5 rounded-lg border font-bold tracking-wide transition-colors',
    `status-badge-${variant}`,
    VARIANT_STYLES[variant] || VARIANT_STYLES.neutral,
    sizeClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${DOT_STYLES[variant] || DOT_STYLES.neutral}`}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
