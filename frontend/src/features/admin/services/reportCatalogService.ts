// frontend/src/features/admin/services/reportCatalogService.ts
/**
 * Catálogo Maestro de los 10 Reportes Estratégicos de FORMA.
 * Conecta los stores reales (posLedgerSync, webOrdersStore, cajaStore, catalogService, adminService)
 * con el motor de Excel ejecutivo (excelEngine).
 */

import {
  getPosRegisteredSales,
  getAllStockDeltas,
  getPosRegisteredExchanges,
} from '../../pos/utils/posLedgerSync';
import {
  getWebOrders,
  mismaSede,
} from '../../pos/utils/webOrdersStore';
import {
  getSesionesCaja,
  resumenSesion,
} from '../../pos/utils/cajaStore';
import { PRODUCTOS_SEMILLA } from '../../storefront/services/catalogService';
import { getStoredTraslados } from './adminService';
import { ReporteExcelConfig } from './excelEngine';

export type CategoriaReporte =
  | 'TODAS'
  | 'VENTAS'
  | 'INVENTARIO'
  | 'CAJA'
  | 'OMNICANAL'
  | 'ABASTECIMIENTO'
  | 'CALIDAD';

export interface ReporteItemCatalogo {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaReporte;
  categoriaNombre: string;
  formato: 'EXCEL' | 'PDF' | 'BI';
  autor: string;
  areaTrabajo: string;
  frecuencia: string;
  iconoColor: string;
  badgeTexto: string;
}

export const CATALOGO_REPORTES: ReporteItemCatalogo[] = [
  {
    id: 'rep-01-ventas-generales',
    codigo: 'REP-VTA-01',
    titulo: 'Ventas Generales y Facturación',
    descripcion: 'Consolidado integral de facturación POS y web con desglose legal de IVA 19%, bases gravables y descuentos.',
    categoria: 'VENTAS',
    categoriaNombre: 'Ventas y Facturación',
    formato: 'EXCEL',
    autor: 'Contabilidad General',
    areaTrabajo: 'Finanzas',
    frecuencia: 'Diario / Semanal',
    iconoColor: '#27845C',
    badgeTexto: 'XLSX Ejecutivo',
  },
  {
    id: 'rep-02-ventas-sucursal',
    codigo: 'REP-VTA-02',
    titulo: 'Ventas Comparativas por Sucursal',
    descripcion: 'Comparación de ingresos, tickets promedio y distribución porcentual entre puntos físicos y bodega central.',
    categoria: 'VENTAS',
    categoriaNombre: 'Ventas y Facturación',
    formato: 'EXCEL',
    autor: 'Gerencia Comercial',
    areaTrabajo: 'Dirección Retail',
    frecuencia: 'Semanal / Mensual',
    iconoColor: '#741C2B',
    badgeTexto: 'XLSX Ejecutivo',
  },
  {
    id: 'rep-03-ventas-producto',
    codigo: 'REP-VTA-03',
    titulo: 'Rendimiento por Producto y Categoría',
    descripcion: 'Ranking de prendas más vendidas, rotación de colecciones (Ropa, Cosméticos, Artesanías) e ingresos.',
    categoria: 'VENTAS',
    categoriaNombre: 'Ventas y Facturación',
    formato: 'EXCEL',
    autor: 'Equipo de Mercadeo',
    areaTrabajo: 'Comercial',
    frecuencia: 'Semanal',
    iconoColor: '#C49A68',
    badgeTexto: 'XLSX Ejecutivo',
  },
  {
    id: 'rep-04-inventario-multisede',
    codigo: 'REP-INV-01',
    titulo: 'Inventario y Existencias Multisede',
    descripcion: 'Auditoría de saldos físicos, disponibles, mercancía reservada dura/blanda y valorización de stock en COP.',
    categoria: 'INVENTARIO',
    categoriaNombre: 'Inventario y Kardex',
    formato: 'EXCEL',
    autor: 'Control de Inventarios',
    areaTrabajo: 'Logística',
    frecuencia: 'Diario',
    iconoColor: '#27845C',
    badgeTexto: 'XLSX Ejecutivo',
  },
  {
    id: 'rep-05-stock-bajo',
    codigo: 'REP-INV-02',
    titulo: 'Alertas de Stock Bajo y Reposición',
    descripcion: 'Detección automática de referencias bajo el umbral mínimo que requieren solicitud de mercancía a Central.',
    categoria: 'INVENTARIO',
    categoriaNombre: 'Inventario y Kardex',
    formato: 'EXCEL',
    autor: 'Abastecimiento de Puntos',
    areaTrabajo: 'Operaciones',
    frecuencia: 'Bidiario',
    iconoColor: '#B77925',
    badgeTexto: 'XLSX Ejecutivo',
  },
  {
    id: 'rep-06-kardex-movimientos',
    codigo: 'REP-AUD-01',
    titulo: 'Kardex y Trazabilidad de Movimientos',
    descripcion: 'Historial inmutable de operaciones (entradas, ventas POS, traslados entre sedes y ajustes autorizados).',
    categoria: 'INVENTARIO',
    categoriaNombre: 'Inventario y Kardex',
    formato: 'EXCEL',
    autor: 'Auditoría Interna',
    areaTrabajo: 'Control Interno',
    frecuencia: 'Mensual',
    iconoColor: '#741C2B',
    badgeTexto: 'XLSX Auditoría',
  },
  {
    id: 'rep-07-cierre-cajas',
    codigo: 'REP-CAJ-01',
    titulo: 'Cierre y Arqueo Ciego de Cajas',
    descripcion: 'Auditoría de turnos, bases iniciales, retiros de efectivo, cuadre ciego (esperado vs contado) y diferencias.',
    categoria: 'CAJA',
    categoriaNombre: 'Caja y Tesorería',
    formato: 'EXCEL',
    autor: 'Tesorería',
    areaTrabajo: 'Tesorería',
    frecuencia: 'Por Turno / Diario',
    iconoColor: '#27845C',
    badgeTexto: 'XLSX Financiero',
  },
  {
    id: 'rep-08-pedidos-web',
    codigo: 'REP-WEB-01',
    titulo: 'Pedidos Web, Despachos y Recaudo',
    descripcion: 'Trazabilidad de órdenes omnicanal, guías de transportadora y control de pagos contraentrega pendientes.',
    categoria: 'OMNICANAL',
    categoriaNombre: 'Omnicanal y Web',
    formato: 'EXCEL',
    autor: 'Coordinación E-commerce',
    areaTrabajo: 'Canales Digitales',
    frecuencia: 'Diario',
    iconoColor: '#741C2B',
    badgeTexto: 'XLSX Operativo',
  },
  {
    id: 'rep-09-compras-abastecimiento',
    codigo: 'REP-CMP-01',
    titulo: 'Compras a Taller y Abastecimiento',
    descripcion: 'Control de órdenes de confección, costos unitarios de adquisición, insumos y recepciones de taller.',
    categoria: 'ABASTECIMIENTO',
    categoriaNombre: 'Compras y Proveedores',
    formato: 'EXCEL',
    autor: 'Jefatura de Producción',
    areaTrabajo: 'Taller Central',
    frecuencia: 'Quincenal',
    iconoColor: '#C49A68',
    badgeTexto: 'XLSX Abastecimiento',
  },
  {
    id: 'rep-10-cambios-devoluciones',
    codigo: 'REP-DEV-01',
    titulo: 'Auditoría de Cambios y Devoluciones',
    descripcion: 'Balance de cambios mano a mano, clasificación de reingresos vendibles vs averías no vendibles e impacto en gaveta.',
    categoria: 'CALIDAD',
    categoriaNombre: 'Garantías y Operaciones',
    formato: 'EXCEL',
    autor: 'Atención y Calidad',
    areaTrabajo: 'Servicio al Cliente',
    frecuencia: 'Semanal',
    iconoColor: '#B77925',
    badgeTexto: 'XLSX Calidad',
  },
];

const SEDES_CONOCIDAS = [
  'Punto Centro',
  'Punto Caobos',
  'Punto Ocaña',
  'Punto Bucaramanga',
  'Bodega Central',
];

/**
 * Filtra las transacciones según periodo y sede.
 */
function filtrarPorPeriodoYSede(
  fechaIso: string,
  sedeTransaccion: string,
  periodo: 'HOY' | '7DIAS' | 'ESTE_MES' | 'TODO',
  sedeFiltro: string
): boolean {
  if (sedeFiltro !== 'Todas las Sedes (Consolidado)' && !mismaSede(sedeTransaccion, sedeFiltro)) {
    return false;
  }
  if (periodo === 'TODO') return true;

  const hoyBogotaStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  const fechaBogotaStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(
    new Date(fechaIso)
  );

  if (periodo === 'HOY') {
    return fechaBogotaStr === hoyBogotaStr;
  }
  if (periodo === 'ESTE_MES') {
    return fechaBogotaStr.slice(0, 7) === hoyBogotaStr.slice(0, 7);
  }
  if (periodo === '7DIAS') {
    const tTrans = new Date(fechaBogotaStr).getTime();
    const tHoy = new Date(hoyBogotaStr).getTime();
    const diasDiff = (tHoy - tTrans) / (1000 * 3600 * 24);
    return diasDiff >= 0 && diasDiff <= 7;
  }
  return true;
}

/**
 * Construye la configuración de exportación para cualquiera de los 10 reportes estratégicos.
 */
export function construirConfigReporte(
  reporteId: string,
  periodo: 'HOY' | '7DIAS' | 'ESTE_MES' | 'TODO' = 'ESTE_MES',
  sedeFiltro: string = 'Todas las Sedes (Consolidado)',
  modoContenido: 'completo' | 'solo_resumen' | 'solo_detalle' = 'completo'
): ReporteExcelConfig {
  const meta = CATALOGO_REPORTES.find((r) => r.id === reporteId) || CATALOGO_REPORTES[0];
  const periodoTextos: Record<string, string> = {
    HOY: 'Hoy (Fecha Oficial Colombia)',
    '7DIAS': 'Últimos 7 días',
    ESTE_MES: 'Mes en curso (Este Mes)',
    TODO: 'Todo el Historial Registrado',
  };

  const sales = getPosRegisteredSales();
  const webOrders = getWebOrders();
  const cashSessions = getSesionesCaja();
  const exchanges = getPosRegisteredExchanges();
  const traslados = getStoredTraslados();
  const deltas = getAllStockDeltas();

  // =========================================================================
  // 1. REPORTE: VENTAS GENERALES Y FACTURACIÓN (REP-VTA-01)
  // =========================================================================
  if (reporteId === 'rep-01-ventas-generales') {
    const ventasFiltradas = sales.filter((s) =>
      filtrarPorPeriodoYSede(s.fechaIso || new Date().toISOString(), s.sede || 'Punto Centro', periodo, sedeFiltro)
    );
    const webFiltrados = webOrders.filter(
      (w) =>
        w.estadoCobro === 'PAGADO' &&
        filtrarPorPeriodoYSede(w.fechaCreacionIso, w.sedeAsignada, periodo, sedeFiltro)
    );

    const totalVentasPOS = ventasFiltradas.reduce((acc, v) => acc + (v.totalCop || 0), 0);
    const totalVentasWeb = webFiltrados.reduce((acc, w) => acc + (w.totalCOP || 0), 0);
    const granTotal = totalVentasPOS + totalVentasWeb;
    const baseGravable = Math.round(granTotal / 1.19);
    const iva19 = granTotal - baseGravable;
    const numTransacciones = ventasFiltradas.length + webFiltrados.length;
    const ticketPromedio = numTransacciones > 0 ? Math.round(granTotal / numTransacciones) : 0;

    const filasDetalle: Record<string, any>[] = [];
    ventasFiltradas.forEach((v) => {
      filasDetalle.push({
        consecutivo: v.consecutivo,
        fecha: v.fechaHora || 'Hoy',
        canal: 'Punto Físico (POS)',
        sede: v.sede || 'Punto Centro',
        vendedor: v.vendedor || 'Cajero',
        cliente: v.cliente || 'Consumidor Final',
        medioPago: v.medioPago,
        baseGravableCop: Math.round((v.totalCop || 0) / 1.19),
        ivaCop: (v.totalCop || 0) - Math.round((v.totalCop || 0) / 1.19),
        totalCop: v.totalCop,
      });
    });
    webFiltrados.forEach((w) => {
      filasDetalle.push({
        consecutivo: `#${w.codigo}`,
        fecha: new Date(w.fechaCreacionIso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
        canal: 'Tienda Web (E-commerce)',
        sede: w.sedeAsignada,
        vendedor: 'Canal Digital',
        cliente: w.cliente,
        medioPago: w.metodoPagoTexto,
        baseGravableCop: Math.round((w.totalCOP || 0) / 1.19),
        ivaCop: (w.totalCOP || 0) - Math.round((w.totalCOP || 0) / 1.19),
        totalCop: w.totalCOP,
      });
    });

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        { etiqueta: 'Total Ventas Netas', valor: `$ ${granTotal.toLocaleString('es-CO')}` },
        { etiqueta: 'Transacciones', valor: numTransacciones },
        { etiqueta: 'Ticket Promedio', valor: `$ ${ticketPromedio.toLocaleString('es-CO')}` },
        { etiqueta: 'IVA Recaudado (19%)', valor: `$ ${iva19.toLocaleString('es-CO')}` },
      ],
      resumenTablas: [
        {
          titulo: 'Distribución por Canal de Venta',
          columnas: ['Canal', 'Transacciones', 'Total Facturado COP', 'Participación %'],
          filas: [
            [
              'Punto Físico (POS)',
              ventasFiltradas.length,
              totalVentasPOS,
              granTotal > 0 ? `${((totalVentasPOS / granTotal) * 100).toFixed(1)}%` : '0%',
            ],
            [
              'Tienda Web (E-commerce)',
              webFiltrados.length,
              totalVentasWeb,
              granTotal > 0 ? `${((totalVentasWeb / granTotal) * 100).toFixed(1)}%` : '0%',
            ],
          ],
        },
      ],
      detalleColumnas: [
        { header: 'Consecutivo', key: 'consecutivo', width: 16 },
        { header: 'Fecha', key: 'fecha', width: 18 },
        { header: 'Canal', key: 'canal', width: 22 },
        { header: 'Sede', key: 'sede', width: 24 },
        { header: 'Vendedor / Responsable', key: 'vendedor', width: 20 },
        { header: 'Cliente', key: 'cliente', width: 22 },
        { header: 'Medio de Pago', key: 'medioPago', width: 18 },
        { header: 'Base Gravable COP', key: 'baseGravableCop', width: 18, tipo: 'moneda' },
        { header: 'IVA 19% COP', key: 'ivaCop', width: 16, tipo: 'moneda' },
        { header: 'Total COP', key: 'totalCop', width: 18, tipo: 'moneda' },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // =========================================================================
  // 2. REPORTE: VENTAS COMPARATIVAS POR SUCURSAL (REP-VTA-02)
  // =========================================================================
  if (reporteId === 'rep-02-ventas-sucursal') {
    const ventasFiltradas = sales.filter((s) =>
      filtrarPorPeriodoYSede(s.fechaIso || new Date().toISOString(), s.sede || 'Punto Centro', periodo, sedeFiltro)
    );
    const webFiltrados = webOrders.filter(
      (w) =>
        w.estadoCobro === 'PAGADO' &&
        filtrarPorPeriodoYSede(w.fechaCreacionIso, w.sedeAsignada, periodo, sedeFiltro)
    );

    const granTotal =
      ventasFiltradas.reduce((acc, v) => acc + (v.totalCop || 0), 0) +
      webFiltrados.reduce((acc, w) => acc + (w.totalCOP || 0), 0);
    const totalTransacciones = ventasFiltradas.length + webFiltrados.length;

    // Métricas por sede
    const resumenSedes = SEDES_CONOCIDAS.map((sedeNom) => {
      const vSede = ventasFiltradas.filter((s) => mismaSede(s.sede || '', sedeNom));
      const wSede = webFiltrados.filter((w) => mismaSede(w.sedeAsignada, sedeNom));
      const efec = vSede
        .filter((s) => s.medioPago === 'EFECTIVO')
        .reduce((acc, s) => acc + (s.totalCop || 0), 0);
      const transf = vSede
        .filter((s) => s.medioPago === 'TRANSFERENCIA')
        .reduce((acc, s) => acc + (s.totalCop || 0), 0);
      const web = wSede.reduce((acc, w) => acc + (w.totalCOP || 0), 0);
      const totalSede = efec + transf + web;
      const transaccionesSede = vSede.length + wSede.length;
      const unidades =
        vSede.reduce((acc, s) => acc + (s.items || s.prendas || []).reduce((a, it) => a + (it.cantidad || 1), 0), 0) +
        wSede.reduce((acc, w) => acc + w.productos.reduce((a, it) => a + (it.cantidad || 1), 0), 0);
      const part = granTotal > 0 ? (totalSede / granTotal) * 100 : 0;

      return {
        sede: sedeNom,
        transacciones: transaccionesSede,
        unidades,
        efectivoCop: efec,
        transferenciaCop: transf,
        webCop: web,
        totalCop: totalSede,
        participacionPct: `${part.toFixed(1)}%`,
        participacionNum: part,
      };
    });

    resumenSedes.sort((a, b) => b.totalCop - a.totalCop);
    const sedeLider = resumenSedes[0]?.totalCop > 0 ? resumenSedes[0] : null;
    const sedesConVenta = resumenSedes.filter((s) => s.totalCop > 0).length;
    const promedioPorSede = sedesConVenta > 0 ? Math.round(granTotal / sedesConVenta) : 0;

    const filasDetalle: Record<string, any>[] = [];
    ventasFiltradas.forEach((v) => {
      const sede = v.sede || 'Punto Centro';
      const totSede = resumenSedes.find((s) => mismaSede(s.sede, sede))?.totalCop || 1;
      const uds = (v.items || v.prendas || []).reduce((a, it) => a + (it.cantidad || 1), 0);
      filasDetalle.push({
        consecutivo: v.consecutivo,
        fecha: v.fechaHora || 'Hoy',
        sede,
        canal: 'Punto Físico (POS)',
        vendedor: v.vendedor || 'Cajero',
        cliente: v.cliente || 'Consumidor Final',
        medioPago: v.medioPago,
        unidades: uds,
        totalCop: v.totalCop,
        aporteSedePct: totSede > 0 ? `${(((v.totalCop || 0) / totSede) * 100).toFixed(1)}%` : '0%',
      });
    });
    webFiltrados.forEach((w) => {
      const sede = w.sedeAsignada;
      const totSede = resumenSedes.find((s) => mismaSede(s.sede, sede))?.totalCop || 1;
      const uds = w.productos.reduce((a, it) => a + (it.cantidad || 1), 0);
      filasDetalle.push({
        consecutivo: `#${w.codigo}`,
        fecha: new Date(w.fechaCreacionIso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
        sede,
        canal: 'Tienda Web (E-commerce)',
        vendedor: 'Canal Digital',
        cliente: w.cliente,
        medioPago: w.metodoPagoTexto,
        unidades: uds,
        totalCop: w.totalCOP,
        aporteSedePct: totSede > 0 ? `${((w.totalCOP / totSede) * 100).toFixed(1)}%` : '0%',
      });
    });

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        {
          etiqueta: 'Sede Líder en Ventas',
          valor: sedeLider ? sedeLider.sede : 'Sin ventas en periodo',
          subtitulo: sedeLider ? `$ ${sedeLider.totalCop.toLocaleString('es-CO')} (${sedeLider.participacionPct})` : undefined,
        },
        { etiqueta: 'Total Multisede', valor: `$ ${granTotal.toLocaleString('es-CO')}` },
        { etiqueta: 'Transacciones Totales', valor: totalTransacciones },
        { etiqueta: 'Promedio por Sucursal', valor: `$ ${promedioPorSede.toLocaleString('es-CO')}` },
      ],
      resumenTablas: [
        {
          titulo: 'Comparativa de Facturación por Sucursal',
          columnas: [
            'Sede / Sucursal',
            'Transacciones',
            'Unidades',
            'Efectivo COP',
            'Transferencia COP',
            'Venta Web COP',
            'Total Facturado COP',
            'Participación %',
          ],
          filas: resumenSedes.map((s) => [
            s.sede,
            s.transacciones,
            s.unidades,
            s.efectivoCop,
            s.transferenciaCop,
            s.webCop,
            s.totalCop,
            s.participacionPct,
          ]),
        },
      ],
      detalleColumnas: [
        { header: 'Consecutivo', key: 'consecutivo', width: 16 },
        { header: 'Fecha', key: 'fecha', width: 18 },
        { header: 'Sede', key: 'sede', width: 22 },
        { header: 'Canal', key: 'canal', width: 20 },
        { header: 'Vendedor', key: 'vendedor', width: 20 },
        { header: 'Cliente', key: 'cliente', width: 22 },
        { header: 'Medio de Pago', key: 'medioPago', width: 18 },
        { header: 'Unidades', key: 'unidades', width: 12, tipo: 'numero' },
        { header: 'Total COP', key: 'totalCop', width: 18, tipo: 'moneda' },
        { header: 'Aporte a Sede', key: 'aporteSedePct', width: 16 },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // =========================================================================
  // 3. REPORTE: RENDIMIENTO POR PRODUCTO Y CATEGORÍA (REP-VTA-03)
  // =========================================================================
  if (reporteId === 'rep-03-ventas-producto') {
    const ventasFiltradas = sales.filter((s) =>
      filtrarPorPeriodoYSede(s.fechaIso || new Date().toISOString(), s.sede || 'Punto Centro', periodo, sedeFiltro)
    );
    const webFiltrados = webOrders.filter(
      (w) =>
        w.estadoCobro === 'PAGADO' &&
        filtrarPorPeriodoYSede(w.fechaCreacionIso, w.sedeAsignada, periodo, sedeFiltro)
    );

    const mapaSkus = new Map<
      string,
      {
        sku: string;
        prenda: string;
        categoria: string;
        talla: string;
        color: string;
        unidades: number;
        totalCop: number;
        precioUnitarioCop: number;
      }
    >();

    const mapaCategorias = new Map<
      string,
      {
        categoria: string;
        unidades: number;
        totalCop: number;
      }
    >();

    // Agregar ventas POS
    ventasFiltradas.forEach((v) => {
      const items = v.items || v.prendas || [];
      items.forEach((it) => {
        const sku = it.sku || 'DESCONOCIDO';
        const cant = it.cantidad || 1;
        const precioUnit = it.precioUnitarioCop || it.precioUnitarioCOP || (it.totalCop ? Math.round(it.totalCop / cant) : 0);
        const subtotal = it.totalCop || precioUnit * cant;
        const cat = it.categoria || 'Ropa';

        const actualSku = mapaSkus.get(sku) || {
          sku,
          prenda: it.nombre || 'Prenda sin nombre',
          categoria: cat,
          talla: it.talla || 'U',
          color: it.color || 'Estándar',
          unidades: 0,
          totalCop: 0,
          precioUnitarioCop: precioUnit,
        };
        actualSku.unidades += cant;
        actualSku.totalCop += subtotal;
        mapaSkus.set(sku, actualSku);

        const actualCat = mapaCategorias.get(cat) || {
          categoria: cat,
          unidades: 0,
          totalCop: 0,
        };
        actualCat.unidades += cant;
        actualCat.totalCop += subtotal;
        mapaCategorias.set(cat, actualCat);
      });
    });

    // Agregar pedidos web
    webFiltrados.forEach((w) => {
      w.productos.forEach((p) => {
        const sku = p.sku;
        const cant = p.cantidad || 1;
        const subtotal = (p.precioUnitarioCOP || 0) * cant;
        const cat = 'Ropa'; // Fallback por defecto para catálogo textil

        const actualSku = mapaSkus.get(sku) || {
          sku,
          prenda: p.nombre,
          categoria: cat,
          talla: p.talla || 'U',
          color: p.color || 'Estándar',
          unidades: 0,
          totalCop: 0,
          precioUnitarioCop: p.precioUnitarioCOP,
        };
        actualSku.unidades += cant;
        actualSku.totalCop += subtotal;
        mapaSkus.set(sku, actualSku);

        const actualCat = mapaCategorias.get(cat) || {
          categoria: cat,
          unidades: 0,
          totalCop: 0,
        };
        actualCat.unidades += cant;
        actualCat.totalCop += subtotal;
        mapaCategorias.set(cat, actualCat);
      });
    });

    const listaSkus = Array.from(mapaSkus.values());
    listaSkus.sort((a, b) => b.unidades - a.unidades || b.totalCop - a.totalCop);

    const listaCategorias = Array.from(mapaCategorias.values());
    listaCategorias.sort((a, b) => b.totalCop - a.totalCop);

    const totalUnidadesVendidas = listaSkus.reduce((acc, s) => acc + s.unidades, 0);
    const totalFacturadoPrendas = listaSkus.reduce((acc, s) => acc + s.totalCop, 0);

    const prendaLider = listaSkus[0] || null;
    const catLider = listaCategorias[0] || null;

    const filasDetalle = listaSkus.map((s) => ({
      sku: s.sku,
      prenda: s.prenda,
      categoria: s.categoria,
      talla: s.talla,
      color: s.color,
      unidades: s.unidades,
      precioUnitarioCop: s.precioUnitarioCop,
      totalCop: s.totalCop,
      participacionPct: totalFacturadoPrendas > 0 ? `${(((s.totalCop) / totalFacturadoPrendas) * 100).toFixed(1)}%` : '0%',
    }));

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        {
          etiqueta: 'Prenda Más Vendida',
          valor: prendaLider ? prendaLider.prenda : 'Sin ventas registradas',
          subtitulo: prendaLider ? `${prendaLider.unidades} unidades • $ ${prendaLider.totalCop.toLocaleString('es-CO')}` : undefined,
        },
        {
          etiqueta: 'Categoría Líder',
          valor: catLider ? catLider.categoria : 'Sin ventas registradas',
          subtitulo: catLider ? `$ ${catLider.totalCop.toLocaleString('es-CO')} (${((catLider.totalCop / (totalFacturadoPrendas || 1)) * 100).toFixed(1)}%)` : undefined,
        },
        { etiqueta: 'Total Unidades Vendidas', valor: totalUnidadesVendidas },
        { etiqueta: 'Ingresos por Prendas', valor: `$ ${totalFacturadoPrendas.toLocaleString('es-CO')}` },
      ],
      resumenTablas: [
        {
          titulo: 'Top 5 Prendas con Mayor Demanda',
          columnas: [
            'Ranking',
            'Prenda / Referencia',
            'SKU',
            'Categoría',
            'Unidades Vendidas',
            'Total Facturado COP',
            'Aporte %',
          ],
          filas: listaSkus.slice(0, 5).map((s, idx) => [
            `#${idx + 1}`,
            s.prenda,
            s.sku,
            s.categoria,
            s.unidades,
            s.totalCop,
            totalFacturadoPrendas > 0 ? `${((s.totalCop / totalFacturadoPrendas) * 100).toFixed(1)}%` : '0%',
          ]),
        },
        {
          titulo: 'Participación por Categoría de Producto',
          columnas: ['Categoría', 'Unidades Vendidas', 'Ingresos COP', 'Participación %'],
          filas: listaCategorias.map((c) => [
            c.categoria,
            c.unidades,
            c.totalCop,
            totalFacturadoPrendas > 0 ? `${((c.totalCop / totalFacturadoPrendas) * 100).toFixed(1)}%` : '0%',
          ]),
        },
      ],
      detalleColumnas: [
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Prenda / Referencia', key: 'prenda', width: 28 },
        { header: 'Categoría', key: 'categoria', width: 16 },
        { header: 'Talla', key: 'talla', width: 10 },
        { header: 'Color', key: 'color', width: 16 },
        { header: 'Unidades Vendidas', key: 'unidades', width: 16, tipo: 'numero' },
        { header: 'Precio Unitario COP', key: 'precioUnitarioCop', width: 18, tipo: 'moneda' },
        { header: 'Total Facturado COP', key: 'totalCop', width: 20, tipo: 'moneda' },
        { header: 'Participación %', key: 'participacionPct', width: 16 },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // =========================================================================
  // 4 & 5. REPORTES: INVENTARIO MULTISEDE (REP-INV-01) Y STOCK BAJO (REP-INV-02)
  // =========================================================================
  if (reporteId === 'rep-04-inventario-multisede' || reporteId === 'rep-05-stock-bajo') {
    const filasDetalle: Record<string, any>[] = [];
    const sedesAProcesar =
      sedeFiltro === 'Todas las Sedes (Consolidado)'
        ? ['Bodega Central', 'Punto Centro', 'Punto Caobos', 'Punto Ocaña', 'Punto Bucaramanga']
        : [sedeFiltro];

    let totalUnidadesFisicas = 0;
    let totalUnidadesDisponibles = 0;
    let totalValorizadoCop = 0;
    let totalEnAlerta = 0;
    let totalAgotadas = 0;
    let totalSugeridoReposicion = 0;

    const mapaSedesInv = new Map<string, { sede: string; referencias: number; fisico: number; disponible: number; valorizado: number; alertas: number }>();
    const mapaCatInv = new Map<string, { categoria: string; referencias: number; fisico: number; valorizado: number }>();

    PRODUCTOS_SEMILLA.forEach((prod) => {
      prod.variantes.forEach((v) => {
        sedesAProcesar.forEach((sede) => {
          const deltaKey = sede.includes('Bodega') ? `BODEGA::${v.sku}` : v.sku;
          const delta = deltas[deltaKey] || 0;
          const baseStock =
            (v.stockPorSede as any)?.[sede] ??
            (sede.includes('Bodega') ? (v.stockDisponible ?? 0) : 0);
          const fisico = Math.max(0, baseStock + delta);
          const resBlando = 0;
          const resDuro = 0;
          const noVendible = 0;
          const disponible = Math.max(0, fisico - resDuro);
          const umbral = 4;
          const enAlerta = disponible <= umbral;
          const agotado = disponible === 0;
          const sugerido = Math.max(0, 8 - disponible);

          if (reporteId === 'rep-05-stock-bajo' && !enAlerta) {
            return;
          }

          const precioVariante = v.precioVentaCop || 0;
          totalUnidadesFisicas += fisico;
          totalUnidadesDisponibles += disponible;
          totalValorizadoCop += fisico * precioVariante;
          if (enAlerta) totalEnAlerta += 1;
          if (agotado) totalAgotadas += 1;
          totalSugeridoReposicion += sugerido;

          // Acumuladores para tablas de resumen
          const sAcc = mapaSedesInv.get(sede) || { sede, referencias: 0, fisico: 0, disponible: 0, valorizado: 0, alertas: 0 };
          sAcc.referencias += 1;
          sAcc.fisico += fisico;
          sAcc.disponible += disponible;
          sAcc.valorizado += fisico * precioVariante;
          if (enAlerta) sAcc.alertas += 1;
          mapaSedesInv.set(sede, sAcc);

          const cAcc = mapaCatInv.get(prod.categoriaNombre) || { categoria: prod.categoriaNombre, referencias: 0, fisico: 0, valorizado: 0 };
          cAcc.referencias += 1;
          cAcc.fisico += fisico;
          cAcc.valorizado += fisico * precioVariante;
          mapaCatInv.set(prod.categoriaNombre, cAcc);

          filasDetalle.push({
            sede,
            sku: v.sku,
            producto: prod.nombre,
            categoria: prod.categoriaNombre,
            talla: v.talla,
            color: v.color,
            fisico,
            disponible,
            resBlando,
            resDuro,
            noVendible,
            precioUnitarioCop: precioVariante,
            valorizadoCop: fisico * precioVariante,
            umbralMinimo: umbral,
            sugeridoReponer: sugerido,
            estadoAlerta: agotado ? 'AGOTADO' : enAlerta ? 'CRÍTICO' : 'ÓPTIMO',
          });
        });
      });
    });

    if (reporteId === 'rep-05-stock-bajo') {
      filasDetalle.sort((a, b) => a.disponible - b.disponible || b.sugeridoReponer - a.sugeridoReponer);
      const sedesConAlertaCount = Array.from(mapaSedesInv.values()).filter((s) => s.alertas > 0).length;

      return {
        tituloReporte: meta.titulo,
        codigoReporte: meta.codigo,
        periodoTexto: 'Existencias Actuales en Tiempo Real',
        sedeTexto: sedeFiltro,
        autorTexto: meta.autor,
        modoContenido,
        kpis: [
          { etiqueta: 'Referencias en Alerta', valor: totalEnAlerta },
          { etiqueta: 'Variantes Agotadas (0 Stock)', valor: totalAgotadas },
          { etiqueta: 'Sugerido Reposición (Uds)', valor: totalSugeridoReposicion },
          { etiqueta: 'Sedes con Alerta', valor: `${sedesConAlertaCount} de ${sedesAProcesar.length}` },
        ],
        resumenTablas: [
          {
            titulo: 'Alertas de Reposición por Sucursal',
            columnas: ['Sede / Sucursal', 'Referencias en Alerta', 'Unidades Disponibles', 'Sugerido a Central (Uds)'],
            filas: Array.from(mapaSedesInv.values())
              .filter((s) => s.alertas > 0)
              .map((s) => [s.sede, s.alertas, s.disponible, Math.max(0, s.alertas * 8 - s.disponible)]),
          },
        ],
        detalleColumnas: [
          { header: 'Sede', key: 'sede', width: 22 },
          { header: 'SKU', key: 'sku', width: 16 },
          { header: 'Producto', key: 'producto', width: 26 },
          { header: 'Categoría', key: 'categoria', width: 16 },
          { header: 'Talla', key: 'talla', width: 10 },
          { header: 'Color', key: 'color', width: 16 },
          { header: 'Stock Disponible', key: 'disponible', width: 16, tipo: 'numero' },
          { header: 'Umbral Mínimo', key: 'umbralMinimo', width: 14, tipo: 'numero' },
          { header: 'Sugerido Reponer', key: 'sugeridoReponer', width: 16, tipo: 'numero' },
          { header: 'Prioridad', key: 'estadoAlerta', width: 14 },
        ],
        detalleFilas: filasDetalle,
      };
    }

    // REP-INV-01: Inventario Multisede Consolidado
    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: 'Existencias Actuales en Tiempo Real',
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        { etiqueta: 'Total Unidades Físicas', valor: totalUnidadesFisicas },
        { etiqueta: 'Unidades Disponibles', valor: totalUnidadesDisponibles },
        { etiqueta: 'Valorizado Total', valor: `$ ${totalValorizadoCop.toLocaleString('es-CO')}` },
        { etiqueta: 'Variantes Evaluadas', valor: filasDetalle.length },
      ],
      resumenTablas: [
        {
          titulo: 'Consolidado de Stock y Valorización por Sede',
          columnas: ['Sede / Sucursal', 'Referencias', 'Unidades Físicas', 'Unidades Disponibles', 'Valorizado Total COP'],
          filas: Array.from(mapaSedesInv.values()).map((s) => [
            s.sede,
            s.referencias,
            s.fisico,
            s.disponible,
            s.valorizado,
          ]),
        },
        {
          titulo: 'Distribución de Inventario por Categoría',
          columnas: ['Categoría', 'Referencias', 'Unidades Físicas', 'Valorizado Total COP', '% del Inventario'],
          filas: Array.from(mapaCatInv.values()).map((c) => [
            c.categoria,
            c.referencias,
            c.fisico,
            c.valorizado,
            totalValorizadoCop > 0 ? `${((c.valorizado / totalValorizadoCop) * 100).toFixed(1)}%` : '0%',
          ]),
        },
      ],
      detalleColumnas: [
        { header: 'Sede', key: 'sede', width: 22 },
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Producto', key: 'producto', width: 26 },
        { header: 'Categoría', key: 'categoria', width: 16 },
        { header: 'Talla', key: 'talla', width: 10 },
        { header: 'Color', key: 'color', width: 16 },
        { header: 'Físico', key: 'fisico', width: 12, tipo: 'numero' },
        { header: 'Disponible', key: 'disponible', width: 14, tipo: 'numero' },
        { header: 'No Vendible', key: 'noVendible', width: 14, tipo: 'numero' },
        { header: 'Precio Unitario COP', key: 'precioUnitarioCop', width: 18, tipo: 'moneda' },
        { header: 'Valorizado COP', key: 'valorizadoCop', width: 20, tipo: 'moneda' },
        { header: 'Estado', key: 'estadoAlerta', width: 14 },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // =========================================================================
  // 6. REPORTE: KARDEX Y TRAZABILIDAD DE MOVIMIENTOS (REP-AUD-01)
  // =========================================================================
  if (reporteId === 'rep-06-kardex-movimientos') {
    const movimientos: Record<string, any>[] = [];

    // 1. Salidas por Ventas POS
    sales.forEach((s) => {
      const fecha = s.fechaHora || 'Hoy';
      const fechaIso = s.fechaIso || new Date().toISOString();
      const sede = s.sede || 'Punto Centro';
      if (!filtrarPorPeriodoYSede(fechaIso, sede, periodo, sedeFiltro)) return;

      const items = s.items || s.prendas || [];
      items.forEach((it) => {
        movimientos.push({
          fecha,
          fechaIso,
          tipoOperacion: 'VENTA_POS',
          documento: s.consecutivo,
          sede,
          sku: it.sku,
          prenda: it.nombre,
          naturaleza: 'SALIDA (-)',
          cantidad: it.cantidad || 1,
          concepto: `Venta POS en Mostrador a ${s.cliente || 'Consumidor Final'}`,
          responsable: s.vendedor || 'Cajero',
        });
      });
    });

    // 2. Salidas por Despachos Web
    webOrders.forEach((w) => {
      const fechaIso = w.fechaCreacionIso;
      const sede = w.sedeAsignada;
      if (!filtrarPorPeriodoYSede(fechaIso, sede, periodo, sedeFiltro)) return;

      w.productos.forEach((p) => {
        movimientos.push({
          fecha: new Date(fechaIso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
          fechaIso,
          tipoOperacion: 'DESPACHO_WEB',
          documento: `#${w.codigo}`,
          sede,
          sku: p.sku,
          prenda: p.nombre,
          naturaleza: 'SALIDA (-)',
          cantidad: p.cantidad || 1,
          concepto: `Despacho Web a ${w.ciudadDestino} (${w.cliente})`,
          responsable: 'Coordinación E-commerce',
        });
      });
    });

    // 3. Reingresos y Averías por Cambios POS
    exchanges.forEach((e) => {
      const fechaIso = e.fechaIso || new Date().toISOString();
      const sede = e.sede || 'Punto Centro';
      if (!filtrarPorPeriodoYSede(fechaIso, sede, periodo, sedeFiltro)) return;

      // Prenda entregada (salida)
      movimientos.push({
        fecha: e.fecha || 'Hoy',
        fechaIso,
        tipoOperacion: 'CAMBIO_ENTREGA',
        documento: e.id,
        sede,
        sku: e.prendaEntregadaSku,
        prenda: e.prendaEntregada,
        naturaleza: 'SALIDA (-)',
        cantidad: 1,
        concepto: `Prenda entregada en cambio (Factura ${e.consecutivoFactura})`,
        responsable: e.vendedor || 'Cajero',
      });

      // Prenda devuelta (entrada vendible o avería)
      const esBuenEstado = e.estadoPrendaDevuelta === 'BUEN_ESTADO';
      movimientos.push({
        fecha: e.fecha || 'Hoy',
        fechaIso,
        tipoOperacion: esBuenEstado ? 'CAMBIO_REINGRESO' : 'CAMBIO_AVERIA',
        documento: e.id,
        sede,
        sku: e.prendaDevueltaSku,
        prenda: e.prendaDevuelta,
        naturaleza: esBuenEstado ? 'ENTRADA (+)' : 'ENTRADA_AVERIA',
        cantidad: 1,
        concepto: esBuenEstado
          ? `Reingreso vendible por cambio (${e.motivo})`
          : `Avería no vendible por imperfecto (${e.motivo})`,
        responsable: e.vendedor || 'Cajero',
      });
    });

    // 4. Traslados entre Sedes
    traslados.forEach((t) => {
      const fechaIso = t.fechaSolicitud || new Date().toISOString();
      t.lineas.forEach((line) => {
        // Despacho de origen (salida)
        if (filtrarPorPeriodoYSede(fechaIso, t.origenNombre, periodo, sedeFiltro)) {
          movimientos.push({
            fecha: t.fechaEnvio || t.fechaSolicitud,
            fechaIso,
            tipoOperacion: 'TRASLADO_DESPACHO',
            documento: t.codigo,
            sede: t.origenNombre,
            sku: line.sku,
            prenda: line.nombreProducto,
            naturaleza: 'SALIDA (-)',
            cantidad: line.cantidadEnviada || line.cantidadSolicitada,
            concepto: `Despacho de traslado hacia ${t.destinoNombre}`,
            responsable: 'Logística Central',
          });
        }

        // Recepción en destino (entrada)
        if (
          (t.estado === 'RECIBIDO' || t.estado === 'RECIBIDO_CON_NOVEDAD' || t.estado === 'CERRADO') &&
          filtrarPorPeriodoYSede(fechaIso, t.destinoNombre, periodo, sedeFiltro)
        ) {
          movimientos.push({
            fecha: t.fechaRecepcion || t.fechaEnvio || t.fechaSolicitud,
            fechaIso,
            tipoOperacion: 'TRASLADO_RECEPCION',
            documento: t.codigo,
            sede: t.destinoNombre,
            sku: line.sku,
            prenda: line.nombreProducto,
            naturaleza: 'ENTRADA (+)',
            cantidad: line.recibidaBuena || line.cantidadEnviada || line.cantidadSolicitada,
            concepto: `Recepción de traslado desde ${t.origenNombre}`,
            responsable: 'Encargado de Tienda',
          });
        }
      });
    });

    movimientos.sort((a, b) => new Date(b.fechaIso).getTime() - new Date(a.fechaIso).getTime());

    const totalSalidas = movimientos
      .filter((m) => m.naturaleza.includes('SALIDA'))
      .reduce((acc, m) => acc + m.cantidad, 0);
    const totalEntradas = movimientos
      .filter((m) => m.naturaleza.includes('ENTRADA'))
      .reduce((acc, m) => acc + m.cantidad, 0);
    const totalCambios = movimientos.filter((m) => m.tipoOperacion.startsWith('CAMBIO')).length;

    // Resumen por tipo de operación
    const tiposConteo = new Map<string, { tipo: string; ops: number; uds: number; naturaleza: string }>();
    movimientos.forEach((m) => {
      const actual = tiposConteo.get(m.tipoOperacion) || { tipo: m.tipoOperacion, ops: 0, uds: 0, naturaleza: m.naturaleza };
      actual.ops += 1;
      actual.uds += m.cantidad;
      tiposConteo.set(m.tipoOperacion, actual);
    });

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        { etiqueta: 'Total Movimientos Kardex', valor: movimientos.length },
        { etiqueta: 'Unidades Egresadas (Salidas)', valor: totalSalidas },
        { etiqueta: 'Unidades Ingresadas (Entradas)', valor: totalEntradas },
        { etiqueta: 'Operaciones de Cambio', valor: totalCambios },
      ],
      resumenTablas: [
        {
          titulo: 'Balance de Movimientos por Tipo de Operación',
          columnas: ['Tipo de Operación', 'Registros', 'Unidades Involucradas', 'Naturaleza'],
          filas: Array.from(tiposConteo.values()).map((t) => [t.tipo, t.ops, t.uds, t.naturaleza]),
        },
      ],
      detalleColumnas: [
        { header: 'Fecha', key: 'fecha', width: 16 },
        { header: 'Operación', key: 'tipoOperacion', width: 20 },
        { header: 'Documento / Ref', key: 'documento', width: 18 },
        { header: 'Sede', key: 'sede', width: 22 },
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Prenda / Referencia', key: 'prenda', width: 26 },
        { header: 'Movimiento', key: 'naturaleza', width: 16 },
        { header: 'Cantidad', key: 'cantidad', width: 12, tipo: 'numero' },
        { header: 'Concepto / Detalle', key: 'concepto', width: 32 },
        { header: 'Responsable', key: 'responsable', width: 20 },
      ],
      detalleFilas: movimientos,
    };
  }

  // =========================================================================
  // 7. REPORTE: CIERRES Y ARQUEOS DE CAJA (REP-CAJ-01)
  // =========================================================================
  if (reporteId === 'rep-07-cierre-cajas') {
    const sesionesFiltradas = cashSessions.filter((s) =>
      filtrarPorPeriodoYSede(s.aperturaIso, s.sede, periodo, sedeFiltro)
    );

    let totalEsperado = 0;
    let totalContado = 0;
    let totalDiferencias = 0;

    const mapaSedesCaja = new Map<
      string,
      { sede: string; turnos: number; baseInicial: number; ventasEfectivo: number; retiros: number; esperado: number; contado: number; diferencia: number }
    >();

    const filasDetalle: Record<string, any>[] = sesionesFiltradas.map((s) => {
      const res = resumenSesion(s);
      const contado = s.efectivoContadoCop ?? res.efectivoEsperadoCop;
      const diferencia = s.diferenciaCop ?? (contado - res.efectivoEsperadoCop);

      totalEsperado += res.efectivoEsperadoCop;
      totalContado += contado;
      totalDiferencias += diferencia;

      const sAcc = mapaSedesCaja.get(s.sede) || {
        sede: s.sede,
        turnos: 0,
        baseInicial: 0,
        ventasEfectivo: 0,
        retiros: 0,
        esperado: 0,
        contado: 0,
        diferencia: 0,
      };
      sAcc.turnos += 1;
      sAcc.baseInicial += s.baseInicialCop;
      sAcc.ventasEfectivo += res.ventasEfectivoCop;
      sAcc.retiros += res.retirosCop;
      sAcc.esperado += res.efectivoEsperadoCop;
      sAcc.contado += contado;
      sAcc.diferencia += diferencia;
      mapaSedesCaja.set(s.sede, sAcc);

      return {
        turno: `Turno #${s.turnoNumero}`,
        sede: s.sede,
        cajero: s.vendedor,
        apertura: new Date(s.aperturaIso).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }),
        cierre: s.cierreIso ? new Date(s.cierreIso).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }) : 'Abierto',
        estado: s.estado,
        baseInicialCop: s.baseInicialCop,
        ventasEfectivoCop: res.ventasEfectivoCop,
        retirosCop: res.retirosCop,
        efectivoEsperadoCop: res.efectivoEsperadoCop,
        efectivoContadoCop: contado,
        diferenciaCop: diferencia,
      };
    });

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        { etiqueta: 'Turnos Registrados', valor: sesionesFiltradas.length },
        { etiqueta: 'Efectivo Esperado', valor: `$ ${totalEsperado.toLocaleString('es-CO')}` },
        { etiqueta: 'Efectivo Contado', valor: `$ ${totalContado.toLocaleString('es-CO')}` },
        { etiqueta: 'Diferencia Global', valor: `$ ${totalDiferencias.toLocaleString('es-CO')}` },
      ],
      resumenTablas: [
        {
          titulo: 'Auditoría de Cajas por Punto de Venta',
          columnas: [
            'Sede / Sucursal',
            'Turnos',
            'Base Inicial COP',
            'Ventas Efectivo COP',
            'Retiros COP',
            'Efectivo Esperado',
            'Efectivo Contado',
            'Diferencia COP',
            'Estado Cuadre',
          ],
          filas: Array.from(mapaSedesCaja.values()).map((s) => [
            s.sede,
            s.turnos,
            s.baseInicial,
            s.ventasEfectivo,
            s.retiros,
            s.esperado,
            s.contado,
            s.diferencia,
            s.diferencia === 0 ? 'CUADRE EXACTO' : s.diferencia > 0 ? 'SOBRANTE' : 'FALTANTE',
          ]),
        },
      ],
      detalleColumnas: [
        { header: 'Turno', key: 'turno', width: 14 },
        { header: 'Sede', key: 'sede', width: 22 },
        { header: 'Cajero', key: 'cajero', width: 18 },
        { header: 'Apertura', key: 'apertura', width: 14 },
        { header: 'Cierre', key: 'cierre', width: 14 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Base Inicial COP', key: 'baseInicialCop', width: 16, tipo: 'moneda' },
        { header: 'Ventas Efectivo COP', key: 'ventasEfectivoCop', width: 18, tipo: 'moneda' },
        { header: 'Retiros COP', key: 'retirosCop', width: 14, tipo: 'moneda' },
        { header: 'Esperado en Gaveta', key: 'efectivoEsperadoCop', width: 18, tipo: 'moneda' },
        { header: 'Contado en Arqueo', key: 'efectivoContadoCop', width: 18, tipo: 'moneda' },
        { header: 'Diferencia COP', key: 'diferenciaCop', width: 16, tipo: 'moneda' },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // =========================================================================
  // 8. REPORTE: PEDIDOS WEB, DESPACHOS Y RECAUDO (REP-WEB-01)
  // =========================================================================
  if (reporteId === 'rep-08-pedidos-web') {
    const webFiltrados = webOrders.filter((w) =>
      filtrarPorPeriodoYSede(w.fechaCreacionIso, w.sedeAsignada, periodo, sedeFiltro)
    );

    const totalFacturadoWeb = webFiltrados.reduce((acc, w) => acc + (w.totalCOP || 0), 0);
    const totalPagadoCop = webFiltrados
      .filter((w) => w.estadoCobro === 'PAGADO')
      .reduce((acc, w) => acc + (w.totalCOP || 0), 0);
    const totalContraentregaPendienteCop = webFiltrados
      .filter((w) => w.estadoCobro === 'PENDIENTE_RECAUDO')
      .reduce((acc, w) => acc + (w.totalCOP || 0), 0);
    const totalEnTransito = webFiltrados.filter(
      (w) => w.estado === 'LISTO_DESPACHO' || w.estado === 'DESPACHADO' || w.estado === 'EN_ENTREGA'
    ).length;

    // Resumen por estado de despacho
    const estadosConteo = new Map<string, { estado: string; cantidad: number; totalCop: number }>();
    webFiltrados.forEach((w) => {
      const actual = estadosConteo.get(w.estado) || { estado: w.estado, cantidad: 0, totalCop: 0 };
      actual.cantidad += 1;
      actual.totalCop += w.totalCOP;
      estadosConteo.set(w.estado, actual);
    });

    const filasDetalle = webFiltrados.map((w) => ({
      codigo: `#${w.codigo}`,
      fecha: new Date(w.fechaCreacionIso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
      cliente: w.cliente,
      documento: w.documento || '—',
      ciudadDestino: w.ciudadDestino,
      sedeDespacho: w.sedeAsignada,
      metodoPago: w.metodoPagoTexto,
      estadoOperativo: w.estado,
      estadoCobro: w.estadoCobro,
      guia: w.guiaTransportadora || 'Por asignar',
      totalCop: w.totalCOP,
    }));

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        { etiqueta: 'Total Pedidos Web', valor: webFiltrados.length },
        { etiqueta: 'Recaudado y Conciliado', valor: `$ ${totalPagadoCop.toLocaleString('es-CO')}` },
        { etiqueta: 'Pendiente Contraentrega', valor: `$ ${totalContraentregaPendienteCop.toLocaleString('es-CO')}` },
        { etiqueta: 'Órdenes en Despacho', valor: totalEnTransito },
      ],
      resumenTablas: [
        {
          titulo: 'Estado Operativo de Despachos',
          columnas: ['Fase del Pedido', 'Cantidad Órdenes', 'Total Facturado COP', 'Participación %'],
          filas: Array.from(estadosConteo.values()).map((e) => [
            e.estado,
            e.cantidad,
            e.totalCop,
            totalFacturadoWeb > 0 ? `${((e.totalCop / totalFacturadoWeb) * 100).toFixed(1)}%` : '0%',
          ]),
        },
      ],
      detalleColumnas: [
        { header: 'Código Pedido', key: 'codigo', width: 16 },
        { header: 'Fecha', key: 'fecha', width: 16 },
        { header: 'Cliente', key: 'cliente', width: 22 },
        { header: 'Documento', key: 'documento', width: 16 },
        { header: 'Ciudad Destino', key: 'ciudadDestino', width: 18 },
        { header: 'Sede Despacho', key: 'sedeDespacho', width: 22 },
        { header: 'Método Pago', key: 'metodoPago', width: 18 },
        { header: 'Estado Despacho', key: 'estadoOperativo', width: 18 },
        { header: 'Estado Cobro', key: 'estadoCobro', width: 22 },
        { header: 'Guía Transportadora', key: 'guia', width: 20 },
        { header: 'Total COP', key: 'totalCop', width: 18, tipo: 'moneda' },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // =========================================================================
  // 9. REPORTE: COMPRAS A TALLER Y ABASTECIMIENTO (REP-CMP-01)
  // =========================================================================
  if (reporteId === 'rep-09-compras-abastecimiento') {
    const trasladosFiltrados = traslados.filter((t) =>
      filtrarPorPeriodoYSede(t.fechaSolicitud || new Date().toISOString(), t.destinoNombre, periodo, sedeFiltro)
    );

    let totalEnviado = 0;
    let totalRecibidoBueno = 0;
    let totalAverias = 0;

    const filasDetalle: Record<string, any>[] = [];
    const mapaDestinos = new Map<
      string,
      { destino: string; despachos: number; enviado: number; recibidoBueno: number; averias: number }
    >();

    trasladosFiltrados.forEach((t) => {
      t.lineas.forEach((line) => {
        const env = line.cantidadEnviada || line.cantidadSolicitada || 0;
        const buena = line.recibidaBuena || env;
        const danada = line.recibidaDanada || 0;

        totalEnviado += env;
        totalRecibidoBueno += buena;
        totalAverias += danada;

        const destAcc = mapaDestinos.get(t.destinoNombre) || {
          destino: t.destinoNombre,
          despachos: 0,
          enviado: 0,
          recibidoBueno: 0,
          averias: 0,
        };
        destAcc.despachos += 1;
        destAcc.enviado += env;
        destAcc.recibidoBueno += buena;
        destAcc.averias += danada;
        mapaDestinos.set(t.destinoNombre, destAcc);

        filasDetalle.push({
          codigo: t.codigo,
          fechaSolicitud: t.fechaSolicitud,
          fechaEnvio: t.fechaEnvio || '—',
          origen: t.origenNombre,
          destino: t.destinoNombre,
          estado: t.estado,
          sku: line.sku,
          prenda: line.nombreProducto,
          cantidadEnviada: env,
          recibidaBuena: buena,
          recibidaDanada: danada,
          observaciones: t.observaciones || 'Sin novedad',
        });
      });
    });

    const efectividadLogistica = totalEnviado > 0 ? ((totalRecibidoBueno / totalEnviado) * 100).toFixed(1) : '100.0';

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        { etiqueta: 'Despachos de Mercancía', valor: trasladosFiltrados.length },
        { etiqueta: 'Unidades Despachadas', valor: totalEnviado },
        { etiqueta: 'Recibidas Conforme', valor: totalRecibidoBueno },
        { etiqueta: 'Efectividad Logística', valor: `${efectividadLogistica}%` },
      ],
      resumenTablas: [
        {
          titulo: 'Abastecimiento por Sede Destino',
          columnas: [
            'Sede Destino',
            'Despachos Realizados',
            'Unidades Enviadas',
            'Recibidas Conforme',
            'Averías Reportadas',
            'Efectividad %',
          ],
          filas: Array.from(mapaDestinos.values()).map((d) => [
            d.destino,
            d.despachos,
            d.enviado,
            d.recibidoBueno,
            d.averias,
            d.enviado > 0 ? `${((d.recibidoBueno / d.enviado) * 100).toFixed(1)}%` : '100%',
          ]),
        },
      ],
      detalleColumnas: [
        { header: 'Código Traslado', key: 'codigo', width: 16 },
        { header: 'Fecha Solicitud', key: 'fechaSolicitud', width: 16 },
        { header: 'Fecha Envío', key: 'fechaEnvio', width: 16 },
        { header: 'Origen', key: 'origen', width: 20 },
        { header: 'Destino', key: 'destino', width: 22 },
        { header: 'Estado', key: 'estado', width: 18 },
        { header: 'SKU', key: 'sku', width: 16 },
        { header: 'Prenda / Producto', key: 'prenda', width: 26 },
        { header: 'Cant. Enviada', key: 'cantidadEnviada', width: 14, tipo: 'numero' },
        { header: 'Cant. Recibida Buena', key: 'recibidaBuena', width: 16, tipo: 'numero' },
        { header: 'Cant. Averías', key: 'recibidaDanada', width: 14, tipo: 'numero' },
        { header: 'Observaciones', key: 'observaciones', width: 26 },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // =========================================================================
  // 10. REPORTE: AUDITORÍA DE CAMBIOS Y DEVOLUCIONES (REP-DEV-01)
  // =========================================================================
  if (reporteId === 'rep-10-cambios-devoluciones') {
    const exchangesFiltrados = exchanges.filter((e) =>
      filtrarPorPeriodoYSede(e.fechaIso || new Date().toISOString(), e.sede || 'Punto Centro', periodo, sedeFiltro)
    );

    let totalBuenEstado = 0;
    let totalConImperfecto = 0;
    let balanceFinancieroCop = 0;

    const mapaMotivos = new Map<string, { motivo: string; casos: number }>();

    const filasDetalle = exchangesFiltrados.map((e) => {
      const esBuenEstado = e.estadoPrendaDevuelta === 'BUEN_ESTADO';
      if (esBuenEstado) totalBuenEstado += 1;
      else totalConImperfecto += 1;

      balanceFinancieroCop += e.diferenciaCop || 0;

      const motAcc = mapaMotivos.get(e.motivo) || { motivo: e.motivo, casos: 0 };
      motAcc.casos += 1;
      mapaMotivos.set(e.motivo, motAcc);

      return {
        consecutivo: e.id,
        facturaOriginal: e.consecutivoFactura,
        fecha: e.fecha || 'Hoy',
        sede: e.sede || 'Punto Centro',
        vendedor: e.vendedor || 'Cajero',
        prendaDevuelta: e.prendaDevuelta,
        skuDevuelto: e.prendaDevueltaSku,
        prendaEntregada: e.prendaEntregada,
        skuEntregado: e.prendaEntregadaSku,
        motivo: e.motivo,
        estadoPrenda: esBuenEstado ? 'BUEN ESTADO (VENDIBLE)' : 'IMPERFECTO (AVERÍA)',
        diferenciaCop: e.diferenciaCop || 0,
        medioPagoExcedente: e.medioPagoExcedente || 'NINGUNO',
        impactoKardex: e.impactoKardex || (esBuenEstado ? '+1 Vendible / -1 Entregada' : 'Avería / -1 Entregada'),
      };
    });

    return {
      tituloReporte: meta.titulo,
      codigoReporte: meta.codigo,
      periodoTexto: periodoTextos[periodo] || periodo,
      sedeTexto: sedeFiltro,
      autorTexto: meta.autor,
      modoContenido,
      kpis: [
        { etiqueta: 'Cambios Procesados', valor: exchangesFiltrados.length },
        { etiqueta: 'Reingresos Vendibles', valor: totalBuenEstado },
        { etiqueta: 'Averías / Imperfectos', valor: totalConImperfecto },
        { etiqueta: 'Balance Financiero Gaveta', valor: `$ ${balanceFinancieroCop.toLocaleString('es-CO')}` },
      ],
      resumenTablas: [
        {
          titulo: 'Clasificación por Motivo de Cambio',
          columnas: ['Motivo Reportado', 'Casos', '% Frecuencia', 'Destino en Kardex'],
          filas: Array.from(mapaMotivos.values()).map((m) => [
            m.motivo,
            m.casos,
            exchangesFiltrados.length > 0 ? `${((m.casos / exchangesFiltrados.length) * 100).toFixed(1)}%` : '0%',
            m.motivo.toLowerCase().includes('imperfecto') ? 'Averías No Vendibles' : 'Stock Vendible de Sede',
          ]),
        },
      ],
      detalleColumnas: [
        { header: 'Consecutivo Cambio', key: 'consecutivo', width: 18 },
        { header: 'Factura Original', key: 'facturaOriginal', width: 16 },
        { header: 'Fecha', key: 'fecha', width: 16 },
        { header: 'Sede', key: 'sede', width: 22 },
        { header: 'Vendedor', key: 'vendedor', width: 18 },
        { header: 'Prenda Devuelta', key: 'prendaDevuelta', width: 24 },
        { header: 'SKU Devuelto', key: 'skuDevuelto', width: 16 },
        { header: 'Prenda Entregada', key: 'prendaEntregada', width: 24 },
        { header: 'SKU Entregado', key: 'skuEntregado', width: 16 },
        { header: 'Motivo', key: 'motivo', width: 20 },
        { header: 'Estado Físico', key: 'estadoPrenda', width: 22 },
        { header: 'Diferencia COP', key: 'diferenciaCop', width: 16, tipo: 'moneda' },
        { header: 'Medio Excedente', key: 'medioPagoExcedente', width: 16 },
        { header: 'Impacto Kardex', key: 'impactoKardex', width: 24 },
      ],
      detalleFilas: filasDetalle,
    };
  }

  // Fallback si no coincide ninguno de los IDs anteriores
  return {
    tituloReporte: meta.titulo,
    codigoReporte: meta.codigo,
    periodoTexto: periodoTextos[periodo] || periodo,
    sedeTexto: sedeFiltro,
    autorTexto: meta.autor,
    modoContenido,
    kpis: [
      { etiqueta: 'Registros Evaluados', valor: sales.length },
      { etiqueta: 'Alcance Sede', valor: sedeFiltro },
    ],
    detalleColumnas: [
      { header: 'Consecutivo', key: 'consecutivo', width: 16 },
      { header: 'Fecha', key: 'fecha', width: 18 },
      { header: 'Sede', key: 'sede', width: 24 },
      { header: 'Responsable', key: 'vendedor', width: 20 },
      { header: 'Total COP', key: 'totalCop', width: 18, tipo: 'moneda' },
    ],
    detalleFilas: sales.map((s) => ({
      consecutivo: s.consecutivo,
      fecha: s.fechaHora || 'Hoy',
      sede: s.sede || 'Punto Centro',
      vendedor: s.vendedor || 'Cajero',
      totalCop: s.totalCop || 0,
    })),
  };
}
