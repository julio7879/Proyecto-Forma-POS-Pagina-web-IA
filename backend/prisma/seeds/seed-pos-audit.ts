import { PrismaClient, RolUsuario, TipoUbicacion } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuración y auditoría de base de datos...');

  // 1. Saneamiento de Ubicaciones: Desactivar sedes residuales de QA
  await prisma.ubicacion.updateMany({
    where: {
      nombre: { startsWith: 'QA-' },
    },
    data: {
      activa: false,
      despachaWeb: false,
    },
  });

  const ubicaciones = await prisma.ubicacion.findMany({
    where: { activa: true },
    orderBy: { id: 'asc' },
  });
  console.log('📍 Ubicaciones oficiales activas:', ubicaciones.map((u) => `${u.id}: ${u.nombre}`));

  // 2. Saneamiento estricto de usuarios internos: 1 ADMIN + 4 VENDEDORES
  await prisma.usuario.updateMany({
    where: {
      rol: { in: [RolUsuario.ADMIN, RolUsuario.VENDEDOR] },
      correo: {
        notIn: [
          'admin@forma.com',
          'vendedor.centro@forma.com',
          'vendedor.caobos@forma.com',
          'vendedor.ocana@forma.com',
          'vendedor.bucaramanga@forma.com',
        ],
      },
    },
    data: { activo: false },
  });

  // Asegurar las 5 cuentas activas oficiales
  const cuentasOficiales = await prisma.usuario.findMany({
    where: {
      rol: { in: [RolUsuario.ADMIN, RolUsuario.VENDEDOR] },
      activo: true,
    },
    select: { id: true, correo: true, nombreCompleto: true, rol: true, ubicacionId: true },
  });
  console.log('👥 Cuentas oficiales activas (1 Admin + 4 Vendedores):', cuentasOficiales);

  // 3. Obtener categorías base
  const catRopa = await prisma.categoria.findFirst({ where: { nombre: 'Ropa' } });
  const catCosm = await prisma.categoria.findFirst({ where: { nombre: 'Cosméticos' } });
  const catArte = await prisma.categoria.findFirst({ where: { nombre: 'Artesanías' } });

  if (!catRopa || !catCosm || !catArte) {
    throw new Error('Categorías maestras no encontradas');
  }

  // 4. Sembrar los 4 nuevos productos de alta costura FORMA con sus fotos generadas
  console.log('✨ Sembrando 4 nuevos productos de estudio FORMA...');

  const nuevosProductos = [
    {
      slug: 'blazer-sastreria-imperial-vinotinto',
      nombre: 'Blazer Sastrería Imperial Vinotinto',
      descripcion: 'Blazer cruzado sastre en lana fría vinotinto imperial con botones en oro champán.',
      categoriaId: catRopa.id,
      reintegrableEnDevolucion: true,
      imagenesUrls: ['/products/blazer-imperial-vinotinto.png'],
      variantes: [
        { sku: 'ROP-BLZ-010-S', talla: 'S', color: 'Vinotinto Imperial', precioVentaCop: 320000 },
        { sku: 'ROP-BLZ-010-M', talla: 'M', color: 'Vinotinto Imperial', precioVentaCop: 320000 },
        { sku: 'ROP-BLZ-010-L', talla: 'L', color: 'Vinotinto Imperial', precioVentaCop: 320000 },
      ],
    },
    {
      slug: 'pantalon-lino-sartorial-arena',
      nombre: 'Pantalón Lino Sartorial Arena',
      descripcion: 'Pantalón de tiro alto con pliegues sastre en lino orgánico color arena.',
      categoriaId: catRopa.id,
      reintegrableEnDevolucion: true,
      imagenesUrls: ['/products/pantalon-lino-arena.png'],
      variantes: [
        { sku: 'ROP-PAN-011-30', talla: '30', color: 'Arena Orgánico', precioVentaCop: 195000 },
        { sku: 'ROP-PAN-011-32', talla: '32', color: 'Arena Orgánico', precioVentaCop: 195000 },
        { sku: 'ROP-PAN-011-34', talla: '34', color: 'Arena Orgánico', precioVentaCop: 195000 },
      ],
    },
    {
      slug: 'serum-facial-botanico-oro-24k',
      nombre: 'Sérum Facial Botánico Oro 24K 50ml',
      descripcion: 'Elixir regenerador botánico con micropartículas de oro 24K. Cosmético de uso personal.',
      categoriaId: catCosm.id,
      reintegrableEnDevolucion: false,
      imagenesUrls: ['/products/serum-botanico-oro.png'],
      variantes: [
        { sku: 'COS-SER-013-50ML', talla: '50ml', color: 'Ámbar Dorado', precioVentaCop: 89000 },
      ],
    },
    {
      slug: 'sombrero-aguadeno-tejido-fino',
      nombre: 'Sombrero Aguadeño Tejido Fino',
      descripcion: 'Sombrero artesanal tejido a mano en palma de iraca con cinta de seda vinotinto.',
      categoriaId: catArte.id,
      reintegrableEnDevolucion: true,
      imagenesUrls: ['/products/sombrero-aguadeno-fino.png'],
      variantes: [
        { sku: 'ART-SOM-014-M', talla: 'M', color: 'Marfil / Cinta Vinotinto', precioVentaCop: 165000 },
        { sku: 'ART-SOM-014-L', talla: 'L', color: 'Marfil / Cinta Vinotinto', precioVentaCop: 165000 },
      ],
    },
  ];

  for (const prodData of nuevosProductos) {
    const prod = await prisma.producto.upsert({
      where: { slug: prodData.slug },
      update: {
        nombre: prodData.nombre,
        descripcion: prodData.descripcion,
        categoriaId: prodData.categoriaId,
        reintegrableEnDevolucion: prodData.reintegrableEnDevolucion,
        imagenesUrls: prodData.imagenesUrls,
      },
      create: {
        slug: prodData.slug,
        nombre: prodData.nombre,
        descripcion: prodData.descripcion,
        categoriaId: prodData.categoriaId,
        reintegrableEnDevolucion: prodData.reintegrableEnDevolucion,
        imagenesUrls: prodData.imagenesUrls,
        activo: true,
      },
    });

    for (const vData of prodData.variantes) {
      const variante = await prisma.variante.upsert({
        where: { sku: vData.sku },
        update: {
          precioVentaCop: vData.precioVentaCop,
          talla: vData.talla,
          color: vData.color,
        },
        create: {
          productoId: prod.id,
          sku: vData.sku,
          talla: vData.talla,
          color: vData.color,
          precioVentaCop: vData.precioVentaCop,
          activa: true,
        },
      });

      // Asegurar SaldoStock en todas las ubicaciones activas
      for (const ub of ubicaciones) {
        await prisma.saldoStock.upsert({
          where: {
            ubicacionId_varianteId: {
              ubicacionId: ub.id,
              varianteId: variante.id,
            },
          },
          update: {
            fisico: 12,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
          },
          create: {
            ubicacionId: ub.id,
            varianteId: variante.id,
            fisico: 12,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
          },
        });
      }
    }
  }

  const totalVariantes = await prisma.variante.count();
  const totalStock = await prisma.saldoStock.count();
  console.log(`✅ Base de datos lista: ${totalVariantes} variantes y ${totalStock} registros de stock.`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
