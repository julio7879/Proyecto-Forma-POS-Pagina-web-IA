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
        relative rounded-3xl backdrop-blur-2xl bg-white/[0.07] border transition-all duration-200 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] overflow-hidden text-white
        ${
          isActive
            ? 'border-[#C49A68] ring-2 ring-[#C49A68]/30 shadow-lg'
            : 'border-white/[0.14] hover:border-white/30'
        }
        ${isClickable ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      {/* Reflejo superior especular */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      {/* Cabecera de la tarjeta: Título e Ícono */}
      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
              {title}
            </span>
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-[#E5BE90]">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-[#E5BE90] flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Valor Primario (Tabular mono estricto) */}
      <div className="font-mono-tabular text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight relative z-10">
        {value}
      </div>

      {/* Footer: Variación porcentual y subtítulo */}
      {(variation || subtitle) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10 text-xs relative z-10">
          {variation && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                variation.positive !== false ? 'text-[#34D399]' : 'text-[#F87171]'
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
            <span className="text-white/60 text-[11px] font-medium truncate ml-auto">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
