// frontend/src/features/storefront/components/__tests__/CatalogToolbar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogToolbar, ViewMode, SortOption } from '../CatalogToolbar';

describe('CatalogToolbar - Barra de Herramientas del Catálogo (Fig. 11 y Fig. 12 ARQ-07)', () => {
  const defaultProps = {
    viewMode: 'grid' as ViewMode,
    onViewModeChange: vi.fn(),
    sortBy: 'popular' as SortOption,
    onSortByChange: vi.fn(),
    totalResults: 24,
    selectedCategory: 'Ropa',
    selectedSubcategory: 'Camisas',
    selectedTalla: 'M',
    selectedColor: 'Negro',
    precioMaximo: 250000,
    soloConStock: true,
    onClearTalla: vi.fn(),
    onClearColor: vi.fn(),
    onClearPrecio: vi.fn(),
    onClearSubcategoria: vi.fn(),
    onClearStock: vi.fn(),
    onClearAll: vi.fn(),
    showFilterPanel: false,
    onToggleFilterPanel: vi.fn(),
  };

  it('renderiza el contador de resultados, botón de filtros avanzados y selector sort by', () => {
    render(<CatalogToolbar {...defaultProps} />);

    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
    expect(screen.getByText(/prendas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtros Avanzados/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ordenar productos/i)).toBeInTheDocument();
  });

  it('permite alternar entre vista en cuadrícula (grid) y vista en lista (list)', () => {
    const onViewModeChange = vi.fn();
    render(<CatalogToolbar {...defaultProps} onViewModeChange={onViewModeChange} />);

    const botonLista = screen.getByTitle(/Vista en Lista Detallada/i);
    fireEvent.click(botonLista);
    expect(onViewModeChange).toHaveBeenCalledWith('list');

    const botonGrid = screen.getByTitle(/Vista en Cuadrícula/i);
    fireEvent.click(botonGrid);
    expect(onViewModeChange).toHaveBeenCalledWith('grid');
  });

  it('permite cambiar el criterio de ordenamiento (sort by)', () => {
    const onSortByChange = vi.fn();
    render(<CatalogToolbar {...defaultProps} onSortByChange={onSortByChange} />);

    const select = screen.getByLabelText(/Ordenar productos/i);
    fireEvent.change(select, { target: { value: 'price-asc' } });
    expect(onSortByChange).toHaveBeenCalledWith('price-asc');
  });

  it('renderiza las píldoras de filtros activos y permite eliminarlos individualmente o todos', () => {
    const onClearTalla = vi.fn();
    const onClearAll = vi.fn();

    render(
      <CatalogToolbar
        {...defaultProps}
        onClearTalla={onClearTalla}
        onClearAll={onClearAll}
      />
    );

    expect(screen.getByText(/Talla: M/i)).toBeInTheDocument();
    expect(screen.getByText(/Color: Negro/i)).toBeInTheDocument();
    expect(screen.getByText(/Hasta \$250\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/Solo con stock disponible/i)).toBeInTheDocument();

    const botonEliminarTalla = screen.getByTitle(/Eliminar filtro de talla/i);
    fireEvent.click(botonEliminarTalla);
    expect(onClearTalla).toHaveBeenCalled();

    const botonLimpiarTodos = screen.getByRole('button', { name: /Limpiar todos/i });
    fireEvent.click(botonLimpiarTodos);
    expect(onClearAll).toHaveBeenCalled();
  });
});
