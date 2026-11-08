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
  success: 'bg-[#27845C]/10 text-[#27845C] border-[#27845C]/25',
  warning: 'bg-[#B77925]/10 text-[#B77925] border-[#B77925]/25',
  error: 'bg-[#C44848]/10 text-[#C44848] border-[#C44848]/25',
  neutral: 'bg-[#77736E]/10 text-[#292827] border-[#E7E0D8]',
  champagne: 'bg-[#C49A68]/15 text-[#741C2B] border-[#C49A68]/35 font-bold',
  vino: 'bg-[#741C2B] text-white border-[#741C2B] font-bold shadow-xs',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
};

const DOT_STYLES: Record<StatusBadgeVariant, string> = {
  success: 'bg-[#27845C]',
  warning: 'bg-[#B77925]',
  error: 'bg-[#C44848]',
  neutral: 'bg-[#77736E]',
  champagne: 'bg-[#C49A68]',
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
    'inline-flex items-center gap-1.5 rounded-lg border font-semibold tracking-wide transition-colors',
    VARIANT_STYLES[variant] || VARIANT_STYLES.neutral,
    sizeClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {dot ? (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_STYLES[variant] || ''}`}
          aria-hidden="true"
        ></span>
      ) : null}
      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> : null}
      <span>{label}</span>
    </span>
  );
};
