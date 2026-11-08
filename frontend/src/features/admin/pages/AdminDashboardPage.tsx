// frontend/src/features/admin/pages/AdminDashboardPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Vault,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  Store,
  RefreshCw,
  Clock,
  Receipt,
} from 'lucide-react';
import {
  getPosRegisteredSales,
  getPosRegisteredExchanges,
  getAllStockDeltas,
} from '../../pos/utils/posLedgerSync';
import { getWebOrders, mismaSede, WEB_ORDERS_EVENT } from '../../pos/utils/webOrdersStore';
import {
  getSesionAbierta,
  resumenSesion,
  CAJA_EVENT,
  SesionCaja,
} from '../../pos/utils/cajaStore';
import { PRODUCTOS_SEMILLA } from '../../storefront/services/catalogService';
import { SedeAdminFiltro, SEDES_ADMIN_OPTIONS, SEDES_LABELS } from '../../../layouts/AdminLayout';
import { PageHeader } from '../components/PageHeader';

interface AlertaInventarioItem {
  sku: string;
  nombre: string;
  tallaColor: string;
  disponible: number;
  umbral: number;
  estado: 'critico' | 'bajo';
}

interface MovimientoRecienteItem {
  id: string;
  tipo: 'VENTA_POS' | 'PEDIDO_WEB' | 'TRASLADO';
  referencia: string;
  titulo: string;
  detalle: string;
  estado: string;
  valorTexto: string;
  fecha: string;
}

export interface KpiSedeData {
  sedeKey: SedeAdminFiltro;
  nombreSede: string;
  ciudad: string;
  badge: string;
  ventasNetasCop: number;
  ventasNetasTexto: string;
  ventasBrutasTexto: string;
  devolucionesTexto: string;
  descuentosTexto: string;
  variacionTexto: string;
  porcentajeParticipacion: number;
  unidadesInventario: number;
  unidadesInventarioTexto: string;
  valorizadoInventarioTexto: string;
  productosResumen: string;
  pedidosActivosCount: number;
  pedidosActivosTexto: string;
  pedidosEmpaque: number;
  pedidosDespacho: number;
  cajaEstado: string;
  cajaDetalle: string;
  cajaAbierta: boolean;
  alertasInventario: AlertaInventarioItem[];
  movimientosRecientes: MovimientoRecienteItem[];
}

interface SedeMetadata {
  sedeKey: SedeAdminFiltro;
  nombreSede: string;
  ciudad: string;
  badge: string;
}

const SEDES_METADATA: Record<SedeAdminFiltro, SedeMetadata> = {
  'Todas las Sedes (Consolidado)': {
    sedeKey: 'Todas las Sedes (Consolidado)',
    nombreSede: 'Consolidado Nacional',
    ciudad: '5 Ubicaciones Operativas',
    badge: 'Consolidado Global',
  },
  'Punto Centro': {
    sedeKey: 'Punto Centro',
    nombreSede: 'Punto Centro (Cúcuta)',
    ciudad: 'Cúcuta Centro Comercial',
    badge: 'Norte de Santander',
  },
  'Punto Caobos': {
    sedeKey: 'Punto Caobos',
    nombreSede: 'Punto Caobos (Cúcuta)',
    ciudad: 'Cúcuta Los Caobos / Ventura',
    badge: 'Zona Rosa',
  },
  'Punto Bucaramanga': {
    sedeKey: 'Punto Bucaramanga',
    nombreSede: 'Punto Bucaramanga',
    ciudad: 'Bucaramanga Cabecera',
    badge: 'Santander',
  },
  'Punto Ocaña': {
    sedeKey: 'Punto Ocaña',
    nombreSede: 'Punto Ocaña',
    ciudad: 'Ocaña Centro Histórico',
    badge: 'Provincia',
  },
  'Bodega Central': {
    sedeKey: 'Bodega Central',
    nombreSede: 'Bodega Central',
    ciudad: 'Cúcuta Zona Franca',
    badge: 'Custodia & Despacho',
  },
};

const SEDES_COMERCIALES: SedeAdminFiltro[] = [
  'Punto Centro',
  'Punto Caobos',
  'Punto Bucaramanga',
  'Punto Ocaña',
];

const formatCOP = (n: number): string => {
  const entero = Math.trunc(Math.abs(n));
  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(entero);
  return `${n < 0 ? '-' : ''}$${formatted} COP`;
};

const calcularStockVarianteEnSede = (
  v: {
    sku: string;
    stockDisponible: number;
    stockPorSede?: Record<string, number>;
  },
  sedeKey: SedeAdminFiltro,
  deltas: Record<string, number>
): number => {
  const delta = deltas[v.sku.toUpperCase()] || 0;
  const stockCentro = Math.max(0, (v.stockPorSede?.['Punto Centro'] ?? 0) + delta);
  const stockCaobos = Math.max(0, v.stockPorSede?.['Punto Caobos'] ?? 0);
  const stockOcana = Math.max(0, v.stockPorSede?.['Punto Ocaña'] ?? 0);
  const stockBucaramanga = Math.max(0, v.stockPorSede?.['Punto Bucaramanga'] ?? 0);
  const sumaTiendasBase =
    (v.stockPorSede?.['Punto Centro'] ?? 0) +
    (v.stockPorSede?.['Punto Caobos'] ?? 0) +
    (v.stockPorSede?.['Punto Ocaña'] ?? 0) +
    (v.stockPorSede?.['Punto Bucaramanga'] ?? 0);
  const stockBodega = Math.max(
    0,
    v.stockPorSede?.['Bodega Central'] ?? Math.max(0, (v.stockDisponible || 0) - sumaTiendasBase)
  );

  if (sedeKey === 'Punto Centro') return stockCentro;
  if (sedeKey === 'Punto Caobos') return stockCaobos;
  if (sedeKey === 'Punto Ocaña') return stockOcana;
  if (sedeKey === 'Punto Bucaramanga') return stockBucaramanga;
  if (sedeKey === 'Bodega Central') return stockBodega;
  return stockCentro + stockCaobos + stockOcana + stockBucaramanga + stockBodega;
};

const calcularVentasNetasPorSede = (sedeKey: SedeAdminFiltro) => {
  const sales = typeof window !== 'undefined' ? getPosRegisteredSales() : [];
  const exchanges = typeof window !== 'undefined' ? getPosRegisteredExchanges() : [];
  const webOrders = typeof window !== 'undefined' ? getWebOrders() : [];

  const isAll = sedeKey === 'Todas las Sedes (Consolidado)';
  const sedeSales = sales.filter((s) => isAll || mismaSede(s.sede, sedeKey));
  const sedeOrders = webOrders.filter((o) => isAll || mismaSede(o.sedeAsignada, sedeKey));
  const sedeExchanges = exchanges.filter((e) => isAll || mismaSede(e.sede || 'Punto Centro', sedeKey));

  const ventasPosCop = sedeSales.reduce(
    (acc, s) => acc + Math.trunc(s.totalCop ?? (s as any).totalPagarCOP ?? 0),
    0
  );
  const paidWebOrders = sedeOrders.filter((o) => o.estadoCobro === 'PAGADO');
  const pedidosWebPagadosCop = paidWebOrders.reduce(
    (acc, o) => acc + Math.trunc(o.totalCOP || 0),
    0
  );
  const excedentesCambiosCop = sedeExchanges.reduce(
    (acc, ex) =>
      acc +
      (ex.tipoLiquidacion === 'EXCEDENTE_COBRADO' && ex.diferenciaCop > 0
        ? Math.trunc(ex.diferenciaCop)
        : 0),
    0
  );
  const devolucionesCop = sedeExchanges.reduce(
    (acc, ex) =>
      acc +
      (ex.tipoLiquidacion === 'REINTEGRO_A_FAVOR'
        ? Math.abs(Math.trunc(ex.diferenciaCop || ex.valorDevueltoCop || 0))
        : 0),
    0
  );

  const ventasBrutasCop = ventasPosCop + pedidosWebPagadosCop + excedentesCambiosCop;
  const ventasNetasCop = Math.max(0, ventasBrutasCop - devolucionesCop);

  return {
    sedeSales,
    sedeOrders,
    paidWebOrders,
    sedeExchanges,
    ventasPosCop,
    pedidosWebPagadosCop,
    devolucionesCop,
    ventasBrutasCop,
    ventasNetasCop,
  };
};

const computeDynamicData = (
  sedeKey: SedeAdminFiltro,
  totalConsolidadoNeto: number
): KpiSedeData => {
  const meta = SEDES_METADATA[sedeKey] || SEDES_METADATA['Todas las Sedes (Consolidado)'];
  const isAll = sedeKey === 'Todas las Sedes (Consolidado)';

  // 1. Ventas Netas y Devoluciones Reales
  const {
    sedeSales,
    sedeOrders,
    paidWebOrders,
    devolucionesCop,
    ventasBrutasCop,
    ventasNetasCop,
  } = calcularVentasNetasPorSede(sedeKey);

  const porcentajeParticipacion = isAll
    ? ventasNetasCop > 0
      ? 100
      : 0
    : totalConsolidadoNeto > 0
    ? Math.round((ventasNetasCop / totalConsolidadoNeto) * 100)
    : 0;

  const variacionTexto =
    ventasNetasCop > 0
      ? `${sedeSales.length} venta(s) POS • ${paidWebOrders.length} web pagado(s)`
      : 'Sin ventas registradas en este corte';

  // 2. Inventario Físico Real desde PRODUCTOS_SEMILLA + getAllStockDeltas()
  const deltas = typeof window !== 'undefined' ? getAllStockDeltas() : {};
  let totalUnidades = 0;
  let totalValorizadoCop = 0;
  let totalVariantes = 0;
  const todasVariantesEvaluadas: AlertaInventarioItem[] = [];

  for (const prod of PRODUCTOS_SEMILLA) {
    for (const v of prod.variantes) {
      totalVariantes += 1;
      const disponible = calcularStockVarianteEnSede(v, sedeKey, deltas);
      totalUnidades += disponible;
      totalValorizadoCop += disponible * Math.trunc(v.precioVentaCop || 0);

      todasVariantesEvaluadas.push({
        sku: v.sku,
        nombre: prod.nombre,
        tallaColor: `${v.talla} · ${v.color}`,
        disponible,
        umbral: 4,
        estado: disponible <= 1 ? 'critico' : 'bajo',
      });
    }
  }

  todasVariantesEvaluadas.sort((a, b) => a.disponible - b.disponible);
  const variantesBajoUmbral = todasVariantesEvaluadas.filter((item) => item.disponible <= 4);
  const alertasInventario = (
    variantesBajoUmbral.length > 0 ? variantesBajoUmbral : todasVariantesEvaluadas
  ).slice(0, 5);

  const unidadesFormateadas = new Intl.NumberFormat('es-CO').format(totalUnidades);

  // 3. Pedidos Web Activos Reales
  const activeOrders = sedeOrders.filter((o) => {
    const estado = o.estado || (o as any).estadoActual || 'RECIBIDO';
    return !['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'].includes(estado);
  });
  const pedidosEmpaque = activeOrders.filter((o) => {
    const estado = o.estado || (o as any).estadoActual || 'RECIBIDO';
    return ['RECIBIDO', 'CONFIRMADO', 'EN_PREPARACION'].includes(estado);
  }).length;
  const pedidosDespacho = activeOrders.filter((o) => {
    const estado = o.estado || (o as any).estadoActual || 'RECIBIDO';
    return ['LISTO_DESPACHO', 'DESPACHADO', 'EN_ENTREGA'].includes(estado);
  }).length;

  // 4. Estado de Caja Real desde cajaStore
  let cajaEstado = 'Caja Cerrada';
  let cajaDetalle = 'Sin turno activo en este punto';
  let cajaAbierta = false;

  if (isAll) {
    const abiertas: SesionCaja[] = SEDES_COMERCIALES.map((s) => getSesionAbierta(s)).filter(
      (s): s is SesionCaja => Boolean(s)
    );
    const efectivoEsperadoTotal = abiertas.reduce(
      (acc, s) => acc + resumenSesion(s).efectivoEsperadoCop,
      0
    );
    cajaAbierta = abiertas.length > 0;
    cajaEstado = `${abiertas.length}/4 Sedes Abiertas`;
    cajaDetalle =
      abiertas.length > 0
        ? `Efectivo esperado en gavetas: ${formatCOP(efectivoEsperadoTotal)}`
        : 'Efectivo en gavetas: $0 COP • Sin turnos abiertos';
  } else if (sedeKey === 'Bodega Central') {
    cajaAbierta = false;
    cajaEstado = 'Sin Caja Mostrador';
    cajaDetalle = 'Exclusivo para abastecimiento e inventario';
  } else {
    const sesion = getSesionAbierta(sedeKey);
    if (sesion) {
      cajaAbierta = true;
      cajaEstado = `Caja Abierta (${sesion.id})`;
      cajaDetalle = `Base ${formatCOP(sesion.baseInicialCop)} • ${sesion.vendedor}`;
    } else {
      cajaAbierta = false;
      cajaEstado = 'Caja Cerrada';
      cajaDetalle = 'Sin turno activo en este punto';
    }
  }

  // 5. Actividad Reciente y Movimientos en Vivo (100% reales)
  const movimientosRecientes: MovimientoRecienteItem[] = [];

  for (const s of sedeSales.slice(0, 4)) {
    const monto = Math.trunc(s.totalCop ?? (s as any).totalPagarCOP ?? 0);
    movimientosRecientes.push({
      id: `vta-${s.id || s.consecutivo}`,
      tipo: 'VENTA_POS',
      referencia: s.consecutivo,
      titulo: `Venta POS • ${s.vendedor || 'Vendedor'}`,
      detalle: `${s.sede || 'Punto de Venta'} • ${s.cliente || 'Consumidor Final'}`,
      estado: s.medioPago || s.metodoPago || 'EFECTIVO',
      valorTexto: formatCOP(monto),
      fecha: s.fechaCorta || s.fechaHora || 'Hoy',
    });
  }

  for (const o of sedeOrders.slice(0, 4)) {
    const estado = o.estado || (o as any).estadoActual || 'RECIBIDO';
    movimientosRecientes.push({
      id: `web-${o.codigo}`,
      tipo: 'PEDIDO_WEB',
      referencia: o.codigo,
      titulo: `Pedido Web • ${o.cliente || 'Cliente Web'}`,
      detalle: `Sede: ${o.sedeAsignada} • Cobro: ${o.estadoCobro}`,
      estado,
      valorTexto: formatCOP(o.totalCOP || 0),
      fecha: o.metodoPagoTexto || o.metodoPago || 'Tienda Web',
    });
  }

  if (typeof window !== 'undefined') {
    try {
      const rawTraslados = localStorage.getItem('forma_admin_traslados');
      if (rawTraslados) {
        const parsedTraslados = JSON.parse(rawTraslados);
        if (Array.isArray(parsedTraslados)) {
          for (const t of parsedTraslados) {
            const origen = t.origenNombre || t.origen || 'Bodega Central';
            const destino = t.destinoNombre || t.destino || 'Punto de Venta';
            if (isAll || mismaSede(origen, sedeKey) || mismaSede(destino, sedeKey)) {
              const unidades = Array.isArray(t.lineas)
                ? t.lineas.reduce(
                    (acc: number, l: any) =>
                      acc + (l.cantidadEnviada || l.cantidadAprobada || l.cantidadSolicitada || 0),
                    0
                  )
                : t.unidades || 0;
              movimientosRecientes.push({
                id: `trl-${t.codigo || t.id}`,
                tipo: 'TRASLADO',
                referencia: t.codigo || `${t.id}`,
                titulo: `${origen} ➔ ${destino}`,
                detalle: 'Traslado de mercancía entre sedes',
                estado: t.estado || 'ENVIADO',
                valorTexto: `${unidades} prendas`,
                fecha: t.fechaSolicitud || t.fecha || 'Reciente',
              });
            }
          }
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }

  return {
    sedeKey,
    nombreSede: meta.nombreSede,
    ciudad: meta.ciudad,
    badge: meta.badge,
    ventasNetasCop,
    ventasNetasTexto: formatCOP(ventasNetasCop),
    ventasBrutasTexto: formatCOP(ventasBrutasCop),
    devolucionesTexto: devolucionesCop > 0 ? `-${formatCOP(devolucionesCop)}` : '$0 COP',
    descuentosTexto: '$0 COP',
    variacionTexto,
    porcentajeParticipacion,
    unidadesInventario: totalUnidades,
    unidadesInventarioTexto: `${unidadesFormateadas} Unidades`,
    valorizadoInventarioTexto: formatCOP(totalValorizadoCop),
    productosResumen: `${PRODUCTOS_SEMILLA.length} Productos • ${totalVariantes} Variantes activas`,
    pedidosActivosCount: activeOrders.length,
    pedidosActivosTexto: `${activeOrders.length} Pedidos Activos`,
    pedidosEmpaque,
    pedidosDespacho,
    cajaEstado,
    cajaDetalle,
    cajaAbierta,
    alertasInventario,
    movimientosRecientes: movimientosRecientes.slice(0, 6),
  };
};

export const AdminDashboardPage: React.FC = () => {
  const [sedeActiva, setSedeActiva] = useState<SedeAdminFiltro>(() => {
    const saved = localStorage.getItem('forma_admin_sede') as SedeAdminFiltro | null;
    return saved && SEDES_ADMIN_OPTIONS.includes(saved)
      ? saved
      : 'Todas las Sedes (Consolidado)';
  });
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    const syncFromGlobal = () => {
      const saved = localStorage.getItem('forma_admin_sede') as SedeAdminFiltro | null;
      if (saved && SEDES_ADMIN_OPTIONS.includes(saved)) {
        setSedeActiva(saved);
      }
      setLiveTick((t) => t + 1);
    };
    window.addEventListener('forma-admin-sede-change', syncFromGlobal);
    window.addEventListener('storage', syncFromGlobal);
    window.addEventListener('forma-pos-ledger-update', syncFromGlobal);
    window.addEventListener(WEB_ORDERS_EVENT, syncFromGlobal);
    window.addEventListener(CAJA_EVENT, syncFromGlobal);
    return () => {
      window.removeEventListener('forma-admin-sede-change', syncFromGlobal);
      window.removeEventListener('storage', syncFromGlobal);
      window.removeEventListener('forma-pos-ledger-update', syncFromGlobal);
      window.removeEventListener(WEB_ORDERS_EVENT, syncFromGlobal);
      window.removeEventListener(CAJA_EVENT, syncFromGlobal);
    };
  }, []);

  const seleccionarSede = (nuevaSede: SedeAdminFiltro) => {
    setSedeActiva(nuevaSede);
    localStorage.setItem('forma_admin_sede', nuevaSede);
    window.dispatchEvent(new Event('forma-admin-sede-change'));
  };

  const totalConsolidadoNeto = useMemo(
    () => calcularVentasNetasPorSede('Todas las Sedes (Consolidado)').ventasNetasCop,
    [liveTick]
  );

  const kpi = useMemo(
    () => computeDynamicData(sedeActiva, totalConsolidadoNeto),
    [sedeActiva, totalConsolidadoNeto, liveTick]
  );

  const datosSedesComerciales = useMemo(
    () =>
      SEDES_COMERCIALES.map((sedeKey) =>
        computeDynamicData(sedeKey, totalConsolidadoNeto)
      ),
    [totalConsolidadoNeto, liveTick]
  );

  return (
    <div className="space-y-6 pb-8">
      {/* =========================================================================
          1. ENCABEZADO EJECUTIVO COMPACTO + PÍLDORAS DE FILTRO POR SUCURSAL
          ========================================================================= */}
      <PageHeader
        title="Resumen General de Rendimiento"
        subtitle="Visualización en tiempo real de facturación neta, inventario físico, pedidos web y estado de caja."
        badge={`Panel Ejecutivo Central • ${kpi.nombreSede}`}
        actions={
          sedeActiva !== 'Todas las Sedes (Consolidado)' ? (
            <button
              type="button"
              onClick={() => seleccionarSede('Todas las Sedes (Consolidado)')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#741C2B] hover:bg-[#5A1420] text-white text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C49A68]" />
              <span>Ver Todas las Sedes</span>
            </button>
          ) : undefined
        }
      />

      {/* SELECTOR DE PÍLDORAS POR SEDE (INTERACTIVO Y AL INSTANTE) */}
      <section
        aria-label="Filtro rápido por sede"
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {SEDES_ADMIN_OPTIONS.map((sede) => {
          const isSelected = sedeActiva === sede;
          return (
            <button
              key={sede}
              type="button"
              data-testid={`pildora-sede-${sede}`}
              onClick={() => seleccionarSede(sede)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                isSelected
                  ? 'bg-[#741C2B] text-white border-[#741C2B] shadow-2xs'
                  : 'bg-white border-[#E7E0D8] text-[#292827] hover:bg-[#F5F3EF] hover:border-[#C49A68]/60'
              }`}
            >
              {SEDES_LABELS[sede]}
            </button>
          );
        })}
      </section>

      {/* =========================================================================
          2. BLOQUE DE 4 INDICADORES PRINCIPALES (LIMPIOS Y EN VIVO)
          ========================================================================= */}
      <section
        aria-label="Indicadores Clave de Desempeño"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* KPI 1: Ventas Netas */}
        <article className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs flex flex-col justify-between hover:border-[#C49A68]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                Ventas Netas
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#741C2B]/10 text-[#741C2B] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div
              data-testid="kpi-ventas-netas"
              className="text-2xl font-mono-tabular font-extrabold text-[#292827] tabular-nums"
            >
              {kpi.ventasNetasTexto}
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#741C2B] bg-[#F5F3EF] px-2 py-0.5 rounded-md mt-1.5 border border-[#E7E0D8]">
              <ArrowUpRight className="w-3 h-3 text-[#C49A68]" />
              <span>{kpi.variacionTexto}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E0D8] text-[11px] font-mono-tabular text-[#77736E] space-y-1">
            <div className="flex justify-between">
              <span>Ventas Brutas:</span>
              <span className="font-bold text-[#292827] tabular-nums">{kpi.ventasBrutasTexto}</span>
            </div>
            <div className="flex justify-between">
              <span>Devoluciones:</span>
              <span className="font-bold text-[#741C2B] tabular-nums">{kpi.devolucionesTexto}</span>
            </div>
            <div className="flex justify-between">
              <span>Descuentos:</span>
              <span className="font-bold text-[#77736E] tabular-nums">{kpi.descuentosTexto}</span>
            </div>
          </div>
        </article>

        {/* KPI 2: Inventario Físico */}
        <article className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs flex flex-col justify-between hover:border-[#C49A68]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                Inventario Físico
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#C49A68]/20 text-[#741C2B] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div
              data-testid="kpi-inventario-unidades"
              className="text-2xl font-mono-tabular font-extrabold text-[#292827] tabular-nums"
            >
              {kpi.unidadesInventarioTexto}
            </div>
            <div className="text-xs font-bold text-[#741C2B] mt-1 font-mono-tabular tabular-nums">
              Valorizado: {kpi.valorizadoInventarioTexto}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E0D8] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#77736E]">
              {kpi.productosResumen}
            </span>
            <Link
              to="/admin/inventario"
              className="text-[11px] font-extrabold text-[#741C2B] hover:underline flex items-center gap-0.5"
            >
              <span>Ver</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </article>

        {/* KPI 3: Pedidos Web Activos */}
        <article className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs flex flex-col justify-between hover:border-[#C49A68]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                Pedidos Web Activos
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#741C2B]/10 text-[#741C2B] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div
              data-testid="kpi-pedidos-activos"
              className="text-2xl font-mono-tabular font-extrabold text-[#292827] tabular-nums"
            >
              {kpi.pedidosActivosTexto}
            </div>
            <div className="text-xs font-medium text-[#77736E] mt-1 tabular-nums">
              {kpi.pedidosEmpaque} en empaque • {kpi.pedidosDespacho} en despacho
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E0D8] flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#77736E]">Gestión de Alistamiento</span>
            <Link
              to="/admin/pedidos-web"
              className="text-[#741C2B] font-extrabold hover:underline flex items-center gap-0.5"
            >
              <span>Gestionar</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </article>

        {/* KPI 4: Estado de Caja */}
        <article className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs flex flex-col justify-between hover:border-[#C49A68]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                Estado de Caja
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#F5F3EF] text-[#741C2B] border border-[#E7E0D8] flex items-center justify-center">
                <Vault className="w-4 h-4" />
              </div>
            </div>
            <div
              data-testid="kpi-estado-caja"
              className="text-xl sm:text-2xl font-display font-bold text-[#292827]"
            >
              {kpi.cajaEstado}
            </div>
            <div className="text-xs font-medium text-[#77736E] mt-1">
              {kpi.cajaDetalle}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E0D8] flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-bold text-[#292827]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C49A68]" />
              <span>{kpi.cajaAbierta ? 'Turno en operación' : 'Sin turno abierto'}</span>
            </span>
            <Link
              to="/admin/cajas"
              className="font-extrabold text-[#741C2B] hover:underline flex items-center gap-0.5"
            >
              <span>Arqueos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </article>
      </section>

      {/* =========================================================================
          3. BLOQUE DE COMPARACIÓN ENTRE SUCURSALES (4 TARJETAS COMPACTAS)
          ========================================================================= */}
      <section aria-label="Rendimiento por sede física" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-display font-bold text-[#292827]">
            Comparación Comercial entre Sucursales
          </h2>
          <span className="text-xs text-[#77736E] font-medium">
            Seleccione una tarjeta para inspeccionar la sede
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {datosSedesComerciales.map((dataSede) => {
            const isSelected = sedeActiva === dataSede.sedeKey;

            return (
              <div
                key={dataSede.sedeKey}
                data-testid={`tarjeta-sede-${dataSede.sedeKey}`}
                onClick={() => seleccionarSede(dataSede.sedeKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    seleccionarSede(dataSede.sedeKey);
                  }
                }}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-150 border text-left ${
                  isSelected
                    ? 'bg-white border-[#741C2B] shadow-sm ring-2 ring-[#741C2B]/15 -translate-y-0.5'
                    : 'bg-white border-[#E7E0D8] hover:border-[#C49A68]/60 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#741C2B] text-[#C49A68]'
                          : 'bg-[#F5F3EF] text-[#77736E]'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-extrabold text-[#292827] truncate">
                        {dataSede.nombreSede}
                      </h3>
                      <span className="text-[10px] text-[#77736E] block truncate">
                        {dataSede.ciudad}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#741C2B] text-white shrink-0">
                      Activa
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77736E] block">
                    Venta Neta
                  </span>
                  <div className="text-lg font-mono-tabular font-extrabold text-[#741C2B] tabular-nums">
                    {dataSede.ventasNetasTexto}
                  </div>
                </div>

                {/* Barra de Participación de Ventas Real */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-[#77736E]">
                    <span>Participación</span>
                    <span className="font-mono-tabular text-[#292827] tabular-nums">
                      {dataSede.porcentajeParticipacion}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E7E0D8] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#741C2B] transition-all"
                      style={{ width: `${Math.min(100, dataSede.porcentajeParticipacion)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E7E0D8] flex items-center justify-between text-[10px] text-[#77736E]">
                  <span className="tabular-nums">{dataSede.unidadesInventarioTexto}</span>
                  <span className="font-bold text-[#292827] tabular-nums">
                    {dataSede.pedidosActivosTexto}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          4. BLOQUE INFERIOR EN 2 COLUMNAS: ALERTAS DE STOCK BAJO Y ACTIVIDAD RECIENTE
          ========================================================================= */}
      <section
        aria-label="Alertas y movimientos recientes"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Columna 1: Alertas de Inventario Bajo */}
        <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#F5F3EF] text-[#741C2B] border border-[#E7E0D8] flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#292827]">
                  Alertas de Inventario Bajo
                </h3>
                <span className="text-[10px] text-[#77736E] font-medium">
                  {kpi.nombreSede} • Variantes con menor disponibilidad
                </span>
              </div>
            </div>
            <Link
              to="/admin/inventario"
              className="text-xs font-bold text-[#741C2B] hover:underline flex items-center gap-1"
            >
              <span>Gestionar en Kardex</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {kpi.alertasInventario.map((item: AlertaInventarioItem) => (
              <div
                key={item.sku}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] hover:border-[#C49A68]/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-xs font-bold text-[#741C2B]">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        item.estado === 'critico'
                          ? 'bg-[#741C2B]/10 text-[#741C2B]'
                          : 'bg-[#C49A68]/20 text-[#292827]'
                      }`}
                    >
                      {item.estado === 'critico' ? 'Agotado / Crítico' : 'Stock Bajo'}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-[#292827] truncate mt-0.5">
                    {item.nombre}
                  </div>
                  <div className="text-[10px] text-[#77736E]">{item.tallaColor}</div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono-tabular font-extrabold text-[#292827] block tabular-nums">
                    {item.disponible} unds
                  </span>
                  <span className="text-[10px] text-[#77736E] block tabular-nums">
                    Umbral: {item.umbral}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 2: Actividad Reciente (Ventas POS, Pedidos Web y Traslados) */}
        <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#741C2B]/10 text-[#741C2B] flex items-center justify-center">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#292827]">
                    Actividad y Movimientos en Vivo
                  </h3>
                  <span className="text-[10px] text-[#77736E] font-medium">
                    Ventas POS, órdenes web y traslados registrados
                  </span>
                </div>
              </div>
              <Link
                to="/admin/traslados"
                className="text-xs font-bold text-[#741C2B] hover:underline flex items-center gap-1"
              >
                <span>Ver Traslados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {kpi.movimientosRecientes.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-center space-y-2">
                <Clock className="w-7 h-7 text-[#77736E] mx-auto" />
                <p className="text-xs font-extrabold text-[#292827]">
                  Sin movimientos operativos registrados en esta vista
                </p>
                <p className="text-[11px] text-[#77736E] max-w-sm mx-auto">
                  Las ventas en Terminal POS, pedidos de Tienda Web y traslados entre sedes se mostrarán aquí automáticamente en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {kpi.movimientosRecientes.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] hover:border-[#C49A68]/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular text-xs font-bold text-[#292827]">
                          {mov.referencia.startsWith('#') ? mov.referencia : `#${mov.referencia}`}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-white text-[#741C2B] border border-[#E7E0D8]">
                          {mov.estado}
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-[#292827] truncate mt-0.5">
                        {mov.titulo}
                      </div>
                      <div className="text-[10px] text-[#77736E] truncate">
                        {mov.detalle}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono-tabular font-extrabold text-[#741C2B] block tabular-nums">
                        {mov.valorTexto}
                      </span>
                      <span className="text-[10px] text-[#77736E] block font-mono-tabular">
                        {mov.fecha}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E7E0D8] flex items-center justify-between text-[11px] text-[#77736E]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Receipt className="w-3.5 h-3.5 text-[#C49A68]" />
              <span>Sincronización directa con POS y Tienda Web</span>
            </span>
            <Link
              to="/admin/reportes"
              className="font-extrabold text-[#741C2B] hover:underline"
            >
              Ver Reportes →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
