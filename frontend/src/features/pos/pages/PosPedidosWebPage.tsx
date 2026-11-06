import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Package,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  MapPin,
  X,
  ChevronRight,
  User,
  Phone,
} from 'lucide-react';
import { DetailDrawer, ActivityTimelineItem } from '../components/DetailDrawer';

export type EstadoPedidoWeb =
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO_DESPACHO'
  | 'DESPACHADO'
  | 'REASIGNADO'
  | 'EN_BODEGA_CENTRAL';

export interface PrendaPedidoWeb {
  sku: string;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioCop: number;
  imagenUrl: string;
}

export interface PedidoWebItem {
  id: string;
  codigo: string;
  fecha: string;
  cliente: string;
  telefonoCliente?: string;
  ciudadDestino: string;
  codigoDane: string;
  direccionEntrega?: string;
  prendas: PrendaPedidoWeb[];
  totalCop: number;
  estado: EstadoPedidoWeb;
  guiaTransportadora: string;
  empresaTransporte: string;
  observaciones: string;
  novedadReasignacion?: string;
}

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

const PEDIDOS_WEB_INICIALES: PedidoWebItem[] = [
  {
    id: 'ped-web-01',
    codigo: 'PED-2026-849201',
    fecha: 'Hoy · 09:20 a. m.',
    cliente: 'Camila Soto Peñaranda',
    telefonoCliente: '312 840 9921',
    ciudadDestino: 'Cúcuta, Norte de Santander',
    codigoDane: '54001',
    direccionEntrega: 'Av. Gran Colombia # 12-40, Apto 402',
    prendas: [
      {
        sku: 'ROP-DNM-001-M',
        nombre: 'Chaqueta Denim Artesanal',
        talla: 'M',
        color: 'Azul Índigo',
        cantidad: 1,
        precioCop: 189000,
        imagenUrl:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
      },
    ],
    totalCop: 189000,
    estado: 'CONFIRMADO',
    guiaTransportadora: '',
    empresaTransporte: 'TCC',
    observaciones: '',
  },
  {
    id: 'ped-web-02',
    codigo: 'PED-2026-510394',
    fecha: 'Hoy · 08:45 a. m.',
    cliente: 'Santiago Morales Rojas',
    telefonoCliente: '315 220 8814',
    ciudadDestino: 'Bucaramanga, Santander',
    codigoDane: '68001',
    direccionEntrega: 'Carrera 27 # 45-10, Floridablanca',
    prendas: [
      {
        sku: 'ACC-BOL-003-UNI',
        nombre: 'Bolso Cuero Graso Unisex',
        talla: 'Única',
        color: 'Miel Natural',
        cantidad: 1,
        precioCop: 249000,
        imagenUrl:
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
      },
      {
        sku: 'COS-KIT-008-SET',
        nombre: 'Kit Botánico Cuidado Facial',
        talla: 'Set x3',
        color: 'Natural',
        cantidad: 1,
        precioCop: 98000,
        imagenUrl:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      },
    ],
    totalCop: 347000,
    estado: 'EN_PREPARACION',
    guiaTransportadora: 'TCC-68001-99214',
    empresaTransporte: 'TCC',
    observaciones: 'Prenda envuelta con papel seda aromático y tarjeta de agradecimiento.',
  },
  {
    id: 'ped-web-03',
    codigo: 'PED-2026-339102',
    fecha: 'Ayer · 04:10 p. m.',
    cliente: 'Mariana Duque Gómez',
    telefonoCliente: '320 541 3300',
    ciudadDestino: 'Ocaña, Norte de Santander',
    codigoDane: '54498',
    direccionEntrega: 'Calle del Embudo # 8-15',
    prendas: [
      {
        sku: 'ROP-CAM-002-S',
        nombre: 'Camiseta Básica Algodón Pima',
        talla: 'S',
        color: 'Blanco Hueso',
        cantidad: 2,
        precioCop: 59900,
        imagenUrl:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      },
    ],
    totalCop: 119800,
    estado: 'LISTO_DESPACHO',
    guiaTransportadora: 'ENVIA-54498-10023',
    empresaTransporte: 'Envía',
    observaciones: 'Caja rotulada lista en zona de recolección.',
  },
  {
    id: 'ped-web-04',
    codigo: 'PED-2026-210884',
    fecha: 'Ayer · 11:30 a. m.',
    cliente: 'Daniel Alberto Gómez',
    telefonoCliente: '300 981 4422',
    ciudadDestino: 'Cúcuta, Norte de Santander',
    codigoDane: '54001',
    direccionEntrega: 'Barrio Caobos, Calle 15 # 2E-30',
    prendas: [
      {
        sku: 'ART-MOC-005-UNI',
        nombre: 'Mochila Wayuu Tradicional',
        talla: 'Única',
        color: 'Geométrico Tierra',
        cantidad: 1,
        precioCop: 175000,
        imagenUrl:
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
      },
    ],
    totalCop: 175000,
    estado: 'DESPACHADO',
    guiaTransportadora: 'TCC-54001-88421',
    empresaTransporte: 'TCC',
    observaciones: 'Entregado a conductor TCC a las 02:15 p.m.',
  },
];

export const PosPedidosWebPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoWebItem[]>(PEDIDOS_WEB_INICIALES);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Master-Detail: Pedido seleccionado para el Drawer lateral (inicializado con el primero para acceso directo)
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState<string | null>(
    PEDIDOS_WEB_INICIALES[0].id
  );
  const [drawerTab, setDrawerTab] = useState<string>('detalle');

  // Estado para modal de contingencia
  const [pedidoContingencia, setPedidoContingencia] = useState<PedidoWebItem | null>(null);
  const [motivoContingencia, setMotivoContingencia] = useState<string>('');
  const [destinoReasignacion, setDestinoReasignacion] = useState<'OTRA_TIENDA' | 'BODEGA_CENTRAL'>(
    'OTRA_TIENDA'
  );

  // Leer pedidos guardados en localStorage
  useEffect(() => {
    try {
      const rawUltimo = localStorage.getItem('forma_ultimo_pedido');
      if (!rawUltimo) return;
      const parsed = JSON.parse(rawUltimo);
      if (!parsed || !parsed.codigo) return;

      setPedidos((prev) => {
        if (prev.some((p) => p.codigo === parsed.codigo)) return prev;
        const nuevo: PedidoWebItem = {
          id: `ped-local-${Date.now()}`,
          codigo: parsed.codigo,
          fecha: 'Hoy · Reciente',
          cliente: parsed.clienteNombre || 'Cliente Web',
          telefonoCliente: parsed.clienteTelefono || '300 000 0000',
          ciudadDestino: `${parsed.ciudadDestino || 'Cúcuta'}, ${parsed.departamento || 'Norte de Santander'}`,
          codigoDane: '54001',
          direccionEntrega: parsed.direccionEntrega || 'Dirección no especificada',
          prendas: Array.isArray(parsed.items)
            ? parsed.items.map((it: any) => ({
                sku: it.sku || 'ROP-GEN-001',
                nombre: it.nombre || 'Prenda Atelier',
                talla: it.talla || 'Única',
                color: it.color || 'Estándar',
                cantidad: it.cantidad || 1,
                precioCop: it.precioUnitarioCop || it.precioVentaCop || 99000,
                imagenUrl:
                  it.imagenUrl ||
                  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
              }))
            : [],
          totalCop: parsed.totalCop || 99000,
          estado: 'CONFIRMADO',
          guiaTransportadora: '',
          empresaTransporte: 'TCC',
          observaciones: '',
        };
        return [nuevo, ...prev];
      });
    } catch {
      // ignore
    }
  }, []);

  // Filtrado de pedidos
  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (filtroEstado !== 'TODOS' && p.estado !== filtroEstado) {
        return false;
      }
      if (!q) return true;
      const matchCodigo = p.codigo.toLowerCase().includes(q);
      const matchCliente = p.cliente.toLowerCase().includes(q);
      const matchCiudad = p.ciudadDestino.toLowerCase().includes(q);
      const matchPrenda = p.prendas.some(
        (pr) =>
          pr.nombre.toLowerCase().includes(q) ||
          pr.sku.toLowerCase().includes(q) ||
          pr.talla.toLowerCase().includes(q)
      );
      return matchCodigo || matchCliente || matchCiudad || matchPrenda;
    });
  }, [pedidos, busqueda, filtroEstado]);

  const pedidoSeleccionado = useMemo(() => {
    return pedidos.find((p) => p.id === pedidoSeleccionadoId) || null;
  }, [pedidos, pedidoSeleccionadoId]);

  // Acciones de avance de estado
  const handleAvanzarEstado = (id: string) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.estado === 'CONFIRMADO') {
          return {
            ...p,
            estado: 'EN_PREPARACION',
            observaciones: p.observaciones || 'Alistamiento iniciado por el cajero.',
          };
        }
        if (p.estado === 'EN_PREPARACION') {
          return {
            ...p,
            estado: 'LISTO_DESPACHO',
            guiaTransportadora:
              p.guiaTransportadora ||
              `TCC-${p.codigoDane}-00${Math.floor(100 + Math.random() * 900)}`,
          };
        }
        if (p.estado === 'LISTO_DESPACHO') {
          return {
            ...p,
            estado: 'DESPACHADO',
          };
        }
        return p;
      })
    );
  };

  const handleUpdateObservaciones = (id: string, texto: string) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, observaciones: texto } : p))
    );
  };

  const handleUpdateGuia = (id: string, guia: string) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, guiaTransportadora: guia } : p))
    );
  };

  // Confirmar contingencia (sin jerga técnica)
  const handleConfirmarContingencia = () => {
    if (!pedidoContingencia) return;
    const destinoTexto =
      destinoReasignacion === 'OTRA_TIENDA'
        ? 'Reasignado a Punto Caobos (Con inventario físico disponible)'
        : 'Transferido a Bodega Central para despacho directo';

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoContingencia.id) return p;
        return {
          ...p,
          estado: destinoReasignacion === 'OTRA_TIENDA' ? 'REASIGNADO' : 'EN_BODEGA_CENTRAL',
          novedadReasignacion: `${destinoTexto}. Motivo: "${motivoContingencia}".`,
        };
      })
    );
    setPedidoContingencia(null);
  };

  const pendientesContador = pedidos.filter(
    (p) => p.estado === 'CONFIRMADO' || p.estado === 'EN_PREPARACION'
  ).length;

  const getBadgeInfo = (estado: EstadoPedidoWeb) => {
    switch (estado) {
      case 'CONFIRMADO':
        return { label: '1. Confirmado (Por Alistar)', variant: 'warning' as const };
      case 'EN_PREPARACION':
        return { label: '2. En Preparación', variant: 'info' as const };
      case 'LISTO_DESPACHO':
        return { label: '3. Listo para Despacho', variant: 'success' as const };
      case 'DESPACHADO':
        return { label: '4. Despachado', variant: 'neutral' as const };
      case 'REASIGNADO':
        return { label: 'Reasignado a otra Tienda', variant: 'danger' as const };
      case 'EN_BODEGA_CENTRAL':
        return { label: 'Enviado a Bodega Central', variant: 'danger' as const };
    }
  };

  // Generador de actividades para el tab Actividad
  const actividadPedido: ActivityTimelineItem[] = useMemo(() => {
    if (!pedidoSeleccionado) return [];
    const items: ActivityTimelineItem[] = [
      {
        id: 'act-1',
        timestamp: `${pedidoSeleccionado.fecha}`,
        title: 'Pedido web recibido y confirmado en plataforma',
        description: `El cliente ${pedidoSeleccionado.cliente} completó la orden. Reserva de inventario blando aplicada (RN-WEB-16).`,
        user: 'Sistema Ecommerce',
        type: 'info',
      },
      {
        id: 'act-2',
        timestamp: `${pedidoSeleccionado.fecha}`,
        title: 'Asignación automática de despacho a Punto Centro',
        description:
          'Se validó la disponibilidad de stock local para alistamiento en tienda física.',
        user: 'Orquestador Multisede',
        type: 'info',
      },
    ];

    if (
      pedidoSeleccionado.estado === 'EN_PREPARACION' ||
      pedidoSeleccionado.estado === 'LISTO_DESPACHO' ||
      pedidoSeleccionado.estado === 'DESPACHADO'
    ) {
      items.push({
        id: 'act-3',
        timestamp: 'Hoy · 09:40 a. m.',
        title: 'Alistamiento de prendas iniciado',
        description:
          pedidoSeleccionado.observaciones ||
          'El personal de tienda recolectó las prendas de mostrador para embalaje.',
        user: 'Vendedor Centro',
        type: 'warning',
      });
    }

    if (
      pedidoSeleccionado.estado === 'LISTO_DESPACHO' ||
      pedidoSeleccionado.estado === 'DESPACHADO'
    ) {
      items.push({
        id: 'act-4',
        timestamp: 'Hoy · 10:15 a. m.',
        title: 'Rotulado y paquete listo para transportadora',
        description: `Guía generada: ${pedidoSeleccionado.guiaTransportadora} (${pedidoSeleccionado.empresaTransporte}). Paquete sellado con cinta de seguridad.`,
        user: 'Vendedor Centro',
        type: 'success',
      });
    }

    if (pedidoSeleccionado.estado === 'DESPACHADO') {
      items.push({
        id: 'act-5',
        timestamp: 'Hoy · 11:20 a. m.',
        title: 'Entrega física a transportadora efectuada',
        description: `Mercancía recolectada por el conductor de ${pedidoSeleccionado.empresaTransporte}. Notificación enviada al cliente.`,
        user: 'Operador Logístico',
        type: 'success',
      });
    }

    if (pedidoSeleccionado.novedadReasignacion) {
      items.push({
        id: 'act-nov',
        timestamp: 'Hoy · Novedad',
        title: 'Novedad de Reasignación en Tienda',
        description: pedidoSeleccionado.novedadReasignacion,
        user: 'Administrador / Supervisor',
        type: 'warning',
      });
    }

    return items;
  }, [pedidoSeleccionado]);

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-2xs p-2.5 sm:p-5 select-none font-sans flex flex-col justify-between">
      <div>
        {/* =========================================================================
            CABECERA EDITORIAL Y KPIS DE DESPACHO WEB
        ========================================================================= */}
        <header className="bg-white rounded-2xl border border-[#D8CFC6] shadow-2xs p-4 sm:p-5 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Truck className="w-5 h-5 text-[#D19650]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-[10px] font-black tracking-wider uppercase">
                    Despacho Omnicanal
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                    {pendientesContador} Pedidos Pendientes de Despacho
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-[#1C1311] tracking-tight mt-0.5">
                  Alistamiento y Despacho de Pedidos Web
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-[#FAF7F4] px-3 py-2 rounded-xl border border-[#E5DDD3]">
              <MapPin className="w-4 h-4 text-[#661521]" />
              <span className="font-bold text-[#1C1311]">
                Punto Físico Asignado: Centro (Cúcuta)
              </span>
            </div>
          </div>

          {/* Pestañas de Filtro Rápido */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-stone-500 mr-1 shrink-0">
              Filtrar por estado:
            </span>
            {[
              { id: 'TODOS', label: 'Todos los Pedidos' },
              { id: 'CONFIRMADO', label: '1. Por Alistar' },
              { id: 'EN_PREPARACION', label: '2. En Preparación' },
              { id: 'LISTO_DESPACHO', label: '3. Listos para Transportadora' },
              { id: 'DESPACHADO', label: '4. Despachados' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroEstado(tab.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all shrink-0 cursor-pointer ${
                  filtroEstado === tab.id
                    ? 'bg-[#661521] text-white border-[#661521] shadow-2xs'
                    : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* =========================================================================
            BARRA DE BÚSQUEDA RÁPIDA
        ========================================================================= */}
        <div className="bg-white rounded-2xl border border-[#D8CFC6] shadow-2xs p-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código de pedido (ej. PED-2026-849201), cliente, prenda o ciudad..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-semibold text-[#1C1311] placeholder:text-stone-400 focus:outline-none focus:border-[#661521]"
            />
          </div>
        </div>

        {/* =========================================================================
            LISTADO COMPACTO DE PEDIDOS WEB (Filas de 60-76px con Patrón Master-Detail)
        ========================================================================= */}
        <div className="space-y-2">
          {pedidosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D8CFC6] p-10 text-center text-stone-500 space-y-2">
              <Package className="w-10 h-10 mx-auto text-stone-300" />
              <p className="font-bold text-sm">No hay pedidos web en este estado.</p>
            </div>
          ) : (
            pedidosFiltrados.map((pedido) => {
              const badge = getBadgeInfo(pedido.estado);
              const isSelected = pedidoSeleccionadoId === pedido.id;

              return (
                <div
                  key={pedido.id}
                  onClick={() => {
                    setPedidoSeleccionadoId(pedido.id);
                    setDrawerTab('detalle');
                  }}
                  className={`
                    w-full min-h-[64px] p-3 sm:p-3.5 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs
                    ${
                      isSelected
                        ? 'border-[#661521] ring-2 ring-[#661521]/15 bg-white'
                        : 'border-[#D8CFC6] hover:border-[#661521]/50 hover:bg-[#FAF7F4]'
                    }
                  `}
                >
                  {/* Columna Izquierda: Código, Fecha, Cliente y Destino */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#F4EFEA] border border-[#50322A]/15 text-[#661521] flex items-center justify-center shrink-0 font-bold">
                      <Package className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-black text-[#1C1311]">
                          #{pedido.codigo}
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {pedido.fecha}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-800 font-bold truncate">
                        <span>{pedido.cliente}</span>
                        <span className="text-stone-400">•</span>
                        <span className="text-stone-500 font-normal truncate">
                          {pedido.ciudadDestino}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Prendas, Total, Badge y Botón */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="text-left sm:text-right">
                      <span className="block font-mono text-xs sm:text-sm font-black text-[#059669]">
                        Total: {formatCOP(pedido.totalCop)} COP
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {pedido.prendas.length} {pedido.prendas.length === 1 ? 'prenda' : 'prendas'}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border ${
                        pedido.estado === 'CONFIRMADO'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : pedido.estado === 'EN_PREPARACION'
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                          : pedido.estado === 'LISTO_DESPACHO'
                          ? 'bg-emerald-50 text-[#059669] border-emerald-300'
                          : pedido.estado === 'DESPACHADO'
                          ? 'bg-stone-100 text-stone-700 border-stone-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {badge.label}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPedidoSeleccionadoId(pedido.id);
                        setDrawerTab('detalle');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#50322A]/20 text-xs font-bold text-[#351912] bg-[#F4EFEA] hover:bg-[#E7DED2] transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Ver Detalle</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          DRAWER LATERAL DE DETALLE DE PEDIDO (Patrón Master-Detail + Actividad)
      ========================================================================= */}
      {pedidoSeleccionado && (
        <DetailDrawer
          isOpen={Boolean(pedidoSeleccionado)}
          onClose={() => setPedidoSeleccionadoId(null)}
          title="Alistamiento de Despacho"
          subtitle={`${pedidoSeleccionado.cliente} · ${pedidoSeleccionado.ciudadDestino}`}
          badge={getBadgeInfo(pedidoSeleccionado.estado)}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          activityItems={actividadPedido}
          footerActions={
            <div className="flex flex-col sm:flex-row gap-2">
              {pedidoSeleccionado.estado === 'CONFIRMADO' && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstado(pedidoSeleccionado.id)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4 text-[#D19650]" />
                  <span>Iniciar Alistamiento / En Preparación</span>
                </button>
              )}

              {pedidoSeleccionado.estado === 'EN_PREPARACION' && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstado(pedidoSeleccionado.id)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Marcar como Listo para Despacho</span>
                </button>
              )}

              {pedidoSeleccionado.estado === 'LISTO_DESPACHO' && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstado(pedidoSeleccionado.id)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Registrar Despacho a Transportadora</span>
                </button>
              )}

              {pedidoSeleccionado.estado === 'DESPACHADO' && (
                <div className="flex-1 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Despachado con guía {pedidoSeleccionado.guiaTransportadora}</span>
                </div>
              )}

              {(pedidoSeleccionado.estado === 'CONFIRMADO' ||
                pedidoSeleccionado.estado === 'EN_PREPARACION') && (
                <button
                  type="button"
                  onClick={() => setPedidoContingencia(pedidoSeleccionado)}
                  className="min-h-[46px] px-3.5 rounded-xl bg-[#FAF7F4] hover:bg-red-50 text-[#661521] border border-[#661521]/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>¿No tienes la prenda? Reportar y reasignar</span>
                </button>
              )}
            </div>
          }
        >
          {/* Contenido de la pestaña Detalle */}
          <div className="space-y-4 text-xs">
            {/* Destinatario y Dirección */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#D8CFC6] space-y-2.5">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#661521] mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase text-stone-400">
                    Destinatario
                  </span>
                  <p className="font-black text-sm text-[#1C1311]">
                    {pedidoSeleccionado.cliente}
                  </p>
                  {pedidoSeleccionado.telefonoCliente && (
                    <p className="text-stone-600 font-medium mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{pedidoSeleccionado.telefonoCliente}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#661521] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold uppercase text-stone-400">
                    Dirección de Entrega (DANE {pedidoSeleccionado.codigoDane})
                  </span>
                  <p className="font-bold text-stone-800 mt-0.5">
                    {pedidoSeleccionado.ciudadDestino}
                  </p>
                  {pedidoSeleccionado.direccionEntrega && (
                    <p className="text-stone-600 font-medium">
                      {pedidoSeleccionado.direccionEntrega}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Prendas a Empacar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#50322A]">
                  Prendas a empacar ({pedidoSeleccionado.prendas.length})
                </h4>
                <span className="font-mono font-bold text-xs text-[#059669]">
                  Total: {formatCOP(pedidoSeleccionado.totalCop)} COP
                </span>
              </div>

              <div className="space-y-2">
                {pedidoSeleccionado.prendas.map((prenda, idx) => (
                  <div
                    key={`${prenda.sku}-${idx}`}
                    className="p-3 bg-[#FAF7F4] rounded-2xl border border-[#D8CFC6] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prenda.imagenUrl}
                        alt={prenda.nombre}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-[#1C1311] truncate">
                          {prenda.nombre}
                        </h5>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-mono text-stone-600">
                          <span className="px-1.5 py-0.2 rounded bg-stone-200 font-bold text-[#1C1311]">
                            SKU: {prenda.sku}
                          </span>
                          <span>Talla: {prenda.talla}</span>
                          <span>Color: {prenda.color}</span>
                          <span className="font-bold text-[#661521]">
                            Cantidad: {prenda.cantidad} und
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-xs sm:text-sm font-black text-[#1C1311] shrink-0">
                      {formatCOP(prenda.precioCop)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Novedad de Reasignación si existe */}
            {pedidoSeleccionado.novedadReasignacion && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{pedidoSeleccionado.novedadReasignacion}</span>
              </div>
            )}

            {/* Guía Transportadora & Observaciones */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                  Número de Guía Transportadora ({pedidoSeleccionado.empresaTransporte}):
                </label>
                <input
                  type="text"
                  disabled={pedidoSeleccionado.estado === 'DESPACHADO'}
                  value={pedidoSeleccionado.guiaTransportadora}
                  onChange={(e) =>
                    handleUpdateGuia(pedidoSeleccionado.id, e.target.value)
                  }
                  placeholder="Ej. TCC-54001-99412..."
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] font-mono text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                  Observaciones de Empaque y Alistamiento:
                </label>
                <textarea
                  rows={2}
                  disabled={pedidoSeleccionado.estado === 'DESPACHADO'}
                  value={pedidoSeleccionado.observaciones}
                  onChange={(e) =>
                    handleUpdateObservaciones(pedidoSeleccionado.id, e.target.value)
                  }
                  placeholder="Ej. Prenda empacada en caja con lazo de lujo y tarjeta..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521] disabled:opacity-60 resize-none"
                />
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* =========================================================================
          MODAL DE CONTINGENCIA: REPORTE DE FALTA DE PRENDA Y REASIGNACIÓN
      ========================================================================= */}
      {pedidoContingencia && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#661521] shadow-2xl w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-[#661521] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1C1311]">
                    Reportar falta de prenda en tienda
                  </h3>
                  <span className="text-xs text-stone-500 font-mono">
                    Pedido #{pedidoContingencia.codigo}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPedidoContingencia(null)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Si la prenda solicitada no está disponible físicamente en esta tienda o presenta algún daño,
              puedes reasignar el pedido para que otra sede o la bodega central realice el despacho.
            </p>

            {/* Motivo de la Novedad */}
            <div>
              <label className="block text-xs font-bold text-[#1C1311] mb-1">
                Motivo de la novedad:
              </label>
              <input
                type="text"
                value={motivoContingencia}
                onChange={(e) => setMotivoContingencia(e.target.value)}
                placeholder="Ej. Prenda con daño en mostrador, faltante en bodega física..."
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-medium text-[#1C1311]"
              />
            </div>

            {/* Selector de Destino */}
            <div>
              <label className="block text-xs font-bold text-[#1C1311] mb-1.5">
                Selecciona la acción a tomar:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDestinoReasignacion('OTRA_TIENDA')}
                  className={`p-3 rounded-xl text-left border-2 transition-all cursor-pointer ${
                    destinoReasignacion === 'OTRA_TIENDA'
                      ? 'bg-[#1C1311] text-[#D19650] border-[#1C1311]'
                      : 'bg-white text-stone-700 border-[#D8CFC6]'
                  }`}
                >
                  <span className="block font-bold text-xs">1. Reasignar a otra Tienda</span>
                  <span className="block text-[11px] opacity-80 mt-0.5">
                    Ej. Punto Caobos (Con stock verificado)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDestinoReasignacion('BODEGA_CENTRAL')}
                  className={`p-3 rounded-xl text-left border-2 transition-all cursor-pointer ${
                    destinoReasignacion === 'BODEGA_CENTRAL'
                      ? 'bg-[#1C1311] text-[#D19650] border-[#1C1311]'
                      : 'bg-white text-stone-700 border-[#D8CFC6]'
                  }`}
                >
                  <span className="block font-bold text-xs">2. Enviar a Bodega Central</span>
                  <span className="block text-[11px] opacity-80 mt-0.5">
                    Para despacho directo desde la central
                  </span>
                </button>
              </div>
            </div>

            {/* Botones de Confirmación */}
            <div className="flex gap-2.5 pt-2 border-t border-[#EFEAE4]">
              <button
                type="button"
                onClick={handleConfirmarContingencia}
                className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs transition-all cursor-pointer"
              >
                Confirmar y Reasignar Pedido
              </button>

              <button
                type="button"
                onClick={() => setPedidoContingencia(null)}
                className="min-h-[46px] px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPedidosWebPage;
