/**
 * Pruebas QA complementarias (Issue #34 / PR #27, SP1-09).
 * Cubren criterios del checklist que la suite original no verifica:
 * umbrales del semáforo, ausencia de cifras de stock, variante agotada,
 * cierre del modal (Escape / backdrop / clic interno) y formato COP.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import {
  PRODUCTOS_SEMILLA,
  ProductoDTO,
  formatMoneyCOP,
} from '../services/catalogService';

const camiseta = PRODUCTOS_SEMILLA.find((p) => p.nombre === 'Camiseta Básica de Algodón')!;
const labial = PRODUCTOS_SEMILLA.find((p) => p.nombre === 'Labial Cremoso Larga Duración')!;
const serum = PRODUCTOS_SEMILLA.find((p) => p.nombre === 'Sérum Facial Vitamina C')!;

const productoConStock = (stock: number): ProductoDTO => ({
  ...camiseta,
  id: 900 + stock,
  variantes: [{ ...camiseta.variantes[0], stockDisponible: stock }],
});

describe('QA SP1-09 - Semáforo de stock sin cifras (RN-WEB-02 / CA-35)', () => {
  it.each([
    [6, 'Disponible'],
    [5, '¡Últimas unidades!'],
    [1, '¡Últimas unidades!'],
    [0, 'Agotado'],
  ])('stock %i → "%s"', (stock, esperado) => {
    render(<ProductCard producto={productoConStock(stock)} onOpenDetail={vi.fn()} />);
    expect(screen.getByText(esperado)).toBeInTheDocument();
  });

  it('la tarjeta no muestra el número de unidades', () => {
    const { container } = render(
      <ProductCard producto={productoConStock(3)} onOpenDetail={vi.fn()} />
    );
    expect(container.textContent).not.toMatch(/\b\d+\s*(unidades|uds?\.?|disponibles|en stock)/i);
    expect(screen.queryByText(/^\s*3\s*$/)).not.toBeInTheDocument();
  });

  it('el modal no muestra el número de unidades de la variante', () => {
    const { container } = render(
      <ProductDetailModal producto={camiseta} isOpen onClose={vi.fn()} />
    );
    // Variante inicial ROP-CAM-NEG-S tiene stock 12
    expect(container.textContent).not.toMatch(/\b12\b/);
  });
});

describe('QA SP1-09 - Cosméticos no reintegrables (RN-CAT-02 / CA-31)', () => {
  it.each([[serum], [labial]])('%s muestra la insignia en la tarjeta', (prod) => {
    render(<ProductCard producto={prod} onOpenDetail={vi.fn()} />);
    expect(screen.getByText('Uso personal (sin cambio por higiene)')).toBeInTheDocument();
  });

  it('el modal del Labial muestra la advertencia legal Ley 1480', () => {
    render(<ProductDetailModal producto={labial} isOpen onClose={vi.fn()} />);
    expect(screen.getByText(/sin cambio por higiene \(Ley 1480 \/ RN-CAT-02\)/i)).toBeInTheDocument();
  });

  it('productos reintegrables NO muestran la insignia', () => {
    render(<ProductCard producto={camiseta} onOpenDetail={vi.fn()} />);
    expect(screen.queryByText('Uso personal (sin cambio por higiene)')).not.toBeInTheDocument();
  });
});

describe('QA SP1-09 - Selector de variantes y SKU (RN-CAT-03)', () => {
  it('S → M → L cambia el SKU oficial', () => {
    render(<ProductDetailModal producto={camiseta} isOpen onClose={vi.fn()} />);
    expect(screen.getByText('ROP-CAM-NEG-S')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    expect(screen.getByText('ROP-CAM-NEG-M')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'L' }));
    expect(screen.getByText('ROP-CAM-NEG-L')).toBeInTheDocument();
  });

  it('ROP-CAM-BLA-M agotada deshabilita el botón ("Variante Agotada")', () => {
    render(<ProductDetailModal producto={camiseta} isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    fireEvent.click(screen.getByRole('button', { name: /Blanco/ }));
    expect(screen.getByText('ROP-CAM-BLA-M')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Variante Agotada/i })).toBeDisabled();
  });
});

describe('QA SP1-09 - Cierre del modal', () => {
  it('Escape cierra', () => {
    const onClose = vi.fn();
    render(<ProductDetailModal producto={camiseta} isOpen onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clic en el backdrop cierra', () => {
    const onClose = vi.fn();
    render(<ProductDetailModal producto={camiseta} isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clic dentro del cuerpo NO cierra (stopPropagation)', () => {
    const onClose = vi.fn();
    render(<ProductDetailModal producto={camiseta} isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('heading', { name: camiseta.nombre }));
    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('QA SP1-09 - Formato COP entero (RN-GEN-04)', () => {
  it('formatea sin decimales', () => {
    expect(formatMoneyCOP(45000)).toMatch(/^\$\s?45\.000$/);
    expect(formatMoneyCOP(45000)).not.toMatch(/,\d{2}$/);
  });

  it('todos los precios semilla son enteros', () => {
    PRODUCTOS_SEMILLA.forEach((p) =>
      p.variantes.forEach((v) => expect(Number.isInteger(v.precioVentaCop)).toBe(true))
    );
  });
});
