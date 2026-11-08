// frontend/src/features/admin/services/excelEngine.ts
/**
 * Motor Profesional de Generación de Libros Excel (.xlsx) para FORMA.
 * Aplica diseño ejecutivo institucional:
 * - Colores corporativos: Vino Imperial (#741C2B), Carbón Ejecutivo (#292827), Champagne (#C49A68), Marfil (#F5F3EF).
 * - Estructura multidimensional: Hoja 1 "Resumen_Ejecutivo" con KPIs y resúmenes; Hoja 2 "Detalle_Operativo" con tabla cruda, autofiltro y paneles congelados.
 * - Formato contable entero COP (RN-GEN-04) y fecha oficial de Colombia America/Bogota (RN-GEN-05).
 */

import ExcelJS from 'exceljs';

export interface ReporteExcelConfig {
  tituloReporte: string;
  codigoReporte: string;
  periodoTexto: string;
  sedeTexto: string;
  autorTexto?: string;
  kpis: {
    etiqueta: string;
    valor: string | number;
    subtitulo?: string;
  }[];
  resumenTablas?: {
    titulo: string;
    columnas: string[];
    filas: (string | number)[][];
  }[];
  detalleColumnas: {
    header: string;
    key: string;
    width?: number;
    tipo?: 'texto' | 'moneda' | 'numero' | 'fecha';
  }[];
  detalleFilas: Record<string, any>[];
  modoContenido?: 'completo' | 'solo_resumen' | 'solo_detalle';
}

const COLOR_VINO = 'FF741C2B';
const COLOR_CARBON = 'FF292827';
const COLOR_CHAMPAGNE = 'FFC49A68';
const COLOR_MARFIL = 'FFF5F3EF';
const COLOR_BLANCO = 'FFFFFFFF';
const COLOR_GRIS_BORDE = 'FFE7E0D8';
const COLOR_ZEBRA = 'FFF9F7F5';

export async function generarLibroExcelEjecutivo(config: ReporteExcelConfig): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = config.autorTexto || 'FORMA Retail POS System';
  wb.created = new Date();
  wb.properties.date1904 = true;

  const modo = config.modoContenido || 'completo';
  const fechaGeneracion = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  // =========================================================================
  // HOJA 1: RESUMEN EJECUTIVO (SI APLICA)
  // =========================================================================
  if (modo === 'completo' || modo === 'solo_resumen') {
    const wsResumen = wb.addWorksheet('Resumen_Ejecutivo', {
      views: [{ showGridLines: true }],
      properties: { tabColor: { argb: COLOR_VINO } },
    });

    // 1. BANNER INSTITUCIONAL
    wsResumen.mergeCells('B2:H2');
    const cellBanner = wsResumen.getCell('B2');
    cellBanner.value = 'FORMA — SISTEMA DE GESTIÓN RETAIL Y OMNICANAL';
    cellBanner.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLOR_CHAMPAGNE } };
    cellBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CARBON } };
    cellBanner.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsResumen.getRow(2).height = 24;

    wsResumen.mergeCells('B3:H3');
    const cellTitulo = wsResumen.getCell('B3');
    cellTitulo.value = config.tituloReporte.toUpperCase();
    cellTitulo.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLOR_BLANCO } };
    cellTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_VINO } };
    cellTitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsResumen.getRow(3).height = 36;

    // Metadatos
    wsResumen.mergeCells('B4:H4');
    const cellMeta = wsResumen.getCell('B4');
    cellMeta.value = `Periodo: ${config.periodoTexto}   |   Sede / Alcance: ${config.sedeTexto}   |   Generado (Bogotá): ${fechaGeneracion}`;
    cellMeta.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF50322A' } };
    cellMeta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MARFIL } };
    cellMeta.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsResumen.getRow(4).height = 20;

    // 2. BLOQUE DE TARJETAS KPI (HASTA 4 KPIS HORIZONTALES)
    let filaActual = 6;
    if (config.kpis && config.kpis.length > 0) {
      wsResumen.getCell(`B${filaActual}`).value = 'INDICADORES CLAVE DE GESTIÓN (KPIS)';
      wsResumen.getCell(`B${filaActual}`).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLOR_VINO } };
      filaActual += 1;

      const kpisAMostrar = config.kpis.slice(0, 4);
      const colStarts = ['B', 'D', 'F', 'H'];
      const colEnds = ['C', 'E', 'G', 'I'];

      kpisAMostrar.forEach((kpi, idx) => {
        const start = colStarts[idx] || 'B';
        const end = colEnds[idx] || 'C';

        wsResumen.mergeCells(`${start}${filaActual}:${end}${filaActual}`);
        const cLabel = wsResumen.getCell(`${start}${filaActual}`);
        cLabel.value = kpi.etiqueta.toUpperCase();
        cLabel.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF77736E' } };
        cLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MARFIL } };
        cLabel.alignment = { horizontal: 'center', vertical: 'middle' };

        wsResumen.mergeCells(`${start}${filaActual + 1}:${end}${filaActual + 1}`);
        const cVal = wsResumen.getCell(`${start}${filaActual + 1}`);
        cVal.value = kpi.valor;
        cVal.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLOR_CARBON } };
        cVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_BLANCO } };
        cVal.alignment = { horizontal: 'center', vertical: 'middle' };

        // Borde en la tarjeta
        ['top', 'left', 'bottom', 'right'].forEach((side) => {
          cLabel.border = { ...cLabel.border, [side]: { style: 'thin', color: { argb: COLOR_GRIS_BORDE } } };
          cVal.border = { ...cVal.border, [side]: { style: 'thin', color: { argb: COLOR_GRIS_BORDE } } };
        });
      });

      wsResumen.getRow(filaActual).height = 18;
      wsResumen.getRow(filaActual + 1).height = 30;
      filaActual += 3;
    }

    // 3. TABLAS DE RESUMEN EJECUTIVO (DISTRIBUCIÓN / RANKINGS)
    if (config.resumenTablas && config.resumenTablas.length > 0) {
      config.resumenTablas.forEach((tabla) => {
        wsResumen.getCell(`B${filaActual}`).value = tabla.titulo.toUpperCase();
        wsResumen.getCell(`B${filaActual}`).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLOR_VINO } };
        filaActual += 1;

        // Cabecera de tabla
        const colLetters = ['B', 'C', 'D', 'E', 'F', 'G', 'H'];
        tabla.columnas.forEach((colName, cIdx) => {
          const l = colLetters[cIdx] || 'B';
          const celda = wsResumen.getCell(`${l}${filaActual}`);
          celda.value = colName;
          celda.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_BLANCO } };
          celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CARBON } };
          celda.alignment = { vertical: 'middle', horizontal: cIdx === 0 ? 'left' : 'right' };
          celda.border = {
            bottom: { style: 'medium', color: { argb: COLOR_CHAMPAGNE } },
          };
        });
        wsResumen.getRow(filaActual).height = 20;
        filaActual += 1;

        // Filas de datos
        tabla.filas.forEach((fila, fIdx) => {
          const isZebra = fIdx % 2 === 1;
          fila.forEach((val, cIdx) => {
            const l = colLetters[cIdx] || 'B';
            const celda = wsResumen.getCell(`${l}${filaActual}`);
            celda.value = val;
            celda.font = { name: 'Segoe UI', size: 9, color: { argb: COLOR_CARBON } };
            if (isZebra) {
              celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
            }
            celda.alignment = { vertical: 'middle', horizontal: cIdx === 0 ? 'left' : 'right' };
            celda.border = {
              bottom: { style: 'thin', color: { argb: COLOR_GRIS_BORDE } },
            };
            if (typeof val === 'number' && String(tabla.columnas[cIdx]).toLowerCase().includes('cop')) {
              celda.numFmt = '"$"#,##0';
            }
          });
          wsResumen.getRow(filaActual).height = 19;
          filaActual += 1;
        });

        filaActual += 2;
      });
    }

    // Ajustar anchos en hoja de resumen
    wsResumen.getColumn('A').width = 4;
    wsResumen.getColumn('B').width = 24;
    wsResumen.getColumn('C').width = 20;
    wsResumen.getColumn('D').width = 20;
    wsResumen.getColumn('E').width = 20;
    wsResumen.getColumn('F').width = 20;
    wsResumen.getColumn('G').width = 18;
    wsResumen.getColumn('H').width = 18;
  }

  // =========================================================================
  // HOJA 2: DETALLE OPERATIVO TRANSACCIONAL (TABLA PURA)
  // =========================================================================
  if (modo === 'completo' || modo === 'solo_detalle') {
    const wsDetalle = wb.addWorksheet('Detalle_Operativo', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
      properties: { tabColor: { argb: COLOR_CARBON } },
    });

    // Encabezados
    const headers = config.detalleColumnas.map((c) => c.header);
    const headerRow = wsDetalle.addRow(headers);
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLOR_BLANCO } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_VINO } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: COLOR_CHAMPAGNE } },
        right: { style: 'thin', color: { argb: 'FF9E2A3D' } },
      };
    });

    // Filas de datos
    config.detalleFilas.forEach((rowObj, idx) => {
      const isZebra = idx % 2 === 1;
      const values = config.detalleColumnas.map((col) => rowObj[col.key] ?? '—');
      const r = wsDetalle.addRow(values);
      r.height = 20;

      r.eachCell((cell, colNumber) => {
        const colDef = config.detalleColumnas[colNumber - 1];
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: COLOR_CARBON } };

        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
        }

        cell.border = {
          bottom: { style: 'thin', color: { argb: COLOR_GRIS_BORDE } },
          right: { style: 'thin', color: { argb: COLOR_GRIS_BORDE } },
        };

        if (colDef?.tipo === 'moneda') {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '"$"#,##0';
        } else if (colDef?.tipo === 'numero') {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // Autofiltro nativo en toda la tabla
    const numCols = config.detalleColumnas.length;
    const lastColLetter = wsDetalle.getColumn(numCols).letter;
    wsDetalle.autoFilter = {
      from: 'A1',
      to: `${lastColLetter}${config.detalleFilas.length + 1}`,
    };

    // Ajuste dinámico de ancho de columnas
    config.detalleColumnas.forEach((colDef, idx) => {
      const col = wsDetalle.getColumn(idx + 1);
      if (colDef.width) {
        col.width = colDef.width;
      } else {
        // Calcular ancho según longitud de header y muestra
        const maxLen = Math.max(
          colDef.header.length,
          ...config.detalleFilas.slice(0, 50).map((r) => String(r[colDef.key] || '').length)
        );
        col.width = Math.min(40, Math.max(12, maxLen + 3));
      }
    });
  }

  // Generar Buffer binario y devolver como Blob
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Disparador de descarga en el navegador con nombre de archivo canónico.
 */
export function descargarBlobExcel(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
