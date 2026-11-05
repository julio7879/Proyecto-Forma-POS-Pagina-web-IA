import { describe, it, expect } from 'vitest';
import { ExcelReportService } from '../excelReport.service.js';

describe('Módulo 12: Generador de Reportes Ejecutivos Excel (.xlsx)', () => {
  it('generarReporteVentas genera un Buffer binario de Excel válido', async () => {
    const buffer = await ExcelReportService.generarReporteVentas();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Verificación de firma mágica de archivo zip/xlsx (PK\x03\x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('generarReporteCajas genera un Buffer de Excel con arqueos', async () => {
    const buffer = await ExcelReportService.generarReporteCajas();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('generarReporteInventario genera un Buffer de Excel con valorización Kardex', async () => {
    const buffer = await ExcelReportService.generarReporteInventario();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});
