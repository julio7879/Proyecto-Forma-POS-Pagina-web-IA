// frontend/src/features/admin/__tests__/reportCatalogService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  CATALOGO_REPORTES,
  construirConfigReporte,
} from '../services/reportCatalogService';
import { generarLibroExcelEjecutivo } from '../services/excelEngine';
import { recordPosSale, recordPosExchange } from '../../pos/utils/posLedgerSync';
import { createWebOrder } from '../../pos/utils/webOrdersStore';
import { abrirSesionCaja, cerrarSesionCaja } from '../../pos/utils/cajaStore';

describe('ReportCatalogService & ExcelEngine - 10 Reportes Estratégicos FORMA', () => {
  beforeEach(() => {
    localStorage.clear();

    // 1. Sembrar venta POS
    recordPosSale({
      id: 'TRX-TEST-01',
      consecutivo: 'FAC-2001',
      fechaHora: 'Hoy 10:00 a. m.',
      fechaIso: new Date().toISOString(),
      vendedor: 'Daniela Gómez',
      sede: 'Punto Bucaramanga',
      cliente: 'Luciana Vélez',
      medioPago: 'TRANSFERENCIA',
      subtotalCop: 320000,
      iva19Cop: 51092,
      totalCop: 320000,
      prendas: [
        {
          sku: 'ROP-BLZ-010-M',
          nombre: 'Blazer Imperial Vinotinto',
          categoria: 'Ropa',
          talla: 'M',
          color: 'Vinotinto',
          cantidad: 1,
          precioUnitarioCop: 320000,
          totalCop: 320000,
        },
      ],
    });

    // 2. Sembrar pedido web
    createWebOrder({
      codigo: 'PED-2026-9001',
      fechaCreacionIso: new Date().toISOString(),
      cliente: 'Mariana Arango',
      emailCliente: 'mariana@example.com',
      telefono: '3129876543',
      documento: '1098765432',
      ciudadDestino: 'Medellín',
      codigoDaneDestino: '05001',
      direccionEntrega: 'Calle 10 #43-20',
      sedeAsignada: 'Punto Centro',
      subtotalCOP: 195000,
      ivaCOP: 31134,
      fleteCOP: 15000,
      totalCOP: 210000,
      metodoPago: 'TRANSFERENCIA',
      metodoPagoTexto: 'Transferencia Bancolombia',
      productos: [
        {
          id: 'prod-011-32',
          sku: 'ROP-PAN-011-32',
          nombre: 'Pantalón Lino Sartorial',
          talla: '32',
          color: 'Arena Orgánico',
          precioUnitarioCOP: 195000,
          cantidad: 1,
        },
      ],
    });

    // 3. Sembrar cambio POS
    recordPosExchange({
      id: 'EXC-TEST-01',
      consecutivoFactura: 'FAC-2001',
      fecha: 'Hoy',
      fechaIso: new Date().toISOString(),
      cliente: 'Luciana Vélez',
      prendaDevuelta: 'Blazer Imperial Vinotinto',
      prendaDevueltaSku: 'ROP-BLZ-010-M',
      prendaEntregada: 'Pantalón Lino Sartorial',
      prendaEntregadaSku: 'ROP-PAN-011-32',
      motivo: 'Cambio de talla',
      estadoPrendaDevuelta: 'BUEN_ESTADO',
      diferenciaCop: 0,
      tipoLiquidacion: 'MANO_A_MANO_0',
      observaciones: 'Prenda en perfecto estado',
      impactoKardex: '+1 Vendible / -1 Entregada',
      sede: 'Punto Bucaramanga',
      vendedor: 'Daniela Gómez',
    });

    // 4. Sembrar turno de caja
    const sesion = abrirSesionCaja('Punto Bucaramanga', 'Daniela Gómez', 200000, 'Apertura de prueba');
    cerrarSesionCaja(sesion.id, 200000, 'Cierre exacto');
  });

  it('verifica que el catálogo contenga exactamente los 10 reportes requeridos', () => {
    expect(CATALOGO_REPORTES).toHaveLength(10);
    const codigos = CATALOGO_REPORTES.map((r) => r.codigo);
    expect(codigos).toContain('REP-VTA-01');
    expect(codigos).toContain('REP-VTA-02');
    expect(codigos).toContain('REP-VTA-03');
    expect(codigos).toContain('REP-INV-01');
    expect(codigos).toContain('REP-INV-02');
    expect(codigos).toContain('REP-AUD-01');
    expect(codigos).toContain('REP-CAJ-01');
    expect(codigos).toContain('REP-WEB-01');
    expect(codigos).toContain('REP-CMP-01');
    expect(codigos).toContain('REP-DEV-01');
  });

  it.each(CATALOGO_REPORTES)(
    'genera correctamente la configuración y el libro Excel para $codigo ($titulo)',
    async (reporte) => {
      const config = construirConfigReporte(reporte.id, 'TODO', 'Todas las Sedes (Consolidado)');

      expect(config.tituloReporte).toBe(reporte.titulo);
      expect(config.codigoReporte).toBe(reporte.codigo);
      expect(config.kpis.length).toBeGreaterThanOrEqual(2);
      expect(config.detalleColumnas.length).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(config.detalleFilas)).toBe(true);

      // Si tiene tablas de resumen, verificar estructura
      if (config.resumenTablas) {
        config.resumenTablas.forEach((tab) => {
          expect(tab.titulo).toBeTruthy();
          expect(tab.columnas.length).toBeGreaterThanOrEqual(2);
          expect(Array.isArray(tab.filas)).toBe(true);
        });
      }

      // Probar generación del blob Excel con ExcelJS
      const blob = await generarLibroExcelEjecutivo(config);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000); // Archivo binario .xlsx real no vacío
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
  );

  it('permite filtrar el reporte de ventas por sucursal específica', () => {
    const configBucaramanga = construirConfigReporte(
      'rep-02-ventas-sucursal',
      'TODO',
      'Punto Bucaramanga'
    );
    expect(configBucaramanga.sedeTexto).toBe('Punto Bucaramanga');
    // Filas de detalle deben corresponder a Bucaramanga
    configBucaramanga.detalleFilas.forEach((fila) => {
      expect(fila.sede).toBe('Punto Bucaramanga');
    });
  });

  it('genera correctamente el reporte de stock bajo con alertas y unidades sugeridas', () => {
    const configStockBajo = construirConfigReporte(
      'rep-05-stock-bajo',
      'TODO',
      'Todas las Sedes (Consolidado)'
    );
    expect(configStockBajo.codigoReporte).toBe('REP-INV-02');
    expect(configStockBajo.kpis.some((k) => k.etiqueta.includes('Alerta'))).toBe(true);
    configStockBajo.detalleFilas.forEach((fila) => {
      expect(fila.disponible).toBeLessThanOrEqual(4);
      expect(fila.sugeridoReponer).toBeGreaterThanOrEqual(0);
    });
  });
});
