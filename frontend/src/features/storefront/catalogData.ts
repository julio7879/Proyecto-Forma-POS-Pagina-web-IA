import { Producto, SedeInfo } from './types.js';

export const SEDES_DISPONIBLES: SedeInfo[] = [
  {
    id: 'MEDELLIN',
    nombre: 'Sede Principal (Medellín)',
    ciudad: 'Medellín',
    esCentral: false,
    tiempoEntregaDias: '1 - 2 días hábiles',
  },
  {
    id: 'BOGOTA',
    nombre: 'Sede Norte (Bogotá)',
    ciudad: 'Bogotá',
    esCentral: false,
    tiempoEntregaDias: '1 - 2 días hábiles',
  },
  {
    id: 'CUCUTA_CENTRAL',
    nombre: 'Bodega Central (Cúcuta)',
    ciudad: 'Cúcuta',
    esCentral: true,
    tiempoEntregaDias: '3 - 5 días hábiles',
  },
];

export const PRODUCTOS_CATALOGO: Producto[] = [
  {
    id: 'prod-001',
    nombre: 'Chaqueta Denim Artesanal',
    categoria: 'ropa',
    categoriaLabel: 'Ropa',
    precioCOP: 189000,
    descripcion: 'Confección en dril pesado 100% algodón colombiano con bordados hechos a mano por artesanos locales. Tratamiento de pre-lavado para suavidad duradera.',
    imagenUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    destacado: true,
    variantes: [
      {
        id: 'var-dnm-s',
        sku: 'ROP-DNM-001-S',
        talla: 'S',
        color: 'Azul Índigo',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 25 },
      },
      {
        id: 'var-dnm-m',
        sku: 'ROP-DNM-001-M',
        talla: 'M',
        color: 'Azul Índigo',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 40 },
      },
      {
        id: 'var-dnm-l',
        sku: 'ROP-DNM-001-L',
        talla: 'L',
        color: 'Azul Índigo',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 15 },
      },
    ],
  },
  {
    id: 'prod-002',
    nombre: 'Camiseta Básica Algodón Pima',
    categoria: 'ropa',
    categoriaLabel: 'Ropa',
    precioCOP: 59900,
    descripcion: 'Tejido premium de fibra larga, cuello redondo reforzado con costura francesa y tacto ultra suave.',
    imagenUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    variantes: [
      {
        id: 'var-cam-s',
        sku: 'ROP-CAM-002-S',
        talla: 'S',
        color: 'Blanco Hueso',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 60 },
      },
      {
        id: 'var-cam-m',
        sku: 'ROP-CAM-002-M',
        talla: 'M',
        color: 'Blanco Hueso',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 80 },
      },
      {
        id: 'var-cam-l',
        sku: 'ROP-CAM-002-L',
        talla: 'L',
        color: 'Negro Azabache',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 35 },
      },
    ],
  },
  {
    id: 'prod-003',
    nombre: 'Bolso Cuero Graso Unisex',
    categoria: 'accesorios',
    categoriaLabel: 'Accesorios',
    precioCOP: 249000,
    descripcion: 'Piel vacuna de grano entero con curtición vegetal, herrajes en bronce envejecido y compartimento acolchado para portátil de 14 pulgadas.',
    imagenUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    variantes: [
      {
        id: 'var-bol-u',
        sku: 'ACC-BOL-003-UNI',
        talla: 'Única',
        color: 'Miel Natural',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 18 },
      },
    ],
  },
  {
    id: 'prod-004',
    nombre: 'Crema Hidratante Botánica 100ml',
    categoria: 'cosmeticos',
    categoriaLabel: 'Cosméticos',
    precioCOP: 45000,
    descripcion: 'Fórmula no grasa con extracto de caléndula, aloe vera orgánico y manteca de karité cosechada de manera sostenible. Libre de parabenos y sulfatos.',
    imagenUrl: 'https://images.unsplash.com/photo-1608248597359-5633454b5683?auto=format&fit=crop&w=800&q=80',
    variantes: [
      {
        id: 'var-crm-100',
        sku: 'COS-CRM-004-100ML',
        talla: '100ml',
        color: 'Natural',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 90 },
      },
    ],
  },
  {
    id: 'prod-005',
    nombre: 'Mochila Tejeduría Ancestral',
    categoria: 'artesanias',
    categoriaLabel: 'Artesanías',
    precioCOP: 135000,
    descripcion: 'Tejida a mano en hilaza de algodón crudo por maestras artesanas con patrones geométricos tradicionales de la región andina colombiana.',
    imagenUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
    variantes: [
      {
        id: 'var-moc-std',
        sku: 'ART-MOC-005-STD',
        talla: 'Estándar',
        color: 'Tierra / Crudo',
        stockPorSede: { MEDELLIN: 0, BOGOTA: 0, CUCUTA_CENTRAL: 30 },
      },
    ],
  },
];
