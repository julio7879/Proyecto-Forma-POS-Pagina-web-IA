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
    <div className="w-full space-y-6">
      {/* Encabezado */}
      <div className="glass-mirror-card rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="glass-mirror-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-[#661521] border border-[#D19650]/40 mb-2">
            RN-GEN-02 · Kardex Único Multisede
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight font-display">
            Inventario Multisede
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#50322A] mt-1">
            Consulta el desglose de saldos por sede, reservas blandas/duras y mercancía en custodia o no vendible.
          </p>
        </div>
        <div className="glass-mirror-pill px-4 py-3 rounded-2xl border border-[#D19650]/40 flex items-center gap-3 self-start md:self-auto">
          <div className="text-right">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#50322A]">
              Registros Visibles
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#171717]">
              {data.length}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros 3D Mirror Liquid Glass */}
      <div className="glass-mirror-card p-5 rounded-3xl flex flex-col md:flex-row gap-3.5 items-stretch md:items-center">
        {/* Selector de Categoría */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 w-4 h-4 text-[#50322A] pointer-events-none" />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
            className="capsule-mirror-input pl-10 pr-9 py-2.5 rounded-2xl text-sm font-bold text-[#171717] cursor-pointer w-full md:w-auto"
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat} className="bg-[#F4EFE8] text-[#171717]">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Buscador por SKU */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#50322A] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por SKU o nombre..."
            aria-label="Buscar por SKU o nombre"
            className="capsule-mirror-input w-full pl-10 pr-9 py-2.5 rounded-2xl text-sm font-semibold text-[#171717] placeholder-[#50322A]/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-3 text-[#50322A] hover:text-[#661521] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle de Stock Bajo */}
        <label className="glass-mirror-pill flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-[#D19650]/45 cursor-pointer hover:border-[#661521] transition-all select-none">
          <input
            type="checkbox"
            checked={soloStockBajo}
            onChange={(e) => setSoloStockBajo(e.target.checked)}
            className="w-4 h-4 accent-[#661521] rounded cursor-pointer"
          />
          <span className="text-sm font-bold text-[#171717] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#661521]" />
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
          className="glass-mirror-card rounded-3xl overflow-hidden"
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 border-b border-[#50322A]/10 animate-pulse bg-white/50"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="glass-mirror-card p-5 rounded-3xl border border-[#661521]/40 flex items-center justify-between text-sm font-semibold text-[#661521]">
          <span>No se pudo cargar el inventario. Verifica tu conexión.</span>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#661521] text-white border border-[#D19650]/50 rounded-xl font-bold flex items-center gap-2 hover:bg-[#4A0E17] transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty */}
      {!isLoading && !isError && data.length === 0 && (
        <div className="glass-mirror-card text-center py-16 px-6 rounded-3xl">
          <PackageX className="w-12 h-12 text-[#50322A] mx-auto mb-3" />
          <h3 className="text-xl font-black text-[#171717] font-display">
            No se encontraron registros
          </h3>
          <p className="text-sm font-medium text-[#50322A] max-w-sm mx-auto mt-1 mb-5">
            No hay productos que coincidan con los filtros aplicados.
          </p>
          <button
            onClick={() => {
              setCategoria('Todas');
              setSearchQuery('');
              setSoloStockBajo(false);
            }}
            className="px-5 py-2.5 bg-[#661521] text-white border border-[#D19650]/50 rounded-xl text-sm font-bold hover:bg-[#4A0E17] transition-all shadow-md"
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
        <div className="mt-2 text-xs font-semibold text-[#50322A] flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#661521]" />
          Actualizando...
        </div>
      )}
    </div>
  );
};

export default AdminInventarioPage;
