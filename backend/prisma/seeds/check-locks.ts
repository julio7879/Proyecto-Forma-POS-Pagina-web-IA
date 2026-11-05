import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result: any[] = await prisma.$queryRaw`
    SELECT pid, usename, state, wait_event_type, wait_event, query
    FROM pg_stat_activity
    WHERE state != 'idle' AND pid <> pg_backend_pid();
  `;
  console.log('Actividades bloqueadas o activas:', result);
}

main().finally(() => prisma.$disconnect());
