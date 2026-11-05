// frontend/src/features/storefront/__tests__/OrdersView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OrdersView } from '../components/orders/OrdersView';
import * as pedidosService from '../services/pedidosWebService';

// Mock del servicio
vi.mock('../services/pedidosWebService', () => ({
  fetchMisPedidos: vi.fn(),
}));

// Datos mock
const MOCK_PEDIDOS: pedidosService.PedidoWebDTO[] = [
  {
    id: 1,
    comprobante: 'PED-2026-000042',
    fechaCreacion: '2026-11-04T10:30:00.000Z',
    estado: 'ENVIADO',
    medioPago: 'TRANSFERENCIA',
    direccionEntrega: 'Calle 10 #25-30, Apto 201',
    municipioNombre: 'Bogotá D.C.',
    departamentoNombre: 'Cundinamarca',
    tarifaFleteCop: 8000,
    subtotalCop: 115000,
    totalCop: 123000,
    ubicacionAsignadaNombre: 'Punto Centro',
    lineas: [
      {
        id: 1,
        varianteId: 101,
        sku: 'ROP-CAM-NEG-M',
        nombreProducto: 'Camiseta Básica Negra',
        talla: 'M',
        color: 'Negro',
        cantidad: 2,
        precioUnitarioCop: 45000,
        subtotalCop: 90000,
      },
      {
        id: 2,
        varianteId: 401,
        sku: 'COS-CRM-100',
        nombreProducto: 'Crema Hidratante Botánica',
        talla: '100ml',
        color: 'Neutro',
        cantidad: 1,
        precioUnitarioCop: 25000,
        subtotalCop: 25000,
      },
    ],
  },
  {
    id: 2,
    comprobante: 'PED-2026-000041',
    fechaCreacion: '2026-11-03T15:20:00.000Z',
    estado: 'ENTREGADO',
    medioPago: 'CONTRAENTREGA',
    direccionEntrega: 'Carrera 43A #1-50',
    municipioNombre: 'Medellín',
    departamentoNombre: 'Antioquia',
    tarifaFleteCop: 16000,
    subtotalCop: 189000,
    totalCop: 205000,
    ubicacionAsignadaNombre: 'Punto Centro',
    lineas: [],
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('OrdersView - SP4-07', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el skeleton de carga inicialmente', async () => {
    vi.mocked(pedidosService.fetchMisPedidos).mockImplementation(
      () => new Promise<pedidosService.PedidoWebDTO[]>(() => {})
    );

    renderWithRouter(<OrdersView />);

    expect(screen.getByTestId('orders-skeleton')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay pedidos', async () => {
    vi.mocked(pedidosService.fetchMisPedidos).mockResolvedValueOnce([]);

    renderWithRouter(<OrdersView />);

    await waitFor(() => {
      expect(screen.getByText(/Aún no tienes pedidos/i)).toBeInTheDocument();
    });

    // CTA "Explorar catálogo"
    expect(screen.getByText(/Explorar catálogo/i)).toBeInTheDocument();
  });

  it('muestra el estado de error con botón de reintentar', async () => {
    vi.mocked(pedidosService.fetchMisPedidos)
      .mockRejectedValueOnce(new Error('Error de conexión'))
      .mockResolvedValueOnce(MOCK_PEDIDOS);

    renderWithRouter(<OrdersView />);

    await waitFor(() => {
      expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument();
    });

    // Reintentar
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(pedidosService.fetchMisPedidos).toHaveBeenCalledTimes(2);
    });

    // Ahora muestra la lista
    await waitFor(() => {
      expect(screen.getByText(/PED-2026-000042/i)).toBeInTheDocument();
    });
  });

  it('renderiza la lista de pedidos con estado y totales', async () => {
    vi.mocked(pedidosService.fetchMisPedidos).mockResolvedValueOnce(MOCK_PEDIDOS);

    renderWithRouter(<OrdersView />);

    await waitFor(() => {
      expect(screen.getByText(/PED-2026-000042/i)).toBeInTheDocument();
      expect(screen.getByText(/PED-2026-000041/i)).toBeInTheDocument();
    });

    // Verificar badges de estado
    expect(screen.getByText(/Enviado/i)).toBeInTheDocument();
    expect(screen.getByText(/Entregado/i)).toBeInTheDocument();

    // Verificar totales formateados (COP entero)
    expect(screen.getByText(/\$ 123\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/\$ 205\.000/i)).toBeInTheDocument();
  });

  it('abre el modal de detalle al hacer clic en "Ver detalle"', async () => {
    vi.mocked(pedidosService.fetchMisPedidos).mockResolvedValueOnce(MOCK_PEDIDOS);

    renderWithRouter(<OrdersView />);

    await waitFor(() => {
      expect(screen.getByText(/PED-2026-000042/i)).toBeInTheDocument();
    });

    // Hacer clic en el primer "Ver detalle"
    const verDetalleButtons = screen.getAllByRole('button', { name: /Ver detalle/i });
    fireEvent.click(verDetalleButtons[0]);

    // Verificar que el modal se abrió
    await waitFor(() => {
      expect(screen.getByText(/Pedido PED-2026-000042/i)).toBeInTheDocument();
    });

    // Verificar que muestra la dirección de entrega
    expect(screen.getByText(/Calle 10 #25-30, Apto 201/i)).toBeInTheDocument();

    // Verificar que muestra la sede despachadora
    expect(screen.getByText(/Punto Centro/i)).toBeInTheDocument();

    // Verificar que muestra los productos
    expect(screen.getByText(/Camiseta Básica Negra/i)).toBeInTheDocument();
    expect(screen.getByText(/Crema Hidratante Botánica/i)).toBeInTheDocument();

    // Verificar totales en el modal (anclaje ^Total:$ evita "Subtotal:")
    expect(screen.getByText(/Envío:/i)).toBeInTheDocument();
    expect(screen.getByText(/^Total:$/i)).toBeInTheDocument();
  });

  it('cierra el modal al hacer clic en "Cerrar"', async () => {
    vi.mocked(pedidosService.fetchMisPedidos).mockResolvedValueOnce(MOCK_PEDIDOS);

    renderWithRouter(<OrdersView />);

    await waitFor(() => {
      expect(screen.getByText(/PED-2026-000042/i)).toBeInTheDocument();
    });

    // Abrir modal
    const verDetalleButtons = screen.getAllByRole('button', { name: /Ver detalle/i });
    fireEvent.click(verDetalleButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Pedido PED-2026-000042/i)).toBeInTheDocument();
    });

    // Cerrar modal (hay 2 botones "Cerrar": X del header y "Cerrar" del footer)
    const closeButtons = screen.getAllByRole('button', { name: /Cerrar/i });
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/Pedido PED-2026-000042/i)).not.toBeInTheDocument();
    });
  });
});