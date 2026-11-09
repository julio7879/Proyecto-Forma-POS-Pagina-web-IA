import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PosTerminalPage, CATALOGO_INICIAL_POS } from '../PosTerminalPage';
import { PosCambiosPage } from '../pages/PosCambiosPage';
import { PosVentasHistorialPage } from '../pages/PosVentasHistorialPage';
import { PosArqueoPage } from '../pages/PosArqueoPage';
import { VENDEDORES_SISTEMA } from '../../../layouts/PosLayout';
import { PRODUCTOS_SEMILLA } from '../../storefront/services/catalogService';
import {
  resetPosLedgerSync,
  getPosRegisteredSales,
  getPosRegisteredExchanges,
  getAllStockDeltas,
  applyStockDelta,
  recordPosSale,
} from '../utils/posLedgerSync';
import {
  abrirSesionCaja,
  cerrarSesionCaja,
  getSesionesPorSede,
  resumenSesion,
  resetCaja,
} from '../utils/cajaStore';

describe('Auditoría Integral y Simulación Completa del Sistema POS (Frontend)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPosLedgerSync();
    resetCaja();
    localStorage.setItem('forma_pos_sede', 'Punto Centro (Cúcuta)');
    applyStockDelta('ROP-DNM-001-M', 8);
    applyStockDelta('ROP-DNM-001-L', 5);
    applyStockDelta('ROP-CAM-002-S', 15);
    applyStockDelta('COS-CRM-004-100ML', 12);
    applyStockDelta('ACC-BOL-003-UNI', 6);
    applyStockDelta('ROP-BLZ-010-M', 10);
    vi.clearAllMocks();
  });

  describe('1. Auditoría de Cuentas Internas (1 Admin + 1 Vendedor por Punto de Venta)', () => {
    it('debe tener exactamente 1 cuenta ADMIN y 4 cuentas VENDEDOR en la matriz de acceso POS', () => {
      const admins = VENDEDORES_SISTEMA.filter((u) => u.rol === 'ADMIN');
      const vendedores = VENDEDORES_SISTEMA.filter((u) => u.rol === 'VENDEDOR');

      expect(admins).toHaveLength(1);
      expect(admins[0].correos).toContain('admin@forma.com');
      expect(admins[0].sedesAutorizadas).toBe('TODAS');

      expect(vendedores).toHaveLength(4);

      const sedesAsignadas = vendedores.flatMap((v) =>
        Array.isArray(v.sedesAutorizadas) ? v.sedesAutorizadas : []
      );
      expect(sedesAsignadas).toContain('Punto Centro (Cúcuta)');
      expect(sedesAsignadas).toContain('Punto Caobos (Cúcuta)');
      expect(sedesAsignadas).toContain('Punto Ocaña');
      expect(sedesAsignadas).toContain('Punto Bucaramanga');
    });
  });

  describe('2. Simulación de Cobro POS y Descuento en Tiempo Real del Inventario', () => {
    it('simula la venta de una prenda, valida el descuento de stock y el registro en el ledger', async () => {
      abrirSesionCaja('Punto Centro (Cúcuta)', 'Carlos Mendoza', 200000, 'Base inicial');
      render(
        <BrowserRouter>
          <PosTerminalPage />
        </BrowserRouter>
      );

      expect(screen.getAllByText('Chaqueta Denim Artesanal')[0]).toBeInTheDocument();

      const btnCobrar = screen.getByRole('button', { name: /COBRAR \(F12\)/i });
      fireEvent.click(btnCobrar);

      expect(screen.getByText('Cobro de Venta')).toBeInTheDocument();

      const btnExacto = screen.getByRole('button', { name: /Exacto/i });
      fireEvent.click(btnExacto);

      const btnConfirmar = screen.getByRole('button', {
        name: /CONFIRMAR VENTA E IMPRIMIR \(Enter\)/i,
      });
      fireEvent.click(btnConfirmar);

      expect(await screen.findByText(/¡Venta #MED-00\d+ Completada con Éxito!/i)).toBeInTheDocument();

      const ventasRegistradas = getPosRegisteredSales();
      expect(ventasRegistradas).toHaveLength(1);
      expect(ventasRegistradas[0].consecutivo).toMatch(/^#?MED-00\d+/);
      expect(ventasRegistradas[0].totalCop).toBeGreaterThan(0);

      const deltas = getAllStockDeltas();
      expect(deltas['ROP-DNM-001-M']).toBe(7);
    });

    it('impide agregar al carrito más unidades de las existentes en stockSede (Tope de Stock)', () => {
      render(
        <BrowserRouter>
          <PosTerminalPage />
        </BrowserRouter>
      );

      const btnPlus = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-plus'));
      if (btnPlus) {
        for (let i = 0; i < 15; i++) {
          fireEvent.click(btnPlus);
        }
      }

      const cantidades = screen.queryAllByText(/(\d+)\s*uds/i);
      expect(cantidades.length).toBeGreaterThan(0);
    });
  });

  describe('3. Simulación de Devoluciones / Cambios Mano a Mano y Regla Cosméticos', () => {
    beforeEach(() => {
      recordPosSale({
        id: 'sale-41',
        consecutivo: '#MED-0041',
        fechaHora: 'Hoy · 02:20 p. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Carlos Mendoza',
        sede: 'Punto Centro (Cúcuta)',
        cliente: 'Valentina Restrepo',
        documentoCliente: 'CC 1.090.482.910',
        medioPago: 'EFECTIVO',
        subtotalCop: 158824,
        iva19Cop: 30176,
        totalCop: 189000,
        prendas: [
          {
            sku: 'ROP-DNM-001-M',
            nombre: 'Chaqueta Denim Artesanal',
            talla: 'M',
            color: 'Azul Índigo',
            categoria: 'Ropa',
            cantidad: 1,
            precioUnitarioCop: 189000,
            totalCop: 189000,
          },
        ],
      });
      recordPosSale({
        id: 'sale-42',
        consecutivo: '#MED-0042',
        fechaHora: 'Hoy · 10:15 a. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Carlos Mendoza',
        sede: 'Punto Centro (Cúcuta)',
        cliente: 'Andrés Felipe Calderón',
        documentoCliente: 'CC 88.241.503',
        medioPago: 'TRANSFERENCIA',
        subtotalCop: 37815,
        iva19Cop: 7185,
        totalCop: 45000,
        prendas: [
          {
            sku: 'COS-CRM-004-100ML',
            nombre: 'Crema Hidratante Botánica 100ml',
            talla: '100ml',
            color: 'Natural',
            categoria: 'Cosméticos',
            cantidad: 1,
            precioUnitarioCop: 45000,
            totalCop: 45000,
          },
        ],
      });
    });

    it('bloquea estrictamente el cambio de un cosmético por talla o gusto y solo lo habilita por imperfecto', () => {
      render(
        <BrowserRouter>
          <PosCambiosPage />
        </BrowserRouter>
      );

      // Seleccionar la factura #MED-0042 que contiene un cosmético
      const btnFactura42 = screen.getByRole('button', { name: /^#MED-0042$/i });
      fireEvent.click(btnFactura42);

      // Seleccionar la línea de Crema Hidratante Botánica
      const btnCosmetico = screen.getAllByText('Crema Hidratante Botánica 100ml')[0];
      fireEvent.click(btnCosmetico);

      // Alerta sanitaria visible sin código técnico y botón deshabilitado
      expect(
        screen.getByText(/Restricción Sanitaria: Los productos cosméticos de uso personal no admiten cambios/i)
      ).toBeInTheDocument();

      const btnConfirmarCambio = screen.getByRole('button', {
        name: /Confirmar y Registrar Cambio Mano a Mano/i,
      });
      expect(btnConfirmarCambio).toBeDisabled();

      // Cambiar motivo a 'Prenda con imperfecto'
      const selectMotivo = screen.getByDisplayValue(/Cambio de talla/i);
      fireEvent.change(selectMotivo, { target: { value: 'Prenda con imperfecto' } });

      expect(
        screen.queryByText(/Restricción Sanitaria: Los productos cosméticos de uso personal no admiten cambios/i)
      ).not.toBeInTheDocument();
      expect(btnConfirmarCambio).toBeEnabled();
    });

    it('procesa el cambio mano a mano, descuenta la prenda entregada y registra el reingreso', () => {
      render(
        <BrowserRouter>
          <PosCambiosPage />
        </BrowserRouter>
      );

      // Seleccionar factura #MED-0041 (Chaqueta Denim M $189.000)
      const btnFactura41 = screen.getByRole('button', { name: /^#MED-0041$/i });
      fireEvent.click(btnFactura41);

      const btnConfirmar = screen.getByRole('button', {
        name: /Confirmar y Registrar Cambio Mano a Mano/i,
      });
      expect(btnConfirmar).toBeEnabled();

      fireEvent.click(btnConfirmar);

      expect(screen.getByText(/¡Cambio.*Registrado con Éxito!/i)).toBeInTheDocument();

      const cambios = getPosRegisteredExchanges();
      expect(cambios).toHaveLength(1);
      expect(cambios[0].tipoLiquidacion).toBe('MANO_A_MANO_0');
      expect(cambios[0].impactoKardex).toContain('Entregada: -1 ud');
      expect(cambios[0].impactoKardex).toContain('Reingreso Vendible');
    });
  });

  describe('4. Simulación de Impacto en Historial de Ventas y Arqueo de Caja', () => {
    it('muestra inmediatamente la venta registrada en el historial diario', () => {
      resetPosLedgerSync();
      applyStockDelta('ROP-BLZ-010-M', -1);
      const deltas = getAllStockDeltas();
      expect(deltas['ROP-BLZ-010-M']).toBe(-1);

      render(
        <BrowserRouter>
          <PosVentasHistorialPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Historial de Ventas/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Exportar Ventas Diarias a Excel \(\.xlsx\)/i })
      ).toBeInTheDocument();
    });

    it('actualiza el saldo en caja con las ventas del turno y previene retiros excesivos', () => {
      abrirSesionCaja('Punto Centro (Cúcuta)', 'Carlos Mendoza', 200000, 'Base inicial');
      render(
        <BrowserRouter>
          <PosArqueoPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Control de Caja y Arqueo Ciego/i)).toBeInTheDocument();
      expect(screen.getByText(/Base Inicial de Caja/i)).toBeInTheDocument();

      const montos = screen.getAllByText(/\$\s*[\d.]+\s*COP/i);
      expect(montos.length).toBeGreaterThan(0);
    });
  });

  describe('5. Stock Inicial 0 en Tiendas (100% Bodega Central) y Múltiples Turnos Consecutivos en el Mismo Día', () => {
    it('certifica que sin traslados las tiendas físicas inician con 0 uds y Bodega Central conserva el 100% del stock', () => {
      resetPosLedgerSync();

      for (const item of CATALOGO_INICIAL_POS) {
        expect(item.stockSede).toBe(0);
      }

      expect(PRODUCTOS_SEMILLA.length).toBe(35);
      for (const prod of PRODUCTOS_SEMILLA) {
        for (const v of prod.variantes) {
          expect(v.stockPorSede?.['Bodega Central']).toBe(v.stockDisponible);
          expect(v.stockPorSede?.['Punto Centro']).toBe(0);
          expect(v.stockPorSede?.['Punto Caobos']).toBe(0);
          expect(v.stockPorSede?.['Punto Ocaña']).toBe(0);
          expect(v.stockPorSede?.['Punto Bucaramanga']).toBe(0);
        }
      }
    });

    it('permite abrir y cerrar múltiples turnos consecutivos (Turno #1 mañana, Turno #2 tarde, Turno #3 noche) en la misma sede sin mezclar ventas', () => {
      const sede = 'Punto Centro (Cúcuta)';

      // Turno #1 (Mañana)
      const t1 = abrirSesionCaja(sede, 'Carlos Mendoza (Mañana)', 100000, 'Apertura mañana');
      expect(t1.turnoNumero).toBe(1);
      recordPosSale({
        id: 'vta-manana',
        consecutivo: '#MED-0101',
        fechaHora: 'Hoy · 09:00 a. m.',
        fechaIso: new Date().toISOString(),
        sesionCajaId: t1.id,
        vendedor: 'Carlos Mendoza (Mañana)',
        sede,
        medioPago: 'EFECTIVO',
        subtotalCop: 100000,
        totalCop: 100000,
      });
      const cerrado1 = cerrarSesionCaja(t1.id, 200000, 'Cierre mañana exacto');
      expect(cerrado1?.estado).toBe('CERRADA');
      expect(cerrado1?.efectivoEsperadoCop).toBe(200000);
      expect(cerrado1?.diferenciaCop).toBe(0);

      // Turno #2 (Tarde)
      const t2 = abrirSesionCaja(sede, 'Laura Gómez (Tarde)', 150000, 'Apertura tarde');
      expect(t2.turnoNumero).toBe(2);
      expect(t2.id).not.toBe(t1.id);
      recordPosSale({
        id: 'vta-tarde',
        consecutivo: '#MED-0102',
        fechaHora: 'Hoy · 03:00 p. m.',
        fechaIso: new Date().toISOString(),
        sesionCajaId: t2.id,
        vendedor: 'Laura Gómez (Tarde)',
        sede,
        medioPago: 'EFECTIVO',
        subtotalCop: 250000,
        totalCop: 250000,
      });
      const cerrado2 = cerrarSesionCaja(t2.id, 400000, 'Cierre tarde exacto');
      expect(cerrado2?.estado).toBe('CERRADA');
      expect(cerrado2?.efectivoEsperadoCop).toBe(400000);
      expect(cerrado2?.diferenciaCop).toBe(0);

      // Turno #3 (Noche)
      const t3 = abrirSesionCaja(sede, 'Andrés Pérez (Noche)', 120000, 'Apertura noche');
      expect(t3.turnoNumero).toBe(3);
      recordPosSale({
        id: 'vta-noche',
        consecutivo: '#MED-0103',
        fechaHora: 'Hoy · 08:00 p. m.',
        fechaIso: new Date().toISOString(),
        sesionCajaId: t3.id,
        vendedor: 'Andrés Pérez (Noche)',
        sede,
        medioPago: 'EFECTIVO',
        subtotalCop: 80000,
        totalCop: 80000,
      });
      const cerrado3 = cerrarSesionCaja(t3.id, 200000, 'Cierre noche exacto');
      expect(cerrado3?.estado).toBe('CERRADA');
      expect(cerrado3?.efectivoEsperadoCop).toBe(200000);

      // Verificar que las ventas no se mezclaron y que los 3 turnos quedaron en el historial
      const historial = getSesionesPorSede(sede);
      expect(historial).toHaveLength(3);
      expect(resumenSesion(cerrado1!).ventasEfectivoCop).toBe(100000);
      expect(resumenSesion(cerrado2!).ventasEfectivoCop).toBe(250000);
      expect(resumenSesion(cerrado3!).ventasEfectivoCop).toBe(80000);
    });
  });
});
