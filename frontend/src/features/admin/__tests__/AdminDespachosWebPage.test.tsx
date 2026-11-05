// frontend/src/features/admin/__tests__/AdminDespachosWebPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminDespachosWebPage } from '../pages/AdminDespachosWebPage';
import * as adminService from '../services/adminService';

// Mock del servicio
vi.mock('../services/adminService', () => ({
  fetchPedidosWeb: vi.fn(),
  fetchPedidoWebPorId: vi.fn(),
  iniciarPreparacionPedido: vi.fn(),
  reportarNoPuedoDespachar: vi.fn(),
  despacharPedidoWeb: vi.fn(),
}));

// Mock de crypto.randomUUID para idempotencia
if (!globalThis.crypto) {
  (globalThis as any).crypto = {};
}
if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = () => 'test-uuid-1234';
}

// Mock de los modales para aislar la página
vi.mock('../components/DespachoWebModal', () => ({
  DespachoWebModal: ({ isOpen, pedido, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-despacho-modal">
        <span>Despacho Modal - {pedido?.referenciaLegible}</span>
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null,
}));

vi.mock('../components/NoPuedoDespacharModal', () => ({
  NoPuedoDespacharModal: ({ isOpen, pedido, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-novedad-modal">
        <span>Novedad Modal - {pedido?.referenciaLegible}</span>
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null,
}));

vi.mock('../components/RotuloDespachoPrint', () => ({
  RotuloDespachoPrint: ({ pedido, onClose }: any) => (
    <div data-testid="mock-rotulo">
      <span>Rótulo - {pedido?.referenciaLegible}</span>
      <button onClick={onClose}>Cerrar</button>
    </div>
  ),
}));

// Datos de prueba
const mockPedidos: adminService.PedidoWebDTO[] = [
  {
    id: 1,
    referenciaLegible: 'PED-2026-000001',
    clienteId: 10,
    clienteNombre: 'Cliente Uno',
    ubicacionAsignadaId: 1,
    ubicacionAsignadaNombre: 'Sede Centro',
    tieneIncidenciaStock: false,
    tieneReservaActiva: true,
    estadoPedido: 'RECIBIDO',
    estadoPago: 'PENDIENTE',
    metodoPago: 'TRANSFERENCIA',
    municipioDestinoId: '54001',
    municipioDestinoNombre: 'Cúcuta',
    direccionEntrega: 'Calle 1 # 2-3',
    destinatarioNombre: 'Juan Pérez',
    destinatarioTelefono: '3001234567',
    zonaEnvioCalculada: 1,
    costoEnvioCop: 8000,
    diasEstimadosSnapshot: 2,
    subtotalListaCop: 100000,
    descuentoTotalCop: 0,
    totalNetoProductosCop: 100000,
    totalAPagarCop: 108000,
    fechaCreacion: '2026-11-01T10:00:00Z',
    lineas: [
      {
        id: 1,
        varianteId: 101,
        sku: 'ROP-DNM-001-M',
        nombreProducto: 'Chaqueta Denim',
        talla: 'M',
        color: 'Azul',
        cantidad: 1,
        precioListaUnitarioCop: 100000,
        subtotalListaLineaCop: 100000,
        descuentoProrrateadoCop: 0,
        netoPagadoLineaCop: 100000,
        cantidadDevueltaAcum: 0,
      },
    ],
  },
  {
    id: 2,
    referenciaLegible: 'PED-2026-000002',
    clienteId: 11,
    clienteNombre: 'Cliente Dos',
    ubicacionAsignadaId: 1,
    ubicacionAsignadaNombre: 'Sede Centro',
    tieneIncidenciaStock: false,
    tieneReservaActiva: true,
    estadoPedido: 'EN_PREPARACION',
    estadoPago: 'PAGADO',
    metodoPago: 'TRANSFERENCIA',
    municipioDestinoId: '68001',
    municipioDestinoNombre: 'Bucaramanga',
    direccionEntrega: 'Carrera 4 # 5-6',
    destinatarioNombre: 'María Gómez',
    destinatarioTelefono: '3109876543',
    zonaEnvioCalculada: 3,
    costoEnvioCop: 16000,
    diasEstimadosSnapshot: 4,
    subtotalListaCop: 50000,
    descuentoTotalCop: 0,
    totalNetoProductosCop: 50000,
    totalAPagarCop: 66000,
    fechaCreacion: '2026-11-02T10:00:00Z',
    lineas: [
      {
        id: 2,
        varianteId: 102,
        sku: 'ROP-CAM-002-L',
        nombreProducto: 'Camiseta Algodón',
        talla: 'L',
        color: 'Blanco',
        cantidad: 2,
        precioListaUnitarioCop: 25000,
        subtotalListaLineaCop: 50000,
        descuentoProrrateadoCop: 0,
        netoPagadoLineaCop: 50000,
        cantidadDevueltaAcum: 0,
      },
    ],
  },
  {
    id: 3,
    referenciaLegible: 'PED-2026-000003',
    clienteId: 12,
    clienteNombre: 'Cliente Tres',
    ubicacionAsignadaId: 1,
    ubicacionAsignadaNombre: 'Sede Centro',
    tieneIncidenciaStock: false,
    tieneReservaActiva: true,
    estadoPedido: 'ENVIADO',
    estadoPago: 'PAGADO',
    metodoPago: 'TRANSFERENCIA',
    municipioDestinoId: '11001',
    municipioDestinoNombre: 'Bogotá',
    direccionEntrega: 'Avenida 7 # 8-9',
    destinatarioNombre: 'Carlos Ruiz',
    destinatarioTelefono: '3201112233',
    zonaEnvioCalculada: 4,
    costoEnvioCop: 22000,
    diasEstimadosSnapshot: 6,
    subtotalListaCop: 200000,
    descuentoTotalCop: 0,
    totalNetoProductosCop: 200000,
    totalAPagarCop: 222000,
    fechaCreacion: '2026-11-03T10:00:00Z',
    lineas: [
      {
        id: 3,
        varianteId: 103,
        sku: 'ACC-BOL-003-U',
        nombreProducto: 'Bolso Cuero',
        talla: 'Única',
        color: 'Miel',
        cantidad: 1,
        precioListaUnitarioCop: 200000,
        subtotalListaLineaCop: 200000,
        descuentoProrrateadoCop: 0,
        netoPagadoLineaCop: 200000,
        cantidadDevueltaAcum: 0,
      },
    ],
  },
];

// Helper de render con QueryClient + Router
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AdminDespachosWebPage - SP4-08 (Despachos Web y Novedades)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.fetchPedidosWeb).mockResolvedValue(mockPedidos);
    vi.mocked(adminService.fetchPedidoWebPorId).mockResolvedValue(mockPedidos[2]);
  });

  it('muestra el skeleton de carga inicialmente', async () => {
    vi.mocked(adminService.fetchPedidosWeb).mockImplementation(
      () => new Promise<adminService.PedidoWebDTO[]>(() => {})
    );

    renderWithProviders(<AdminDespachosWebPage />);

    expect(screen.getByTestId('despachos-skeleton')).toBeInTheDocument();
  });

  it('renderiza el título y los tabs de estado con contadores', async () => {
    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Despachos Web/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /Pendientes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /En Preparación/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Enviados/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Todos/i })).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay pedidos', async () => {
    // El tab "Pendientes" hace 2 consultas (RECIBIDO y CONFIRMADO).
    // Usamos mockImplementation para que TODAS devuelvan [] en este test.
    vi.mocked(adminService.fetchPedidosWeb).mockImplementation(async () => []);

    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText(/No hay pedidos en esta categoría/i)).toBeInTheDocument();
    });
  });

  it('muestra el estado de error con botón de reintentar', async () => {
    vi.mocked(adminService.fetchPedidosWeb).mockRejectedValueOnce(new Error('Error de red'));

    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText(/No se pudieron cargar los pedidos web/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('renderiza la tabla de pedidos con la referencia y el destinatario', async () => {
    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText('PED-2026-000001')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
  });

  it('filtra pedidos al cambiar de tab a "En Preparación"', async () => {
    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText('PED-2026-000001')).toBeInTheDocument();
    });

    const tabEnPreparacion = screen.getByRole('tab', { name: /En Preparación/i });
    fireEvent.click(tabEnPreparacion);

    await waitFor(() => {
      expect(adminService.fetchPedidosWeb).toHaveBeenCalledWith({
        estadoPedido: 'EN_PREPARACION',
      });
    });
  });

  it('abre el modal de despacho al pulsar "Despachar" en un pedido EN_PREPARACION', async () => {
    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText('PED-2026-000002')).toBeInTheDocument();
    });

    const botonDespachar = screen.getByRole('button', {
      name: /Despachar PED-2026-000002/i,
    });
    fireEvent.click(botonDespachar);

    await waitFor(() => {
      expect(screen.getByTestId('mock-despacho-modal')).toBeInTheDocument();
      expect(screen.getByText(/Despacho Modal - PED-2026-000002/i)).toBeInTheDocument();
    });
  });

  it('abre el modal de novedad al pulsar "Novedad" en un pedido pendiente', async () => {
    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText('PED-2026-000001')).toBeInTheDocument();
    });

    const botonNovedad = screen.getByRole('button', {
      name: /Reportar novedad de PED-2026-000001/i,
    });
    fireEvent.click(botonNovedad);

    await waitFor(() => {
      expect(screen.getByTestId('mock-novedad-modal')).toBeInTheDocument();
    });
  });

  it('abre el rótulo de despacho al pulsar "Rótulo" en un pedido ENVIADO', async () => {
    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText('PED-2026-000003')).toBeInTheDocument();
    });

    const botonRotulo = screen.getByRole('button', {
      name: /Imprimir rótulo de PED-2026-000003/i,
    });
    fireEvent.click(botonRotulo);

    await waitFor(() => {
      expect(screen.getByTestId('mock-rotulo')).toBeInTheDocument();
      expect(screen.getByText(/Rótulo - PED-2026-000003/i)).toBeInTheDocument();
    });
  });

  it('invoca iniciarPreparacionPedido al pulsar "Preparar" en un pedido pendiente', async () => {
    vi.mocked(adminService.iniciarPreparacionPedido).mockResolvedValueOnce({
      ...mockPedidos[0],
      estadoPedido: 'EN_PREPARACION',
    });

    renderWithProviders(<AdminDespachosWebPage />);

    await waitFor(() => {
      expect(screen.getByText('PED-2026-000001')).toBeInTheDocument();
    });

    const botonPreparar = screen.getByRole('button', {
      name: /Iniciar preparación de PED-2026-000001/i,
    });
    fireEvent.click(botonPreparar);

    await waitFor(() => {
      expect(adminService.iniciarPreparacionPedido).toHaveBeenCalledWith(
        1,
        expect.any(String)
      );
    });
  });
});