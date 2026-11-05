// frontend/src/features/pos/__tests__/PosSedeAuthAndFinance.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PosLayout from '../../../layouts/PosLayout';
import PosVentasHistorialPage from '../pages/PosVentasHistorialPage';
import PosArqueoPage from '../pages/PosArqueoPage';

describe('Control Estricto de Acceso por Sede y Validaciones Financieras POS', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. PosLayout - Autenticación Estricta con Validación de Sede Asignada', () => {
    it('elimina por completo el botón sandbox de demo falso ("Entrar como Cajero Daniela")', () => {
      render(
        <MemoryRouter>
          <PosLayout />
        </MemoryRouter>
      );

      // El botón sandbox de demo falsa NO debe existir en el DOM
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

      // Credenciales de Daniela pero seleccionando Punto Centro (Cúcuta)
      fireEvent.change(emailInput, { target: { value: 'daniela@forma.com' } });
      fireEvent.change(passInput, { target: { value: 'Vendedor2026*' } });
      fireEvent.change(sedeSelect, { target: { value: 'Punto Centro (Cúcuta)' } });
      fireEvent.click(submitBtn);

      // Alerta visible de error estricta
      await waitFor(() => {
        expect(
          screen.getByText(
            'Acceso Denegado: La vendedora Daniela está asignada a Punto Bucaramanga y no tiene autorización para operar en Punto Centro. Contacta al Administrador.'
          )
        ).toBeInTheDocument();
      });

      // No debe iniciar sesión ni guardar en localStorage
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
      fireEvent.change(passInput, { target: { value: 'Vendedor2026*' } });
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
      fireEvent.change(passInput, { target: { value: 'Admin2026*' } });
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
      // Mock de createObjectURL
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

  describe('3. PosArqueoPage - Límite Estricto de Retiros y Disponibilidad de Gaveta', () => {
    it('muestra claramente en el panel el saldo de efectivo disponible en gaveta', () => {
      render(<PosArqueoPage />);

      expect(screen.getByText('Efectivo Disponible en Gaveta')).toBeInTheDocument();
      // Base (200.000) + Ventas (1.480.000) - Retiros (500.000) = 1.180.000
      expect(screen.getByText(/\$ 1\.180\.000 COP|\$1\.180\.000 COP/)).toBeInTheDocument();
    });

    it('bloquea y alerta en rojo si el monto a retirar supera el efectivo disponible en caja', () => {
      render(<PosArqueoPage />);

      const montoInput = screen.getByLabelText(/Monto a Retirar de Gaveta/i);
      const registrarBtn = screen.getByRole('button', { name: /Registrar Retiro/i });

      // Intentar retirar $2.000.000 cuando solo hay $1.180.000
      fireEvent.change(montoInput, { target: { value: '2000000' } });

      // Mensaje de alerta en rojo
      expect(
        screen.getByText(/El monto a retirar .* no puede superar el efectivo disponible en caja/i)
      ).toBeInTheDocument();

      // Botón debe estar deshabilitado
      expect(registrarBtn).toBeDisabled();
    });

    it('permite registrar el retiro si el monto es menor o igual al disponible en gaveta', () => {
      render(<PosArqueoPage />);

      const montoInput = screen.getByLabelText(/Monto a Retirar de Gaveta/i);
      const registrarBtn = screen.getByRole('button', { name: /Registrar Retiro/i });

      // Retiro válido de $300.000 (dentro del cupo disponible de $1.180.000)
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

      const montoInput = screen.getByLabelText(/Monto a Retirar de Gaveta/i);

      // Simular tecla '-' presionada y verificar que cancela el evento
      const allowed = fireEvent.keyDown(montoInput, { key: '-' });
      expect(allowed).toBe(false);

      // Intentar ingresar string con signo negativo: el sanitizer extrae solo dígitos positivos
      fireEvent.change(montoInput, { target: { value: '-50000' } });
      expect(Number((montoInput as HTMLInputElement).value)).toBe(50000);
    });

    it('permite anular un retiro de caja hecho por error y restaura inmediatamente los fondos a la gaveta', () => {
      render(<PosArqueoPage />);

      // Saldo inicial: $1.180.000 COP
      expect(screen.getByText(/\$ 1\.180\.000 COP|\$1\.180\.000 COP/)).toBeInTheDocument();

      // Buscar los botones de Anular en la bitácora
      const anularBtns = screen.getAllByRole('button', { name: /Anular/i });
      expect(anularBtns.length).toBeGreaterThan(0);

      // Anular el primer retiro (BOV-0081 de $300.000)
      fireEvent.click(anularBtns[0]);

      // Mensaje de éxito informando que los fondos han vuelto a la gaveta
      expect(screen.getByText(/fue ANULADO y los fondos han vuelto a la gaveta/i)).toBeInTheDocument();

      // El saldo disponible en gaveta sube en $300.000 ($1.180.000 + $300.000 = $1.480.000)
      expect(screen.getByText(/\$ 1\.480\.000 COP|\$1\.480\.000 COP/)).toBeInTheDocument();
      expect(screen.getByText(/Anulado · Fondos Devueltos/i)).toBeInTheDocument();
    });

    it('permite registrar un reintegro de efectivo que suma al saldo disponible en gaveta', () => {
      render(<PosArqueoPage />);

      // Saldo inicial: $1.180.000 COP
      expect(screen.getByText(/\$ 1\.180\.000 COP|\$1\.180\.000 COP/)).toBeInTheDocument();

      // Cambiar a la pestaña "Reintegro"
      const reintegroTab = screen.getByRole('button', { name: /Reintegro/i });
      fireEvent.click(reintegroTab);

      // Llenar monto y motivo de reintegro
      const montoInput = screen.getByLabelText(/Monto a Reingresar a Gaveta/i);
      fireEvent.change(montoInput, { target: { value: '250000' } });

      const motivoInput = screen.getByPlaceholderText(/Reintegro por error en retiro previo/i);
      fireEvent.change(motivoInput, { target: { value: 'Devolución de dinero retirado por error' } });

      const submitBtn = screen.getByRole('button', { name: /Registrar Reintegro \/ Ingreso/i });
      fireEvent.click(submitBtn);

      // Mensaje de confirmación
      expect(screen.getByText(/registrado en gaveta correctamente/i)).toBeInTheDocument();

      // El saldo disponible en gaveta se incrementa en $250.000 ($1.180.000 + $250.000 = $1.430.000)
      expect(screen.getByText(/\$ 1\.430\.000 COP|\$1\.430\.000 COP/)).toBeInTheDocument();
    });
  });
});
