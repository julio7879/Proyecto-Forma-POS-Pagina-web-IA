import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const MASTER_SLUGS = [
  // Ropa (10)
  'blazer-imperial-vinotinto',
  'pantalon-lino-arena',
  'camisa-lino-neru-blanco',
  'chaqueta-puffer-santuario-3d',
  'vestido-seda-esmeralda',
  'camiseta-basica-algodon',
  'cardigan-punto-mohair',
  'falda-plisada-seda',
  'bermuda-lino-oliva',
  'gabardina-clasica-camel',
  // Cosméticos (6)
  'serum-botanico-oro-24k',
  'crema-rosa-mosqueta-100ml',
  'aceite-sacha-inchi-30ml',
  'tonico-hidrolato-azahar',
  'balsamo-labial-candelilla',
  'mascarilla-arcilla-volcanica',
  // Accesorios (6)
  'bolso-tote-cuero-cognac',
  'cinturon-cuero-oro',
  'billetera-piel-caramelo',
  'panoleta-seda-flora-andina',
  'gafas-sol-carey-cuadrada',
  'tarjetero-slim-cuero-negro',
  // Calzado (4)
  'mocasines-cuero-artesanal',
  'botines-chelsea-suede',
  'sandalias-piel-cruzada',
  'oxford-cuero-burdeos',
  // Artesanías (4)
  'sombrero-aguadeno-fino',
  'mochila-wayuu-lujo',
  'ruana-lana-virgen',
  'canasto-werregue-choco',
];

async function main() {
  console.log('🧹 Saneando catálogo: desactivando productos y variantes residuales...');

  // 1. Obtener todos los productos
  const todos = await prisma.producto.findMany({
    select: { id: true, slug: true, nombre: true },
  });

  const residuales = todos.filter((p) => !MASTER_SLUGS.includes(p.slug));
  const oficiales = todos.filter((p) => MASTER_SLUGS.includes(p.slug));

  console.log(`📊 Total en DB: ${todos.length}. Oficiales: ${oficiales.length}. Residuales a desactivar: ${residuales.length}`);

  // 2. Desactivar productos residuales
  const residualIds = residuales.map((p) => p.id);
  if (residualIds.length > 0) {
    const updatedProds = await prisma.producto.updateMany({
      where: { id: { in: residualIds } },
      data: { activo: false },
    });
    console.log(`✅ ${updatedProds.count} productos residuales marcados como activo: false`);

    // 3. Desactivar sus variantes
    const updatedVars = await prisma.variante.updateMany({
      where: { productoId: { in: residualIds } },
      data: { activa: false },
    });
    console.log(`✅ ${updatedVars.count} variantes residuales marcadas como activa: false`);

    // 4. Poner a cero el stock de variantes residuales
    const varsResiduales = await prisma.variante.findMany({
      where: { productoId: { in: residualIds } },
      select: { id: true },
    });
    const varResidualIds = varsResiduales.map((v) => v.id);

    if (varResidualIds.length > 0) {
      const updatedSaldos = await prisma.saldoStock.updateMany({
        where: { varianteId: { in: varResidualIds } },
        data: { fisico: 0, reservadoBlando: 0, reservadoDuro: 0 },
      });
      console.log(`✅ ${updatedSaldos.count} saldos de stock residuales llevados a 0`);
    }
  }

  // 5. Asegurar que los 30 productos oficiales estén activos al 100%
  const oficialIds = oficiales.map((p) => p.id);
  await prisma.producto.updateMany({
    where: { id: { in: oficialIds } },
    data: { activo: true },
  });
  await prisma.variante.updateMany({
    where: { productoId: { in: oficialIds } },
    data: { activa: true },
  });

  // 6. Reporte final
  const activosFinal = await prisma.producto.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, slug: true, categoria: { select: { nombre: true } } },
    orderBy: { id: 'asc' },
  });

  console.log(`\n🎉 Catálogo saneado con éxito. Total productos activos: ${activosFinal.length}`);
  activosFinal.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.slug}] ${p.nombre} (${p.categoria?.nombre})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error saneando productos:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
