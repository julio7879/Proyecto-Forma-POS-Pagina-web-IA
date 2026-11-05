import { PrismaClient, TipoUbicacion } from '@prisma/client';

const prisma = new PrismaClient();

export const CATALOGO_30_PRODUCTOS = [
  // --- ROPA (10 Productos) ---
  {
    nombre: 'Blazer Sastrería Imperial Vinotinto',
    slug: 'blazer-imperial-vinotinto',
    descripcion: 'Blazer cruzado de lana fría y botones dorados hecho a mano por sastres colombianos.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['/products/blazer-imperial-vinotinto.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-BLZ-VIN-S', talla: 'S', color: 'Vinotinto', precioVentaCop: 320000, stockCentral: 60, stockPunto: 15 },
      { sku: 'ROP-BLZ-VIN-M', talla: 'M', color: 'Vinotinto', precioVentaCop: 320000, stockCentral: 80, stockPunto: 20 },
      { sku: 'ROP-BLZ-VIN-L', talla: 'L', color: 'Vinotinto', precioVentaCop: 320000, stockCentral: 50, stockPunto: 15 },
    ],
  },
  {
    nombre: 'Pantalón Lino Sartorial Arena',
    slug: 'pantalon-lino-arena',
    descripcion: 'Pantalón de tiro alto confeccionado en lino 100% orgánico de corte sartorial clásico.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['/products/pantalon-lino-arena.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-PAN-ARE-30', talla: '30', color: 'Arena', precioVentaCop: 195000, stockCentral: 50, stockPunto: 15 },
      { sku: 'ROP-PAN-ARE-32', talla: '32', color: 'Arena', precioVentaCop: 195000, stockCentral: 70, stockPunto: 20 },
      { sku: 'ROP-PAN-ARE-34', talla: '34', color: 'Arena', precioVentaCop: 195000, stockCentral: 50, stockPunto: 15 },
    ],
  },
  {
    nombre: 'Camisa Lino Cuello Nerú Blanco',
    slug: 'camisa-lino-neru-blanco',
    descripcion: 'Camisa fresca de lino natural con cuello mao/nerú y botones en madera de guayacán.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-CAM-BLA-S', talla: 'S', color: 'Blanco Puro', precioVentaCop: 145000, stockCentral: 60, stockPunto: 15 },
      { sku: 'ROP-CAM-BLA-M', talla: 'M', color: 'Blanco Puro', precioVentaCop: 145000, stockCentral: 80, stockPunto: 20 },
      { sku: 'ROP-CAM-BLA-L', talla: 'L', color: 'Blanco Puro', precioVentaCop: 145000, stockCentral: 60, stockPunto: 15 },
    ],
  },
  {
    nombre: 'Chaqueta Puffer Santuario 3D',
    slug: 'chaqueta-puffer-santuario-3d',
    descripcion: 'Chaqueta acolchada arquitectónica con microfibra impermeable y aislamiento térmico ligero.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['/products/chaqueta-puffer-santuario.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-PUF-NEG-S', talla: 'S', color: 'Negro Mate', precioVentaCop: 380000, stockCentral: 40, stockPunto: 12 },
      { sku: 'ROP-PUF-NEG-M', talla: 'M', color: 'Negro Mate', precioVentaCop: 380000, stockCentral: 60, stockPunto: 18 },
      { sku: 'ROP-PUF-NEG-L', talla: 'L', color: 'Negro Mate', precioVentaCop: 380000, stockCentral: 40, stockPunto: 12 },
    ],
  },
  {
    nombre: 'Vestido Midi Seda Andina Esmeralda',
    slug: 'vestido-seda-esmeralda',
    descripcion: 'Vestido de corte al bies en seda andina brillante con escote sutil y movimiento fluido.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['/products/vestido-seda-esmeralda.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-VES-ESM-S', talla: 'S', color: 'Verde Esmeralda', precioVentaCop: 290000, stockCentral: 45, stockPunto: 15 },
      { sku: 'ROP-VES-ESM-M', talla: 'M', color: 'Verde Esmeralda', precioVentaCop: 290000, stockCentral: 55, stockPunto: 18 },
      { sku: 'ROP-VES-ESM-L', talla: 'L', color: 'Verde Esmeralda', precioVentaCop: 290000, stockCentral: 35, stockPunto: 12 },
    ],
  },
  {
    nombre: 'Camiseta Básica de Algodón',
    slug: 'camiseta-basica-algodon',
    descripcion: 'Camiseta clásica unisex 100% algodón orgánico peinado de 220 GSM de tacto sedoso.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-CAM-NEG-S', talla: 'S', color: 'Negro Carbón', precioVentaCop: 65000, stockCentral: 80, stockPunto: 25 },
      { sku: 'ROP-CAM-NEG-M', talla: 'M', color: 'Negro Carbón', precioVentaCop: 65000, stockCentral: 100, stockPunto: 30 },
      { sku: 'ROP-CAM-NEG-L', talla: 'L', color: 'Negro Carbón', precioVentaCop: 65000, stockCentral: 80, stockPunto: 25 },
    ],
  },
  {
    nombre: 'Cardigan Tejido Punto Mohair Caramelo',
    slug: 'cardigan-punto-mohair',
    descripcion: 'Cardigan envolvente con mezcla de mohair y alpaca tejido en puntos artesanales abiertos.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-CAR-MOH-S', talla: 'S', color: 'Caramelo Cálido', precioVentaCop: 210000, stockCentral: 40, stockPunto: 12 },
      { sku: 'ROP-CAR-MOH-M', talla: 'M', color: 'Caramelo Cálido', precioVentaCop: 210000, stockCentral: 50, stockPunto: 15 },
      { sku: 'ROP-CAR-MOH-L', talla: 'L', color: 'Caramelo Cálido', precioVentaCop: 210000, stockCentral: 35, stockPunto: 10 },
    ],
  },
  {
    nombre: 'Falda Plisada Seda Champaña',
    slug: 'falda-plisada-seda',
    descripcion: 'Falda midi con pliegues geométricos termosellados y pretina elástica forrada en satén.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-FAL-PLI-S', talla: 'S', color: 'Champaña Oro', precioVentaCop: 175000, stockCentral: 45, stockPunto: 15 },
      { sku: 'ROP-FAL-PLI-M', talla: 'M', color: 'Champaña Oro', precioVentaCop: 175000, stockCentral: 55, stockPunto: 18 },
    ],
  },
  {
    nombre: 'Bermuda Lino Italiano Oliva',
    slug: 'bermuda-lino-oliva',
    descripcion: 'Bermuda sastre a la rodilla con pinzas delanteras y bolsillo relojero en puro lino.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-BER-OLI-30', talla: '30', color: 'Verde Oliva', precioVentaCop: 135000, stockCentral: 45, stockPunto: 15 },
      { sku: 'ROP-BER-OLI-32', talla: '32', color: 'Verde Oliva', precioVentaCop: 135000, stockCentral: 60, stockPunto: 20 },
      { sku: 'ROP-BER-OLI-34', talla: '34', color: 'Verde Oliva', precioVentaCop: 135000, stockCentral: 40, stockPunto: 15 },
    ],
  },
  {
    nombre: 'Gabardina Clásica Impermeable Camel',
    slug: 'gabardina-clasica-camel',
    descripcion: 'Trench coat estructurado en gabardina de algodón hidrófugo con forro de cuadros sastre.',
    categoriaNombre: 'Ropa',
    imagenesUrls: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ROP-GAB-CAM-M', talla: 'M', color: 'Camel Tradicional', precioVentaCop: 395000, stockCentral: 40, stockPunto: 12 },
      { sku: 'ROP-GAB-CAM-L', talla: 'L', color: 'Camel Tradicional', precioVentaCop: 395000, stockCentral: 35, stockPunto: 10 },
    ],
  },

  // --- COSMÉTICOS BOTÁNICOS (6 Productos - Sin cambio por higiene RN-CAT-02) ---
  {
    nombre: 'Sérum Facial Botánico Oro 24K 50ml',
    slug: 'serum-botanico-oro-24k',
    descripcion: 'Concentrado antioxidante con micropartículas de oro 24k, ácido hialurónico y extracto de café.',
    categoriaNombre: 'Cosméticos',
    imagenesUrls: ['/products/serum-botanico-oro.png'],
    reintegrableEnDevolucion: false,
    variantes: [
      { sku: 'COS-SER-ORO-50ML', talla: '50ml', color: 'Ámbar Dorado', precioVentaCop: 89000, stockCentral: 80, stockPunto: 25 },
    ],
  },
  {
    nombre: 'Crema Hidratante Botánica Rosa Mosqueta 100ml',
    slug: 'crema-rosa-mosqueta-100ml',
    descripcion: 'Fórmula regeneradora profunda con aceite prensado en frío de rosa mosqueta y manteca de karité.',
    categoriaNombre: 'Cosméticos',
    imagenesUrls: ['/products/crema-rosa-mosqueta.png'],
    reintegrableEnDevolucion: false,
    variantes: [
      { sku: 'COS-CRM-ROS-100ML', talla: '100ml', color: 'Blanco Crema', precioVentaCop: 65000, stockCentral: 90, stockPunto: 30 },
    ],
  },
  {
    nombre: 'Aceite Facial Nutritivo Sacha Inchi 30ml',
    slug: 'aceite-sacha-inchi-30ml',
    descripcion: 'Elixir amazónico rico en Omega 3, 6 y 9 para restaurar la barrera lipídica y aportar luminosidad.',
    categoriaNombre: 'Cosméticos',
    imagenesUrls: ['https://images.unsplash.com/photo-1608248597359-5483256a0e05?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: false,
    variantes: [
      { sku: 'COS-ACE-SAC-30ML', talla: '30ml', color: 'Dorado Botánico', precioVentaCop: 78000, stockCentral: 70, stockPunto: 20 },
    ],
  },
  {
    nombre: 'Tónico Facial Hidrolato de Azahar 150ml',
    slug: 'tonico-hidrolato-azahar',
    descripcion: 'Bruma equilibrante de flor de azahar destilada que calma la piel y sella la hidratación.',
    categoriaNombre: 'Cosméticos',
    imagenesUrls: ['https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: false,
    variantes: [
      { sku: 'COS-TON-AZA-150ML', talla: '150ml', color: 'Cristalino', precioVentaCop: 52000, stockCentral: 75, stockPunto: 25 },
    ],
  },
  {
    nombre: 'Bálsamo Labial Cera Candelilla & Cacao',
    slug: 'balsamo-labial-candelilla',
    descripcion: 'Tratamiento labial emoliente con manteca de cacao pura de Arauca y cera vegetal de candelilla.',
    categoriaNombre: 'Cosméticos',
    imagenesUrls: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: false,
    variantes: [
      { sku: 'COS-BAL-CAN-15G', talla: '15g', color: 'Cacao Natural', precioVentaCop: 28000, stockCentral: 120, stockPunto: 40 },
    ],
  },
  {
    nombre: 'Mascarilla Arcilla Volcánica Andina 80g',
    slug: 'mascarilla-arcilla-volcanica',
    descripcion: 'Mascarilla mineral purificante de cenizas volcánicas andinas para limpiar poros y desintoxicar.',
    categoriaNombre: 'Cosméticos',
    imagenesUrls: ['https://images.unsplash.com/photo-1567928815104-b7980ee5032e?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: false,
    variantes: [
      { sku: 'COS-MAS-ARC-80G', talla: '80g', color: 'Gris Mineral', precioVentaCop: 48000, stockCentral: 65, stockPunto: 20 },
    ],
  },

  // --- ACCESORIOS & MARROQUINERÍA (6 Productos) ---
  {
    nombre: 'Bolso Tote Atelier Cuero Coñac',
    slug: 'bolso-tote-cuero-cognac',
    descripcion: 'Bolso amplio de cuero plena flor vacuno con bolsillo interior para laptop y herrajes de latón.',
    categoriaNombre: 'Accesorios',
    imagenesUrls: ['/products/bolso-tote-cuero.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ACC-BOL-COG-U', talla: 'Única', color: 'Coñac Envejecido', precioVentaCop: 285000, stockCentral: 40, stockPunto: 12 },
    ],
  },
  {
    nombre: 'Cinturón Cuero Graso Hebilla Oro Cepillado',
    slug: 'cinturon-cuero-oro',
    descripcion: 'Cinturón sastre de cuero graso de 3.5 cm de ancho con hebilla rectangular dorada cepillada.',
    categoriaNombre: 'Accesorios',
    imagenesUrls: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ACC-CIN-MIE-32', talla: '32', color: 'Miel Tostado', precioVentaCop: 95000, stockCentral: 50, stockPunto: 15 },
      { sku: 'ACC-CIN-MIE-34', talla: '34', color: 'Miel Tostado', precioVentaCop: 95000, stockCentral: 60, stockPunto: 20 },
      { sku: 'ACC-CIN-MIE-36', talla: '36', color: 'Miel Tostado', precioVentaCop: 95000, stockCentral: 45, stockPunto: 15 },
    ],
  },
  {
    nombre: 'Billetera Piel Genuina Caramelo Doble Fuelle',
    slug: 'billetera-piel-caramelo',
    descripcion: 'Billetera con 8 ranuras de tarjetas, doble compartimento de billetes y protección RFID.',
    categoriaNombre: 'Accesorios',
    imagenesUrls: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ACC-BIL-CAR-U', talla: 'Única', color: 'Caramelo', precioVentaCop: 85000, stockCentral: 60, stockPunto: 20 },
    ],
  },
  {
    nombre: 'Pañoleta 100% Seda Pura Flora Andina',
    slug: 'panoleta-seda-flora-andina',
    descripcion: 'Pañoleta de seda twill de 70x70 cm con orillo cosido a mano e ilustración de orquídeas colombianas.',
    categoriaNombre: 'Accesorios',
    imagenesUrls: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ACC-PAN-SED-U', talla: '70x70', color: 'Multicolor Botánico', precioVentaCop: 110000, stockCentral: 50, stockPunto: 18 },
    ],
  },
  {
    nombre: 'Gafas de Sol Carey Montura Cuadrada UV400',
    slug: 'gafas-sol-carey-cuadrada',
    descripcion: 'Montura de acetato italiano estilo carey con lentes polarizados ámbar y protección UV400.',
    categoriaNombre: 'Accesorios',
    imagenesUrls: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ACC-GAF-CAR-U', talla: 'Única', color: 'Carey Ámbar', precioVentaCop: 135000, stockCentral: 45, stockPunto: 15 },
    ],
  },
  {
    nombre: 'Tarjetero Slim Cuero Grano Negro Carbón',
    slug: 'tarjetero-slim-cuero-negro',
    descripcion: 'Tarjetero ultra compacto de cuero grana con 6 compartimentos y ranura central para efectivo.',
    categoriaNombre: 'Accesorios',
    imagenesUrls: ['https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ACC-TAR-NEG-U', talla: 'Única', color: 'Negro Carbón', precioVentaCop: 55000, stockCentral: 80, stockPunto: 25 },
    ],
  },

  // --- CALZADO ARTESANAL (4 Productos) ---
  {
    nombre: 'Mocasines Cuero Silla Montura Artesanal Miel',
    slug: 'mocasines-cuero-artesanal',
    descripcion: 'Mocasines cosidos a mano tipo guante con suela de cuero natural y plantilla ergonómica acolchada.',
    categoriaNombre: 'Calzado',
    imagenesUrls: ['/products/mocasines-cuero-artesanal.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'CAL-MOC-MIE-39', talla: '39', color: 'Miel Tostado', precioVentaCop: 265000, stockCentral: 35, stockPunto: 10 },
      { sku: 'CAL-MOC-MIE-40', talla: '40', color: 'Miel Tostado', precioVentaCop: 265000, stockCentral: 45, stockPunto: 15 },
      { sku: 'CAL-MOC-MIE-41', talla: '41', color: 'Miel Tostado', precioVentaCop: 265000, stockCentral: 45, stockPunto: 15 },
      { sku: 'CAL-MOC-MIE-42', talla: '42', color: 'Miel Tostado', precioVentaCop: 265000, stockCentral: 35, stockPunto: 10 },
    ],
  },
  {
    nombre: 'Botines Chelsea Suede Roble Costura Manual',
    slug: 'botines-chelsea-suede',
    descripcion: 'Botines de carnaza de ante hidrófugo con elásticos laterales y tirador sastre de cuero.',
    categoriaNombre: 'Calzado',
    imagenesUrls: ['https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'CAL-BOT-ROB-40', talla: '40', color: 'Roble Oscuro', precioVentaCop: 310000, stockCentral: 35, stockPunto: 12 },
      { sku: 'CAL-BOT-ROB-41', talla: '41', color: 'Roble Oscuro', precioVentaCop: 310000, stockCentral: 40, stockPunto: 14 },
      { sku: 'CAL-BOT-ROB-42', talla: '42', color: 'Roble Oscuro', precioVentaCop: 310000, stockCentral: 30, stockPunto: 10 },
    ],
  },
  {
    nombre: 'Sandalias Piel Cruzada Suela Cuero Natural',
    slug: 'sandalias-piel-cruzada',
    descripcion: 'Sandalias mediterráneas de tiras cruzadas en cuero vaqueta curtido al vegetal.',
    categoriaNombre: 'Calzado',
    imagenesUrls: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'CAL-SAN-CRU-37', talla: '37', color: 'Cuero Natural', precioVentaCop: 155000, stockCentral: 35, stockPunto: 12 },
      { sku: 'CAL-SAN-CRU-38', talla: '38', color: 'Cuero Natural', precioVentaCop: 155000, stockCentral: 40, stockPunto: 14 },
      { sku: 'CAL-SAN-CRU-39', talla: '39', color: 'Cuero Natural', precioVentaCop: 155000, stockCentral: 35, stockPunto: 12 },
    ],
  },
  {
    nombre: 'Zapatos Oxford Cuero Envejecido Burdeos',
    slug: 'oxford-cuero-burdeos',
    descripcion: 'Zapatos de vestir con picado brogue clásico y pátina artesanal envejecida tono vino.',
    categoriaNombre: 'Calzado',
    imagenesUrls: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'CAL-OXF-BUR-40', talla: '40', color: 'Burdeos Pátina', precioVentaCop: 280000, stockCentral: 30, stockPunto: 10 },
      { sku: 'CAL-OXF-BUR-41', talla: '41', color: 'Burdeos Pátina', precioVentaCop: 280000, stockCentral: 40, stockPunto: 12 },
      { sku: 'CAL-OXF-BUR-42', talla: '42', color: 'Burdeos Pátina', precioVentaCop: 280000, stockCentral: 30, stockPunto: 10 },
    ],
  },

  // --- ARTESANÍAS DE ORIGEN (4 Productos) ---
  {
    nombre: 'Sombrero Aguadeño Tejido Fino Palma de Iraca',
    slug: 'sombrero-aguadeno-fino',
    descripcion: 'Auténtico sombrero tejido a mano en palma de iraca por maestras artesanas de Aguadas.',
    categoriaNombre: 'Artesanías',
    imagenesUrls: ['/products/sombrero-aguadeno-fino.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ART-SOM-AGU-M', talla: 'M', color: 'Marfil / Cinta Vinotinto', precioVentaCop: 165000, stockCentral: 50, stockPunto: 16 },
      { sku: 'ART-SOM-AGU-L', talla: 'L', color: 'Marfil / Cinta Vinotinto', precioVentaCop: 165000, stockCentral: 50, stockPunto: 16 },
    ],
  },
  {
    nombre: 'Mochila Wayuu Fina Hilos de Seda Tinto & Oro',
    slug: 'mochila-wayuu-lujo',
    descripcion: 'Mochila de una sola hebra tejida por la comunidad Wayuu de La Guajira con gasa trenzada.',
    categoriaNombre: 'Artesanías',
    imagenesUrls: ['/products/mochila-wayuu-lujo.png'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ART-MOC-WAY-U', talla: 'Única', color: 'Tinto & Oro', precioVentaCop: 190000, stockCentral: 45, stockPunto: 15 },
    ],
  },
  {
    nombre: 'Ruana Lana Virgen Artesanal Boyacá',
    slug: 'ruana-lana-virgen',
    descripcion: 'Ruana tradicional en pura lana virgen de oveja sin teñir, térmica, resistente e impermeable.',
    categoriaNombre: 'Artesanías',
    imagenesUrls: ['https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ART-RUA-LAN-U', talla: 'Única', color: 'Gris Natural', precioVentaCop: 220000, stockCentral: 50, stockPunto: 16 },
    ],
  },
  {
    nombre: 'Canasto Tejido Fibra Werregue Maestría Chocó',
    slug: 'canasto-werregue-choco',
    descripcion: 'Canasto ceremonial wounaan tejido en palma de werregue con tintes naturales de selva húmeda.',
    categoriaNombre: 'Artesanías',
    imagenesUrls: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80'],
    reintegrableEnDevolucion: true,
    variantes: [
      { sku: 'ART-CAN-WER-M', talla: 'Mediano', color: 'Natural & Negro', precioVentaCop: 140000, stockCentral: 40, stockPunto: 14 },
    ],
  },
];

async function main() {
  console.log('💎 Iniciando carga de 30 Productos Oficiales y distribución multisede...');

  // 1. Obtener Sedes Oficiales por ID directo
  const central = await prisma.ubicacion.findUniqueOrThrow({ where: { id: 1 } });
  const puntoCentro = await prisma.ubicacion.findUniqueOrThrow({ where: { id: 2 } });
  const puntoCaobos = await prisma.ubicacion.findUniqueOrThrow({ where: { id: 8 } });
  const puntoOcana = await prisma.ubicacion.findUniqueOrThrow({ where: { id: 3 } });
  const puntoBucaramanga = await prisma.ubicacion.findUniqueOrThrow({ where: { id: 4 } });

  const todasLasSedes = [central, puntoCentro, puntoCaobos, puntoOcana, puntoBucaramanga];
  const admin = await prisma.usuario.findFirstOrThrow({ where: { correo: 'admin@forma.com' } });
  console.log(`📍 5 Sedes cargadas: Central(1), Centro(2), Caobos(8), Ocaña(3), Bucaramanga(4). Admin: ${admin.correo}`);

  // 2. Garantizar Categorías
  const categoriasMap = new Map<string, number>();
  const categoriasNombres = ['Ropa', 'Cosméticos', 'Accesorios', 'Calzado', 'Artesanías'];

  for (const catNom of categoriasNombres) {
    const esCosmetico = catNom === 'Cosméticos';
    const c = await prisma.categoria.upsert({
      where: { nombre: catNom },
      update: { activa: true, esCosmeticoUsoPersonal: esCosmetico },
      create: { nombre: catNom, activa: true, esCosmeticoUsoPersonal: esCosmetico },
    });
    categoriasMap.set(catNom, c.id);
  }
  console.log('🏷️ 5 Categorías oficiales verificadas');

  let totalProductos = 0;
  let totalVariantes = 0;
  let totalStockCentral = 0;
  let totalStockPuntos = 0;

  for (const item of CATALOGO_30_PRODUCTOS) {
    const catId = categoriasMap.get(item.categoriaNombre)!;
    console.log(`  -> Procesando [${item.categoriaNombre}]: ${item.nombre}`);

    const prod = await prisma.producto.upsert({
      where: { slug: item.slug },
      update: {
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoriaId: catId,
        imagenesUrls: item.imagenesUrls,
        reintegrableEnDevolucion: item.reintegrableEnDevolucion,
        activo: true,
      },
      create: {
        nombre: item.nombre,
        slug: item.slug,
        descripcion: item.descripcion,
        categoriaId: catId,
        imagenesUrls: item.imagenesUrls,
        reintegrableEnDevolucion: item.reintegrableEnDevolucion,
        activo: true,
      },
    });

    totalProductos++;

    for (const v of item.variantes) {
      const variante = await prisma.variante.upsert({
        where: { sku: v.sku },
        update: {
          talla: v.talla,
          color: v.color,
          precioVentaCop: v.precioVentaCop,
          activa: true,
        },
        create: {
          productoId: prod.id,
          sku: v.sku,
          talla: v.talla,
          color: v.color,
          precioVentaCop: v.precioVentaCop,
          activa: true,
        },
      });

      totalVariantes++;

      // Dotar a cada sede física con stock positivo en paralelo
      await Promise.all(
        todasLasSedes.map((sede) => {
          const cantFisica = sede.tipo === TipoUbicacion.CENTRAL ? v.stockCentral : v.stockPunto;
          return prisma.saldoStock.upsert({
            where: {
              ubicacionId_varianteId: {
                ubicacionId: sede.id,
                varianteId: variante.id,
              },
            },
            update: {
              fisico: cantFisica,
              reservadoBlando: 0,
              reservadoDuro: 0,
              noVendible: 0,
              bloqueadoDespachoWeb: false,
            },
            create: {
              ubicacionId: sede.id,
              varianteId: variante.id,
              fisico: cantFisica,
              reservadoBlando: 0,
              reservadoDuro: 0,
              noVendible: 0,
              bloqueadoDespachoWeb: false,
            },
          });
        })
      );

      for (const sede of todasLasSedes) {
        const cantFisica = sede.tipo === TipoUbicacion.CENTRAL ? v.stockCentral : v.stockPunto;
        if (sede.tipo === TipoUbicacion.CENTRAL) {
          totalStockCentral += cantFisica;
        } else {
          totalStockPuntos += cantFisica;
        }
      }

      // Registrar en Kardex en una sola inserción batch (RN-GEN-02)
      await prisma.movimientoInventario.createMany({
        data: todasLasSedes.map((sede) => ({
          tipo: 'CARGA_INICIAL',
          ubicacionId: sede.id,
          varianteId: variante.id,
          cantidadConSigno: sede.tipo === TipoUbicacion.CENTRAL ? v.stockCentral : v.stockPunto,
          afectaSaldo: 'FISICO',
          saldoResultante: sede.tipo === TipoUbicacion.CENTRAL ? v.stockCentral : v.stockPunto,
          documentoTipo: 'AJUSTE',
          documentoId: 0,
          usuarioId: admin.id,
          motivo: `Dotación de stock inicial a ${sede.nombre}: ${prod.nombre} (${v.talla}/${v.color})`,
        })),
      });
    }
  }

  console.log(`✅ Carga completada exitosamente:`);
  console.log(`   - ${totalProductos} Productos creados y activos`);
  console.log(`   - ${totalVariantes} Variantes con SKU único`);
  console.log(`   - ${totalStockCentral} Unidades en Bodega Central (Disponibles para Tienda Web)`);
  console.log(`   - ${totalStockPuntos} Unidades distribuidas entre los 4 Puntos de Venta Físicos`);
}

main()
  .catch((e) => {
    console.error('Error sembrando catálogo multisede:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
