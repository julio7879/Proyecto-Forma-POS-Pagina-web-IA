import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Package,
  Calendar,
  Building2,
  Truck,
  CheckCircle2,
  Clock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Search,
  PackageCheck,
} from 'lucide-react';
import {
  confirmarEntregaClienteWeb,
  getWebOrder,
  getWebOrdersByEmail,
  WEB_ORDERS_EVENT,
  EstadoCobroWeb,
} from '../../pos/utils/webOrdersStore';

export type EstadoPedidoWeb =
  | 'RECIBIDO'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO_DESPACHO'
  | 'DESPACHADO'
  | 'EN_ENTREGA'
  | 'ENTREGADO';

export interface PasoTimeline {
  id: EstadoPedidoWeb;
  etiqueta: string;
  descripcion: string;
  tipoReserva: string;
}

export const ESTADOS_TIMELINE: PasoTimeline[] = [
  {
    id: 'RECIBIDO',
    etiqueta: '1. Recibido',
    descripcion: 'Orden registrada con separación inicial de inventario por 24 horas.',
    tipoReserva: 'Reserva Blanda Activa',
  },
  {
    id: 'CONFIRMADO',
    etiqueta: '2. Confirmado',
    descripcion: 'Pago verificado y sede de despacho óptima asignada.',
    tipoReserva: 'Reserva Blanda Verificada',
  },
  {
    id: 'EN_PREPARACION',
    etiqueta: '3. En Preparación',
    descripcion: 'Picking y control de calidad artesanal. Prendas bloqueadas exclusivamente para tu envío.',
    tipoReserva: 'Reserva Dura Protegida',
  },
  {
    id: 'LISTO_DESPACHO',
    etiqueta: '4. Listo Despacho',
    descripcion: 'Empaque de lujo con Sello de Origen y rótulo de guía de transporte.',
    tipoReserva: 'Reserva Dura Empacada',
  },
  {
    id: 'DESPACHADO',
    etiqueta: '5. Despachado',
    descripcion: 'Entregado a la transportadora formal con número de guía asignado.',
    tipoReserva: 'En Tránsito Nacional',
  },
  {
    id: 'EN_ENTREGA',
    etiqueta: '6. En Entrega',
    descripcion: 'En ruta de reparto local hacia la dirección registrada en tu municipio.',
    tipoReserva: 'En Reparto Final',
  },
  {
    id: 'ENTREGADO',
    etiqueta: '7. Entregado',
    descripcion: 'Pedido recibido a satisfacción y liquidado en el sistema.',
    tipoReserva: 'Entrega Conforme y Pagada',
  },
];

interface PedidoItem {
  id: string;
  nombre: string;
  sku: string;
  talla?: string;
  color?: string;
  cantidad: number;
  precioUnitarioCOP: number;
  imagenUrl?: string;
  sedeDespacho?: string;
}

interface PedidoUsuario {
  codigo: string;
  cliente: string;
  emailCliente: string;
  ciudadDestino: string;
  codigoDaneDestino?: string;
  sedeAsignada: string;
  direccionEntrega: string;
  estadoActual: EstadoPedidoWeb;
  estadoCobro?: EstadoCobroWeb;
  indiceEstado?: number;
  guiaTransportadora?: string;
  transportadora?: string;
  metodoPago: string;
  fechaCreacionBogota: string;
  fechaActualizacionBogota?: string;
  totalFormateadoCOP?: string;
  totalCOP: number;
  notaReserva?: string;
  productos?: PedidoItem[];
}

const mapRecordToPedidoUsuario = (rec: ReturnType<typeof getWebOrder>): PedidoUsuario | null => {
  if (!rec) return null;
  const estadoValido: EstadoPedidoWeb = ESTADOS_TIMELINE.some((s) => s.id === rec.estado)
    ? (rec.estado as EstadoPedidoWeb)
    : 'RECIBIDO';
  const fmtFecha = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };
  return {
    codigo: rec.codigo,
    cliente: rec.cliente,
    emailCliente: rec.emailCliente,
    ciudadDestino: rec.ciudadDestino,
    codigoDaneDestino: rec.codigoDaneDestino,
    sedeAsignada: rec.sedeAsignada,
    direccionEntrega: rec.direccionEntrega,
    estadoActual: estadoValido,
    estadoCobro: rec.estadoCobro,
    guiaTransportadora: rec.guiaTransportadora,
    transportadora: rec.transportadora,
    metodoPago: rec.metodoPagoTexto,
    fechaCreacionBogota: fmtFecha(rec.fechaCreacionIso),
    totalCOP: rec.totalCOP,
    productos: rec.productos.map((p) => ({
      ...p,
      sedeDespacho: rec.sedeAsignada,
    })),
  };
};

export const MiCuentaPage: React.FC = () => {
  const navigate = useNavigate();

  // Estado del usuario autenticado
  const [session, setSession] = useState(() => {
    try {
      const rawUser = localStorage.getItem('usuario');
      const token = localStorage.getItem('token');
      return {
        usuario: rawUser ? JSON.parse(rawUser) : null,
        token,
      };
    } catch {
      return { usuario: null, token: null };
    }
  });

  // Lista de pedidos y buscador por código
  const [pedidos, setPedidos] = useState<PedidoUsuario[]>([]);
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [pedidoBuscadoManual, setPedidoBuscadoManual] = useState<PedidoUsuario | null>(null);
  const [mensajeBusqueda, setMensajeBusqueda] = useState<string | null>(null);

  // Sincronizar datos de sesión y pedidos con webOrdersStore
  const recargarPedidos = () => {
    try {
      const rawUser = localStorage.getItem('usuario');
      const token = localStorage.getItem('token');
      const userObj = rawUser ? JSON.parse(rawUser) : null;
      setSession({ usuario: userObj, token });

      const emailNormalizado = (userObj?.correo || userObj?.email || '').trim().toLowerCase();
      const accountKey = emailNormalizado ? `forma_pedidos_${emailNormalizado}` : 'forma_pedidos_guest';

      const listRaw = localStorage.getItem(accountKey);
      let list: PedidoUsuario[] = listRaw ? JSON.parse(listRaw) : [];

      // Sincronizar con webOrdersStore por email si hay correo
      if (emailNormalizado) {
        const storeOrders = getWebOrdersByEmail(emailNormalizado);
        storeOrders.forEach((so) => {
          const mapped = mapRecordToPedidoUsuario(so);
          if (mapped && !list.some((p) => p.codigo === mapped.codigo)) {
            list.unshift(mapped);
          }
        });
      }

      // Fusionar forma_ultimo_pedido si existe y pertenece al usuario o invitado
      try {
        const lastRaw = localStorage.getItem('forma_ultimo_pedido');
        if (lastRaw) {
          const last: PedidoUsuario = JSON.parse(lastRaw);
          if (
            last &&
            last.codigo &&
            (!emailNormalizado || !last.emailCliente || last.emailCliente.toLowerCase() === emailNormalizado)
          ) {
            const exists = list.some((p) => p.codigo === last.codigo);
            if (!exists) {
              list = [last, ...list];
            }
          }
        }
      } catch {
        // Ignorar error al leer último pedido
      }

      // Actualizar cada pedido con el estado real de webOrdersStore si existe allí
      list = list.map((p) => {
        const real = getWebOrder(p.codigo);
        if (!real) return p;
        const estadoValido: EstadoPedidoWeb = ESTADOS_TIMELINE.some((s) => s.id === real.estado)
          ? (real.estado as EstadoPedidoWeb)
          : p.estadoActual;
        return {
          ...p,
          estadoActual: estadoValido,
          estadoCobro: real.estadoCobro,
          sedeAsignada: real.sedeAsignada || p.sedeAsignada,
          guiaTransportadora: real.guiaTransportadora || p.guiaTransportadora,
          transportadora: real.transportadora || p.transportadora,
        };
      });

      setPedidos(list);

      if (pedidoBuscadoManual) {
        const actualizadoManual = mapRecordToPedidoUsuario(getWebOrder(pedidoBuscadoManual.codigo));
        if (actualizadoManual) {
          setPedidoBuscadoManual(actualizadoManual);
        }
      }
    } catch {
      setPedidos([]);
    }
  };

  useEffect(() => {
    recargarPedidos();

    const handleStorageChange = () => recargarPedidos();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    window.addEventListener(WEB_ORDERS_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      window.removeEventListener(WEB_ORDERS_EVENT, handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setSession({ usuario: null, token: null });
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  const getIndiceEstado = (estado: EstadoPedidoWeb): number => {
    const idx = ESTADOS_TIMELINE.findIndex((s) => s.id === estado);
    return idx >= 0 ? idx : 0;
  };

  const getEstadoBadgeClass = (estado: EstadoPedidoWeb) => {
    switch (estado) {
      case 'RECIBIDO':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'CONFIRMADO':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'EN_PREPARACION':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'LISTO_DESPACHO':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'DESPACHADO':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'EN_ENTREGA':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'ENTREGADO':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  // Acción exclusiva del cliente en pasos 6 y 7 cuando el pedido ya fue DESPACHADO
  const handleConfirmarRecepcionCliente = (
    pedido: PedidoUsuario,
    nuevoPaso: 'EN_ENTREGA' | 'ENTREGADO'
  ) => {
    const actualizadoStore = confirmarEntregaClienteWeb(pedido.codigo, nuevoPaso, pedido.cliente);

    // También actualizar espejo local en localStorage para pedidos cargados directamente
    const emailNormalizado = (
      pedido.emailCliente ||
      session.usuario?.correo ||
      session.usuario?.email ||
      ''
    )
      .trim()
      .toLowerCase();
    const accountKey = emailNormalizado ? `forma_pedidos_${emailNormalizado}` : 'forma_pedidos_guest';
    const nuevoCobro: EstadoCobroWeb | undefined =
      nuevoPaso === 'ENTREGADO' ? 'PAGADO' : pedido.estadoCobro;

    try {
      const raw = localStorage.getItem(accountKey);
      if (raw) {
        const arr: PedidoUsuario[] = JSON.parse(raw);
        const updatedArr = arr.map((item) =>
          item.codigo === pedido.codigo
            ? {
                ...item,
                estadoActual: nuevoPaso,
                estadoCobro: nuevoCobro,
                indiceEstado: nuevoPaso === 'ENTREGADO' ? 6 : 5,
              }
            : item
        );
        localStorage.setItem(accountKey, JSON.stringify(updatedArr));
      }
    } catch {
      // Ignorar
    }

    if (actualizadoStore) {
      recargarPedidos();
    } else {
      setPedidos((prev) =>
        prev.map((p) =>
          p.codigo === pedido.codigo
            ? { ...p, estadoActual: nuevoPaso, estadoCobro: nuevoCobro }
            : p
        )
      );
      if (pedidoBuscadoManual?.codigo === pedido.codigo) {
        setPedidoBuscadoManual((prev) =>
          prev ? { ...prev, estadoActual: nuevoPaso, estadoCobro: nuevoCobro } : null
        );
      }
    }
  };

  const handleBuscarPorCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = codigoBusqueda.trim().replace(/^#/, '').toUpperCase();
    if (!limpio) {
      setMensajeBusqueda('Ingresa un código de pedido válido (ej. PED-2026-849201).');
      return;
    }

    const enLista = pedidos.find((p) => p.codigo.toUpperCase() === limpio);
    if (enLista) {
      setPedidoBuscadoManual(enLista);
      setMensajeBusqueda(null);
      return;
    }

    const enStore = mapRecordToPedidoUsuario(getWebOrder(limpio));
    if (enStore) {
      setPedidoBuscadoManual(enStore);
      setMensajeBusqueda(null);
      return;
    }

    setPedidoBuscadoManual(null);
    setMensajeBusqueda(`No se encontró ningún pedido registrado con el código ${limpio}.`);
  };

  const renderTarjetaPedido = (pedido: PedidoUsuario) => {
    const indiceActual = getIndiceEstado(pedido.estadoActual);
    const infoEstadoActual = ESTADOS_TIMELINE[indiceActual];
    const porcentajeProgreso = Math.round(((indiceActual + 1) / ESTADOS_TIMELINE.length) * 100);
    const puedeMarcarEnEntrega = pedido.estadoActual === 'DESPACHADO';
    const puedeConfirmarEntregado =
      pedido.estadoActual === 'DESPACHADO' || pedido.estadoActual === 'EN_ENTREGA';
    const estaPagado =
      pedido.estadoCobro === 'PAGADO' || pedido.estadoActual === 'ENTREGADO';

    return (
      <div
        key={pedido.codigo}
        className="rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(80,50,42,0.10)] p-5 sm:p-7 space-y-6 transition-all hover:shadow-[0_12px_36px_rgba(80,50,42,0.14)]"
      >
        {/* Header del Pedido */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#50322A]/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-tabular font-black text-lg text-[#50322A]">
                {pedido.codigo}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-xs ${getEstadoBadgeClass(
                  pedido.estadoActual
                )}`}
              >
                {infoEstadoActual.etiqueta}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  estaPagado
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {estaPagado ? '✓ Pagado en Sistema' : 'Pendiente Liquidación Entrega'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#50322A]/70 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D19650]" />
                <span>{pedido.fechaCreacionBogota} (Hora Oficial Colombia)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#D19650]" />
                <span>Sede: {pedido.sedeAsignada}</span>
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="block text-xl font-black font-mono-tabular text-[#50322A]">
              {formatCOP(pedido.totalCOP)}
            </span>
            <span className="text-[11px] font-medium text-[#50322A]/70 block truncate max-w-[240px]">
              {pedido.metodoPago}
            </span>
          </div>
        </div>

        {/* Línea de Tiempo Real Animada de los 7 Estados */}
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/95 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#50322A]">
              Trazabilidad Oficial en 7 Estados:
            </span>
            <span className="text-[11px] font-bold text-[#661521]">
              {infoEstadoActual.tipoReserva}
            </span>
          </div>

          {/* Barra de Progreso Animada */}
          <div className="w-full h-2 rounded-full bg-[#E7DED2] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#661521] via-[#D19650] to-emerald-600 transition-all duration-500"
              style={{ width: `${porcentajeProgreso}%` }}
            />
          </div>

          {/* Stepper Gráfico Oficial (Pasos 1 a 5 bloqueados al clic del cliente; Pasos 6 y 7 habilitados tras DESPACHADO) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            {ESTADOS_TIMELINE.map((paso, idx) => {
              const isCompletado = idx < indiceActual;
              const isActual = idx === indiceActual;

              return (
                <div
                  key={paso.id}
                  className={`p-2.5 rounded-xl border text-left transition-all relative select-none ${
                    isActual
                      ? 'bg-[#661521] text-white border-[#D19650] shadow-md ring-2 ring-[#D19650]/50 scale-[1.02]'
                      : isCompletado
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-white/70 text-stone-500 border-stone-200 opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono-tabular font-bold opacity-75">
                      0{idx + 1}
                    </span>
                    {isCompletado ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : isActual ? (
                      <Clock className="w-3.5 h-3.5 text-[#D19650] shrink-0 animate-pulse" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                    )}
                  </div>
                  <span className="block text-xs font-bold truncate leading-tight">
                    {paso.etiqueta.replace(/^\d+\.\s*/, '')}
                  </span>
                  <span className="block text-[10px] mt-0.5 opacity-80 truncate">
                    {isCompletado ? 'Completado' : isActual ? 'En Curso' : 'Pendiente'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Panel de Confirmación de Recepción por el Cliente (Habilitado cuando está DESPACHADO o EN_ENTREGA) */}
          {(puedeMarcarEnEntrega || puedeConfirmarEntregado) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#661521]/10 via-white to-emerald-50 border border-[#D19650]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#661521] flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#D19650]" />
                  <span>Confirmación de Recepción del Cliente</span>
                </span>
                <p className="text-xs text-[#50322A]">
                  Tu pedido ya fue despachado por la boutique. Confirma cuando estés recibiendo el paquete y cuando haya sido entregado para liquidar la orden en el sistema.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {puedeMarcarEnEntrega && (
                  <button
                    type="button"
                    onClick={() => handleConfirmarRecepcionCliente(pedido, 'EN_ENTREGA')}
                    className="px-4 py-2.5 rounded-xl bg-[#D19650] hover:bg-[#b87f3d] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                  >
                    Marcar En Entrega (Recibiendo paquete)
                  </button>
                )}
                {puedeConfirmarEntregado && (
                  <button
                    type="button"
                    onClick={() => handleConfirmarRecepcionCliente(pedido, 'ENTREGADO')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pedido Entregado y Pagado</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="pt-1 text-[11px] text-[#50322A]/80 flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-white">
            <AlertCircle className="w-3.5 h-3.5 text-[#D19650] shrink-0 mt-0.5" />
            <span>
              <strong>{infoEstadoActual.etiqueta}:</strong> {infoEstadoActual.descripcion}{' '}
              <span className="text-[#50322A]/60 italic">
                • Los pasos 1 al 5 son actualizados en tiempo real por el Centro de Despacho; al despacharse puedes confirmar tu recepción.
              </span>
            </span>
          </div>
        </div>

        {/* Prendas Compradas */}
        {pedido.productos && pedido.productos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#50322A]">
              Prendas de la Orden ({pedido.productos.reduce((acc, p) => acc + p.cantidad, 0)}):
            </h4>
            <div className="divide-y divide-[#50322A]/10 rounded-2xl bg-white/60 border border-[#50322A]/10 p-2 sm:p-4">
              {pedido.productos.map((prod, pIdx) => (
                <div
                  key={`${prod.sku}-${pIdx}`}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        prod.imagenUrl ||
                        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={prod.nombre}
                      className="w-14 h-16 rounded-xl object-cover border border-[#50322A]/10 bg-[#E7DED2]/30 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <h5 className="font-display font-bold text-sm text-[#50322A] truncate">
                        {prod.nombre}
                      </h5>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#50322A]/70">
                        {prod.talla && (
                          <span className="px-1.5 py-0.5 rounded bg-[#E7DED2]/70 font-semibold text-[#50322A]">
                            Talla: {prod.talla}
                          </span>
                        )}
                        {prod.color && (
                          <span className="px-1.5 py-0.5 rounded bg-[#E7DED2]/70 font-semibold text-[#50322A]">
                            Color: {prod.color}
                          </span>
                        )}
                        <span className="font-mono-tabular text-[#50322A]/60">
                          SKU: {prod.sku}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-medium text-[#50322A]/70">
                      {prod.cantidad} x {formatCOP(prod.precioUnitarioCOP)}
                    </span>
                    <span className="block text-sm font-bold font-mono-tabular text-[#50322A]">
                      {formatCOP(prod.precioUnitarioCOP * prod.cantidad)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Datos de Despacho y Entrega */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#50322A]">
          <div className="p-3 rounded-xl bg-white/70 border border-[#50322A]/10 space-y-1">
            <span className="font-bold text-[#50322A] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D19650]" />
              <span>Destino de Entrega:</span>
            </span>
            <p className="text-[#50322A]/80">{pedido.direccionEntrega}</p>
            <p className="font-semibold text-[#50322A]">{pedido.ciudadDestino}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-[#50322A]/10 space-y-1">
            <span className="font-bold text-[#50322A] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#D19650]" />
              <span>Despacho Logístico:</span>
            </span>
            <p className="text-[#50322A]/80">
              {pedido.transportadora || 'Coordinadora / TCC'}
            </p>
            <p className="font-mono-tabular font-bold text-[#661521]">
              Guía: {pedido.guiaTransportadora || 'Asignada al despachar'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Buscador de rastreo por código reutilizable
  const renderBuscadorRastreo = () => (
    <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(80,50,42,0.08)] p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#661521] block">
            Rastreo Directo por Código
          </span>
          <h3 className="font-display text-lg font-bold text-[#50322A]">
            Consultar Trazabilidad de Pedido (#PED-2026-...)
          </h3>
        </div>
      </div>

      <form onSubmit={handleBuscarPorCodigo} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#50322A]/60 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={codigoBusqueda}
            onChange={(e) => setCodigoBusqueda(e.target.value)}
            placeholder="Ej. PED-2026-849201"
            aria-label="Buscar pedido por código"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#50322A]/20 text-xs sm:text-sm font-mono-tabular font-bold text-[#171717] focus:outline-none focus:border-[#661521]"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-[#661521] hover:bg-[#50322A] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shrink-0"
        >
          Rastrear Pedido
        </button>
      </form>

      {mensajeBusqueda && (
        <p className="text-xs font-bold text-[#661521] bg-[#661521]/10 px-4 py-2.5 rounded-xl">
          {mensajeBusqueda}
        </p>
      )}

      {pedidoBuscadoManual && (
        <div className="pt-2">{renderTarjetaPedido(pedidoBuscadoManual)}</div>
      )}
    </div>
  );

  // Si el usuario no ha iniciado sesión, mostrar tarjeta de bienvenida y el rastreador por código
  if (!session.token || !session.usuario) {
    return (
      <div className="min-h-[calc(100vh-14rem)] w-full py-8 space-y-8 animate-in fade-in duration-300">
        <div className="rounded-[2.5rem] bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgb(80,50,42,0.10)] p-8 sm:p-14 text-center max-w-xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#661521]/10 border border-[#D19650]/40 flex items-center justify-center text-[#661521] shadow-inner">
            <User className="w-10 h-10 text-[#661521]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7DED2] text-[#50322A] text-xs font-bold uppercase tracking-widest border border-[#50322A]/10">
              <Sparkles className="w-3.5 h-3.5 text-[#D19650]" />
              <span>Portal de Clientes FORMA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-[#50322A]">
              Bienvenido a Mi Cuenta
            </h1>
            <p className="text-sm sm:text-base text-[#50322A]/75 leading-relaxed">
              Inicia sesión con tu cuenta para visualizar tus pedidos, consultar la trazabilidad en tiempo real en los 7 estados y confirmar la recepción de tus compras.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#661521] hover:bg-[#50322A] text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 border border-[#D19650]/50"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-[#E7DED2]/50 text-[#50322A] font-extrabold text-sm uppercase tracking-wider transition-all border border-[#50322A]/20 active:scale-95"
            >
              Crear una Cuenta
            </Link>
          </div>

          <div className="pt-4 border-t border-[#50322A]/10 text-xs text-[#50322A]/60 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D19650]" />
            <span>Protección de Datos conforme a la Ley 1581 de 2012</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">{renderBuscadorRastreo()}</div>
      </div>
    );
  }

  const { usuario } = session;
  const esAdmin = usuario.rol === 'ADMIN';
  const esVendedor = usuario.rol === 'VENDEDOR';

  return (
    <div className="min-h-[calc(100vh-14rem)] w-full py-4 sm:py-8 space-y-8 animate-in fade-in duration-300">
      {/* Encabezado Editorial de Mi Cuenta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#50322A]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-[#D19650] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centro de Trazabilidad & Mis Pedidos</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-[#50322A]">
            Mi Cuenta FORMA
          </h1>
          <p className="text-sm sm:text-base text-[#50322A]/80 font-medium">
            Bienvenido, <strong className="text-[#50322A]">{usuario.nombreCompleto || usuario.nombre || 'Cliente'}</strong>. Administra tus pedidos y consulta la trazabilidad logística en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {esAdmin && (
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 rounded-full bg-[#D19650] hover:bg-[#bf833e] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Panel Admin</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
          {esVendedor && (
            <Link
              to="/pos/venta"
              className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Terminal POS</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Grid: Tarjeta de Perfil + Historial y Trazabilidad de Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Tarjeta de Perfil y Accesos (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(80,50,42,0.08)] p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#661521] border-2 border-[#D19650] flex items-center justify-center text-white font-display font-black text-2xl shadow-md">
                {(usuario.nombreCompleto || usuario.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-black text-lg text-[#50322A] truncate">
                  {usuario.nombreCompleto || usuario.nombre || 'Usuario'}
                </h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#E7DED2] text-[#50322A] border border-[#50322A]/15 mt-1">
                  Rol: {usuario.rol || 'CLIENTE'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#50322A]/10 text-xs sm:text-sm text-[#50322A]">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#D19650] shrink-0" />
                <span className="truncate">{usuario.correo || usuario.email || 'No registrado'}</span>
              </div>
              {usuario.telefono && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#D19650] shrink-0" />
                  <span>{usuario.telefono}</span>
                </div>
              )}
              {usuario.documento && (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#D19650] shrink-0" />
                  <span>Documento: {usuario.documento}</span>
                </div>
              )}
            </div>

            {/* Resumen Rápido de Cuenta */}
            <div className="p-4 rounded-2xl bg-[#50322A]/5 border border-[#50322A]/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#50322A]">
                <span className="font-medium">Pedidos registrados:</span>
                <span className="font-bold font-mono-tabular">{pedidos.length}</span>
              </div>
              <div className="flex justify-between items-center text-[#50322A]">
                <span className="font-medium">Garantía legal:</span>
                <span className="font-bold text-emerald-700">Vigente (Ley 1480)</span>
              </div>
            </div>

            {/* Enlaces de Ayuda */}
            <div className="pt-2 space-y-2">
              <Link
                to="/bolsa"
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#E7DED2]/50 text-xs font-bold text-[#50322A] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#D19650]" />
                  <span>Ver Mi Bolsa de Compras</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#50322A]/50" />
              </Link>
              <Link
                to="/soporte"
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#E7DED2]/50 text-xs font-bold text-[#50322A] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#D19650]" />
                  <span>Centro de Ayuda y WhatsApp Oficial</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#50322A]/50" />
              </Link>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Buscador + Historial de Pedidos (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {renderBuscadorRastreo()}

          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-display font-black text-[#50322A] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D19650]" />
              <span>Historial de Mis Pedidos</span>
            </h2>
            <span className="text-xs font-bold text-[#50322A]/60">
              {pedidos.length} {pedidos.length === 1 ? 'pedido registrado' : 'pedidos registrados'}
            </span>
          </div>

          {pedidos.length === 0 ? (
            /* Estado Vacío de Pedidos */
            <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(80,50,42,0.06)] p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#661521]/10 flex items-center justify-center text-[#661521]">
                <Package className="w-8 h-8 text-[#661521]" />
              </div>
              <h3 className="text-xl font-display font-black text-[#50322A]">
                Aún no has realizado pedidos
              </h3>
              <p className="text-xs sm:text-sm text-[#50322A]/70 max-w-md mx-auto">
                Tus compras en línea con despacho nacional y reserva oficial aparecerán aquí con su línea de tiempo de 7 estados.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#661521] hover:bg-[#50322A] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#D19650]" />
                  <span>Ver Catálogo</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Lista de Pedidos */
            <div className="space-y-6">{pedidos.map((pedido) => renderTarjetaPedido(pedido))}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiCuentaPage;
