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
      className={`rounded-[14px] bg-[#FFFFFF] border border-[#E7E0D8] p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="min-w-0 flex-1">
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5F3EF] border border-[#E7E0D8] text-[10px] font-extrabold uppercase tracking-widest text-[#741C2B] mb-2">
            {badge}
          </span>
        )}
        <h1 className="text-[22px] sm:text-[24px] leading-tight font-black text-[#292827] tracking-tight font-sans">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] sm:text-[14px] font-medium text-[#77736E] mt-1 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
