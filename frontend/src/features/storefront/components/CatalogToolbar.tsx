// frontend/src/features/storefront/components/CatalogToolbar.tsx
import React from 'react';
import { LayoutGrid, List, ArrowUpDown, Filter, X, SlidersHorizontal } from 'lucide-react';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'recent';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  totalResults: number;
  // Filtros activos para píldoras
  selectedCategory: string;
  selectedSubcategory: string;
  selectedTalla?: string;
  selectedColor?: string;
  precioMaximo?: number | null;
  soloConStock?: boolean;
  onClearTalla?: () => void;
  onClearColor?: () => void;
  onClearPrecio?: () => void;
  onClearSubcategoria?: () => void;
  onClearStock?: () => void;
  onClearAll?: () => void;
  // Toggle del panel de filtros
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  popular: 'Más Populares',
  rating: 'Mejor Valorados (★ 5.0)',
  'price-asc': 'Precio: Menor a Mayor',
  'price-desc': 'Precio: Mayor a Menor',
  recent: 'Más Recientes / Novedades',
};

/**
 * Barra de herramientas del Catálogo: Sort By, Toggle Grid/List y Píldoras de Filtros Activos
 * Fundamentada en ARQ-07 Ley Canónica de E-Commerce (Fig. 11 y Fig. 12)
 */
export const CatalogToolbar: React.FC<Props> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  totalResults,
  selectedCategory,
  selectedSubcategory,
  selectedTalla,
  selectedColor,
  precioMaximo,
  soloConStock,
  onClearTalla,
  onClearColor,
  onClearPrecio,
  onClearSubcategoria,
  onClearStock,
  onClearAll,
  showFilterPanel,
  onToggleFilterPanel,
}) => {
  const tieneFiltrosActivos = Boolean(
    (selectedCategory && selectedCategory !== 'Todas') ||
      (selectedSubcategory && selectedSubcategory !== 'Todas') ||
      selectedTalla ||
      selectedColor ||
      precioMaximo != null ||
      soloConStock
  );

  return (
    <div className="space-y-3">
      {/* Barra Principal de Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/85 backdrop-blur-2xl border border-[#E7DED2] shadow-xs">
        {/* Izquierda: Contador y Botón Toggle Filtros */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleFilterPanel}
            aria-expanded={showFilterPanel}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showFilterPanel || tieneFiltrosActivos
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-white hover:bg-[#FAF6EF] text-[#50322A] border-[#50322A]/15'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-[#D19650]" />
            <span>Filtros Avanzados</span>
            {tieneFiltrosActivos && (
              <span className="w-2 h-2 rounded-full bg-[#D19650] animate-pulse" />
            )}
          </button>

          <span className="text-xs text-[#50322A]/80 font-medium">
            Mostrando <strong className="text-[#661521] font-mono-tabular font-bold">{totalResults}</strong>{' '}
            {totalResults === 1 ? 'prenda' : 'prendas'}
          </span>
        </div>

        {/* Derecha: Sort By Dropdown y Selector Grid/List */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* Menú de Ordenamiento (Fig. 11 ARQ-07) */}
          <div className="relative inline-flex items-center gap-1.5 bg-white border border-[#50322A]/15 rounded-xl px-3 py-1.5 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#661521] shrink-0" />
            <label htmlFor="sort-by-select" className="text-[11px] font-bold text-[#50322A]/70 uppercase tracking-wider hidden sm:inline">
              Ordenar:
            </label>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              aria-label="Ordenar productos"
              className="bg-transparent text-xs font-bold text-[#50322A] focus:outline-none cursor-pointer pr-1"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <option key={opt} value={opt}>
                  {SORT_LABELS[opt]}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Modo de Visualización: Cuadrícula vs. Lista (Fig. 12 ARQ-07) */}
          <div
            role="group"
            aria-label="Modo de visualización del catálogo"
            className="inline-flex items-center p-1 bg-[#E7DED2]/60 rounded-xl border border-white/80 shadow-inner gap-1"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-pressed={viewMode === 'grid'}
              title="Vista en Cuadrícula (Grid)"
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#661521] text-white shadow-xs'
                  : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Grid</span>
              <span className="sr-only">Vista en Cuadrícula</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
              title="Vista en Lista Detallada (List View)"
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#661521] text-white shadow-xs'
                  : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">List</span>
              <span className="sr-only">Vista en Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Píldoras de Filtros Activos */}
      {tieneFiltrosActivos && (
        <div className="flex items-center flex-wrap gap-2 px-1 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-[#50322A]/60 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#D19650]" />
            Filtros Activos:
          </span>

          {selectedCategory && selectedCategory !== 'Todas' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#351912] text-white text-xs font-bold shadow-2xs">
              <span>Categoría: {selectedCategory}</span>
            </span>
          )}

          {selectedSubcategory && selectedSubcategory !== 'Todas' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#661521] text-white text-xs font-bold shadow-2xs">
              <span>Subcategoría: {selectedSubcategory}</span>
              {onClearSubcategoria && (
                <button
                  type="button"
                  onClick={onClearSubcategoria}
                  className="hover:text-[#D19650] transition-colors ml-0.5 cursor-pointer"
                  title="Eliminar filtro de subcategoría"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {selectedTalla && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#50322A] text-white text-xs font-bold shadow-2xs">
              <span>Talla: {selectedTalla}</span>
              {onClearTalla && (
                <button
                  type="button"
                  onClick={onClearTalla}
                  className="hover:text-[#D19650] transition-colors ml-0.5 cursor-pointer"
                  title="Eliminar filtro de talla"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {selectedColor && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#50322A] text-white text-xs font-bold shadow-2xs">
              <span>Color: {selectedColor}</span>
              {onClearColor && (
                <button
                  type="button"
                  onClick={onClearColor}
                  className="hover:text-[#D19650] transition-colors ml-0.5 cursor-pointer"
                  title="Eliminar filtro de color"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {precioMaximo != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D19650] text-[#171717] text-xs font-bold font-mono shadow-2xs">
              <span>Hasta ${precioMaximo.toLocaleString('es-CO')}</span>
              {onClearPrecio && (
                <button
                  type="button"
                  onClick={onClearPrecio}
                  className="hover:text-[#661521] transition-colors ml-0.5 cursor-pointer"
                  title="Eliminar filtro de precio"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {soloConStock && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-bold shadow-2xs">
              <span>Solo con stock disponible</span>
              {onClearStock && (
                <button
                  type="button"
                  onClick={onClearStock}
                  className="hover:text-emerald-200 transition-colors ml-0.5 cursor-pointer"
                  title="Eliminar filtro de stock"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-bold text-[#661521] hover:underline px-2 py-0.5 cursor-pointer"
            >
              Limpiar todos
            </button>
          )}
        </div>
      )}
    </div>
  );
};
