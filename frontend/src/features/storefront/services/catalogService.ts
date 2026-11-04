// frontend/src/features/storefront/services/catalogService.ts
import { apiRequest } from '../../../api/apiClient';

export interface VarianteDTO {
  id: number;
  sku: string;
  talla: string;
  color: string;
  precioVentaCop: number;
  stockDisponible: number; // Suma consolidada multisede
}

export interface ProductoDTO {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  categoriaNombre: 'Ropa' | 'Accesorios' | 'Cosméticos' | 'Artesanías';
  reintegrableEnDevolucion: boolean;
  imagenesUrls: string[];
  variantes: VarianteDTO[];
}

/** Formateo oficial de dinero entero en Pesos Colombianos (RN-GEN-04) */
export const formatMoneyCOP = (amount: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);

/** Catálogo semilla con los 5 productos estándar de Thomas (PR #13) y stock multisede */
export const PRODUCTOS_SEMILLA: ProductoDTO[] = [
  {
    id: 1,
    nombre: 'Camiseta Básica de Algodón',
    slug: 'camiseta-basica-algodon',
    descripcion: 'Camiseta clásica unisex 100% algodón de tacto suave para uso diario.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 101, sku: 'ROP-CAM-NEG-S', talla: 'S', color: 'Negro', precioVentaCop: 45000, stockDisponible: 12 },
      { id: 102, sku: 'ROP-CAM-NEG-M', talla: 'M', color: 'Negro', precioVentaCop: 45000, stockDisponible: 8 },
      { id: 103, sku: 'ROP-CAM-NEG-L', talla: 'L', color: 'Negro', precioVentaCop: 45000, stockDisponible: 3 },
      { id: 104, sku: 'ROP-CAM-BLA-M', talla: 'M', color: 'Blanco', precioVentaCop: 45000, stockDisponible: 0 },
    ],
  },
  {
    id: 2,
    nombre: 'Gorra Urbana Snapback',
    slug: 'gorra-urbana-snapback',
    descripcion: 'Gorra deportiva estructurada con visera plana y broche ajustable posterior.',
    categoriaNombre: 'Accesorios',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 201, sku: 'ACC-GOR-NEG-U', talla: 'Única', color: 'Negro', precioVentaCop: 38000, stockDisponible: 15 },
      { id: 202, sku: 'ACC-GOR-AZU-U', talla: 'Única', color: 'Azul', precioVentaCop: 38000, stockDisponible: 2 },
    ],
  },
  {
    id: 3,
    nombre: 'Sérum Facial Vitamina C',
    slug: 'serum-facial-vitamina-c',
    descripcion: 'Tratamiento facial antioxidante e iluminador enriquecido con ácido hialurónico 30ml.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false, // RN-CAT-02: No reintegrable
    imagenesUrls: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 301, sku: 'COS-SER-30ML', talla: '30ml', color: 'Neutro', precioVentaCop: 65000, stockDisponible: 9 },
    ],
  },
  {
    id: 4,
    nombre: 'Labial Cremoso Larga Duración',
    slug: 'labial-cremoso-larga-duracion',
    descripcion: 'Labial con acabado satinado hidratante con vitamina E.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false, // RN-CAT-02: No reintegrable
    imagenesUrls: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 401, sku: 'COS-LAB-ROJ-U', talla: 'Única', color: 'Rojo Carmín', precioVentaCop: 28000, stockDisponible: 4 },
      { id: 402, sku: 'COS-LAB-ROS-U', talla: 'Única', color: 'Rosa Palo', precioVentaCop: 28000, stockDisponible: 0 },
    ],
  },
  {
    id: 5,
    nombre: 'Mochila Wayuu Tradicional',
    slug: 'mochila-wayuu-tradicional',
    descripcion: 'Mochila artesanal colombiana tejida a mano con diseño geométrico.',
    categoriaNombre: 'Artesanías',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 501, sku: 'ART-MOC-GEO-M', talla: 'Mediana', color: 'Multicolor', precioVentaCop: 140000, stockDisponible: 6 },
    ],
  },
];

export const getProductosCatalogo = async (): Promise<ProductoDTO[]> => {
  try {
    const data = await apiRequest<{ datos: ProductoDTO[] }>('/catalogo/productos');
    return data.datos && data.datos.length > 0 ? data.datos : PRODUCTOS_SEMILLA;
  } catch {
    // Fallback a los datos semilla para desarrollo frontend desacoplado
    return PRODUCTOS_SEMILLA;
  }
};