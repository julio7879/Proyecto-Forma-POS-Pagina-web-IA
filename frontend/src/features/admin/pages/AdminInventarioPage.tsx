// frontend/src/features/admin/pages/AdminInventarioPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, AlertTriangle, PackageX, RefreshCw, Filter } from 'lucide-react';
import { fetchInventario, InventarioFiltro } from '../services/adminService';
import { InventarioTable } from '../components/InventarioTable';

// Debounce helper interno para evitar consultar por cada pulsación
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const CATEGORIAS = ['Todas', 'Ropa', 'Accesorios', 'Cosméticos', 'Artesanías'];

export const AdminInventarioPage = () => {
  // Estados de filtro
  const [categoria, setCategoria] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  // Debounce de la búsqueda a 300ms
  const searchDebounced = useDebounce(searchQuery, 300);

  // Construcción del filtro para la API
  const filtro: InventarioFiltro = useMemo(() => {
    const f: InventarioFiltro = {};
    if (categoria !== 'Todas') f.categoria = categoria;
    if (searchDebounced.trim()) f.sku = searchDebounced.trim();
    if (soloStockBajo) f.stockBajo = true;
    return f;
  }, [categoria, searchDebounced, soloStockBajo]);

  // Query con TanStack Query
  const {
    data = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-inventario', filtro],
    queryFn: () => fetchInventario(filtro),
    staleTime: 30_000, // 30 segundos de caché
  });

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Inventario Multisede
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Consulta el desglose de saldos por sede, reservas y mercancía no vendible.
        </p>
      </div>

      {/* Barra de Filtros Liquid Glass */}
      <div className="mb-6 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Selector de Categoría */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
            className="pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Buscador por SKU */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por SKU o nombre..."
            aria-label="Buscar por SKU o nombre"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle de Stock Bajo */}
        <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 cursor-pointer hover:border-amber-400 transition-colors">
          <input
            type="checkbox"
            checked={soloStockBajo}
            onChange={(e) => setSoloStockBajo(e.target.checked)}
            className="w-4 h-4 text-amber-600 rounded"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Stock bajo
          </span>
        </label>
      </div>

      {/* ESTADO 1: Loading inicial */}
      {isLoading && (
        <div
          data-testid="inventario-skeleton"
          aria-label="Cargando inventario"
          aria-busy="true"
          className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden"
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-14 border-b border-slate-100 dark:border-slate-800/60 animate-pulse bg-slate-200/40 dark:bg-slate-800/40"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center justify-between text-xs text-red-800 dark:text-red-200">
          <span>No se pudo cargar el inventario. Verifica tu conexión.</span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-red-200 dark:bg-red-800 rounded-lg font-bold flex items-center gap-1.5 hover:bg-red-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty */}
      {!isLoading && !isError && data.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron registros
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No hay productos que coincidan con los filtros aplicados.
          </p>
          <button
            onClick={() => {
              setCategoria('Todas');
              setSearchQuery('');
              setSoloStockBajo(false);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20"
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* ESTADO 4: Success (Tabla) */}
      {!isLoading && !isError && data.length > 0 && (
        <InventarioTable data={data} />
      )}

      {/* Indicador de refetch en vuelo (discreto) */}
      {isFetching && !isLoading && !isError && (
        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Actualizando...
        </div>
      )}
    </div>
  );
};

export default AdminInventarioPage;