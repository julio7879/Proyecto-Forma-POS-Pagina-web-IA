// frontend/src/features/storefront/__tests__/CatalogPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CatalogPage } from '../CatalogPage';

describe('CatalogPage - Catálogo Público Storefront (SP1-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la lista de productos semilla y el título principal', async () => {
    render(<CatalogPage />);

    expect(screen.getByRole('heading', { name: /Catálogo Oficial Forma/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
      expect(screen.getByText('Mochila Wayuu Tradicional')).toBeInTheDocument();
    });
  });

  it('filtra productos por categoría al hacer clic en Cosméticos', async () => {
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    });

    const botonCosmeticos = screen.getByRole('tab', { name: 'Cosméticos' });
    fireEvent.click(botonCosmeticos);

    await waitFor(() => {
      expect(screen.getByText('Sérum Facial Vitamina C')).toBeInTheDocument();
      expect(screen.getByText('Labial Cremoso Larga Duración')).toBeInTheDocument();
      expect(screen.queryByText('Camiseta Básica de Algodón')).not.toBeInTheDocument();
      expect(screen.queryByText('Mochila Wayuu Tradicional')).not.toBeInTheDocument();
    });
  });

  it('muestra la advertencia de cosmético no reintegrable (RN-CAT-02)', async () => {
    render(<CatalogPage />);

    const botonCosmeticos = screen.getByRole('tab', { name: 'Cosméticos' });
    fireEvent.click(botonCosmeticos);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Uso personal \(sin cambio por higiene\)/i).length
      ).toBeGreaterThan(0);
    });
  });

  it('filtra productos reactivamente mediante el buscador de texto', async () => {
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o detalle/i);
    fireEvent.change(searchInput, { target: { value: 'Snapback' } });

    await waitFor(() => {
      expect(screen.getByText('Gorra Urbana Snapback')).toBeInTheDocument();
      expect(screen.queryByText('Camiseta Básica de Algodón')).not.toBeInTheDocument();
    });
  });

  it('abre el modal de detalle y actualiza el SKU al cambiar de variante', async () => {
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    });

    const botonDetalle = screen.getByRole('button', {
      name: /Ver variantes de Camiseta Básica de Algodón/i,
    });
    fireEvent.click(botonDetalle);

    // Modal abierto con SKU inicial S
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('ROP-CAM-NEG-S')).toBeInTheDocument();
    });

    // Seleccionar talla M
    const botonTallaM = screen.getByRole('button', { name: 'M' });
    fireEvent.click(botonTallaM);

    await waitFor(() => {
      expect(screen.getByText('ROP-CAM-NEG-M')).toBeInTheDocument();
    });
  });

  it('muestra el estado vacío cuando la búsqueda no coincide', async () => {
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o detalle/i);
    fireEvent.change(searchInput, { target: { value: 'ArticuloInexistente123' } });

    await waitFor(() => {
      expect(screen.getByText('No se encontraron productos')).toBeInTheDocument();
    });
  });

  it('filtra productos por rango de precio interactivo en COP', async () => {
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
      expect(screen.getByText('Mochila Wayuu Tradicional')).toBeInTheDocument();
    });

    // Filtrar a máximo $50.000 COP
    const botonRango50k = screen.getAllByRole('button', { name: /Hasta \$50\.000/i })[0];
    fireEvent.click(botonRango50k);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
      expect(screen.getByText('Gorra Urbana Snapback')).toBeInTheDocument();
      expect(screen.queryByText('Mochila Wayuu Tradicional')).not.toBeInTheDocument();
      expect(screen.queryByText('Sérum Facial Vitamina C')).not.toBeInTheDocument();
    });

    // Restablecer precio
    const botonRestablecer = screen.getByRole('button', { name: /Restablecer precio/i });
    fireEvent.click(botonRestablecer);

    await waitFor(() => {
      expect(screen.getByText('Mochila Wayuu Tradicional')).toBeInTheDocument();
    });
  });

  it('abre la vista dedicada de Ropa de Autor y filtra por subcategoría interactiva', async () => {
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    });

    const botonRopa = screen.getByRole('tab', { name: 'Ropa' });
    fireEvent.click(botonRopa);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Ropa de Autor' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Camisas' })).toBeInTheDocument();
    });

    // Al filtrar por Camisas, la Camiseta se mantiene visible
    const botonCamisas = screen.getByRole('button', { name: 'Camisas' });
    fireEvent.click(botonCamisas);

    await waitFor(() => {
      expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    });

    // Al filtrar por Pantalones, no hay prendas en semilla y se oculta la camiseta
    const botonPantalones = screen.getByRole('button', { name: 'Pantalones' });
    fireEvent.click(botonPantalones);

    await waitFor(() => {
      expect(screen.queryByText('Camiseta Básica de Algodón')).not.toBeInTheDocument();
    });
  });
});
