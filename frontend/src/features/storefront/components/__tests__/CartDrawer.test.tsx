import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartDrawer } from '../CartDrawer';
import { CartItem } from '../../types';

describe('CartDrawer Component - Floating Liquid Glass Side Panel (SP1-08)', () => {
  const mockItems: CartItem[] = [
    {
      id: 'var-001',
      productoId: 'prod-001',
      nombre: 'Chaqueta Denim Artesanal',
      sku: 'ROP-DNM-001-M',
      talla: 'M',
      color: 'Azul Índigo',
      precioUnitarioCOP: 189000,
      cantidad: 1,
      imagenUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
      sedeDespacho: 'MEDELLIN',
    },
    {
      id: 'var-002',
      productoId: 'prod-002',
      nombre: 'Camiseta Algodón Pima',
      sku: 'ROP-CAM-002-L',
      talla: 'L',
      precioUnitarioCOP: 59900,
      cantidad: 2,
      imagenUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
      sedeDespacho: 'MEDELLIN',
    },
  ];

  it('no renderiza nada en el DOM cuando isOpen es false', () => {
    const { container } = render(
      <CartDrawer
        isOpen={false}
        onClose={vi.fn()}
        items={mockItems}
        onUpdateCantidad={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza la lista de ítems, el total en COP entero y la leyenda de retracto legal Ley 1480 cuando isOpen es true', () => {
    render(
      <CartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
        onUpdateCantidad={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    expect(screen.getByText('Tu Carrito de Compras')).toBeInTheDocument();
    expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    expect(screen.getByText('Camiseta Algodón Pima')).toBeInTheDocument();

    // Verificación de leyenda legal de 5 días de retracto (RN-DEV-01)
    expect(
      screen.getByText(/5 días hábiles/i)
    ).toBeInTheDocument();

    // Verificación de botón de checkout seguro
    expect(
      screen.getByRole('button', { name: /Continuar al Pago Seguro/i })
    ).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando la lista de ítems está vacía', () => {
    render(
      <CartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={[]}
        onUpdateCantidad={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(
      screen.getByText(/Explora las colecciones y añade prendas exclusivas/i)
    ).toBeInTheDocument();
  });

  it('invoca onClose al presionar la tecla Escape o pulsar el botón de cerrar', () => {
    const onCloseMock = vi.fn();

    render(
      <CartDrawer
        isOpen={true}
        onClose={onCloseMock}
        items={mockItems}
        onUpdateCantidad={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    const botonCerrar = screen.getByRole('button', { name: /Cerrar carrito de compras/i });
    fireEvent.click(botonCerrar);

    expect(onCloseMock).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });
});
