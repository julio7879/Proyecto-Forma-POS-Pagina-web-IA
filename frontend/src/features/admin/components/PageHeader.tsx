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
      className={`relative rounded-3xl backdrop-blur-2xl bg-white/90 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.14] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden text-[#0F172A] dark:text-white ${className}`}
    >
      {/* Reflejo superior de cristal líquido */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/30 dark:via-white/50 to-transparent pointer-events-none" />

      <div className="min-w-0 flex-1 relative z-10">
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#741C2B]/10 dark:bg-white/10 border border-[#741C2B]/30 dark:border-white/20 text-[10px] font-black uppercase tracking-widest text-[#741C2B] dark:text-[#E5BE90] mb-2 shadow-xs">
            {badge}
          </span>
        )}
        <h1 className="text-[22px] sm:text-[24px] leading-tight font-display font-black text-[#0F172A] dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] sm:text-[14px] font-medium text-[#475569] dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
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
