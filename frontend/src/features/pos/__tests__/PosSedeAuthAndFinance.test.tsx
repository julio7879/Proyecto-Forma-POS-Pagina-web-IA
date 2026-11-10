// frontend/src/features/pos/__tests__/PosSedeAuthAndFinance.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PosLayout from '../../../layouts/PosLayout';
import PosVentasHistorialPage from '../pages/PosVentasHistorialPage';
import PosArqueoPage from '../pages/PosArqueoPage';
import { abrirSesionCaja, registrarMovimientoCaja, resetCaja } from '../utils/cajaStore';
import { recordPosSale, resetPosLedgerSync } from '../utils/posLedgerSync';

describe('Control Estricto de Acceso por Sede y Validaciones Financieras POS', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPosLedgerSync();
    resetCaja();
    vi.restoreAllMocks();
  });

  describe('1. PosLayout - Autenticación Estricta con Validación de Sede Asignada', () => {
    it('elimina por completo el botón sandbox de demo falso ("Entrar como Cajero Daniela")', () => {
      render(
        <MemoryRouter>
          <PosLayout />
        </MemoryRouter>
      );

      expect(screen.queryByText(/Entrar como Cajero Daniela/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Acceso Rápido de Prueba/i)).not.toBeInTheDocument();
    });

    it('requiere correo, contraseña y selector obligatorio de punto de venta', () => {
      render(
        <MemoryRouter>
          <PosLayout />
        </MemoryRouter>
      );

      expect(screen.getByText('Acceso a Terminal POS')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('vendedor.centro@forma.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(
        screen.getByText('Punto de Venta al que Ingresa (Selector Obligatorio)')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ingresar a Turno POS/i })).toBeInTheDocument();
    });

    it('RECHAZA INMEDIATAMENTE el acceso si Daniela intenta ingresar a Punto Centro', async () => {
      render(
        <MemoryRouter>
          <PosLayout />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('vendedor.centro@forma.com');
      const passInput = screen.getByPlaceholderText('••••••••');
      const sedeSelect = screen.getByRole('combobox');
      const submitBtn = screen.getByRole('button', { name: /Ingresar a Turno POS/i });

      fireEvent.change(emailInput, { target: { value: 'daniela@forma.com' } });
      fireEvent.change(passInput, { target: { value: 'VendedorTest*' } });
      fireEvent.change(sedeSelect, { target: { value: 'Punto Centro (Cúcuta)' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Acceso Denegado: La vendedora Daniela está asignada a Punto Bucaramanga y no tiene autorización para operar en Punto Centro. Contacta al Administrador.'
          )
        ).toBeInTheDocument();
      });

      expect(localStorage.getItem('usuario')).toBeNull();
      expect(localStorage.getItem('forma_pos_sede')).toBeNull();
    });

    it('permite el acceso si Daniela ingresa a su sede asignada (Punto Bucaramanga)', async () => {
      render(
        <MemoryRouter>
          <PosLayout />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('vendedor.centro@forma.com');
      const passInput = screen.getByPlaceholderText('••••••••');
      const sedeSelect = screen.getByRole('combobox');
      const submitBtn = screen.getByRole('button', { name: /Ingresar a Turno POS/i });

      fireEvent.change(emailInput, { target: { value: 'daniela@forma.com' } });
      fireEvent.change(passInput, { target: { value: 'VendedorTest*' } });
      fireEvent.change(sedeSelect, { target: { value: 'Punto Bucaramanga' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('usuario')).not.toBeNull();
        expect(localStorage.getItem('forma_pos_sede')).toBe('Punto Bucaramanga');
      });
    });

    it('permite al Administrador ingresar a cualquier sede del sistema', async () => {
      render(
        <MemoryRouter>
          <PosLayout />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('vendedor.centro@forma.com');
      const passInput = screen.getByPlaceholderText('••••••••');
      const sedeSelect = screen.getByRole('combobox');
      const submitBtn = screen.getByRole('button', { name: /Ingresar a Turno POS/i });

      fireEvent.change(emailInput, { target: { value: 'admin@forma.com' } });
      fireEvent.change(passInput, { target: { value: 'AdminTest*' } });
      fireEvent.change(sedeSelect, { target: { value: 'Punto Ocaña' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('forma_pos_sede')).toBe('Punto Ocaña');
        const user = JSON.parse(localStorage.getItem('usuario') || '{}');
        expect(user.rol).toBe('ADMIN');
      });
    });
  });

  describe('2. PosVentasHistorialPage - Reporte Diario y Exportación Excel (.xlsx)', () => {
    it('muestra el botón dominante de exportación a Excel (.xlsx) y la sede del turno', () => {
      render(<PosVentasHistorialPage />);

      expect(
        screen.getByRole('button', { name: /Exportar Ventas Diarias a Excel \(\.xlsx\)/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Sede Punto Centro/i)).toBeInTheDocument();
      expect(screen.getByText(/Turno:/i)).toBeInTheDocument();
    });

    it('genera la descarga del archivo Excel al hacer clic en el botón dominante', () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-excel-url');
      const mockRevokeObjectURL = vi.fn();
      window.URL.createObjectURL = mockCreateObjectURL;
      window.URL.revokeObjectURL = mockRevokeObjectURL;

      render(<PosVentasHistorialPage />);

      const exportarBtn = screen.getByRole('button', {
        name: /Exportar Ventas Diarias a Excel \(\.xlsx\)/i,
      });
      fireEvent.click(exportarBtn);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(screen.getByText(/generado y descargado correctamente/i)).toBeInTheDocument();
    });
  });

  describe('3. PosArqueoPage - Límite Estricto de Retiros y Disponibilidad de Gaveta (Datos Reales)', () => {
    beforeEach(() => {
      localStorage.setItem('forma_pos_sede', 'Punto Centro (Cúcuta)');
      // Abrir sesión real con base $200.000
      const sesion = abrirSesionCaja(
        'Punto Centro (Cúcuta)',
        'Carlos Mendoza',
        200000,
        'Base inicial verificada'
      );
      // Registrar venta real en efectivo de $1.480.000
      recordPosSale({
        id: 'sale-arqueo-1',
        consecutivo: '#MED-0099',
        fechaHora: 'Hoy · 10:00 a. m.',
        fechaIso: new Date(Date.now() + 1000).toISOString(),
        sesionCajaId: sesion.id,
        vendedor: 'Carlos Mendoza',
        sede: 'Punto Centro (Cúcuta)',
        medioPago: 'EFECTIVO',
        subtotalCop: 1243697,
        iva19Cop: 236303,
        totalCop: 1480000,
        montoRecibidoCop: 1500000,
        cambioCop: 20000,
        prendas: [],
      });
      // Registrar 2 retiros reales ($300.000 + $200.000 = $500.000) -> Saldo en gaveta = $1.180.000
      registrarMovimientoCaja(sesion.id, {
        tipo: 'RETIRO_CAJA_FUERTE',
        montoCop: 300000,
        motivo: 'Traslado preventivo a caja fuerte',
        usuario: 'Carlos Mendoza',
      });
      registrarMovimientoCaja(sesion.id, {
        tipo: 'RETIRO_CAJA_FUERTE',
        montoCop: 200000,
        motivo: 'Custodia en caja fuerte',
        usuario: 'Carlos Mendoza',
      });
    });

    it('muestra claramente en el panel el saldo de efectivo disponible en gaveta y el desglose de vueltos', () => {
      render(<PosArqueoPage />);

      expect(screen.getByText('Efectivo Disponible en Gaveta')).toBeInTheDocument();
      expect(screen.getByText('(-) Cambio / Vueltos Entregados:')).toBeInTheDocument();
      // Base (200.000) + Ventas (1.480.000) - Retiros (500.000) = 1.180.000
      expect(screen.getAllByText(/\$ 1\.180\.000|\$1\.180\.000/).length).toBeGreaterThan(0);
    });

    it('bloquea y alerta en rojo si el monto a retirar supera el efectivo disponible en caja', () => {
      render(<PosArqueoPage />);
      fireEvent.click(screen.getByText('2. Movimientos de Efectivo'));

      const montoInput = screen.getByLabelText(/Monto a Retirar de Gaveta/i);
      const registrarBtn = screen.getByRole('button', { name: /Registrar Retiro/i });

      fireEvent.change(montoInput, { target: { value: '2000000' } });

      expect(
        screen.getByText(/El monto a retirar .* no puede superar el efectivo disponible en caja/i)
      ).toBeInTheDocument();

      expect(registrarBtn).toBeDisabled();
    });

    it('permite registrar el retiro si el monto es menor o igual al disponible en gaveta', () => {
      render(<PosArqueoPage />);
      fireEvent.click(screen.getByText('2. Movimientos de Efectivo'));

      const montoInput = screen.getByLabelText(/Monto a Retirar de Gaveta/i);
      const registrarBtn = screen.getByRole('button', { name: /Registrar Retiro/i });

      fireEvent.change(montoInput, { target: { value: '300000' } });

      expect(
        screen.queryByText(/El monto a retirar .* no puede superar el efectivo disponible en caja/i)
      ).not.toBeInTheDocument();
      expect(registrarBtn).not.toBeDisabled();

      fireEvent.click(registrarBtn);
      expect(screen.getByText(/registrado correctamente/i)).toBeInTheDocument();
    });

    it('rechaza números negativos en los inputs numéricos', () => {
      render(<PosArqueoPage />);
      fireEvent.click(screen.getByText('2. Movimientos de Efectivo'));

      const montoInput = screen.getByLabelText(/Monto a Retirar de Gaveta/i);

      const allowed = fireEvent.keyDown(montoInput, { key: '-' });
      expect(allowed).toBe(false);

      fireEvent.change(montoInput, { target: { value: '-50000' } });
      expect(Number((montoInput as HTMLInputElement).value)).toBe(50000);
    });

    it('permite anular un retiro de caja hecho por error y restaura inmediatamente los fondos a la gaveta', () => {
      render(<PosArqueoPage />);
      fireEvent.click(screen.getByText('2. Movimientos de Efectivo'));

      expect(screen.getAllByText(/\$ 1\.180\.000|\$1\.180\.000/).length).toBeGreaterThan(0);

      const anularBtns = screen.getAllByRole('button', { name: /Anular/i });
      expect(anularBtns.length).toBeGreaterThan(0);

      fireEvent.click(anularBtns[0]);

      expect(screen.getAllByText(/\$ 1\.480\.000|\$1\.480\.000/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Anulado · Fondos Devueltos/i).length).toBeGreaterThan(0);
    });

    it('permite registrar un reintegro de efectivo que suma al saldo disponible en gaveta', () => {
      render(<PosArqueoPage />);
      fireEvent.click(screen.getByText('2. Movimientos de Efectivo'));

      const reintegroTab = screen.getByRole('button', { name: /Reintegro/i });
      fireEvent.click(reintegroTab);

      const montoInput = screen.getByLabelText(/Monto a Reingresar a Gaveta/i);
      fireEvent.change(montoInput, { target: { value: '250000' } });

      const registrarReintegroBtn = screen.getByRole('button', {
        name: /Registrar Reintegro \/ Ingreso/i,
      });
      fireEvent.click(registrarReintegroBtn);

      // $1.180.000 + $250.000 = $1.430.000
      expect(screen.getAllByText(/\$ 1\.430\.000|\$1\.430\.000/).length).toBeGreaterThan(0);
    });
  });
});
