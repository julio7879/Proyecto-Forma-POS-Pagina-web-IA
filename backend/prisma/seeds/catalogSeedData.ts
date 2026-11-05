// backend/prisma/seeds/catalogSeedData.ts
// Catálogo Maestro Masivo con 105 productos y 500+ variantes SKU con precios COP enteros (RN-GEN-04)

export interface VarianteSemilla {
  sku: string;
  talla: string;
  color: string;
  precioVentaCop: number;
}

export interface ProductoSemilla {
  nombre: string;
  slug: string;
  descripcion: string;
  categoriaNombre: 'Ropa' | 'Accesorios' | 'Cosméticos' | 'Artesanías';
  reintegrableEnDevolucion: boolean;
  imagenesUrls: string[];
  variantes: VarianteSemilla[];
}

export const CATALOGO_MAESTRO_130: ProductoSemilla[] = [
  {
    nombre: "Vestido Midi Seda Champagne",
    slug: "vestido-midi-seda-champagne",
    descripcion: "Vestido fluido de corte midi en satén de seda color champagne con tirantes ajustables y caída elegante.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-001-CHA-XS-1",
            "talla": "XS",
            "color": "Champagne",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-CHA-S-2",
            "talla": "S",
            "color": "Champagne",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-CHA-M-3",
            "talla": "M",
            "color": "Champagne",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-CHA-L-4",
            "talla": "L",
            "color": "Champagne",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-NEG-XS-5",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-NEG-S-6",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-NEG-M-7",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-NEG-L-8",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-ESM-XS-9",
            "talla": "XS",
            "color": "Esmeralda",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-ESM-S-10",
            "talla": "S",
            "color": "Esmeralda",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-ESM-M-11",
            "talla": "M",
            "color": "Esmeralda",
            "precioVentaCop": 185000
      },
      {
            "sku": "ROP-001-ESM-L-12",
            "talla": "L",
            "color": "Esmeralda",
            "precioVentaCop": 185000
      }
]
  },
  {
    nombre: "Blazer Entallado Obsidian Black",
    slug: "blazer-entallado-obsidian-black",
    descripcion: "Blazer estructurado con solapa de pico y forro satinado. Silueta moderna entallada para eventos o ejecutiva.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-002-NEG-S-1",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 245000
      },
      {
            "sku": "ROP-002-NEG-M-2",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 245000
      },
      {
            "sku": "ROP-002-NEG-L-3",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 245000
      },
      {
            "sku": "ROP-002-NEG-XL-4",
            "talla": "XL",
            "color": "Negro",
            "precioVentaCop": 245000
      },
      {
            "sku": "ROP-002-AZU-S-5",
            "talla": "S",
            "color": "Azul Marino",
            "precioVentaCop": 245000
      },
      {
            "sku": "ROP-002-AZU-M-6",
            "talla": "M",
            "color": "Azul Marino",
            "precioVentaCop": 245000
      },
      {
            "sku": "ROP-002-AZU-L-7",
            "talla": "L",
            "color": "Azul Marino",
            "precioVentaCop": 245000
      },
      {
            "sku": "ROP-002-AZU-XL-8",
            "talla": "XL",
            "color": "Azul Marino",
            "precioVentaCop": 245000
      }
]
  },
  {
    nombre: "Camisa Lino Italiano Blanco Puro",
    slug: "camisa-lino-italiano-blanco-puro",
    descripcion: "Camisa confeccionada en 100% lino de tacto fresco con botones de nácar natural y cuello resort.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-003-BLA-S-1",
            "talla": "S",
            "color": "Blanco",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-BLA-M-2",
            "talla": "M",
            "color": "Blanco",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-BLA-L-3",
            "talla": "L",
            "color": "Blanco",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-BLA-XL-4",
            "talla": "XL",
            "color": "Blanco",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-ARE-S-5",
            "talla": "S",
            "color": "Arena",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-ARE-M-6",
            "talla": "M",
            "color": "Arena",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-ARE-L-7",
            "talla": "L",
            "color": "Arena",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-ARE-XL-8",
            "talla": "XL",
            "color": "Arena",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-AZU-S-9",
            "talla": "S",
            "color": "Azul Cielo",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-AZU-M-10",
            "talla": "M",
            "color": "Azul Cielo",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-AZU-L-11",
            "talla": "L",
            "color": "Azul Cielo",
            "precioVentaCop": 135000
      },
      {
            "sku": "ROP-003-AZU-XL-12",
            "talla": "XL",
            "color": "Azul Cielo",
            "precioVentaCop": 135000
      }
]
  },
  {
    nombre: "Pantalón Wide Leg Tiro Alto",
    slug: "pantalon-wide-leg-tiro-alto",
    descripcion: "Pantalón sastre con pinzas frontales y caída recta amplia en tela crepe premium anti-arrugas.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-004-BEI-XS-1",
            "talla": "XS",
            "color": "Beige",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-BEI-S-2",
            "talla": "S",
            "color": "Beige",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-BEI-M-3",
            "talla": "M",
            "color": "Beige",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-BEI-L-4",
            "talla": "L",
            "color": "Beige",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-NEG-XS-5",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-NEG-S-6",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-NEG-M-7",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-NEG-L-8",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-VER-XS-9",
            "talla": "XS",
            "color": "Verde Oliva",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-VER-S-10",
            "talla": "S",
            "color": "Verde Oliva",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-VER-M-11",
            "talla": "M",
            "color": "Verde Oliva",
            "precioVentaCop": 160000
      },
      {
            "sku": "ROP-004-VER-L-12",
            "talla": "L",
            "color": "Verde Oliva",
            "precioVentaCop": 160000
      }
]
  },
  {
    nombre: "Jean Mom Fit Denim Premium",
    slug: "jean-mom-fit-denim-premium",
    descripcion: "Pantalón vaquero de mezclilla 100% algodón colombiano con lavado vintage y tiro alto favorecedor.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-005-AZU-6-1",
            "talla": "6",
            "color": "Azul Clásico",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-AZU-8-2",
            "talla": "8",
            "color": "Azul Clásico",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-AZU-10-3",
            "talla": "10",
            "color": "Azul Clásico",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-AZU-12-4",
            "talla": "12",
            "color": "Azul Clásico",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-AZU-14-5",
            "talla": "14",
            "color": "Azul Clásico",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-CEL-6-6",
            "talla": "6",
            "color": "Celeste Vintage",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-CEL-8-7",
            "talla": "8",
            "color": "Celeste Vintage",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-CEL-10-8",
            "talla": "10",
            "color": "Celeste Vintage",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-CEL-12-9",
            "talla": "12",
            "color": "Celeste Vintage",
            "precioVentaCop": 145000
      },
      {
            "sku": "ROP-005-CEL-14-10",
            "talla": "14",
            "color": "Celeste Vintage",
            "precioVentaCop": 145000
      }
]
  },
  {
    nombre: "Chaqueta Biker Cuero Sintético",
    slug: "chaqueta-biker-cuero-sintetico",
    descripcion: "Cazadora estilo biker con cremalleras metálicas plateadas, forro térmico ligero y solapas con broches.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-006-NEG-S-1",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 220000
      },
      {
            "sku": "ROP-006-NEG-M-2",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 220000
      },
      {
            "sku": "ROP-006-NEG-L-3",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 220000
      },
      {
            "sku": "ROP-006-MAR-S-4",
            "talla": "S",
            "color": "Marrón Café",
            "precioVentaCop": 220000
      },
      {
            "sku": "ROP-006-MAR-M-5",
            "talla": "M",
            "color": "Marrón Café",
            "precioVentaCop": 220000
      },
      {
            "sku": "ROP-006-MAR-L-6",
            "talla": "L",
            "color": "Marrón Café",
            "precioVentaCop": 220000
      }
]
  },
  {
    nombre: "Falda Plisada Satinada Soleada",
    slug: "falda-plisada-satinada-soleada",
    descripcion: "Falda de largo midi con pliegues definidos en tejido brillante satinado y pretina elástica confortable.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-007-DOR-S-1",
            "talla": "S",
            "color": "Dorado Bronce",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-DOR-M-2",
            "talla": "M",
            "color": "Dorado Bronce",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-DOR-L-3",
            "talla": "L",
            "color": "Dorado Bronce",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-VER-S-4",
            "talla": "S",
            "color": "Verde Bosque",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-VER-M-5",
            "talla": "M",
            "color": "Verde Bosque",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-VER-L-6",
            "talla": "L",
            "color": "Verde Bosque",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-BOR-S-7",
            "talla": "S",
            "color": "Borgoña",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-BOR-M-8",
            "talla": "M",
            "color": "Borgoña",
            "precioVentaCop": 125000
      },
      {
            "sku": "ROP-007-BOR-L-9",
            "talla": "L",
            "color": "Borgoña",
            "precioVentaCop": 125000
      }
]
  },
  {
    nombre: "Camiseta Básica Pima Cotton",
    slug: "camiseta-basica-pima-cotton",
    descripcion: "Camiseta unisex cuello redondo en algodón Pima peinado de alta densidad con costuras reforzadas.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-008-BLA-S-1",
            "talla": "S",
            "color": "Blanco",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-BLA-M-2",
            "talla": "M",
            "color": "Blanco",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-BLA-L-3",
            "talla": "L",
            "color": "Blanco",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-BLA-XL-4",
            "talla": "XL",
            "color": "Blanco",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-NEG-S-5",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-NEG-M-6",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-NEG-L-7",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-NEG-XL-8",
            "talla": "XL",
            "color": "Negro",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-GRI-S-9",
            "talla": "S",
            "color": "Gris Jaspe",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-GRI-M-10",
            "talla": "M",
            "color": "Gris Jaspe",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-GRI-L-11",
            "talla": "L",
            "color": "Gris Jaspe",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-GRI-XL-12",
            "talla": "XL",
            "color": "Gris Jaspe",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-AZU-S-13",
            "talla": "S",
            "color": "Azul Marino",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-AZU-M-14",
            "talla": "M",
            "color": "Azul Marino",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-AZU-L-15",
            "talla": "L",
            "color": "Azul Marino",
            "precioVentaCop": 55000
      },
      {
            "sku": "ROP-008-AZU-XL-16",
            "talla": "XL",
            "color": "Azul Marino",
            "precioVentaCop": 55000
      }
]
  },
  {
    nombre: "Buzo Cuello Tortuga Cashmere Touch",
    slug: "buzo-cuello-tortuga-cashmere-touch",
    descripcion: "Suéter de tejido de punto fino tacto cachemira con cuello vuelto suave que no pica.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-009-CRU-S-1",
            "talla": "S",
            "color": "Crudo",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-CRU-M-2",
            "talla": "M",
            "color": "Crudo",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-CRU-L-3",
            "talla": "L",
            "color": "Crudo",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-NEG-S-4",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-NEG-M-5",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-NEG-L-6",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-TER-S-7",
            "talla": "S",
            "color": "Terracota",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-TER-M-8",
            "talla": "M",
            "color": "Terracota",
            "precioVentaCop": 110000
      },
      {
            "sku": "ROP-009-TER-L-9",
            "talla": "L",
            "color": "Terracota",
            "precioVentaCop": 110000
      }
]
  },
  {
    nombre: "Polo Piqué Clásico Formal",
    slug: "polo-pique-clasico-formal",
    descripcion: "Camiseta tipo polo en tejido piqué suave de algodón con cuello camisero rígido y abertura de dos botones.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1625910513413-5bc21743a4e1?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-010-AZU-S-1",
            "talla": "S",
            "color": "Azul Rey",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-AZU-M-2",
            "talla": "M",
            "color": "Azul Rey",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-AZU-L-3",
            "talla": "L",
            "color": "Azul Rey",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-AZU-XL-4",
            "talla": "XL",
            "color": "Azul Rey",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-BLA-S-5",
            "talla": "S",
            "color": "Blanco",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-BLA-M-6",
            "talla": "M",
            "color": "Blanco",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-BLA-L-7",
            "talla": "L",
            "color": "Blanco",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-BLA-XL-8",
            "talla": "XL",
            "color": "Blanco",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-VIN-S-9",
            "talla": "S",
            "color": "Vinotinto",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-VIN-M-10",
            "talla": "M",
            "color": "Vinotinto",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-VIN-L-11",
            "talla": "L",
            "color": "Vinotinto",
            "precioVentaCop": 89000
      },
      {
            "sku": "ROP-010-VIN-XL-12",
            "talla": "XL",
            "color": "Vinotinto",
            "precioVentaCop": 89000
      }
]
  },
  {
    nombre: "Enterizo Asimétrico de Noche",
    slug: "enterizo-asimetrico-de-noche",
    descripcion: "Jumpsuit con escote a un hombro y pantalón recto palazzo en crepé elastizado de gran caída.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-011-NEG-S-1",
            "talla": "S",
            "color": "Negro Noche",
            "precioVentaCop": 195000
      },
      {
            "sku": "ROP-011-NEG-M-2",
            "talla": "M",
            "color": "Negro Noche",
            "precioVentaCop": 195000
      },
      {
            "sku": "ROP-011-NEG-L-3",
            "talla": "L",
            "color": "Negro Noche",
            "precioVentaCop": 195000
      },
      {
            "sku": "ROP-011-ROJ-S-4",
            "talla": "S",
            "color": "Rojo Rubí",
            "precioVentaCop": 195000
      },
      {
            "sku": "ROP-011-ROJ-M-5",
            "talla": "M",
            "color": "Rojo Rubí",
            "precioVentaCop": 195000
      },
      {
            "sku": "ROP-011-ROJ-L-6",
            "talla": "L",
            "color": "Rojo Rubí",
            "precioVentaCop": 195000
      }
]
  },
  {
    nombre: "Bermuda Chino Casual Verano",
    slug: "bermuda-chino-casual-verano",
    descripcion: "Short estilo chino en sarga de algodón stretch con bolsillos ojal y largo sobre la rodilla.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-012-CAQ-30-1",
            "talla": "30",
            "color": "Caqui",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-CAQ-32-2",
            "talla": "32",
            "color": "Caqui",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-CAQ-34-3",
            "talla": "34",
            "color": "Caqui",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-CAQ-36-4",
            "talla": "36",
            "color": "Caqui",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-AZU-30-5",
            "talla": "30",
            "color": "Azul Naval",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-AZU-32-6",
            "talla": "32",
            "color": "Azul Naval",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-AZU-34-7",
            "talla": "34",
            "color": "Azul Naval",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-AZU-36-8",
            "talla": "36",
            "color": "Azul Naval",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-VER-30-9",
            "talla": "30",
            "color": "Verde Militar",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-VER-32-10",
            "talla": "32",
            "color": "Verde Militar",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-VER-34-11",
            "talla": "34",
            "color": "Verde Militar",
            "precioVentaCop": 95000
      },
      {
            "sku": "ROP-012-VER-36-12",
            "talla": "36",
            "color": "Verde Militar",
            "precioVentaCop": 95000
      }
]
  },
  {
    nombre: "Top Lencero Encaje Delicado",
    slug: "top-lencero-encaje-delicado",
    descripcion: "Top de tirantes finos en satén con detalle de encaje floral festoneado en el escote en V.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-013-MAR-XS-1",
            "talla": "XS",
            "color": "Marfil",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-MAR-S-2",
            "talla": "S",
            "color": "Marfil",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-MAR-M-3",
            "talla": "M",
            "color": "Marfil",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-NEG-XS-4",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-NEG-S-5",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-NEG-M-6",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-ROS-XS-7",
            "talla": "XS",
            "color": "Rosa Palo",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-ROS-S-8",
            "talla": "S",
            "color": "Rosa Palo",
            "precioVentaCop": 68000
      },
      {
            "sku": "ROP-013-ROS-M-9",
            "talla": "M",
            "color": "Rosa Palo",
            "precioVentaCop": 68000
      }
]
  },
  {
    nombre: "Cardigan Tejido Trenzado Boho",
    slug: "cardigan-tejido-trenzado-boho",
    descripcion: "Chaqueta de punto trenzado artesanal abierta con botones de carey y silueta oversize relajada.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-014-AVE-S-1",
            "talla": "S",
            "color": "Avena",
            "precioVentaCop": 140000
      },
      {
            "sku": "ROP-014-AVE-M-2",
            "talla": "M",
            "color": "Avena",
            "precioVentaCop": 140000
      },
      {
            "sku": "ROP-014-AVE-L-3",
            "talla": "L",
            "color": "Avena",
            "precioVentaCop": 140000
      },
      {
            "sku": "ROP-014-GRI-S-4",
            "talla": "S",
            "color": "Gris Perla",
            "precioVentaCop": 140000
      },
      {
            "sku": "ROP-014-GRI-M-5",
            "talla": "M",
            "color": "Gris Perla",
            "precioVentaCop": 140000
      },
      {
            "sku": "ROP-014-GRI-L-6",
            "talla": "L",
            "color": "Gris Perla",
            "precioVentaCop": 140000
      }
]
  },
  {
    nombre: "Vestido Camisero Lino Floral",
    slug: "vestido-camisero-lino-floral",
    descripcion: "Vestido abotonado de largo midi con cinturón del mismo tejido y estampado botánico exclusivo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-015-FLO-S-1",
            "talla": "S",
            "color": "Floral Verde",
            "precioVentaCop": 175000
      },
      {
            "sku": "ROP-015-FLO-M-2",
            "talla": "M",
            "color": "Floral Verde",
            "precioVentaCop": 175000
      },
      {
            "sku": "ROP-015-FLO-L-3",
            "talla": "L",
            "color": "Floral Verde",
            "precioVentaCop": 175000
      },
      {
            "sku": "ROP-015-FLO-S-4",
            "talla": "S",
            "color": "Floral Terracota",
            "precioVentaCop": 175000
      },
      {
            "sku": "ROP-015-FLO-M-5",
            "talla": "M",
            "color": "Floral Terracota",
            "precioVentaCop": 175000
      },
      {
            "sku": "ROP-015-FLO-L-6",
            "talla": "L",
            "color": "Floral Terracota",
            "precioVentaCop": 175000
      }
]
  },
  {
    nombre: "Pantalón Jogger Urbano Streetwear",
    slug: "pantalon-jogger-urbano-streetwear",
    descripcion: "Jogger de algodón afelpado con elásticos en tobillos, bolsillos con cremallera y cordón ajustable.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-016-GRI-S-1",
            "talla": "S",
            "color": "Gris Antracita",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-GRI-M-2",
            "talla": "M",
            "color": "Gris Antracita",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-GRI-L-3",
            "talla": "L",
            "color": "Gris Antracita",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-GRI-XL-4",
            "talla": "XL",
            "color": "Gris Antracita",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-NEG-S-5",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-NEG-M-6",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-NEG-L-7",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-NEG-XL-8",
            "talla": "XL",
            "color": "Negro",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-CAM-S-9",
            "talla": "S",
            "color": "Camel",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-CAM-M-10",
            "talla": "M",
            "color": "Camel",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-CAM-L-11",
            "talla": "L",
            "color": "Camel",
            "precioVentaCop": 115000
      },
      {
            "sku": "ROP-016-CAM-XL-12",
            "talla": "XL",
            "color": "Camel",
            "precioVentaCop": 115000
      }
]
  },
  {
    nombre: "Camisa Denim Lavada Clásica",
    slug: "camisa-denim-lavada-clasica",
    descripcion: "Camisa vaquera de botones a presión nacarados con doble bolsillo en el pecho y canesú en punta.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-017-DEN-S-1",
            "talla": "S",
            "color": "Denim Claro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-017-DEN-M-2",
            "talla": "M",
            "color": "Denim Claro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-017-DEN-L-3",
            "talla": "L",
            "color": "Denim Claro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-017-DEN-XL-4",
            "talla": "XL",
            "color": "Denim Claro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-017-DEN-S-5",
            "talla": "S",
            "color": "Denim Oscuro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-017-DEN-M-6",
            "talla": "M",
            "color": "Denim Oscuro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-017-DEN-L-7",
            "talla": "L",
            "color": "Denim Oscuro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-017-DEN-XL-8",
            "talla": "XL",
            "color": "Denim Oscuro",
            "precioVentaCop": 120000
      }
]
  },
  {
    nombre: "Falda Denim Tubo Abertura Frontal",
    slug: "falda-denim-tubo-abertura-frontal",
    descripcion: "Maxi falda vaquera de silueta recta con abertura central y bolsillos tradicionales de 5 puntos.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1582142407894-ec85a1260a46?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-018-AZU-6-1",
            "talla": "6",
            "color": "Azul Lavado",
            "precioVentaCop": 130000
      },
      {
            "sku": "ROP-018-AZU-8-2",
            "talla": "8",
            "color": "Azul Lavado",
            "precioVentaCop": 130000
      },
      {
            "sku": "ROP-018-AZU-10-3",
            "talla": "10",
            "color": "Azul Lavado",
            "precioVentaCop": 130000
      },
      {
            "sku": "ROP-018-AZU-12-4",
            "talla": "12",
            "color": "Azul Lavado",
            "precioVentaCop": 130000
      },
      {
            "sku": "ROP-018-NEG-6-5",
            "talla": "6",
            "color": "Negro Desgastado",
            "precioVentaCop": 130000
      },
      {
            "sku": "ROP-018-NEG-8-6",
            "talla": "8",
            "color": "Negro Desgastado",
            "precioVentaCop": 130000
      },
      {
            "sku": "ROP-018-NEG-10-7",
            "talla": "10",
            "color": "Negro Desgastado",
            "precioVentaCop": 130000
      },
      {
            "sku": "ROP-018-NEG-12-8",
            "talla": "12",
            "color": "Negro Desgastado",
            "precioVentaCop": 130000
      }
]
  },
  {
    nombre: "Blusa Gasa Mangas Abullonadas",
    slug: "blusa-gasa-mangas-abullonadas",
    descripcion: "Blusa semitransparente con cuello mao, puños fruncidos y volumen romántico en los hombros.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1564257631407-4deb129f044b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-019-BLA-S-1",
            "talla": "S",
            "color": "Blanco Óptico",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-BLA-M-2",
            "talla": "M",
            "color": "Blanco Óptico",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-BLA-L-3",
            "talla": "L",
            "color": "Blanco Óptico",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-LIL-S-4",
            "talla": "S",
            "color": "Lila Pastel",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-LIL-M-5",
            "talla": "M",
            "color": "Lila Pastel",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-LIL-L-6",
            "talla": "L",
            "color": "Lila Pastel",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-NEG-S-7",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-NEG-M-8",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 92000
      },
      {
            "sku": "ROP-019-NEG-L-9",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 92000
      }
]
  },
  {
    nombre: "Chaleco Sastre Botonadura Simple",
    slug: "chaleco-sastre-botonadura-simple",
    descripcion: "Chaleco de vestir entallado para llevar solo como top o sobre camisas, con espalda ajustable.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-020-GRI-XS-1",
            "talla": "XS",
            "color": "Gris Espiga",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-GRI-S-2",
            "talla": "S",
            "color": "Gris Espiga",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-GRI-M-3",
            "talla": "M",
            "color": "Gris Espiga",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-GRI-L-4",
            "talla": "L",
            "color": "Gris Espiga",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-NEG-XS-5",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-NEG-S-6",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-NEG-M-7",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-NEG-L-8",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-BLA-XS-9",
            "talla": "XS",
            "color": "Blanco Crema",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-BLA-S-10",
            "talla": "S",
            "color": "Blanco Crema",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-BLA-M-11",
            "talla": "M",
            "color": "Blanco Crema",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-020-BLA-L-12",
            "talla": "L",
            "color": "Blanco Crema",
            "precioVentaCop": 105000
      }
]
  },
  {
    nombre: "Gorra Urbana Snapback Obsidian",
    slug: "gorra-urbana-snapback-obsidian",
    descripcion: "Gorra deportiva de 6 paneles estructurados con bordado frontal tonal y ajuste trasero de presión.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-021-NEG-UNI-1",
            "talla": "Única",
            "color": "Negro",
            "precioVentaCop": 42000
      },
      {
            "sku": "ACC-021-AZU-UNI-2",
            "talla": "Única",
            "color": "Azul Marino",
            "precioVentaCop": 42000
      },
      {
            "sku": "ACC-021-VER-UNI-3",
            "talla": "Única",
            "color": "Verde Militar",
            "precioVentaCop": 42000
      }
]
  },
  {
    nombre: "Bolso Tote Bag Cuero Vacuno",
    slug: "bolso-tote-bag-cuero-vacuno",
    descripcion: "Bolso shopping amplio en genuino cuero graneado colombiano con compartimento acolchado para laptop 14 pulg.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-022-MIE-UNI-1",
            "talla": "Única",
            "color": "Miel Caramelo",
            "precioVentaCop": 280000
      },
      {
            "sku": "ACC-022-NEG-UNI-2",
            "talla": "Única",
            "color": "Negro Onix",
            "precioVentaCop": 280000
      },
      {
            "sku": "ACC-022-VIN-UNI-3",
            "talla": "Única",
            "color": "Vino Tinto",
            "precioVentaCop": 280000
      }
]
  },
  {
    nombre: "Bolso Bandolera Crossbody Chain",
    slug: "bolso-bandolera-crossbody-chain",
    descripcion: "Cartera estructurada de tamaño mediano con solapa magnética y cadena dorada convertible a hombro.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-023-NEG-UNI-1",
            "talla": "Única",
            "color": "Negro",
            "precioVentaCop": 165000
      },
      {
            "sku": "ACC-023-VER-UNI-2",
            "talla": "Única",
            "color": "Verde Esmeralda",
            "precioVentaCop": 165000
      },
      {
            "sku": "ACC-023-BEI-UNI-3",
            "talla": "Única",
            "color": "Beige Latte",
            "precioVentaCop": 165000
      }
]
  },
  {
    nombre: "Billetera Bifold Cuero Genuino",
    slug: "billetera-bifold-cuero-genuino",
    descripcion: "Billetera compacta de doble pliegue con protección RFID anti-escaneo y 8 ranuras para tarjetas.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-024-CAF-UNI-1",
            "talla": "Única",
            "color": "Café Tabaco",
            "precioVentaCop": 78000
      },
      {
            "sku": "ACC-024-NEG-UNI-2",
            "talla": "Única",
            "color": "Negro Carbono",
            "precioVentaCop": 78000
      }
]
  },
  {
    nombre: "Cinturón Sastre Hebilla Dorada",
    slug: "cinturon-sastre-hebilla-dorada",
    descripcion: "Cinturón fino de 2.5cm en cuero legítimo con hebilla geométrica de latón bañado en oro satinado.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-025-NEG-S85-1",
            "talla": "S (85cm)",
            "color": "Negro",
            "precioVentaCop": 62000
      },
      {
            "sku": "ACC-025-NEG-M95-2",
            "talla": "M (95cm)",
            "color": "Negro",
            "precioVentaCop": 62000
      },
      {
            "sku": "ACC-025-NEG-L10-3",
            "talla": "L (105cm)",
            "color": "Negro",
            "precioVentaCop": 62000
      },
      {
            "sku": "ACC-025-SUE-S85-4",
            "talla": "S (85cm)",
            "color": "Suela",
            "precioVentaCop": 62000
      },
      {
            "sku": "ACC-025-SUE-M95-5",
            "talla": "M (95cm)",
            "color": "Suela",
            "precioVentaCop": 62000
      },
      {
            "sku": "ACC-025-SUE-L10-6",
            "talla": "L (105cm)",
            "color": "Suela",
            "precioVentaCop": 62000
      }
]
  },
  {
    nombre: "Gafas de Sol Aviador Polarizadas UV400",
    slug: "gafas-de-sol-aviador-polarizadas-uv400",
    descripcion: "Montura metálica ultraligera con lentes de cristal mineral polarizado protección UV400 categoría 3.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-026-DOR-UNI-1",
            "talla": "Única",
            "color": "Dorado con Verde",
            "precioVentaCop": 95000
      },
      {
            "sku": "ACC-026-NEG-UNI-2",
            "talla": "Única",
            "color": "Negro Total",
            "precioVentaCop": 95000
      }
]
  },
  {
    nombre: "Collar Cadena Eslabones Acero 18k",
    slug: "collar-cadena-eslabones-acero-18k",
    descripcion: "Choker de eslabones tipo grumetta en acero quirúrgico 316L con triple baño electrolítico en oro de 18k.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-027-DOR-UNI-1",
            "talla": "Única (42cm)",
            "color": "Dorado",
            "precioVentaCop": 58000
      },
      {
            "sku": "ACC-027-PLA-UNI-2",
            "talla": "Única (42cm)",
            "color": "Plateado",
            "precioVentaCop": 58000
      }
]
  },
  {
    nombre: "Aretes Argollas Chunky Texturizadas",
    slug: "aretes-argollas-chunky-texturizadas",
    descripcion: "Aretes de aro hueco ultraligeros con cierre de clip seguro y textura trenzada reflectante.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-028-ORO-UNI-1",
            "talla": "Única",
            "color": "Oro 18k",
            "precioVentaCop": 42000
      },
      {
            "sku": "ACC-028-PLA-UNI-2",
            "talla": "Única",
            "color": "Plata 925",
            "precioVentaCop": 42000
      }
]
  },
  {
    nombre: "Reloj Minimalista Cuarzo Mesh Band",
    slug: "reloj-minimalista-cuarzo-mesh-band",
    descripcion: "Reloj analógico con esfera de cristal zafiro resistente a rayones y malla de acero milanesa ajustable.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-029-NEG-38M-1",
            "talla": "38mm",
            "color": "Negro Mate",
            "precioVentaCop": 185000
      },
      {
            "sku": "ACC-029-NEG-42M-2",
            "talla": "42mm",
            "color": "Negro Mate",
            "precioVentaCop": 185000
      },
      {
            "sku": "ACC-029-PLA-38M-3",
            "talla": "38mm",
            "color": "Plata Clásica",
            "precioVentaCop": 185000
      },
      {
            "sku": "ACC-029-PLA-42M-4",
            "talla": "42mm",
            "color": "Plata Clásica",
            "precioVentaCop": 185000
      },
      {
            "sku": "ACC-029-ORO-38M-5",
            "talla": "38mm",
            "color": "Oro Rosa",
            "precioVentaCop": 185000
      },
      {
            "sku": "ACC-029-ORO-42M-6",
            "talla": "42mm",
            "color": "Oro Rosa",
            "precioVentaCop": 185000
      }
]
  },
  {
    nombre: "Sombrero Fedora de Lana Australiana",
    slug: "sombrero-fedora-de-lana-australiana",
    descripcion: "Sombrero rígido ala media elaborado en 100% fieltro de lana con cinta perimetral de piel natural.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-030-NEG-M57-1",
            "talla": "M (57cm)",
            "color": "Negro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ACC-030-NEG-L59-2",
            "talla": "L (59cm)",
            "color": "Negro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ACC-030-CAM-M57-3",
            "talla": "M (57cm)",
            "color": "Camel",
            "precioVentaCop": 120000
      },
      {
            "sku": "ACC-030-CAM-L59-4",
            "talla": "L (59cm)",
            "color": "Camel",
            "precioVentaCop": 120000
      },
      {
            "sku": "ACC-030-GRI-M57-5",
            "talla": "M (57cm)",
            "color": "Gris Ceniza",
            "precioVentaCop": 120000
      },
      {
            "sku": "ACC-030-GRI-L59-6",
            "talla": "L (59cm)",
            "color": "Gris Ceniza",
            "precioVentaCop": 120000
      }
]
  },
  {
    nombre: "Tenis Urbanos Blancos Minimal",
    slug: "tenis-urbanos-blancos-minimal",
    descripcion: "Sneakers en cuero vacuno blanco con suela de caucho vulcanizado cosida y plantilla anatómica en memory foam.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-031-BLA-36-1",
            "talla": "36",
            "color": "Blanco Puro",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-37-2",
            "talla": "37",
            "color": "Blanco Puro",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-38-3",
            "talla": "38",
            "color": "Blanco Puro",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-39-4",
            "talla": "39",
            "color": "Blanco Puro",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-40-5",
            "talla": "40",
            "color": "Blanco Puro",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-41-6",
            "talla": "41",
            "color": "Blanco Puro",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-42-7",
            "talla": "42",
            "color": "Blanco Puro",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-36-8",
            "talla": "36",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-37-9",
            "talla": "37",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-38-10",
            "talla": "38",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-39-11",
            "talla": "39",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-40-12",
            "talla": "40",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-41-13",
            "talla": "41",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 210000
      },
      {
            "sku": "ACC-031-BLA-42-14",
            "talla": "42",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 210000
      }
]
  },
  {
    nombre: "Botines Chelsea Cuero Nobuk",
    slug: "botines-chelsea-cuero-nobuk",
    descripcion: "Botín clásico tobillero con elásticos laterales y suela track dentada anti-deslizante de gran agarre.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-032-MAR-37-1",
            "talla": "37",
            "color": "Marrón Tabaco",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-MAR-38-2",
            "talla": "38",
            "color": "Marrón Tabaco",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-MAR-39-3",
            "talla": "39",
            "color": "Marrón Tabaco",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-MAR-40-4",
            "talla": "40",
            "color": "Marrón Tabaco",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-MAR-41-5",
            "talla": "41",
            "color": "Marrón Tabaco",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-MAR-42-6",
            "talla": "42",
            "color": "Marrón Tabaco",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-NEG-37-7",
            "talla": "37",
            "color": "Negro Carbón",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-NEG-38-8",
            "talla": "38",
            "color": "Negro Carbón",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-NEG-39-9",
            "talla": "39",
            "color": "Negro Carbón",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-NEG-40-10",
            "talla": "40",
            "color": "Negro Carbón",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-NEG-41-11",
            "talla": "41",
            "color": "Negro Carbón",
            "precioVentaCop": 260000
      },
      {
            "sku": "ACC-032-NEG-42-12",
            "talla": "42",
            "color": "Negro Carbón",
            "precioVentaCop": 260000
      }
]
  },
  {
    nombre: "Tacones Stiletto Nude 8.5cm",
    slug: "tacones-stiletto-nude-8-5cm",
    descripcion: "Zapatos de salón con puntera afilada y tacón aguja de 8.5cm forrado en cuero con almohadilla metatarsal.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-033-NUD-35-1",
            "talla": "35",
            "color": "Nude Rosado",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NUD-36-2",
            "talla": "36",
            "color": "Nude Rosado",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NUD-37-3",
            "talla": "37",
            "color": "Nude Rosado",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NUD-38-4",
            "talla": "38",
            "color": "Nude Rosado",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NUD-39-5",
            "talla": "39",
            "color": "Nude Rosado",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NEG-35-6",
            "talla": "35",
            "color": "Negro Charol",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NEG-36-7",
            "talla": "36",
            "color": "Negro Charol",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NEG-37-8",
            "talla": "37",
            "color": "Negro Charol",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NEG-38-9",
            "talla": "38",
            "color": "Negro Charol",
            "precioVentaCop": 175000
      },
      {
            "sku": "ACC-033-NEG-39-10",
            "talla": "39",
            "color": "Negro Charol",
            "precioVentaCop": 175000
      }
]
  },
  {
    nombre: "Mocasines Penny Loafers Cuero",
    slug: "mocasines-penny-loafers-cuero",
    descripcion: "Mocasín artesanal con antifaz tradicional y vira cosida a mano, ideal para oficina o atuendo formal.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-034-BUR-39-1",
            "talla": "39",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-BUR-40-2",
            "talla": "40",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-BUR-41-3",
            "talla": "41",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-BUR-42-4",
            "talla": "42",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-BUR-43-5",
            "talla": "43",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-NEG-39-6",
            "talla": "39",
            "color": "Negro",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-NEG-40-7",
            "talla": "40",
            "color": "Negro",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-NEG-41-8",
            "talla": "41",
            "color": "Negro",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-NEG-42-9",
            "talla": "42",
            "color": "Negro",
            "precioVentaCop": 195000
      },
      {
            "sku": "ACC-034-NEG-43-10",
            "talla": "43",
            "color": "Negro",
            "precioVentaCop": 195000
      }
]
  },
  {
    nombre: "Pañuelo de Seda Estampado Botánico",
    slug: "panuelo-de-seda-estampado-botanico",
    descripcion: "Foulard cuadrado de 70x70cm en twill de seda artificial con remate a mano en los bordes.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-035-VER-UNI-1",
            "talla": "Única (70x70)",
            "color": "Verde Selva",
            "precioVentaCop": 45000
      },
      {
            "sku": "ACC-035-AZU-UNI-2",
            "talla": "Única (70x70)",
            "color": "Azul Marino Oro",
            "precioVentaCop": 45000
      }
]
  },
  {
    nombre: "Sérum Ácido Hialurónico Puro 2% + B5",
    slug: "serum-acido-hialuronico-puro-2-b5",
    descripcion: "Fórmula hidratante multicapa con tres pesos moleculares de ácido hialurónico y provitamina B5 calmante 30ml.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-036-NEU-30M-1",
            "talla": "30ml",
            "color": "Neutro",
            "precioVentaCop": 68000
      },
      {
            "sku": "COS-036-NEU-60M-2",
            "talla": "60ml",
            "color": "Neutro",
            "precioVentaCop": 68000
      }
]
  },
  {
    nombre: "Sérum Vitamina C 15% + Ácido Ferúlico",
    slug: "serum-vitamina-c-15-acido-ferulico",
    descripcion: "Antioxidante iluminador que neutraliza radicales libres, unifica el tono y estimula la síntesis de colágeno.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1608248597359-0f666f21226b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-037-NEU-30M-1",
            "talla": "30ml",
            "color": "Neutro",
            "precioVentaCop": 79000
      }
]
  },
  {
    nombre: "Crema Hidratante Ceramid Barrier 50ml",
    slug: "crema-hidratante-ceramid-barrier-50ml",
    descripcion: "Emulsión restauradora con 3 ceramidas esenciales, colesterol y niacinamida para reparar la barrera cutánea.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-038-NEU-50M-1",
            "talla": "50ml",
            "color": "Neutro",
            "precioVentaCop": 62000
      },
      {
            "sku": "COS-038-NEU-100-2",
            "talla": "100ml",
            "color": "Neutro",
            "precioVentaCop": 62000
      }
]
  },
  {
    nombre: "Protector Solar Toque Seco FPS 50+",
    slug: "protector-solar-toque-seco-fps-50",
    descripcion: "Fluido ultraligero de absorción inmediata con filtros fotoestables amplio espectro UVA/UVB y efecto mate.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-039-INV-50M-1",
            "talla": "50ml",
            "color": "Invisible",
            "precioVentaCop": 75000
      }
]
  },
  {
    nombre: "Contorno de Ojos Cafeína 5% + EGCG",
    slug: "contorno-de-ojos-cafeina-5-egcg",
    descripcion: "Gel descongestionante para bolsas y ojeras oscuras enriquecido con extracto de té verde y péptidos tensores.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-040-NEU-15M-1",
            "talla": "15ml",
            "color": "Neutro",
            "precioVentaCop": 54000
      }
]
  },
  {
    nombre: "Tónico Exfoliante Ácido Glicólico 7%",
    slug: "tonico-exfoliante-acido-glicolico-7",
    descripcion: "Solución tonificante que suaviza la textura de la piel, limpia los poros y potencia la luminosidad natural.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-041-NEU-150-1",
            "talla": "150ml",
            "color": "Neutro",
            "precioVentaCop": 58000
      }
]
  },
  {
    nombre: "Limpiador Facial Espumoso pH Balanceado",
    slug: "limpiador-facial-espumoso-ph-balanceado",
    descripcion: "Gel limpiador suave con aminoácidos botánicos que retira impurezas y maquillaje sin resecar la piel.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1556228722-d0b71f3089d8?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-042-NEU-200-1",
            "talla": "200ml",
            "color": "Neutro",
            "precioVentaCop": 46000
      }
]
  },
  {
    nombre: "Aceite Facial Regenerador Rosa Mosqueta",
    slug: "aceite-facial-regenerador-rosa-mosqueta",
    descripcion: "100% puro aceite virgen prensado en frío rico en ácidos grasos omega 3, 6 y 9 para nutrir pieles secas.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-043-DOR-30M-1",
            "talla": "30ml",
            "color": "Dorado Natural",
            "precioVentaCop": 49000
      }
]
  },
  {
    nombre: "Agua Micelar Desmaquillante Calmante",
    slug: "agua-micelar-desmaquillante-calmante",
    descripcion: "Fórmula enriquecida con agua de rosas y glicerina vegetal para rostro, ojos y labios sensibles.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-044-NEU-250-1",
            "talla": "250ml",
            "color": "Neutro",
            "precioVentaCop": 38000
      },
      {
            "sku": "COS-044-NEU-400-2",
            "talla": "400ml",
            "color": "Neutro",
            "precioVentaCop": 38000
      }
]
  },
  {
    nombre: "Mascarilla Facial Purificante Arcilla Verde",
    slug: "mascarilla-facial-purificante-arcilla-verde",
    descripcion: "Tratamiento semanal detoxificante con arcilla bentonita y aceite de árbol de té para matificar y calmar rojeces.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1567928815104-b7980ee07078?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-045-VER-100-1",
            "talla": "100g",
            "color": "Verde Herbal",
            "precioVentaCop": 42000
      }
]
  },
  {
    nombre: "Labial Mate Terciopelo Larga Duración",
    slug: "labial-mate-terciopelo-larga-duracion",
    descripcion: "Barra de labios con textura cremosa que seca en un acabado mate aterciopelado indeleble de hasta 12 horas.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-046-ROJ-UNI-1",
            "talla": "Única (4g)",
            "color": "Rojo Borgoña",
            "precioVentaCop": 34000
      },
      {
            "sku": "COS-046-NUD-UNI-2",
            "talla": "Única (4g)",
            "color": "Nude Rosa",
            "precioVentaCop": 34000
      },
      {
            "sku": "COS-046-TER-UNI-3",
            "talla": "Única (4g)",
            "color": "Terracota Cálido",
            "precioVentaCop": 34000
      },
      {
            "sku": "COS-046-VIN-UNI-4",
            "talla": "Única (4g)",
            "color": "Vino Tinto",
            "precioVentaCop": 34000
      }
]
  },
  {
    nombre: "Base Líquida Acabado Segunda Piel FPS 20",
    slug: "base-liquida-acabado-segunda-piel-fps-20",
    descripcion: "Base de maquillaje fluida cobertura graduable con ácido hialurónico y pigmentos reflectores de luz.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-047-POR-30M-1",
            "talla": "30ml",
            "color": "Porcelana 01",
            "precioVentaCop": 72000
      },
      {
            "sku": "COS-047-VAI-30M-2",
            "talla": "30ml",
            "color": "Vainilla 02",
            "precioVentaCop": 72000
      },
      {
            "sku": "COS-047-BEI-30M-3",
            "talla": "30ml",
            "color": "Beige Natural 03",
            "precioVentaCop": 72000
      },
      {
            "sku": "COS-047-CAR-30M-4",
            "talla": "30ml",
            "color": "Caramelo 04",
            "precioVentaCop": 72000
      },
      {
            "sku": "COS-047-CAF-30M-5",
            "talla": "30ml",
            "color": "Café Cálido 05",
            "precioVentaCop": 72000
      }
]
  },
  {
    nombre: "Corrector Iluminador Alta Cobertura",
    slug: "corrector-iluminador-alta-cobertura",
    descripcion: "Corrector cremoso enriquecido con cafeína que camufla ojeras e imperfecciones sin marcar líneas finas.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-048-FAI-8ML-1",
            "talla": "8ml",
            "color": "Fair Light",
            "precioVentaCop": 42000
      },
      {
            "sku": "COS-048-MED-8ML-2",
            "talla": "8ml",
            "color": "Medium Warm",
            "precioVentaCop": 42000
      },
      {
            "sku": "COS-048-DEE-8ML-3",
            "talla": "8ml",
            "color": "Deep Honey",
            "precioVentaCop": 42000
      }
]
  },
  {
    nombre: "Paleta de Sombras Nude Earth 12 Tonos",
    slug: "paleta-de-sombras-nude-earth-12-tonos",
    descripcion: "12 sombras en acabados mate mantecosos, satinados brillantes y glitters prensados de alta pigmentación.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1583241800698-e8ab01c85b27?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-049-TON-PAL-1",
            "talla": "Paleta 12g",
            "color": "Tonos Tierra y Oro",
            "precioVentaCop": 88000
      }
]
  },
  {
    nombre: "Máscara de Pestañas Efecto Pestañina HD",
    slug: "mascara-de-pestanas-efecto-pestanina-hd",
    descripcion: "Cepillo de silicona curvo que alarga, define y engrosa pestaña por pestaña sin dejar grumos ni transferir.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-050-NEG-10M-1",
            "talla": "10ml",
            "color": "Negro Intenso",
            "precioVentaCop": 38000
      }
]
  },
  {
    nombre: "Delineador Líquido Plumón Waterproof",
    slug: "delineador-liquido-plumon-waterproof",
    descripcion: "Punta de fieltro ultrafina de 0.1mm para trazos milimétricos continuos con tinta a prueba de agua y sudor.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-051-NEG-12M-1",
            "talla": "1.2ml",
            "color": "Negro Carbón",
            "precioVentaCop": 32000
      },
      {
            "sku": "COS-051-MAR-12M-2",
            "talla": "1.2ml",
            "color": "Marrón Chocolate",
            "precioVentaCop": 32000
      }
]
  },
  {
    nombre: "Polvo Translúcido Fijador Matificante",
    slug: "polvo-translucido-fijador-matificante",
    descripcion: "Polvo suelto micro-molido que sella el maquillaje, difumina poros y controla el brillo durante todo el día.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1503236823255-94609f598e71?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-052-TRA-25G-1",
            "talla": "25g",
            "color": "Translúcido Universal",
            "precioVentaCop": 48000
      }
]
  },
  {
    nombre: "Rubor Compacto Sedoso Iluminador",
    slug: "rubor-compacto-sedoso-iluminador",
    descripcion: "Polvo sedoso enriquecido con minerales que aporta un rubor saludable y luminoso en las mejillas.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1515688594390-b649af70d282?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-053-DUR-6G-1",
            "talla": "6g",
            "color": "Durazno Dorado",
            "precioVentaCop": 39000
      },
      {
            "sku": "COS-053-ROS-6G-2",
            "talla": "6g",
            "color": "Rosa Romántico",
            "precioVentaCop": 39000
      },
      {
            "sku": "COS-053-TER-6G-3",
            "talla": "6g",
            "color": "Terracota Glow",
            "precioVentaCop": 39000
      }
]
  },
  {
    nombre: "Fijador de Maquillaje Hidratante Bruma",
    slug: "fijador-de-maquillaje-hidratante-bruma",
    descripcion: "Spray fijador de bruma ultrafina con extracto de té blanco que prolonga la duración del maquillaje 16h.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-054-BRU-100-1",
            "talla": "100ml",
            "color": "Bruma Refrescante",
            "precioVentaCop": 45000
      }
]
  },
  {
    nombre: "Aceite Labial Hidratante Lip Glow Oil",
    slug: "aceite-labial-hidratante-lip-glow-oil",
    descripcion: "Aceite nutritivo no pegajoso con extracto de cereza y aceite de jojoba que realza el tono natural de los labios.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-055-CER-6ML-1",
            "talla": "6ml",
            "color": "Cereza Brillante",
            "precioVentaCop": 36000
      },
      {
            "sku": "COS-055-MIE-6ML-2",
            "talla": "6ml",
            "color": "Miel Dorada",
            "precioVentaCop": 36000
      },
      {
            "sku": "COS-055-ROS-6ML-3",
            "talla": "6ml",
            "color": "Rosa Suave",
            "precioVentaCop": 36000
      }
]
  },
  {
    nombre: "Vestido Midi Seda Champagne (Edición Oro 2026)",
    slug: "vestido-midi-seda-champagne-edicion-oro-2026",
    descripcion: "Vestido fluido de corte midi en satén de seda color champagne con tirantes ajustables y caída elegante. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-056-CHA-XS-1",
            "talla": "XS",
            "color": "Champagne",
            "precioVentaCop": 212000
      },
      {
            "sku": "ROP-ED26-056-CHA-S-2",
            "talla": "S",
            "color": "Champagne",
            "precioVentaCop": 212000
      },
      {
            "sku": "ROP-ED26-056-CHA-M-3",
            "talla": "M",
            "color": "Champagne",
            "precioVentaCop": 212000
      },
      {
            "sku": "ROP-ED26-056-NEG-XS-4",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 212000
      },
      {
            "sku": "ROP-ED26-056-NEG-S-5",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 212000
      },
      {
            "sku": "ROP-ED26-056-NEG-M-6",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 212000
      }
]
  },
  {
    nombre: "Blazer Entallado Obsidian Black (Edición Oro 2026)",
    slug: "blazer-entallado-obsidian-black-edicion-oro-2026",
    descripcion: "Blazer estructurado con solapa de pico y forro satinado. Silueta moderna entallada para eventos o ejecutiva. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-057-NEG-S-1",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 281000
      },
      {
            "sku": "ROP-ED26-057-NEG-M-2",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 281000
      },
      {
            "sku": "ROP-ED26-057-NEG-L-3",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 281000
      },
      {
            "sku": "ROP-ED26-057-AZU-S-4",
            "talla": "S",
            "color": "Azul Marino",
            "precioVentaCop": 281000
      },
      {
            "sku": "ROP-ED26-057-AZU-M-5",
            "talla": "M",
            "color": "Azul Marino",
            "precioVentaCop": 281000
      },
      {
            "sku": "ROP-ED26-057-AZU-L-6",
            "talla": "L",
            "color": "Azul Marino",
            "precioVentaCop": 281000
      }
]
  },
  {
    nombre: "Camisa Lino Italiano Blanco Puro (Edición Oro 2026)",
    slug: "camisa-lino-italiano-blanco-puro-edicion-oro-2026",
    descripcion: "Camisa confeccionada en 100% lino de tacto fresco con botones de nácar natural y cuello resort. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-058-BLA-S-1",
            "talla": "S",
            "color": "Blanco",
            "precioVentaCop": 155000
      },
      {
            "sku": "ROP-ED26-058-BLA-M-2",
            "talla": "M",
            "color": "Blanco",
            "precioVentaCop": 155000
      },
      {
            "sku": "ROP-ED26-058-BLA-L-3",
            "talla": "L",
            "color": "Blanco",
            "precioVentaCop": 155000
      },
      {
            "sku": "ROP-ED26-058-ARE-S-4",
            "talla": "S",
            "color": "Arena",
            "precioVentaCop": 155000
      },
      {
            "sku": "ROP-ED26-058-ARE-M-5",
            "talla": "M",
            "color": "Arena",
            "precioVentaCop": 155000
      },
      {
            "sku": "ROP-ED26-058-ARE-L-6",
            "talla": "L",
            "color": "Arena",
            "precioVentaCop": 155000
      }
]
  },
  {
    nombre: "Pantalón Wide Leg Tiro Alto (Edición Oro 2026)",
    slug: "pantalon-wide-leg-tiro-alto-edicion-oro-2026",
    descripcion: "Pantalón sastre con pinzas frontales y caída recta amplia en tela crepe premium anti-arrugas. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-059-BEI-XS-1",
            "talla": "XS",
            "color": "Beige",
            "precioVentaCop": 184000
      },
      {
            "sku": "ROP-ED26-059-BEI-S-2",
            "talla": "S",
            "color": "Beige",
            "precioVentaCop": 184000
      },
      {
            "sku": "ROP-ED26-059-BEI-M-3",
            "talla": "M",
            "color": "Beige",
            "precioVentaCop": 184000
      },
      {
            "sku": "ROP-ED26-059-NEG-XS-4",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 184000
      },
      {
            "sku": "ROP-ED26-059-NEG-S-5",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 184000
      },
      {
            "sku": "ROP-ED26-059-NEG-M-6",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 184000
      }
]
  },
  {
    nombre: "Jean Mom Fit Denim Premium (Edición Oro 2026)",
    slug: "jean-mom-fit-denim-premium-edicion-oro-2026",
    descripcion: "Pantalón vaquero de mezclilla 100% algodón colombiano con lavado vintage y tiro alto favorecedor. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-060-AZU-6-1",
            "talla": "6",
            "color": "Azul Clásico",
            "precioVentaCop": 166000
      },
      {
            "sku": "ROP-ED26-060-AZU-8-2",
            "talla": "8",
            "color": "Azul Clásico",
            "precioVentaCop": 166000
      },
      {
            "sku": "ROP-ED26-060-AZU-10-3",
            "talla": "10",
            "color": "Azul Clásico",
            "precioVentaCop": 166000
      },
      {
            "sku": "ROP-ED26-060-CEL-6-4",
            "talla": "6",
            "color": "Celeste Vintage",
            "precioVentaCop": 166000
      },
      {
            "sku": "ROP-ED26-060-CEL-8-5",
            "talla": "8",
            "color": "Celeste Vintage",
            "precioVentaCop": 166000
      },
      {
            "sku": "ROP-ED26-060-CEL-10-6",
            "talla": "10",
            "color": "Celeste Vintage",
            "precioVentaCop": 166000
      }
]
  },
  {
    nombre: "Chaqueta Biker Cuero Sintético (Edición Oro 2026)",
    slug: "chaqueta-biker-cuero-sintetico-edicion-oro-2026",
    descripcion: "Cazadora estilo biker con cremalleras metálicas plateadas, forro térmico ligero y solapas con broches. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-061-NEG-S-1",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 252000
      },
      {
            "sku": "ROP-ED26-061-NEG-M-2",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 252000
      },
      {
            "sku": "ROP-ED26-061-NEG-L-3",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 252000
      },
      {
            "sku": "ROP-ED26-061-MAR-S-4",
            "talla": "S",
            "color": "Marrón Café",
            "precioVentaCop": 252000
      },
      {
            "sku": "ROP-ED26-061-MAR-M-5",
            "talla": "M",
            "color": "Marrón Café",
            "precioVentaCop": 252000
      },
      {
            "sku": "ROP-ED26-061-MAR-L-6",
            "talla": "L",
            "color": "Marrón Café",
            "precioVentaCop": 252000
      }
]
  },
  {
    nombre: "Falda Plisada Satinada Soleada (Edición Oro 2026)",
    slug: "falda-plisada-satinada-soleada-edicion-oro-2026",
    descripcion: "Falda de largo midi con pliegues definidos en tejido brillante satinado y pretina elástica confortable. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-062-DOR-S-1",
            "talla": "S",
            "color": "Dorado Bronce",
            "precioVentaCop": 143000
      },
      {
            "sku": "ROP-ED26-062-DOR-M-2",
            "talla": "M",
            "color": "Dorado Bronce",
            "precioVentaCop": 143000
      },
      {
            "sku": "ROP-ED26-062-DOR-L-3",
            "talla": "L",
            "color": "Dorado Bronce",
            "precioVentaCop": 143000
      },
      {
            "sku": "ROP-ED26-062-VER-S-4",
            "talla": "S",
            "color": "Verde Bosque",
            "precioVentaCop": 143000
      },
      {
            "sku": "ROP-ED26-062-VER-M-5",
            "talla": "M",
            "color": "Verde Bosque",
            "precioVentaCop": 143000
      },
      {
            "sku": "ROP-ED26-062-VER-L-6",
            "talla": "L",
            "color": "Verde Bosque",
            "precioVentaCop": 143000
      }
]
  },
  {
    nombre: "Camiseta Básica Pima Cotton (Edición Oro 2026)",
    slug: "camiseta-basica-pima-cotton-edicion-oro-2026",
    descripcion: "Camiseta unisex cuello redondo en algodón Pima peinado de alta densidad con costuras reforzadas. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-063-BLA-S-1",
            "talla": "S",
            "color": "Blanco",
            "precioVentaCop": 63000
      },
      {
            "sku": "ROP-ED26-063-BLA-M-2",
            "talla": "M",
            "color": "Blanco",
            "precioVentaCop": 63000
      },
      {
            "sku": "ROP-ED26-063-BLA-L-3",
            "talla": "L",
            "color": "Blanco",
            "precioVentaCop": 63000
      },
      {
            "sku": "ROP-ED26-063-NEG-S-4",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 63000
      },
      {
            "sku": "ROP-ED26-063-NEG-M-5",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 63000
      },
      {
            "sku": "ROP-ED26-063-NEG-L-6",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 63000
      }
]
  },
  {
    nombre: "Buzo Cuello Tortuga Cashmere Touch (Edición Oro 2026)",
    slug: "buzo-cuello-tortuga-cashmere-touch-edicion-oro-2026",
    descripcion: "Suéter de tejido de punto fino tacto cachemira con cuello vuelto suave que no pica. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-064-CRU-S-1",
            "talla": "S",
            "color": "Crudo",
            "precioVentaCop": 126000
      },
      {
            "sku": "ROP-ED26-064-CRU-M-2",
            "talla": "M",
            "color": "Crudo",
            "precioVentaCop": 126000
      },
      {
            "sku": "ROP-ED26-064-CRU-L-3",
            "talla": "L",
            "color": "Crudo",
            "precioVentaCop": 126000
      },
      {
            "sku": "ROP-ED26-064-NEG-S-4",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 126000
      },
      {
            "sku": "ROP-ED26-064-NEG-M-5",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 126000
      },
      {
            "sku": "ROP-ED26-064-NEG-L-6",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 126000
      }
]
  },
  {
    nombre: "Polo Piqué Clásico Formal (Edición Oro 2026)",
    slug: "polo-pique-clasico-formal-edicion-oro-2026",
    descripcion: "Camiseta tipo polo en tejido piqué suave de algodón con cuello camisero rígido y abertura de dos botones. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1625910513413-5bc21743a4e1?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-065-AZU-S-1",
            "talla": "S",
            "color": "Azul Rey",
            "precioVentaCop": 102000
      },
      {
            "sku": "ROP-ED26-065-AZU-M-2",
            "talla": "M",
            "color": "Azul Rey",
            "precioVentaCop": 102000
      },
      {
            "sku": "ROP-ED26-065-AZU-L-3",
            "talla": "L",
            "color": "Azul Rey",
            "precioVentaCop": 102000
      },
      {
            "sku": "ROP-ED26-065-BLA-S-4",
            "talla": "S",
            "color": "Blanco",
            "precioVentaCop": 102000
      },
      {
            "sku": "ROP-ED26-065-BLA-M-5",
            "talla": "M",
            "color": "Blanco",
            "precioVentaCop": 102000
      },
      {
            "sku": "ROP-ED26-065-BLA-L-6",
            "talla": "L",
            "color": "Blanco",
            "precioVentaCop": 102000
      }
]
  },
  {
    nombre: "Enterizo Asimétrico de Noche (Edición Oro 2026)",
    slug: "enterizo-asimetrico-de-noche-edicion-oro-2026",
    descripcion: "Jumpsuit con escote a un hombro y pantalón recto palazzo en crepé elastizado de gran caída. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-066-NEG-S-1",
            "talla": "S",
            "color": "Negro Noche",
            "precioVentaCop": 224000
      },
      {
            "sku": "ROP-ED26-066-NEG-M-2",
            "talla": "M",
            "color": "Negro Noche",
            "precioVentaCop": 224000
      },
      {
            "sku": "ROP-ED26-066-NEG-L-3",
            "talla": "L",
            "color": "Negro Noche",
            "precioVentaCop": 224000
      },
      {
            "sku": "ROP-ED26-066-ROJ-S-4",
            "talla": "S",
            "color": "Rojo Rubí",
            "precioVentaCop": 224000
      },
      {
            "sku": "ROP-ED26-066-ROJ-M-5",
            "talla": "M",
            "color": "Rojo Rubí",
            "precioVentaCop": 224000
      },
      {
            "sku": "ROP-ED26-066-ROJ-L-6",
            "talla": "L",
            "color": "Rojo Rubí",
            "precioVentaCop": 224000
      }
]
  },
  {
    nombre: "Bermuda Chino Casual Verano (Edición Oro 2026)",
    slug: "bermuda-chino-casual-verano-edicion-oro-2026",
    descripcion: "Short estilo chino en sarga de algodón stretch con bolsillos ojal y largo sobre la rodilla. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-067-CAQ-30-1",
            "talla": "30",
            "color": "Caqui",
            "precioVentaCop": 109000
      },
      {
            "sku": "ROP-ED26-067-CAQ-32-2",
            "talla": "32",
            "color": "Caqui",
            "precioVentaCop": 109000
      },
      {
            "sku": "ROP-ED26-067-CAQ-34-3",
            "talla": "34",
            "color": "Caqui",
            "precioVentaCop": 109000
      },
      {
            "sku": "ROP-ED26-067-AZU-30-4",
            "talla": "30",
            "color": "Azul Naval",
            "precioVentaCop": 109000
      },
      {
            "sku": "ROP-ED26-067-AZU-32-5",
            "talla": "32",
            "color": "Azul Naval",
            "precioVentaCop": 109000
      },
      {
            "sku": "ROP-ED26-067-AZU-34-6",
            "talla": "34",
            "color": "Azul Naval",
            "precioVentaCop": 109000
      }
]
  },
  {
    nombre: "Top Lencero Encaje Delicado (Edición Oro 2026)",
    slug: "top-lencero-encaje-delicado-edicion-oro-2026",
    descripcion: "Top de tirantes finos en satén con detalle de encaje floral festoneado en el escote en V. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-068-MAR-XS-1",
            "talla": "XS",
            "color": "Marfil",
            "precioVentaCop": 78000
      },
      {
            "sku": "ROP-ED26-068-MAR-S-2",
            "talla": "S",
            "color": "Marfil",
            "precioVentaCop": 78000
      },
      {
            "sku": "ROP-ED26-068-MAR-M-3",
            "talla": "M",
            "color": "Marfil",
            "precioVentaCop": 78000
      },
      {
            "sku": "ROP-ED26-068-NEG-XS-4",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 78000
      },
      {
            "sku": "ROP-ED26-068-NEG-S-5",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 78000
      },
      {
            "sku": "ROP-ED26-068-NEG-M-6",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 78000
      }
]
  },
  {
    nombre: "Cardigan Tejido Trenzado Boho (Edición Oro 2026)",
    slug: "cardigan-tejido-trenzado-boho-edicion-oro-2026",
    descripcion: "Chaqueta de punto trenzado artesanal abierta con botones de carey y silueta oversize relajada. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-069-AVE-S-1",
            "talla": "S",
            "color": "Avena",
            "precioVentaCop": 161000
      },
      {
            "sku": "ROP-ED26-069-AVE-M-2",
            "talla": "M",
            "color": "Avena",
            "precioVentaCop": 161000
      },
      {
            "sku": "ROP-ED26-069-AVE-L-3",
            "talla": "L",
            "color": "Avena",
            "precioVentaCop": 161000
      },
      {
            "sku": "ROP-ED26-069-GRI-S-4",
            "talla": "S",
            "color": "Gris Perla",
            "precioVentaCop": 161000
      },
      {
            "sku": "ROP-ED26-069-GRI-M-5",
            "talla": "M",
            "color": "Gris Perla",
            "precioVentaCop": 161000
      },
      {
            "sku": "ROP-ED26-069-GRI-L-6",
            "talla": "L",
            "color": "Gris Perla",
            "precioVentaCop": 161000
      }
]
  },
  {
    nombre: "Vestido Camisero Lino Floral (Edición Oro 2026)",
    slug: "vestido-camisero-lino-floral-edicion-oro-2026",
    descripcion: "Vestido abotonado de largo midi con cinturón del mismo tejido y estampado botánico exclusivo. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-070-FLO-S-1",
            "talla": "S",
            "color": "Floral Verde",
            "precioVentaCop": 201000
      },
      {
            "sku": "ROP-ED26-070-FLO-M-2",
            "talla": "M",
            "color": "Floral Verde",
            "precioVentaCop": 201000
      },
      {
            "sku": "ROP-ED26-070-FLO-L-3",
            "talla": "L",
            "color": "Floral Verde",
            "precioVentaCop": 201000
      },
      {
            "sku": "ROP-ED26-070-FLO-S-4",
            "talla": "S",
            "color": "Floral Terracota",
            "precioVentaCop": 201000
      },
      {
            "sku": "ROP-ED26-070-FLO-M-5",
            "talla": "M",
            "color": "Floral Terracota",
            "precioVentaCop": 201000
      },
      {
            "sku": "ROP-ED26-070-FLO-L-6",
            "talla": "L",
            "color": "Floral Terracota",
            "precioVentaCop": 201000
      }
]
  },
  {
    nombre: "Pantalón Jogger Urbano Streetwear (Edición Oro 2026)",
    slug: "pantalon-jogger-urbano-streetwear-edicion-oro-2026",
    descripcion: "Jogger de algodón afelpado con elásticos en tobillos, bolsillos con cremallera y cordón ajustable. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-071-GRI-S-1",
            "talla": "S",
            "color": "Gris Antracita",
            "precioVentaCop": 132000
      },
      {
            "sku": "ROP-ED26-071-GRI-M-2",
            "talla": "M",
            "color": "Gris Antracita",
            "precioVentaCop": 132000
      },
      {
            "sku": "ROP-ED26-071-GRI-L-3",
            "talla": "L",
            "color": "Gris Antracita",
            "precioVentaCop": 132000
      },
      {
            "sku": "ROP-ED26-071-NEG-S-4",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 132000
      },
      {
            "sku": "ROP-ED26-071-NEG-M-5",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 132000
      },
      {
            "sku": "ROP-ED26-071-NEG-L-6",
            "talla": "L",
            "color": "Negro",
            "precioVentaCop": 132000
      }
]
  },
  {
    nombre: "Camisa Denim Lavada Clásica (Edición Oro 2026)",
    slug: "camisa-denim-lavada-clasica-edicion-oro-2026",
    descripcion: "Camisa vaquera de botones a presión nacarados con doble bolsillo en el pecho y canesú en punta. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-072-DEN-S-1",
            "talla": "S",
            "color": "Denim Claro",
            "precioVentaCop": 138000
      },
      {
            "sku": "ROP-ED26-072-DEN-M-2",
            "talla": "M",
            "color": "Denim Claro",
            "precioVentaCop": 138000
      },
      {
            "sku": "ROP-ED26-072-DEN-L-3",
            "talla": "L",
            "color": "Denim Claro",
            "precioVentaCop": 138000
      },
      {
            "sku": "ROP-ED26-072-DEN-S-4",
            "talla": "S",
            "color": "Denim Oscuro",
            "precioVentaCop": 138000
      },
      {
            "sku": "ROP-ED26-072-DEN-M-5",
            "talla": "M",
            "color": "Denim Oscuro",
            "precioVentaCop": 138000
      },
      {
            "sku": "ROP-ED26-072-DEN-L-6",
            "talla": "L",
            "color": "Denim Oscuro",
            "precioVentaCop": 138000
      }
]
  },
  {
    nombre: "Falda Denim Tubo Abertura Frontal (Edición Oro 2026)",
    slug: "falda-denim-tubo-abertura-frontal-edicion-oro-2026",
    descripcion: "Maxi falda vaquera de silueta recta con abertura central y bolsillos tradicionales de 5 puntos. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1582142407894-ec85a1260a46?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-073-AZU-6-1",
            "talla": "6",
            "color": "Azul Lavado",
            "precioVentaCop": 149000
      },
      {
            "sku": "ROP-ED26-073-AZU-8-2",
            "talla": "8",
            "color": "Azul Lavado",
            "precioVentaCop": 149000
      },
      {
            "sku": "ROP-ED26-073-AZU-10-3",
            "talla": "10",
            "color": "Azul Lavado",
            "precioVentaCop": 149000
      },
      {
            "sku": "ROP-ED26-073-NEG-6-4",
            "talla": "6",
            "color": "Negro Desgastado",
            "precioVentaCop": 149000
      },
      {
            "sku": "ROP-ED26-073-NEG-8-5",
            "talla": "8",
            "color": "Negro Desgastado",
            "precioVentaCop": 149000
      },
      {
            "sku": "ROP-ED26-073-NEG-10-6",
            "talla": "10",
            "color": "Negro Desgastado",
            "precioVentaCop": 149000
      }
]
  },
  {
    nombre: "Blusa Gasa Mangas Abullonadas (Edición Oro 2026)",
    slug: "blusa-gasa-mangas-abullonadas-edicion-oro-2026",
    descripcion: "Blusa semitransparente con cuello mao, puños fruncidos y volumen romántico en los hombros. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1564257631407-4deb129f044b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-074-BLA-S-1",
            "talla": "S",
            "color": "Blanco Óptico",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-ED26-074-BLA-M-2",
            "talla": "M",
            "color": "Blanco Óptico",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-ED26-074-BLA-L-3",
            "talla": "L",
            "color": "Blanco Óptico",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-ED26-074-LIL-S-4",
            "talla": "S",
            "color": "Lila Pastel",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-ED26-074-LIL-M-5",
            "talla": "M",
            "color": "Lila Pastel",
            "precioVentaCop": 105000
      },
      {
            "sku": "ROP-ED26-074-LIL-L-6",
            "talla": "L",
            "color": "Lila Pastel",
            "precioVentaCop": 105000
      }
]
  },
  {
    nombre: "Chaleco Sastre Botonadura Simple (Edición Oro 2026)",
    slug: "chaleco-sastre-botonadura-simple-edicion-oro-2026",
    descripcion: "Chaleco de vestir entallado para llevar solo como top o sobre camisas, con espalda ajustable. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Ropa",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ROP-ED26-075-GRI-XS-1",
            "talla": "XS",
            "color": "Gris Espiga",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-ED26-075-GRI-S-2",
            "talla": "S",
            "color": "Gris Espiga",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-ED26-075-GRI-M-3",
            "talla": "M",
            "color": "Gris Espiga",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-ED26-075-NEG-XS-4",
            "talla": "XS",
            "color": "Negro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-ED26-075-NEG-S-5",
            "talla": "S",
            "color": "Negro",
            "precioVentaCop": 120000
      },
      {
            "sku": "ROP-ED26-075-NEG-M-6",
            "talla": "M",
            "color": "Negro",
            "precioVentaCop": 120000
      }
]
  },
  {
    nombre: "Gorra Urbana Snapback Obsidian (Edición Oro 2026)",
    slug: "gorra-urbana-snapback-obsidian-edicion-oro-2026",
    descripcion: "Gorra deportiva de 6 paneles estructurados con bordado frontal tonal y ajuste trasero de presión. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-076-NEG-UNI-1",
            "talla": "Única",
            "color": "Negro",
            "precioVentaCop": 48000
      },
      {
            "sku": "ACC-ED26-076-AZU-UNI-2",
            "talla": "Única",
            "color": "Azul Marino",
            "precioVentaCop": 48000
      }
]
  },
  {
    nombre: "Bolso Tote Bag Cuero Vacuno (Edición Oro 2026)",
    slug: "bolso-tote-bag-cuero-vacuno-edicion-oro-2026",
    descripcion: "Bolso shopping amplio en genuino cuero graneado colombiano con compartimento acolchado para laptop 14 pulg. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-077-MIE-UNI-1",
            "talla": "Única",
            "color": "Miel Caramelo",
            "precioVentaCop": 322000
      },
      {
            "sku": "ACC-ED26-077-NEG-UNI-2",
            "talla": "Única",
            "color": "Negro Onix",
            "precioVentaCop": 322000
      }
]
  },
  {
    nombre: "Bolso Bandolera Crossbody Chain (Edición Oro 2026)",
    slug: "bolso-bandolera-crossbody-chain-edicion-oro-2026",
    descripcion: "Cartera estructurada de tamaño mediano con solapa magnética y cadena dorada convertible a hombro. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-078-NEG-UNI-1",
            "talla": "Única",
            "color": "Negro",
            "precioVentaCop": 189000
      },
      {
            "sku": "ACC-ED26-078-VER-UNI-2",
            "talla": "Única",
            "color": "Verde Esmeralda",
            "precioVentaCop": 189000
      }
]
  },
  {
    nombre: "Billetera Bifold Cuero Genuino (Edición Oro 2026)",
    slug: "billetera-bifold-cuero-genuino-edicion-oro-2026",
    descripcion: "Billetera compacta de doble pliegue con protección RFID anti-escaneo y 8 ranuras para tarjetas. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-079-CAF-UNI-1",
            "talla": "Única",
            "color": "Café Tabaco",
            "precioVentaCop": 89000
      },
      {
            "sku": "ACC-ED26-079-NEG-UNI-2",
            "talla": "Única",
            "color": "Negro Carbono",
            "precioVentaCop": 89000
      }
]
  },
  {
    nombre: "Cinturón Sastre Hebilla Dorada (Edición Oro 2026)",
    slug: "cinturon-sastre-hebilla-dorada-edicion-oro-2026",
    descripcion: "Cinturón fino de 2.5cm en cuero legítimo con hebilla geométrica de latón bañado en oro satinado. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-080-NEG-S85-1",
            "talla": "S (85cm)",
            "color": "Negro",
            "precioVentaCop": 71000
      },
      {
            "sku": "ACC-ED26-080-NEG-M95-2",
            "talla": "M (95cm)",
            "color": "Negro",
            "precioVentaCop": 71000
      },
      {
            "sku": "ACC-ED26-080-NEG-L10-3",
            "talla": "L (105cm)",
            "color": "Negro",
            "precioVentaCop": 71000
      },
      {
            "sku": "ACC-ED26-080-SUE-S85-4",
            "talla": "S (85cm)",
            "color": "Suela",
            "precioVentaCop": 71000
      },
      {
            "sku": "ACC-ED26-080-SUE-M95-5",
            "talla": "M (95cm)",
            "color": "Suela",
            "precioVentaCop": 71000
      },
      {
            "sku": "ACC-ED26-080-SUE-L10-6",
            "talla": "L (105cm)",
            "color": "Suela",
            "precioVentaCop": 71000
      }
]
  },
  {
    nombre: "Gafas de Sol Aviador Polarizadas UV400 (Edición Oro 2026)",
    slug: "gafas-de-sol-aviador-polarizadas-uv400-edicion-oro-2026",
    descripcion: "Montura metálica ultraligera con lentes de cristal mineral polarizado protección UV400 categoría 3. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-081-DOR-UNI-1",
            "talla": "Única",
            "color": "Dorado con Verde",
            "precioVentaCop": 109000
      },
      {
            "sku": "ACC-ED26-081-NEG-UNI-2",
            "talla": "Única",
            "color": "Negro Total",
            "precioVentaCop": 109000
      }
]
  },
  {
    nombre: "Collar Cadena Eslabones Acero 18k (Edición Oro 2026)",
    slug: "collar-cadena-eslabones-acero-18k-edicion-oro-2026",
    descripcion: "Choker de eslabones tipo grumetta en acero quirúrgico 316L con triple baño electrolítico en oro de 18k. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-082-DOR-UNI-1",
            "talla": "Única (42cm)",
            "color": "Dorado",
            "precioVentaCop": 66000
      },
      {
            "sku": "ACC-ED26-082-PLA-UNI-2",
            "talla": "Única (42cm)",
            "color": "Plateado",
            "precioVentaCop": 66000
      }
]
  },
  {
    nombre: "Aretes Argollas Chunky Texturizadas (Edición Oro 2026)",
    slug: "aretes-argollas-chunky-texturizadas-edicion-oro-2026",
    descripcion: "Aretes de aro hueco ultraligeros con cierre de clip seguro y textura trenzada reflectante. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-083-ORO-UNI-1",
            "talla": "Única",
            "color": "Oro 18k",
            "precioVentaCop": 48000
      },
      {
            "sku": "ACC-ED26-083-PLA-UNI-2",
            "talla": "Única",
            "color": "Plata 925",
            "precioVentaCop": 48000
      }
]
  },
  {
    nombre: "Reloj Minimalista Cuarzo Mesh Band (Edición Oro 2026)",
    slug: "reloj-minimalista-cuarzo-mesh-band-edicion-oro-2026",
    descripcion: "Reloj analógico con esfera de cristal zafiro resistente a rayones y malla de acero milanesa ajustable. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-084-NEG-38M-1",
            "talla": "38mm",
            "color": "Negro Mate",
            "precioVentaCop": 212000
      },
      {
            "sku": "ACC-ED26-084-NEG-42M-2",
            "talla": "42mm",
            "color": "Negro Mate",
            "precioVentaCop": 212000
      },
      {
            "sku": "ACC-ED26-084-PLA-38M-3",
            "talla": "38mm",
            "color": "Plata Clásica",
            "precioVentaCop": 212000
      },
      {
            "sku": "ACC-ED26-084-PLA-42M-4",
            "talla": "42mm",
            "color": "Plata Clásica",
            "precioVentaCop": 212000
      }
]
  },
  {
    nombre: "Sombrero Fedora de Lana Australiana (Edición Oro 2026)",
    slug: "sombrero-fedora-de-lana-australiana-edicion-oro-2026",
    descripcion: "Sombrero rígido ala media elaborado en 100% fieltro de lana con cinta perimetral de piel natural. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-085-NEG-M57-1",
            "talla": "M (57cm)",
            "color": "Negro",
            "precioVentaCop": 138000
      },
      {
            "sku": "ACC-ED26-085-NEG-L59-2",
            "talla": "L (59cm)",
            "color": "Negro",
            "precioVentaCop": 138000
      },
      {
            "sku": "ACC-ED26-085-CAM-M57-3",
            "talla": "M (57cm)",
            "color": "Camel",
            "precioVentaCop": 138000
      },
      {
            "sku": "ACC-ED26-085-CAM-L59-4",
            "talla": "L (59cm)",
            "color": "Camel",
            "precioVentaCop": 138000
      }
]
  },
  {
    nombre: "Tenis Urbanos Blancos Minimal (Edición Oro 2026)",
    slug: "tenis-urbanos-blancos-minimal-edicion-oro-2026",
    descripcion: "Sneakers en cuero vacuno blanco con suela de caucho vulcanizado cosida y plantilla anatómica en memory foam. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-086-BLA-36-1",
            "talla": "36",
            "color": "Blanco Puro",
            "precioVentaCop": 241000
      },
      {
            "sku": "ACC-ED26-086-BLA-37-2",
            "talla": "37",
            "color": "Blanco Puro",
            "precioVentaCop": 241000
      },
      {
            "sku": "ACC-ED26-086-BLA-38-3",
            "talla": "38",
            "color": "Blanco Puro",
            "precioVentaCop": 241000
      },
      {
            "sku": "ACC-ED26-086-BLA-36-4",
            "talla": "36",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 241000
      },
      {
            "sku": "ACC-ED26-086-BLA-37-5",
            "talla": "37",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 241000
      },
      {
            "sku": "ACC-ED26-086-BLA-38-6",
            "talla": "38",
            "color": "Blanco con Talonera Verde",
            "precioVentaCop": 241000
      }
]
  },
  {
    nombre: "Botines Chelsea Cuero Nobuk (Edición Oro 2026)",
    slug: "botines-chelsea-cuero-nobuk-edicion-oro-2026",
    descripcion: "Botín clásico tobillero con elásticos laterales y suela track dentada anti-deslizante de gran agarre. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-087-MAR-37-1",
            "talla": "37",
            "color": "Marrón Tabaco",
            "precioVentaCop": 299000
      },
      {
            "sku": "ACC-ED26-087-MAR-38-2",
            "talla": "38",
            "color": "Marrón Tabaco",
            "precioVentaCop": 299000
      },
      {
            "sku": "ACC-ED26-087-MAR-39-3",
            "talla": "39",
            "color": "Marrón Tabaco",
            "precioVentaCop": 299000
      },
      {
            "sku": "ACC-ED26-087-NEG-37-4",
            "talla": "37",
            "color": "Negro Carbón",
            "precioVentaCop": 299000
      },
      {
            "sku": "ACC-ED26-087-NEG-38-5",
            "talla": "38",
            "color": "Negro Carbón",
            "precioVentaCop": 299000
      },
      {
            "sku": "ACC-ED26-087-NEG-39-6",
            "talla": "39",
            "color": "Negro Carbón",
            "precioVentaCop": 299000
      }
]
  },
  {
    nombre: "Tacones Stiletto Nude 8.5cm (Edición Oro 2026)",
    slug: "tacones-stiletto-nude-8-5cm-edicion-oro-2026",
    descripcion: "Zapatos de salón con puntera afilada y tacón aguja de 8.5cm forrado en cuero con almohadilla metatarsal. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-088-NUD-35-1",
            "talla": "35",
            "color": "Nude Rosado",
            "precioVentaCop": 201000
      },
      {
            "sku": "ACC-ED26-088-NUD-36-2",
            "talla": "36",
            "color": "Nude Rosado",
            "precioVentaCop": 201000
      },
      {
            "sku": "ACC-ED26-088-NUD-37-3",
            "talla": "37",
            "color": "Nude Rosado",
            "precioVentaCop": 201000
      },
      {
            "sku": "ACC-ED26-088-NEG-35-4",
            "talla": "35",
            "color": "Negro Charol",
            "precioVentaCop": 201000
      },
      {
            "sku": "ACC-ED26-088-NEG-36-5",
            "talla": "36",
            "color": "Negro Charol",
            "precioVentaCop": 201000
      },
      {
            "sku": "ACC-ED26-088-NEG-37-6",
            "talla": "37",
            "color": "Negro Charol",
            "precioVentaCop": 201000
      }
]
  },
  {
    nombre: "Mocasines Penny Loafers Cuero (Edición Oro 2026)",
    slug: "mocasines-penny-loafers-cuero-edicion-oro-2026",
    descripcion: "Mocasín artesanal con antifaz tradicional y vira cosida a mano, ideal para oficina o atuendo formal. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-089-BUR-39-1",
            "talla": "39",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 224000
      },
      {
            "sku": "ACC-ED26-089-BUR-40-2",
            "talla": "40",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 224000
      },
      {
            "sku": "ACC-ED26-089-BUR-41-3",
            "talla": "41",
            "color": "Burdeos Oxblood",
            "precioVentaCop": 224000
      },
      {
            "sku": "ACC-ED26-089-NEG-39-4",
            "talla": "39",
            "color": "Negro",
            "precioVentaCop": 224000
      },
      {
            "sku": "ACC-ED26-089-NEG-40-5",
            "talla": "40",
            "color": "Negro",
            "precioVentaCop": 224000
      },
      {
            "sku": "ACC-ED26-089-NEG-41-6",
            "talla": "41",
            "color": "Negro",
            "precioVentaCop": 224000
      }
]
  },
  {
    nombre: "Pañuelo de Seda Estampado Botánico (Edición Oro 2026)",
    slug: "panuelo-de-seda-estampado-botanico-edicion-oro-2026",
    descripcion: "Foulard cuadrado de 70x70cm en twill de seda artificial con remate a mano en los bordes. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Accesorios",
    reintegrableEnDevolucion: true,
    imagenesUrls: ["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "ACC-ED26-090-VER-UNI-1",
            "talla": "Única (70x70)",
            "color": "Verde Selva",
            "precioVentaCop": 51000
      },
      {
            "sku": "ACC-ED26-090-AZU-UNI-2",
            "talla": "Única (70x70)",
            "color": "Azul Marino Oro",
            "precioVentaCop": 51000
      }
]
  },
  {
    nombre: "Sérum Ácido Hialurónico Puro 2% + B5 (Edición Oro 2026)",
    slug: "serum-acido-hialuronico-puro-2-b5-edicion-oro-2026",
    descripcion: "Fórmula hidratante multicapa con tres pesos moleculares de ácido hialurónico y provitamina B5 calmante 30ml. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-091-NEU-30M-1",
            "talla": "30ml",
            "color": "Neutro",
            "precioVentaCop": 78000
      },
      {
            "sku": "COS-ED26-091-NEU-60M-2",
            "talla": "60ml",
            "color": "Neutro",
            "precioVentaCop": 78000
      }
]
  },
  {
    nombre: "Sérum Vitamina C 15% + Ácido Ferúlico (Edición Oro 2026)",
    slug: "serum-vitamina-c-15-acido-ferulico-edicion-oro-2026",
    descripcion: "Antioxidante iluminador que neutraliza radicales libres, unifica el tono y estimula la síntesis de colágeno. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1608248597359-0f666f21226b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-092-NEU-30M-1",
            "talla": "30ml",
            "color": "Neutro",
            "precioVentaCop": 90000
      }
]
  },
  {
    nombre: "Crema Hidratante Ceramid Barrier 50ml (Edición Oro 2026)",
    slug: "crema-hidratante-ceramid-barrier-50ml-edicion-oro-2026",
    descripcion: "Emulsión restauradora con 3 ceramidas esenciales, colesterol y niacinamida para reparar la barrera cutánea. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-093-NEU-50M-1",
            "talla": "50ml",
            "color": "Neutro",
            "precioVentaCop": 71000
      },
      {
            "sku": "COS-ED26-093-NEU-100-2",
            "talla": "100ml",
            "color": "Neutro",
            "precioVentaCop": 71000
      }
]
  },
  {
    nombre: "Protector Solar Toque Seco FPS 50+ (Edición Oro 2026)",
    slug: "protector-solar-toque-seco-fps-50-edicion-oro-2026",
    descripcion: "Fluido ultraligero de absorción inmediata con filtros fotoestables amplio espectro UVA/UVB y efecto mate. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-094-INV-50M-1",
            "talla": "50ml",
            "color": "Invisible",
            "precioVentaCop": 86000
      }
]
  },
  {
    nombre: "Contorno de Ojos Cafeína 5% + EGCG (Edición Oro 2026)",
    slug: "contorno-de-ojos-cafeina-5-egcg-edicion-oro-2026",
    descripcion: "Gel descongestionante para bolsas y ojeras oscuras enriquecido con extracto de té verde y péptidos tensores. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-095-NEU-15M-1",
            "talla": "15ml",
            "color": "Neutro",
            "precioVentaCop": 62000
      }
]
  },
  {
    nombre: "Tónico Exfoliante Ácido Glicólico 7% (Edición Oro 2026)",
    slug: "tonico-exfoliante-acido-glicolico-7-edicion-oro-2026",
    descripcion: "Solución tonificante que suaviza la textura de la piel, limpia los poros y potencia la luminosidad natural. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-096-NEU-150-1",
            "talla": "150ml",
            "color": "Neutro",
            "precioVentaCop": 66000
      }
]
  },
  {
    nombre: "Limpiador Facial Espumoso pH Balanceado (Edición Oro 2026)",
    slug: "limpiador-facial-espumoso-ph-balanceado-edicion-oro-2026",
    descripcion: "Gel limpiador suave con aminoácidos botánicos que retira impurezas y maquillaje sin resecar la piel. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1556228722-d0b71f3089d8?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-097-NEU-200-1",
            "talla": "200ml",
            "color": "Neutro",
            "precioVentaCop": 52000
      }
]
  },
  {
    nombre: "Aceite Facial Regenerador Rosa Mosqueta (Edición Oro 2026)",
    slug: "aceite-facial-regenerador-rosa-mosqueta-edicion-oro-2026",
    descripcion: "100% puro aceite virgen prensado en frío rico en ácidos grasos omega 3, 6 y 9 para nutrir pieles secas. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-098-DOR-30M-1",
            "talla": "30ml",
            "color": "Dorado Natural",
            "precioVentaCop": 56000
      }
]
  },
  {
    nombre: "Agua Micelar Desmaquillante Calmante (Edición Oro 2026)",
    slug: "agua-micelar-desmaquillante-calmante-edicion-oro-2026",
    descripcion: "Fórmula enriquecida con agua de rosas y glicerina vegetal para rostro, ojos y labios sensibles. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-099-NEU-250-1",
            "talla": "250ml",
            "color": "Neutro",
            "precioVentaCop": 43000
      },
      {
            "sku": "COS-ED26-099-NEU-400-2",
            "talla": "400ml",
            "color": "Neutro",
            "precioVentaCop": 43000
      }
]
  },
  {
    nombre: "Mascarilla Facial Purificante Arcilla Verde (Edición Oro 2026)",
    slug: "mascarilla-facial-purificante-arcilla-verde-edicion-oro-2026",
    descripcion: "Tratamiento semanal detoxificante con arcilla bentonita y aceite de árbol de té para matificar y calmar rojeces. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1567928815104-b7980ee07078?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-100-VER-100-1",
            "talla": "100g",
            "color": "Verde Herbal",
            "precioVentaCop": 48000
      }
]
  },
  {
    nombre: "Labial Mate Terciopelo Larga Duración (Edición Oro 2026)",
    slug: "labial-mate-terciopelo-larga-duracion-edicion-oro-2026",
    descripcion: "Barra de labios con textura cremosa que seca en un acabado mate aterciopelado indeleble de hasta 12 horas. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-101-ROJ-UNI-1",
            "talla": "Única (4g)",
            "color": "Rojo Borgoña",
            "precioVentaCop": 39000
      },
      {
            "sku": "COS-ED26-101-NUD-UNI-2",
            "talla": "Única (4g)",
            "color": "Nude Rosa",
            "precioVentaCop": 39000
      }
]
  },
  {
    nombre: "Base Líquida Acabado Segunda Piel FPS 20 (Edición Oro 2026)",
    slug: "base-liquida-acabado-segunda-piel-fps-20-edicion-oro-2026",
    descripcion: "Base de maquillaje fluida cobertura graduable con ácido hialurónico y pigmentos reflectores de luz. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-102-POR-30M-1",
            "talla": "30ml",
            "color": "Porcelana 01",
            "precioVentaCop": 82000
      },
      {
            "sku": "COS-ED26-102-VAI-30M-2",
            "talla": "30ml",
            "color": "Vainilla 02",
            "precioVentaCop": 82000
      }
]
  },
  {
    nombre: "Corrector Iluminador Alta Cobertura (Edición Oro 2026)",
    slug: "corrector-iluminador-alta-cobertura-edicion-oro-2026",
    descripcion: "Corrector cremoso enriquecido con cafeína que camufla ojeras e imperfecciones sin marcar líneas finas. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-103-FAI-8ML-1",
            "talla": "8ml",
            "color": "Fair Light",
            "precioVentaCop": 48000
      },
      {
            "sku": "COS-ED26-103-MED-8ML-2",
            "talla": "8ml",
            "color": "Medium Warm",
            "precioVentaCop": 48000
      }
]
  },
  {
    nombre: "Paleta de Sombras Nude Earth 12 Tonos (Edición Oro 2026)",
    slug: "paleta-de-sombras-nude-earth-12-tonos-edicion-oro-2026",
    descripcion: "12 sombras en acabados mate mantecosos, satinados brillantes y glitters prensados de alta pigmentación. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1583241800698-e8ab01c85b27?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-104-TON-PAL-1",
            "talla": "Paleta 12g",
            "color": "Tonos Tierra y Oro",
            "precioVentaCop": 101000
      }
]
  },
  {
    nombre: "Máscara de Pestañas Efecto Pestañina HD (Edición Oro 2026)",
    slug: "mascara-de-pestanas-efecto-pestanina-hd-edicion-oro-2026",
    descripcion: "Cepillo de silicona curvo que alarga, define y engrosa pestaña por pestaña sin dejar grumos ni transferir. Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.",
    categoriaNombre: "Cosméticos",
    reintegrableEnDevolucion: false,
    imagenesUrls: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80"],
    variantes: [
      {
            "sku": "COS-ED26-105-NEG-10M-1",
            "talla": "10ml",
            "color": "Negro Intenso",
            "precioVentaCop": 43000
      }
]
  },
];
