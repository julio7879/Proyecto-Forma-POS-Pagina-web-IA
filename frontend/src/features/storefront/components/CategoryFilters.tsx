// frontend/src/features/storefront/components/CategoryFilters.tsx
import { Search, X } from 'lucide-react';

export type CategoryFilterType = 'Todas' | 'Ropa' | 'Calzado' | 'Accesorios' | 'Cosméticos' | 'Artesanías';

interface Props {
  selectedCategory: CategoryFilterType;
  onSelectCategory: (cat: CategoryFilterType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CATEGORIES: CategoryFilterType[] = [
  'Todas',
  'Ropa',
  'Calzado',
  'Accesorios',
  'Cosméticos',
  'Artesanías',
];

export const CategoryFilters = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: Props) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
      {/* Píldoras de Categoría con paleta Crema/Vinotinto/Dorado/Café (Stitch v2.4) */}
      <div
        role="tablist"
        aria-label="Filtro de categorías de productos"
        className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#661521] text-white shadow-md shadow-[#661521]/25 scale-[1.02]'
                  : 'glass-mirror-pill text-[#50322A] hover:text-[#661521] hover:border-[#D19650]'
              }`}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#D19650]" />}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Buscador de texto en Cápsula Espejo */}
      <div className="relative w-full lg:w-80">
        <label htmlFor="search-products" className="sr-only">
          Buscar productos
        </label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#50322A]/60 pointer-events-none" />
        <input
          id="search-products"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o detalle..."
          className="w-full pl-10 pr-9 py-2.5 rounded-full text-xs capsule-mirror-input text-[#171717] placeholder:text-[#50322A]/55"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#50322A]/60 hover:text-[#661521]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
