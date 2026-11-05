// frontend/src/features/pos/__tests__/PosTerminalPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PosTerminalPage } from '../PosTerminalPage';
import * as posService from '../services/posService';

// Mock del servicio POS
vi.mock('../services/posService', () => ({
  searchProduct: vi.fn(),
  submitSale: vi.fn(),
}));

// Datos mock para búsqueda
const MOCK_PRODUCTOS: posService.ProductoBusquedaDTO[] = [
  {
    productoId: 1,
    nombre: 'Chaqueta Denim Artesanal',
    categoriaNombre: 'Ropa',
    categoriaSlug: 'ropa',
    esCosmeticoUsoPersonal: false,
    variantes: [
      {
        varianteId: 101,
        sku: 'ROP-DNM-001-M',
        talla: 'M',
        color: 'Azul Índigo',
        precioUnitarioCop: 189000,
        stockDisponible: 5,
      },
    ],
  },
  {
    productoId: 4,
    nombre: 'Crema Hidratante Botánica 100ml',
    categoriaNombre: 'Cosméticos',
    categoriaSlug: 'cosmeticos',
    esCosmeticoUsoPersonal: true,
    variantes: [
      {
        varianteId: 401,
        sku: 'COS-CRM-004-100ML',
        talla: '100ml',
        color: 'Neutro',
        precioUnitarioCop: 45000,
        stockDisponible: 10,
      },
    ],
  },
];

// Ticket mock de respuesta
const MOCK_VENTA_RESPONSE = {
  ticket: {
    nombreTienda: 'Forma Store',
    nombreSede: 'Sede Medellín',
    consecutivo: 'MED-000042',
    fechaHora: '04/11/2026, 10:00 a.m.',
    cajeroNombre: 'Exneider',
    clienteNombre: 'Consumidor Final',
    items: [],
    subtotalCop: 189000,
    descuentoTotalCop: 0,
    ivaDiscriminadoCop: 30176,
    totalNetoCop: 189000,
    metodoPago: 'EFECTIVO' as const,
    montoRecibidoCop: 200000,
    cambioCop: 11000,
  },
  consecutivo: 'MED-000042',
};

describe('PosTerminalPage - SP3-06 (Terminal POS Refactorizado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  it('renderiza la estructura ergonómica a dos columnas (CA-53)', () => {
    render(<PosTerminalPage />);

    expect(
      screen.getByPlaceholderText(/Escanear código de barras/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Consumidor Final/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /COBRAR \(F12\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Carrito de venta vacío/i)).toBeInTheDocument();
  });

  it('realiza búsqueda server-side al escribir (debounce 300ms)', async () => {
    vi.mocked(posService.searchProduct).mockResolvedValueOnce(MOCK_PRODUCTOS);

    render(<PosTerminalPage />);

    const searchInput = screen.getByPlaceholderText(/Escanear código de barras/i);
    fireEvent.change(searchInput, { target: { value: 'chaqueta' } });

    await waitFor(
      () => {
        expect(posService.searchProduct).toHaveBeenCalledWith('chaqueta');
      },
      { timeout: 1000 }
    );

    await waitFor(() => {
      expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    });
  });

  it('agrega productos al carrito al hacer clic en el resultado de búsqueda', async () => {
    vi.mocked(posService.searchProduct).mockResolvedValueOnce(MOCK_PRODUCTOS);

    render(<PosTerminalPage />);

    const searchInput = screen.getByPlaceholderText(/Escanear código de barras/i);
    fireEvent.change(searchInput, { target: { value: 'chaqueta' } });

    await waitFor(() => {
      expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    });

    const productButton = screen
      .getByText('Chaqueta Denim Artesanal')
      .closest('button');
    fireEvent.click(productButton!);

    await waitFor(() => {
      expect(screen.queryByText(/Carrito de venta vacío/i)).not.toBeInTheDocument();
    });
  });

  it('abre el modal de cobro y muestra los botones rápidos de billetes', async () => {
    vi.mocked(posService.searchProduct).mockResolvedValueOnce(MOCK_PRODUCTOS);

    render(<PosTerminalPage />);

    const searchInput = screen.getByPlaceholderText(/Escanear código de barras/i);
    fireEvent.change(searchInput, { target: { value: 'chaqueta' } });
    await waitFor(() => {
      expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    });

    const productButton = screen
      .getByText('Chaqueta Denim Artesanal')
      .closest('button');
    fireEvent.click(productButton!);

    await waitFor(() => {
      expect(screen.queryByText(/Carrito de venta vacío/i)).not.toBeInTheDocument();
    });

    const cobrarBtn = screen.getByRole('button', { name: /COBRAR \(F12\)/i });
    fireEvent.click(cobrarBtn);

    expect(screen.getByText(/Cobro de Venta Mostrador/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EFECTIVO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TRANSFERENCIA/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+$100k' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exacto' })).toBeInTheDocument();
  });

  it('confirma la venta con Idempotency-Key y abre el modal de éxito', async () => {
    vi.mocked(posService.searchProduct).mockResolvedValueOnce(MOCK_PRODUCTOS);
    vi.mocked(posService.submitSale).mockResolvedValueOnce(MOCK_VENTA_RESPONSE);

    render(<PosTerminalPage />);

    // 1. Agregar producto
    const searchInput = screen.getByPlaceholderText(/Escanear código de barras/i);
    fireEvent.change(searchInput, { target: { value: 'chaqueta' } });
    await waitFor(() => {
      expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    });
    const productButton = screen
      .getByText('Chaqueta Denim Artesanal')
      .closest('button');
    fireEvent.click(productButton!);

    // 2. Abrir modal de cobro
    await waitFor(() => {
      expect(screen.queryByText(/Carrito de venta vacío/i)).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /COBRAR \(F12\)/i }));

    // 3. Confirmar venta
    await waitFor(() => {
      expect(screen.getByText(/Cobro de Venta Mostrador/i)).toBeInTheDocument();
    });
    const confirmBtn = screen.getByRole('button', {
      name: /CONFIRMAR VENTA E IMPRIMIR/i,
    });
    fireEvent.click(confirmBtn);

    // 4. Verificar llamada a submitSale con Idempotency-Key
    await waitFor(() => {
      expect(posService.submitSale).toHaveBeenCalledWith(
        expect.objectContaining({
          lineas: expect.arrayContaining([
            expect.objectContaining({ varianteId: 101, cantidad: 1 }),
          ]),
        }),
        expect.any(String) // Idempotency-Key
      );
    });

    // 5. Verificar que el modal de éxito muestra el consecutivo real
    // (usamos getAllByText porque el ticket oculto también contiene el consecutivo)
    await waitFor(() => {
      expect(screen.getAllByText(/MED-000042/i).length).toBeGreaterThan(0);
    });
  });

  it('deshabilita el botón de confirmar durante isSubmitting (RN-GEN-08)', async () => {
    vi.mocked(posService.searchProduct).mockResolvedValueOnce(MOCK_PRODUCTOS);

    let resolveSubmit: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });
    vi.mocked(posService.submitSale).mockReturnValueOnce(pendingPromise as any);

    render(<PosTerminalPage />);

    // 1. Agregar producto
    const searchInput = screen.getByPlaceholderText(/Escanear código de barras/i);
    fireEvent.change(searchInput, { target: { value: 'chaqueta' } });
    await waitFor(() => {
      expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByText('Chaqueta Denim Artesanal').closest('button')!
    );

    // 2. Abrir modal y confirmar
    await waitFor(() => {
      expect(screen.queryByText(/Carrito de venta vacío/i)).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /COBRAR \(F12\)/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cobro de Venta Mostrador/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', {
      name: /CONFIRMAR VENTA E IMPRIMIR/i,
    });
    fireEvent.click(confirmBtn);

    // 3. El botón debe estar deshabilitado y mostrar "Procesando..."
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Procesando/i })).toBeDisabled();
    });

    // 4. Resolver la promesa dentro de act() para evitar warnings
    await act(async () => {
      resolveSubmit!(MOCK_VENTA_RESPONSE);
    });
  });

  it('muestra error del backend si submitSale falla', async () => {
    vi.mocked(posService.searchProduct).mockResolvedValueOnce(MOCK_PRODUCTOS);
    vi.mocked(posService.submitSale).mockRejectedValueOnce(
      new Error('Stock insuficiente en la variante')
    );

    render(<PosTerminalPage />);

    // Agregar producto
    const searchInput = screen.getByPlaceholderText(/Escanear código de barras/i);
    fireEvent.change(searchInput, { target: { value: 'chaqueta' } });
    await waitFor(() => {
      expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByText('Chaqueta Denim Artesanal').closest('button')!
    );

    // Abrir modal y confirmar
    await waitFor(() => {
      expect(screen.queryByText(/Carrito de venta vacío/i)).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /COBRAR \(F12\)/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cobro de Venta Mostrador/i)).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /CONFIRMAR VENTA E IMPRIMIR/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/Stock insuficiente/i)).toBeInTheDocument();
    });
  });
});