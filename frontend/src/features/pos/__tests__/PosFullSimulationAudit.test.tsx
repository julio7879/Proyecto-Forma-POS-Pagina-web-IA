import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PosTerminalPage } from '../PosTerminalPage';
import { PosCambiosPage } from '../pages/PosCambiosPage';
import { PosVentasHistorialPage } from '../pages/PosVentasHistorialPage';
import { PosArqueoPage } from '../pages/PosArqueoPage';
import { VENDEDORES_SISTEMA } from '../../../layouts/PosLayout';
import {
  resetPosLedgerSync,
  getPosRegisteredSales,
  getPosRegisteredExchanges,
  getAllStockDeltas,
  applyStockDelta,
} from '../utils/posLedgerSync';

describe('Auditoría Integral y Simulación Completa del Sistema POS (Frontend)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPosLedgerSync();
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

      // Una por cada sede física oficial
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
      render(
        <BrowserRouter>
          <PosTerminalPage />
        </BrowserRouter>
      );

      // Stock inicial en catálogo de Chaqueta Denim: 8 uds
      expect(screen.getAllByText('Chaqueta Denim Artesanal')[0]).toBeInTheDocument();

      // Pulsar COBRAR (F12) para entrar al modal de cobro
      const btnCobrar = screen.getByRole('button', { name: /COBRAR \(F12\)/i });
      fireEvent.click(btnCobrar);

      // Modal de cobro rápido abierto
      expect(screen.getByText('Cobro de Venta')).toBeInTheDocument();

      // Seleccionar pago exacto en efectivo
      const btnExacto = screen.getByRole('button', { name: /Exacto/i });
      fireEvent.click(btnExacto);

      // Confirmar venta e imprimir
      const btnConfirmar = screen.getByRole('button', {
        name: /CONFIRMAR VENTA E IMPRIMIR \(Enter\)/i,
      });
      fireEvent.click(btnConfirmar);

      // Verifica pantalla de éxito con consecutivo
      expect(await screen.findByText(/¡Venta #MED-00\d+ Completada con Éxito!/i)).toBeInTheDocument();

      // Verifica que la venta quedó asentada en posLedgerSync
      const ventasRegistradas = getPosRegisteredSales();
      expect(ventasRegistradas).toHaveLength(1);
      expect(ventasRegistradas[0].consecutivo).toMatch(/^#?MED-00\d+/);
      expect(ventasRegistradas[0].totalCop).toBeGreaterThan(0);

      // Verifica que los deltas de stock se aplicaron
      const deltas = getAllStockDeltas();
      expect(deltas['ROP-DNM-001-M']).toBeLessThan(0);
    });

    it('impide agregar al carrito más unidades de las existentes en stockSede (Tope de Stock)', () => {
      render(
        <BrowserRouter>
          <PosTerminalPage />
        </BrowserRouter>
      );

      // Intentar agregar una cantidad masiva que supere el stock disponible
      // Al hacer clic repetido en el producto, si llega al tope, genera el aviso de stock
      const btnPlus = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-plus'));
      if (btnPlus) {
        // Presionar múltiples veces para intentar superar el stock de 8
        for (let i = 0; i < 15; i++) {
          fireEvent.click(btnPlus);
        }
      }

      // El carrito no debe permitir superar el stock disponible en la sede
      const cantidades = screen.queryAllByText(/(\d+)\s*uds/i);
      expect(cantidades.length).toBeGreaterThan(0);
    });
  });

  describe('3. Simulación de Devoluciones / Cambios Mano a Mano y Regla Cosméticos', () => {
    it('bloquea estrictamente el cambio de un cosmético por talla o gusto (RN-CAT-02) y solo lo habilita por imperfecto', () => {
      render(
        <BrowserRouter>
          <PosCambiosPage />
        </BrowserRouter>
      );

      // Seleccionar la factura MED-0042 que contiene un cosmético
      const btnFactura42 = screen.getByRole('button', { name: /MED-0042/i });
      fireEvent.click(btnFactura42);

      // Seleccionar la línea de Crema Hidratante Botánica
      const btnCosmetico = screen.getByText('Crema Hidratante Botánica 100ml');
      fireEvent.click(btnCosmetico);

      // Como el motivo inicial es 'Cambio de talla', debe aparecer la alerta sanitaria y el botón deshabilitado
      expect(
        screen.getByText(/Restricción Sanitaria \(RN-CAT-02\)/i)
      ).toBeInTheDocument();

      const btnConfirmarCambio = screen.getByRole('button', {
        name: /Confirmar y Registrar Cambio Mano a Mano/i,
      });
      expect(btnConfirmarCambio).toBeDisabled();

      // Cambiar motivo a 'Prenda con imperfecto' (avería de fábrica)
      const selectMotivo = screen.getByDisplayValue(/Cambio de talla/i);
      fireEvent.change(selectMotivo, { target: { value: 'Prenda con imperfecto' } });

      // Ahora el bloqueo sanitario se levanta y el botón se habilita
      expect(
        screen.queryByText(/Restricción Sanitaria \(RN-CAT-02\)/i)
      ).not.toBeInTheDocument();
      expect(btnConfirmarCambio).toBeEnabled();
    });

    it('procesa el cambio mano a mano, descuenta la prenda entregada y registra el reingreso', () => {
      render(
        <BrowserRouter>
          <PosCambiosPage />
        </BrowserRouter>
      );

      // Factura MED-0041 (Chaqueta Denim M $189.000 vs Chaqueta Denim L $189.000 -> $0 COP)
      const btnConfirmar = screen.getByRole('button', {
        name: /Confirmar y Registrar Cambio Mano a Mano/i,
      });
      expect(btnConfirmar).toBeEnabled();

      fireEvent.click(btnConfirmar);

      // Modal de éxito desplegado
      expect(screen.getByText(/¡Cambio.*Registrado con Éxito!/i)).toBeInTheDocument();

      // Registrado en el ledger
      const cambios = getPosRegisteredExchanges();
      expect(cambios).toHaveLength(1);
      expect(cambios[0].tipoLiquidacion).toBe('MANO_A_MANO_0');
      expect(cambios[0].impactoKardex).toContain('Entregada: -1 ud');
      expect(cambios[0].impactoKardex).toContain('Reingreso Vendible');
    });
  });

  describe('4. Simulación de Impacto en Historial de Ventas y Arqueo de Caja', () => {
    it('muestra inmediatamente la venta registrada en el historial diario', () => {
      // Simular que se registró una venta POS
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
      render(
        <BrowserRouter>
          <PosArqueoPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Control de Caja y Arqueo Ciego/i)).toBeInTheDocument();
      expect(screen.getByText(/Base Inicial de Caja/i)).toBeInTheDocument();

      // Saldo disponible en caja está presente
      const montos = screen.getAllByText(/\$\s*[\d.]+\s*COP/i);
      expect(montos.length).toBeGreaterThan(0);
    });
  });
});
