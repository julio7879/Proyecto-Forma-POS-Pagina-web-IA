import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BentoGridHero } from '../BentoGridHero';
import { SedeInfo } from '../../types';

describe('BentoGridHero Component - Apple Liquid Glass Storefront (SP1-08)', () => {
  const mockSede: SedeInfo = {
    id: 'MEDELLIN',
    nombre: 'Sede Principal (Medellín)',
    ciudad: 'Medellín',
    esCentral: false,
    tiempoEntregaDias: '1-2 días hábiles',
  };

  it('renderiza la Hero Card principal con el producto insignia y precio entero en COP (RN-GEN-04)', () => {
    render(
      <BentoGridHero
        sedeActiva={mockSede}
        categoriaActiva="todas"
        onSeleccionarCategoria={vi.fn()}
        onExplorarProducto={vi.fn()}
      />
    );

    // Verificación de producto insignia
    expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
    expect(screen.getByText('$189.000 COP')).toBeInTheDocument();
    expect(screen.getByText(/Colección Oficial 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Precio de Atelier/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comprar Ahora/i })).toBeInTheDocument();
  });

  it('ejecuta onExplorarProducto al hacer clic en Comprar Ahora', () => {
    const onExplorarProductoMock = vi.fn();
    render(
      <BentoGridHero
        sedeActiva={mockSede}
        categoriaActiva="todas"
        onSeleccionarCategoria={vi.fn()}
        onExplorarProducto={onExplorarProductoMock}
      />
    );

    const botonComprar = screen.getByRole('button', { name: /Comprar Ahora/i });
    fireEvent.click(botonComprar);

    expect(onExplorarProductoMock).toHaveBeenCalledWith('prod-001');
  });

  it('no renderiza las 3 tarjetas inferiores eliminadas para una vista limpia y despejada', () => {
    const { container } = render(
      <BentoGridHero
        sedeActiva={mockSede}
        categoriaActiva="todas"
        onSeleccionarCategoria={vi.fn()}
        onExplorarProducto={vi.fn()}
      />
    );

    const html = container.innerHTML;
    expect(html).not.toMatch(/Categorías Ramificadas/i);
    expect(html).not.toMatch(/Tu Boutique Cercana/i);
    expect(html).not.toMatch(/5 Días Hábiles de Retracto & 30 Días de Garantía/i);
  });
});
