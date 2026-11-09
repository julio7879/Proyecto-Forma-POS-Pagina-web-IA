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
      className={`relative rounded-3xl backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] p-3.5 sm:p-4 shadow-[0_12px_30px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 overflow-hidden text-white ${className}`}
    >
      {/* Reflejo superior especular */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/30 border border-white/10 text-xs font-semibold text-white placeholder:text-white/40 focus:outline-none focus:border-[#C49A68] focus:ring-1 focus:ring-[#C49A68]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
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
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center relative z-10">
          {actions}
        </div>
      )}
    </div>
  );
};
