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

// Badge de estado de compras con alto contraste WCAG AAA
const EstadoBadge = ({ estado }: { estado: EstadoCompra }) => {
  const config = {
    PEDIDA: {
      bg: 'bg-amber-50 border border-amber-300',
      text: 'text-amber-900',
      icon: Clock,
      label: 'Pendiente',
    },
    RECIBIDA: {
      bg: 'bg-emerald-50 border border-emerald-300',
      text: 'text-emerald-800',
      icon: CheckCircle2,
      label: 'Recibida en Central',
    },
    CANCELADA: {
      bg: 'bg-slate-100 border border-slate-300',
      text: 'text-slate-800',
      icon: XCircle,
      label: 'Cancelada',
    },
  }[estado];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${config.bg} ${config.text}`}
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
    <div className="w-full space-y-6 text-[#0F172A] pb-10">
      {/* Encabezado Ejecutivo */}
      <PageHeader
        title="Abastecimiento y Entrada de Stock"
        subtitle="Registro y recepción de órdenes mayoristas a los 5 distribuidores asociados para alimentar el inventario físico en Bodega Central."
        badge="Abastecimiento Bodega Central"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompraModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#741C2B] hover:bg-[#5A1420] text-white active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Nueva Orden de Abastecimiento</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#475569] ${isFetching ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        }
      />

      {/* STRIP DE KPIS DE ABASTECIMIENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Físico Recibido en Bodega Central */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#475569] block">
              Prendas en Bodega Central
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1 block">
              {totalPrendasRecibidas.toLocaleString()} unds
            </span>
            <span className="text-[11px] text-[#64748B] font-bold block mt-0.5">
              Ingresadas a Kardex real
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Prendas Pendientes de Recepción */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#475569] block">
              Prendas en Tránsito
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-amber-700 mt-1 block">
              {totalPrendasPendientes.toLocaleString()} unds
            </span>
            <span className="text-[11px] text-[#64748B] font-bold block mt-0.5">
              Por recibir en muelle Central
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Inversión Mayorista */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#475569] block">
              Inversión Mayorista Total
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-[#0F172A] mt-1 block">
              ${totalInversionMayorista.toLocaleString('es-CO')}
            </span>
            <span className="text-[11px] text-[#64748B] font-bold block mt-0.5">
              Ahorro por compra por mayor
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[#741C2B]">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Distribuidores Asociados */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#475569] block">
              Distribuidores Asociados
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#0F172A] mt-1 block">
              5 Oficiales
            </span>
            <span className="text-[11px] text-[#64748B] font-bold block mt-0.5">
              Convenio por volumen activo
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[#741C2B]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* STRIP DE LOS 5 DISTRIBUIDORES ASOCIADOS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[#741C2B] flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Distribuidores Oficiales del Catálogo FORMA
          </span>
          <span className="text-[11px] font-bold text-[#475569]">
            Materiales nobles y confección garantizada
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DISTRIBUIDORES_OFICIALES.map((d) => (
            <div
              key={d.id}
              className="bg-[#F8FAFC] border border-slate-200 p-3 rounded-2xl space-y-1 hover:border-[#741C2B]/40 hover:bg-white transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-[#0F172A] truncate">
                  {d.nombre.split(' ')[0]} {d.nombre.split(' ')[1]}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-black">
                  -{d.descuentoMayoristaPorc}%
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#475569] line-clamp-2 leading-tight">
                {d.especialidad}
              </p>
              <span className="text-[10px] text-[#64748B] block pt-1 font-mono font-bold truncate">
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
          className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden p-6 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 border-b border-slate-100 animate-pulse bg-slate-100 rounded-xl"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="bg-rose-50 border border-rose-300 p-5 rounded-2xl flex items-center justify-between text-xs font-bold text-rose-800 shadow-md">
          <span>Error al sincronizar las órdenes con el servidor central. Se está mostrando la información local en caché.</span>
          <button
            onClick={() => refetch()}
            className="px-3.5 py-1.5 bg-rose-700 text-white rounded-xl font-black flex items-center gap-1.5 hover:bg-rose-800 transition-all cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty */}
      {!isLoading && !isError && ordenes.length === 0 && (
        <div className="bg-white border border-slate-200/90 text-center py-16 px-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-[#741C2B] flex items-center justify-center mx-auto shadow-xs">
            <Package className="w-7 h-7 text-[#741C2B]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#0F172A]">
              No hay órdenes de abastecimiento registradas
            </h3>
            <p className="text-xs text-[#475569] font-medium max-w-sm mx-auto mt-1">
              Crea una orden para registrar la entrada de mercancía e incrementar el stock en Bodega Central.
            </p>
          </div>
          <button
            onClick={() => setIsCompraModalOpen(true)}
            className="px-5 py-2.5 bg-[#741C2B] hover:bg-[#5A1420] text-white rounded-xl text-xs font-black transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Crear Primera Orden</span>
          </button>
        </div>
      )}

      {/* ESTADO 4: Listado de Órdenes */}
      {!isLoading && ordenes.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full min-w-[1020px] text-xs text-left">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#475569]">
                <tr>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[11px] w-[110px] shrink-0">
                    Código
                  </th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[11px] min-w-[260px]">
                    Distribuidor / Proveedor
                  </th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[11px] w-[130px] shrink-0">
                    Estado
                  </th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[11px] w-[120px] shrink-0">
                    Fecha
                  </th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[11px] text-center w-[120px] shrink-0">
                    Prendas (Unds)
                  </th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[11px] text-right w-[170px] shrink-0">
                    Total Mayorista COP
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px] text-right min-w-[230px] w-[230px] shrink-0">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                      className="transition-colors hover:bg-slate-50/80 h-14"
                    >
                      <td className="px-5 py-4 font-mono tabular-nums font-black text-[#741C2B]">
                        {orden.codigo}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0F172A] text-xs">
                          {orden.proveedorNombre}
                        </div>
                        {orden.proveedorContacto && (
                          <div className="text-[11px] font-medium text-[#64748B] truncate max-w-xs">
                            {orden.proveedorContacto}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <EstadoBadge estado={orden.estado} />
                      </td>
                      <td className="px-5 py-4 font-mono tabular-nums text-xs font-bold text-[#475569]">
                        {new Date(orden.fechaCreacion).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-center font-mono tabular-nums font-black text-[#0F172A]">
                        <span className="px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-slate-200">
                          {cantTotal.toLocaleString()} unds
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono tabular-nums font-black text-emerald-800">
                        ${costoTotal.toLocaleString('es-CO')} COP
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap min-w-[230px]">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setOrdenDetalle(orden)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0F172A] hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                            title="Ver detalle de prendas y materiales"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#741C2B]" />
                            <span>Detalle</span>
                          </button>

                          {orden.estado === 'PEDIDA' && (
                            <button
                              onClick={() => setOrdenSeleccionadaParaRecibir(orden)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col text-[#0F172A]"
          >
            {/* Cabecera del Detalle */}
            <div className="p-6 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black font-serif-editorial text-[#0F172A]">
                    Detalle de Orden {ordenDetalle.codigo}
                  </h3>
                  <EstadoBadge estado={ordenDetalle.estado} />
                </div>
                <p className="text-xs text-[#475569] mt-1 font-medium">
                  Distribuidor: <span className="font-bold text-[#0F172A]">{ordenDetalle.proveedorNombre}</span>
                </p>
                {ordenDetalle.notas && (
                  <p className="text-[11px] text-[#741C2B] mt-1 font-sans italic font-semibold">
                    "{ordenDetalle.notas}"
                  </p>
                )}
              </div>
              <button
                onClick={() => setOrdenDetalle(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listado de Líneas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              <span className="text-xs font-black uppercase tracking-wider text-[#475569] block">
                Prendas, Materiales y Cantidades
              </span>

              <div className="space-y-2.5">
                {(ordenDetalle.lineas || []).map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#0F172A]">{l.nombreProducto}</span>
                      <span className="font-mono text-xs font-black text-emerald-800">
                        {l.costoUnitarioCop ? `$${l.costoUnitarioCop.toLocaleString('es-CO')} COP / und` : 'Sin costo registrado'}
                      </span>
                    </div>

                    {l.descripcion && (
                      <p className="text-[11px] text-[#475569] leading-relaxed font-sans font-medium">
                        <span className="text-[#741C2B] font-bold">Materiales: </span>
                        {l.descripcion}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs font-mono">
                      <span className="text-[#64748B] font-bold">
                        SKU: <span className="text-[#741C2B] font-black">{l.sku}</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#0F172A] font-black">
                          Pedido: {l.cantidadPedida} unds
                        </span>
                        {ordenDetalle.estado === 'RECIBIDA' && (
                          <span className="text-emerald-800 font-black">
                            Recibido: {l.cantidadRecibida} unds
                          </span>
                        )}
                        <span className="text-[#741C2B] font-black">
                          Total: ${((l.cantidadPedida || 0) * (l.costoUnitarioCop || 0)).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie del modal */}
            <div className="p-4 border-t border-slate-200 bg-[#F8FAFC] flex items-center justify-between text-xs">
              <span className="text-[#475569] font-medium">
                Bodega de Recepción: <strong className="text-[#0F172A] font-bold">Bodega Central (Cúcuta)</strong>
              </span>
              <button
                type="button"
                onClick={() => setOrdenDetalle(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-[#0F172A] font-bold hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
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
