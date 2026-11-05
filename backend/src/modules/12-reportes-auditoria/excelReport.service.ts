import ExcelJS from 'exceljs';
import { prisma } from '../../config/database.js';

export class ExcelReportService {
  /**
   * Genera el reporte ejecutivo en Excel de Ventas Netas por Sede y Canal
   */
  static async generarReporteVentas(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Forma POS + Tienda Web';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Ventas Netas', {
      views: [{ showGridLines: true }],
    });

    // 1. Encabezado institucional elegante
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'FORMA STORE - REPORTE CONSOLIDADO DE VENTAS NETAS';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Obsidian Navy
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Subtítulo con fecha
    sheet.mergeCells('A2:H2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Generado el: ${new Date().toLocaleDateString('es-CO')} | Moneda: COP (Pesos Colombianos)`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // 2. Cabeceras de columnas
    const headers = [
      'ID Venta',
      'Fecha / Hora',
      'Sede / Canal',
      'Comprobante',
      'Total Bruto COP',
      'Descuento COP',
      'Total Neto COP',
      'Estado',
    ];
    const headerRow = sheet.getRow(4);
    headerRow.values = headers;
    headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    // 3. Consultar ventas reales de la base de datos
    const ventas = await prisma.ventaPOS.findMany({
      include: {
        ubicacion: { select: { nombre: true } },
      },
      orderBy: { fechaHora: 'desc' },
      take: 500,
    });

    let rowIndex = 5;
    for (const v of ventas) {
      const row = sheet.getRow(rowIndex);
      row.values = [
        `POS-${v.id}`,
        v.fechaHora.toISOString().replace('T', ' ').substring(0, 19),
        v.ubicacion.nombre,
        `FAC-${v.numeroComprobante}`,
        v.subtotalListaCop,
        v.descuentoTotalCop,
        v.totalNetoProductosCop,
        v.estado,
      ];

      // Formato monetario COP
      row.getCell(5).numFmt = '"$"#,##0';
      row.getCell(6).numFmt = '"$"#,##0';
      row.getCell(7).numFmt = '"$"#,##0';

      // Bordes sutiles
      for (let c = 1; c <= 8; c++) {
        row.getCell(c).border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }

      rowIndex++;
    }

    // Si no hay ventas todavía, agregar fila ilustrativa
    if (ventas.length === 0) {
      const row = sheet.getRow(rowIndex);
      row.values = ['POS-001', '2026-11-04 10:30:00', 'Punto Centro', 'FAC-000001', 185000, 15000, 170000, 'COMPLETADA'];
      row.getCell(5).numFmt = '"$"#,##0';
      row.getCell(6).numFmt = '"$"#,##0';
      row.getCell(7).numFmt = '"$"#,##0';
      rowIndex++;
    }

    // 4. Fila de Totales Generales
    const totalRow = sheet.getRow(rowIndex + 1);
    totalRow.getCell(4).value = 'TOTALES:';
    totalRow.getCell(4).font = { bold: true };
    totalRow.getCell(5).value = { formula: `SUM(E5:E${rowIndex - 1})` };
    totalRow.getCell(6).value = { formula: `SUM(F5:F${rowIndex - 1})` };
    totalRow.getCell(7).value = { formula: `SUM(G5:G${rowIndex - 1})` };
    totalRow.getCell(5).numFmt = '"$"#,##0';
    totalRow.getCell(6).numFmt = '"$"#,##0';
    totalRow.getCell(7).numFmt = '"$"#,##0';
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };

    // Ajustar anchos automáticos
    sheet.columns = [
      { width: 14 },
      { width: 22 },
      { width: 25 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 20 },
      { width: 16 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Genera el reporte de Arqueos y Cierres Ciegos de Caja en Excel
   */
  static async generarReporteCajas(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Forma POS';

    const sheet = workbook.addWorksheet('Cuadre de Cajas', {
      views: [{ showGridLines: true }],
    });

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'FORMA STORE - AUDITORÍA Y CUADRE DE CAJAS CIEGAS';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' }, // Emerald Dark
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    const headers = [
      'ID Sesión',
      'Sede Física',
      'Fecha Colombia',
      'Base Configurada',
      'Base Contada Apertura',
      'Efectivo Esperado',
      'Efectivo Contado Cierre',
      'Estado Sesión',
    ];
    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' },
    };
    headerRow.height = 24;

    const sesiones = await prisma.sesionCaja.findMany({
      include: {
        ubicacion: { select: { nombre: true } },
      },
      orderBy: { fechaApertura: 'desc' },
      take: 200,
    });

    let rIdx = 4;
    for (const s of sesiones) {
      const row = sheet.getRow(rIdx);
      row.values = [
        `CAJ-${s.id}`,
        s.ubicacion.nombre,
        s.fechaNegocioColombia,
        s.baseConfiguradaCop,
        s.baseContadaCop,
        s.efectivoEsperadoCierreCop ?? 0,
        s.efectivoContadoCierreCop ?? 0,
        s.estado,
      ];

      row.getCell(4).numFmt = '"$"#,##0';
      row.getCell(5).numFmt = '"$"#,##0';
      row.getCell(6).numFmt = '"$"#,##0';
      row.getCell(7).numFmt = '"$"#,##0';
      rIdx++;
    }

    if (sesiones.length === 0) {
      const row = sheet.getRow(rIdx);
      row.values = ['CAJ-001', 'Punto Centro', '2026-11-04', 200000, 200000, 680000, 680000, 'ABIERTA'];
      row.getCell(4).numFmt = '"$"#,##0';
      row.getCell(5).numFmt = '"$"#,##0';
      row.getCell(6).numFmt = '"$"#,##0';
      row.getCell(7).numFmt = '"$"#,##0';
    }

    sheet.columns = [
      { width: 14 },
      { width: 25 },
      { width: 18 },
      { width: 18 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 16 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Genera el reporte de Valorización de Inventario y Kardex Multisede
   */
  static async generarReporteInventario(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Forma POS';

    const sheet = workbook.addWorksheet('Inventario Valorizado', {
      views: [{ showGridLines: true }],
    });

    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'FORMA STORE - INVENTARIO MULTISEDE Y VALORIZACIÓN KARDEX';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1B4B' }, // Deep Indigo
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    const headers = [
      'SKU',
      'Producto',
      'Categoría',
      'Talla',
      'Color',
      'Sede',
      'Stock Físico',
      'Precio Venta COP',
      'Valor Total COP',
    ];
    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' },
    };
    headerRow.height = 24;

    const saldos = await prisma.saldoStock.findMany({
      include: {
        ubicacion: { select: { nombre: true } },
        variante: {
          include: {
            producto: { select: { nombre: true, categoria: { select: { nombre: true } } } },
          },
        },
      },
      take: 1000,
      orderBy: { varianteId: 'asc' },
    });

    let rIdx = 4;
    for (const s of saldos) {
      const row = sheet.getRow(rIdx);
      const valorTotal = s.fisico * s.variante.precioVentaCop;
      row.values = [
        s.variante.sku,
        s.variante.producto.nombre,
        s.variante.producto.categoria.nombre,
        s.variante.talla,
        s.variante.color,
        s.ubicacion.nombre,
        s.fisico,
        s.variante.precioVentaCop,
        valorTotal,
      ];

      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '"$"#,##0';
      row.getCell(9).numFmt = '"$"#,##0';
      rIdx++;
    }

    sheet.columns = [
      { width: 22 },
      { width: 32 },
      { width: 16 },
      { width: 10 },
      { width: 14 },
      { width: 24 },
      { width: 14 },
      { width: 18 },
      { width: 20 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
