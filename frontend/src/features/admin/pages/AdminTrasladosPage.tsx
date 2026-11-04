// frontend/src/features/admin/pages/AdminTrasladosPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, RefreshCw, AlertCircle, PackageCheck, ArrowRight } from 'lucide-react';
import {
  fetchTraslados,
  EstadoTraslado,
  TrasladoDTO,
} from '../services/adminService';
import { DespachoTrasladoModal } from '../components/DespachoTrasladoModal';
import { RecepcionTrasladoModal } from '../components/RecepcionTrasladoModal';
import { ResolucionNovedadModal } from '../components/ResolucionNovedadModal';

type TabEstado = 'Todos' | 'En Tránsito' | 'En Novedad' | 'Cerrados';

const TABS: TabEstado[] = ['Todos', 'En Tránsito', 'En Novedad', 'Cerrados'];

// Mapeo de estado de traslado → tab al que pertenece
const ESTADO_A_TAB: Record<EstadoTraslado, TabEstado> = {
  SOLICITADO: 'Todos',
  APROBADO: 'Todos',
  RECHAZADO: 'Cerrados',
  ENVIADO: 'En Tránsito',
  RETORNANDO_A_CENTRAL: 'En Tránsito',
  RECIBIDO: 'Cerrados',
  RECIBIDO_CON_NOVEDAD: 'En Novedad',
  CERRADO: 'Cerrados',
  CANCELADO: 'Cerrados',
};

// Colores y labels por estado
const ESTADO_CONFIG: Record<EstadoTraslado, { bg: string; text: string; label: string }> = {
  SOLICITADO: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', label: 'Solicitado' },
  APROBADO: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', label: 'Aprobado' },
  RECHAZADO: { bg: 'bg-red-100 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', label: 'Rechazado' },
  ENVIADO: { bg: 'bg-indigo-100 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', label: 'En Tránsito' },
  RETORNANDO_A_CENTRAL: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', label: 'Retornando' },
  RECIBIDO: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'Recibido' },
  RECIBIDO_CON_NOVEDAD: { bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', label: 'Con Novedad' },
  CERRADO: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', label: 'Cerrado' },
  CANCELADO: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-500', label: 'Cancelado' },
};

export const AdminTrasladosPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabEstado>('Todos');

  // Modales
  const [trasladoDespacho, setTrasladoDespacho] = useState<TrasladoDTO | null>(null);
  const [trasladoRecepcion, setTrasladoRecepcion] = useState<TrasladoDTO | null>(null);
  const [trasladoResolucion, setTrasladoResolucion] = useState<TrasladoDTO | null>(null);

  // Query de traslados
  const {
    data: traslados = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-traslados'],
    queryFn: () => fetchTraslados(),
    staleTime: 30_000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-traslados'] });
  };

  // Filtrado por tab activo
  const trasladosFiltrados = useMemo(() => {
    if (activeTab === 'Todos') return traslados;
    return traslados.filter((t) => ESTADO_A_TAB[t.estado] === activeTab);
  }, [traslados, activeTab]);

  // Contadores por tab
  const counts = useMemo(() => {
    const result: Record<TabEstado, number> = {
      Todos: traslados.length,
      'En Tránsito': 0,
      'En Novedad': 0,
      Cerrados: 0,
    };
    traslados.forEach((t) => {
      const tab = ESTADO_A_TAB[t.estado];
      if (tab !== 'Todos') result[tab]++;
    });
    return result;
  }, [traslados]);

  const formatFecha = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Traslados entre Sedes
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Control logístico de mercancía en tránsito, recepciones y resolución de novedades.
        </p>
      </div>

      {/* Tabs de estado */}
      <div
        role="tablist"
        aria-label="Filtrar traslados por estado"
        className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 border-b border-slate-200/60 dark:border-slate-800/60"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {tab}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ESTADO 1: Loading */}
      {isLoading && (
        <div
          data-testid="traslados-skeleton"
          aria-label="Cargando traslados"
          aria-busy="true"
          className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden"
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 border-b border-slate-100 dark:border-slate-800/60 animate-pulse bg-slate-200/40 dark:bg-slate-800/40"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center justify-between text-xs text-red-800 dark:text-red-200">
          <span>No se pudieron cargar los traslados.</span>
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
      {!isLoading && !isError && trasladosFiltrados.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No hay traslados en esta categoría
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === 'Todos'
              ? 'Aún no se han creado traslados entre sedes.'
              : `No hay traslados con estado "${activeTab}".`}
          </p>
        </div>
      )}

      {/* ESTADO 4: Success */}
      {!isLoading && !isError && trasladosFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800/60">
              <tr className="text-left">
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Código
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Ruta
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Estado
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Solicitud
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Envío
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] text-center">
                  Líneas
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {trasladosFiltrados.map((t) => {
                const config = ESTADO_CONFIG[t.estado];
                const puedeDespachar = t.estado === 'APROBADO';
                const puedeRecibir = t.estado === 'ENVIADO';
                const puedeResolver = t.estado === 'RECIBIDO_CON_NOVEDAD';

                return (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {t.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="font-medium">{t.origenNombre}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{t.destinoNombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}
                      >
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatFecha(t.fechaSolicitud)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatFecha(t.fechaEnvio)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700 dark:text-slate-300">
                      {t.lineas.length}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {puedeDespachar && (
                          <button
                            onClick={() => setTrasladoDespacho(t)}
                            aria-label={`Despachar traslado ${t.codigo}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Despachar
                          </button>
                        )}
                        {puedeRecibir && (
                          <button
                            onClick={() => setTrasladoRecepcion(t)}
                            aria-label={`Recibir traslado ${t.codigo}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Recibir
                          </button>
                        )}
                        {puedeResolver && (
                          <button
                            onClick={() => setTrasladoResolucion(t)}
                            aria-label={`Resolver novedad de ${t.codigo}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-600/20"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Resolver
                          </button>
                        )}
                        {!puedeDespachar && !puedeRecibir && !puedeResolver && (
                          <span className="text-[10px] text-slate-400 italic">
                            {config.label}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Indicador de refetch */}
      {isFetching && !isLoading && !isError && (
        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Actualizando...
        </div>
      )}

      {/* Modales */}
      <DespachoTrasladoModal
        traslado={trasladoDespacho}
        isOpen={trasladoDespacho !== null}
        onClose={() => setTrasladoDespacho(null)}
        onSuccess={handleRefresh}
      />

      <RecepcionTrasladoModal
        traslado={trasladoRecepcion}
        isOpen={trasladoRecepcion !== null}
        onClose={() => setTrasladoRecepcion(null)}
        onSuccess={handleRefresh}
      />

      <ResolucionNovedadModal
        traslado={trasladoResolucion}
        isOpen={trasladoResolucion !== null}
        onClose={() => setTrasladoResolucion(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default AdminTrasladosPage;