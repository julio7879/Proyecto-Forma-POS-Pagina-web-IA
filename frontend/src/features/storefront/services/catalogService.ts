// frontend/src/features/storefront/services/catalogService.ts
import { apiRequest } from '../../../api/apiClient';

export interface VarianteDTO {
  id: number;
  sku: string;
  talla: string;
  color: string;
  precioVentaCop: number;
  stockDisponible: number; // Suma consolidada multisede
  stockPorSede?: Record<string, number>; // Desglose real por sede física
}

export interface ProductoDTO {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  categoriaNombre: 'Ropa' | 'Calzado' | 'Accesorios' | 'Cosméticos' | 'Artesanías';
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
const RAW_PRODUCTOS_SEMILLA: ProductoDTO[] = [
  {
    id: 1,
    nombre: 'Camiseta Básica de Algodón',
    slug: 'camiseta-basica-algodon',
    descripcion: 'Camiseta clásica unisex 100% algodón de tacto suave para uso diario.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'],
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
        sku: 'ROP-CAM-NEG-L',
        talla: 'L',
        color: 'Negro',
        precioVentaCop: 45000,
        stockDisponible: 3,
        stockPorSede: { 'Punto Centro': 1, 'Punto Caobos': 1, 'Punto Ocaña': 0, 'Punto Bucaramanga': 1 },
      },
      {
        id: 104,
        sku: 'ROP-CAM-BLA-M',
        talla: 'M',
        color: 'Blanco',
        precioVentaCop: 45000,
        stockDisponible: 0,
        stockPorSede: { 'Punto Centro': 0, 'Punto Caobos': 0, 'Punto Ocaña': 0, 'Punto Bucaramanga': 0 },
      },
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
      {
        id: 201,
        sku: 'ACC-GOR-NEG-U',
        talla: 'Única',
        color: 'Negro',
        precioVentaCop: 38000,
        stockDisponible: 15,
        stockPorSede: { 'Punto Centro': 5, 'Punto Caobos': 4, 'Punto Ocaña': 3, 'Punto Bucaramanga': 3 },
      },
      {
        id: 202,
        sku: 'ACC-GOR-AZU-U',
        talla: 'Única',
        color: 'Azul',
        precioVentaCop: 38000,
        stockDisponible: 2,
        stockPorSede: { 'Punto Centro': 1, 'Punto Caobos': 1, 'Punto Ocaña': 0, 'Punto Bucaramanga': 0 },
      },
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
      {
        id: 301,
        sku: 'COS-SER-30ML',
        talla: '30ml',
        color: 'Neutro',
        precioVentaCop: 65000,
        stockDisponible: 9,
        stockPorSede: { 'Punto Centro': 3, 'Punto Caobos': 3, 'Punto Ocaña': 1, 'Punto Bucaramanga': 2 },
      },
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
      {
        id: 401,
        sku: 'COS-LAB-ROJ-U',
        talla: 'Única',
        color: 'Rojo Carmín',
        precioVentaCop: 28000,
        stockDisponible: 4,
        stockPorSede: { 'Punto Centro': 2, 'Punto Caobos': 1, 'Punto Ocaña': 0, 'Punto Bucaramanga': 1 },
      },
      {
        id: 402,
        sku: 'COS-LAB-ROS-U',
        talla: 'Única',
        color: 'Rosa Palo',
        precioVentaCop: 28000,
        stockDisponible: 0,
        stockPorSede: { 'Punto Centro': 0, 'Punto Caobos': 0, 'Punto Ocaña': 0, 'Punto Bucaramanga': 0 },
      },
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
      {
        id: 501,
        sku: 'ART-MOC-GEO-M',
        talla: 'Mediana',
        color: 'Multicolor',
        precioVentaCop: 140000,
        stockDisponible: 6,
        stockPorSede: { 'Punto Centro': 2, 'Punto Caobos': 2, 'Punto Ocaña': 1, 'Punto Bucaramanga': 1 },
      },
    ],
  },
  // --- 30 PRODUCTOS OFICIALES ATELIER FORMA & STOCK MULTISEDE ---
  {
    id: 6,
    nombre: 'Blazer Sastrería Imperial Vinotinto',
    slug: 'blazer-imperial-vinotinto',
    descripcion: 'Blazer cruzado de lana fría y botones dorados hecho a mano por sastres colombianos.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/blazer-imperial-vinotinto.png'],
    variantes: [
      { id: 601, sku: 'ROP-BLZ-VIN-S', talla: 'S', color: 'Vinotinto', precioVentaCop: 320000, stockDisponible: 120, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 15, 'Punto Bucaramanga': 20 } },
      { id: 602, sku: 'ROP-BLZ-VIN-M', talla: 'M', color: 'Vinotinto', precioVentaCop: 320000, stockDisponible: 140, stockPorSede: { 'Punto Centro': 25, 'Punto Caobos': 25, 'Punto Ocaña': 20, 'Punto Bucaramanga': 25 } },
      { id: 603, sku: 'ROP-BLZ-VIN-L', talla: 'L', color: 'Vinotinto', precioVentaCop: 320000, stockDisponible: 110, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 15, 'Punto Bucaramanga': 20 } },
    ],
  },
  {
    id: 7,
    nombre: 'Pantalón Lino Sartorial Arena',
    slug: 'pantalon-lino-arena',
    descripcion: 'Pantalón de tiro alto confeccionado en lino 100% orgánico de corte sartorial clásico.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/pantalon-lino-arena.png'],
    variantes: [
      { id: 701, sku: 'ROP-PAN-ARE-30', talla: '30', color: 'Arena', precioVentaCop: 195000, stockDisponible: 110, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 15, 'Punto Bucaramanga': 20 } },
      { id: 702, sku: 'ROP-PAN-ARE-32', talla: '32', color: 'Arena', precioVentaCop: 195000, stockDisponible: 150, stockPorSede: { 'Punto Centro': 25, 'Punto Caobos': 25, 'Punto Ocaña': 20, 'Punto Bucaramanga': 25 } },
      { id: 703, sku: 'ROP-PAN-ARE-34', talla: '34', color: 'Arena', precioVentaCop: 195000, stockDisponible: 110, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 15, 'Punto Bucaramanga': 20 } },
    ],
  },
  {
    id: 8,
    nombre: 'Camisa Lino Cuello Nerú Blanco',
    slug: 'camisa-lino-neru-blanco',
    descripcion: 'Camisa fresca de lino natural con cuello mao/nerú y botones en madera de guayacán.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 801, sku: 'ROP-CAM-BLA-S', talla: 'S', color: 'Blanco Puro', precioVentaCop: 145000, stockDisponible: 120, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 15, 'Punto Bucaramanga': 20 } },
      { id: 802, sku: 'ROP-CAM-BLA-M', talla: 'M', color: 'Blanco Puro', precioVentaCop: 145000, stockDisponible: 160, stockPorSede: { 'Punto Centro': 25, 'Punto Caobos': 25, 'Punto Ocaña': 20, 'Punto Bucaramanga': 25 } },
      { id: 803, sku: 'ROP-CAM-BLA-L', talla: 'L', color: 'Blanco Puro', precioVentaCop: 145000, stockDisponible: 120, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 15, 'Punto Bucaramanga': 20 } },
    ],
  },
  {
    id: 9,
    nombre: 'Chaqueta Puffer Santuario 3D',
    slug: 'chaqueta-puffer-santuario-3d',
    descripcion: 'Chaqueta acolchada arquitectónica con microfibra impermeable y aislamiento térmico ligero.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/chaqueta-puffer-santuario.png'],
    variantes: [
      { id: 901, sku: 'ROP-PUF-NEG-S', talla: 'S', color: 'Negro Mate', precioVentaCop: 380000, stockDisponible: 88, stockPorSede: { 'Punto Centro': 15, 'Punto Caobos': 15, 'Punto Ocaña': 12, 'Punto Bucaramanga': 15 } },
      { id: 902, sku: 'ROP-PUF-NEG-M', talla: 'M', color: 'Negro Mate', precioVentaCop: 380000, stockDisponible: 132, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 18, 'Punto Bucaramanga': 20 } },
      { id: 903, sku: 'ROP-PUF-NEG-L', talla: 'L', color: 'Negro Mate', precioVentaCop: 380000, stockDisponible: 88, stockPorSede: { 'Punto Centro': 15, 'Punto Caobos': 15, 'Punto Ocaña': 12, 'Punto Bucaramanga': 15 } },
    ],
  },
  {
    id: 10,
    nombre: 'Vestido Midi Seda Andina Esmeralda',
    slug: 'vestido-seda-esmeralda',
    descripcion: 'Vestido de corte al bies en seda andina brillante con escote sutil y movimiento fluido.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/vestido-seda-esmeralda.png'],
    variantes: [
      { id: 1001, sku: 'ROP-VES-ESM-S', talla: 'S', color: 'Verde Esmeralda', precioVentaCop: 290000, stockDisponible: 105, stockPorSede: { 'Punto Centro': 18, 'Punto Caobos': 18, 'Punto Ocaña': 15, 'Punto Bucaramanga': 18 } },
      { id: 1002, sku: 'ROP-VES-ESM-M', talla: 'M', color: 'Verde Esmeralda', precioVentaCop: 290000, stockDisponible: 127, stockPorSede: { 'Punto Centro': 22, 'Punto Caobos': 22, 'Punto Ocaña': 18, 'Punto Bucaramanga': 22 } },
    ],
  },
  {
    id: 11,
    nombre: 'Cardigan Tejido Punto Mohair Caramelo',
    slug: 'cardigan-punto-mohair',
    descripcion: 'Cardigan envolvente con mezcla de mohair y alpaca tejido en puntos artesanales abiertos.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 1101, sku: 'ROP-CAR-MOH-S', talla: 'S', color: 'Caramelo Cálido', precioVentaCop: 210000, stockDisponible: 88, stockPorSede: { 'Punto Centro': 15, 'Punto Caobos': 15, 'Punto Ocaña': 12, 'Punto Bucaramanga': 15 } },
      { id: 1102, sku: 'ROP-CAR-MOH-M', talla: 'M', color: 'Caramelo Cálido', precioVentaCop: 210000, stockDisponible: 110, stockPorSede: { 'Punto Centro': 18, 'Punto Caobos': 18, 'Punto Ocaña': 15, 'Punto Bucaramanga': 18 } },
    ],
  },
  {
    id: 12,
    nombre: 'Falda Plisada Seda Champaña',
    slug: 'falda-plisada-seda',
    descripcion: 'Falda midi con pliegues geométricos termosellados y pretina elástica forrada en satén.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 1201, sku: 'ROP-FAL-PLI-S', talla: 'S', color: 'Champaña Oro', precioVentaCop: 175000, stockDisponible: 105, stockPorSede: { 'Punto Centro': 18, 'Punto Caobos': 18, 'Punto Ocaña': 15, 'Punto Bucaramanga': 18 } },
      { id: 1202, sku: 'ROP-FAL-PLI-M', talla: 'M', color: 'Champaña Oro', precioVentaCop: 175000, stockDisponible: 127, stockPorSede: { 'Punto Centro': 22, 'Punto Caobos': 22, 'Punto Ocaña': 18, 'Punto Bucaramanga': 22 } },
    ],
  },
  {
    id: 13,
    nombre: 'Bermuda Lino Italiano Oliva',
    slug: 'bermuda-lino-oliva',
    descripcion: 'Bermuda sastre a la rodilla con pinzas delanteras y bolsillo relojero en puro lino.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 1301, sku: 'ROP-BER-OLI-32', talla: '32', color: 'Verde Oliva', precioVentaCop: 135000, stockDisponible: 140, stockPorSede: { 'Punto Centro': 22, 'Punto Caobos': 22, 'Punto Ocaña': 20, 'Punto Bucaramanga': 22 } },
    ],
  },
  {
    id: 14,
    nombre: 'Gabardina Clásica Impermeable Camel',
    slug: 'gabardina-clasica-camel',
    descripcion: 'Trench coat estructurado en gabardina de algodón hidrófugo con forro de cuadros sastre.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 1401, sku: 'ROP-GAB-CAM-M', talla: 'M', color: 'Camel Tradicional', precioVentaCop: 395000, stockDisponible: 88, stockPorSede: { 'Punto Centro': 15, 'Punto Caobos': 15, 'Punto Ocaña': 12, 'Punto Bucaramanga': 15 } },
    ],
  },
  // --- COSMÉTICOS BOTÁNICOS (Sin cambio por higiene RN-CAT-02) ---
  {
    id: 15,
    nombre: 'Sérum Facial Botánico Oro 24K 50ml',
    slug: 'serum-botanico-oro-24k',
    descripcion: 'Concentrado antioxidante con micropartículas de oro 24k, ácido hialurónico y extracto de café.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false,
    imagenesUrls: ['/products/serum-botanico-oro.png'],
    variantes: [
      { id: 1501, sku: 'COS-SER-ORO-50ML', talla: '50ml', color: 'Ámbar Dorado', precioVentaCop: 89000, stockDisponible: 180, stockPorSede: { 'Punto Centro': 30, 'Punto Caobos': 30, 'Punto Ocaña': 25, 'Punto Bucaramanga': 30 } },
    ],
  },
  {
    id: 16,
    nombre: 'Crema Hidratante Botánica Rosa Mosqueta 100ml',
    slug: 'crema-rosa-mosqueta-100ml',
    descripcion: 'Fórmula regeneradora profunda con aceite prensado en frío de rosa mosqueta y manteca de karité.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false,
    imagenesUrls: ['/products/crema-rosa-mosqueta.png'],
    variantes: [
      { id: 1601, sku: 'COS-CRM-ROS-100ML', talla: '100ml', color: 'Blanco Crema', precioVentaCop: 65000, stockDisponible: 210, stockPorSede: { 'Punto Centro': 35, 'Punto Caobos': 35, 'Punto Ocaña': 30, 'Punto Bucaramanga': 35 } },
    ],
  },
  {
    id: 17,
    nombre: 'Aceite Facial Nutritivo Sacha Inchi 30ml',
    slug: 'aceite-sacha-inchi-30ml',
    descripcion: 'Elixir amazónico rico en Omega 3, 6 y 9 para restaurar la barrera lipídica y aportar luminosidad.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false,
    imagenesUrls: ['https://images.unsplash.com/photo-1608248597359-5483256a0e05?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 1701, sku: 'COS-ACE-SAC-30ML', talla: '30ml', color: 'Dorado Botánico', precioVentaCop: 78000, stockDisponible: 150, stockPorSede: { 'Punto Centro': 25, 'Punto Caobos': 25, 'Punto Ocaña': 20, 'Punto Bucaramanga': 25 } },
    ],
  },
  {
    id: 18,
    nombre: 'Tónico Facial Hidrolato de Azahar 150ml',
    slug: 'tonico-hidrolato-azahar',
    descripcion: 'Bruma equilibrante de flor de azahar destilada que calma la piel y sella la hidratación.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false,
    imagenesUrls: ['https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 1801, sku: 'COS-TON-AZA-150ML', talla: '150ml', color: 'Cristalino', precioVentaCop: 52000, stockDisponible: 175, stockPorSede: { 'Punto Centro': 30, 'Punto Caobos': 30, 'Punto Ocaña': 25, 'Punto Bucaramanga': 30 } },
    ],
  },
  {
    id: 19,
    nombre: 'Bálsamo Labial Cera Candelilla & Cacao',
    slug: 'balsamo-labial-candelilla',
    descripcion: 'Tratamiento labial emoliente con manteca de cacao pura de Arauca y cera vegetal de candelilla.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false,
    imagenesUrls: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 1901, sku: 'COS-BAL-CAN-15G', talla: '15g', color: 'Cacao Natural', precioVentaCop: 28000, stockDisponible: 280, stockPorSede: { 'Punto Centro': 45, 'Punto Caobos': 45, 'Punto Ocaña': 40, 'Punto Bucaramanga': 45 } },
    ],
  },
  {
    id: 20,
    nombre: 'Mascarilla Arcilla Volcánica Andina 80g',
    slug: 'mascarilla-arcilla-volcanica',
    descripcion: 'Mascarilla mineral purificante de cenizas volcánicas andinas para limpiar poros y desintoxicar.',
    categoriaNombre: 'Cosméticos',
    reintegrableEnDevolucion: false,
    imagenesUrls: ['https://images.unsplash.com/photo-1567928815104-b7980ee5032e?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2001, sku: 'COS-MAS-ARC-80G', talla: '80g', color: 'Gris Mineral', precioVentaCop: 48000, stockDisponible: 145, stockPorSede: { 'Punto Centro': 25, 'Punto Caobos': 25, 'Punto Ocaña': 20, 'Punto Bucaramanga': 25 } },
    ],
  },
  // --- ACCESORIOS & MARROQUINERÍA ---
  {
    id: 21,
    nombre: 'Bolso Tote Atelier Cuero Coñac',
    slug: 'bolso-tote-cuero-cognac',
    descripcion: 'Bolso amplio de cuero plena flor vacuno con bolsillo interior para laptop y herrajes de latón.',
    categoriaNombre: 'Accesorios',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/bolso-tote-cuero.png'],
    variantes: [
      { id: 2101, sku: 'ACC-BOL-COG-U', talla: 'Única', color: 'Coñac Envejecido', precioVentaCop: 285000, stockDisponible: 88, stockPorSede: { 'Punto Centro': 15, 'Punto Caobos': 15, 'Punto Ocaña': 12, 'Punto Bucaramanga': 15 } },
    ],
  },
  {
    id: 22,
    nombre: 'Cinturón Cuero Graso Hebilla Oro Cepillado',
    slug: 'cinturon-cuero-oro',
    descripcion: 'Cinturón sastre de cuero graso de 3.5 cm de ancho con hebilla rectangular dorada cepillada.',
    categoriaNombre: 'Accesorios',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2201, sku: 'ACC-CIN-MIE-34', talla: '34', color: 'Miel Tostado', precioVentaCop: 95000, stockDisponible: 140, stockPorSede: { 'Punto Centro': 25, 'Punto Caobos': 25, 'Punto Ocaña': 20, 'Punto Bucaramanga': 25 } },
    ],
  },
  {
    id: 23,
    nombre: 'Billetera Piel Genuina Caramelo Doble Fuelle',
    slug: 'billetera-piel-caramelo',
    descripcion: 'Billetera con 8 ranuras de tarjetas, doble compartimento de billetes y protección RFID.',
    categoriaNombre: 'Accesorios',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2301, sku: 'ACC-BIL-CAR-U', talla: 'Única', color: 'Caramelo', precioVentaCop: 85000, stockDisponible: 140, stockPorSede: { 'Punto Centro': 25, 'Punto Caobos': 25, 'Punto Ocaña': 20, 'Punto Bucaramanga': 25 } },
    ],
  },
  {
    id: 24,
    nombre: 'Pañoleta 100% Seda Pura Flora Andina',
    slug: 'panoleta-seda-flora-andina',
    descripcion: 'Pañoleta de seda twill de 70x70 cm con orillo cosido a mano e ilustración de orquídeas colombianas.',
    categoriaNombre: 'Accesorios',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2401, sku: 'ACC-PAN-SED-U', talla: '70x70', color: 'Multicolor Botánico', precioVentaCop: 110000, stockDisponible: 122, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 18, 'Punto Bucaramanga': 20 } },
    ],
  },
  {
    id: 25,
    nombre: 'Gafas de Sol Carey Montura Cuadrada UV400',
    slug: 'gafas-sol-carey-cuadrada',
    descripcion: 'Montura de acetato italiano estilo carey con lentes polarizados ámbar y protección UV400.',
    categoriaNombre: 'Accesorios',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2501, sku: 'ACC-GAF-CAR-U', talla: 'Única', color: 'Carey Ámbar', precioVentaCop: 135000, stockDisponible: 105, stockPorSede: { 'Punto Centro': 18, 'Punto Caobos': 18, 'Punto Ocaña': 15, 'Punto Bucaramanga': 18 } },
    ],
  },
  {
    id: 26,
    nombre: 'Tarjetero Slim Cuero Grano Negro Carbón',
    slug: 'tarjetero-slim-cuero-negro',
    descripcion: 'Tarjetero ultra compacto de cuero grana con 6 compartimentos y ranura central para efectivo.',
    categoriaNombre: 'Accesorios',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2601, sku: 'ACC-TAR-NEG-U', talla: 'Única', color: 'Negro Carbón', precioVentaCop: 55000, stockDisponible: 180, stockPorSede: { 'Punto Centro': 30, 'Punto Caobos': 30, 'Punto Ocaña': 25, 'Punto Bucaramanga': 30 } },
    ],
  },
  // --- CALZADO ARTESANAL ---
  {
    id: 27,
    nombre: 'Mocasines Cuero Silla Montura Artesanal Miel',
    slug: 'mocasines-cuero-artesanal',
    descripcion: 'Mocasines cosidos a mano tipo guante con suela de cuero natural y plantilla ergonómica acolchada.',
    categoriaNombre: 'Calzado',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/mocasines-cuero-artesanal.png'],
    variantes: [
      { id: 2701, sku: 'CAL-MOC-MIE-40', talla: '40', color: 'Miel Tostado', precioVentaCop: 265000, stockDisponible: 105, stockPorSede: { 'Punto Centro': 18, 'Punto Caobos': 18, 'Punto Ocaña': 15, 'Punto Bucaramanga': 18 } },
      { id: 2702, sku: 'CAL-MOC-MIE-41', talla: '41', color: 'Miel Tostado', precioVentaCop: 265000, stockDisponible: 105, stockPorSede: { 'Punto Centro': 18, 'Punto Caobos': 18, 'Punto Ocaña': 15, 'Punto Bucaramanga': 18 } },
    ],
  },
  {
    id: 28,
    nombre: 'Botines Chelsea Suede Roble Costura Manual',
    slug: 'botines-chelsea-suede',
    descripcion: 'Botines de carnaza de ante hidrófugo con elásticos laterales y tirador sastre de cuero.',
    categoriaNombre: 'Calzado',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2801, sku: 'CAL-BOT-ROB-41', talla: '41', color: 'Roble Oscuro', precioVentaCop: 310000, stockDisponible: 96, stockPorSede: { 'Punto Centro': 16, 'Punto Caobos': 16, 'Punto Ocaña': 14, 'Punto Bucaramanga': 16 } },
    ],
  },
  {
    id: 29,
    nombre: 'Sandalias Piel Cruzada Suela Cuero Natural',
    slug: 'sandalias-piel-cruzada',
    descripcion: 'Sandalias mediterráneas de tiras cruzadas en cuero vaqueta curtido al vegetal.',
    categoriaNombre: 'Calzado',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 2901, sku: 'CAL-SAN-CRU-38', talla: '38', color: 'Cuero Natural', precioVentaCop: 155000, stockDisponible: 96, stockPorSede: { 'Punto Centro': 16, 'Punto Caobos': 16, 'Punto Ocaña': 14, 'Punto Bucaramanga': 16 } },
    ],
  },
  {
    id: 30,
    nombre: 'Zapatos Oxford Cuero Envejecido Burdeos',
    slug: 'oxford-cuero-burdeos',
    descripcion: 'Zapatos de vestir con picado brogue clásico y pátina artesanal envejecida tono vino.',
    categoriaNombre: 'Calzado',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 3001, sku: 'CAL-OXF-BUR-41', talla: '41', color: 'Burdeos Pátina', precioVentaCop: 280000, stockDisponible: 88, stockPorSede: { 'Punto Centro': 15, 'Punto Caobos': 15, 'Punto Ocaña': 12, 'Punto Bucaramanga': 15 } },
    ],
  },
  // --- ARTESANÍAS DE ORIGEN ---
  {
    id: 31,
    nombre: 'Sombrero Aguadeño Tejido Fino Palma de Iraca',
    slug: 'sombrero-aguadeno-fino',
    descripcion: 'Auténtico sombrero tejido a mano en palma de iraca por maestras artesanas de Aguadas.',
    categoriaNombre: 'Artesanías',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/sombrero-aguadeno-fino.png'],
    variantes: [
      { id: 3101, sku: 'ART-SOM-AGU-M', talla: 'M', color: 'Marfil / Cinta Vinotinto', precioVentaCop: 165000, stockDisponible: 114, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 16, 'Punto Bucaramanga': 20 } },
    ],
  },
  {
    id: 32,
    nombre: 'Mochila Wayuu Fina Hilos de Seda Tinto & Oro',
    slug: 'mochila-wayuu-lujo',
    descripcion: 'Mochila de una sola hebra tejida por la comunidad Wayuu de La Guajira con gasa trenzada.',
    categoriaNombre: 'Artesanías',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['/products/mochila-wayuu-lujo.png'],
    variantes: [
      { id: 3201, sku: 'ART-MOC-WAY-U', talla: 'Única', color: 'Tinto & Oro', precioVentaCop: 190000, stockDisponible: 105, stockPorSede: { 'Punto Centro': 18, 'Punto Caobos': 18, 'Punto Ocaña': 15, 'Punto Bucaramanga': 18 } },
    ],
  },
  {
    id: 33,
    nombre: 'Ruana Lana Virgen Artesanal Boyacá',
    slug: 'ruana-lana-virgen',
    descripcion: 'Ruana tradicional en pura lana virgen de oveja sin teñir, térmica, resistente e impermeable.',
    categoriaNombre: 'Artesanías',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 3301, sku: 'ART-RUA-LAN-U', talla: 'Única', color: 'Gris Natural', precioVentaCop: 220000, stockDisponible: 114, stockPorSede: { 'Punto Centro': 20, 'Punto Caobos': 20, 'Punto Ocaña': 16, 'Punto Bucaramanga': 20 } },
    ],
  },
  {
    id: 34,
    nombre: 'Canasto Tejido Fibra Werregue Maestría Chocó',
    slug: 'canasto-werregue-choco',
    descripcion: 'Canasto ceremonial wounaan tejido en palma de werregue con tintes naturales de selva húmeda.',
    categoriaNombre: 'Artesanías',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80'],
    variantes: [
      { id: 3401, sku: 'ART-CAN-WER-M', talla: 'Mediano', color: 'Natural & Negro', precioVentaCop: 140000, stockDisponible: 96, stockPorSede: { 'Punto Centro': 16, 'Punto Caobos': 16, 'Punto Ocaña': 14, 'Punto Bucaramanga': 16 } },
    ],
  },
  {
    id: 35,
    nombre: 'Chaqueta Denim Artesanal',
    slug: 'chaqueta-denim-artesanal',
    descripcion: 'Confección en dril pesado 100% algodón colombiano con bordados hechos a mano por artesanos locales. Tratamiento de pre-lavado para suavidad duradera y detalles de autor.',
    categoriaNombre: 'Ropa',
    reintegrableEnDevolucion: true,
    imagenesUrls: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'],
    variantes: [
      { id: 3501, sku: 'ROP-DNM-001-S', talla: 'S', color: 'Azul Índigo', precioVentaCop: 189000, stockDisponible: 12, stockPorSede: { 'Punto Centro': 4, 'Punto Caobos': 3, 'Punto Ocaña': 2, 'Punto Bucaramanga': 3 } },
      { id: 3502, sku: 'ROP-DNM-001-M', talla: 'M', color: 'Azul Índigo', precioVentaCop: 189000, stockDisponible: 16, stockPorSede: { 'Punto Centro': 5, 'Punto Caobos': 5, 'Punto Ocaña': 3, 'Punto Bucaramanga': 3 } },
      { id: 3503, sku: 'ROP-DNM-001-L', talla: 'L', color: 'Azul Índigo', precioVentaCop: 189000, stockDisponible: 10, stockPorSede: { 'Punto Centro': 3, 'Punto Caobos': 3, 'Punto Ocaña': 2, 'Punto Bucaramanga': 2 } },
    ],
  },
];

export const PRODUCTOS_SEMILLA: ProductoDTO[] = RAW_PRODUCTOS_SEMILLA.map((prod) => ({
  ...prod,
  variantes: prod.variantes.map((v) => ({
    ...v,
    stockPorSede: {
      'Bodega Central': v.stockDisponible,
      'Punto Centro': 0,
      'Punto Caobos': 0,
      'Punto Ocaña': 0,
      'Punto Bucaramanga': 0,
    },
  })),
}));

export const getProductosCatalogo = async (): Promise<ProductoDTO[]> => {
  try {
    const data = await apiRequest<{ datos: ProductoDTO[] }>('/catalogo/productos');
    return data.datos && data.datos.length > 0 ? data.datos : PRODUCTOS_SEMILLA;
  } catch {
    // Fallback a los datos semilla para desarrollo frontend desacoplado
    return PRODUCTOS_SEMILLA;
  }
};
