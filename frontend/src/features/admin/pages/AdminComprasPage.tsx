// frontend/src/features/admin/pages/AdminComprasPage.tsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { fetchOrdenesCompra, OrdenCompraDTO, EstadoCompra } from '../services/adminService';
import { CompraModal } from '../components/CompraModal';
import { RecepcionCompraModal } from '../components/RecepcionCompraModal';

// Badge de estado con colores semánticos
const EstadoBadge = ({ estado }: { estado: EstadoCompra }) => {
  const config = {
    PEDIDA: {
      bg: 'bg-amber-100 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      icon: Clock,
      label: 'Pendiente',
    },
    RECIBIDA: {
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: CheckCircle2,
      label: 'Recibida',
    },
    CANCELADA: {
      bg: 'bg-slate-200 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-400',
      icon: XCircle,
      label: 'Cancelada',
    },
  }[estado];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export const AdminComprasPage = () => {
  const queryClient = useQueryClient();

  // Estado para los modales
  const [isCompraModalOpen, setIsCompraModalOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompraDTO | null>(null);

  // Query de órdenes
  const {
    data: ordenes = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-compras'],
    queryFn: fetchOrdenesCompra,
    staleTime: 30_000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-compras'] });
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Compras a Proveedores
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Órdenes de compra que ingresan exclusivamente a Bodega Central (RN-COM-01).
          </p>
        </div>
        <button
          onClick={() => setIsCompraModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Compra
        </button>
      </div>

      {/* ESTADO 1: Loading */}
      {isLoading && (
        <div
          data-testid="compras-skeleton"
          aria-label="Cargando órdenes de compra"
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
          <span>No se pudieron cargar las órdenes de compra.</span>
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
      {!isLoading && !isError && ordenes.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No hay órdenes de compra
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Crea la primera orden para abastecer Bodega Central.
          </p>
          <button
            onClick={() => setIsCompraModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Crear Primera Compra
          </button>
        </div>
      )}

      {/* ESTADO 4: Success (Listado) */}
      {!isLoading && !isError && ordenes.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800/60">
              <tr className="text-left">
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Código
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Proveedor
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Estado
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Fecha
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
              {ordenes.map((orden) => (
                <tr
                  key={orden.id}
                  className="transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {orden.codigo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {orden.proveedorNombre}
                    </div>
                    {orden.proveedorContacto && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {orden.proveedorContacto}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={orden.estado} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {new Date(orden.fechaCreacion).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-700 dark:text-slate-300">
                    {orden.lineas.length}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {orden.estado === 'PEDIDA' && (
                      <button
                        onClick={() => setOrdenSeleccionada(orden)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-1.5 ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Recibir
                      </button>
                    )}
                    {orden.estado !== 'PEDIDA' && (
                      <span className="text-[10px] text-slate-400 italic">
                        {orden.estado === 'RECIBIDA' ? 'Completada' : 'Cancelada'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
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
      <CompraModal
        isOpen={isCompraModalOpen}
        onClose={() => setIsCompraModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <RecepcionCompraModal
        orden={ordenSeleccionada}
        isOpen={ordenSeleccionada !== null}
        onClose={() => setOrdenSeleccionada(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default AdminComprasPage;