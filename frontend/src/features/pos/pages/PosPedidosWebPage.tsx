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
  Banknote,
} from 'lucide-react';
import { DetailDrawer, type ActivityTimelineItem } from '../components/DetailDrawer';
import {
  getWebOrdersBySede,
  tomarPedidoWebEnSede,
  transicionarPedidoWeb,
  updateWebOrder,
  nuevoEvento,
  WEB_ORDERS_EVENT,
  type PedidoWebRecord,
  type EstadoPedidoWeb,
} from '../utils/webOrdersStore';

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

export const PosPedidosWebPage: React.FC = () => {
  const sedeActiva = localStorage.getItem('forma_pos_sede') || 'Punto Centro (Cúcuta)';
  const rawUser = localStorage.getItem('usuario');
  const usuarioNombre = useMemo(() => {
    if (!rawUser) return 'Cajero POS';
    try {
      const u = JSON.parse(rawUser);
      return u.nombreCompleto || u.nombre || 'Cajero POS';
    } catch {
      return 'Cajero POS';
    }
  }, [rawUser]);

  const [pedidos, setPedidos] = useState<PedidoWebRecord[]>(() => getWebOrdersBySede(sedeActiva));
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Sincronización en tiempo real con webOrdersStore y localStorage
  useEffect(() => {
    const sincronizar = () => {
      setPedidos(getWebOrdersBySede(sedeActiva));
    };
    sincronizar();
    window.addEventListener(WEB_ORDERS_EVENT, sincronizar);
    window.addEventListener('storage', sincronizar);
    return () => {
      window.removeEventListener(WEB_ORDERS_EVENT, sincronizar);
      window.removeEventListener('storage', sincronizar);
    };
  }, [sedeActiva]);

  // Selección de pedido para el DetailDrawer
  const [pedidoSeleccionadoCodigo, setPedidoSeleccionadoCodigo] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<string>('detalle');
  const [alertaBloqueo, setAlertaBloqueo] = useState<string | null>(null);

  // Modal de contingencia (falta de prenda o daño en tienda)
  const [pedidoContingencia, setPedidoContingencia] = useState<PedidoWebRecord | null>(null);
  const [motivoContingencia, setMotivoContingencia] = useState<string>('');
  const [destinoReasignacion, setDestinoReasignacion] = useState<'OTRA_TIENDA' | 'BODEGA_CENTRAL'>(
    'OTRA_TIENDA'
  );

  // Filtrado reactivo de pedidos
  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (filtroEstado !== 'TODOS') {
        if (filtroEstado === 'CONFIRMADO') {
          if (p.estado !== 'CONFIRMADO' && p.estado !== 'RECIBIDO') return false;
        } else if (p.estado !== filtroEstado) {
          return false;
        }
      }
      if (!q) return true;
      const matchCodigo = p.codigo.toLowerCase().includes(q);
      const matchCliente = p.cliente.toLowerCase().includes(q);
      const matchCiudad = p.ciudadDestino.toLowerCase().includes(q);
      const matchPrenda = p.productos.some(
        (pr) =>
          pr.nombre.toLowerCase().includes(q) ||
          pr.sku.toLowerCase().includes(q) ||
          pr.talla.toLowerCase().includes(q)
      );
      return matchCodigo || matchCliente || matchCiudad || matchPrenda;
    });
  }, [pedidos, busqueda, filtroEstado]);

  const pedidoSeleccionado = useMemo(() => {
    if (!pedidoSeleccionadoCodigo) return null;
    return pedidos.find((p) => p.codigo === pedidoSeleccionadoCodigo) || null;
  }, [pedidos, pedidoSeleccionadoCodigo]);

  // Acciones de avance de estado persistidas en webOrdersStore
  const handleAvanzarEstado = (codigo: string) => {
    const p = pedidos.find((x) => x.codigo === codigo);
    if (!p) return;

    if (p.estado === 'RECIBIDO' || p.estado === 'CONFIRMADO') {
      setAlertaBloqueo(null);
      const res = tomarPedidoWebEnSede(codigo, sedeActiva, usuarioNombre);
      if (!res.ok) {
        setAlertaBloqueo(
          res.error || 'Este pedido ya fue tomado para alistamiento por otra sede.'
        );
        return;
      }
    } else if (p.estado === 'EN_PREPARACION') {
      const guiaGenerada =
        p.guiaTransportadora ||
        `TCC-${p.codigoDaneDestino || '54001'}-00${Math.floor(100 + Math.random() * 900)}`;
      transicionarPedidoWeb(
        codigo,
        'LISTO_DESPACHO',
        usuarioNombre,
        { guiaTransportadora: guiaGenerada, transportadora: p.transportadora || 'Coordinadora / TCC Prioritario' },
        `Empacado y listo para despacho. Guía: ${guiaGenerada}`
      );
    } else if (p.estado === 'LISTO_DESPACHO') {
      transicionarPedidoWeb(
        codigo,
        'DESPACHADO',
        usuarioNombre,
        {},
        'Entregado físicamente al conductor de la transportadora para reparto.'
      );
    }
  };

  const handleUpdateObservaciones = (codigo: string, texto: string) => {
    updateWebOrder(codigo, { observaciones: texto });
  };

  const handleUpdateGuia = (codigo: string, guia: string) => {
    updateWebOrder(codigo, { guiaTransportadora: guia });
  };

  // Confirmación de contingencia sin jerga técnica
  const handleConfirmarContingencia = () => {
    if (!pedidoContingencia) return;
    const destinoTexto =
      destinoReasignacion === 'OTRA_TIENDA'
        ? 'Reasignado a otra Tienda (Con inventario físico verificado)'
        : 'Transferido a Bodega Central para despacho directo';
    const notaCompleta = `${destinoTexto}. Motivo: "${motivoContingencia.trim() || 'Faltante en inventario físico de tienda'}".`;

    updateWebOrder(
      pedidoContingencia.codigo,
      { observaciones: notaCompleta },
      nuevoEvento('Novedad de Alistamiento Reportada', usuarioNombre, notaCompleta, pedidoContingencia.estado)
    );
    setPedidoContingencia(null);
    setMotivoContingencia('');
  };

  const pendientesContador = pedidos.filter(
    (p) => p.estado === 'RECIBIDO' || p.estado === 'CONFIRMADO' || p.estado === 'EN_PREPARACION'
  ).length;

  const getBadgeInfo = (estado: EstadoPedidoWeb) => {
    switch (estado) {
      case 'RECIBIDO':
      case 'CONFIRMADO':
        return { label: 'Por Alistar (Confirmado)', variant: 'warning' as const };
      case 'EN_PREPARACION':
        return { label: '2. En Preparación', variant: 'info' as const };
      case 'LISTO_DESPACHO':
        return { label: '3. Listo para Despacho', variant: 'success' as const };
      case 'DESPACHADO':
        return { label: '4. Despachado', variant: 'neutral' as const };
      case 'ENTREGADO':
        return { label: '5. Entregado al Cliente', variant: 'success' as const };
      case 'NO_ENTREGADO':
        return { label: 'Retorno Logístico (No Entregado)', variant: 'danger' as const };
      case 'CANCELADO':
        return { label: 'Cancelado', variant: 'danger' as const };
    }
  };

  // Cronología real del pedido para la pestaña Actividad del Drawer
  const actividadPedido: ActivityTimelineItem[] = useMemo(() => {
    if (!pedidoSeleccionado || !pedidoSeleccionado.historial) return [];
    return pedidoSeleccionado.historial.map((ev) => {
      let variant: 'success' | 'info' | 'warning' | 'neutral' = 'info';
      if (ev.estado === 'DESPACHADO' || ev.estado === 'ENTREGADO') variant = 'success';
      else if (ev.estado === 'EN_PREPARACION' || ev.estado === 'LISTO_DESPACHO') variant = 'warning';

      const fmtBogota = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(ev.fechaIso));

      return {
        id: ev.id,
        timestamp: fmtBogota,
        title: ev.titulo,
        description: ev.descripcion,
        user: ev.usuario,
        type: variant,
      };
    });
  }, [pedidoSeleccionado]);

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-2xs p-3 sm:p-5 select-none font-sans space-y-4">
      <div>
        {/* =========================================================================
            CABECERA EDITORIAL Y KPIS DE DESPACHO WEB
        ========================================================================= */}
        <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-4">
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
                Sede Activa: {sedeActiva}
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

        {/* Alerta de Bloqueo de Bandeja Compartida */}
        {alertaBloqueo && (
          <div className="bg-red-50 border-2 border-[#661521] text-[#661521] rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3 shadow-xs text-xs font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{alertaBloqueo}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertaBloqueo(null)}
              className="px-2.5 py-1 rounded-lg bg-[#661521] text-white text-xs font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

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
            <div className="bg-white rounded-2xl border border-[#D8CFC6] p-12 text-center text-stone-500 space-y-3">
              <Package className="w-12 h-12 mx-auto text-stone-300" />
              <p className="font-bold text-sm text-[#1C1311]">
                No hay pedidos web asignados a esta sede
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Los pedidos web realizados en la tienda oficial con destino a esta ciudad aparecerán automáticamente aquí para su alistamiento y empaque.
              </p>
            </div>
          ) : (
            pedidosFiltrados.map((pedido) => {
              const badge = getBadgeInfo(pedido.estado);
              const isSelected = pedidoSeleccionado?.codigo === pedido.codigo;

              const fechaBogotaStr = new Intl.DateTimeFormat('es-CO', {
                timeZone: 'America/Bogota',
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date(pedido.fechaCreacionIso));

              return (
                <div
                  key={pedido.codigo}
                  onClick={() => {
                    setPedidoSeleccionadoCodigo(pedido.codigo);
                    setDrawerTab('detalle');
                  }}
                  className={`
                    w-full p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col gap-3 shadow-2xs
                    ${
                      isSelected
                        ? 'border-[#661521] ring-2 ring-[#661521]/15 bg-white'
                        : 'border-[#E2D9CE] hover:border-[#661521]/50 hover:bg-[#FAF7F4]'
                    }
                  `}
                >
                  {/* Nivel Superior: Información Principal y Precio */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Izquierda: Ícono + Código, Fecha, Badges, Cliente y Destino */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#F4EFEA] border border-[#50322A]/15 text-[#661521] flex items-center justify-center shrink-0 font-bold">
                        <Package className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-black text-[#1C1311] whitespace-nowrap shrink-0">
                            #{pedido.codigo}
                          </span>
                          <span className="whitespace-nowrap text-xs text-stone-500 font-medium">
                            {fechaBogotaStr}
                          </span>
                          {/* Badge de Bandeja Compartida o Bloqueo por Sede */}
                          {pedido.estado === 'RECIBIDO' || pedido.estado === 'CONFIRMADO' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300 whitespace-nowrap">
                              Bandeja Compartida · Disponible para Tomar
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-200 whitespace-nowrap">
                              Bloqueado por {pedido.sedeAsignada}
                            </span>
                          )}
                          {/* Badge de Medio de Pago y Recaudo */}
                          {pedido.metodoPago === 'CONTRAENTREGA' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap">
                              Contraentrega · Cobra Transportadora
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-900 border border-sky-300 whitespace-nowrap">
                              {pedido.estadoCobro === 'PAGADO' ? 'Transferencia · Pagado' : 'Transferencia · Por Verificar'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-800 font-bold">
                          <span className="whitespace-nowrap">{pedido.cliente}</span>
                          <span className="text-stone-400">•</span>
                          <span className="text-stone-600 font-medium">
                            {pedido.ciudadDestino}
                          </span>
                          {pedido.direccionEntrega && (
                            <>
                              <span className="text-stone-400">•</span>
                              <span className="text-stone-500 font-normal truncate max-w-xs">
                                {pedido.direccionEntrega}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Derecha: Total y Badge de Estado */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-left sm:text-right">
                        <span className="block font-mono text-xs sm:text-sm font-black text-[#059669] whitespace-nowrap">
                          Total: {formatCOP(pedido.totalCOP)} COP
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">
                          {pedido.productos.length} {pedido.productos.length === 1 ? 'prenda' : 'prendas'}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border whitespace-nowrap ${
                          pedido.estado === 'RECIBIDO' || pedido.estado === 'CONFIRMADO'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : pedido.estado === 'EN_PREPARACION'
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                            : pedido.estado === 'LISTO_DESPACHO'
                            ? 'bg-emerald-50 text-[#059669] border-emerald-300'
                            : pedido.estado === 'DESPACHADO' || pedido.estado === 'EN_ENTREGA' || pedido.estado === 'ENTREGADO'
                            ? 'bg-stone-100 text-stone-700 border-stone-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {badge?.label ?? pedido.estado}
                      </span>
                    </div>
                  </div>

                  {/* Nivel Inferior: Barra de Acciones Operativas */}
                  <div className="border-t border-[#EFEAE4] pt-2.5 flex flex-wrap items-center justify-end gap-2">
                    {!pedidoSeleccionado && (
                      <>
                        {(pedido.estado === 'RECIBIDO' || pedido.estado === 'CONFIRMADO') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAvanzarEstado(pedido.codigo);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5 text-[#D19650]" />
                            <span>Iniciar Alistamiento / En Preparación</span>
                          </button>
                        )}

                        {pedido.estado === 'EN_PREPARACION' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAvanzarEstado(pedido.codigo);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Marcar como Listo para Despacho</span>
                          </button>
                        )}

                        {pedido.estado === 'LISTO_DESPACHO' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAvanzarEstado(pedido.codigo);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Registrar Despacho a Transportadora</span>
                          </button>
                        )}

                        {(pedido.estado === 'RECIBIDO' ||
                          pedido.estado === 'CONFIRMADO' ||
                          pedido.estado === 'EN_PREPARACION') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPedidoContingencia(pedido);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F4] hover:bg-red-50 text-[#661521] border border-[#661521]/30 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>¿No tienes la prenda? Reportar y reasignar</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPedidoSeleccionadoCodigo(pedido.codigo);
                        setDrawerTab('detalle');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#50322A]/20 text-xs font-bold text-[#351912] bg-[#F4EFEA] hover:bg-[#E7DED2] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
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
          onClose={() => setPedidoSeleccionadoCodigo(null)}
          title="Alistamiento de Despacho"
          subtitle={`${pedidoSeleccionado.cliente} · ${pedidoSeleccionado.ciudadDestino}`}
          badge={getBadgeInfo(pedidoSeleccionado.estado)}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          activityItems={actividadPedido}
          footerActions={
            <div className="flex flex-col sm:flex-row gap-2">
              {(pedidoSeleccionado.estado === 'RECIBIDO' ||
                pedidoSeleccionado.estado === 'CONFIRMADO') && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstado(pedidoSeleccionado.codigo)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4 text-[#D19650]" />
                  <span>Iniciar Alistamiento / En Preparación</span>
                </button>
              )}

              {pedidoSeleccionado.estado === 'EN_PREPARACION' && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstado(pedidoSeleccionado.codigo)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Marcar como Listo para Despacho</span>
                </button>
              )}

              {pedidoSeleccionado.estado === 'LISTO_DESPACHO' && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstado(pedidoSeleccionado.codigo)}
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

              {(pedidoSeleccionado.estado === 'RECIBIDO' ||
                pedidoSeleccionado.estado === 'CONFIRMADO' ||
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
            {/* Estado de Bandeja Compartida o Bloqueo por Sede */}
            {pedidoSeleccionado.estado === 'RECIBIDO' ||
            pedidoSeleccionado.estado === 'CONFIRMADO' ? (
              <div className="p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 font-bold flex items-center justify-between gap-2">
                <span>Bandeja Compartida · Disponible para Tomar</span>
                <span className="text-[11px] font-medium">
                  Se bloqueará al iniciar alistamiento
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold flex items-center justify-between gap-2">
                <span>Bloqueado por {pedidoSeleccionado.sedeAsignada}</span>
                <span className="text-[11px] font-medium">Asignación exclusiva</span>
              </div>
            )}

            {/* Aviso informativo de recaudación y cobro */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {pedidoSeleccionado.metodoPago === 'CONTRAENTREGA'
                    ? 'Recaudo por Transportadora'
                    : 'Transferencia Bancaria Directa'}
                </span>
              </div>
              {pedidoSeleccionado.metodoPago === 'CONTRAENTREGA' ? (
                <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                  Este pedido es <strong>Pago Contraentrega</strong>. El conductor de la transportadora ({pedidoSeleccionado.transportadora || 'TCC'}) cobra el efectivo al cliente en su domicilio. <strong>Este dinero no entra a la gaveta de caja del POS</strong>; la transportadora consigna a la cuenta bancaria de FORMA y Administración concilia el recaudo.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-sky-950 font-medium">
                  {pedidoSeleccionado.referenciaPago
                    ? `Transferencia con soporte CUS: ${pedidoSeleccionado.referenciaPago}.`
                    : 'Transferencia bancaria reportada por el cliente.'}{' '}
                  El ingreso se valida desde contabilidad central.
                </p>
              )}
            </div>

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
                  {pedidoSeleccionado.telefono && (
                    <p className="text-stone-600 font-medium mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{pedidoSeleccionado.telefono}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#661521] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold uppercase text-stone-400">
                    Dirección de Entrega (DANE {pedidoSeleccionado.codigoDaneDestino})
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
                  Prendas a empacar ({pedidoSeleccionado.productos.length})
                </h4>
                <span className="font-mono font-bold text-xs text-[#059669]">
                  Total: {formatCOP(pedidoSeleccionado.totalCOP)} COP
                </span>
              </div>

              <div className="space-y-2">
                {pedidoSeleccionado.productos.map((prenda, idx) => (
                  <div
                    key={`${prenda.sku}-${idx}`}
                    className="p-3 bg-[#FAF7F4] rounded-2xl border border-[#D8CFC6] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prenda.imagenUrl || '/products/blazer-imperial-vinotinto.png'}
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
                      {formatCOP(prenda.precioUnitarioCOP * prenda.cantidad)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guía Transportadora & Observaciones */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                  Número de Guía Transportadora ({pedidoSeleccionado.transportadora || 'Coordinadora / TCC'}):
                </label>
                <input
                  type="text"
                  disabled={pedidoSeleccionado.estado === 'DESPACHADO' || pedidoSeleccionado.estado === 'ENTREGADO'}
                  value={pedidoSeleccionado.guiaTransportadora || ''}
                  onChange={(e) =>
                    handleUpdateGuia(pedidoSeleccionado.codigo, e.target.value)
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
                  disabled={pedidoSeleccionado.estado === 'DESPACHADO' || pedidoSeleccionado.estado === 'ENTREGADO'}
                  value={pedidoSeleccionado.observaciones || ''}
                  onChange={(e) =>
                    handleUpdateObservaciones(pedidoSeleccionado.codigo, e.target.value)
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
