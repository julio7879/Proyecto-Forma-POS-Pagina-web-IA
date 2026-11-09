// frontend/src/features/admin/pages/AdminComprasPage.tsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Package,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Building2,
  X,
  TrendingDown,
  ArrowDownToLine,
} from 'lucide-react';
import {
  fetchOrdenesCompra,
  OrdenCompraDTO,
  EstadoCompra,
  DISTRIBUIDORES_OFICIALES,
} from '../services/adminService';
import { PageHeader } from '../components/PageHeader';
import { CompraModal } from '../components/CompraModal';
import { RecepcionCompraModal } from '../components/RecepcionCompraModal';

// Badge de estado con colores de la paleta FORMA
const EstadoBadge = ({ estado }: { estado: EstadoCompra }) => {
  const config = {
    PEDIDA: {
      bg: 'bg-[#D19650]/20 border border-[#D19650]/50',
      text: 'text-[#E5BE90]',
      icon: Clock,
      label: 'Pendiente',
    },
    RECIBIDA: {
      bg: 'bg-[#10B981]/20 border border-[#10B981]/50',
      text: 'text-[#34D399]',
      icon: CheckCircle2,
      label: 'Recibida en Central',
    },
    CANCELADA: {
      bg: 'bg-white/10 border border-white/20',
      text: 'text-white/60',
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
  const [ordenSeleccionadaParaRecibir, setOrdenSeleccionadaParaRecibir] = useState<OrdenCompraDTO | null>(null);
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenCompraDTO | null>(null);

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

  // KPIs de la pantalla
  const totalPrendasRecibidas = ordenes
    .filter((o) => o.estado === 'RECIBIDA')
    .reduce((acc, o) => acc + (o.lineas || []).reduce((sum, l) => sum + (l.cantidadRecibida || l.cantidadPedida || 0), 0), 0);

  const totalPrendasPendientes = ordenes
    .filter((o) => o.estado === 'PEDIDA')
    .reduce((acc, o) => acc + (o.lineas || []).reduce((sum, l) => sum + (l.cantidadPedida || 0), 0), 0);

  const totalInversionMayorista = ordenes.reduce(
    (acc, o) =>
      acc +
      (o.lineas || []).reduce(
        (sum, l) => sum + (l.cantidadPedida || 0) * (l.costoUnitarioCop || 0),
        0
      ),
    0
  );

  return (
    <div className="w-full space-y-6 text-white pb-10">
      {/* Encabezado Ejecutivo */}
      <PageHeader
        title="Abastecimiento y Entrada de Stock"
        subtitle="Registro y recepción de órdenes mayoristas a los 5 distribuidores asociados para alimentar el inventario físico en Bodega Central."
        badge="Abastecimiento Bodega Central"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompraModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#741C2B] to-[#912537] hover:from-[#912537] hover:to-[#A32E43] text-white border border-white/20 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E5BE90]" />
              <span>Nueva Orden de Abastecimiento</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white hover:bg-white/20 transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E5BE90] ${isFetching ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        }
      />

      {/* STRIP DE KPIS DE ABASTECIMIENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Físico Recibido en Bodega Central */}
        <div className="admin-glass-panel rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              Prendas en Bodega Central
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {totalPrendasRecibidas.toLocaleString()} unds
            </span>
            <span className="text-[10px] text-emerald-300/80 font-semibold block mt-0.5">
              Ingresadas a Kardex real
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Prendas Pendientes de Recepción */}
        <div className="admin-glass-panel rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              Prendas en Tránsito
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#C49A68] mt-1 block">
              {totalPrendasPendientes.toLocaleString()} unds
            </span>
            <span className="text-[10px] text-[#C49A68]/80 font-semibold block mt-0.5">
              Por recibir en muelle Central
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#C49A68]/15 border border-[#C49A68]/30 text-[#C49A68]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Inversión Mayorista */}
        <div className="admin-glass-panel rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              Inversión Mayorista Total
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-white mt-1 block">
              ${totalInversionMayorista.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-white/50 font-semibold block mt-0.5">
              Ahorro por compra por mayor
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#C49A68]">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Distribuidores Asociados */}
        <div className="admin-glass-panel rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              Distribuidores Asociados
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-white mt-1 block">
              5 Oficiales
            </span>
            <span className="text-[10px] text-white/50 font-semibold block mt-0.5">
              Convenio por volumen activo
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#C49A68]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* STRIP DE LOS 5 DISTRIBUIDORES ASOCIADOS */}
      <div className="admin-glass-panel rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#C49A68] flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Distribuidores Oficiales del Catálogo FORMA
          </span>
          <span className="text-[11px] text-white/50">
            Materiales nobles y confección garantizada
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DISTRIBUIDORES_OFICIALES.map((d) => (
            <div
              key={d.id}
              className="admin-glass-pill p-3 rounded-2xl space-y-1 hover:border-[#C49A68]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate">{d.nombre.split(' ')[0]} {d.nombre.split(' ')[1]}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  -{d.descuentoMayoristaPorc}%
                </span>
              </div>
              <p className="text-[10px] text-[#C49A68] line-clamp-2 leading-tight">
                {d.especialidad}
              </p>
              <span className="text-[9px] text-white/40 block pt-1 font-mono truncate">
                {d.ciudad}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ESTADO 1: Loading */}
      {isLoading && (
        <div
          data-testid="compras-skeleton"
          aria-label="Cargando órdenes de compra"
          aria-busy="true"
          className="backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] rounded-3xl overflow-hidden p-6 space-y-3"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 border-b border-white/10 animate-pulse bg-white/5 rounded-xl"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="bg-[#EF4444]/20 border border-[#EF4444]/40 p-5 rounded-2xl flex items-center justify-between text-xs font-semibold text-[#F87171] shadow-md">
          <span>Error al sincronizar las órdenes con el servidor central. Se está mostrando la información local en caché.</span>
          <button
            onClick={() => refetch()}
            className="px-3.5 py-1.5 bg-[#EF4444] text-white rounded-xl font-bold flex items-center gap-1.5 hover:bg-[#DC2626] transition-all cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty */}
      {!isLoading && !isError && ordenes.length === 0 && (
        <div className="backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] text-center py-16 px-6 rounded-3xl shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 text-[#E5BE90] flex items-center justify-center mx-auto shadow-sm">
            <Package className="w-7 h-7 text-[#E5BE90]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              No hay órdenes de abastecimiento registradas
            </h3>
            <p className="text-xs text-white/70 max-w-sm mx-auto mt-1">
              Crea una orden para registrar la entrada de mercancía e incrementar el stock en Bodega Central.
            </p>
          </div>
          <button
            onClick={() => setIsCompraModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-[#741C2B] to-[#912537] hover:from-[#912537] hover:to-[#A32E43] text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#E5BE90]" />
            <span>Crear Primera Orden</span>
          </button>
        </div>
      )}

      {/* ESTADO 4: Listado de Órdenes */}
      {!isLoading && ordenes.length > 0 && (
        <div className="admin-glass-panel rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full min-w-[1020px] text-xs text-left">
              <thead className="bg-white/[0.04] border-b border-white/[0.08] text-white/60">
                <tr>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider text-[11px] w-[110px] shrink-0">
                    Código
                  </th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider text-[11px] min-w-[260px]">
                    Distribuidor / Proveedor
                  </th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider text-[11px] w-[130px] shrink-0">
                    Estado
                  </th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider text-[11px] w-[120px] shrink-0">
                    Fecha
                  </th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider text-[11px] text-center w-[120px] shrink-0">
                    Prendas (Unds)
                  </th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider text-[11px] text-right w-[170px] shrink-0">
                    Total Mayorista COP
                  </th>
                  <th className="px-6 py-4 font-extrabold uppercase tracking-wider text-[11px] text-right min-w-[230px] w-[230px] shrink-0">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {ordenes.map((orden) => {
                  const lineas = orden.lineas || [];
                  const cantTotal = lineas.reduce((acc, l) => acc + (l.cantidadPedida || 0), 0);
                  const costoTotal = lineas.reduce(
                    (acc, l) => acc + (l.cantidadPedida || 0) * (l.costoUnitarioCop || 0),
                    0
                  );

                  return (
                    <tr
                      key={orden.id}
                      className="transition-colors hover:bg-white/[0.04] h-14"
                    >
                      <td className="px-5 py-4 font-mono tabular-nums font-bold text-[#E5BE90]">
                        {orden.codigo}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-xs">
                          {orden.proveedorNombre}
                        </div>
                        {orden.proveedorContacto && (
                          <div className="text-[11px] font-medium text-white/50 truncate max-w-xs">
                            {orden.proveedorContacto}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <EstadoBadge estado={orden.estado} />
                      </td>
                      <td className="px-5 py-4 font-mono tabular-nums text-xs font-semibold text-white/70">
                        {new Date(orden.fechaCreacion).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-center font-mono tabular-nums font-bold text-white">
                        <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10">
                          {cantTotal.toLocaleString()} unds
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono tabular-nums font-bold text-emerald-400">
                        ${costoTotal.toLocaleString('es-CO')} COP
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap min-w-[230px]">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setOrdenDetalle(orden)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Ver detalle de prendas y materiales"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#E5BE90]" />
                            <span>Detalle</span>
                          </button>

                          {orden.estado === 'PEDIDA' && (
                            <button
                              onClick={() => setOrdenSeleccionadaParaRecibir(orden)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              <span>Recibir Stock</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE LA ORDEN DE ABASTECIMIENTO */}
      {ordenDetalle && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOrdenDetalle(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl backdrop-blur-2xl bg-[#1A060B]/95 border border-white/[0.18] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col text-white"
          >
            {/* Cabecera del Detalle */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-serif-editorial text-white">
                    Detalle de Orden {ordenDetalle.codigo}
                  </h3>
                  <EstadoBadge estado={ordenDetalle.estado} />
                </div>
                <p className="text-xs text-white/60 mt-1">
                  Distribuidor: <span className="font-semibold text-white">{ordenDetalle.proveedorNombre}</span>
                </p>
                {ordenDetalle.notas && (
                  <p className="text-[11px] text-[#E5BE90] mt-1 font-sans italic">
                    "{ordenDetalle.notas}"
                  </p>
                )}
              </div>
              <button
                onClick={() => setOrdenDetalle(null)}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listado de Líneas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white/70 block">
                Prendas, Materiales y Cantidades
              </span>

              <div className="space-y-2.5">
                {(ordenDetalle.lineas || []).map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{l.nombreProducto}</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {l.costoUnitarioCop ? `$${l.costoUnitarioCop.toLocaleString('es-CO')} COP / und` : 'Sin costo registrado'}
                      </span>
                    </div>

                    {l.descripcion && (
                      <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                        <span className="text-[#E5BE90] font-bold">Materiales: </span>
                        {l.descripcion}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-xs font-mono">
                      <span className="text-white/60">
                        SKU: <span className="text-[#E5BE90]">{l.sku}</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">
                          Pedido: {l.cantidadPedida} unds
                        </span>
                        {ordenDetalle.estado === 'RECIBIDA' && (
                          <span className="text-emerald-400 font-bold">
                            Recibido: {l.cantidadRecibida} unds
                          </span>
                        )}
                        <span className="text-[#E5BE90] font-bold">
                          Total: ${((l.cantidadPedida || 0) * (l.costoUnitarioCop || 0)).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie del modal */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
              <span className="text-white/60">
                Bodega de Recepción: <strong className="text-white">Bodega Central (Cúcuta)</strong>
              </span>
              <button
                type="button"
                onClick={() => setOrdenDetalle(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVA ORDEN */}
      <CompraModal
        isOpen={isCompraModalOpen}
        onClose={() => setIsCompraModalOpen(false)}
        onSuccess={() => {
          handleRefresh();
        }}
      />

      {/* MODAL CONFIRMAR RECEPCIÓN EN BODEGA CENTRAL */}
      <RecepcionCompraModal
        isOpen={Boolean(ordenSeleccionadaParaRecibir)}
        orden={ordenSeleccionadaParaRecibir}
        onClose={() => setOrdenSeleccionadaParaRecibir(null)}
        onSuccess={() => {
          handleRefresh();
        }}
      />
    </div>
  );
};

export default AdminComprasPage;
