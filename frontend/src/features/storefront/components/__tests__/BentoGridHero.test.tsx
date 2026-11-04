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

  it('renderiza la Hero Card 2x2 con el producto insignia y precio entero en COP (RN-GEN-04)', () => {
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
  });

  it('renderiza la sede activa con pulso de stock multisede en tiempo real', () => {
    render(
      <BentoGridHero
        sedeActiva={mockSede}
        categoriaActiva="todas"
        onSeleccionarCategoria={vi.fn()}
        onExplorarProducto={vi.fn()}
      />
    );

    expect(screen.getByText('Sede Principal (Medellín)')).toBeInTheDocument();
    expect(screen.getByText(/Entrega local estimada:/i)).toBeInTheDocument();
    expect(screen.getByText(/Respaldo de inventario nacional desde Bodega Central/i)).toBeInTheDocument();
  });

  it('renderiza la tarjeta de garantías legales con 5 días de retracto (RN-DEV-01) y 30 días de garantía', () => {
    render(
      <BentoGridHero
        sedeActiva={mockSede}
        categoriaActiva="todas"
        onSeleccionarCategoria={vi.fn()}
        onExplorarProducto={vi.fn()}
      />
    );

    expect(
      screen.getByText(/5 Días Hábiles de Retracto & 30 Días de Garantía/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Envíos Seguros a Toda Colombia/i)).toBeInTheDocument();
  });

  it('permite cambiar de categoría al pulsar los botones del selector rápido', () => {
    const onSeleccionarCategoriaMock = vi.fn();

    render(
      <BentoGridHero
        sedeActiva={mockSede}
        categoriaActiva="todas"
        onSeleccionarCategoria={onSeleccionarCategoriaMock}
        onExplorarProducto={vi.fn()}
      />
    );

    const botonRopa = screen.getByRole('button', { name: 'Ropa' });
    fireEvent.click(botonRopa);

    expect(onSeleccionarCategoriaMock).toHaveBeenCalledWith('ropa');
  });
});
