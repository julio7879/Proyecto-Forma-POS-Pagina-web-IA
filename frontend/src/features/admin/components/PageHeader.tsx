import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'champagne' | 'vino' | 'neutral' | 'success';
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden text-[#0F172A] ${className}`}
    >
      {/* Reflejo superior suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/20 to-transparent pointer-events-none" />

      <div className="min-w-0 flex-1 relative z-10">
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#741C2B]/10 border border-[#741C2B]/25 text-[10px] font-black uppercase tracking-widest text-[#741C2B] mb-2 shadow-2xs">
            {badge}
          </span>
        )}
        <h1 className="text-[22px] sm:text-[24px] leading-tight font-display font-black text-[#0F172A] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] sm:text-[14px] font-medium text-[#475569] mt-1 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap relative z-10">
          {actions}
        </div>
      )}
    </div>
  );
};
