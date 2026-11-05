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
} from 'lucide-react';

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
        sku: 'CAL-BOT-006-39',
        nombre: 'Botines Chelsea Cuero Vélez',
        talla: '39',
        color: 'Tabaco Envejecido',
        cantidad: 1,
        precioCop: 265000,
        imagenUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      },
    ],
    totalCop: 265000,
    estado: 'DESPACHADO',
    guiaTransportadora: 'INTER-54001-55829',
    empresaTransporte: 'Interrapidísimo',
    observaciones: 'Entregado al mensajero de Interrapidísimo.',
  },
];

export const PosPedidosWebPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoWebItem[]>(PEDIDOS_WEB_INICIALES);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Modal de contingencia cuando no se tiene la prenda
  const [pedidoContingencia, setPedidoContingencia] = useState<PedidoWebItem | null>(null);
  const [motivoContingencia, setMotivoContingencia] = useState<string>(
    'Prenda con imperfecto detectado en mostrador'
  );
  const [destinoReasignacion, setDestinoReasignacion] = useState<'OTRA_TIENDA' | 'BODEGA_CENTRAL'>(
    'OTRA_TIENDA'
  );

  // Sincronizar pedidos creados en el Storefront guardados en localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('forma_ultimo_pedido');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.codigo) return;
      const codigoLimpie = parsed.codigo.replace('#', '');

      setPedidos((prev) => {
        if (prev.some((p) => p.codigo === codigoLimpie)) return prev;
        const prod0 = parsed.productos?.[0];
        const nuevo: PedidoWebItem = {
          id: `ped-local-${Date.now()}`,
          codigo: codigoLimpie,
          fecha: 'Hoy · Recién recibido',
          cliente: parsed.cliente || 'Cliente Tienda Online',
          telefonoCliente: parsed.telefono || '300 000 0000',
          ciudadDestino: parsed.ciudadDestino || 'Cúcuta, Norte de Santander',
          codigoDane: parsed.codigoDaneDestino || '54001',
          direccionEntrega: parsed.direccion || 'Dirección registrada en tienda web',
          prendas: [
            {
              sku: prod0?.sku || 'ROP-CAM-002-M',
              nombre: prod0?.nombre || 'Prenda Tienda Web',
              talla: prod0?.talla || 'M',
              color: prod0?.color || 'Estándar',
              cantidad: prod0?.cantidad || 1,
              precioCop: prod0?.precioCOP || 59900,
              imagenUrl:
                prod0?.imagenUrl ||
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
            },
          ],
          totalCop: parsed.totalCOP || 59900,
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
            guiaTransportadora: p.guiaTransportadora || `TCC-${p.codigoDane}-00${Math.floor(100 + Math.random() * 900)}`,
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

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-3 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA EDITORIAL Y KPIS DE DESPACHO WEB EN TIENDA FÍSICA
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE4]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              <Truck className="w-6 h-6 text-[#D19650]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-xs font-black tracking-wider uppercase">
                  Despacho Omnicanal
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                  {pendientesContador} Pedidos Pendientes de Despacho
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-1">
                Alistamiento y Despacho de Pedidos Web
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[#FAF7F4] px-3.5 py-2.5 rounded-xl border border-[#E5DDD3]">
            <MapPin className="w-4 h-4 text-[#661521]" />
            <span className="font-bold text-[#1C1311]">Punto Físico Asignado: Centro (Cúcuta)</span>
          </div>
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
          <span className="text-xs font-bold text-stone-500 mr-1">Filtrar por estado:</span>
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
              className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                filtroEstado === tab.id
                  ? 'bg-[#661521] text-white border-[#661521] shadow-sm'
                  : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* =========================================================================
          BARRA DE BÚSQUEDA
      ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código de pedido (ej. PED-2026-849201), cliente, prenda o ciudad..."
            className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-sm font-semibold text-[#1C1311] placeholder:text-stone-400 focus:outline-none focus:border-[#661521]"
          />
        </div>
      </div>

      {/* =========================================================================
          LISTADO DE PEDIDOS WEB ASIGNADOS
      ========================================================================= */}
      <div className="space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-[#E2D9CE] p-10 text-center text-stone-500 space-y-2">
            <Package className="w-12 h-12 mx-auto text-stone-300" />
            <p className="font-bold text-sm">No hay pedidos web en este estado.</p>
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => {
            return (
              <article
                key={pedido.id}
                className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4 transition-all"
              >
                {/* Cabecera del Pedido */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-[#1C1311] text-[#D19650] font-mono text-sm font-black">
                      #{pedido.codigo}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">{pedido.fecha}</span>

                    {/* Badge de Estado Claro */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        pedido.estado === 'CONFIRMADO'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : pedido.estado === 'EN_PREPARACION'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          : pedido.estado === 'LISTO_DESPACHO'
                          ? 'bg-emerald-100 text-[#059669] border border-emerald-300'
                          : pedido.estado === 'DESPACHADO'
                          ? 'bg-stone-200 text-stone-800 border border-stone-400'
                          : 'bg-red-100 text-[#661521] border border-red-300'
                      }`}
                    >
                      {pedido.estado === 'CONFIRMADO' && '1. Confirmado (Por Alistar)'}
                      {pedido.estado === 'EN_PREPARACION' && '2. En Preparación'}
                      {pedido.estado === 'LISTO_DESPACHO' && '3. Listo para Despacho'}
                      {pedido.estado === 'DESPACHADO' && '4. Despachado'}
                      {pedido.estado === 'REASIGNADO' && 'Reasignado a otra Tienda'}
                      {pedido.estado === 'EN_BODEGA_CENTRAL' && 'Enviado a Bodega Central'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-black text-[#059669]">
                      Total: {formatCOP(pedido.totalCop)} COP
                    </span>
                  </div>
                </div>

                {/* Datos del Cliente y Envío */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#FAF7F4] p-3.5 rounded-xl border border-[#E5DDD3] text-xs">
                  <div>
                    <span className="font-extrabold text-[#1C1311] uppercase block text-[11px] text-stone-500">
                      Destinatario
                    </span>
                    <p className="font-black text-sm text-[#1C1311] mt-0.5">{pedido.cliente}</p>
                    {pedido.telefonoCliente && (
                      <span className="text-stone-600 block">Tel: {pedido.telefonoCliente}</span>
                    )}
                  </div>

                  <div>
                    <span className="font-extrabold text-[#1C1311] uppercase block text-[11px] text-stone-500">
                      Destino de Entrega (DANE {pedido.codigoDane})
                    </span>
                    <p className="font-bold text-stone-800 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#661521] shrink-0" />
                      <span>{pedido.ciudadDestino}</span>
                    </p>
                    {pedido.direccionEntrega && (
                      <span className="text-stone-600 block">{pedido.direccionEntrega}</span>
                    )}
                  </div>
                </div>

                {/* Lista de Prendas en el Pedido */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-stone-600 mb-2">
                    Prendas a empacar ({pedido.prendas.length})
                  </h3>

                  <div className="space-y-2">
                    {pedido.prendas.map((prenda, idx) => (
                      <div
                        key={`${prenda.sku}-${idx}`}
                        className="p-3 bg-[#FAF7F4] rounded-xl border border-[#E5DDD3] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prenda.imagenUrl}
                            alt={prenda.nombre}
                            className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-[#1C1311] truncate">
                              {prenda.nombre}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs font-mono text-stone-600">
                              <span className="px-1.5 py-0.5 rounded bg-stone-200 font-bold text-[#1C1311]">
                                SKU: {prenda.sku}
                              </span>
                              <span>Talla: {prenda.talla}</span>
                              <span>Color: {prenda.color}</span>
                              <span className="font-black text-[#661521]">
                                Cantidad: {prenda.cantidad} und
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="font-mono text-sm font-black text-[#1C1311] shrink-0">
                          {formatCOP(prenda.precioCop)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Novedad de Reasignación si existe */}
                {pedido.novedadReasignacion && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{pedido.novedadReasignacion}</span>
                  </div>
                )}

                {/* Guía Transportadora & Campo de Observaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Número de Guía */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                      Número de Guía Transportadora ({pedido.empresaTransporte}):
                    </label>
                    <input
                      type="text"
                      disabled={pedido.estado === 'DESPACHADO'}
                      value={pedido.guiaTransportadora}
                      onChange={(e) => handleUpdateGuia(pedido.id, e.target.value)}
                      placeholder="Ej. TCC-54001-99412..."
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] font-mono text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521] disabled:opacity-60"
                    />
                  </div>

                  {/* Campo de Observaciones del Cajero */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                      Observaciones de Empaque y Alistamiento:
                    </label>
                    <input
                      type="text"
                      disabled={pedido.estado === 'DESPACHADO'}
                      value={pedido.observaciones}
                      onChange={(e) => handleUpdateObservaciones(pedido.id, e.target.value)}
                      placeholder="Ej. Prenda empacada en caja con lazo de lujo y tarjeta..."
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521] disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Acciones del Pedido: Botones de Avance y Contingencia */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-[#EFEAE4]">
                  {pedido.estado === 'CONFIRMADO' && (
                    <button
                      type="button"
                      onClick={() => handleAvanzarEstado(pedido.id)}
                      className="flex-1 min-h-[52px] px-5 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Package className="w-4 h-4 text-[#D19650]" />
                      <span>Iniciar Alistamiento / En Preparación</span>
                    </button>
                  )}

                  {pedido.estado === 'EN_PREPARACION' && (
                    <button
                      type="button"
                      onClick={() => handleAvanzarEstado(pedido.id)}
                      className="flex-1 min-h-[52px] px-5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Marcar como Listo para Despacho</span>
                    </button>
                  )}

                  {pedido.estado === 'LISTO_DESPACHO' && (
                    <button
                      type="button"
                      onClick={() => handleAvanzarEstado(pedido.id)}
                      className="flex-1 min-h-[52px] px-5 rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Registrar Despacho a Transportadora</span>
                    </button>
                  )}

                  {pedido.estado === 'DESPACHADO' && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Pedido entregado a la transportadora con guía {pedido.guiaTransportadora}</span>
                    </div>
                  )}

                  {/* Botón de Contingencia si la tienda física no tiene la prenda */}
                  {(pedido.estado === 'CONFIRMADO' || pedido.estado === 'EN_PREPARACION') && (
                    <button
                      type="button"
                      onClick={() => setPedidoContingencia(pedido)}
                      className="min-h-[52px] px-4 rounded-xl bg-[#FAF7F4] hover:bg-red-50 text-[#661521] border-2 border-[#661521]/30 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>¿No tienes la prenda? Reportar y reasignar</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* =========================================================================
          MODAL DE CONTINGENCIA: REPORTE DE FALTA DE PRENDA Y REASIGNACIÓN
      ========================================================================= */}
      {pedidoContingencia && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
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
                className="w-full min-h-[46px] px-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311]"
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
                  className={`p-3 rounded-xl text-left border-2 transition-all ${
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
                  className={`p-3 rounded-xl text-left border-2 transition-all ${
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
                className="flex-1 min-h-[48px] px-4 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs transition-all"
              >
                Confirmar y Reasignar Pedido
              </button>

              <button
                type="button"
                onClick={() => setPedidoContingencia(null)}
                className="min-h-[48px] px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
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
