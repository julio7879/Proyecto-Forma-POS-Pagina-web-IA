// frontend/src/features/admin/pages/AdminInventarioPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  PackageX,
  RefreshCw,
  Filter,
  Layers,
  ArrowUpDown,
  Store,
  ShieldCheck,
  PackageCheck,
} from 'lucide-react';
import { fetchInventario, InventarioFiltro, InventarioDTO } from '../services/adminService';
import { InventarioTable, CampoOrdenInventario } from '../components/InventarioTable';
import { PageHeader } from '../components/PageHeader';
import { FilterBar } from '../components/FilterBar';
import { KPIStatCard } from '../components/KPIStatCard';
import { DetailDrawer, ActivityTimelineItem } from '../../pos/components/DetailDrawer';

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

const SEDES_OPCIONES = [
  'Todas las Sedes (Consolidado)',
  'Bodega Central',
  'Punto Centro',
  'Punto Caobos',
  'Punto Ocaña',
  'Punto Bucaramanga',
];

export const AdminInventarioPage: React.FC = () => {
  // Estados de filtro
  const [categoria, setCategoria] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [soloConStock, setSoloConStock] = useState(false);

  // Ordenamiento interactivo (Mayor a menor cantidad / Menor a mayor)
  const [campoOrden, setCampoOrden] = useState<CampoOrdenInventario>('disponible');
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('desc');

  // Registro seleccionado para el DetailDrawer
  const [selectedItem, setSelectedItem] = useState<InventarioDTO | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'productos' | 'actividad' | 'comprobantes'>('detalle');

  // Sincronización con Sede seleccionada y actualización reactiva de inventario
  const [sedeGlobal, setSedeGlobal] = useState<string>(
    () => localStorage.getItem('forma_admin_sede') || 'Todas las Sedes (Consolidado)'
  );

  const handleCambiarSede = (nuevaSede: string) => {
    setSedeGlobal(nuevaSede);
    localStorage.setItem('forma_admin_sede', nuevaSede);
    window.dispatchEvent(new Event('forma-admin-sede-change'));
  };

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
    staleTime: 30_000,
  });

  useEffect(() => {
    const handleSedeChange = () => {
      setSedeGlobal(localStorage.getItem('forma_admin_sede') || 'Todas las Sedes (Consolidado)');
      refetch();
    };
    const handleLedgerUpdate = () => {
      refetch();
    };
    window.addEventListener('forma-admin-sede-change', handleSedeChange);
    window.addEventListener('forma-pos-ledger-update', handleLedgerUpdate);
    window.addEventListener('storage', handleSedeChange);
    return () => {
      window.removeEventListener('forma-admin-sede-change', handleSedeChange);
      window.removeEventListener('forma-pos-ledger-update', handleLedgerUpdate);
      window.removeEventListener('storage', handleSedeChange);
    };
  }, [refetch]);

  // Filtrado por sede seleccionada (Bodega Central, tiendas o consolidado)
  const dataFiltradaSede = useMemo(() => {
    if (!sedeGlobal || sedeGlobal.includes('Todas las Sedes')) {
      return data;
    }
    const cleanSede = sedeGlobal.toLowerCase().trim();
    return data.filter(
      (d) =>
        d.sedeNombre.toLowerCase().includes(cleanSede) ||
        cleanSede.includes(d.sedeNombre.toLowerCase())
    );
  }, [data, sedeGlobal]);

  // Métricas de inventario para la sede seleccionada
  const metricasInventario = useMemo(() => {
    const totalFisico = dataFiltradaSede.reduce((acc, item) => acc + (item.fisico || 0), 0);
    const totalDisponible = dataFiltradaSede.reduce((acc, item) => acc + (item.disponible || 0), 0);
    const totalNoVendible = dataFiltradaSede.reduce((acc, item) => acc + (item.noVendible || 0), 0);
    const totalReservadoDuro = dataFiltradaSede.reduce((acc, item) => acc + (item.reservadoDuro || 0), 0);
    const totalReferencias = dataFiltradaSede.length;
    const conStock = dataFiltradaSede.filter((item) => (item.disponible || 0) > 0 || (item.fisico || 0) > 0).length;
    return {
      totalFisico,
      totalDisponible,
      totalNoVendible,
      totalReservadoDuro,
      totalReferencias,
      conStock,
    };
  }, [dataFiltradaSede]);

  // Filtrado adicional si se activa "Solo con existencias (> 0)"
  const dataFiltrada = useMemo(() => {
    if (!soloConStock) return dataFiltradaSede;
    return dataFiltradaSede.filter(
      (item) => (item.disponible || 0) > 0 || (item.fisico || 0) > 0
    );
  }, [dataFiltradaSede, soloConStock]);

  // Alternar ordenamiento por columna
  const handleToggleSort = (campo: CampoOrdenInventario) => {
    if (campoOrden === campo) {
      setDireccionOrden((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setCampoOrden(campo);
      setDireccionOrden(campo === 'producto' || campo === 'sede' ? 'asc' : 'desc');
    }
  };

  // Datos ordenados dinámicamente de mayor a menor o menor a mayor
  const dataOrdenada = useMemo(() => {
    const copia = [...dataFiltrada];
    copia.sort((a, b) => {
      let cmp = 0;
      switch (campoOrden) {
        case 'disponible':
          cmp = a.disponible - b.disponible;
          break;
        case 'fisico':
          cmp = a.fisico - b.fisico;
          break;
        case 'noVendible':
          cmp = a.noVendible - b.noVendible;
          break;
        case 'reservadoBlando':
          cmp = a.reservadoBlando - b.reservadoBlando;
          break;
        case 'reservadoDuro':
          cmp = a.reservadoDuro - b.reservadoDuro;
          break;
        case 'producto':
          cmp = a.nombreProducto.localeCompare(b.nombreProducto);
          break;
        case 'sede':
          cmp = a.sedeNombre.localeCompare(b.sedeNombre);
          break;
      }
      return direccionOrden === 'desc' ? -cmp : cmp;
    });
    return copia;
  }, [dataFiltrada, campoOrden, direccionOrden]);

  // Timeline simulado de movimientos Kardex para el DetailDrawer
  const timelineActividad = useMemo<ActivityTimelineItem[]>(() => {
    if (!selectedItem) return [];
    return [
      {
        id: 'act-1',
        timestamp: 'Hoy · 02:40 p. m.',
        title: 'Verificación de Saldo en Línea',
        description: `Kardex auditado en ${selectedItem.sedeNombre}. Físico: ${selectedItem.fisico} uds | Disponible: ${selectedItem.disponible} uds.`,
        user: 'Sistema Kardex Central',
        type: 'success',
      },
      {
        id: 'act-2',
        timestamp: 'Ayer · 05:15 p. m.',
        title: 'Reserva Dura de Pedido Web',
        description: `Reservado duro: ${selectedItem.reservadoDuro} uds asignadas a preparación para despacho.`,
        user: 'Motor Omnicanal',
        type: selectedItem.reservadoDuro > 0 ? 'warning' : 'neutral',
      },
      {
        id: 'act-3',
        timestamp: 'Inicio de Mes',
        title: 'Saldo Inicial Registrado',
        description: `Ingreso por traslado o recepción de taller a sede ${selectedItem.sedeNombre}.`,
        user: 'Administrador General',
        type: 'neutral',
      },
    ];
  }, [selectedItem]);

  return (
    <div className="w-full space-y-5">
      {/* Encabezado Ejecutivo Estandarizado */}
      <PageHeader
        title="Inventario y Kardex Multisede"
        subtitle="Consulta el desglose de existencias por punto de venta, reservas operativas y mercancía en custodia."
        badge="Kardex Centralizado Multisede"
        actions={
          <div className="px-4 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] flex items-center gap-3">
            <Layers className="w-4 h-4 text-[#741C2B]" />
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#77736E]">
                Total Unidades Físicas
              </span>
              <span className="text-lg font-black font-mono-tabular text-[#292827]">
                {metricasInventario.totalFisico.toLocaleString('es-CO')}{' '}
                <span className="text-xs font-semibold text-[#77736E]">uds</span>
              </span>
            </div>
          </div>
        }
      />

      {/* 4 Indicadores Ejecutivos de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="Total Unidades Físicas"
          value={`${metricasInventario.totalFisico.toLocaleString('es-CO')} uds`}
          subtitle={
            sedeGlobal.includes('Todas')
              ? 'Existencias consolidadas en red multisede'
              : `Existencias reales en ${sedeGlobal}`
          }
          icon={Layers}
        />
        <KPIStatCard
          title="Stock Disponible"
          value={`${metricasInventario.totalDisponible.toLocaleString('es-CO')} uds`}
          subtitle="Unidades libres para venta inmediata"
          icon={ShieldCheck}
        />
        <KPIStatCard
          title="Referencias en Catálogo"
          value={`${metricasInventario.totalReferencias}`}
          subtitle={
            metricasInventario.conStock > 0
              ? `${metricasInventario.conStock} variantes con stock activo`
              : '0 con existencias (todas agotadas en este punto)'
          }
          icon={Store}
        />
        <KPIStatCard
          title="Mercancía No Vendible"
          value={`${metricasInventario.totalNoVendible.toLocaleString('es-CO')} uds`}
          subtitle="Averías o custodia en sede"
          icon={AlertTriangle}
        />
      </div>

      {/* Barra de Filtros Light Liquid Glass */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por SKU o nombre..."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E7E0D8] bg-[#F5F3EF] cursor-pointer hover:border-[#741C2B]/40 transition-colors select-none">
              <input
                type="checkbox"
                checked={soloConStock}
                onChange={(e) => setSoloConStock(e.target.checked)}
                className="w-4 h-4 accent-[#741C2B] rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-[#292827] flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-[#1E7E34]" />
                Solo con existencias ({'>'} 0)
              </span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E7E0D8] bg-[#F5F3EF] cursor-pointer hover:border-[#741C2B]/40 transition-colors select-none">
              <input
                type="checkbox"
                checked={soloStockBajo}
                onChange={(e) => setSoloStockBajo(e.target.checked)}
                className="w-4 h-4 accent-[#741C2B] rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-[#292827] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B77925]" />
                Stock bajo
              </span>
            </label>
          </div>
        }
      >
        {/* Selector de Sede */}
        <div className="relative">
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77736E] pointer-events-none" />
          <select
            value={sedeGlobal}
            onChange={(e) => handleCambiarSede(e.target.value)}
            aria-label="Filtrar por sede"
            className="pl-8 pr-8 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer w-full sm:w-auto"
          >
            {SEDES_OPCIONES.map((sede) => (
              <option key={sede} value={sede} className="bg-white text-[#292827]">
                {sede}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Categoría */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77736E] pointer-events-none" />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
            className="pl-8 pr-8 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer w-full sm:w-auto"
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat} className="bg-white text-[#292827]">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Orden Rápido (Mayor a menor cantidad) */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77736E] pointer-events-none" />
          <select
            value={`${campoOrden}_${direccionOrden}`}
            onChange={(e) => {
              const val = e.target.value;
              const [c, d] = val.split('_') as [CampoOrdenInventario, 'asc' | 'desc'];
              setCampoOrden(c);
              setDireccionOrden(d);
            }}
            aria-label="Ordenar inventario"
            className="pl-8 pr-8 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer w-full sm:w-auto"
          >
            <option value="disponible_desc">Mayor a menor: Stock Disponible</option>
            <option value="disponible_asc">Menor a mayor: Stock Disponible (Agotándose)</option>
            <option value="fisico_desc">Mayor a menor: Stock Físico</option>
            <option value="fisico_asc">Menor a mayor: Stock Físico</option>
            <option value="noVendible_desc">Mayor a menor: No Vendible (Averías)</option>
            <option value="reservadoDuro_desc">Mayor a menor: Reservado Duro</option>
            <option value="producto_asc">Producto: A → Z</option>
          </select>
        </div>
      </FilterBar>

      {/* ESTADO 1: Loading inicial con Skeleton */}
      {isLoading && (
        <div
          data-testid="inventario-skeleton"
          aria-label="Cargando inventario"
          aria-busy="true"
          className="rounded-2xl bg-white border border-[#E7E0D8] overflow-hidden p-4 space-y-3"
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl border border-[#E7E0D8]/60 animate-pulse bg-[#F5F3EF]/60"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="p-5 rounded-2xl bg-white border border-[#C44848]/30 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold text-[#C44848]">
          <span>No se pudo cargar el inventario. Verifica tu conexión o intenta nuevamente.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#741C2B] text-white border border-[#C49A68]/40 rounded-xl font-bold flex items-center gap-2 hover:bg-[#5A1420] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty */}
      {!isLoading && !isError && dataFiltrada.length === 0 && (
        <div className="rounded-2xl bg-white border border-[#E7E0D8] text-center py-16 px-6 shadow-2xs">
          <PackageX className="w-10 h-10 text-[#77736E] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[#292827] font-display">
            No se encontraron registros
          </h3>
          <p className="text-xs text-[#77736E] max-w-sm mx-auto mt-1 mb-4">
            No hay productos que coincidan con los filtros aplicados.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoria('Todas');
              setSearchQuery('');
              setSoloStockBajo(false);
            }}
            className="px-4 py-2 bg-[#741C2B] text-white border border-[#C49A68]/40 rounded-xl text-xs font-bold hover:bg-[#5A1420] transition-colors shadow-2xs cursor-pointer"
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* ESTADO 4: Success (Tabla con selección de fila y ordenamiento interactivo) */}
      {!isLoading && !isError && dataOrdenada.length > 0 && (
        <InventarioTable
          data={dataOrdenada}
          campoOrden={campoOrden}
          direccionOrden={direccionOrden}
          onToggleSort={handleToggleSort}
          onSelectRow={(item) => {
            setSelectedItem(item);
            setDrawerTab('detalle');
          }}
        />
      )}

      {/* Indicador de refetch en vuelo */}
      {isFetching && !isLoading && !isError && (
        <div className="mt-2 text-xs font-semibold text-[#77736E] flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#741C2B]" />
          Actualizando...
        </div>
      )}

      {/* =========================================================================
          DETAIL DRAWER: FICHA MAESTRA DE INVENTARIO Y DESGLOSE KARDEX
          ========================================================================= */}
      {selectedItem && (
        <DetailDrawer
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`Inventario · ${selectedItem.nombreProducto}`}
          subtitle={`SKU: ${selectedItem.sku} • Sede: ${selectedItem.sedeNombre}`}
          badge={{
            label:
              selectedItem.disponible <= selectedItem.umbralStockBajo
                ? `Stock Bajo (${selectedItem.disponible} uds)`
                : `Stock Óptimo (${selectedItem.disponible} uds)`,
            variant:
              selectedItem.disponible <= selectedItem.umbralStockBajo
                ? 'warning'
                : 'success',
          }}
          tabs={[
            { id: 'detalle', label: 'Información' },
            { id: 'productos', label: 'Saldos y Reservas' },
            { id: 'actividad', label: 'Historial' },
            { id: 'comprobantes', label: 'Comprobantes' },
          ]}
          activeTab={drawerTab}
          onTabChange={(tab) => setDrawerTab(tab as any)}
          activityItems={timelineActividad}
          footerActions={
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E7E0D8] bg-[#F5F3EF] hover:bg-stone-200 text-[#292827] font-bold text-xs transition-colors cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          }
        >
          {/* Contenido según pestaña */}
          <div className="space-y-4">
            {(drawerTab === 'detalle' || drawerTab === 'productos') && (
              <>
                {/* Tarjeta de Resumen */}
                <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-[#77736E] tracking-wider">
                      Categoría
                    </span>
                    <span className="text-xs font-bold text-[#741C2B]">
                      {selectedItem.categoriaNombre}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-[#77736E] tracking-wider">
                      Umbral de Alerta
                    </span>
                    <span className="font-mono-tabular text-xs font-bold text-[#292827]">
                      {selectedItem.umbralStockBajo} unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-[#77736E] tracking-wider">
                      Sede Asignada
                    </span>
                    <span className="text-xs font-bold text-[#292827]">
                      {selectedItem.sedeNombre}
                    </span>
                  </div>
                </div>

                {/* Matriz de Saldos Kardex */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#77736E]">
                    Desglose Físico y Disponibilidad
                  </h4>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-xl bg-white border border-[#E7E0D8]">
                      <span className="text-[10px] font-extrabold uppercase text-[#77736E] block mb-1">
                        Físico Total
                      </span>
                      <span className="font-mono-tabular text-xl font-black text-[#292827]">
                        {selectedItem.fisico} <span className="text-xs font-normal text-[#77736E]">uds</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-[10px] font-extrabold uppercase text-[#27845C] block mb-1">
                        Disponible Venta
                      </span>
                      <span className="font-mono-tabular text-xl font-black text-[#27845C]">
                        {selectedItem.disponible} <span className="text-xs font-normal text-[#27845C]/80">uds</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#E7E0D8]">
                      <span className="text-[10px] font-extrabold uppercase text-[#77736E] block mb-1">
                        Reserva Blanda (Web)
                      </span>
                      <span className="font-mono-tabular text-lg font-bold text-[#77736E]">
                        {selectedItem.reservadoBlando} <span className="text-xs font-normal">uds</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                      <span className="text-[10px] font-extrabold uppercase text-[#B77925] block mb-1">
                        Reserva Dura (Empaque)
                      </span>
                      <span className="font-mono-tabular text-lg font-bold text-[#B77925]">
                        {selectedItem.reservadoDuro} <span className="text-xs font-normal">uds</span>
                      </span>
                    </div>
                  </div>

                  {selectedItem.noVendible > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#C44848] font-semibold flex items-center justify-between">
                      <span>Averías / Mercancía no vendible:</span>
                      <span className="font-mono-tabular font-bold">{selectedItem.noVendible} uds</span>
                    </div>
                  )}
                </div>

                {/* Aviso de Invariante Kardex */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E7E0D8] text-[11px] text-[#77736E] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#741C2B] shrink-0" />
                  <span>
                    Registro inmutable sincronizado con el Ledger Central de PostgreSQL.
                  </span>
                </div>
              </>
            )}

            {drawerTab === 'comprobantes' && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#77736E]">
                  Auditoría Kardex y Referencias
                </h4>
                <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">ID Inventario:</span>
                    <span className="font-mono font-bold text-[#741C2B]">INV-{selectedItem.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">Estado de Stock:</span>
                    <span className="font-bold text-[#292827]">
                      {selectedItem.disponible <= selectedItem.umbralStockBajo ? 'Stock Bajo' : 'Nivel Óptimo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">Punto de Despacho:</span>
                    <span className="font-bold text-[#292827]">{selectedItem.sedeNombre}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
};

export default AdminInventarioPage;
