// frontend/src/features/storefront/components/CategoryFilters.tsx
import { Search, X } from 'lucide-react';

export type CategoryFilterType = 'Todas' | 'Ropa' | 'Accesorios' | 'Cosméticos' | 'Artesanías';

interface Props {
  selectedCategory: CategoryFilterType;
  onSelectCategory: (cat: CategoryFilterType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CATEGORIES: CategoryFilterType[] = ['Todas', 'Ropa', 'Accesorios', 'Cosméticos', 'Artesanías'];

export const CategoryFilters = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: Props) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      {/* Píldoras de Categoría con estética Liquid Glass */}
      <div
        role="tablist"
        aria-label="Filtro de categorías de productos"
        className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-white/70 dark:bg-slate-900/60 backdrop-blur-md text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Buscador de texto accesible */}
      <div className="relative w-full md:w-72">
        <label htmlFor="search-products" className="sr-only">
          Buscar productos
        </label>
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id="search-products"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o detalle..."
          className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};