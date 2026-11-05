import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.producto.findMany({
    select: { id: true, nombre: true, slug: true, activo: true, categoria: { select: { nombre: true } } },
    orderBy: { id: 'asc' },
  });
  console.log('Total productos en DB:', prods.length);
  console.log('Activos:', prods.filter((p) => p.activo).length);
  console.log('Nombres activos:', prods.filter((p) => p.activo).map((p) => `[${p.id}] ${p.nombre} (${p.categoria?.nombre})`));
}

main().finally(() => prisma.$disconnect());
