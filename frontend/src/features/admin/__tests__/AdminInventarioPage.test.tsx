// frontend/src/features/admin/__tests__/AdminInventarioPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminInventarioPage } from '../pages/AdminInventarioPage';
import * as adminService from '../services/adminService';

// Mock del servicio
vi.mock('../services/adminService', () => ({
  fetchInventario: vi.fn(),
}));

// Mock de datos
const MOCK_INVENTARIO: adminService.InventarioDTO[] = [
  {
    id: 1,
    sku: 'SKU-CAM-NEG-M',
    nombreProducto: 'Camiseta Básica Negra',
    categoriaNombre: 'Ropa',
    sedeId: 2,
    sedeNombre: 'Punto Centro',
    fisico: 25,
    disponible: 20,
    reservadoBlando: 3,
    reservadoDuro: 2,
    noVendible: 0,
    umbralStockBajo: 5,
  },
  {
    id: 2,
    sku: 'SKU-GOR-AZU-U',
    nombreProducto: 'Gorra Urbana Azul',
    categoriaNombre: 'Accesorios',
    sedeId: 2,
    sedeNombre: 'Punto Centro',
    fisico: 3,
    disponible: 1,
    reservadoBlando: 2,
    reservadoDuro: 0,
    noVendible: 0,
    umbralStockBajo: 5,
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

describe('AdminInventarioPage - SP2-05', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el skeleton de carga inicialmente', async () => {
    // Dejamos la promesa pendiente para ver el Loading (tipada para TS)
    vi.mocked(adminService.fetchInventario).mockImplementation(
      () => new Promise<adminService.InventarioDTO[]>(() => {}) // nunca resuelve
    );

    renderWithProviders(<AdminInventarioPage />);

    expect(screen.getByTestId('inventario-skeleton')).toBeInTheDocument();
  });

  it('renderiza la tabla con los datos del inventario tras cargar', async () => {
    vi.mocked(adminService.fetchInventario).mockResolvedValueOnce(MOCK_INVENTARIO);

    renderWithProviders(<AdminInventarioPage />);

    await waitFor(() => {
      expect(screen.getByText('SKU-CAM-NEG-M')).toBeInTheDocument();
      expect(screen.getByText('Camiseta Básica Negra')).toBeInTheDocument();
      // getAllByText porque hay 2 filas con "Punto Centro"
      expect(screen.getAllByText('Punto Centro').length).toBeGreaterThan(0);
    });
  });

  it('filtra por SKU al escribir en el buscador (debounce 300ms)', async () => {
    vi.mocked(adminService.fetchInventario).mockResolvedValue(MOCK_INVENTARIO);

    renderWithProviders(<AdminInventarioPage />);

    // Esperar carga inicial
    await waitFor(() => {
      expect(screen.getByText('SKU-CAM-NEG-M')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por SKU o nombre/i);
    fireEvent.change(searchInput, { target: { value: 'GOR' } });

    // El debounce se resuelve tras 300ms → usar waitFor
    await waitFor(
      () => {
        expect(adminService.fetchInventario).toHaveBeenCalledWith(
          expect.objectContaining({ sku: 'GOR' })
        );
      },
      { timeout: 1000 }
    );
  });

  it('muestra el estado vacío cuando la API no retorna datos', async () => {
    vi.mocked(adminService.fetchInventario).mockResolvedValueOnce([]);

    renderWithProviders(<AdminInventarioPage />);

    await waitFor(() => {
      expect(screen.getByText(/No se encontraron registros/i)).toBeInTheDocument();
    });
  });

  it('muestra el estado de error con botón de reintentar', async () => {
    vi.mocked(adminService.fetchInventario).mockRejectedValueOnce(
      new Error('Error de red')
    );

    renderWithProviders(<AdminInventarioPage />);

    await waitFor(() => {
      expect(screen.getByText(/No se pudo cargar el inventario/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('muestra el toggle de stock bajo y filtra por él', async () => {
    vi.mocked(adminService.fetchInventario).mockResolvedValue(MOCK_INVENTARIO);

    renderWithProviders(<AdminInventarioPage />);

    await waitFor(() => {
      expect(screen.getByText('SKU-CAM-NEG-M')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('checkbox', { name: /Stock bajo/i });
    fireEvent.click(toggle);

    await waitFor(
      () => {
        expect(adminService.fetchInventario).toHaveBeenCalledWith(
          expect.objectContaining({ stockBajo: true })
        );
      },
      { timeout: 1000 }
    );
  });

  it('resalta visualmente las filas con stock bajo', async () => {
    vi.mocked(adminService.fetchInventario).mockResolvedValueOnce(MOCK_INVENTARIO);

    renderWithProviders(<AdminInventarioPage />);

    await waitFor(() => {
      // Gorra tiene disponible=1 <= umbralStockBajo=5, debe tener el AlertTriangle
      const alerts = screen.getAllByLabelText('Stock bajo');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});