import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database.js';
import { InventoryLedgerService, type RegistrarMovimientoParams } from '../InventoryLedgerService.js';
import { TrasladoService } from '../../06-traslados/traslado.service.js';
import type { UserAuthSnapshot } from '../../../shared/middlewares/authPermission.js';

/**
 * SP2-07 (Issue #41) — Matriz de Pruebas de Concurrencia y Certificación QA Sprint 2.
 *
 * Pruebas ADVERSARIALES contra PostgreSQL REAL (no mocks): solo así se demuestra
 * que SELECT ... FOR UPDATE serializa, que no hay deadlocks y que el CHECK de BD existe.
 *
 * ▸ Solo corren con RUN_DB_TESTS=1 (en la suite normal quedan "skipped").
 * ▸ Requieren BD de DESARROLLO con migraciones + constraints_post_migrate.sql + seed
 *   (admin@forma.com, municipio 54001, categoría "Ropa", Bodega Central activa).
 * ▸ Crean datos propios con prefijo QA-SP207-<timestamp> (sede, producto, variantes y
 *   sus saldos, incluida la fila de esas variantes en Bodega Central). No tocan productos
 *   existentes. No borran nada (Invariante 7: Kardex inmutable).
 */
const habilitado = process.env.RUN_DB_TESTS === '1';
const TX = { maxWait: 30_000, timeout: 30_000 } as const;
const T = 60_000; // timeout por test (BD remota)

type Resultado = PromiseSettledResult<unknown>;
const exitos = (r: Resultado[]) => r.filter((x) => x.status === 'fulfilled');
const fallos = (r: Resultado[]) => r.filter((x): x is PromiseRejectedResult => x.status === 'rejected');
const statusDe = (f: PromiseRejectedResult) => (f.reason as { statusCode?: number }).statusCode;
const textoDe = (f: PromiseRejectedResult) => String((f.reason as Error)?.message ?? f.reason);

describe.skipIf(!habilitado)('SP2-07 · Matriz de concurrencia Sprint 2 (PostgreSQL real)', () => {
  const run = Date.now();
  const doc = Number(String(run).slice(-7)); // documentoId base (Int)
  let admin!: UserAuthSnapshot;
  let centralId = 0;
  let destinoId = 0;
  let productoId = 0;
  let skuN = 0;

  async function nuevaVariante(): Promise<number> {
    skuN += 1;
    const v = await prisma.variante.create({
      data: { productoId, sku: `QA-SP207-${run}-${skuN}`, talla: 'U', color: 'QA', precioVentaCop: 1000 },
    });
    return v.id;
  }

  async function sembrar(ubicacionId: number, varianteId: number, fisico: number) {
    await prisma.saldoStock.create({ data: { ubicacionId, varianteId, fisico } });
  }

  async function saldo(ubicacionId: number, varianteId: number) {
    return prisma.saldoStock.findUnique({
      where: { ubicacionId_varianteId: { ubicacionId, varianteId } },
    });
  }

  const venta = (ubicacionId: number, varianteId: number, documentoId: number): RegistrarMovimientoParams => ({
    tipo: 'VENTA_POS',
    ubicacionId,
    varianteId,
    cantidadConSigno: -1,
    afectaSaldo: 'FISICO',
    documentoTipo: 'VENTA_POS',
    documentoId,
    usuarioId: admin.id,
    motivo: `QA-SP207-${run}`,
  });

  const enTx = <R>(fn: (tx: Prisma.TransactionClient) => Promise<R>) => prisma.$transaction(fn, TX);

  beforeAll(async () => {
    const u = await prisma.usuario.findUniqueOrThrow({ where: { correo: 'admin@forma.com' } });
    admin = {
      id: u.id,
      correo: u.correo,
      rol: 'ADMIN',
      ubicacionId: u.ubicacionId,
      activo: true,
      topeDescuentoPorc: u.topeDescuentoPorc,
      permisos: {
        permVender: u.permVender,
        permCaja: u.permCaja,
        permDescuentoManual: u.permDescuentoManual,
        permAnularVentas: u.permAnularVentas,
        permDevoluciones: u.permDevoluciones,
        permVerInventario: u.permVerInventario,
        permSolicitarTraslado: u.permSolicitarTraslado,
        permRecibirTraslado: u.permRecibirTraslado,
        permVerOtrosPuntos: u.permVerOtrosPuntos,
        permPedidosWeb: u.permPedidosWeb,
        permVerVentasPunto: u.permVerVentasPunto,
      },
    };

    const central = await prisma.ubicacion.findFirstOrThrow({ where: { tipo: 'CENTRAL', activa: true } });
    centralId = central.id;

    const destino = await prisma.ubicacion.create({
      data: { nombre: `QA-SP207-${run}`, tipo: 'PUNTO_VENTA', municipioDaneId: '54001', direccion: 'QA SP2-07' },
    });
    destinoId = destino.id;

    const categoria = await prisma.categoria.findUniqueOrThrow({ where: { nombre: 'Ropa' } });
    const producto = await prisma.producto.create({
      data: {
        nombre: `QA SP2-07 ${run}`,
        slug: `qa-sp207-${run}`,
        descripcion: 'Producto de prueba de concurrencia SP2-07',
        categoriaId: categoria.id,
      },
    });
    productoId = producto.id;
  }, T);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ───────────────────────── 1. Kardex: concurrencia pesimista (QA-003, CA-01, CA-02) ─────────────────────────
  describe('1 · Kardex FOR UPDATE (QA-003, CA-01, CA-02)', () => {
    it('1.1 · 10 ventas simultáneas sobre la ÚLTIMA unidad → 1 éxito, 9 × 409, físico 0, 1 movimiento', async () => {
      const v = await nuevaVariante();
      await sembrar(destinoId, v, 1);

      const r = await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) =>
          enTx((tx) => InventoryLedgerService.registrarMovimiento(tx, venta(destinoId, v, doc + i))),
        ),
      );

      expect(exitos(r)).toHaveLength(1);
      expect(fallos(r)).toHaveLength(9);
      fallos(r).forEach((f) => expect(statusDe(f), textoDe(f)).toBe(409));
      expect((await saldo(destinoId, v))!.fisico).toBe(0);
      expect(await prisma.movimientoInventario.count({ where: { ubicacionId: destinoId, varianteId: v } })).toBe(1);
    }, T);

    it('1.2 · 10 ventas simultáneas con stock 5 → exactamente 5 éxitos, físico 0, Kardex suma −5 y saldos 4..0 sin repetir', async () => {
      const v = await nuevaVariante();
      await sembrar(destinoId, v, 5);

      const r = await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) =>
          enTx((tx) => InventoryLedgerService.registrarMovimiento(tx, venta(destinoId, v, doc + 100 + i))),
        ),
      );

      expect(exitos(r)).toHaveLength(5);
      fallos(r).forEach((f) => expect(statusDe(f), textoDe(f)).toBe(409));
      expect((await saldo(destinoId, v))!.fisico).toBe(0);

      const movs = await prisma.movimientoInventario.findMany({ where: { ubicacionId: destinoId, varianteId: v } });
      expect(movs.reduce((a, m) => a + m.cantidadConSigno, 0)).toBe(-5);
      // Serialización real: cada transacción vio el saldo que dejó la anterior (sin lecturas sucias ni pérdidas)
      expect(movs.map((m) => m.saldoResultante).sort()).toEqual([0, 1, 2, 3, 4]);
    }, T);

    it('1.3 · RNF-003: 6 batches simultáneos con orden de entrada opuesto (A,B)/(B,A) → sin deadlock, saldos en 0', async () => {
      const a = await nuevaVariante();
      const b = await nuevaVariante();
      await sembrar(destinoId, a, 6);
      await sembrar(destinoId, b, 6);

      const r = await Promise.allSettled(
        Array.from({ length: 6 }, (_, i) => {
          const d = doc + 200 + i;
          const lote = i % 2 === 0 ? [venta(destinoId, a, d), venta(destinoId, b, d)] : [venta(destinoId, b, d), venta(destinoId, a, d)];
          return enTx((tx) => InventoryLedgerService.registrarMovimientosBatch(tx, lote));
        }),
      );

      // Un deadlock de PostgreSQL (40P01) aparecería aquí como rechazo
      fallos(r).forEach((f) => expect.fail(`Batch rechazado (¿deadlock?): ${textoDe(f)}`));
      expect(exitos(r)).toHaveLength(6);
      expect((await saldo(destinoId, a))!.fisico).toBe(0);
      expect((await saldo(destinoId, b))!.fisico).toBe(0);
    }, T);

    it('1.4 · La BD rechaza saldo negativo por sí misma (CHECK chk_saldo_stock_no_negativo)', async () => {
      const v = await nuevaVariante();
      await sembrar(destinoId, v, 1);
      const fila = (await saldo(destinoId, v))!;

      let mensaje = '';
      try {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`UPDATE "SaldoStock" SET "fisico" = -1 WHERE "id" = ${fila.id}`;
          throw new Error('QA_SIN_CONSTRAINT: la BD aceptó fisico = -1');
        }, TX);
      } catch (e) {
        mensaje = String((e as Error).message);
      }

      expect(mensaje, 'Falta aplicar prisma/constraints_post_migrate.sql en esta BD').toContain('chk_saldo_stock_no_negativo');
      expect((await saldo(destinoId, v))!.fisico).toBe(1);
    }, T);
  });

  // ───────────────────────── 2. Compras: idempotencia (CA-08, RN-COM-03) ─────────────────────────
  describe('2 · Compras idempotentes (CA-08, RN-COM-03)', () => {
    // BLOQUEADO: el módulo 05-compras (SP2-02) solo expone /health en develop.
    it.todo('2.1 · Ráfaga de recepciones de la misma OC con igual Idempotency-Key → stock en Central +N una sola vez');
    it.todo('2.2 · Misma Idempotency-Key con cuerpo distinto → rechazo (409/422), sin movimiento');
  });

  // ───────────────────────── 3. Traslados en tránsito y retorno (CA-04, CA-05, CA-09, CA-59, QA-012) ─────────────────────────
  describe('3 · Traslados en tránsito y retorno a Central (CA-04, CA-05, CA-09, CA-59, QA-012)', () => {
    async function trasladoDirecto(varianteId: number, cantidad: number) {
      return TrasladoService.solicitar(
        { ubicacionDestinoId: destinoId, esEnvioDirecto: true, lineas: [{ varianteId, cantidadSolicitada: cantidad }] },
        admin,
      );
    }

    it('3.1 · Despacho: Central −3, destino NO recibe nada (tránsito) y el destino no puede vender esas unidades', async () => {
      const v = await nuevaVariante();
      await sembrar(centralId, v, 10);
      await sembrar(destinoId, v, 0);

      const t = await trasladoDirecto(v, 3);
      const enviado = await TrasladoService.despachar(t.id, {}, admin);

      expect(enviado.estado).toBe('ENVIADO');
      expect((await saldo(centralId, v))!.fisico).toBe(7);
      expect((await saldo(destinoId, v))!.fisico).toBe(0); // CA-05: en tránsito, no vendible en destino

      await expect(
        enTx((tx) => InventoryLedgerService.registrarMovimiento(tx, venta(destinoId, v, doc + 300))),
      ).rejects.toMatchObject({ statusCode: 409 });
    }, T);

    it('3.2 · Cancelar en tránsito → RETORNANDO_A_CENTRAL sin reponer; solo confirmar retorno repone (CA-09, CA-59)', async () => {
      const v = await nuevaVariante();
      await sembrar(centralId, v, 10);

      const t = await trasladoDirecto(v, 4);
      await TrasladoService.despachar(t.id, {}, admin);
      expect((await saldo(centralId, v))!.fisico).toBe(6);

      const ret = await TrasladoService.cancelar(t.id, { motivo: 'QA SP2-07 cancelación en tránsito' }, admin);
      expect(ret.estado).toBe('RETORNANDO_A_CENTRAL');
      expect((await saldo(centralId, v))!.fisico).toBe(6); // NO se suma todavía

      const fin = await TrasladoService.confirmarRetorno(t.id, {}, admin);
      expect(fin.estado).toBe('CANCELADO');
      expect((await saldo(centralId, v))!.fisico).toBe(10);
    }, T);

    it('3.3 · QA-012: dos confirmaciones de retorno simultáneas → Central se repone UNA sola vez', async () => {
      const v = await nuevaVariante();
      await sembrar(centralId, v, 10);
      const t = await trasladoDirecto(v, 5);
      await TrasladoService.despachar(t.id, {}, admin);
      await TrasladoService.cancelar(t.id, { motivo: 'QA SP2-07 doble retorno' }, admin);

      const r = await Promise.allSettled([
        TrasladoService.confirmarRetorno(t.id, {}, admin),
        TrasladoService.confirmarRetorno(t.id, {}, admin),
      ]);

      expect(exitos(r)).toHaveLength(1);
      expect((await saldo(centralId, v))!.fisico).toBe(10);
      expect(
        await prisma.movimientoInventario.count({
          where: { documentoTipo: 'TRASLADO', documentoId: t.id, tipo: 'TRASLADO_CANCELADO_REINGRESO' },
        }),
      ).toBe(1);
    }, T);

    it('3.4 · Doble despacho simultáneo del mismo traslado → Central se descuenta UNA sola vez', async () => {
      const v = await nuevaVariante();
      await sembrar(centralId, v, 10);
      const t = await trasladoDirecto(v, 2);

      const r = await Promise.allSettled([
        TrasladoService.despachar(t.id, {}, admin),
        TrasladoService.despachar(t.id, {}, admin),
      ]);

      expect(exitos(r)).toHaveLength(1);
      expect((await saldo(centralId, v))!.fisico).toBe(8);
      expect(
        await prisma.movimientoInventario.count({
          where: { documentoTipo: 'TRASLADO', documentoId: t.id, tipo: 'TRASLADO_ENVIADO' },
        }),
      ).toBe(1);
    }, T);

    it('3.5 · Despacho concurrente de 2 traslados por la última unidad de Central → 1 ENVIADO, 1 rechazado 409', async () => {
      const v = await nuevaVariante();
      await sembrar(centralId, v, 1);
      const t1 = await trasladoDirecto(v, 1);
      const t2 = await trasladoDirecto(v, 1);

      const r = await Promise.allSettled([
        TrasladoService.despachar(t1.id, {}, admin),
        TrasladoService.despachar(t2.id, {}, admin),
      ]);

      expect(exitos(r)).toHaveLength(1);
      expect(statusDe(fallos(r)[0]!)).toBe(409);
      expect((await saldo(centralId, v))!.fisico).toBe(0);
    }, T);
  });

  // ───────────────────────── 4. Recepción con novedades (CA-06, CA-07, CA-57, CA-58, QA-010, QA-011) ─────────────────────────
  describe('4 · Recepción con novedades (CA-06, CA-07, CA-57, CA-58, QA-010, QA-011)', () => {
    // BLOQUEADO: SP2-04 no está en develop (no existe TrasladoService.recibir ni endpoint de recepción/novedad).
    it.todo('4.1 · Recibir con prendas dañadas → entran a SaldoStock.noVendible (TRASLADO_RECIBIDO_DANADO)');
    it.todo('4.2 · Recibir con faltantes → estado RECIBIDO_CON_NOVEDAD obligatorio');
    it.todo('4.3 · Recibir con excedentes → estado RECIBIDO_CON_NOVEDAD obligatorio');
    it.todo('4.4 · VENDEDOR sin permiso de admin no puede resolver la novedad (403)');
    it.todo('4.5 · Dos recepciones simultáneas del mismo traslado → stock destino sumado una sola vez');
  });
});
