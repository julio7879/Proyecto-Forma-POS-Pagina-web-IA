// frontend/src/features/storefront/components/__tests__/ProductDetailModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDetailModal } from '../ProductDetailModal';
import { ProductoDTO } from '../../services/catalogService';

const mockProducto: ProductoDTO = {
  id: 1,
  nombre: 'Camiseta Básica de Algodón',
  slug: 'camiseta-basica-algodon',
  descripcion: 'Camiseta clásica unisex 100% algodón de tacto suave para uso diario.',
  categoriaNombre: 'Ropa',
  reintegrableEnDevolucion: true,
  imagenesUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'],
  variantes: [
    {
      id: 101,
      sku: 'ROP-CAM-NEG-S',
      talla: 'S',
      color: 'Negro',
      precioVentaCop: 45000,
      stockDisponible: 12,
      stockPorSede: { 'Punto Centro': 4, 'Punto Caobos': 3, 'Punto Ocaña': 2, 'Punto Bucaramanga': 3 },
    },
    {
      id: 102,
      sku: 'ROP-CAM-NEG-M',
      talla: 'M',
      color: 'Negro',
      precioVentaCop: 45000,
      stockDisponible: 8,
      stockPorSede: { 'Punto Centro': 3, 'Punto Caobos': 2, 'Punto Ocaña': 1, 'Punto Bucaramanga': 2 },
    },
    {
      id: 103,
      sku: 'ROP-CAM-BLA-M',
      talla: 'M',
      color: 'Blanco',
      precioVentaCop: 48000,
      stockDisponible: 0,
      stockPorSede: { 'Punto Centro': 0, 'Punto Caobos': 0, 'Punto Ocaña': 0, 'Punto Bucaramanga': 0 },
    },
  ],
};

const mockCosmetico: ProductoDTO = {
  id: 3,
  nombre: 'Sérum Facial Vitamina C',
  slug: 'serum-facial-vitamina-c',
  descripcion: 'Tratamiento facial antioxidante e iluminador.',
  categoriaNombre: 'Cosméticos',
  reintegrableEnDevolucion: false,
  imagenesUrls: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'],
  variantes: [
    {
      id: 301,
      sku: 'COS-SER-30ML',
      talla: '30ml',
      color: 'Neutro',
      precioVentaCop: 65000,
      stockDisponible: 5,
      stockPorSede: { 'Punto Centro': 2, 'Punto Caobos': 1, 'Punto Ocaña': 1, 'Punto Bucaramanga': 1 },
    },
  ],
};

describe('ProductDetailModal - Lógica Real de Variantes y Limpieza de AI Slop', () => {
  it('renderiza la variante inicial correctamente con su SKU y precio', () => {
    render(
      <ProductDetailModal
        producto={mockProducto}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    expect(screen.getByText('ROP-CAM-NEG-S')).toBeInTheDocument();
    expect(screen.getByText('$ 45.000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar a la Bolsa/i })).toBeEnabled();
  });

  it('actualiza el SKU y precio al seleccionar otra talla y color según la lógica real de inventario', () => {
    const handleAddToCart = vi.fn();
    render(
      <ProductDetailModal
        producto={mockProducto}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={handleAddToCart}
      />
    );

    // 1. Inicialmente es Negro S (ROP-CAM-NEG-S)
    expect(screen.getByText('ROP-CAM-NEG-S')).toBeInTheDocument();

    // 2. Clic en Talla M: Debe buscar talla M con color Negro -> ROP-CAM-NEG-M
    const botonTallaM = screen.getByRole('button', { name: 'M' });
    fireEvent.click(botonTallaM);
    expect(screen.getByText('ROP-CAM-NEG-M')).toBeInTheDocument();

    // 3. Clic en Color Blanco: Debe buscar color Blanco con talla M -> ROP-CAM-BLA-M (Agotado, $48.000)
    const botonColorBlanco = screen.getByRole('button', { name: /Blanco/i });
    fireEvent.click(botonColorBlanco);

    expect(screen.getByText('ROP-CAM-BLA-M')).toBeInTheDocument();
    expect(screen.getByText('$ 48.000')).toBeInTheDocument();

    // Como stockDisponible es 0, el botón se deshabilita con texto "Agotado"
    const botonAgotado = screen.getByRole('button', { name: /Agotado/i });
    expect(botonAgotado).toBeDisabled();

    // 4. Volver a hacer clic en Talla S:
    // No hay S en Blanco, debe hacer fallback a la primera S (Negro -> ROP-CAM-NEG-S)
    const botonTallaS = screen.getByRole('button', { name: 'S' });
    fireEvent.click(botonTallaS);

    expect(screen.getByText('ROP-CAM-NEG-S')).toBeInTheDocument();
    const botonAgregar = screen.getByRole('button', { name: /Agregar a la Bolsa/i });
    expect(botonAgregar).toBeEnabled();

    // 5. Agregar a la bolsa
    fireEvent.click(botonAgregar);
    expect(handleAddToCart).toHaveBeenCalledTimes(1);
    expect(handleAddToCart).toHaveBeenCalledWith(mockProducto.variantes[0], 1);
  });

  it('muestra la advertencia sanitaria sobria para cosméticos no reintegrables', () => {
    render(
      <ProductDetailModal
        producto={mockCosmetico}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        'Por higiene y seguridad sanitaria, este producto cosmético no admite cambios de uso personal.'
      )
    ).toBeInTheDocument();
  });

  it('no contiene ningún texto de AI Slop ni referencias técnicas internas', () => {
    const { container } = render(
      <ProductDetailModal
        producto={mockProducto}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const html = container.innerHTML;

    expect(html).not.toMatch(/Vista 3D espacial/i);
    expect(html).not.toMatch(/Horma colombiana/i);
    expect(html).not.toMatch(/Sin en vivo disponibles en boutique/i);
    expect(html).not.toMatch(/Sync en vivo/i);
    expect(html).not.toMatch(/Sello de origen certificado/i);
    expect(html).not.toMatch(/Espacial 3D girar perspectiva/i);
    expect(html).not.toMatch(/Spatial 3D/i);
    expect(html).not.toMatch(/Edición limitada santuario/i);
    expect(html).not.toMatch(/Inversión Santuario/i);
    expect(html).not.toMatch(/RN-CAT-02/i);
    expect(html).not.toMatch(/Ley 1480/i);
  });
});
