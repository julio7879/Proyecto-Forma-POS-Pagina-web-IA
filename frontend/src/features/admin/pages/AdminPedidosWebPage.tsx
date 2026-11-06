import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Banknote,
  CreditCard,
  Building2,
  Search,
  DollarSign,
  Eye,
  FileCheck2,
  X,
} from 'lucide-react';
import { DetailDrawer, type ActivityTimelineItem } from '../../pos/components/DetailDrawer';
import {
  getWebOrders,
  registrarPagoWeb,
  mismaSede,
  WEB_ORDERS_EVENT,
  type PedidoWebRecord,
} from '../../pos/utils/webOrdersStore';

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

const SEDES_ADMIN = [
  'Todas las Sedes (Nacional)',
  'Punto Centro (Cúcuta)',
  'Punto Caobos (Cúcuta)',
  'Punto Ocaña',
  'Punto Bucaramanga',
  'Bodega Central',
];

export const AdminPedidosWebPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoWebRecord[]>(() => getWebOrders());
  const [sedeFiltro, setSedeFiltro] = useState<string>('Todas las Sedes (Nacional)');
  const [filtroCobro, setFiltroCobro] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Sincronización en vivo
  useEffect(() => {
    const sync = () => {
      setPedidos(getWebOrders());
    };
    sync();
    window.addEventListener(WEB_ORDERS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(WEB_ORDERS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Modal para confirmar pago recibido
  const [pedidoAConfirmar, setPedidoAConfirmar] = useState<PedidoWebRecord | null>(null);
  const [referenciaBancaria, setReferenciaBancaria] = useState<string>('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // DetailDrawer
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoWebRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<string>('detalle');

  const adminNombre = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}');
      return u.nombreCompleto || u.nombre || 'Administrador FORMA';
    } catch {
      return 'Administrador FORMA';
    }
  }, []);

  // Filtrado reactivo
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

  // KPIs Financieros y de Recaudo
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

  // Confirmar pago en cuenta bancaria FORMA
  const handleConfirmarPago = () => {
    if (!pedidoAConfirmar) return;
    const refFinal = referenciaBancaria.trim() || `CONCIL-BANCO-${Date.now().toString().slice(-6)}`;
    registrarPagoWeb(pedidoAConfirmar.codigo, adminNombre, refFinal);
    setMensajeExito(`Pago del pedido #${pedidoAConfirmar.codigo} confirmado y conciliado en cuenta FORMA.`);
    setPedidoAConfirmar(null);
    setReferenciaBancaria('');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Actividad para DetailDrawer
  const actividadPedido: ActivityTimelineItem[] = useMemo(() => {
    if (!pedidoSeleccionado || !pedidoSeleccionado.historial) return [];
    return pedidoSeleccionado.historial.map((ev) => {
      let type: 'success' | 'info' | 'warning' | 'neutral' = 'info';
      if (ev.estado === 'DESPACHADO' || ev.estado === 'ENTREGADO' || ev.titulo.includes('Pago confirmado')) {
        type = 'success';
      }
      const fmt = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(ev.fechaIso));

      return {
        id: ev.id,
        timestamp: fmt,
        title: ev.titulo,
        description: ev.descripcion,
        user: ev.usuario,
        type,
      };
    });
  }, [pedidoSeleccionado]);

  return (
    <div className="space-y-5 font-sans">
      {/* Cabecera Ejecutiva */}
      <header className="bg-white rounded-3xl border border-[#D8CFC6] p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE4]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shadow-xs">
              <Truck className="w-6 h-6 text-[#D19650]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-[11px] font-black tracking-wider uppercase">
                  Módulo Administrativo
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                  {pedidos.length} Pedidos en Total
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-0.5">
                Pedidos Web y Conciliación de Recaudos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[#FAF7F4] px-3.5 py-2 rounded-xl border border-[#D8CFC6]">
            <Building2 className="w-4 h-4 text-[#661521]" />
            <span className="font-bold text-[#1C1311]">Administración Central FORMA</span>
          </div>
        </div>

        {mensajeExito && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* KPIs Ejecutivos de Recaudo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#D8CFC6]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-500">
                Pendiente Recaudo Contraentrega
              </span>
              <Banknote className="w-4 h-4 text-amber-700" />
            </div>
            <p className="text-xl font-black font-mono text-amber-900 mt-1">
              {formatCOP(kpiPendienteRecaudoCop)}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Por remesar por transportadoras</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#D8CFC6]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-500">
                Por Verificar (Transferencias)
              </span>
              <CreditCard className="w-4 h-4 text-sky-700" />
            </div>
            <p className="text-xl font-black font-mono text-sky-900 mt-1">
              {formatCOP(kpiPendienteVerificacionCop)}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Comprobantes CUS en revisión</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#D8CFC6]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-500">
                Recaudado y Conciliado
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            </div>
            <p className="text-xl font-black font-mono text-[#059669] mt-1">
              {formatCOP(kpiPagadoCop)}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Ingresado en cuenta FORMA</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1C1311] text-white border-2 border-[#D19650]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#D19650]">
                Volumen Total Web
              </span>
              <DollarSign className="w-4 h-4 text-[#D19650]" />
            </div>
            <p className="text-xl font-black font-mono text-white mt-1">
              {formatCOP(kpiTotalGeneralCop)}
            </p>
            <p className="text-[11px] text-stone-300 mt-0.5">Consolidado multisede</p>
          </div>
        </div>
      </header>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl border border-[#D8CFC6] p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código (PED-2026-...), cliente, ciudad o guía..."
            className="w-full min-h-[46px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Selector de Sede */}
          <select
            value={sedeFiltro}
            onChange={(e) => setSedeFiltro(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
          >
            {SEDES_ADMIN.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Selector de Estado de Cobro */}
          <div className="flex items-center gap-1 bg-[#FAF7F4] p-1 rounded-xl border border-[#D8CFC6] overflow-x-auto">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'PENDIENTE_RECAUDO', label: 'Contraentrega Pendiente' },
              { id: 'PENDIENTE_VERIFICACION', label: 'Transferencia Pendiente' },
              { id: 'PAGADO', label: 'Pagado' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroCobro(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filtroCobro === tab.id
                    ? 'bg-[#661521] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1C1311]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos Web y Conciliación */}
      <section className="bg-white rounded-3xl border border-[#D8CFC6] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#EFEAE4] flex items-center justify-between">
          <h2 className="text-base font-black text-[#1C1311]">
            Listado de Pedidos ({pedidosFiltrados.length})
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            Conciliación de pagos con transportadoras y pasarelas
          </span>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <Package className="w-12 h-12 mx-auto text-stone-300" />
            <p className="font-bold text-sm">No hay pedidos con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#FAF7F4] border-b border-[#E5DDD3] text-stone-600 font-extrabold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente & Destino</th>
                  <th className="py-3 px-4">Sede Despacho</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4">Estado Entrega</th>
                  <th className="py-3 px-4">Estado Recaudo</th>
                  <th className="py-3 px-4 text-right">Total COP</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE4]">
                {pedidosFiltrados.map((p) => {
                  const fechaBogotaStr = new Intl.DateTimeFormat('es-CO', {
                    timeZone: 'America/Bogota',
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(p.fechaCreacionIso));

                  const puedeConfirmar = p.estadoCobro !== 'PAGADO' && p.estadoCobro !== 'ANULADO';

                  return (
                    <tr
                      key={p.codigo}
                      onClick={() => setPedidoSeleccionado(p)}
                      className="hover:bg-[#FAF7F4] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-black text-xs text-[#1C1311]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#1C1311] text-[#D19650]">
                          #{p.codigo}
                        </span>
                        {p.guiaTransportadora && (
                          <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                            {p.guiaTransportadora}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-600 whitespace-nowrap">
                        {fechaBogotaStr}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#1C1311] block">{p.cliente}</span>
                        <span className="text-[11px] text-stone-500">{p.ciudadDestino}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-xs font-semibold">
                          {p.sedeAsignada}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-stone-800 block">
                          {p.metodoPago === 'CONTRAENTREGA' ? 'Contraentrega' : 'Transferencia'}
                        </span>
                        {p.referenciaPago && (
                          <span className="text-[10px] text-stone-500 font-mono">
                            Ref: {p.referenciaPago}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-stone-100 text-stone-700 border border-stone-300">
                          {p.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.estadoCobro === 'PAGADO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#059669] border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pagado y Conciliado</span>
                          </span>
                        ) : p.estadoCobro === 'PENDIENTE_RECAUDO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Pendiente Recaudo Transportadora</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-900 border border-sky-300">
                            <Clock className="w-3 h-3 text-sky-700" />
                            <span>Por Verificar Transferencia</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#059669]">
                        {formatCOP(p.totalCOP)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {puedeConfirmar && (
                            <button
                              type="button"
                              onClick={() => setPedidoAConfirmar(p)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                              title="Confirmar ingreso de dinero a cuenta bancaria de FORMA"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Confirmar Pago</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPedidoSeleccionado(p)}
                            className="p-1.5 rounded-xl bg-white border border-[#D8CFC6] text-stone-700 hover:bg-stone-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="Ver Detalle"
                          >
                            <Eye className="w-4 h-4 text-[#661521]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal para Confirmar Pago Recibido */}
      {pedidoAConfirmar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#059669] shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1C1311]">
                    Conciliar Pago de Pedido
                  </h3>
                  <span className="text-xs text-stone-500 font-mono">
                    #{pedidoAConfirmar.codigo} · {formatCOP(pedidoAConfirmar.totalCOP)} COP
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPedidoAConfirmar(null)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Confirmar que el dinero por valor de <strong>{formatCOP(pedidoAConfirmar.totalCOP)} COP</strong> correspondiente al cliente <strong>{pedidoAConfirmar.cliente}</strong> ya ingresó efectivamente a la cuenta bancaria de FORMA.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                Referencia Bancaria o Número de Remesa:
              </label>
              <input
                type="text"
                value={referenciaBancaria}
                onChange={(e) => setReferenciaBancaria(e.target.value)}
                placeholder="Ej. EXT-BANCOLOMBIA-99214 / GUIA-TCC-RECAUDO..."
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] font-mono text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#059669]"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#EFEAE4]">
              <button
                type="button"
                onClick={handleConfirmarPago}
                className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-sm cursor-pointer"
              >
                Confirmar y Conciliar Pago
              </button>
              <button
                type="button"
                onClick={() => setPedidoAConfirmar(null)}
                className="min-h-[46px] px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DetailDrawer para consultar pedido */}
      {pedidoSeleccionado && (
        <DetailDrawer
          isOpen={Boolean(pedidoSeleccionado)}
          onClose={() => setPedidoSeleccionado(null)}
          title={`Pedido Web #${pedidoSeleccionado.codigo}`}
          subtitle={`${pedidoSeleccionado.cliente} · ${pedidoSeleccionado.ciudadDestino}`}
          badge={{
            label: pedidoSeleccionado.estadoCobro === 'PAGADO' ? 'Pagado' : pedidoSeleccionado.metodoPago === 'CONTRAENTREGA' ? 'Contraentrega' : 'Transferencia',
            variant: pedidoSeleccionado.estadoCobro === 'PAGADO' ? 'success' : 'warning',
          }}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          activityItems={actividadPedido}
          footerActions={
            <div className="flex flex-col sm:flex-row gap-2">
              {pedidoSeleccionado.estadoCobro !== 'PAGADO' && (
                <button
                  type="button"
                  onClick={() => {
                    setPedidoAConfirmar(pedidoSeleccionado);
                    setPedidoSeleccionado(null);
                  }}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Confirmar Pago Recibido</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPedidoSeleccionado(null)}
                className="min-h-[46px] px-4 rounded-xl bg-white border border-[#D8CFC6] text-stone-800 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Metadatos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-[#E5DDD3]">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Cliente</span>
                <p className="font-bold text-sm text-[#1C1311] mt-0.5">{pedidoSeleccionado.cliente}</p>
                <p className="text-stone-500 text-[11px]">{pedidoSeleccionado.emailCliente}</p>
                {pedidoSeleccionado.telefono && (
                  <p className="text-stone-500 text-[11px] mt-0.5">{pedidoSeleccionado.telefono}</p>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Despacho & Sede</span>
                <p className="font-bold text-sm text-[#1C1311] mt-0.5">{pedidoSeleccionado.sedeAsignada}</p>
                <p className="text-stone-500 text-[11px]">{pedidoSeleccionado.ciudadDestino}</p>
                {pedidoSeleccionado.direccionEntrega && (
                  <p className="text-stone-500 text-[11px] mt-0.5 truncate">{pedidoSeleccionado.direccionEntrega}</p>
                )}
              </div>
            </div>

            {/* Prendas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#50322A]">
                Prendas Compradas ({pedidoSeleccionado.productos.length})
              </h4>
              <div className="space-y-2">
                {pedidoSeleccionado.productos.map((pr, idx) => (
                  <div
                    key={`${pr.sku}-${idx}`}
                    className="p-2.5 sm:p-3 bg-[#FAF7F4] rounded-2xl border border-[#D8CFC6] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={pr.imagenUrl || '/products/blazer-imperial-vinotinto.png'}
                        alt={pr.nombre}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-[#1C1311] truncate">{pr.nombre}</h5>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-mono text-stone-600">
                          <span className="px-1.5 py-0.2 rounded bg-stone-200 font-bold text-[#1C1311]">
                            SKU: {pr.sku}
                          </span>
                          <span>Talla: {pr.talla}</span>
                          <span>Color: {pr.color}</span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          {pr.cantidad} ud(s) × {formatCOP(pr.precioUnitarioCOP)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-black text-[#1C1311] shrink-0">
                      {formatCOP(pr.precioUnitarioCOP * pr.cantidad)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose Financiero */}
            <div className="bg-[#FAF7F4] p-3.5 sm:p-4 rounded-2xl border border-[#D8CFC6] space-y-2">
              <div className="flex justify-between text-xs text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCOP(pedidoSeleccionado.subtotalCOP)}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-600">
                <span>IVA 19%:</span>
                <span className="font-mono">{formatCOP(pedidoSeleccionado.ivaCOP)}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-600">
                <span>Flete de envío:</span>
                <span className="font-mono">{formatCOP(pedidoSeleccionado.fleteCOP)}</span>
              </div>
              <div className="pt-2 border-t border-[#D8CFC6] flex justify-between items-baseline">
                <span className="text-xs sm:text-sm font-black text-[#1C1311]">Total Pagado / A Recaudar:</span>
                <span className="text-base sm:text-lg font-black font-mono text-[#059669]">
                  {formatCOP(pedidoSeleccionado.totalCOP)} COP
                </span>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
};

export default AdminPedidosWebPage;
