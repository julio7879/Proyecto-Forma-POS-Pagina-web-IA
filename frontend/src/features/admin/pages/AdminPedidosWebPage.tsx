// frontend/src/features/admin/pages/AdminPedidosWebPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  PageHeader,
  KPIStatCard,
  FilterBar,
  DataTable,
  DetailDrawer,
  StatusBadge,
  ConfirmDialog,
  EmptyState,
  formatCOP,
  type ColumnDef,
  type ActivityTimelineItem,
  type StatusBadgeVariant,
} from '../components';
import {
  getWebOrders,
  registrarPagoWeb,
  eliminarPedidoWeb,
  transicionarPedidoWeb,
  obtenerStockSede,
  obtenerSedesConStockParaPedido,
  mismaSede,
  WEB_ORDERS_EVENT,
  PedidoWebRecord,
  EstadoPedidoWeb,
  EstadoCobroWeb,
} from '../../pos/utils/webOrdersStore';

const SEDES_ADMIN = [
  'Todas las Sedes (Nacional)',
  'Punto Centro (Cúcuta)',
  'Punto Caobos (Cúcuta)',
  'Punto Ocaña',
  'Punto Bucaramanga',
  'Bodega Central',
];

const ESTADO_ENTREGA_BADGE: Record<
  EstadoPedidoWeb,
  { label: string; variant: StatusBadgeVariant }
> = {
  RECIBIDO: { label: 'Recibido', variant: 'neutral' },
  CONFIRMADO: { label: 'Confirmado', variant: 'champagne' },
  EN_PREPARACION: { label: 'En Preparación', variant: 'warning' },
  LISTO_DESPACHO: { label: 'Listo Despacho', variant: 'info' },
  DESPACHADO: { label: 'Despachado', variant: 'vino' },
  EN_ENTREGA: { label: 'En Entrega', variant: 'info' },
  ENTREGADO: { label: 'Entregado', variant: 'success' },
  NO_ENTREGADO: { label: 'No Entregado', variant: 'error' },
  CANCELADO: { label: 'Cancelado', variant: 'error' },
};

const ESTADO_COBRO_BADGE: Record<
  EstadoCobroWeb,
  { label: string; variant: StatusBadgeVariant }
> = {
  PENDIENTE_VERIFICACION: { label: 'Transferencia Por Verificar', variant: 'warning' },
  PENDIENTE_RECAUDO: { label: 'Contraentrega Pendiente Transportadora', variant: 'champagne' },
  PAGADO: { label: 'Pagado y Conciliado', variant: 'success' },
  ANULADO: { label: 'Anulado / Sin Cobro', variant: 'neutral' },
};

export const AdminPedidosWebPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoWebRecord[]>(() => getWebOrders());
  const [sedeFiltro, setSedeFiltro] = useState<string>('Todas las Sedes (Nacional)');
  const [filtroCobro, setFiltroCobro] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal para confirmar pago recibido
  const [pedidoAConfirmar, setPedidoAConfirmar] = useState<PedidoWebRecord | null>(null);
  const [pedidoAEliminar, setPedidoAEliminar] = useState<PedidoWebRecord | null>(null);
  const [referenciaBancaria, setReferenciaBancaria] = useState<string>('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // DetailDrawer
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoWebRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'productos' | 'actividad' | 'comprobantes'>('detalle');

  const syncPedidos = () => {
    const lista = getWebOrders();
    setPedidos(lista);
    setPedidoSeleccionado((prev) => {
      if (!prev) return null;
      return lista.find((x) => x.codigo === prev.codigo) || null;
    });
  };

  useEffect(() => {
    syncPedidos();
    window.addEventListener(WEB_ORDERS_EVENT, syncPedidos);
    window.addEventListener('storage', syncPedidos);
    return () => {
      window.removeEventListener(WEB_ORDERS_EVENT, syncPedidos);
      window.removeEventListener('storage', syncPedidos);
    };
  }, []);

  const adminNombre = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}');
      return u.nombreCompleto || u.nombre || 'Administrador FORMA';
    } catch {
      return 'Administrador FORMA';
    }
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (sedeFiltro !== 'Todas las Sedes (Nacional)' && !mismaSede(p.sedeAsignada, sedeFiltro)) {
        return false;
      }
      if (filtroCobro !== 'TODOS' && p.estadoCobro !== filtroCobro) {
        return false;
      }
      if (!q) return true;
      const matchCodigo = p.codigo.toLowerCase().includes(q);
      const matchCliente = p.cliente.toLowerCase().includes(q);
      const matchCiudad = p.ciudadDestino.toLowerCase().includes(q);
      const matchGuia = (p.guiaTransportadora || '').toLowerCase().includes(q);
      return matchCodigo || matchCliente || matchCiudad || matchGuia;
    });
  }, [pedidos, sedeFiltro, filtroCobro, busqueda]);

  const kpiPendienteRecaudoCop = useMemo(
    () =>
      pedidos
        .filter((p) => p.estadoCobro === 'PENDIENTE_RECAUDO')
        .reduce((acc, p) => acc + p.totalCOP, 0),
    [pedidos]
  );

  const kpiPendienteVerificacionCop = useMemo(
    () =>
      pedidos
        .filter((p) => p.estadoCobro === 'PENDIENTE_VERIFICACION')
        .reduce((acc, p) => acc + p.totalCOP, 0),
    [pedidos]
  );

  const kpiPagadoCop = useMemo(
    () =>
      pedidos
        .filter((p) => p.estadoCobro === 'PAGADO')
        .reduce((acc, p) => acc + p.totalCOP, 0),
    [pedidos]
  );

  const kpiTotalGeneralCop = useMemo(
    () => pedidos.reduce((acc, p) => acc + p.totalCOP, 0),
    [pedidos]
  );

  const handleConfirmarPago = () => {
    if (!pedidoAConfirmar) return;
    const ref = referenciaBancaria.trim() || `MANUAL-${Date.now().toString().slice(-6)}`;
    const ok = registrarPagoWeb(pedidoAConfirmar.codigo, adminNombre, ref);
    if (ok) {
      setMensajeExito(
        `Pago conciliado correctamente para el pedido #${pedidoAConfirmar.codigo} (Ref: ${ref})`
      );
      setTimeout(() => setMensajeExito(null), 5000);
      setPedidoAConfirmar(null);
      setReferenciaBancaria('');
    }
  };

  const handleConfirmarEliminarPedido = () => {
    if (!pedidoAEliminar) return;
    const codigo = pedidoAEliminar.codigo;
    eliminarPedidoWeb(codigo);
    if (pedidoSeleccionado?.codigo === codigo) {
      setPedidoSeleccionado(null);
    }
    setPedidoAEliminar(null);
    setMensajeExito(`Pedido #${codigo} eliminado del sistema.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleAvanzarEstadoAdmin = (nuevoEstado: EstadoPedidoWeb) => {
    if (!pedidoSeleccionado) return;
    const guia =
      pedidoSeleccionado.guiaTransportadora ||
      `TCC-${pedidoSeleccionado.codigoDaneDestino || '54001'}-00${Math.floor(100 + Math.random() * 900)}`;

    const res = transicionarPedidoWeb(
      pedidoSeleccionado.codigo,
      nuevoEstado,
      adminNombre,
      {
        sedeAsignada: 'Bodega Central',
        ...(nuevoEstado === 'LISTO_DESPACHO'
          ? {
              guiaTransportadora: guia,
              transportadora: pedidoSeleccionado.transportadora || 'Coordinadora / TCC Prioritario',
            }
          : {}),
      },
      nuevoEstado === 'EN_PREPARACION'
        ? 'Alistamiento iniciado por Administración desde Bodega Central (Centro de Producción).'
        : nuevoEstado === 'LISTO_DESPACHO'
        ? `Empacado y listo para despacho desde Centro de Producción. Guía: ${guia}`
        : 'Entregado a conductor de transportadora desde Bodega Central.'
    );
    if (res) {
      setMensajeExito(`Pedido #${pedidoSeleccionado.codigo} avanzado a estado ${nuevoEstado}.`);
      setTimeout(() => setMensajeExito(null), 4000);
    }
  };

  const timelineActividad = useMemo<ActivityTimelineItem[]>(() => {
    if (!pedidoSeleccionado) return [];
    return (pedidoSeleccionado.historial || []).map((h, idx) => ({
      id: `act-${pedidoSeleccionado.codigo}-${idx}`,
      timestamp: new Date(h.fechaIso).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      title: h.titulo || 'Actualización de estado',
      description: h.descripcion,
      user: h.usuario,
      type:
        (h.titulo || '').includes('PAGADO') || (h.titulo || '').includes('ENTREGADO')
          ? 'success'
          : (h.titulo || '').includes('CANCELADO')
          ? 'error'
          : 'info',
    }));
  }, [pedidoSeleccionado]);

  const columns: ColumnDef<PedidoWebRecord>[] = [
    {
      key: 'pedido',
      header: 'Pedido',
      render: (p) => (
        <div>
          <span className="font-mono font-black text-xs text-[#741C2B] dark:text-[#E5BE90] block">
            #{p.codigo}
          </span>
          {p.guiaTransportadora && (
            <span className="font-mono text-[10px] text-[#475569] dark:text-white/50 font-medium">
              Guía: {p.guiaTransportadora}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (p) => (
        <span className="text-xs text-[#475569] dark:text-white/70 font-mono font-medium">
          {new Date(p.fechaCreacionIso).toLocaleDateString('es-CO', {
            timeZone: 'America/Bogota',
            day: '2-digit',
            month: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente / Ciudad',
      render: (p) => (
        <div className="text-xs">
          <div className="font-bold text-[#0F172A] dark:text-white">{p.cliente}</div>
          <div className="text-[11px] text-[#475569] dark:text-white/60 font-medium">{p.ciudadDestino}</div>
        </div>
      ),
    },
    {
      key: 'sede',
      header: 'Sede Despacho',
      render: (p) => <span className="text-xs font-bold text-[#0F172A] dark:text-white/90">{p.sedeAsignada}</span>,
    },
    {
      key: 'estadoEntrega',
      header: 'Estado Entrega / Recaudo',
      render: (p) => (
        <div className="space-y-1">
          <StatusBadge
            label={ESTADO_ENTREGA_BADGE[p.estado]?.label || p.estado}
            variant={ESTADO_ENTREGA_BADGE[p.estado]?.variant || 'neutral'}
            size="sm"
          />
          <div>
            <StatusBadge
              label={ESTADO_COBRO_BADGE[p.estadoCobro]?.label || p.estadoCobro}
              variant={ESTADO_COBRO_BADGE[p.estadoCobro]?.variant || 'neutral'}
              size="sm"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'totalCOP',
      header: 'Total COP',
      align: 'right',
      render: (p) => (
        <span className="font-mono font-black text-xs text-[#0F172A] dark:text-white tabular-nums">
          {formatCOP(p.totalCOP)}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acción',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          {p.estadoCobro !== 'PAGADO' && p.estadoCobro !== 'ANULADO' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPedidoAConfirmar(p);
                setReferenciaBancaria('');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#741C2B] hover:bg-[#5E1622] text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Conciliar
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPedidoSeleccionado(p);
              setDrawerTab('detalle');
            }}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/10 text-[#741C2B] dark:text-[#E5BE90] hover:bg-slate-200 dark:hover:bg-white/20 transition-colors cursor-pointer shadow-2xs"
            title="Inspeccionar Pedido"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pedidos Web y Conciliación de Recaudos"
        subtitle="Supervisión de despachos omnicanal, verificación de transferencias bancarias y control de recaudo contraentrega."
        badge="Operaciones Omnicanal"
      />

      {mensajeExito && (
        <div
          role="status"
          className="p-4 rounded-[14px] bg-[#27845C]/10 border border-[#27845C]/30 text-[#27845C] text-xs font-bold flex items-center gap-2.5 shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIStatCard
          title="Recaudo Contraentrega"
          value={formatCOP(kpiPendienteRecaudoCop)}
          subtitle="Pendiente de remesa transportadora"
          icon={Truck}
        />
        <KPIStatCard
          title="Por Verificar"
          value={formatCOP(kpiPendienteVerificacionCop)}
          subtitle="Transferencias por conciliar"
          icon={Clock}
        />
        <KPIStatCard
          title="Recaudado y Conciliado"
          value={formatCOP(kpiPagadoCop)}
          subtitle="Ingresado en cuentas FORMA"
          icon={CheckCircle2}
        />
        <KPIStatCard
          title="Volumen Total Web"
          value={formatCOP(kpiTotalGeneralCop)}
          subtitle={`${pedidos.length} pedidos registrados`}
          icon={Package}
        />
      </div>

      <FilterBar
        searchQuery={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por código, cliente, ciudad o guía transportadora..."
      >
        <select
          value={sedeFiltro}
          onChange={(e) => setSedeFiltro(e.target.value)}
          aria-label="Filtrar por sede"
          className="px-3 py-2 bg-white dark:bg-[#141822]/70 border border-slate-300 dark:border-white/[0.09] rounded-xl text-xs font-bold text-[#0F172A] dark:text-white cursor-pointer focus:outline-none focus:border-[#741C2B] dark:focus:border-[#C49A68]"
        >
          {SEDES_ADMIN.map((s) => (
            <option key={s} value={s} className="bg-white dark:bg-[#121620] text-[#0F172A] dark:text-white">
              {s}
            </option>
          ))}
        </select>

        <select
          value={filtroCobro}
          onChange={(e) => setFiltroCobro(e.target.value)}
          aria-label="Filtrar por estado de cobro"
          className="px-3 py-2 bg-white dark:bg-[#141822]/70 border border-slate-300 dark:border-white/[0.09] rounded-xl text-xs font-bold text-[#0F172A] dark:text-white cursor-pointer focus:outline-none focus:border-[#741C2B] dark:focus:border-[#C49A68]"
        >
          <option value="TODOS" className="bg-white dark:bg-[#121620] text-[#0F172A] dark:text-white">Todos los Recaudos</option>
          <option value="PENDIENTE_VERIFICACION" className="bg-white dark:bg-[#121620] text-[#0F172A] dark:text-white">Transferencias Por Verificar</option>
          <option value="PENDIENTE_RECAUDO" className="bg-white dark:bg-[#121620] text-[#0F172A] dark:text-white">Contraentrega Pendiente</option>
          <option value="PAGADO" className="bg-white dark:bg-[#121620] text-[#0F172A] dark:text-white">Pagado y Conciliado</option>
        </select>
      </FilterBar>

      {pedidos.length === 0 ? (
        <EmptyState
          title="No hay pedidos web registrados en el sistema"
          description="Los pedidos generados desde la tienda online aparecerán aquí inmediatamente para su control y conciliación."
          icon={Truck}
        />
      ) : (
        <DataTable
          columns={columns}
          data={pedidosFiltrados}
          keyExtractor={(p) => p.codigo}
          onSelectRow={(p) => {
            setPedidoSeleccionado(p);
            setDrawerTab('detalle');
          }}
          emptyTitle="No se encontraron pedidos con los filtros aplicados"
          emptySubtitle="Prueba ajustando el término de búsqueda o la sede."
        />
      )}

      {/* Modal Reutilizable de Confirmación / Conciliación de Pago */}
      <ConfirmDialog
        isOpen={Boolean(pedidoAConfirmar)}
        title="Conciliar Pago de Pedido"
        description={`Confirmar que el importe de ${pedidoAConfirmar ? formatCOP(pedidoAConfirmar.totalCOP) : ''} COP correspondiente a ${pedidoAConfirmar?.cliente || ''} ya ingresó efectivamente a las cuentas de FORMA.`}
        confirmLabel="Confirmar Pago Recibido"
        cancelLabel="Cancelar"
        variant="vino"
        onConfirm={handleConfirmarPago}
        onCancel={() => {
          setPedidoAConfirmar(null);
          setReferenciaBancaria('');
        }}
      >
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/90 block">
            Referencia Bancaria o Comprobante (CUS / Remesa):
          </label>
          <input
            type="text"
            value={referenciaBancaria}
            onChange={(e) => setReferenciaBancaria(e.target.value)}
            placeholder="Ej: CUS-849201 / TR-0042"
            className="w-full px-3 py-2 rounded-xl bg-[#141822] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#C49A68]"
          />
        </div>
      </ConfirmDialog>

      {/* Modal de confirmación para eliminar pedido */}
      <ConfirmDialog
        isOpen={Boolean(pedidoAEliminar)}
        title={`Eliminar Pedido #${pedidoAEliminar?.codigo}`}
        description={`¿Estás seguro de que deseas eliminar permanentemente este pedido de ${pedidoAEliminar?.cliente} por ${pedidoAEliminar ? formatCOP(pedidoAEliminar.totalCOP) : ''}? Esta acción borrará el registro del almacén y del historial del cliente.`}
        confirmLabel="Sí, Eliminar Pedido"
        cancelLabel="Conservar Pedido"
        variant="danger"
        onConfirm={handleConfirmarEliminarPedido}
        onCancel={() => setPedidoAEliminar(null)}
      />

      {/* DetailDrawer con las 4 pestañas estándar */}
      {pedidoSeleccionado && (
        <DetailDrawer
          isOpen={Boolean(pedidoSeleccionado)}
          onClose={() => setPedidoSeleccionado(null)}
          title={`Pedido #${pedidoSeleccionado.codigo}`}
          subtitle={`Cliente: ${pedidoSeleccionado.cliente} · Sede: ${pedidoSeleccionado.sedeAsignada}`}
          badge={{
            label: ESTADO_ENTREGA_BADGE[pedidoSeleccionado.estado]?.label || pedidoSeleccionado.estado,
            variant: ESTADO_ENTREGA_BADGE[pedidoSeleccionado.estado]?.variant === 'success' ? 'success' : 'info',
          }}
          tabs={[
            { id: 'detalle', label: 'Información' },
            { id: 'productos', label: 'Productos' },
            { id: 'actividad', label: 'Historial' },
            { id: 'comprobantes', label: 'Comprobantes' },
          ]}
          activeTab={drawerTab}
          onTabChange={(t) => setDrawerTab(t as any)}
          activityItems={timelineActividad}
          footerActions={
            <div className="flex flex-col gap-2 w-full">
              {/* Acciones de Alistamiento / Despacho desde Bodega Central */}
              {['RECIBIDO', 'CONFIRMADO'].includes(pedidoSeleccionado.estado) && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstadoAdmin('EN_PREPARACION')}
                  className="w-full py-2.5 px-4 rounded-[12px] bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4 text-emerald-200" />
                  <span>Alistar en Bodega Central (Centro de Producción)</span>
                </button>
              )}
              {pedidoSeleccionado.estado === 'EN_PREPARACION' && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstadoAdmin('LISTO_DESPACHO')}
                  className="w-full py-2.5 px-4 rounded-[12px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4 text-amber-200" />
                  <span>Marcar Listo para Despacho</span>
                </button>
              )}
              {pedidoSeleccionado.estado === 'LISTO_DESPACHO' && (
                <button
                  type="button"
                  onClick={() => handleAvanzarEstadoAdmin('DESPACHADO')}
                  className="w-full py-2.5 px-4 rounded-[12px] bg-[#1C1311] hover:bg-[#3D2620] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4 text-[#C49A68]" />
                  <span>Despachar con Transportadora</span>
                </button>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                {pedidoSeleccionado.estadoCobro !== 'PAGADO' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPedidoAConfirmar(pedidoSeleccionado);
                      setReferenciaBancaria('');
                    }}
                    className="flex-1 w-full py-2.5 px-4 rounded-[12px] bg-[#741C2B] hover:bg-[#5E1622] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C49A68]" />
                    <span>Conciliar y Marcar como Pagado</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPedidoAEliminar(pedidoSeleccionado)}
                  className="py-2.5 px-3 rounded-[12px] bg-red-50 hover:bg-red-100 text-[#C44848] font-bold text-xs border border-red-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  title="Eliminar pedido permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Pedido</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {drawerTab === 'detalle' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] space-y-2">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                    Datos de Entrega y Destino
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-[#77736E]">Cliente:</span>{' '}
                      <strong className="text-[#292827]">{pedidoSeleccionado.cliente}</strong>
                    </div>
                    <div>
                      <span className="text-[#77736E]">Documento:</span>{' '}
                      <span className="font-mono text-[#741C2B] font-bold">
                        {pedidoSeleccionado.documento || 'CC No indicada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#77736E]">Teléfono:</span>{' '}
                      <span className="font-mono">{pedidoSeleccionado.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div>
                      <span className="text-[#77736E]">Destino:</span>{' '}
                      <span>
                        {pedidoSeleccionado.direccionEntrega}, {pedidoSeleccionado.ciudadDestino}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[12px] bg-white border border-[#E7E0D8] space-y-2 shadow-2xs">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                    Logística y Despacho
                  </h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-[#77736E]">Sede Asignada:</span>{' '}
                      <strong>{pedidoSeleccionado.sedeAsignada}</strong>
                      {obtenerSedesConStockParaPedido(pedidoSeleccionado.productos).length > 0 && (
                        <div className="text-[11px] text-emerald-700 mt-1">
                          Sedes con inventario disponible:{' '}
                          <strong>{obtenerSedesConStockParaPedido(pedidoSeleccionado.productos).join(', ')}</strong>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[#77736E]">Transportadora:</span>{' '}
                      <span>{pedidoSeleccionado.transportadora || 'Coordinadora Mercantil'}</span>
                    </div>
                    <div>
                      <span className="text-[#77736E]">Número de Guía:</span>{' '}
                      <span className="font-mono font-bold text-[#741C2B]">
                        {pedidoSeleccionado.guiaTransportadora || 'Pendiente de emisión'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'productos' && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                  Prendas del Pedido ({pedidoSeleccionado.productos.length})
                </h4>
                <div className="space-y-2">
                  {pedidoSeleccionado.productos.map((pr, idx) => (
                    <div
                      key={`prod-drawer-${idx}`}
                      className="p-3 bg-[#F5F3EF] rounded-[12px] border border-[#E7E0D8] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#292827]">{pr.nombre}</div>
                        <div className="text-[11px] text-[#77736E] font-mono">
                          SKU: {pr.sku} · Talla: {pr.talla} · {pr.cantidad} ud(s)
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Bodega Central: {obtenerStockSede(pr.sku, 'Bodega Central')} uds
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                            {pedidoSeleccionado.sedeAsignada}: {obtenerStockSede(pr.sku, pedidoSeleccionado.sedeAsignada)} uds
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#292827] shrink-0">
                        {formatCOP(pr.precioUnitarioCOP * pr.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-white rounded-[12px] border border-[#E7E0D8] space-y-1.5 text-xs shadow-2xs">
                  <div className="flex justify-between text-[#77736E]">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCOP(pedidoSeleccionado.subtotalCOP)}</span>
                  </div>
                  <div className="flex justify-between text-[#77736E]">
                    <span>IVA 19%:</span>
                    <span className="font-mono">{formatCOP(pedidoSeleccionado.ivaCOP)}</span>
                  </div>
                  <div className="flex justify-between text-[#77736E]">
                    <span>Flete:</span>
                    <span className="font-mono">{formatCOP(pedidoSeleccionado.fleteCOP)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E7E0D8] flex justify-between font-black text-sm text-[#741C2B]">
                    <span>Total COP:</span>
                    <span className="font-mono">{formatCOP(pedidoSeleccionado.totalCOP)}</span>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'comprobantes' && (
              <div className="space-y-3 text-xs">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                  Comprobante y Conciliación
                </h4>
                <div className="p-4 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">Método de Pago:</span>
                    <strong>{pedidoSeleccionado.metodoPago}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">Estado de Recaudo:</span>
                    <StatusBadge
                      label={ESTADO_COBRO_BADGE[pedidoSeleccionado.estadoCobro]?.label || pedidoSeleccionado.estadoCobro}
                      variant={ESTADO_COBRO_BADGE[pedidoSeleccionado.estadoCobro]?.variant || 'neutral'}
                      size="sm"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">Referencia / CUS:</span>
                    <span className="font-mono font-bold text-[#741C2B]">
                      {pedidoSeleccionado.referenciaPago || 'Pendiente de asignación'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
};

export default AdminPedidosWebPage;
