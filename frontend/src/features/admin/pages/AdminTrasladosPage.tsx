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

// Colores y labels por estado en la paleta oficial FORMA
const ESTADO_CONFIG: Record<EstadoTraslado, { bg: string; text: string; label: string }> = {
  SOLICITADO: {
    bg: 'bg-[#E7DED2] border border-[#50322A]/30',
    text: 'text-[#351912]',
    label: 'Solicitado',
  },
  APROBADO: {
    bg: 'bg-[#D19650]/25 border border-[#D19650]',
    text: 'text-[#351912]',
    label: 'Aprobado',
  },
  RECHAZADO: {
    bg: 'bg-[#661521]/15 border border-[#661521]/40',
    text: 'text-[#661521]',
    label: 'Rechazado',
  },
  ENVIADO: {
    bg: 'bg-[#661521] border border-[#D19650]',
    text: 'text-white',
    label: 'En Tránsito',
  },
  RETORNANDO_A_CENTRAL: {
    bg: 'bg-[#D19650]/30 border border-[#D19650]',
    text: 'text-[#351912]',
    label: 'Retornando',
  },
  RECIBIDO: {
    bg: 'bg-[#351912] border border-[#D19650]/60',
    text: 'text-[#F4EFE8]',
    label: 'Recibido',
  },
  RECIBIDO_CON_NOVEDAD: {
    bg: 'bg-[#661521] border border-[#D19650]',
    text: 'text-[#D19650]',
    label: 'Con Novedad',
  },
  CERRADO: {
    bg: 'bg-[#50322A]/15 border border-[#50322A]/30',
    text: 'text-[#50322A]',
    label: 'Cerrado',
  },
  CANCELADO: {
    bg: 'bg-[#50322A]/10 border border-[#50322A]/25',
    text: 'text-[#50322A]',
    label: 'Cancelado',
  },
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
    <div className="w-full space-y-6">
      {/* Encabezado 3D Mirror Liquid Glass */}
      <div className="glass-mirror-card rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="glass-mirror-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-[#661521] border border-[#D19650]/40 mb-2">
            RN-TRA-01 a RN-TRA-11 · Trazabilidad Multisede
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight font-display">
            Traslados entre Sedes
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#50322A] mt-1">
            Control logístico de mercancía en tránsito, recepciones y resolución de novedades.
          </p>
        </div>
      </div>

      {/* Tabs de estado en Cristal Espejo */}
      <div
        role="tablist"
        aria-label="Filtrar traslados por estado"
        className="glass-mirror-card p-2.5 rounded-3xl flex items-center gap-2 overflow-x-auto"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#661521] text-white border border-[#D19650] shadow-md'
                  : 'glass-mirror-pill text-[#50322A] hover:text-[#171717] border border-transparent hover:border-[#D19650]/40'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-extrabold ${
                  isActive
                    ? 'bg-[#D19650] text-[#171717]'
                    : 'bg-[#E7DED2] text-[#351912]'
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
          className="glass-mirror-card rounded-3xl overflow-hidden"
        >
          {[...Array(5)].map((_, i) => (
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
          <span>No se pudieron cargar los traslados.</span>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#661521] text-white border border-[#D19650]/50 rounded-xl font-bold flex items-center gap-2 hover:bg-[#4A0E17] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty */}
      {!isLoading && !isError && trasladosFiltrados.length === 0 && (
        <div className="glass-mirror-card text-center py-16 px-6 rounded-3xl">
          <Truck className="w-12 h-12 text-[#50322A] mx-auto mb-3" />
          <h3 className="text-xl font-black text-[#171717] font-display">
            No hay traslados en esta categoría
          </h3>
          <p className="text-sm font-medium text-[#50322A] max-w-sm mx-auto mt-1">
            {activeTab === 'Todos'
              ? 'Aún no se han creado traslados entre sedes.'
              : `No hay traslados con estado "${activeTab}".`}
          </p>
        </div>
      )}

      {/* ESTADO 4: Success */}
      {!isLoading && !isError && trasladosFiltrados.length > 0 && (
        <div className="glass-mirror-card overflow-x-auto rounded-3xl">
          <table className="w-full text-sm">
            <thead className="bg-[#E7DED2]/85 border-b border-[#50322A]/20">
              <tr className="text-left">
                <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
                  Código
                </th>
                <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
                  Ruta Logística
                </th>
                <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
                  Estado
                </th>
                <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs">
                  Solicitud
                </th>
                <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs">
                  Envío
                </th>
                <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs text-center">
                  Líneas
                </th>
                <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#50322A]/10">
              {trasladosFiltrados.map((t) => {
                const config = ESTADO_CONFIG[t.estado];
                const puedeDespachar = t.estado === 'APROBADO';
                const puedeRecibir = t.estado === 'ENVIADO';
                const puedeResolver = t.estado === 'RECIBIDO_CON_NOVEDAD';

                return (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-white/75"
                  >
                    <td className="px-5 py-4 font-mono tabular-nums font-bold text-[#661521]">
                      {t.codigo}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#171717]">
                        <span className="glass-mirror-pill px-2.5 py-1 rounded-xl font-bold text-xs text-[#351912]">
                          {t.origenNombre}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#D19650] shrink-0" />
                        <span className="glass-mirror-pill px-2.5 py-1 rounded-xl font-bold text-xs text-[#171717]">
                          {t.destinoNombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${config.bg} ${config.text}`}
                      >
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono tabular-nums text-xs font-semibold text-[#50322A]">
                      {formatFecha(t.fechaSolicitud)}
                    </td>
                    <td className="px-5 py-4 font-mono tabular-nums text-xs font-semibold text-[#50322A]">
                      {formatFecha(t.fechaEnvio)}
                    </td>
                    <td className="px-5 py-4 text-center font-mono tabular-nums font-bold text-[#171717]">
                      {t.lineas.length}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {puedeDespachar && (
                          <button
                            onClick={() => setTrasladoDespacho(t)}
                            aria-label={`Despachar traslado ${t.codigo}`}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#661521] text-white border border-[#D19650] hover:bg-[#4A0E17] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5 text-[#D19650]" />
                            Despachar
                          </button>
                        )}
                        {puedeRecibir && (
                          <button
                            onClick={() => setTrasladoRecepcion(t)}
                            aria-label={`Recibir traslado ${t.codigo}`}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#351912] text-white border border-[#D19650] hover:bg-[#171717] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-[#D19650]" />
                            Recibir
                          </button>
                        )}
                        {puedeResolver && (
                          <button
                            onClick={() => setTrasladoResolucion(t)}
                            aria-label={`Resolver novedad de ${t.codigo}`}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#D19650] text-[#171717] border border-[#661521]/40 hover:bg-[#BF833E] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-[#661521]" />
                            Resolver
                          </button>
                        )}
                        {!puedeDespachar && !puedeRecibir && !puedeResolver && (
                          <span className="text-xs font-semibold text-[#50322A] italic">
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
        <div className="mt-2 text-xs font-semibold text-[#50322A] flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#661521]" />
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
