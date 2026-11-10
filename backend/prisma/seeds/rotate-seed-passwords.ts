import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Rotación de contraseñas de las cuentas semilla (F0).
 *
 * Uso:
 *   ADMIN_SEED_PASSWORD="..." VENDEDOR_SEED_PASSWORD="..." CLIENTE_SEED_PASSWORD="..." \
 *   npm run rotate:passwords --prefix backend
 *
 * No imprime contraseñas. Solo actualiza las cuentas que existan.
 * Si tus correos semilla cambiaron, ajusta la lista `CUENTAS`.
 */
const prisma = new PrismaClient();

const CUENTAS: Array<{ correo: string; env: string }> = [
  { correo: 'admin@forma.com', env: 'ADMIN_SEED_PASSWORD' },
  { correo: 'vendedor.centro@forma.com', env: 'VENDEDOR_SEED_PASSWORD' },
  { correo: 'vendedor.caobos@forma.com', env: 'VENDEDOR_SEED_PASSWORD' },
  { correo: 'vendedor.ocana@forma.com', env: 'VENDEDOR_SEED_PASSWORD' },
  { correo: 'vendedor.bucaramanga@forma.com', env: 'VENDEDOR_SEED_PASSWORD' },
  { correo: 'cliente.web@forma.com', env: 'CLIENTE_SEED_PASSWORD' },
];

async function main(): Promise<void> {
  let total = 0;

  for (const cuenta of CUENTAS) {
    const password = process.env[cuenta.env];
    if (!password) {
      console.warn(`SKIP ${cuenta.correo}: falta ${cuenta.env}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { count } = await prisma.usuario.updateMany({
      where: { correo: cuenta.correo },
      data: { passwordHash },
    });

    console.log(`${cuenta.correo}: ${count} cuenta(s) actualizada(s)`);
    total += count;
  }

  console.log(`Total actualizado: ${total}`);
  if (total === 0) {
    console.warn('No se actualizó ninguna cuenta. Revisa los correos o las variables de entorno.');
  }
}

main()
  .catch((error) => {
    console.error('Error rotando contraseñas:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
