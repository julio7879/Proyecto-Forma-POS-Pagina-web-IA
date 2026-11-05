import { PrismaClient, RolUsuario, TipoUbicacion, TipoDescuento, AlcancePromocion, CanalVenta } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando reinicio de base de datos para MVP REAL (Sin suposiciones)...');

  // 1. Limpiar transacciones y estados de prueba previos
  console.log('🧹 Limpiando ventas, pedidos, traslados, sesiones de caja y kardex...');
  await prisma.lineaDevolucionPOS.deleteMany({});
  await prisma.devolucionPOS.deleteMany({});
  await prisma.pagoVentaPOS.deleteMany({});
  await prisma.lineaVentaPOS.deleteMany({});
  await prisma.ventaPOS.deleteMany({});

  await prisma.resolucionNovedadTraslado.deleteMany({});
  await prisma.lineaTraslado.deleteMany({});
  await prisma.traslado.deleteMany({});

  await prisma.lineaCompra.deleteMany({});
  await prisma.compraProveedor.deleteMany({});

  await prisma.historialEstadoPedidoWeb.deleteMany({});
  await prisma.devolucionComercialWeb.deleteMany({});
  await prisma.lineaPedidoWeb.deleteMany({});
  await prisma.pedidoWeb.deleteMany({});

  await prisma.movimientoCaja.deleteMany({});
  await prisma.relevoTurnoCaja.deleteMany({});
  await prisma.sesionCaja.deleteMany({});

  await prisma.movimientoInventario.deleteMany({});
  await prisma.saldoStock.deleteMany({});
  await prisma.consecutivoUbicacion.deleteMany({});
  await prisma.registroIdempotencia.deleteMany({});
  await prisma.registroAuditoria.deleteMany({});

  // 2. Ubicaciones Oficiales
  console.log('📍 Verificando y configurando las 5 Sedes Oficiales...');
  const cucuta = await prisma.municipioDane.upsert({
    where: { codigoDane: '54001' },
    update: { atendidoWeb: true },
    create: {
      codigoDane: '54001',
      nombre: 'Cúcuta',
      departamentoId: '54',
      atendidoWeb: true,
    },
  });

  const ocana = await prisma.municipioDane.upsert({
    where: { codigoDane: '54498' },
    update: { atendidoWeb: true },
    create: {
      codigoDane: '54498',
      nombre: 'Ocaña',
      departamentoId: '54',
      atendidoWeb: true,
    },
  });

  const bucaramanga = await prisma.municipioDane.upsert({
    where: { codigoDane: '68001' },
    update: { atendidoWeb: true },
    create: {
      codigoDane: '68001',
      nombre: 'Bucaramanga',
      departamentoId: '68',
      atendidoWeb: true,
    },
  });

  // Bodega Central: despachaWeb = true (solo Central despacha web según decisión A1)
  const central = await prisma.ubicacion.upsert({
    where: { nombre: 'Bodega Central' },
    update: {
      tipo: TipoUbicacion.CENTRAL,
      activa: true,
      despachaWeb: true,
      prioridadDespacho: 10,
      baseCajaCop: 0,
    },
    create: {
      nombre: 'Bodega Central',
      tipo: TipoUbicacion.CENTRAL,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'Zona Industrial Cúcuta, Bodega 4',
      prioridadDespacho: 10,
      despachaWeb: true,
      baseCajaCop: 0,
    },
  });

  // 4 Puntos de Venta Físicos: despachaWeb = false (venta exclusiva en mostrador)
  const puntoCentro = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Centro' },
    update: {
      tipo: TipoUbicacion.PUNTO_VENTA,
      activa: true,
      despachaWeb: false,
      prioridadDespacho: 20,
      baseCajaCop: 200000,
    },
    create: {
      nombre: 'Punto Centro',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'Av. 5 # 10-20 Centro, Cúcuta',
      prioridadDespacho: 20,
      despachaWeb: false,
      baseCajaCop: 200000,
    },
  });

  const puntoCaobos = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Caobos / Ventura Plaza' },
    update: {
      tipo: TipoUbicacion.PUNTO_VENTA,
      activa: true,
      despachaWeb: false,
      prioridadDespacho: 30,
      baseCajaCop: 200000,
    },
    create: {
      nombre: 'Punto Caobos / Ventura Plaza',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: cucuta.codigoDane,
      direccion: 'C.C. Ventura Plaza, Local 214, Caobos, Cúcuta',
      prioridadDespacho: 30,
      despachaWeb: false,
      baseCajaCop: 200000,
    },
  });

  const puntoOcana = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Ocaña' },
    update: {
      tipo: TipoUbicacion.PUNTO_VENTA,
      activa: true,
      despachaWeb: false,
      prioridadDespacho: 40,
      baseCajaCop: 200000,
    },
    create: {
      nombre: 'Punto Ocaña',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: ocana.codigoDane,
      direccion: 'Cra. 11 # 10-45 Plaza Parque, Ocaña',
      prioridadDespacho: 40,
      despachaWeb: false,
      baseCajaCop: 200000,
    },
  });

  const puntoBucaramanga = await prisma.ubicacion.upsert({
    where: { nombre: 'Punto Bucaramanga' },
    update: {
      tipo: TipoUbicacion.PUNTO_VENTA,
      activa: true,
      despachaWeb: false,
      prioridadDespacho: 50,
      baseCajaCop: 200000,
    },
    create: {
      nombre: 'Punto Bucaramanga',
      tipo: TipoUbicacion.PUNTO_VENTA,
      municipioDaneId: bucaramanga.codigoDane,
      direccion: 'Cra. 35 # 48-12 Cabecera del Llano, Bucaramanga',
      prioridadDespacho: 50,
      despachaWeb: false,
      baseCajaCop: 200000,
    },
  });

  const todasLasSedes = [central, puntoCentro, puntoCaobos, puntoOcana, puntoBucaramanga];

  // Desactivar cualquier otra sede residual
  await prisma.ubicacion.updateMany({
    where: {
      id: { notIn: todasLasSedes.map((s) => s.id) },
    },
    data: { activa: false, despachaWeb: false },
  });

  // 3. Usuarios Oficiales (1 Admin + 4 Vendedores)
  console.log('👤 Configurando las 5 Cuentas Oficiales...');
  const salt = await bcrypt.genSalt(10);
  const hashAdmin = await bcrypt.hash('Admin2026*', salt);
  const hashVendedor = await bcrypt.hash('Vendedor2026*', salt);

  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@forma.com' },
    update: {
      rol: RolUsuario.ADMIN,
      ubicacionId: central.id,
      activo: true,
      passwordHash: hashAdmin,
    },
    create: {
      nombreCompleto: 'Administrador General FORMA',
      correo: 'admin@forma.com',
      passwordHash: hashAdmin,
      rol: RolUsuario.ADMIN,
      ubicacionId: central.id,
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

  const vendedoresData = [
    { correo: 'vendedor.centro@forma.com', nombre: 'Camilo Mendoza', ubicacionId: puntoCentro.id },
    { correo: 'vendedor.caobos@forma.com', nombre: 'Valeria Restrepo', ubicacionId: puntoCaobos.id },
    { correo: 'vendedor.ocana@forma.com', nombre: 'Mateo Ortiz', ubicacionId: puntoOcana.id },
    { correo: 'vendedor.bucaramanga@forma.com', nombre: 'Daniela Gómez', ubicacionId: puntoBucaramanga.id },
  ];

  for (const v of vendedoresData) {
    await prisma.usuario.upsert({
      where: { correo: v.correo },
      update: {
        nombreCompleto: v.nombre,
        rol: RolUsuario.VENDEDOR,
        ubicacionId: v.ubicacionId,
        activo: true,
        passwordHash: hashVendedor,
        permVender: true,
        permCaja: true,
        permDescuentoManual: true,
        topeDescuentoPorc: 15,
        permVerInventario: true,
        permSolicitarTraslado: true,
        permRecibirTraslado: true,
        permVerVentasPunto: true,
      },
      create: {
        nombreCompleto: v.nombre,
        correo: v.correo,
        passwordHash: hashVendedor,
        rol: RolUsuario.VENDEDOR,
        ubicacionId: v.ubicacionId,
        activo: true,
        permVender: true,
        permCaja: true,
        permDescuentoManual: true,
        topeDescuentoPorc: 15,
        permVerInventario: true,
        permSolicitarTraslado: true,
        permRecibirTraslado: true,
        permVerVentasPunto: true,
      },
    });
  }

  // Desactivar cualquier otro usuario ADMIN o VENDEDOR residual
  await prisma.usuario.updateMany({
    where: {
      correo: { notIn: ['admin@forma.com', ...vendedoresData.map((v) => v.correo)] },
      rol: { in: [RolUsuario.ADMIN, RolUsuario.VENDEDOR] },
    },
    data: { activo: false },
  });

  // 4. Categorías Oficiales
  console.log('🏷️ Sembrando Categorías...');
  const catRopa = await prisma.categoria.upsert({
    where: { nombre: 'Ropa' },
    update: { activa: true, esCosmeticoUsoPersonal: false },
    create: { nombre: 'Ropa', activa: true, esCosmeticoUsoPersonal: false },
  });

  const catCosmeticos = await prisma.categoria.upsert({
    where: { nombre: 'Cosméticos' },
    update: { activa: true, esCosmeticoUsoPersonal: true },
    create: { nombre: 'Cosméticos', activa: true, esCosmeticoUsoPersonal: true },
  });

  const catArtesanias = await prisma.categoria.upsert({
    where: { nombre: 'Artesanías' },
    update: { activa: true, esCosmeticoUsoPersonal: false },
    create: { nombre: 'Artesanías', activa: true, esCosmeticoUsoPersonal: false },
  });

  const catCalzado = await prisma.categoria.upsert({
    where: { nombre: 'Calzado' },
    update: { activa: true, esCosmeticoUsoPersonal: false },
    create: { nombre: 'Calzado', activa: true, esCosmeticoUsoPersonal: false },
  });

  // 5. Catálogo Maestro con Diferentes Tallas y Colores
  console.log('👗 Sembrando Productos y Variantes de Alta Costura...');
  const catalogo = [
    {
      nombre: 'Blazer Sastrería Imperial Vinotinto',
      slug: 'blazer-imperial-vinotinto',
      descripcion: 'Blazer cruzado de lana fría y botones dorados hecho a mano por artesanos colombianos.',
      categoriaId: catRopa.id,
      imagenesUrls: ['/products/blazer-imperial-vinotinto.png'],
      reintegrableEnDevolucion: true,
      variantes: [
        { sku: 'ROP-BLZ-VIN-S', talla: 'S', color: 'Vinotinto', precioVentaCop: 320000, stockCentral: 40 },
        { sku: 'ROP-BLZ-VIN-M', talla: 'M', color: 'Vinotinto', precioVentaCop: 320000, stockCentral: 50 },
        { sku: 'ROP-BLZ-VIN-L', talla: 'L', color: 'Vinotinto', precioVentaCop: 320000, stockCentral: 35 },
      ],
    },
    {
      nombre: 'Pantalón Lino Sartorial Arena',
      slug: 'pantalon-lino-arena',
      descripcion: 'Pantalón de tiro alto confeccionado en lino 100% orgánico de corte sartorial clásico.',
      categoriaId: catRopa.id,
      imagenesUrls: ['/products/pantalon-lino-arena.png'],
      reintegrableEnDevolucion: true,
      variantes: [
        { sku: 'ROP-PAN-ARE-30', talla: '30', color: 'Arena', precioVentaCop: 195000, stockCentral: 45 },
        { sku: 'ROP-PAN-ARE-32', talla: '32', color: 'Arena', precioVentaCop: 195000, stockCentral: 60 },
        { sku: 'ROP-PAN-ARE-34', talla: '34', color: 'Arena', precioVentaCop: 195000, stockCentral: 40 },
      ],
    },
    {
      nombre: 'Camisa Lino Cuello Nerú Blanco',
      slug: 'camisa-lino-neru-blanco',
      descripcion: 'Camisa fresca de lino natural con cuello mao/nerú y botones en madera de guayacán.',
      categoriaId: catRopa.id,
      imagenesUrls: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'],
      reintegrableEnDevolucion: true,
      variantes: [
        { sku: 'ROP-CAM-BLA-S', talla: 'S', color: 'Blanco Puro', precioVentaCop: 145000, stockCentral: 50 },
        { sku: 'ROP-CAM-BLA-M', talla: 'M', color: 'Blanco Puro', precioVentaCop: 145000, stockCentral: 70 },
        { sku: 'ROP-CAM-BLA-L', talla: 'L', color: 'Blanco Puro', precioVentaCop: 145000, stockCentral: 55 },
        { sku: 'ROP-CAM-BLA-XL', talla: 'XL', color: 'Blanco Puro', precioVentaCop: 145000, stockCentral: 30 },
      ],
    },
    {
      nombre: 'Vestido Seda Santuario Esmeralda',
      slug: 'vestido-seda-santuario',
      descripcion: 'Vestido largo en seda jacquard verde esmeralda con caída fluida y escote espalda drapeado.',
      categoriaId: catRopa.id,
      imagenesUrls: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80'],
      reintegrableEnDevolucion: true,
      variantes: [
        { sku: 'ROP-VES-ESM-S', talla: 'S', color: 'Verde Esmeralda', precioVentaCop: 285000, stockCentral: 30 },
        { sku: 'ROP-VES-ESM-M', talla: 'M', color: 'Verde Esmeralda', precioVentaCop: 285000, stockCentral: 40 },
        { sku: 'ROP-VES-ESM-L', talla: 'L', color: 'Verde Esmeralda', precioVentaCop: 285000, stockCentral: 25 },
      ],
    },
    {
      nombre: 'Sérum Facial Botánico Oro 24K 50ml',
      slug: 'serum-botanico-oro-24k',
      descripcion: 'Fórmula rejuvenecedora con micropartículas de oro y extractos de flora andina. Cosmético de uso personal.',
      categoriaId: catCosmeticos.id,
      imagenesUrls: ['/products/serum-botanico-oro.png'],
      reintegrableEnDevolucion: false, // RN-CAT-02: No reintegrable por higiene
      variantes: [
        { sku: 'COS-SER-ORO-50ML', talla: '50ml', color: 'Ámbar Dorado', precioVentaCop: 89000, stockCentral: 80 },
      ],
    },
    {
      nombre: 'Crema Hidratante Botánica 100ml',
      slug: 'crema-hidratante-botanica',
      descripcion: 'Emulsión nutritiva a base de caléndula y manteca de cacao silvestre. Cuidado facial diario.',
      categoriaId: catCosmeticos.id,
      imagenesUrls: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80'],
      reintegrableEnDevolucion: false, // RN-CAT-02
      variantes: [
        { sku: 'COS-CRM-BOT-100ML', talla: '100ml', color: 'Blanco Crema', precioVentaCop: 65000, stockCentral: 90 },
      ],
    },
    {
      nombre: 'Sombrero Aguadeño Tejido Fino',
      slug: 'sombrero-aguadeno-fino',
      descripcion: 'Auténtico sombrero tejido a mano en palma de iraca por maestras artesanas de Aguadas.',
      categoriaId: catArtesanias.id,
      imagenesUrls: ['/products/sombrero-aguadeno-fino.png'],
      reintegrableEnDevolucion: true,
      variantes: [
        { sku: 'ART-SOM-AGU-M', talla: 'M', color: 'Marfil / Cinta Vinotinto', precioVentaCop: 165000, stockCentral: 35 },
        { sku: 'ART-SOM-AGU-L', talla: 'L', color: 'Marfil / Cinta Vinotinto', precioVentaCop: 165000, stockCentral: 40 },
      ],
    },
    {
      nombre: 'Ruana Lana Virgen Artesanal',
      slug: 'ruana-lana-virgen',
      descripcion: 'Ruana tradicional en pura lana virgen de oveja sin teñir, térmica, resistente e impermeable.',
      categoriaId: catArtesanias.id,
      imagenesUrls: ['https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80'],
      reintegrableEnDevolucion: true,
      variantes: [
        { sku: 'ART-RUA-LAN-U', talla: 'Única', color: 'Gris Natural', precioVentaCop: 220000, stockCentral: 50 },
      ],
    },
  ];

  let totalVariantes = 0;
  let totalStockCentral = 0;

  for (const item of catalogo) {
    console.log(`  -> Procesando producto: ${item.nombre}`);
    const prod = await prisma.producto.upsert({
      where: { slug: item.slug },
      update: {
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoriaId: item.categoriaId,
        imagenesUrls: item.imagenesUrls,
        reintegrableEnDevolucion: item.reintegrableEnDevolucion,
        activo: true,
      },
      create: {
        nombre: item.nombre,
        slug: item.slug,
        descripcion: item.descripcion,
        categoriaId: item.categoriaId,
        imagenesUrls: item.imagenesUrls,
        reintegrableEnDevolucion: item.reintegrableEnDevolucion,
        activo: true,
      },
    });

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

      // Stock SOLO en Bodega Central; Puntos de Venta Físicos en 0
      for (const sede of todasLasSedes) {
        const cantFisica = sede.tipo === TipoUbicacion.CENTRAL ? v.stockCentral : 0;

        await prisma.saldoStock.upsert({
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

        if (sede.tipo === TipoUbicacion.CENTRAL) {
          totalStockCentral += cantFisica;

          // Registrar en Kardex
          await prisma.movimientoInventario.create({
            data: {
              tipo: 'CARGA_INICIAL',
              ubicacionId: central.id,
              varianteId: variante.id,
              cantidadConSigno: cantFisica,
              afectaSaldo: 'FISICO',
              saldoResultante: cantFisica,
              documentoTipo: 'AJUSTE',
              documentoId: 0,
              usuarioId: admin.id,
              motivo: `Carga inicial de producción en Bodega Central: ${prod.nombre} (${v.talla}/${v.color})`,
            },
          });
        }
      }
    }
  }

  // 6. Promociones Oficiales
  console.log('🎟️ Sembrando Promociones Oficiales...');
  const ahora = new Date();
  const unAnoDespues = new Date(ahora.getTime() + 365 * 24 * 60 * 60 * 1000);

  await prisma.promocion.upsert({
    where: { codigo: 'BIENVENIDA10' },
    update: { activa: true, valor: 10, tipo: TipoDescuento.PORCENTAJE },
    create: {
      codigo: 'BIENVENIDA10',
      nombre: 'Descuento de Bienvenida 10%',
      tipo: TipoDescuento.PORCENTAJE,
      valor: 10,
      alcance: AlcancePromocion.TODA_LA_COMPRA,
      canalPermitido: CanalVenta.AMBOS,
      minimoCompraCop: 0,
      fechaInicio: ahora,
      fechaFin: unAnoDespues,
      activa: true,
    },
  });

  await prisma.promocion.upsert({
    where: { codigo: 'FORMA20K' },
    update: { activa: true, valor: 20000, tipo: TipoDescuento.VALOR_FIJO, minimoCompraCop: 100000 },
    create: {
      codigo: 'FORMA20K',
      nombre: 'Bono $20.000 COP por compras superiores a $100.000',
      tipo: TipoDescuento.VALOR_FIJO,
      valor: 20000,
      alcance: AlcancePromocion.TODA_LA_COMPRA,
      canalPermitido: CanalVenta.AMBOS,
      minimoCompraCop: 100000,
      fechaInicio: ahora,
      fechaFin: unAnoDespues,
      activa: true,
    },
  });

  console.log('====================================================');
  console.log('✅ REINICIO Y ALIMENTACIÓN EXITOSA:');
  console.log(`- Sedes configuradas: ${todasLasSedes.length} (Central despacha web; 4 Puntos Físicos)`);
  console.log(`- Usuarios: 1 ADMIN (admin@forma.com) + 4 VENDEDORES`);
  console.log(`- Productos: ${catalogo.length} productos con ${totalVariantes} variantes`);
  console.log(`- Stock en Bodega Central: ${totalStockCentral} unidades físicas`);
  console.log(`- Stock en Puntos de Venta: 0 unidades (listo para recibir traslados)`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error en el reinicio:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
