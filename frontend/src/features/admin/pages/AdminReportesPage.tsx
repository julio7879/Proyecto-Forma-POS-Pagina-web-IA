// frontend/src/features/admin/pages/AdminReportesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  DollarSign,
  Users,
  Store,
  Filter,
  Search,
  Shirt,
  ShoppingBag,
  CreditCard,
  Receipt,
  Crown,
  RotateCcw,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { getPosRegisteredSales } from '../../pos/utils/posLedgerSync';
import { getWebOrders, mismaSede, WEB_ORDERS_EVENT } from '../../pos/utils/webOrdersStore';
import { PageHeader } from '../components/PageHeader';
import {
  CATALOGO_REPORTES,
  ReporteItemCatalogo,
  CategoriaReporte,
} from '../services/reportCatalogService';
import { ReportPreviewModal } from '../components/ReportPreviewModal';

// Formato COP Entero sin decimales
const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

export type CategoriaPrenda =
  | 'TODAS'
  | 'ROPA'
  | 'CALZADO'
  | 'ACCESORIOS'
  | 'COSMETICOS'
  | 'ARTESANIAS';

export type RangoFecha =
  | 'HOY'
  | '7DIAS'
  | 'ESTE_MES'
  | 'TRIMESTRE'
  | 'PERSONALIZADO';

export interface VentaTransaccion {
  id: string;
  consecutivo: string;
  fecha: string; // YYYY-MM-DD en America/Bogota
  sede: string;
  vendedor: string;
  cliente: string;
  prendaNombre: string;
  categoria: CategoriaPrenda;
  tipoRopa?: 'PANTALON' | 'CAMISA' | 'CHAQUETA' | 'VESTIDO' | 'OTRO';
  cantidad: number;
  precioUnitarioCop: number;
  subtotalCop: number;
  descuentoCop: number;
  totalNetoCop: number;
  medioPago: 'EFECTIVO' | 'BANCOLOMBIA' | 'NEQUI' | 'DAVIPLATA' | 'TARJETA';
}

const getHoyBogotaStr = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

const toBogotaDateStr = (raw?: string): string => {
  if (!raw) return getHoyBogotaStr();
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return getHoyBogotaStr();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(parsed);
};

const restarDiasBogota = (yyyyMmDd: string, dias: number): string => {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() - dias);
  return dt.toISOString().slice(0, 10);
};

const normalizarCategoria = (catRaw?: string, nombrePrenda = ''): CategoriaPrenda => {
  const limpio = (catRaw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  if (
    limpio === 'ROPA' ||
    limpio === 'CALZADO' ||
    limpio === 'ACCESORIOS' ||
    limpio === 'COSMETICOS' ||
    limpio === 'ARTESANIAS'
  ) {
    return limpio;
  }

  const nombreLower = nombrePrenda.toLowerCase();
  if (
    nombreLower.includes('botin') ||
    nombreLower.includes('botín') ||
    nombreLower.includes('mocas') ||
    nombreLower.includes('sandalia') ||
    nombreLower.includes('zapato')
  ) {
    return 'CALZADO';
  }
  if (
    nombreLower.includes('bolso') ||
    nombreLower.includes('gafas') ||
    nombreLower.includes('cinturon') ||
    nombreLower.includes('cinturón') ||
    nombreLower.includes('gorra') ||
    nombreLower.includes('billetera') ||
    nombreLower.includes('tarjetero') ||
    nombreLower.includes('pañoleta')
  ) {
    return 'ACCESORIOS';
  }
  if (
    nombreLower.includes('serum') ||
    nombreLower.includes('sérum') ||
    nombreLower.includes('crema') ||
    nombreLower.includes('perfume') ||
    nombreLower.includes('labial') ||
    nombreLower.includes('balsamo') ||
    nombreLower.includes('bálsamo') ||
    nombreLower.includes('mascarilla') ||
    nombreLower.includes('tonico') ||
    nombreLower.includes('tónico')
  ) {
    return 'COSMETICOS';
  }
  if (
    nombreLower.includes('sombrero') ||
    nombreLower.includes('mochila') ||
    nombreLower.includes('artesani')
  ) {
    return 'ARTESANIAS';
  }
  return 'ROPA';
};

const inferirTipoRopa = (
  categoria: CategoriaPrenda,
  nombrePrenda: string
): VentaTransaccion['tipoRopa'] => {
  if (categoria !== 'ROPA') return undefined;
  const nombreLower = nombrePrenda.toLowerCase();
  if (
    nombreLower.includes('pantalon') ||
    nombreLower.includes('pantalón') ||
    nombreLower.includes('bermuda') ||
    nombreLower.includes('jean')
  ) {
    return 'PANTALON';
  }
  if (nombreLower.includes('camisa') || nombreLower.includes('camiseta')) {
    return 'CAMISA';
  }
  if (
    nombreLower.includes('chaqueta') ||
    nombreLower.includes('blazer') ||
    nombreLower.includes('gabardina') ||
    nombreLower.includes('ruana') ||
    nombreLower.includes('cardigan')
  ) {
    return 'CHAQUETA';
  }
  if (nombreLower.includes('vestido') || nombreLower.includes('falda')) {
    return 'VESTIDO';
  }
  return 'OTRO';
};

const normalizarMedioPago = (raw?: string): VentaTransaccion['medioPago'] => {
  const m = (raw || 'EFECTIVO').toUpperCase();
  if (m === 'TRANSFERENCIA' || m === 'BANCOLOMBIA') return 'BANCOLOMBIA';
  if (m === 'NEQUI') return 'NEQUI';
  if (m === 'DAVIPLATA') return 'DAVIPLATA';
  if (m === 'TARJETA') return 'TARJETA';
  return 'EFECTIVO';
};

export const AdminReportesPage: React.FC = () => {
  const hoyBogotaStr = getHoyBogotaStr();

  // Filtros dinámicos
  const [rangoFecha, setRangoFecha] = useState<RangoFecha>('ESTE_MES');
  const [fechaInicio, setFechaInicio] = useState<string>(() => `${hoyBogotaStr.slice(0, 7)}-01`);
  const [fechaFin, setFechaFin] = useState<string>(() => hoyBogotaStr);
  const [filtroSede, setFiltroSede] = useState<string>('TODAS');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaPrenda>('TODAS');
  const [busquedaPrenda, setBusquedaPrenda] = useState<string>('');
  const [subfiltroRopa, setSubfiltroRopa] = useState<string>('TODOS');

  // Pestaña Principal: Tablero Analítico en Vivo vs Centro de Reportes (BI Hub)
  const [pestanaPrincipal, setPestanaPrincipal] = useState<'tablero' | 'centro_reportes'>('tablero');
  const [reporteModal, setReporteModal] = useState<ReporteItemCatalogo | null>(null);

  // Filtros del Centro de Reportes
  const [hubBusqueda, setHubBusqueda] = useState<string>('');
  const [hubArea, setHubArea] = useState<CategoriaReporte>('TODAS');
  const [hubOrden, setHubOrden] = useState<'A_Z' | 'Z_A' | 'CATEGORIA'>('A_Z');

  // Pestaña activa del generador analítico
  const [tabActiva, setTabActiva] = useState<'PRENDAS' | 'VENDEDORES' | 'FINANCIERO'>('PRENDAS');

  // Tick de reactividad en vivo
  const [liveTick, setLiveTick] = useState<number>(0);

  useEffect(() => {
    const syncLive = () => setLiveTick((t) => t + 1);
    window.addEventListener('forma-pos-ledger-update', syncLive);
    window.addEventListener(WEB_ORDERS_EVENT, syncLive);
    window.addEventListener('storage', syncLive);
    return () => {
      window.removeEventListener('forma-pos-ledger-update', syncLive);
      window.removeEventListener(WEB_ORDERS_EVENT, syncLive);
      window.removeEventListener('storage', syncLive);
    };
  }, []);

  // Construcción 100% real a partir de ventas POS y pedidos Web activos/entregados
  const todasLasTransacciones = useMemo<VentaTransaccion[]>(() => {
    const realSales = typeof window !== 'undefined' ? getPosRegisteredSales() : [];
    const realOrders = typeof window !== 'undefined' ? getWebOrders() : [];

    const convertedSales: VentaTransaccion[] = [];
    realSales.forEach((s, sIdx) => {
      const lineas = s.prendas || s.items || [];
      const fechaVenta = toBogotaDateStr(
        (s as any).fecha || (s as any).fechaBogota || s.fechaIso
      );
      const medio = normalizarMedioPago(s.medioPago || s.metodoPago);

      lineas.forEach((p, pIdx) => {
        const cant = Math.max(1, Math.trunc(p.cantidad || 1));
        const precio = Math.trunc(
          p.precioUnitarioCop ??
            p.precioUnitarioCOP ??
            (p.totalCop ? Math.round(p.totalCop / cant) : 0)
        );
        const subtotal = precio * cant;
        const descuento = Math.trunc((p as any).descuentoCop || 0);
        const totalNeto = Math.trunc(p.totalCop ?? Math.max(0, subtotal - descuento));
        const cat = normalizarCategoria(p.categoria, p.nombre);
        const tipoRopa = inferirTipoRopa(cat, p.nombre);

        convertedSales.push({
          id: `POS-${s.consecutivo}-${sIdx}-${pIdx}`,
          consecutivo: s.consecutivo,
          fecha: fechaVenta,
          sede: s.sede || 'Punto Centro (Cúcuta)',
          vendedor: s.vendedor || 'Vendedor POS',
          cliente: s.cliente || 'Consumidor Final',
          prendaNombre: p.nombre,
          categoria: cat,
          tipoRopa,
          cantidad: cant,
          precioUnitarioCop: precio,
          subtotalCop: subtotal,
          descuentoCop: descuento,
          totalNetoCop: totalNeto,
          medioPago: medio,
        });
      });
    });

    const convertedOrders: VentaTransaccion[] = [];
    realOrders.forEach((o, oIdx) => {
      const estado = o.estado || (o as any).estadoActual || 'RECIBIDO';
      if (estado === 'CANCELADO' || estado === 'NO_ENTREGADO') {
        return;
      }

      const fechaOrden = toBogotaDateStr(o.fechaCreacionIso);
      const medio = normalizarMedioPago(o.metodoPago);

      (o.productos || []).forEach((p, pIdx) => {
        const cant = Math.max(1, Math.trunc(p.cantidad || 1));
        const precio = Math.trunc(p.precioUnitarioCOP || 0);
        const subtotal = precio * cant;
        const cat = normalizarCategoria(undefined, p.nombre);
        const tipoRopa = inferirTipoRopa(cat, p.nombre);

        convertedOrders.push({
          id: `WEB-${o.codigo}-${oIdx}-${pIdx}`,
          consecutivo: o.codigo,
          fecha: fechaOrden,
          sede: o.sedeAsignada || 'Bodega Central',
          vendedor: 'Tienda Web Omnicanal',
          cliente: o.cliente || 'Cliente Web',
          prendaNombre: p.nombre,
          categoria: cat,
          tipoRopa,
          cantidad: cant,
          precioUnitarioCop: precio,
          subtotalCop: subtotal,
          descuentoCop: 0,
          totalNetoCop: subtotal,
          medioPago: medio,
        });
      });
    });

    return [...convertedSales, ...convertedOrders];
  }, [liveTick]);

  // Filtrado reactivo de transacciones con hora oficial de Colombia y comparación de sede
  const transaccionesFiltradas = useMemo(() => {
    const hace7Dias = restarDiasBogota(hoyBogotaStr, 7);
    const hace90Dias = restarDiasBogota(hoyBogotaStr, 90);
    const prefijoMesActual = hoyBogotaStr.slice(0, 7);

    return todasLasTransacciones.filter((t) => {
      // 1. Filtro de Sede tolerante a variantes de nombre
      if (filtroSede !== 'TODAS' && !mismaSede(t.sede, filtroSede)) {
        return false;
      }

      // 2. Filtro de Categoría
      if (filtroCategoria !== 'TODAS' && t.categoria !== filtroCategoria) {
        return false;
      }

      // 3. Subfiltro de Ropa
      if (subfiltroRopa !== 'TODOS' && t.tipoRopa !== subfiltroRopa) {
        return false;
      }

      // 4. Búsqueda de Texto en Prenda o Vendedor
      if (busquedaPrenda.trim()) {
        const query = busquedaPrenda.toLowerCase().trim();
        const coincidePrenda = t.prendaNombre.toLowerCase().includes(query);
        const coincideVendedor = t.vendedor.toLowerCase().includes(query);
        if (!coincidePrenda && !coincideVendedor) {
          return false;
        }
      }

      // 5. Filtro de Fecha en America/Bogota
      if (rangoFecha === 'HOY') {
        return t.fecha === hoyBogotaStr;
      }
      if (rangoFecha === '7DIAS') {
        return t.fecha >= hace7Dias && t.fecha <= hoyBogotaStr;
      }
      if (rangoFecha === 'ESTE_MES') {
        return t.fecha.startsWith(prefijoMesActual);
      }
      if (rangoFecha === 'TRIMESTRE') {
        return t.fecha >= hace90Dias && t.fecha <= hoyBogotaStr;
      }
      if (rangoFecha === 'PERSONALIZADO') {
        return t.fecha >= fechaInicio && t.fecha <= fechaFin;
      }

      return true;
    });
  }, [
    todasLasTransacciones,
    hoyBogotaStr,
    rangoFecha,
    fechaInicio,
    fechaFin,
    filtroSede,
    filtroCategoria,
    subfiltroRopa,
    busquedaPrenda,
  ]);

  // Cálculos Consolidados con Fórmula Legal de IVA 19% en Colombia
  const metricasGenerales = useMemo(() => {
    const totalVentasBrutas = transaccionesFiltradas.reduce((acc, t) => acc + t.subtotalCop, 0);
    const totalDescuentos = transaccionesFiltradas.reduce((acc, t) => acc + t.descuentoCop, 0);
    const totalVentasNetas = transaccionesFiltradas.reduce((acc, t) => acc + t.totalNetoCop, 0);
    const totalUnidades = transaccionesFiltradas.reduce((acc, t) => acc + t.cantidad, 0);
    const totalTickets = transaccionesFiltradas.length;
    const ticketPromedio = totalTickets > 0 ? Math.round(totalVentasNetas / totalTickets) : 0;
    const baseGravableCop = Math.round(totalVentasNetas / 1.19);
    const iva19Cop = totalVentasNetas - baseGravableCop;

    return {
      totalVentasBrutas,
      totalDescuentos,
      totalVentasNetas,
      totalUnidades,
      totalTickets,
      ticketPromedio,
      baseGravableCop,
      iva19Cop,
    };
  }, [transaccionesFiltradas]);

  // 1. Agrupación: Prendas y Productos más Vendidos
  const prendasAgrupadas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nombre: string;
        categoria: string;
        tipoRopa?: string;
        unidadesVendidas: number;
        totalFacturadoCop: number;
        transacciones: number;
      }
    >();

    for (const t of transaccionesFiltradas) {
      const actual = mapa.get(t.prendaNombre) || {
        nombre: t.prendaNombre,
        categoria: t.categoria,
        tipoRopa: t.tipoRopa,
        unidadesVendidas: 0,
        totalFacturadoCop: 0,
        transacciones: 0,
      };

      actual.unidadesVendidas += t.cantidad;
      actual.totalFacturadoCop += t.totalNetoCop;
      actual.transacciones += 1;
      mapa.set(t.prendaNombre, actual);
    }

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

    const totalUnidades = metricasGenerales.totalUnidades || 1;
    return lista.map((p) => ({
      ...p,
      precioPromedioCop: Math.round(p.totalFacturadoCop / p.unidadesVendidas),
      porcentajeVolumen: Number(((p.unidadesVendidas / totalUnidades) * 100).toFixed(1)),
    }));
  }, [transaccionesFiltradas, metricasGenerales.totalUnidades]);

  // 2. Agrupación: Ranking de Mejores Vendedores
  const rankingVendedores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        vendedor: string;
        sede: string;
        unidadesVendidas: number;
        montoFacturadoCop: number;
        cantidadTickets: number;
      }
    >();

    for (const t of transaccionesFiltradas) {
      const actual = mapa.get(t.vendedor) || {
        vendedor: t.vendedor,
        sede: t.sede,
        unidadesVendidas: 0,
        montoFacturadoCop: 0,
        cantidadTickets: 0,
      };

      actual.unidadesVendidas += t.cantidad;
      actual.montoFacturadoCop += t.totalNetoCop;
      actual.cantidadTickets += 1;
      mapa.set(t.vendedor, actual);
    }

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => b.montoFacturadoCop - a.montoFacturadoCop);

    return lista.map((v, index) => ({
      ...v,
      posicion: index + 1,
      ticketPromedioCop: Math.round(v.montoFacturadoCop / (v.cantidadTickets || 1)),
    }));
  }, [transaccionesFiltradas]);

  // 3. Agrupación: Desglose Financiero por Medios de Pago
  const desgloseMediosPago = useMemo(() => {
    const mapa = new Map<string, { medio: string; totalCop: number; transacciones: number }>();

    for (const t of transaccionesFiltradas) {
      const medioEtiqueta =
        t.medioPago === 'BANCOLOMBIA'
          ? 'Transferencia Bancolombia'
          : t.medioPago === 'NEQUI'
          ? 'Transferencia Nequi'
          : t.medioPago === 'DAVIPLATA'
          ? 'Transferencia Daviplata'
          : t.medioPago === 'EFECTIVO'
          ? 'Efectivo en Caja POS'
          : 'Tarjeta Débito / Crédito';

      const actual = mapa.get(medioEtiqueta) || {
        medio: medioEtiqueta,
        totalCop: 0,
        transacciones: 0,
      };

      actual.totalCop += t.totalNetoCop;
      actual.transacciones += 1;
      mapa.set(medioEtiqueta, actual);
    }

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => b.totalCop - a.totalCop);

    const totalNeto = metricasGenerales.totalVentasNetas || 1;
    return lista.map((m) => ({
      ...m,
      porcentaje: Number(((m.totalCop / totalNeto) * 100).toFixed(1)),
    }));
  }, [transaccionesFiltradas, metricasGenerales.totalVentasNetas]);

  // Catálogo de reportes filtrado para el BI Hub
  const reportesHubFiltrados = useMemo(() => {
    return CATALOGO_REPORTES.filter((r) => {
      if (hubArea !== 'TODAS' && r.categoria !== hubArea) return false;
      if (!hubBusqueda.trim()) return true;
      const q = hubBusqueda.toLowerCase().trim();
      return (
        r.titulo.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q) ||
        r.areaTrabajo.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      if (hubOrden === 'A_Z') return a.titulo.localeCompare(b.titulo);
      if (hubOrden === 'Z_A') return b.titulo.localeCompare(a.titulo);
      return a.categoriaNombre.localeCompare(b.categoriaNombre);
    });
  }, [hubBusqueda, hubArea, hubOrden]);

  const limpiarFiltros = () => {
    setRangoFecha('ESTE_MES');
    setFiltroSede('TODAS');
    setFiltroCategoria('TODAS');
    setSubfiltroRopa('TODOS');
    setBusquedaPrenda('');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* =========================================================================
          1. ENCABEZADO EJECUTIVO ESTÁNDAR (PageHeader)
          ========================================================================= */}
      <PageHeader
        title="Reportes Gerenciales y Ventas por Prenda"
        subtitle="Filtre por periodo, sede, vendedor o prenda específica y analice el rendimiento comercial."
        badge="Analítica e Inteligencia de Negocio"
      />

      {/* Selector de Pestañas Superiores (Tablero Analítico vs Centro de Reportes BI Hub) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E0D8] pb-1 select-none">
        <button
          type="button"
          onClick={() => setPestanaPrincipal('tablero')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            pestanaPrincipal === 'tablero'
              ? 'bg-[#741C2B] text-white shadow-2xs'
              : 'text-[#77736E] hover:text-[#292827] hover:bg-[#F5F3EF]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tablero Analítico en Vivo</span>
        </button>

        <button
          type="button"
          onClick={() => setPestanaPrincipal('centro_reportes')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            pestanaPrincipal === 'centro_reportes'
              ? 'bg-[#741C2B] text-white shadow-2xs'
              : 'text-[#77736E] hover:text-[#292827] hover:bg-[#F5F3EF]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#C49A68]" />
          <span>Centro de Reportes y Descargas (BI Hub)</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#C49A68] text-white">
            10 Libros
          </span>
        </button>
      </div>

      {pestanaPrincipal === 'tablero' && (
        <div className="space-y-6">
          {/* =========================================================================
              2. BARRA DE FILTROS LIMPIA Y COMPACTA EN SUPERFICIE BLANCA (#FFFFFF)
              ========================================================================= */}
      <section
        aria-label="Filtros Dinámicos del Reporte"
        className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D8]">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#292827]">
            <Filter className="w-4 h-4 text-[#741C2B]" />
            <span>Filtros Dinámicos del Reporte</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#77736E] tabular-nums">
              {transaccionesFiltradas.length} registros encontrados
            </span>
            {(filtroSede !== 'TODAS' ||
              filtroCategoria !== 'TODAS' ||
              subfiltroRopa !== 'TODOS' ||
              busquedaPrenda.trim() !== '') && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#741C2B] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila 1: Botones Rápidos de Fecha Oficial de Colombia */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] block">
            Periodo de Evaluación (Hora Oficial Colombia)
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'HOY', label: `Hoy (${hoyBogotaStr})` },
              { key: '7DIAS', label: 'Últimos 7 días' },
              { key: 'ESTE_MES', label: `Este Mes (${hoyBogotaStr.slice(0, 7)})` },
              { key: 'TRIMESTRE', label: 'Trimestre Consolidado' },
              { key: 'PERSONALIZADO', label: 'Rango Personalizado' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRangoFecha(key as RangoFecha)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  rangoFecha === key
                    ? 'bg-[#741C2B] text-white border-[#741C2B] shadow-2xs'
                    : 'bg-[#F5F3EF] text-[#292827] border-[#E7E0D8] hover:border-[#C49A68]/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {rangoFecha === 'PERSONALIZADO' && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#77736E]">Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#77736E]">Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fila 2: Selectores de Sede, Categoría y Búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Selector de Sede */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] mb-1.5">
              Punto de Venta / Sede
            </label>
            <div className="relative">
              <select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] cursor-pointer focus:outline-none focus:border-[#741C2B]"
              >
                <option value="TODAS">Todas las Sedes (Consolidado)</option>
                <option value="Punto Centro (Cúcuta)">Punto Centro (Cúcuta)</option>
                <option value="Punto Caobos (Cúcuta)">Punto Caobos (Cúcuta)</option>
                <option value="Punto Ocaña">Punto Ocaña</option>
                <option value="Punto Bucaramanga">Punto Bucaramanga</option>
                <option value="Bodega Central">Bodega Central</option>
              </select>
              <Store className="w-4 h-4 text-[#741C2B] absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Selector de Categoría */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] mb-1.5">
              Categoría de Producto
            </label>
            <div className="relative">
              <select
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value as CategoriaPrenda);
                  if (e.target.value !== 'ROPA') {
                    setSubfiltroRopa('TODOS');
                  }
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] cursor-pointer focus:outline-none focus:border-[#741C2B]"
              >
                <option value="TODAS">Todas las Categorías</option>
                <option value="ROPA">Ropa (Pantalones, Chaquetas, Camisas, Vestidos)</option>
                <option value="CALZADO">Calzado</option>
                <option value="ACCESORIOS">Accesorios</option>
                <option value="COSMETICOS">Cosméticos</option>
                <option value="ARTESANIAS">Artesanías</option>
              </select>
              <Shirt className="w-4 h-4 text-[#741C2B] absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Buscador de Prenda o Vendedor */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] mb-1.5">
              Buscar Prenda o Vendedor
            </label>
            <div className="relative">
              <input
                type="text"
                value={busquedaPrenda}
                onChange={(e) => setBusquedaPrenda(e.target.value)}
                placeholder="Ej. Pantalón, Camisa, Daniela..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] placeholder-[#77736E] focus:outline-none focus:border-[#741C2B]"
              />
              <Search className="w-4 h-4 text-[#741C2B] absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Subfiltro de Ropa */}
        {(filtroCategoria === 'ROPA' || filtroCategoria === 'TODAS') && (
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#77736E]">Filtrar prenda específica:</span>
            {[
              { key: 'TODOS', label: 'Todas las Prendas' },
              { key: 'PANTALON', label: 'Pantalones' },
              { key: 'CAMISA', label: 'Camisas' },
              { key: 'CHAQUETA', label: 'Chaquetas y Ruanas' },
              { key: 'VESTIDO', label: 'Vestidos' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSubfiltroRopa(key)}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer ${
                  subfiltroRopa === key
                    ? 'bg-[#C49A68]/25 text-[#741C2B] border-[#C49A68]'
                    : 'bg-[#F5F3EF] text-[#292827] border-[#E7E0D8] hover:border-[#C49A68]/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          3. 4 TARJETAS KPI EJECUTIVAS CLARAS
          ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] flex items-center justify-between">
            <span>Ventas Netas</span>
            <DollarSign className="w-4 h-4 text-[#741C2B]" />
          </span>
          <div className="text-2xl font-extrabold font-mono-tabular tabular-nums text-[#292827] mt-1.5">
            {formatCOP(metricasGenerales.totalVentasNetas)}
          </div>
          <span className="text-[11px] text-[#741C2B] font-bold block mt-1 tabular-nums">
            Base: {formatCOP(metricasGenerales.baseGravableCop)} • IVA 19%: {formatCOP(metricasGenerales.iva19Cop)}
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] flex items-center justify-between">
            <span>Unidades Vendidas</span>
            <ShoppingBag className="w-4 h-4 text-[#741C2B]" />
          </span>
          <div className="text-2xl font-extrabold font-mono-tabular tabular-nums text-[#741C2B] mt-1.5">
            {metricasGenerales.totalUnidades}
          </div>
          <span className="text-[11px] text-[#77736E] font-medium block mt-1">
            Prendas y artículos facturados
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] flex items-center justify-between">
            <span>Líneas / Transacciones</span>
            <Receipt className="w-4 h-4 text-[#741C2B]" />
          </span>
          <div className="text-2xl font-extrabold font-mono-tabular tabular-nums text-[#292827] mt-1.5">
            {metricasGenerales.totalTickets}
          </div>
          <span className="text-[11px] text-[#77736E] font-medium block mt-1 tabular-nums">
            Promedio: {formatCOP(metricasGenerales.ticketPromedio)}
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] flex items-center justify-between">
            <span>Vendedor Líder</span>
            <Crown className="w-4 h-4 text-[#C49A68]" />
          </span>
          <div className="text-xl font-extrabold text-[#741C2B] truncate mt-1.5">
            {rankingVendedores[0]?.vendedor || 'Sin ventas en periodo'}
          </div>
          <span className="text-[11px] text-[#292827] font-bold block mt-1 tabular-nums">
            {rankingVendedores[0]?.unidadesVendidas || 0} prendas ·{' '}
            {formatCOP(rankingVendedores[0]?.montoFacturadoCop || 0)}
          </span>
        </div>
      </section>

      {/* =========================================================================
          4. PESTAÑAS ANALÍTICAS LIMPIAS
          ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E0D8] pb-2">
        <button
          type="button"
          onClick={() => setTabActiva('PRENDAS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border cursor-pointer ${
            tabActiva === 'PRENDAS'
              ? 'bg-[#741C2B] text-white border-[#741C2B] shadow-2xs'
              : 'bg-white text-[#292827] border-[#E7E0D8] hover:bg-[#F5F3EF]'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>Prendas más Vendidas</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {prendasAgrupadas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('VENDEDORES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border cursor-pointer ${
            tabActiva === 'VENDEDORES'
              ? 'bg-[#741C2B] text-white border-[#741C2B] shadow-2xs'
              : 'bg-white text-[#292827] border-[#E7E0D8] hover:bg-[#F5F3EF]'
          }`}
        >
          <Crown className="w-4 h-4 text-[#C49A68]" />
          <span>Ranking de Mejores Vendedores</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('FINANCIERO')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border cursor-pointer ${
            tabActiva === 'FINANCIERO'
              ? 'bg-[#741C2B] text-white border-[#741C2B] shadow-2xs'
              : 'bg-white text-[#292827] border-[#E7E0D8] hover:bg-[#F5F3EF]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Desglose por Medios de Pago</span>
        </button>
      </div>

      {/* VISTA 1: VOLUMEN DE VENTAS POR PRENDA */}
      {tabActiva === 'PRENDAS' && (
        <div className="rounded-2xl bg-white border border-[#E7E0D8] overflow-hidden shadow-2xs">
          <div className="p-5 bg-[#F5F3EF] border-b border-[#E7E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#292827] font-display flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#741C2B]" />
                <span>Volumen de Ventas por Prenda</span>
              </h3>
              <p className="text-xs text-[#77736E] font-medium mt-0.5">
                Unidades reales comercializadas en mostrador POS y órdenes de Tienda Web.
              </p>
            </div>
            <div className="text-xs font-extrabold text-[#741C2B] bg-white px-3 py-1.5 rounded-xl border border-[#E7E0D8] self-start sm:self-auto tabular-nums">
              Total {metricasGenerales.totalUnidades} unidades vendidas
            </div>
          </div>

          {prendasAgrupadas.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Shirt className="w-8 h-8 text-[#77736E] mx-auto" />
              <p className="font-extrabold text-sm text-[#292827]">
                No hay ventas registradas para los filtros seleccionados
              </p>
              <p className="text-xs text-[#77736E] max-w-md mx-auto">
                Registre una venta en la Terminal POS o ajuste el rango de fechas, sede o categoría para visualizar el movimiento de prendas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E0D8] bg-[#F5F3EF] text-[11px] font-extrabold text-[#77736E] uppercase tracking-wider">
                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                    <th className="px-5 py-3.5">Prenda / Producto</th>
                    <th className="px-5 py-3.5">Categoría</th>
                    <th className="px-5 py-3.5 text-center">Unidades Vendidas</th>
                    <th className="px-5 py-3.5">Volumen Relativo</th>
                    <th className="px-5 py-3.5 text-right">Precio Promedio</th>
                    <th className="px-5 py-3.5 text-right">Total Facturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E0D8] text-sm">
                  {prendasAgrupadas.map((p, idx) => (
                    <tr key={p.nombre} className="hover:bg-[#F5F3EF]/60 transition-colors">
                      <td className="px-5 py-3.5 text-center font-extrabold font-mono-tabular text-xs text-[#77736E]">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#292827] text-sm">{p.nombre}</div>
                        <div className="text-xs text-[#77736E] font-medium">
                          {p.transacciones} venta(s) registrada(s)
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F5F3EF] text-[#292827] border border-[#E7E0D8]">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-extrabold font-mono-tabular text-sm text-[#741C2B] bg-[#741C2B]/10 px-3 py-1 rounded-lg border border-[#741C2B]/20 tabular-nums">
                          {p.unidadesVendidas} uds
                        </span>
                      </td>
                      <td className="px-5 py-3.5 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#E7E0D8] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#741C2B] h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, p.porcentajeVolumen)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono-tabular font-bold text-[#292827] tabular-nums">
                            {p.porcentajeVolumen}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono-tabular font-bold text-xs text-[#77736E] tabular-nums">
                        {formatCOP(p.precioPromedioCop)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono-tabular font-extrabold text-sm text-[#292827] tabular-nums">
                        {formatCOP(p.totalFacturadoCop)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: RANKING DE MEJORES VENDEDORES */}
      {tabActiva === 'VENDEDORES' && (
        <div className="space-y-5">
          {rankingVendedores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankingVendedores.slice(0, 3).map((v, i) => {
                const medallas = ['🥇 Oro', '🥈 Plata', '🥉 Bronce'];
                return (
                  <div
                    key={v.vendedor}
                    className={`rounded-2xl bg-white p-5 border flex flex-col justify-between shadow-2xs ${
                      i === 0 ? 'border-[#C49A68] ring-1 ring-[#C49A68]/30' : 'border-[#E7E0D8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#741C2B] text-white">
                          {medallas[i]}
                        </span>
                        <span className="text-xs font-bold text-[#77736E] font-mono-tabular">
                          Puesto #{v.posicion}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-[#741C2B] text-[#C49A68] flex items-center justify-center font-extrabold text-base">
                          {v.vendedor.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-[#292827]">{v.vendedor}</h4>
                          <div className="text-xs font-medium text-[#77736E] flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-[#741C2B]" />
                            <span>{v.sede}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E7E0D8] grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-[#F5F3EF]">
                        <span className="text-[10px] font-extrabold uppercase text-[#77736E] block">
                          Facturado
                        </span>
                        <span className="text-xs font-extrabold font-mono-tabular text-[#741C2B] tabular-nums">
                          {formatCOP(v.montoFacturadoCop)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#F5F3EF]">
                        <span className="text-[10px] font-extrabold uppercase text-[#77736E] block">
                          Prendas
                        </span>
                        <span className="text-xs font-extrabold font-mono-tabular text-[#292827] tabular-nums">
                          {v.unidadesVendidas} uds
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl bg-white border border-[#E7E0D8] overflow-hidden shadow-2xs">
            <div className="p-5 bg-[#F5F3EF] border-b border-[#E7E0D8]">
              <h3 className="text-base font-extrabold text-[#292827] font-display flex items-center gap-2">
                <Users className="w-4 h-4 text-[#741C2B]" />
                <span>Rendimiento Global de Vendedores en Mostrador</span>
              </h3>
            </div>

            {rankingVendedores.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-[#77736E] mx-auto" />
                <p className="font-extrabold text-sm text-[#292827]">
                  Sin ventas registradas por vendedores en este periodo
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7E0D8] bg-[#F5F3EF] text-[11px] font-extrabold text-[#77736E] uppercase tracking-wider">
                      <th className="px-5 py-3.5 w-14 text-center">Puesto</th>
                      <th className="px-5 py-3.5">Vendedor</th>
                      <th className="px-5 py-3.5">Sede Asignada</th>
                      <th className="px-5 py-3.5 text-center">Unidades</th>
                      <th className="px-5 py-3.5 text-center">Tickets</th>
                      <th className="px-5 py-3.5 text-right">Ticket Promedio</th>
                      <th className="px-5 py-3.5 text-right">Total Facturado COP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E0D8] text-sm">
                    {rankingVendedores.map((v) => (
                      <tr key={v.vendedor} className="hover:bg-[#F5F3EF]/60 transition-colors">
                        <td className="px-5 py-3.5 text-center font-extrabold font-mono-tabular text-xs text-[#77736E]">
                          #{v.posicion}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-extrabold text-[#292827]">{v.vendedor}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F5F3EF] text-[#292827] border border-[#E7E0D8]">
                            <Store className="w-3.5 h-3.5 text-[#741C2B]" />
                            <span>{v.sede}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono-tabular font-extrabold text-sm text-[#741C2B] tabular-nums">
                          {v.unidadesVendidas}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono-tabular font-bold text-xs text-[#77736E] tabular-nums">
                          {v.cantidadTickets}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono-tabular font-bold text-xs text-[#77736E] tabular-nums">
                          {formatCOP(v.ticketPromedioCop)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono-tabular font-extrabold text-sm text-[#292827] tabular-nums">
                          {formatCOP(v.montoFacturadoCop)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 3: DESGLOSE POR MEDIOS DE PAGO Y CONCILIACIÓN */}
      {tabActiva === 'FINANCIERO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-[#292827] font-display flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#741C2B]" />
                <span>Participación por Método de Pago</span>
              </h3>
              <p className="text-xs text-[#77736E] mt-0.5">
                Recaudación discriminada entre efectivo en caja y transferencias verificadas.
              </p>
            </div>

            {desgloseMediosPago.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-center text-xs font-bold text-[#77736E]">
                Sin movimientos de pago registrados en este periodo.
              </div>
            ) : (
              <div className="space-y-3">
                {desgloseMediosPago.map((mp) => (
                  <div
                    key={mp.medio}
                    className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#292827]">{mp.medio}</span>
                      <span className="font-mono-tabular text-[#741C2B] tabular-nums">
                        {formatCOP(mp.totalCop)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#E7E0D8] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#741C2B] h-full rounded-full"
                          style={{ width: `${mp.porcentaje}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono-tabular font-bold text-[#77736E] tabular-nums">
                        {mp.porcentaje}% ({mp.transacciones} ops)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-[#E7E0D8] p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-[#292827] font-display flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#741C2B]" />
                <span>Conciliación Financiera del Periodo</span>
              </h3>
              <p className="text-xs text-[#77736E] mt-0.5">
                Liquidación contable con Base Gravable e IVA 19% discriminado sobre el valor total.
              </p>
            </div>

            <div className="divide-y divide-[#E7E0D8] text-xs">
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#77736E]">Ventas Brutas Totales (Lista):</span>
                <span className="font-mono-tabular font-bold text-[#292827] tabular-nums">
                  {formatCOP(metricasGenerales.totalVentasBrutas)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#77736E]">Descuentos Comerciales Otorgados:</span>
                <span className="font-mono-tabular font-bold text-[#741C2B] tabular-nums">
                  - {formatCOP(metricasGenerales.totalDescuentos)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center bg-[#F5F3EF] px-3 rounded-xl">
                <span className="font-extrabold text-[#292827] text-sm">Ventas Netas Realizadas:</span>
                <span className="font-mono-tabular font-extrabold text-base text-[#292827] tabular-nums">
                  {formatCOP(metricasGenerales.totalVentasNetas)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#77736E]">
                  Base Gravable Neta (Subtotal sin IVA):
                </span>
                <span className="font-mono-tabular font-bold text-[#292827] tabular-nums">
                  {formatCOP(metricasGenerales.baseGravableCop)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#77736E]">
                  IVA Tarifa General 19% Discriminado:
                </span>
                <span className="font-mono-tabular font-bold text-[#741C2B] tabular-nums">
                  {formatCOP(metricasGenerales.iva19Cop)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* =========================================================================
          VISTA 2: CENTRO DE REPORTES Y DESCARGAS (BI HUB) ESTILO MI VISUALIZATION
          ========================================================================= */}
      {pestanaPrincipal === 'centro_reportes' && (
        <div className="space-y-6 animate-fade-in">
          {/* Barra de Filtros y Búsqueda del Hub */}
          <div className="rounded-2xl bg-white border border-[#E7E0D8] p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Buscador predictivo */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77736E]" />
              <input
                type="text"
                value={hubBusqueda}
                onChange={(e) => setHubBusqueda(e.target.value)}
                placeholder="Buscar reporte por nombre, código o área..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] placeholder:text-[#77736E]"
              />
            </div>

            {/* Filtros Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filtro Área de Trabajo */}
              <div className="relative">
                <select
                  value={hubArea}
                  onChange={(e) => setHubArea(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer"
                >
                  <option value="TODAS">Todas las Áreas de Trabajo</option>
                  <option value="VENTAS">Ventas y Facturación</option>
                  <option value="INVENTARIO">Inventario y Kardex</option>
                  <option value="CAJA">Caja y Tesorería</option>
                  <option value="OMNICANAL">Omnicanal y Web</option>
                  <option value="ABASTECIMIENTO">Compras y Proveedores</option>
                  <option value="CALIDAD">Garantías y Operaciones</option>
                </select>
              </div>

              {/* Ordenamiento */}
              <div className="relative">
                <select
                  value={hubOrden}
                  onChange={(e) => setHubOrden(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer"
                >
                  <option value="A_Z">Orden: A → Z</option>
                  <option value="Z_A">Orden: Z → A</option>
                  <option value="CATEGORIA">Agrupar por Área</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cuadrícula de Tarjetas de Reportes Oficiales FORMA (10 Reportes Estratégicos) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reportesHubFiltrados.map((rep) => (
              <div
                key={rep.id}
                className="rounded-2xl bg-white border border-[#E7E0D8] hover:border-[#741C2B]/40 hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Fila Superior con Icono y Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#27845C]/10 border border-[#27845C]/20 flex items-center justify-center text-[#27845C] group-hover:scale-105 transition-transform shadow-2xs">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F5F3EF] border border-[#E7E0D8] text-[10px] font-black uppercase tracking-wider text-[#741C2B]">
                      {rep.codigo}
                    </span>
                  </div>

                  {/* Título y Descripción */}
                  <h3 className="text-sm font-extrabold text-[#292827] font-display line-clamp-1 mb-1 group-hover:text-[#741C2B] transition-colors">
                    {rep.titulo}
                  </h3>
                  <p className="text-[11px] text-[#77736E] leading-relaxed line-clamp-2 mb-4">
                    {rep.descripcion}
                  </p>

                  {/* Metadatos */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8]/60 text-[11px] mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#77736E]">Área:</span>
                      <strong className="text-[#292827]">{rep.areaTrabajo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#77736E]">Autor:</span>
                      <span className="text-[#292827] font-medium">{rep.autor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#77736E]">Frecuencia:</span>
                      <span className="text-[#741C2B] font-bold">{rep.frecuencia}</span>
                    </div>
                  </div>
                </div>

                {/* Botón de Acción Principal */}
                <button
                  type="button"
                  onClick={() => setReporteModal(rep)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#741C2B] hover:bg-[#5A1420] text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#C49A68]" />
                  <span>Configurar y Descargar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Configuración y Previsualización de Reporte Excel */}
      <ReportPreviewModal
        isOpen={Boolean(reporteModal)}
        reporte={reporteModal}
        onClose={() => setReporteModal(null)}
        sedeDefecto={filtroSede === 'TODAS' ? 'Todas las Sedes (Consolidado)' : filtroSede}
      />
    </div>
  );
};

export default AdminReportesPage;
