import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BolsaPage } from '../BolsaPage';
import { StorefrontCartProvider } from '../../context/StorefrontCartContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BolsaPage Component - Vista Completa de Bolsa de Compras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra estado vacío elegante cuando la bolsa no tiene prendas', () => {
    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <BolsaPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Tu bolsa de compras está vacía')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explorar Colecciones/i })).toBeInTheDocument();
  });

  it('renderiza la lista de prendas con steppers, IVA 19% discriminado y resumen financiero', () => {
    const mockPrendas = [
      {
        id: 'var-vestido-01',
        productoId: 'prod-01',
        nombre: 'Vestido Lino Silvestre',
        sku: 'VES-LIN-01-S',
        talla: 'S',
        color: 'Crudo Natural',
        precioUnitarioCOP: 238000,
        cantidad: 2,
        imagenUrl: 'https://images.unsplash.com/photo-test',
        sedeDespacho: 'Cúcuta Central',
      },
    ];
    localStorage.setItem('forma_cart_guest', JSON.stringify(mockPrendas));

    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <BolsaPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Tu Bolsa de Compras')).toBeInTheDocument();
    expect(screen.getByText('Vestido Lino Silvestre')).toBeInTheDocument();
    expect(screen.getByText(/Talla: S/i)).toBeInTheDocument();
    expect(screen.getByText(/Color: Crudo Natural/i)).toBeInTheDocument();
    expect(screen.getByText(/SKU: VES-LIN-01-S/i)).toBeInTheDocument();

    // Verificación de dinero entero y desglose IVA 19%
    expect(screen.getByText('Resumen de Compra')).toBeInTheDocument();
    expect(screen.getByText(/Base gravable estimada \(19%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/IVA discriminado \(19%\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CONTINUAR CON EL PAGO/i })).toBeInTheDocument();
  });

  it('redirige a /checkout al pulsar CONTINUAR CON EL PAGO', () => {
    const mockPrendas = [
      {
        id: 'var-ruana-01',
        productoId: 'prod-02',
        nombre: 'Ruana Lana de Boyacá',
        sku: 'RUA-LAN-01-U',
        talla: 'Única',
        color: 'Gris Ovejero',
        precioUnitarioCOP: 320000,
        cantidad: 1,
        imagenUrl: 'https://images.unsplash.com/photo-test',
        sedeDespacho: 'CUCUTA_CENTRAL',
      },
    ];
    localStorage.setItem('forma_cart_guest', JSON.stringify(mockPrendas));

    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <BolsaPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    const ctaBtn = screen.getByRole('button', { name: /CONTINUAR CON EL PAGO/i });
    fireEvent.click(ctaBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
