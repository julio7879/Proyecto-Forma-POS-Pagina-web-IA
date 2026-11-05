// frontend/src/features/admin/pages/AdminComprasPage.tsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { fetchOrdenesCompra, OrdenCompraDTO, EstadoCompra } from '../services/adminService';
import { CompraModal } from '../components/CompraModal';
import { RecepcionCompraModal } from '../components/RecepcionCompraModal';

// Badge de estado con colores de la paleta FORMA
const EstadoBadge = ({ estado }: { estado: EstadoCompra }) => {
  const config = {
    PEDIDA: {
      bg: 'bg-[#D19650]/20 border border-[#D19650]/50',
      text: 'text-[#351912]',
      icon: Clock,
      label: 'Pendiente',
    },
    RECIBIDA: {
      bg: 'bg-[#661521] border border-[#D19650]/50',
      text: 'text-white',
      icon: CheckCircle2,
      label: 'Recibida',
    },
    CANCELADA: {
      bg: 'bg-[#50322A]/15 border border-[#50322A]/30',
      text: 'text-[#50322A]',
      icon: XCircle,
      label: 'Cancelada',
    },
  }[estado];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${config.bg} ${config.text}`}
    >
      <Icon className="w-3.5 h-3.5" />
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
    <div className="w-full space-y-6">
      {/* Encabezado 3D Mirror Liquid Glass */}
      <div className="glass-mirror-card rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="glass-mirror-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-[#661521] border border-[#D19650]/40 mb-2">
            RN-COM-01 · Abastecimiento Bodega Central
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight font-display">
            Compras a Proveedores
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#50322A] mt-1">
            Órdenes de compra que ingresan exclusivamente a Bodega Central (RN-COM-01).
          </p>
        </div>
        <button
          onClick={() => setIsCompraModalOpen(true)}
          className="px-5 py-3 rounded-2xl text-sm font-bold bg-[#661521] text-white border border-[#D19650] hover:bg-[#4A0E17] active:scale-95 transition-all shadow-lg flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D19650]" />
          Crear Compra
        </button>
      </div>

      {/* ESTADO 1: Loading */}
      {isLoading && (
        <div
          data-testid="compras-skeleton"
          aria-label="Cargando órdenes de compra"
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
          <span>No se pudieron cargar las órdenes de compra.</span>
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
      {!isLoading && !isError && ordenes.length === 0 && (
        <div className="glass-mirror-card text-center py-16 px-6 rounded-3xl">
          <Package className="w-12 h-12 text-[#50322A] mx-auto mb-3" />
          <h3 className="text-xl font-black text-[#171717] font-display">
            No hay órdenes de compra
          </h3>
          <p className="text-sm font-medium text-[#50322A] max-w-sm mx-auto mt-1 mb-5">
            Crea la primera orden para abastecer Bodega Central.
          </p>
          <button
            onClick={() => setIsCompraModalOpen(true)}
            className="px-5 py-2.5 bg-[#661521] text-white border border-[#D19650] rounded-2xl text-sm font-bold hover:bg-[#4A0E17] transition-all shadow-md flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4 text-[#D19650]" />
            Crear Primera Compra
          </button>
        </div>
      )}

      {/* ESTADO 4: Success (Listado) */}
      {!isLoading && !isError && ordenes.length > 0 && (
        <div className="glass-mirror-card overflow-x-auto rounded-3xl">
          <table className="w-full text-sm">
            <thead className="bg-[#E7DED2]/85 border-b border-[#50322A]/20">
              <tr className="text-left">
                <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
                  Código
                </th>
                <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
                  Proveedor
                </th>
                <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
                  Estado
                </th>
                <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs">
                  Fecha
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
              {ordenes.map((orden) => (
                <tr
                  key={orden.id}
                  className="transition-colors hover:bg-white/75"
                >
                  <td className="px-5 py-4 font-mono tabular-nums font-bold text-[#661521]">
                    {orden.codigo}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#171717] text-sm">
                      {orden.proveedorNombre}
                    </div>
                    {orden.proveedorContacto && (
                      <div className="text-xs font-medium text-[#50322A]">
                        {orden.proveedorContacto}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <EstadoBadge estado={orden.estado} />
                  </td>
                  <td className="px-5 py-4 font-mono tabular-nums text-xs font-semibold text-[#50322A]">
                    {new Date(orden.fechaCreacion).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4 text-center font-mono tabular-nums font-bold text-[#171717]">
                    {orden.lineas.length}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {orden.estado === 'PEDIDA' && (
                      <button
                        onClick={() => setOrdenSeleccionada(orden)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#661521] text-white border border-[#D19650]/60 hover:bg-[#4A0E17] active:scale-95 transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D19650]" />
                        Recibir
                      </button>
                    )}
                    {orden.estado !== 'PEDIDA' && (
                      <span className="text-xs font-semibold text-[#50322A] italic">
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
        <div className="mt-2 text-xs font-semibold text-[#50322A] flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#661521]" />
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
