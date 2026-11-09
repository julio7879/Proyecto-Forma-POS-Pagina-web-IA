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
  success: 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40',
  warning: 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/40',
  error: 'bg-[#EF4444]/20 text-[#F87171] border-[#EF4444]/40',
  neutral: 'bg-white/10 text-white border-white/20',
  champagne: 'bg-[#C49A68]/20 text-[#E5BE90] border-[#C49A68]/40 font-bold',
  vino: 'bg-[#741C2B] text-white border-white/20 font-bold shadow-xs',
  info: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
};

const DOT_STYLES: Record<StatusBadgeVariant, string> = {
  success: 'bg-[#34D399]',
  warning: 'bg-[#FBBF24]',
  error: 'bg-[#F87171]',
  neutral: 'bg-white/60',
  champagne: 'bg-[#E5BE90]',
  vino: 'bg-white',
  info: 'bg-sky-400',
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
    'inline-flex items-center gap-1.5 rounded-lg border font-semibold tracking-wide transition-colors',
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
