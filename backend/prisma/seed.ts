import { PrismaClient, RolUsuario, TipoUbicacion } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed oficial de parámetros y datos iniciales...');

  // 1. Zonas de Envío DANE (RN-ENV-03)
  const tarifas = [
    { zona: 1, nombre: 'Mismo Municipio', tarifaCop: 8000, diasEstimados: 2 },
    { zona: 2, nombre: 'Mismo Departamento', tarifaCop: 12000, diasEstimados: 3 },
    { zona: 3, nombre: 'Misma Región', tarifaCop: 16000, diasEstimados: 4 },
    { zona: 4, nombre: 'Diferente Región', tarifaCop: 22000, diasEstimados: 6 },
  ];

  for (const t of tarifas) {
    await prisma.tarifaZonaEnvio.upsert({
      where: { zona: t.zona },
      update: { tarifaCop: t.tarifaCop, diasEstimados: t.diasEstimados },
      create: t,
    });
  }

  // 2. Regiones y Departamentos DANE
  const regionOriente = await prisma.regionEnvio.upsert({
    where: { nombre: 'Región Oriente' },
    update: {},
    create: { nombre: 'Región Oriente' },
  });

  const deptoNorteSantander = await prisma.departamentoDane.upsert({
    where: { codigoDane: '54' },
    update: {},
    create: {
      codigoDane: '54',
      nombre: 'Norte de Santander',
      regionId: regionOriente.id,
    },
  });

  const deptoSantander = await prisma.departamentoDane.upsert({
    where: { codigoDane: '68' },
    update: {},
    create: {
      codigoDane: '68',
      nombre: 'Santander',
      regionId: regionOriente.id,
    },
  });

  // 3. Municipios DANE
  const cucuta = await prisma.municipioDane.upsert({
    where: { codigoDane: '54001' },
    update: {},
    create: {
      codigoDane: '54001',
      nombre: 'Cúcuta',
      departamentoId: deptoNorteSantander.codigoDane,
      atendidoWeb: true,
    },
  });

  const ocana = await prisma.municipioDane.upsert({
    where: { codigoDane: '54498' },
    update: {},
    create: {
      codigoDane: '54498',
      nombre: 'Ocaña',
      departamentoId: deptoNorteSantander.codigoDane,
      atendidoWeb: true,
    },
  });

  const bucaramanga = await prisma.municipioDane.upsert({
    where: { codigoDane: '68001' },
    update: {},
    create: {
      codigoDane: '68001',
      nombre: 'Bucaramanga',
      departamentoId: deptoSantander.codigoDane,
      atendidoWeb: true,
    },
  });

  // 4. Ubicaciones Oficiales (Parametros-Oficiales-y-Semillas)
  const central = await prisma.ubicacion.upsert({
    where: { nombre: 'Bodega Central' },
    update: {},
    create: {
      nombre: 'Bodega Central',
      tipo: TipoUbicacion.CENTRAL,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'Zona Industrial Cúcuta',
      prioridadDespacho: 40,
      despachaWeb: true,
      baseCajaCop: 0,
    },
  });

  await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Centro' },
    update: {},
    create: {
      nombre: 'Punto Centro',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'Av. 5 # 10-20 Centro Cúcuta',
      prioridadDespacho: 10,
      despachaWeb: true,
      baseCajaCop: 200000,
    },
  });

  await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Ocaña' },
    update: {},
    create: {
      nombre: 'Punto Ocaña',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: ocana.codigoDane,
      direccion: 'Calle Principal Ocaña',
      prioridadDespacho: 20,
      despachaWeb: true,
      baseCajaCop: 200000,
    },
  });

  await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Bucaramanga' },
    update: {},
    create: {
      nombre: 'Punto Bucaramanga',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: bucaramanga.codigoDane,
      direccion: 'Carrera 33 Bucaramanga',
      prioridadDespacho: 30,
      despachaWeb: true,
      baseCajaCop: 200000,
    },
  });

  // 5. Usuario Administrador Inicial
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin2026*', salt);

  await prisma.usuario.upsert({
    where: { correo: 'admin@forma.com' },
    update: {},
    create: {
      nombreCompleto: 'Administrador General',
      correo: 'admin@forma.com',
      passwordHash,
      rol: RolUsuario.ADMIN,
      ubicacionId: central.id,
      activo: true,
    },
  });

  // 6. Catálogo de Mercancía Estándar (RN-CAT-01 a RN-CAT-04, RF-CAT-01 a 03)
  console.log('📦 Sembrando categorías y catálogo estándar por SKU...');

  // RN-CAT-01 y RN-CAT-02: Las 4 categorías base (Cosméticos con esCosmeticoUsoPersonal = true)
  const categoriasBase = [
    { nombre: 'Ropa', esCosmeticoUsoPersonal: false },
    { nombre: 'Accesorios', esCosmeticoUsoPersonal: false },
    { nombre: 'Cosméticos', esCosmeticoUsoPersonal: true },
    { nombre: 'Artesanías', esCosmeticoUsoPersonal: false },
  ];

  const mapaCategorias = new Map<string, number>();

  for (const cat of categoriasBase) {
    const registro = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: { esCosmeticoUsoPersonal: cat.esCosmeticoUsoPersonal, activa: true },
      create: {
        nombre: cat.nombre,
        esCosmeticoUsoPersonal: cat.esCosmeticoUsoPersonal,
        activa: true,
      },
    });
    mapaCategorias.set(cat.nombre, registro.id);
  }

  // Productos de prueba y variantes estándar con SKUs únicos y precios enteros COP
  const catalogoSemilla = [
    // 1. Ropa (RN-CAT-01: Tallas S, M, L y Color)
    {
      categoriaNombre: 'Ropa',
      nombre: 'Camiseta Básica de Algodón',
      slug: 'camiseta-basica-algodon',
      descripcion: 'Camiseta clásica unisex 100% algodón de tacto suave para uso diario.',
      reintegrableEnDevolucion: true,
      imagenesUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518'],
      variantes: [
        { sku: 'ROP-CAM-NEG-S', talla: 'S', color: 'Negro', precioVentaCop: 45000, codigoBarras: '7701234567801' },
        { sku: 'ROP-CAM-NEG-M', talla: 'M', color: 'Negro', precioVentaCop: 45000, codigoBarras: '7701234567802' },
        { sku: 'ROP-CAM-NEG-L', talla: 'L', color: 'Negro', precioVentaCop: 45000, codigoBarras: '7701234567803' },
        { sku: 'ROP-CAM-BLA-M', talla: 'M', color: 'Blanco', precioVentaCop: 45000, codigoBarras: '7701234567804' },
      ],
    },
    // 2. Accesorios (RN-CAT-01: Gorras / Talla única)
    {
      categoriaNombre: 'Accesorios',
      nombre: 'Gorra Urbana Snapback',
      slug: 'gorra-urbana-snapback',
      descripcion: 'Gorra deportiva estructurada con visera plana y broche ajustable posterior.',
      reintegrableEnDevolucion: true,
      imagenesUrls: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b'],
      variantes: [
        { sku: 'ACC-GOR-NEG-U', talla: 'Única', color: 'Negro', precioVentaCop: 38000, codigoBarras: '7701234567805' },
        { sku: 'ACC-GOR-AZU-U', talla: 'Única', color: 'Azul', precioVentaCop: 38000, codigoBarras: '7701234567806' },
      ],
    },
    // 3. Cosméticos (RN-CAT-02: reintegrableEnDevolucion = false obligatorio)
    {
      categoriaNombre: 'Cosméticos',
      nombre: 'Sérum Facial Vitamina C',
      slug: 'serum-facial-vitamina-c',
      descripcion: 'Tratamiento facial antioxidante e iluminador enriquecido con ácido hialurónico 30ml.',
      reintegrableEnDevolucion: false, // RN-CAT-02: no reintegrable
      imagenesUrls: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be'],
      variantes: [
        { sku: 'COS-SER-30ML', talla: '30ml', color: 'Neutro', precioVentaCop: 65000, codigoBarras: '7701234567807' },
      ],
    },
    {
      categoriaNombre: 'Cosméticos',
      nombre: 'Labial Cremoso Larga Duración',
      slug: 'labial-cremoso-larga-duracion',
      descripcion: 'Labial con acabado satinado hidratante con vitamina E.',
      reintegrableEnDevolucion: false, // RN-CAT-02: no reintegrable
      imagenesUrls: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa'],
      variantes: [
        { sku: 'COS-LAB-ROJ-U', talla: 'Única', color: 'Rojo Carmín', precioVentaCop: 28000, codigoBarras: '7701234567808' },
        { sku: 'COS-LAB-ROS-U', talla: 'Única', color: 'Rosa Palo', precioVentaCop: 28000, codigoBarras: '7701234567809' },
      ],
    },
    // 4. Artesanías (RN-CAT-01: Piezas terminadas)
    {
      categoriaNombre: 'Artesanías',
      nombre: 'Mochila Wayuu Tradicional',
      slug: 'mochila-wayuu-tradicional',
      descripcion: 'Mochila artesanal colombiana tejida a mano con diseño geométrico.',
      reintegrableEnDevolucion: true,
      imagenesUrls: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7'],
      variantes: [
        { sku: 'ART-MOC-GEO-M', talla: 'Mediana', color: 'Multicolor', precioVentaCop: 140000, codigoBarras: '7701234567810' },
      ],
    },
  ];

  // Inserción idempotente de Productos y Variantes
  for (const prodData of catalogoSemilla) {
    const categoriaId = mapaCategorias.get(prodData.categoriaNombre);
    if (!categoriaId) continue;

    const producto = await prisma.producto.upsert({
      where: { slug: prodData.slug },
      update: {
        nombre: prodData.nombre,
        descripcion: prodData.descripcion,
        categoriaId,
        reintegrableEnDevolucion: prodData.reintegrableEnDevolucion,
        imagenesUrls: prodData.imagenesUrls,
        activo: true,
      },
      create: {
        nombre: prodData.nombre,
        slug: prodData.slug,
        descripcion: prodData.descripcion,
        categoriaId,
        reintegrableEnDevolucion: prodData.reintegrableEnDevolucion,
        imagenesUrls: prodData.imagenesUrls,
        activo: true,
      },
    });

    for (const v of prodData.variantes) {
      await prisma.variante.upsert({
        where: { sku: v.sku },
        update: {
          talla: v.talla,
          color: v.color,
          precioVentaCop: v.precioVentaCop,
          codigoBarras: v.codigoBarras,
          activa: true,
        },
        create: {
          productoId: producto.id,
          sku: v.sku,
          talla: v.talla,
          color: v.color,
          precioVentaCop: v.precioVentaCop,
          codigoBarras: v.codigoBarras,
          activa: true,
          tieneMovimientos: false,
        },
      });
    }
  }

  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });