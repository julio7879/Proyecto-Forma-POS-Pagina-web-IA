// frontend/src/features/storefront/components/orders/OrdersView.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PackageCheck,
  PackageX,
  Truck,
  Clock,
  X,
  RefreshCw,
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  ShoppingBag,
} from 'lucide-react';
import {
  fetchMisPedidos,
  PedidoWebDTO,
  EstadoPedidoWeb,
  LineaPedidoWebDTO,
} from '../../services/pedidosWebService';

// ============================================
// Utilidades
// ============================================
const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ============================================
// Configuración visual de estados
// ============================================
interface EstadoConfig {
  bg: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const ESTADO_CONFIG: Record<EstadoPedidoWeb, EstadoConfig> = {
  RECIBIDO: {
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-800 dark:text-blue-300',
    icon: Clock,
    label: 'Recibido',
  },
  CONFIRMADO: {
    bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    text: 'text-indigo-800 dark:text-indigo-300',
    icon: PackageCheck,
    label: 'Confirmado',
  },
  EN_PREPARACION: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    icon: Package,
    label: 'En preparación',
  },
  ENVIADO: {
    bg: 'bg-cyan-100 dark:bg-cyan-950/40',
    text: 'text-cyan-800 dark:text-cyan-300',
    icon: Truck,
    label: 'Enviado',
  },
  ENTREGADO: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: PackageCheck,
    label: 'Entregado',
  },
  NO_ENTREGADO: {
    bg: 'bg-red-100 dark:bg-red-950/40',
    text: 'text-red-800 dark:text-red-300',
    icon: PackageX,
    label: 'No entregado',
  },
  CANCELADO: {
    bg: 'bg-slate-200 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    icon: X,
    label: 'Cancelado',
  },
};

// ============================================
// Badge de Estado
// ============================================
const EstadoBadge = ({ estado }: { estado: EstadoPedidoWeb }) => {
  const config = ESTADO_CONFIG[estado];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// ============================================
// Modal de Detalle
// ============================================
interface DetailsModalProps {
  pedido: PedidoWebDTO;
  onClose: () => void;
}

const OrderDetailsModal = ({ pedido, onClose }: DetailsModalProps) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2
              id="order-detail-title"
              className="text-xl font-black text-slate-900 dark:text-white font-display"
            >
              Pedido {pedido.comprobante}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {formatFecha(pedido.fechaCreacion)} · {pedido.municipioNombre}, {pedido.departamentoNombre}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado + Info */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <EstadoBadge estado={pedido.estado} />
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            {pedido.medioPago === 'TRANSFERENCIA' ? (
              <CreditCard className="w-4 h-4" />
            ) : (
              <Banknote className="w-4 h-4" />
            )}
            <span>
              {pedido.medioPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Contraentrega'}
            </span>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Dirección */}
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Dirección de entrega</div>
              <div className="text-slate-600 dark:text-slate-400">{pedido.direccionEntrega}</div>
            </div>
          </div>

          {/* Sede despachadora */}
          {pedido.ubicacionAsignadaNombre && (
            <div className="flex items-start gap-2 text-xs">
              <ShoppingBag className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Despachado desde</div>
                <div className="text-slate-600 dark:text-slate-400">
                  {pedido.ubicacionAsignadaNombre}
                </div>
              </div>
            </div>
          )}

          {/* Líneas */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr className="text-left">
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">
                    Producto
                  </th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                    Cant.
                  </th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-right">
                    Precio
                  </th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-right">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pedido.lineas.map((linea) => (
                  <OrderLineRow key={linea.id} linea={linea} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="space-y-1 text-xs border-t-2 border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCOP(pedido.subtotalCop)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Envío:</span>
              <span className="font-mono">{formatCOP(pedido.tarifaFleteCop)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total:</span>
              <span className="font-mono">{formatCOP(pedido.totalCop)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Fila de línea (evita el warning de key en map)
// ============================================
const OrderLineRow = ({ linea }: { linea: LineaPedidoWebDTO }) => (
  <tr>
    <td className="px-3 py-2">
      <div className="font-semibold text-slate-900 dark:text-white">{linea.nombreProducto}</div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400">
        {linea.talla} / {linea.color} · SKU: {linea.sku}
      </div>
    </td>
    <td className="px-3 py-2 text-center font-mono text-slate-700 dark:text-slate-300">
      {linea.cantidad}
    </td>
    <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
      {formatCOP(linea.precioUnitarioCop)}
    </td>
    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
      {formatCOP(linea.subtotalCop)}
    </td>
  </tr>
);

// ============================================
// Vista Principal
// ============================================
export const OrdersView = () => {
  const [pedidos, setPedidos] = useState<PedidoWebDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoWebDTO | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMisPedidos();
      setPedidos(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display">
              Mis Pedidos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Historial de compras y seguimiento de envíos
            </p>
          </div>
          <Link
            to="/"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver al catálogo
          </Link>
        </div>

        {/* ESTADO 1: Loading */}
        {loading && (
          <div data-testid="orders-skeleton" className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ESTADO 2: Error */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center justify-between text-xs text-red-800 dark:text-red-300">
            <span>{error}</span>
            <button
              onClick={cargar}
              className="px-3 py-1.5 bg-red-200 dark:bg-red-800 rounded-lg font-bold flex items-center gap-1.5 hover:bg-red-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {/* ESTADO 3: Empty */}
        {!loading && !error && pedidos.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
            <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Aún no tienes pedidos
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Explora el catálogo y realiza tu primera compra.
            </p>
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
            >
              Explorar catálogo
            </Link>
          </div>
        )}

        {/* ESTADO 4: Success */}
        {!loading && !error && pedidos.length > 0 && (
          <div className="space-y-3">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {pedido.comprobante}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatFecha(pedido.fechaCreacion)} · {pedido.municipioNombre}
                    </div>
                  </div>
                  <EstadoBadge estado={pedido.estado} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      Total
                    </div>
                    <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                      {formatCOP(pedido.totalCop)}
                    </div>
                  </div>
                  <button
                    onClick={() => setPedidoSeleccionado(pedido)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {pedidoSeleccionado && (
        <OrderDetailsModal
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default OrdersView;