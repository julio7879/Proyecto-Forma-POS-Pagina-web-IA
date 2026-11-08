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
      className={`rounded-2xl bg-white border border-[#E7E0D8] p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77736E] pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-semibold text-[#292827] placeholder:text-[#77736E]/70 focus:outline-none focus:border-[#741C2B] focus:ring-1 focus:ring-[#741C2B]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77736E] hover:text-[#292827]"
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
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
