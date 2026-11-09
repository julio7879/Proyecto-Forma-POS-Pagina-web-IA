import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  Banknote,
  CreditCard,
  Printer,
  Eye,
  ShoppingBag,
  User,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  Truck,
  RotateCcw,
  Filter,
  Calculator,
} from 'lucide-react';
import { TicketVentaPOS } from '../components/TicketVentaPOS';
import { VentaTicketDTO } from '../types/ticket.types';
import {
  getPosRegisteredSales,
  getPosRegisteredExchanges,
  type PosSaleRecord,
  type PosExchangeRecord,
} from '../utils/posLedgerSync';
import { DetailDrawer } from '../components/DetailDrawer';
import {
  getWebOrdersBySede,
  WEB_ORDERS_EVENT,
  mismaSede,
  type PedidoWebRecord,
} from '../utils/webOrdersStore';
import { getSesionAbierta, CAJA_EVENT } from '../utils/cajaStore';

export interface PrendaVentaHistorial {
  sku: string;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitarioCop: number;
  totalCop: number;
  imagenUrl: string;
}

export interface VentaHistorialItem {
  id: string;
  consecutivo: string;
  fechaHora: string;
  fechaIso?: string;
  fechaCorta: string;
  vendedor: string;
  sede?: string;
  cliente: string;
  documentoCliente?: string;
  medioPago: 'EFECTIVO' | 'TRANSFERENCIA';
  referenciaPago?: string;
  subtotalCop: number;
  iva19Cop: number;
  totalCop: number;
  montoRecibidoCop?: number;
  cambioCop?: number;
  prendas: PrendaVentaHistorial[];
}

export type TipoOperacionHistorial = 'VENTA_MOSTRADOR' | 'CAMBIO' | 'DEVOLUCION' | 'PEDIDO_WEB';
export type FiltroTipoOperacion = 'TODOS' | 'VENTAS' | 'CAMBIOS' | 'DEVOLUCIONES' | 'WEB';
export type FiltroMedioPago = 'TODOS' | 'EFECTIVO' | 'TRANSFERENCIA' | 'CONTRAENTREGA';
export type FiltroPeriodo = 'HOY' | 'TODOS';

export interface OperacionUnificadaItem {
  uid: string;
  tipo: TipoOperacionHistorial;
  consecutivo: string;
  fechaHoraTexto: string;
  fechaIso: string;
  vendedor: string;
  cliente: string;
  documentoCliente?: string;
  medioPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CONTRAENTREGA';
  totalCop: number;
  resumenPrendas: string;
  ventaOriginal?: VentaHistorialItem;
  cambioOriginal?: PosExchangeRecord;
  pedidoWebOriginal?: PedidoWebRecord;
}

const formatCOP = (valor: number): string => {
  const absVal = Math.abs(Math.trunc(valor));
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absVal);
  return valor < 0 ? `-${formatted}` : formatted;
};

const getBogotaDateYMD = (iso?: string): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(iso ? new Date(iso) : new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

const formatBogotaDateTime = (iso?: string): string => {
  if (!iso) return 'Hoy';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const escapeXml = (str: string | number | undefined | null): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const mapSaleToVentaItem = (s: PosSaleRecord): VentaHistorialItem => ({
  id: s.id,
  consecutivo: s.consecutivo,
  fechaHora: s.fechaHora || formatBogotaDateTime(s.fechaIso),
  fechaIso: s.fechaIso,
  fechaCorta: s.fechaCorta || 'Hoy',
  vendedor: s.vendedor || 'Carlos Mendoza',
  sede: s.sede,
  cliente: s.cliente || 'Consumidor Final',
  documentoCliente: s.documentoCliente,
  medioPago: ((s.medioPago || s.metodoPago || 'EFECTIVO') === 'TRANSFERENCIA'
    ? 'TRANSFERENCIA'
    : 'EFECTIVO') as 'EFECTIVO' | 'TRANSFERENCIA',
  referenciaPago: s.referenciaPago,
  subtotalCop: s.subtotalCop,
  iva19Cop: s.iva19Cop ?? s.ivaCop ?? 0,
  totalCop: s.totalCop,
  montoRecibidoCop: s.montoRecibidoCop ?? s.efectivoRecibidoCop,
  cambioCop: s.cambioCop,
  prendas: (s.prendas || s.items || []).map((i) => ({
    sku: i.sku,
    nombre: i.nombre,
    talla: i.talla || 'Única',
    color: i.color || 'Estándar',
    cantidad: i.cantidad,
    precioUnitarioCop: i.precioUnitarioCop ?? i.precioUnitarioCOP ?? 0,
    totalCop: i.totalCop,
    imagenUrl: i.imagenUrl || '/products/blazer-imperial-vinotinto.png',
  })),
});

export const PosVentasHistorialPage: React.FC = () => {
  const [vendedorActivo, setVendedorActivo] = useState<string>('Carlos Mendoza');
  const [sedeActiva, setSedeActiva] = useState<string>(
    () => localStorage.getItem('forma_pos_sede') || 'Punto Centro (Cúcuta)'
  );
  const [, setSyncTick] = useState(0);

  // Filtros combinables (QA-POS-020)
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('HOY');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoOperacion>('TODOS');
  const [filtroPago, setFiltroPago] = useState<FiltroMedioPago>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Selección para DetailDrawer y Ticket 80mm
  const [operacionSeleccionada, setOperacionSeleccionada] =
    useState<OperacionUnificadaItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<string>('detalle');
  const [mostrarModalTicket, setMostrarModalTicket] = useState<boolean>(false);
  const [mensajeExcelExito, setMensajeExcelExito] = useState<string | null>(null);

  // Sincronización en tiempo real de usuario, sede y stores
  useEffect(() => {
    const syncAll = () => {
      try {
        const rawUser = localStorage.getItem('forma_pos_usuario') || localStorage.getItem('usuario');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u.rol !== 'CLIENTE') {
            setVendedorActivo(u.nombreCompleto || u.nombre || 'Camilo Mendoza');
          } else {
            setVendedorActivo('Camilo Mendoza');
          }
        }
        const rawSede = localStorage.getItem('forma_pos_sede');
        if (rawSede) {
          setSedeActiva(rawSede);
        }
      } catch {
        /* noop */
      }
      setSyncTick((t) => t + 1);
    };

    syncAll();
    window.addEventListener('forma-pos-ledger-update', syncAll);
    window.addEventListener(WEB_ORDERS_EVENT, syncAll);
    window.addEventListener(CAJA_EVENT, syncAll);
    window.addEventListener('storage', syncAll);

    return () => {
      window.removeEventListener('forma-pos-ledger-update', syncAll);
      window.removeEventListener(WEB_ORDERS_EVENT, syncAll);
      window.removeEventListener(CAJA_EVENT, syncAll);
      window.removeEventListener('storage', syncAll);
    };
  }, []);

  // Construcción de la lista unificada de operaciones reales de sedeActiva (Cero Mocks)
  const operacionesSede = useMemo<OperacionUnificadaItem[]>(() => {
    const ventasRaw = getPosRegisteredSales()
      .filter((s) => !s.sede || mismaSede(s.sede, sedeActiva))
      .map(mapSaleToVentaItem);

    const cambiosRaw = getPosRegisteredExchanges().filter(
      (c) => !c.sede || mismaSede(c.sede, sedeActiva)
    );

    const pedidosRaw = getWebOrdersBySede(sedeActiva);

    const itemsVentas: OperacionUnificadaItem[] = ventasRaw.map((v) => ({
      uid: `VTA-${v.id}`,
      tipo: 'VENTA_MOSTRADOR',
      consecutivo: v.consecutivo.startsWith('#') ? v.consecutivo : `#${v.consecutivo}`,
      fechaHoraTexto: v.fechaHora,
      fechaIso: v.fechaIso || new Date().toISOString(),
      vendedor: v.vendedor,
      cliente: v.cliente,
      documentoCliente: v.documentoCliente,
      medioPago: v.medioPago,
      totalCop: v.totalCop,
      resumenPrendas:
        v.prendas.map((p) => `${p.cantidad}x ${p.nombre} (${p.talla})`).join(', ') ||
        'Prendas de mostrador',
      ventaOriginal: v,
    }));

    const itemsCambios: OperacionUnificadaItem[] = cambiosRaw.map((c) => {
      const esDevolucion = c.tipoLiquidacion === 'REINTEGRO_A_FAVOR' || c.diferenciaCop < 0;
      const medio: 'EFECTIVO' | 'TRANSFERENCIA' =
        c.medioPagoExcedente === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO';
      return {
        uid: `CMB-${c.id}`,
        tipo: esDevolucion ? 'DEVOLUCION' : 'CAMBIO',
        consecutivo: c.consecutivoFactura.startsWith('#')
          ? c.consecutivoFactura
          : `#${c.consecutivoFactura}`,
        fechaHoraTexto: c.fecha || formatBogotaDateTime(c.fechaIso),
        fechaIso: c.fechaIso || new Date().toISOString(),
        vendedor: c.vendedor || vendedorActivo,
        cliente: c.cliente || 'Consumidor Final',
        medioPago: medio,
        totalCop: c.diferenciaCop,
        resumenPrendas: `Entra: ${c.prendaDevuelta} → Sale: ${c.prendaEntregada}`,
        cambioOriginal: c,
      };
    });

    const itemsWeb: OperacionUnificadaItem[] = pedidosRaw.map((p) => ({
      uid: `WEB-${p.codigo}`,
      tipo: 'PEDIDO_WEB',
      consecutivo: p.codigo.startsWith('#') ? p.codigo : `#${p.codigo}`,
      fechaHoraTexto: formatBogotaDateTime(p.fechaCreacionIso),
      fechaIso: p.fechaCreacionIso,
      vendedor: `Despacho ${p.sedeAsignada}`,
      cliente: p.cliente,
      documentoCliente: p.documento,
      medioPago: p.metodoPago === 'CONTRAENTREGA' ? 'CONTRAENTREGA' : 'TRANSFERENCIA',
      totalCop: p.totalCOP,
      resumenPrendas:
        p.productos.map((pr) => `${pr.cantidad}x ${pr.nombre} (${pr.talla})`).join(', ') ||
        'Pedido Tienda Web',
      pedidoWebOriginal: p,
    }));

    return [...itemsVentas, ...itemsCambios, ...itemsWeb].sort((a, b) =>
      b.fechaIso.localeCompare(a.fechaIso)
    );
  }, [sedeActiva, vendedorActivo]);

  // Aplicación de los filtros combinables (Periodo + Tipo + Medio de Pago + Buscador)
  const operacionesFiltradas = useMemo(() => {
    const hoyBogota = getBogotaDateYMD();
    const sesionAbierta = getSesionAbierta(sedeActiva);
    const q = busqueda.trim().toLowerCase();

    return operacionesSede.filter((op) => {
      // 1. Filtro de Periodo (Turno Actual / Hoy vs Todos los Días)
      if (filtroPeriodo === 'HOY') {
        const esHoyBogota = getBogotaDateYMD(op.fechaIso) === hoyBogota;
        const enTurnoAbierto = Boolean(
          sesionAbierta && op.fechaIso >= sesionAbierta.aperturaIso
        );
        const textoDiceHoy = op.fechaHoraTexto.toLowerCase().includes('hoy');
        if (!esHoyBogota && !enTurnoAbierto && !textoDiceHoy) {
          return false;
        }
      }

      // 2. Filtro por Tipo de Operación
      if (filtroTipo === 'VENTAS' && op.tipo !== 'VENTA_MOSTRADOR') return false;
      if (filtroTipo === 'CAMBIOS' && op.tipo !== 'CAMBIO') return false;
      if (filtroTipo === 'DEVOLUCIONES' && op.tipo !== 'DEVOLUCION') return false;
      if (filtroTipo === 'WEB' && op.tipo !== 'PEDIDO_WEB') return false;

      // 3. Filtro por Medio de Pago
      if (filtroPago !== 'TODOS' && op.medioPago !== filtroPago) return false;

      // 4. Buscador libre
      if (!q) return true;
      return (
        op.consecutivo.toLowerCase().includes(q) ||
        op.cliente.toLowerCase().includes(q) ||
        op.vendedor.toLowerCase().includes(q) ||
        op.resumenPrendas.toLowerCase().includes(q) ||
        op.fechaHoraTexto.toLowerCase().includes(q)
      );
    });
  }, [operacionesSede, filtroPeriodo, filtroTipo, filtroPago, busqueda, sedeActiva]);

  // =========================================================================
  // 4 KPIs SUPERIORES CLAROS (QA-POS-023) Y AUTOSUMA INFERIOR (QA-POS-020)
  // =========================================================================
  const metricas = useMemo(() => {
    let totalVentasMostradorCop = 0;
    let sumaEfectivo = 0;
    let sumaTransferencia = 0;
    let sumaContraentrega = 0;
    let sumaCambios = 0;
    let cantidadCambiosDevoluciones = 0;

    for (const op of operacionesFiltradas) {
      if (op.tipo === 'VENTA_MOSTRADOR') {
        totalVentasMostradorCop += op.totalCop;
        if (op.medioPago === 'EFECTIVO') {
          sumaEfectivo += op.totalCop;
        } else if (op.medioPago === 'TRANSFERENCIA') {
          sumaTransferencia += op.totalCop;
        }
      } else if (op.tipo === 'CAMBIO' || op.tipo === 'DEVOLUCION') {
        cantidadCambiosDevoluciones++;
        sumaCambios += op.totalCop;
      } else if (op.tipo === 'PEDIDO_WEB') {
        if (op.medioPago === 'TRANSFERENCIA') {
          sumaTransferencia += op.totalCop;
        } else {
          sumaContraentrega += op.totalCop;
        }
      }
    }

    const granTotalNeto =
      sumaEfectivo + sumaTransferencia + sumaContraentrega + sumaCambios;

    return {
      totalVentasMostradorCop,
      sumaEfectivo,
      sumaTransferencia,
      sumaContraentrega,
      sumaCambios,
      cantidadCambiosDevoluciones,
      granTotalNeto,
    };
  }, [operacionesFiltradas]);

  // Exportar operaciones filtradas a Excel (.xlsx)
  const exportarVentasExcel = () => {
    const cleanStr = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');

    const vendedorSlug = cleanStr(vendedorActivo);
    const sedeSlug = cleanStr(sedeActiva.replace(/\s*\(Cúcuta\)/i, ''));
    const fechaHoyStr = getBogotaDateYMD();
    const nombreArchivo = `Ventas_Diarias_${vendedorSlug}_${sedeSlug}_${fechaHoyStr}.xlsx`;

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Historial POS">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Consecutivo</Data></Cell>
    <Cell><Data ss:Type="String">Tipo Operacion</Data></Cell>
    <Cell><Data ss:Type="String">Fecha Hora</Data></Cell>
    <Cell><Data ss:Type="String">Sede</Data></Cell>
    <Cell><Data ss:Type="String">Vendedor</Data></Cell>
    <Cell><Data ss:Type="String">Cliente</Data></Cell>
    <Cell><Data ss:Type="String">Detalle Prendas</Data></Cell>
    <Cell><Data ss:Type="String">Medio Pago</Data></Cell>
    <Cell><Data ss:Type="String">Total COP</Data></Cell>
   </Row>
   ${operacionesFiltradas
     .map(
       (op) => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(op.consecutivo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(op.tipo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(op.fechaHoraTexto)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(sedeActiva)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(op.vendedor)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(op.cliente)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(op.resumenPrendas)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(op.medioPago)}</Data></Cell>
    <Cell><Data ss:Type="Number">${op.totalCop}</Data></Cell>
   </Row>`
     )
     .join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
    });
    if (typeof window.URL.createObjectURL === 'function') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    setMensajeExcelExito(`Reporte "${nombreArchivo}" generado y descargado correctamente.`);
    setTimeout(() => setMensajeExcelExito(null), 4000);
  };

  // DTO de Ticket para reimpresión 80mm cuando se selecciona una venta
  const ticketDataParaImprimir: VentaTicketDTO | null = useMemo(() => {
    const venta = operacionSeleccionada?.ventaOriginal;
    if (!venta) return null;
    return {
      nombreTienda: 'FORMA BOUTIQUE STORE',
      nombreSede: sedeActiva,
      direccionSede: 'Calle 10 # 3-45, Centro Comercial Plaza',
      telefonoSede: '(+57) 310 492 8810',
      consecutivo: venta.consecutivo,
      fechaHora: venta.fechaHora,
      cajeroNombre: venta.vendedor,
      clienteNombre: venta.cliente,
      items: venta.prendas.map((p) => ({
        sku: p.sku,
        nombre: p.nombre,
        talla: p.talla,
        color: p.color,
        cantidad: p.cantidad,
        precioUnitarioCop: p.precioUnitarioCop,
        subtotalCop: p.totalCop,
        descuentoCop: 0,
        totalCop: p.totalCop,
      })),
      subtotalCop: venta.subtotalCop,
      descuentoTotalCop: 0,
      ivaDiscriminadoCop: venta.iva19Cop,
      totalNetoCop: venta.totalCop,
      metodoPago: venta.medioPago,
      montoRecibidoCop: venta.montoRecibidoCop,
      cambioCop: venta.cambioCop,
      referenciaTransferencia: venta.referenciaPago,
    };
  }, [operacionSeleccionada, sedeActiva]);

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-2.5 sm:p-5 select-none font-sans flex flex-col justify-between">
      <div>
        {/* =========================================================================
            CABECERA EDITORIAL Y 4 KPIS CLAROS (QA-POS-023)
        ========================================================================= */}
        <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE4]">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
                <Receipt className="w-6 h-6 text-[#D19650]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-xs font-black tracking-wider uppercase">
                    Historial Unificado de Sede
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-xs font-extrabold">
                    {operacionesFiltradas.length} Operaciones en Vista
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-1">
                  Historial de Ventas del Mostrador
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs bg-[#FAF7F4] px-3.5 py-2.5 rounded-xl border border-[#E5DDD3]">
                <MapPin className="w-4 h-4 text-[#661521]" />
                <span className="font-bold text-[#1C1311]">Sede {sedeActiva}</span>
              </div>

              <div className="flex items-center gap-2 text-xs bg-[#FAF7F4] px-3.5 py-2.5 rounded-xl border border-[#E5DDD3]">
                <User className="w-4 h-4 text-[#D19650]" />
                <span className="font-bold text-stone-700">
                  Turno: <strong className="text-[#1C1311]">{vendedorActivo}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={exportarVentasExcel}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                title="Descargar reporte diario de ventas en formato Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Exportar Ventas Diarias a Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {mensajeExcelExito && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensajeExcelExito}</span>
            </div>
          )}

          {/* 4 KPIs Superiores Claros (QA-POS-023) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
            <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Total Ventas Mostrador
                </span>
                <DollarSign className="w-4 h-4 text-[#059669]" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#1C1311] mt-1">
                {formatCOP(metricas.totalVentasMostradorCop)}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Facturación directa en sede</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Efectivo en Gaveta
                </span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#059669] mt-1">
                {formatCOP(metricas.sumaEfectivo)}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Ventas pagadas en efectivo</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Transferencias QR
                </span>
                <CreditCard className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-indigo-900 mt-1">
                {formatCOP(metricas.sumaTransferencia)}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Pagos verificados en banco</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1C1311] text-white border-2 border-[#D19650]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D19650]">
                  Cambios y Devoluciones
                </span>
                <RotateCcw className="w-4 h-4 text-[#D19650]" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-white mt-1">
                {metricas.cantidadCambiosDevoluciones} ops · {formatCOP(metricas.sumaCambios)}
              </p>
              <p className="text-[11px] text-[#E7DED2]/80 mt-0.5">
                Saldo neto de excedentes y reintegros
              </p>
            </div>
          </div>
        </header>

        {/* =========================================================================
            BARRA DE FILTROS INTERACTIVA Y COMBINABLE (QA-POS-020)
        ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 mb-5 space-y-3">
          {/* Fila 1: Buscador + Filtro de Periodo */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por consecutivo, cliente, prenda o SKU..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs sm:text-sm font-semibold text-[#1C1311] placeholder:text-stone-400 focus:outline-none focus:border-[#661521]"
              />
            </div>

            {/* Filtro de Periodo */}
            <div className="flex items-center gap-1 bg-[#FAF7F4] p-1 rounded-xl border border-[#D8CFC6] shrink-0">
              <button
                type="button"
                onClick={() => setFiltroPeriodo('HOY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroPeriodo === 'HOY'
                    ? 'bg-[#1C1311] text-[#D19650] shadow-sm'
                    : 'text-stone-600 hover:text-[#1C1311]'
                }`}
              >
                Turno Actual / Hoy
              </button>
              <button
                type="button"
                onClick={() => setFiltroPeriodo('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroPeriodo === 'TODOS'
                    ? 'bg-[#1C1311] text-[#D19650] shadow-sm'
                    : 'text-stone-600 hover:text-[#1C1311]'
                }`}
              >
                Todos los Días
              </button>
            </div>
          </div>

          {/* Fila 2: Filtro por Tipo de Operación + Filtro por Medio de Pago */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-[#EFEAE4]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-stone-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#661521]" />
                <span>Operación:</span>
              </span>
              {(
                [
                  { id: 'TODOS', label: 'Todos' },
                  { id: 'VENTAS', label: 'Ventas Mostrador' },
                  { id: 'CAMBIOS', label: 'Cambios' },
                  { id: 'DEVOLUCIONES', label: 'Devoluciones' },
                  { id: 'WEB', label: 'Pedidos Web' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltroTipo(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    filtroTipo === item.id
                      ? 'bg-[#661521] text-white border-[#661521] shadow-2xs'
                      : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-stone-500 mr-1">
                Medio de Pago:
              </span>
              {(
                [
                  { id: 'TODOS', label: 'Todos' },
                  { id: 'EFECTIVO', label: 'Efectivo' },
                  { id: 'TRANSFERENCIA', label: 'Transferencia' },
                  { id: 'CONTRAENTREGA', label: 'Contraentrega' },
                ] as const
              ).map((medio) => (
                <button
                  key={medio.id}
                  type="button"
                  onClick={() => setFiltroPago(medio.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    filtroPago === medio.id
                      ? 'bg-[#1C1311] text-[#D19650] border-[#1C1311] shadow-2xs'
                      : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
                  }`}
                >
                  {medio.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            TABLA UNIFICADA DE OPERACIONES DE LA SEDE + BARRA INFERIOR DE AUTOSUMA
        ========================================================================= */}
        <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EFEAE4] flex items-center justify-between">
            <h2 className="text-base font-black text-[#1C1311]">
              Operaciones Registradas en {sedeActiva} ({operacionesFiltradas.length})
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              Haz clic en cualquier fila para ver el detalle o reimprimir ticket
            </span>
          </div>

          {operacionesFiltradas.length === 0 ? (
            <div className="p-10 text-center text-stone-500 space-y-2">
              <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
              <p className="font-bold text-sm">
                No hay operaciones registradas en {sedeActiva} para los filtros seleccionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroTipo('TODOS');
                  setFiltroPago('TODOS');
                  setFiltroPeriodo('TODOS');
                }}
                className="text-xs text-[#661521] font-bold underline cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#FAF7F4] border-b border-[#E5DDD3] text-stone-600 font-extrabold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Consecutivo</th>
                    <th className="py-3 px-4">Operación</th>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Prendas / Concepto</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4 text-right">Valor COP</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE4]">
                  {operacionesFiltradas.map((op) => (
                    <tr
                      key={op.uid}
                      onClick={() => setOperacionSeleccionada(op)}
                      className="hover:bg-[#FAF7F4] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-black text-sm text-[#1C1311]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#1C1311] text-[#D19650]">
                          {op.consecutivo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            op.tipo === 'VENTA_MOSTRADOR'
                              ? 'bg-emerald-100 text-[#059669]'
                              : op.tipo === 'PEDIDO_WEB'
                              ? 'bg-sky-100 text-sky-900'
                              : op.tipo === 'DEVOLUCION'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {op.tipo === 'VENTA_MOSTRADOR'
                            ? 'Venta Mostrador'
                            : op.tipo === 'PEDIDO_WEB'
                            ? 'Pedido Web'
                            : op.tipo === 'DEVOLUCION'
                            ? 'Devolución'
                            : 'Cambio'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-700 whitespace-nowrap">
                        {op.fechaHoraTexto}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1C1311]">
                        {op.cliente}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                        {op.resumenPrendas}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                            op.medioPago === 'EFECTIVO'
                              ? 'bg-emerald-100 text-[#059669] border border-emerald-300'
                              : op.medioPago === 'CONTRAENTREGA'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          }`}
                        >
                          {op.medioPago === 'EFECTIVO'
                            ? 'Efectivo'
                            : op.medioPago === 'CONTRAENTREGA'
                            ? 'Contraentrega'
                            : 'Transferencia'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-[#1C1311]">
                        {formatCOP(op.totalCop)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOperacionSeleccionada(op);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#D8CFC6] text-xs font-extrabold text-[#661521] hover:bg-[#661521] hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* =====================================================================
              BARRA INFERIOR DE AUTOSUMA (STICKY FOOTER — QA-POS-020)
          ===================================================================== */}
          <div className="sticky bottom-0 z-10 bg-[#1C1311] text-white border-t-2 border-[#D19650] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#D19650]">
                <Calculator className="w-4 h-4" />
                <span>Registros en vista: {operacionesFiltradas.length}</span>
              </span>
              <span className="font-mono">
                Suma Efectivo: <strong className="text-emerald-300">{formatCOP(metricas.sumaEfectivo)}</strong>
              </span>
              <span className="font-mono">
                Suma Transferencias: <strong className="text-sky-300">{formatCOP(metricas.sumaTransferencia)}</strong>
              </span>
              <span className="font-mono">
                Ajustes Cambios/Devoluciones:{' '}
                <strong className="text-amber-300">{formatCOP(metricas.sumaCambios)}</strong>
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-[#661521] border border-[#D19650] font-mono text-xs sm:text-sm font-black text-white">
              TOTAL AUTOSUMA FILTRADO: {formatCOP(metricas.granTotalNeto)}
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================================
          DRAWER LATERAL DE DETALLE DE OPERACIÓN (VENTA / CAMBIO / PEDIDO WEB)
      ========================================================================= */}
      {operacionSeleccionada && (
        <DetailDrawer
          isOpen={Boolean(operacionSeleccionada)}
          onClose={() => setOperacionSeleccionada(null)}
          title={`Operación ${operacionSeleccionada.consecutivo}`}
          subtitle={`${operacionSeleccionada.cliente} · ${operacionSeleccionada.fechaHoraTexto}`}
          badge={{
            label: operacionSeleccionada.medioPago,
            variant: operacionSeleccionada.medioPago === 'EFECTIVO' ? 'success' : 'info',
          }}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          activityItems={[
            {
              id: 'act-op-1',
              timestamp: operacionSeleccionada.fechaHoraTexto,
              title: `Operación registrada (${operacionSeleccionada.consecutivo})`,
              description: `${operacionSeleccionada.resumenPrendas} · Sede ${sedeActiva}.`,
              user: operacionSeleccionada.vendedor,
              type: 'success',
            },
          ]}
          footerActions={
            <div className="flex flex-col sm:flex-row gap-2">
              {operacionSeleccionada.ventaOriginal && (
                <button
                  type="button"
                  onClick={() => setMostrarModalTicket(true)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#D19650]" />
                  <span>Reimprimir Ticket de Venta (80mm)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setOperacionSeleccionada(null)}
                className="min-h-[46px] px-4 rounded-xl bg-white border border-[#D8CFC6] text-stone-800 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1C1311] block">Detalle de Factura</span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {operacionSeleccionada.consecutivo} • {operacionSeleccionada.fechaHoraTexto}
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-[#059669]">
                {formatCOP(operacionSeleccionada.totalCop)} COP
              </span>
            </div>

            {operacionSeleccionada.ventaOriginal ? (
              <>
                <div className="space-y-2">
                  {operacionSeleccionada.ventaOriginal.prendas.map((prenda, idx) => (
                    <div
                      key={`${prenda.sku}-${idx}`}
                      className="p-3 bg-white rounded-2xl border border-[#E5DDD3] flex items-center justify-between gap-3"
                    >
                      <div>
                        <h5 className="font-bold text-[#1C1311]">{prenda.nombre}</h5>
                        <span className="text-[11px] font-mono text-stone-500">
                          SKU: {prenda.sku} · Talla: {prenda.talla} · {prenda.cantidad}x{' '}
                          {formatCOP(prenda.precioUnitarioCop)}
                        </span>
                      </div>
                      <span className="font-mono font-black text-[#1C1311]">
                        {formatCOP(prenda.totalCop)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-[#FAF7F4] p-3.5 rounded-2xl border border-[#E5DDD3] space-y-2">
                  <div className="flex justify-between text-xs font-medium text-stone-600">
                    <span>Subtotal antes de impuestos:</span>
                    <span className="font-mono">
                      {formatCOP(operacionSeleccionada.ventaOriginal.subtotalCop)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-stone-600">
                    <span>IVA discriminado (19% incluido):</span>
                    <span className="font-mono">
                      {formatCOP(operacionSeleccionada.ventaOriginal.iva19Cop)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E5DDD3] flex justify-between items-baseline">
                    <span className="font-black text-[#1C1311]">Total Pagado:</span>
                    <span className="text-base font-black font-mono text-[#059669]">
                      {formatCOP(operacionSeleccionada.ventaOriginal.totalCop)} COP
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3.5 bg-white rounded-2xl border border-[#E5DDD3] space-y-2">
                <p className="font-semibold text-[#1C1311]">
                  {operacionSeleccionada.resumenPrendas}
                </p>
                {operacionSeleccionada.pedidoWebOriginal && (
                  <div className="flex items-center gap-2 text-stone-600 pt-1">
                    <Truck className="w-4 h-4 text-[#661521]" />
                    <span>
                      Estado logístico: <strong>{operacionSeleccionada.pedidoWebOriginal.estado}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DetailDrawer>
      )}

      {/* =========================================================================
          MODAL DE IMPRESIÓN DE TICKET TÉRMICO 80MM
      ========================================================================= */}
      {mostrarModalTicket && ticketDataParaImprimir && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-h-[92vh] overflow-y-auto">
            <TicketVentaPOS
              ticket={ticketDataParaImprimir}
              onClose={() => setMostrarModalTicket(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PosVentasHistorialPage;
