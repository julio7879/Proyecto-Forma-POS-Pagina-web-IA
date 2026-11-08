import React from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  badge?: string;
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  badge,
  columns = 1,
  children,
  className = '',
}) => {
  const gridCols =
    columns === 3
      ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
      : columns === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
      : 'space-y-4';

  return (
    <section
      className={`rounded-[14px] bg-[#F5F3EF]/70 border border-[#E7E0D8] p-4 sm:p-5 space-y-3.5 ${className}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-[#E7E0D8] pb-2.5">
        <div>
          <h4 className="text-[13px] font-black uppercase tracking-wider text-[#292827]">
            {title}
          </h4>
          {description && (
            <p className="text-[12px] text-[#77736E] mt-0.5">{description}</p>
          )}
        </div>
        {badge && (
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E7E0D8] text-[10px] font-bold text-[#741C2B]">
            {badge}
          </span>
        )}
      </div>
      <div className={gridCols}>{children}</div>
    </section>
  );
};

export default FormSection;
