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
        relative rounded-3xl bg-white border transition-all duration-200 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden text-[#0F172A]
        ${
          isActive
            ? 'border-[#741C2B] ring-2 ring-[#741C2B]/20 shadow-md'
            : 'border-slate-200/90 hover:border-[#741C2B]/30 hover:shadow-md'
        }
        ${isClickable ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      {/* Reflejo superior suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/20 to-transparent pointer-events-none" />

      {/* Cabecera de la tarjeta: Título e Ícono */}
      <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#475569]">
              {title}
            </span>
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-[#741C2B]/10 border border-[#741C2B]/20 text-[10px] font-black text-[#741C2B]">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-[#741C2B]/10 border border-[#741C2B]/20 text-[#741C2B] flex items-center justify-center shrink-0 shadow-2xs">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Valor Primario (Tabular mono estricto) */}
      <div className="font-mono-tabular text-2xl sm:text-3xl font-display font-black text-[#0F172A] tracking-tight relative z-10 tabular-nums">
        {value}
      </div>

      {/* Footer: Variación porcentual y subtítulo */}
      {(variation || subtitle) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs relative z-10">
          {variation && (
            <span
              className={`inline-flex items-center gap-0.5 font-black text-xs ${
                variation.positive !== false ? 'text-emerald-700' : 'text-rose-700'
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
            <span className="text-[#64748B] text-[11px] font-bold truncate ml-auto">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
