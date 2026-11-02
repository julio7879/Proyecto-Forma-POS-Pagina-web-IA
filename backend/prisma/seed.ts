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
