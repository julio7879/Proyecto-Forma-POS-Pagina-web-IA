// frontend/src/features/admin/pages/AdminDespachosWebPage.tsx
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Package,
  RefreshCw,
  AlertCircle,
  Printer,
  PackageX,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  fetchPedidosWeb,
  fetchPedidoWebPorId,
  iniciarPreparacionPedido,
  PedidoWebDTO,
  EstadoPedidoWeb,
} from '../services/adminService';
import { DespachoWebModal } from '../components/DespachoWebModal';
import { NoPuedoDespacharModal } from '../components/NoPuedoDespacharModal';
import { RotuloDespachoPrint } from '../components/RotuloDespachoPrint';

type TabEstado = 'Pendientes' | 'EnPreparacion' | 'Enviados' | 'Todos';

const TABS: TabEstado[] = ['Pendientes', 'EnPreparacion', 'Enviados', 'Todos'];

// Mapeo de estado del pedido → tab al que pertenece
const ESTADOS_POR_TAB: Record<TabEstado, EstadoPedidoWeb[]> = {
  Pendientes: ['RECIBIDO', 'CONFIRMADO'],
  EnPreparacion: ['EN_PREPARACION'],
  Enviados: ['ENVIADO'],
  Todos: [
    'RECIBIDO',
    'CONFIRMADO',
    'EN_PREPARACION',
    'ENVIADO',
    'ENTREGADO',
    'NO_ENTREGADO',
    'CANCELADO',
  ],
};

// Configuración visual por estado
const ESTADO_CONFIG: Record<
  EstadoPedidoWeb,
  { bg: string; text: string; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  RECIBIDO: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    label: 'Recibido',
    icon: Clock,
  },
  CONFIRMADO: {
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Confirmado',
    icon: CheckCircle2,
  },
  EN_PREPARACION: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'En Preparación',
    icon: Package,
  },
  ENVIADO: {
    bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    label: 'Enviado',
    icon: Truck,
  },
  ENTREGADO: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Entregado',
    icon: CheckCircle2,
  },
  NO_ENTREGADO: {
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    label: 'No Entregado',
    icon: AlertCircle,
  },
  CANCELADO: {
    bg: 'bg-slate-200 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    label: 'Cancelado',
    icon: AlertCircle,
  },
};

export const AdminDespachosWebPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabEstado>('Pendientes');

  // Modales
  const [pedidoDespacho, setPedidoDespacho] = useState<PedidoWebDTO | null>(null);
  const [pedidoNovedad, setPedidoNovedad] = useState<PedidoWebDTO | null>(null);
  const [pedidoRotulo, setPedidoRotulo] = useState<PedidoWebDTO | null>(null);
  const [rotuloMeta, setRotuloMeta] = useState<{ transportadora?: string; numeroGuia?: string }>({});

  // Query de pedidos web
  const {
    data: pedidos = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-despachos-web', activeTab],
    queryFn: async (): Promise<PedidoWebDTO[]> => {
      if (activeTab === 'Todos') {
        return fetchPedidosWeb();
      }
      // Hacemos una consulta por cada estado del tab y unimos resultados
      const estados = ESTADOS_POR_TAB[activeTab];
      const resultados = await Promise.all(
        estados.map((estado) => fetchPedidosWeb({ estadoPedido: estado }))
      );
      const aplanados = resultados.flat();
      // Deduplicar por id
      const map = new Map<number, PedidoWebDTO>();
      aplanados.forEach((p) => map.set(p.id, p));
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
    },
    staleTime: 30_000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-despachos-web'] });
  };

  // Contadores por tab (solo disponibles para 'Todos' y el tab activo)
  const counts = useMemo(() => {
    const result: Record<TabEstado, number> = {
      Pendientes: 0,
      EnPreparacion: 0,
      Enviados: 0,
      Todos: pedidos.length,
    };
    pedidos.forEach((p) => {
      if (p.estadoPedido === 'RECIBIDO' || p.estadoPedido === 'CONFIRMADO') {
        result.Pendientes++;
      } else if (p.estadoPedido === 'EN_PREPARACION') {
        result.EnPreparacion++;
      } else if (p.estadoPedido === 'ENVIADO') {
        result.Enviados++;
      }
    });
    return result;
  }, [pedidos]);

  const formatFecha = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCOP = (valor: number) =>
    `$${(valor || 0).toLocaleString('es-CO')}`;

  // Iniciar preparación (endpoint pendiente en backend)
  const handleIniciarPreparacion = useCallback(
    async (pedido: PedidoWebDTO) => {
      try {
        const idempotencyKey = crypto.randomUUID();
        await iniciarPreparacionPedido(pedido.id, idempotencyKey);
        handleRefresh();
      } catch (error: any) {
        // Manejo del endpoint pendiente
        if (error.status === 404 || error.status === 405) {
          alert(
            'El endpoint de "Iniciar Preparación" aún no está habilitado en el backend. El equipo debe implementar POST /api/pedidos-web/:id/preparar.'
          );
        } else {
          alert(error.message || 'Error al iniciar la preparación del pedido.');
        }
      }
    },
    []
  );

  // Abrir rótulo
  const handleAbrirRotulo = useCallback(async (pedido: PedidoWebDTO) => {
    try {
      const detalle = await fetchPedidoWebPorId(pedido.id);
      setPedidoRotulo(detalle);
      setRotuloMeta({});
    } catch {
      // Fallback: usar el pedido del listado
      setPedidoRotulo(pedido);
      setRotuloMeta({});
    }
  }, []);

  // Vista de rótulo (pantalla completa reemplaza la lista)
  if (pedidoRotulo) {
    return (
      <RotuloDespachoPrint
        pedido={pedidoRotulo}
        transportadora={rotuloMeta.transportadora}
        numeroGuia={rotuloMeta.numeroGuia}
        onClose={() => setPedidoRotulo(null)}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Despachos Web
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Prepara, despacha y resuelve novedades de pedidos web asignados a tu sede.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Filtrar pedidos web por estado"
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
              {tab === 'Pendientes' && 'Pendientes'}
              {tab === 'EnPreparacion' && 'En Preparación'}
              {tab === 'Enviados' && 'Enviados'}
              {tab === 'Todos' && 'Todos'}
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
          data-testid="despachos-skeleton"
          aria-label="Cargando pedidos web"
          aria-busy="true"
          className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden"
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 border-b border-slate-100 dark:border-slate-800/60 animate-pulse bg-slate-200/40 dark:bg-slate-800/40"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center justify-between text-xs text-red-800 dark:text-red-200">
          <span>No se pudieron cargar los pedidos web.</span>
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
      {!isLoading && !isError && pedidos.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No hay pedidos en esta categoría
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === 'Todos'
              ? 'Aún no hay pedidos web registrados en el sistema.'
              : `No hay pedidos con estado "${activeTab}".`}
          </p>
        </div>
      )}

      {/* ESTADO 4: Success */}
      {!isLoading && !isError && pedidos.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800/60">
              <tr className="text-left">
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Referencia
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Destinatario
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Destino
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Estado
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Total
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
              {pedidos.map((pedido) => {
                const config = ESTADO_CONFIG[pedido.estadoPedido];
                const Icon = config.icon;

                const puedeIniciarPreparacion =
                  pedido.estadoPedido === 'RECIBIDO' || pedido.estadoPedido === 'CONFIRMADO';
                const puedeDespachar = pedido.estadoPedido === 'EN_PREPARACION';
                const puedeReportarNovedad =
                  pedido.estadoPedido === 'RECIBIDO' ||
                  pedido.estadoPedido === 'CONFIRMADO' ||
                  pedido.estadoPedido === 'EN_PREPARACION';

                return (
                  <tr
                    key={pedido.id}
                    className={`transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 ${
                      pedido.tieneIncidenciaStock
                        ? 'bg-amber-50/40 dark:bg-amber-950/10'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {pedido.referenciaLegible}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatFecha(pedido.fechaCreacion)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {pedido.destinatarioNombre}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {pedido.destinatarioTelefono}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 dark:text-slate-300">
                        {pedido.municipioDestinoNombre ?? pedido.municipioDestinoId}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        DANE: {pedido.municipioDestinoId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                      {pedido.tieneIncidenciaStock && (
                        <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          ⚠️ Incidencia de stock
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatCOP(pedido.totalAPagarCop)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700 dark:text-slate-300">
                      {pedido.lineas.length}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {puedeIniciarPreparacion && (
                          <button
                            type="button"
                            onClick={() => handleIniciarPreparacion(pedido)}
                            aria-label={`Iniciar preparación de ${pedido.referenciaLegible}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Package className="w-3.5 h-3.5" />
                            Preparar
                          </button>
                        )}
                        {puedeDespachar && (
                          <button
                            type="button"
                            onClick={() => setPedidoDespacho(pedido)}
                            aria-label={`Despachar ${pedido.referenciaLegible}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Despachar
                          </button>
                        )}
                        {pedido.estadoPedido === 'ENVIADO' && (
                          <button
                            type="button"
                            onClick={() => handleAbrirRotulo(pedido)}
                            aria-label={`Imprimir rótulo de ${pedido.referenciaLegible}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Rótulo
                          </button>
                        )}
                        {puedeReportarNovedad && (
                          <button
                            type="button"
                            onClick={() => setPedidoNovedad(pedido)}
                            aria-label={`Reportar novedad de ${pedido.referenciaLegible}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <PackageX className="w-3.5 h-3.5" />
                            Novedad
                          </button>
                        )}
                        {!puedeIniciarPreparacion &&
                          !puedeDespachar &&
                          pedido.estadoPedido !== 'ENVIADO' &&
                          !puedeReportarNovedad && (
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
      <DespachoWebModal
        pedido={pedidoDespacho}
        isOpen={pedidoDespacho !== null}
        onClose={() => setPedidoDespacho(null)}
        onSuccess={() => {
          handleRefresh();
          setPedidoDespacho(null);
        }}
      />

      <NoPuedoDespacharModal
        pedido={pedidoNovedad}
        isOpen={pedidoNovedad !== null}
        onClose={() => {
          setPedidoNovedad(null);
          handleRefresh();
        }}
        onSuccess={() => {
          handleRefresh();
        }}
      />
    </div>
  );
};

export default AdminDespachosWebPage;