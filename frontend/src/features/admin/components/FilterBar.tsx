import React from 'react';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Buscar registros...',
  children,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-3xl bg-white border border-slate-200/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center justify-between gap-3 overflow-hidden text-[#0F172A] ${className}`}
    >
      {/* Reflejo superior suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/15 to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F8FAFC] border border-slate-300 text-xs font-bold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#741C2B] focus:bg-white focus:ring-1 focus:ring-[#741C2B]/20 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {children}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center relative z-10 max-w-full">
          {actions}
        </div>
      )}
    </div>
  );
};
