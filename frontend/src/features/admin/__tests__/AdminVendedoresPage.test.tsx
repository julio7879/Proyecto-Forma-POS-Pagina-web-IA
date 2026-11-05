// frontend/src/features/admin/__tests__/AdminVendedoresPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminVendedoresPage } from '../pages/AdminVendedoresPage';
import * as adminService from '../services/adminService';

vi.mock('../services/adminService', () => ({
  fetchVendedores: vi.fn(),
  fetchUbicaciones: vi.fn(),
  crearVendedor: vi.fn(),
  actualizarVendedor: vi.fn(),
}));

const MOCK_UBICACIONES: adminService.UbicacionDTO[] = [
  { id: 2, nombre: 'Punto Centro (Cúcuta)', codigo: 'CUC-CEN', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true },
  { id: 3, nombre: 'Punto Caobos (Cúcuta)', codigo: 'CUC-CAO', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true },
  { id: 4, nombre: 'Punto Ocaña', codigo: 'OCA-POS', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true },
  { id: 5, nombre: 'Punto Bucaramanga', codigo: 'BUC-CAB', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true },
  { id: 1, nombre: 'Bodega Central (Cúcuta)', codigo: 'BOD-CEN', tipo: 'BODEGA_CENTRAL', esBodegaCentral: true, activo: true },
];

const MOCK_VENDEDORES: adminService.VendedorDTO[] = [
  {
    id: 101,
    nombreCompleto: 'Daniela Gómez',
    correo: 'vendedor.bucaramanga@forma.com',
    telefono: '315 889 4210',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 5,
    ubicacion: { id: 5, nombre: 'Punto Bucaramanga', codigo: 'BUC-CAB', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-15T08:00:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: true,
    permAnularVentas: false,
    permDevoluciones: true,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: true,
    permPedidosWeb: true,
    permVerVentasPunto: true,
  },
  {
    id: 102,
    nombreCompleto: 'Camilo Torres',
    correo: 'vendedor.centro@forma.com',
    telefono: '312 456 7890',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 2,
    ubicacion: { id: 2, nombre: 'Punto Centro (Cúcuta)', codigo: 'CUC-CEN', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-12T08:00:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: true,
    permAnularVentas: true,
    permDevoluciones: true,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: false,
    permPedidosWeb: false,
    permVerVentasPunto: true,
  },
];

describe('AdminVendedoresPage - Gestión de Sedes y Asignación de Vendedores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.fetchUbicaciones).mockResolvedValue(MOCK_UBICACIONES);
    vi.mocked(adminService.fetchVendedores).mockResolvedValue(MOCK_VENDEDORES);
    vi.mocked(adminService.actualizarVendedor).mockResolvedValue(MOCK_VENDEDORES[0]);
    vi.mocked(adminService.crearVendedor).mockResolvedValue({
      id: 105,
      nombreCompleto: 'Laura Restrepo',
      correo: 'laura@forma.com',
      telefono: '300 123 4567',
      activo: true,
      rol: 'VENDEDOR',
      ubicacionId: 5,
      ubicacion: { id: 5, nombre: 'Punto Bucaramanga', codigo: 'BUC-CAB', tipo: 'TIENDA_FISICA' },
      creadoEn: '2026-11-05T08:00:00Z',
      permVender: true,
      permCaja: true,
      permDescuentoManual: false,
      permAnularVentas: false,
      permDevoluciones: false,
      permVerInventario: true,
      permSolicitarTraslado: true,
      permRecibirTraslado: true,
      permVerOtrosPuntos: false,
      permPedidosWeb: false,
      permVerVentasPunto: true,
    });
  });

  it('renderiza la nómina de vendedores y sedes asignadas sin referencias técnicas a RN-*', async () => {
    const { container } = render(
      <MemoryRouter>
        <AdminVendedoresPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gestión de Vendedores y Sedes POS')).toBeInTheDocument();
      expect(screen.getByText('Daniela Gómez')).toBeInTheDocument();
      expect(screen.getByText('Camilo Torres')).toBeInTheDocument();
    });

    // Verificación de cero citas a RN-* o CA-*
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/RN-[A-Z]+-[0-9]+/);
    expect(textContent).not.toMatch(/CA-[0-9]+/);

    // Métricas del personal
    expect(screen.getByText('Total Vendedores')).toBeInTheDocument();
    expect(screen.getByText('Activos en Turno')).toBeInTheDocument();
    expect(screen.getByText('Puntos Cubiertos')).toBeInTheDocument();
  });

  it('permite reasignar rápidamente la sede de un vendedor directamente desde la tabla', async () => {
    render(
      <MemoryRouter>
        <AdminVendedoresPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Daniela Gómez')).toBeInTheDocument();
    });

    // Encontrar todos los selects con title "Cambiar punto de venta asignado para este vendedor"
    const selectsSede = screen.getAllByTitle('Cambiar punto de venta asignado para este vendedor');
    expect(selectsSede.length).toBeGreaterThan(0);

    // Cambiar la sede de Daniela a Punto Centro (id: 2)
    fireEvent.change(selectsSede[0], { target: { value: '2' } });

    await waitFor(() => {
      expect(adminService.actualizarVendedor).toHaveBeenCalledWith(101, {
        ubicacionId: 2,
      });
      // Banner de notificación de éxito
      expect(screen.getByText(/Sede autorizada actualizada para Daniela Gómez/i)).toBeInTheDocument();
    });
  });

  it('abre el modal de "Nuevo Vendedor" y permite registrar un vendedor con sede obligatoria', async () => {
    render(
      <MemoryRouter>
        <AdminVendedoresPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Daniela Gómez')).toBeInTheDocument();
    });

    const btnNuevo = screen.getByText('Nuevo Vendedor');
    fireEvent.click(btnNuevo);

    // Modal abierto
    expect(screen.getByText('Registrar Nuevo Vendedor')).toBeInTheDocument();

    // Diligenciar formulario
    const inputNombre = screen.getByPlaceholderText('Ej. Daniela Gómez');
    const inputCorreo = screen.getByPlaceholderText('daniela.bucaramanga@forma.com');
    const inputPass = screen.getByPlaceholderText('Mínimo 8 caracteres');

    fireEvent.change(inputNombre, { target: { value: 'Laura Restrepo' } });
    fireEvent.change(inputCorreo, { target: { value: 'laura@forma.com' } });
    fireEvent.change(inputPass, { target: { value: 'Segura123*' } });

    const btnGuardar = screen.getByText('Guardar Vendedor');
    fireEvent.click(btnGuardar);

    await waitFor(() => {
      expect(adminService.crearVendedor).toHaveBeenCalledWith(
        expect.objectContaining({
          nombreCompleto: 'Laura Restrepo',
          correo: 'laura@forma.com',
          password: 'Segura123*',
        })
      );
      expect(screen.getByText(/Vendedor "Laura Restrepo" registrado exitosamente/i)).toBeInTheDocument();
    });
  });
});
