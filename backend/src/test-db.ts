import { prisma } from './shared/infra/db.js';

async function main() {
  console.log('Probando conexión a Supabase...');
  const count = await prisma.ubicacion.count();
  console.log(`✅ Conexión exitosa a Supabase. Ubicaciones registradas: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Error de conexión:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
