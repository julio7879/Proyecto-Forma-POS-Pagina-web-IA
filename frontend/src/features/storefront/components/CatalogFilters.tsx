import React from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { CategoriaSlug, SedeId, SedeInfo } from '../types.js';

interface CatalogFiltersProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  categoriaActiva: CategoriaSlug | 'todas';
  onCategoriaChange: (cat: CategoriaSlug | 'todas') => void;
  sedeActiva: SedeId;
  sedes: SedeInfo[];
  onSedeChange: (sedeId: SedeId) => void;
  tallaFiltro: string;
  onTallaFiltroChange: (talla: string) => void;
  soloDisponibles: boolean;
  onSoloDisponiblesChange: (val: boolean) => void;
  totalResultados: number;
  onLimpiarFiltros: () => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  busqueda,
  onBusquedaChange,
  categoriaActiva,
  onCategoriaChange,
  sedeActiva,
  sedes,
  onSedeChange,
  tallaFiltro,
  onTallaFiltroChange,
  soloDisponibles,
  onSoloDisponiblesChange,
  totalResultados,
  onLimpiarFiltros,
}) => {
  const categorias: { slug: CategoriaSlug | 'todas'; label: string }[] = [
    { slug: 'todas', label: 'Todas las Colecciones' },
    { slug: 'ropa', label: 'Ropa' },
    { slug: 'accesorios', label: 'Accesorios' },
    { slug: 'cosmeticos', label: 'Cosméticos' },
    { slug: 'artesanias', label: 'Artesanías' },
  ];

  const tallasDisponibles = ['Todas', 'S', 'M', 'L', 'XL'];

  const hayFiltrosActivos =
    busqueda.trim() !== '' ||
    categoriaActiva !== 'todas' ||
    tallaFiltro !== 'Todas' ||
    soloDisponibles;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-8 border border-slate-200/60 dark:border-slate-800/60">
      {/* Fila Superior: Búsqueda y Selector de Sede */}
      <div className="flex flex-col md:flex-row gap-3.5 mb-4">
        {/* Barra de Búsqueda Instantánea */}
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Buscar productos por nombre o SKU
          </label>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="search-input"
            type="search"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar por prenda, cosmético, artesanía o SKU..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all shadow-sm"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => onBusquedaChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Borrar texto de búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selector de Sede de Despacho */}
        <div className="flex items-center gap-2">
          <label htmlFor="sede-select" className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <span>Sede de Despacho:</span>
          </label>
          <select
            id="sede-select"
            value={sedeActiva}
            onChange={(e) => onSedeChange(e.target.value as SedeId)}
            className="py-2.5 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm"
          >
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila Media: Pestañas de Categoría y Tallas */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
        {/* Pills de Categorías */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Categorías del catálogo">
          {categorias.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={categoriaActiva === cat.slug}
              onClick={() => onCategoriaChange(cat.slug)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                categoriaActiva === cat.slug
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                  : 'bg-white/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filtros Secundarios: Talla y Switch de Solo Disponibles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Talla */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">Talla:</span>
            <div className="flex gap-1">
              {tallasDisponibles.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTallaFiltroChange(t)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                    tallaFiltro === t
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                  aria-pressed={tallaFiltro === t}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Solo Disponibles */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={soloDisponibles}
              onChange={(e) => onSoloDisponiblesChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
            />
            <span>Solo en stock</span>
          </label>
        </div>
      </div>

      {/* Barra de Estado de Filtros */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2">
        <span className="font-medium">
          Mostrando <strong className="text-slate-900 dark:text-white">{totalResultados}</strong> productos
        </span>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Limpiar todos los filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
