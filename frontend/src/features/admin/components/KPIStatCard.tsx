import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variation?: {
    text: string;
    positive?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: string;
  className?: string;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  title,
  value,
  subtitle,
  variation,
  icon: Icon,
  onClick,
  isActive = false,
  badge,
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`
        relative rounded-2xl bg-white border transition-all duration-200 p-5
        ${
          isActive
            ? 'border-[#741C2B] ring-2 ring-[#741C2B]/15 shadow-sm'
            : 'border-[#E7E0D8] hover:border-[#C49A68]/60 shadow-2xs hover:shadow-xs'
        }
        ${isClickable ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      {/* Cabecera de la tarjeta: Título e Ícono */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
              {title}
            </span>
            {badge && (
              <span className="px-2 py-0.5 rounded-md bg-[#F5F3EF] border border-[#E7E0D8] text-[10px] font-bold text-[#741C2B]">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-[#741C2B] flex items-center justify-center shrink-0 shadow-2xs">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Valor Primario (Tabular mono estricto) */}
      <div className="font-mono-tabular text-2xl sm:text-3xl font-black text-[#292827] tracking-tight">
        {value}
      </div>

      {/* Footer: Variación porcentual y subtítulo */}
      {(variation || subtitle) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#E7E0D8]/60 text-xs">
          {variation && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                variation.positive !== false ? 'text-[#27845C]' : 'text-[#C44848]'
              }`}
            >
              {variation.positive !== false ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{variation.text}</span>
            </span>
          )}

          {subtitle && (
            <span className="text-[#77736E] text-[11px] font-medium truncate ml-auto">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
