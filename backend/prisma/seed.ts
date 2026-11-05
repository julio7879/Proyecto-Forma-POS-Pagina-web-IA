import { PrismaClient, RolUsuario, TipoUbicacion } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATALOGO_30_PRODUCTOS } from './seeds/seed-30-productos-multisede.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed oficial de parámetros y datos iniciales para Sandbox...');

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

  // 4. Ubicaciones Oficiales: Bodega Central + 4 Puntos de Venta
  console.log('📍 Sembrando Bodega Central y 4 Puntos de Venta físicos...');
  const central = await prisma.ubicacion.upsert({
    where: { nombre: 'Bodega Central' },
    update: {},
    create: {
      nombre: 'Bodega Central',
      tipo: TipoUbicacion.CENTRAL,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'Zona Industrial Cúcuta, Bodega 4',
      prioridadDespacho: 40,
      despachaWeb: true,
      baseCajaCop: 0,
    },
  });

  const puntoCentro = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Centro' },
    update: {},
    create: {
      nombre: 'Punto Centro',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'Av. 5 # 10-20 Centro, Cúcuta',
      prioridadDespacho: 10,
      despachaWeb: true,
      baseCajaCop: 200000,
    },
  });

  const puntoCaobos = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Caobos / Ventura Plaza' },
    update: {},
    create: {
      nombre: 'Punto Caobos / Ventura Plaza',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'Calle 11 # 1E-45 Los Caobos, Cúcuta',
      prioridadDespacho: 15,
      despachaWeb: true,
      baseCajaCop: 200000,
    },
  });

  const puntoOcana = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Ocaña' },
    update: {},
    create: {
      nombre: 'Punto Ocaña',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: ocana.codigoDane,
      direccion: 'Calle Principal # 12-34, Ocaña',
      prioridadDespacho: 20,
      despachaWeb: true,
      baseCajaCop: 200000,
    },
  });

  const puntoBucaramanga = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Bucaramanga' },
    update: {},
    create: {
      nombre: 'Punto Bucaramanga',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: bucaramanga.codigoDane,
      direccion: 'Carrera 33 # 48-15 Cabecera, Bucaramanga',
      prioridadDespacho: 30,
      despachaWeb: true,
      baseCajaCop: 200000,
    },
  });

  const todasLasUbicaciones = [central, puntoCentro, puntoCaobos, puntoOcana, puntoBucaramanga];

  // 5. Usuarios Oficiales: 1 Administrador + 4 Vendedores (uno por cada sede)
  console.log('👤 Sembrando 1 Administrador General y 4 Vendedores con sedes asignadas...');
  const salt = await bcrypt.genSalt(10);
  const passwordHashAdmin = await bcrypt.hash('Admin2026*', salt);
  const passwordHashVendedor = await bcrypt.hash('Vendedor2026*', salt);

  // Administrador General
  await prisma.usuario.upsert({
    where: { correo: 'admin@forma.com' },
    update: {},
    create: {
      nombreCompleto: 'Administrador General',
      correo: 'admin@forma.com',
      passwordHash: passwordHashAdmin,
      rol: RolUsuario.ADMIN,
      ubicacion: { connect: { id: central.id } },
      activo: true,
      permVender: true,
      permCaja: true,
      permDescuentoManual: true,
      permAnularVentas: true,
      permDevoluciones: true,
      permVerInventario: true,
      permSolicitarTraslado: true,
      permRecibirTraslado: true,
      permVerOtrosPuntos: true,
      permPedidosWeb: true,
      permVerVentasPunto: true,
    },
  });

  // Vendedor 1 - Punto Centro
  await prisma.usuario.upsert({
    where: { correo: 'vendedor.centro@forma.com' },
    update: {},
    create: {
      nombreCompleto: 'Camilo Vendedor Centro',
      correo: 'vendedor.centro@forma.com',
      passwordHash: passwordHashVendedor,
      rol: RolUsuario.VENDEDOR,
      ubicacion: { connect: { id: puntoCentro.id } },
      activo: true,
      permVender: true,
      permCaja: true,
      permDescuentoManual: true,
      permAnularVentas: false,
      permDevoluciones: true,
      permVerInventario: true,
      permSolicitarTraslado: true,
      permRecibirTraslado: true,
      permVerOtrosPuntos: true,
      permPedidosWeb: true,
      permVerVentasPunto: true,
    },
  });

  // Vendedor 2 - Punto Caobos
  await prisma.usuario.upsert({
    where: { correo: 'vendedor.caobos@forma.com' },
    update: {},
    create: {
      nombreCompleto: 'Valeria Vendedora Caobos',
      correo: 'vendedor.caobos@forma.com',
      passwordHash: passwordHashVendedor,
      rol: RolUsuario.VENDEDOR,
      ubicacion: { connect: { id: puntoCaobos.id } },
      activo: true,
      permVender: true,
      permCaja: true,
      permDescuentoManual: true,
      permAnularVentas: false,
      permDevoluciones: true,
      permVerInventario: true,
      permSolicitarTraslado: true,
      permRecibirTraslado: true,
      permVerOtrosPuntos: true,
      permPedidosWeb: true,
      permVerVentasPunto: true,
    },
  });

  // Vendedor 3 - Punto Ocaña
  await prisma.usuario.upsert({
    where: { correo: 'vendedor.ocana@forma.com' },
    update: {},
    create: {
      nombreCompleto: 'Mateo Vendedor Ocaña',
      correo: 'vendedor.ocana@forma.com',
      passwordHash: passwordHashVendedor,
      rol: RolUsuario.VENDEDOR,
      ubicacion: { connect: { id: puntoOcana.id } },
      activo: true,
      permVender: true,
      permCaja: true,
      permDescuentoManual: true,
      permAnularVentas: false,
      permDevoluciones: true,
      permVerInventario: true,
      permSolicitarTraslado: true,
      permRecibirTraslado: true,
      permVerOtrosPuntos: true,
      permPedidosWeb: true,
      permVerVentasPunto: true,
    },
  });

  // Vendedor 4 - Punto Bucaramanga
  await prisma.usuario.upsert({
    where: { correo: 'vendedor.bucaramanga@forma.com' },
    update: {},
    create: {
      nombreCompleto: 'Daniela Vendedora Bucaramanga',
      correo: 'vendedor.bucaramanga@forma.com',
      passwordHash: passwordHashVendedor,
      rol: RolUsuario.VENDEDOR,
      ubicacion: { connect: { id: puntoBucaramanga.id } },
      activo: true,
      permVender: true,
      permCaja: true,
      permDescuentoManual: true,
      permAnularVentas: false,
      permDevoluciones: true,
      permVerInventario: true,
      permSolicitarTraslado: true,
      permRecibirTraslado: true,
      permVerOtrosPuntos: true,
      permPedidosWeb: true,
      permVerVentasPunto: true,
    },
  });

  // 6. Categorías Oficiales
  console.log('🏷️ Sembrando categorías base...');
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

  // 7. Catálogo Oficial de 30 Productos de Alta Costura
  console.log(`📦 Sembrando ${CATALOGO_30_PRODUCTOS.length} productos oficiales con variantes y distribución multisede...`);

  const saldosParaInsertar: Array<{
    varianteId: number;
    ubicacionId: number;
    fisico: number;
    reservadoBlando: number;
    reservadoDuro: number;
    noVendible: number;
  }> = [];

  const slugsOficiales = CATALOGO_30_PRODUCTOS.map((p) => p.slug);

  // Desactivar cualquier producto residual que no pertenezca a los 30 oficiales
  await prisma.producto.updateMany({
    where: { slug: { notIn: slugsOficiales } },
    data: { activo: false },
  });
  const prodsResiduales = await prisma.producto.findMany({
    where: { slug: { notIn: slugsOficiales } },
    select: { id: true },
  });
  if (prodsResiduales.length > 0) {
    await prisma.variante.updateMany({
      where: { productoId: { in: prodsResiduales.map((p) => p.id) } },
      data: { activa: false },
    });
  }

  for (const prodData of CATALOGO_30_PRODUCTOS) {
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
      const variante = await prisma.variante.upsert({
        where: { sku: v.sku },
        update: {
          talla: v.talla,
          color: v.color,
          precioVentaCop: v.precioVentaCop,
          activa: true,
        },
        create: {
          productoId: producto.id,
          sku: v.sku,
          talla: v.talla,
          color: v.color,
          precioVentaCop: v.precioVentaCop,
          activa: true,
          tieneMovimientos: false,
        },
      });

      // 8. SaldoStock Inicial en Bodega Central (stockCentral o 40) y en Puntos de Venta (stockPunto o 15)
      for (const ubi of todasLasUbicaciones) {
        const stockInicial =
          ubi.tipo === TipoUbicacion.CENTRAL
            ? ('stockCentral' in v ? (v as any).stockCentral : 40)
            : ('stockPunto' in v ? (v as any).stockPunto : 15);

        saldosParaInsertar.push({
          varianteId: variante.id,
          ubicacionId: ubi.id,
          fisico: stockInicial,
          reservadoBlando: 0,
          reservadoDuro: 0,
          noVendible: 0,
        });
      }
    }
  }

  console.log(`📊 Insertando/verificando ${saldosParaInsertar.length} registros de SaldoStock en lote...`);
  await prisma.saldoStock.createMany({
    data: saldosParaInsertar,
    skipDuplicates: true,
  });

  console.log('✅ Seed oficial completado exitosamente.');
  console.log('📍 5 Sedes configuradas (1 Central + 4 Puntos de Venta).');
  console.log('👤 5 Usuarios oficiales (1 Admin + 4 Vendedores).');
  console.log(`👗 ${CATALOGO_30_PRODUCTOS.length} Productos oficiales activos con stock multisede listo.`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
