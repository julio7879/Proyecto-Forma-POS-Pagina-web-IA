import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../shared/infra/db.js';
import { InventoryLedgerService } from '../InventoryLedgerService.js';

/**
 * QA Issue #16 (PR #12) - Pruebas de integración contra PostgreSQL REAL.
 * Cubren CA-02 / QA-003 (última unidad concurrente) y RNF-003 (sin deadlock en batch),
 * que los 18 tests unitarios (con tx simulada) no pueden demostrar.
 *
 * Solo corren con RUN_DB_TESTS=1 y una BD de DESARROLLO con migraciones + seed aplicados
 * (usa el usuario admin@forma.com, el municipio 54001 y la categoría "Ropa" del seed).
 * Crea datos con prefijo QA-KDX-<timestamp>; NO borra nada (Invariante 7: Kardex inmutable).
 */
const habilitado = process.env.RUN_DB_TESTS === '1';

describe.skipIf(!habilitado)('Kardex - concurrencia real con SELECT ... FOR UPDATE (QA-003, RNF-003)', () => {
  const run = Date.now();
  let ubicacionId = 0;
  let usuarioId = 0;
  let varA = 0;
  let varB = 0;
  let varC = 0;

  async function crearVariante(sufijo: string, productoId: number): Promise<number> {
    const v = await prisma.variante.create({
      data: {
        productoId,
        sku: `QA-KDX-${run}-${sufijo}`,
        talla: 'U',
        color: 'QA',
        precioVentaCop: 1000,
      },
    });
    return v.id;
  }

  async function sembrarSaldo(varianteId: number, fisico: number): Promise<void> {
    await prisma.saldoStock.create({ data: { ubicacionId, varianteId, fisico } });
  }

  beforeAll(async () => {
    const admin = await prisma.usuario.findUniqueOrThrow({ where: { correo: 'admin@forma.com' } });
    usuarioId = admin.id;
    const categoria = await prisma.categoria.findUniqueOrThrow({ where: { nombre: 'Ropa' } });

    const ubicacion = await prisma.ubicacion.create({
      data: {
        nombre: `QA-KDX-${run}`,
        tipo: 'PUNTO_VENTA',
        municipioDaneId: '54001',
        direccion: 'QA Kardex',
      },
    });
    ubicacionId = ubicacion.id;

    const producto = await prisma.producto.create({
      data: {
        nombre: `QA Kardex ${run}`,
        slug: `qa-kardex-${run}`,
        descripcion: 'Producto de prueba de concurrencia',
        categoriaId: categoria.id,
      },
    });
    varA = await crearVariante('A', producto.id);
    varB = await crearVariante('B', producto.id);
    varC = await crearVariante('C', producto.id);
  }, 30_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const venta = (varianteId: number, documentoId: number) => ({
    tipo: 'VENTA_POS' as const,
    ubicacionId,
    varianteId,
    cantidadConSigno: -1,
    afectaSaldo: 'FISICO' as const,
    documentoTipo: 'VENTA_POS' as const,
    documentoId,
    usuarioId,
  });

  it('CA-02 / QA-003: dos ventas simultáneas de la última unidad -> 1 éxito y 1 rechazo 409, saldo en 0', async () => {
    await sembrarSaldo(varA, 1);
    const docBase = Number(String(run).slice(-8));

    const resultados = await Promise.allSettled([
      prisma.$transaction((tx) => InventoryLedgerService.registrarMovimiento(tx, venta(varA, docBase))),
      prisma.$transaction((tx) => InventoryLedgerService.registrarMovimiento(tx, venta(varA, docBase + 1))),
    ]);

    const ok = resultados.filter((r) => r.status === 'fulfilled');
    const fallos = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(fallos).toHaveLength(1);
    expect((fallos[0]!.reason as { statusCode?: number }).statusCode).toBe(409);

    const saldo = await prisma.saldoStock.findUniqueOrThrow({
      where: { ubicacionId_varianteId: { ubicacionId, varianteId: varA } },
    });
    expect(saldo.fisico).toBe(0);

    const movimientos = await prisma.movimientoInventario.count({ where: { ubicacionId, varianteId: varA } });
    expect(movimientos).toBe(1);
  }, 30_000);

  it('RNF-003: dos batch con orden de entrada opuesto (A,B) y (B,A) terminan sin deadlock ni saldos negativos', async () => {
    await sembrarSaldo(varB, 2);
    await sembrarSaldo(varC, 2);
    const docBase = Number(String(run).slice(-8)) + 10;

    const resultados = await Promise.allSettled([
      prisma.$transaction((tx) =>
        InventoryLedgerService.registrarMovimientosBatch(tx, [venta(varB, docBase), venta(varC, docBase)])
      ),
      prisma.$transaction((tx) =>
        InventoryLedgerService.registrarMovimientosBatch(tx, [venta(varC, docBase + 1), venta(varB, docBase + 1)])
      ),
    ]);

    expect(resultados.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled']);

    for (const varianteId of [varB, varC]) {
      const saldo = await prisma.saldoStock.findUniqueOrThrow({
        where: { ubicacionId_varianteId: { ubicacionId, varianteId } },
      });
      expect(saldo.fisico).toBe(0);
    }
  }, 30_000);
});
