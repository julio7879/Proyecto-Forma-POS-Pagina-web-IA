/**
 * Pruebas QA complementarias (Issue #63 / PR #50, SP4-02).
 * Prueban WebOrderTtlWorker directamente con un PrismaClient falso (sin Express ni BD) para
 * cubrir lo que expiracionTTL.test.ts no ejercita: la ruta REAL de $queryRaw ... SKIP LOCKED,
 * aislamiento de fallos por pedido, guardas de estado y el arranque del cron.
 * Las pruebas [HALLAZGO] verifican el comportamiento ACTUAL defectuoso (ver docs/qa/SP4-02/README.md).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { WebOrderTtlWorker } from '../domain/WebOrderTtlWorker.js';

const AHORA = new Date('2026-11-04T23:00:00Z');
const VENCIDO = new Date('2026-11-03T22:00:00Z');

const pedido = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  referenciaLegible: `PED-2026-${String(id).padStart(6, '0')}`,
  estadoPedido: 'RECIBIDO',
  estadoPago: 'PENDIENTE',
  metodoPago: 'TRANSFERENCIA',
  tieneReservaActiva: true,
  reservaExpiraEn: VENCIDO,
  ubicacionAsignadaId: 10,
  lineas: [
    { varianteId: 501, cantidad: 2 },
    { varianteId: 777, cantidad: 1 },
  ],
  ...extra,
});

function crearPrismaFalso(pedidos: Record<number, ReturnType<typeof pedido> | null>, idsSeleccionados: number[]) {
  const orden: string[] = [];
  const tx = {
    pedidoWeb: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) => pedidos[where.id] ?? null),
      update: vi.fn(async () => ({})),
    },
    historialEstadoPedidoWeb: { create: vi.fn(async () => ({})) },
    registroAuditoria: { create: vi.fn(async () => ({})) },
    // Kardex: FOR UPDATE sobre SaldoStock con reserva blanda suficiente
    $queryRaw: vi.fn(async (_s: unknown, ubicacionId: number, varianteId: number) => [
      { id: 1, ubicacionId, varianteId, fisico: 10, reservadoBlando: 5, reservadoDuro: 0, noVendible: 0, bloqueadoDespachoWeb: false },
    ]),
    saldoStock: { update: vi.fn(async () => ({ fisico: 10, reservadoBlando: 3, reservadoDuro: 0 })) },
    variante: { updateMany: vi.fn(async () => ({ count: 0 })) },
    movimientoInventario: { create: vi.fn(async () => ({ id: 1n })) },
  };
  const prisma = {
    $queryRaw: vi.fn(async () => {
      orden.push('selectSkipLocked');
      return idsSeleccionados.map((id) => ({ id }));
    }),
    pedidoWeb: { findMany: vi.fn(async () => []) },
    $transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => {
      orden.push('transaction');
      return cb(tx);
    }),
  };
  return { prisma: prisma as unknown as PrismaClient, raw: prisma, tx, orden };
}

const movimientos = (tx: ReturnType<typeof crearPrismaFalso>['tx']) =>
  tx.movimientoInventario.create.mock.calls.map((c) => {
    const d = (c as unknown as [{ data: Record<string, unknown> }])[0].data;
    return { tipo: d.tipo, ubicacionId: d.ubicacionId, varianteId: d.varianteId, cantidad: d.cantidadConSigno, afecta: d.afectaSaldo };
  });

describe('QA SP4-02 · WebOrderTtlWorker (ruta real con $queryRaw)', () => {
  it('QA-1. Pedido vencido → LIBERACION_RESERVA_WEB negativa por línea en RESERVADO_BLANDO (orden varianteId ASC) y CANCELADO', async () => {
    const f = crearPrismaFalso({ 1: pedido(1) }, [1]);
    const r = await WebOrderTtlWorker.ejecutarBarridoExpiracion(f.prisma, AHORA, 1);

    expect(r).toMatchObject({ pedidosEvaluados: 1, pedidosExpirados: 1, totalUnidadesLiberadas: 3 });
    expect(movimientos(f.tx)).toEqual([
      { tipo: 'LIBERACION_RESERVA_WEB', ubicacionId: 10, varianteId: 501, cantidad: -2, afecta: 'RESERVADO_BLANDO' },
      { tipo: 'LIBERACION_RESERVA_WEB', ubicacionId: 10, varianteId: 777, cantidad: -1, afecta: 'RESERVADO_BLANDO' },
    ]);
    expect(f.tx.pedidoWeb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estadoPedido: 'CANCELADO', tieneReservaActiva: false }) }),
    );
    expect(f.tx.historialEstadoPedidoWeb.create).toHaveBeenCalledTimes(1);
    expect(f.tx.registroAuditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accion: 'EXPIRACION_TTL_PEDIDO_WEB' }) }),
    );
  });

  it('QA-2. La consulta de candidatos filtra TRANSFERENCIA + RECIBIDO + PENDIENTE + reserva activa + vencido, con SKIP LOCKED', async () => {
    const f = crearPrismaFalso({}, []);
    await WebOrderTtlWorker.ejecutarBarridoExpiracion(f.prisma, AHORA, 1);
    const sql = (f.raw.$queryRaw.mock.calls[0] as unknown as [TemplateStringsArray])[0].join('?');
    expect(sql).toMatch(/"metodoPago" = 'TRANSFERENCIA'/);
    expect(sql).toMatch(/"estadoPedido" = 'RECIBIDO'/);
    expect(sql).toMatch(/"estadoPago" = 'PENDIENTE'/);
    expect(sql).toMatch(/"tieneReservaActiva" = true/);
    expect(sql).toMatch(/"reservaExpiraEn" <= \?/);
    expect(sql).toMatch(/FOR UPDATE SKIP LOCKED/);
  });

  it('QA-3. Si un pedido cambió de estado entre la selección y su transacción (p. ej. EN_PREPARACION), se omite sin tocar Kardex', async () => {
    const f = crearPrismaFalso({ 1: pedido(1, { estadoPedido: 'EN_PREPARACION' }) }, [1]);
    const r = await WebOrderTtlWorker.ejecutarBarridoExpiracion(f.prisma, AHORA, 1);
    expect(r.pedidosExpirados).toBe(0);
    expect(f.tx.movimientoInventario.create).not.toHaveBeenCalled();
    expect(f.tx.pedidoWeb.update).not.toHaveBeenCalled();
  });

  it('QA-4. Reserva que vence EXACTAMENTE en la fecha de corte sí expira (<=); 1 ms después no', async () => {
    const enCorte = crearPrismaFalso({ 1: pedido(1, { reservaExpiraEn: AHORA }) }, [1]);
    expect((await WebOrderTtlWorker.ejecutarBarridoExpiracion(enCorte.prisma, AHORA, 1)).pedidosExpirados).toBe(1);
    const despues = crearPrismaFalso({ 1: pedido(1, { reservaExpiraEn: new Date(AHORA.getTime() + 1) }) }, [1]);
    expect((await WebOrderTtlWorker.ejecutarBarridoExpiracion(despues.prisma, AHORA, 1)).pedidosExpirados).toBe(0);
  });

  it('QA-5. Un pedido que falla no detiene el barrido: los demás se procesan y el fallo queda en detalles', async () => {
    const f = crearPrismaFalso({ 1: pedido(1), 2: pedido(2), 3: pedido(3) }, [1, 2, 3]);
    f.tx.pedidoWeb.findUnique.mockImplementationOnce(async () => pedido(1)).mockImplementationOnce(async () => {
      throw new Error('fallo simulado en pedido 2');
    });
    const r = await WebOrderTtlWorker.ejecutarBarridoExpiracion(f.prisma, AHORA, 1);
    expect(r.pedidosEvaluados).toBe(3);
    expect(r.pedidosExpirados).toBe(2);
    expect(r.detalles.find((d) => d.pedidoId === 2)).toMatchObject({ exito: false, error: 'fallo simulado en pedido 2' });
  });

  it('[HALLAZGO] QA-6. El SELECT … FOR UPDATE SKIP LOCKED corre FUERA de toda transacción (autocommit): sus bloqueos se sueltan al instante', async () => {
    const f = crearPrismaFalso({ 1: pedido(1) }, [1]);
    await WebOrderTtlWorker.ejecutarBarridoExpiracion(f.prisma, AHORA, 1);
    // Comportamiento ACTUAL: la selección se hace con prisma.$queryRaw (cliente raíz), ANTES de abrir la transacción.
    expect(f.orden[0]).toBe('selectSkipLocked');
    expect(f.raw.$queryRaw).toHaveBeenCalledTimes(1);
    // …y dentro de la transacción el pedido se relee con findUnique SIN bloqueo (el tx.$queryRaw solo lo usa el Kardex sobre SaldoStock).
    const sqlTx = f.tx.$queryRaw.mock.calls.map((c) => (c as unknown as [TemplateStringsArray])[0].join('?'));
    expect(sqlTx.some((s) => /"PedidoWeb"/.test(s))).toBe(false);
  });

  it('[HALLAZGO] QA-7. El UPDATE a CANCELADO no exige que el pedido siga en RECIBIDO/PENDIENTE (where solo por id, sin version)', async () => {
    const f = crearPrismaFalso({ 1: pedido(1) }, [1]);
    await WebOrderTtlWorker.ejecutarBarridoExpiracion(f.prisma, AHORA, 1);
    const where = (f.tx.pedidoWeb.update.mock.calls[0] as unknown as [{ where: Record<string, unknown> }])[0].where;
    expect(where).toEqual({ id: 1 });
    // Esperado: where { id, estadoPedido: 'RECIBIDO', estadoPago: 'PENDIENTE' } o { id, version } para no pisar un pago concurrente.
  });

  it('[HALLAZGO] QA-8. Cualquier error del SELECT (no solo mocks) cae en silencio al findMany sin SKIP LOCKED', async () => {
    const f = crearPrismaFalso({ 1: pedido(1) }, [1]);
    f.raw.$queryRaw.mockRejectedValueOnce(new Error('connection reset'));
    f.raw.pedidoWeb.findMany.mockResolvedValueOnce([{ id: 1 }] as never);
    const r = await WebOrderTtlWorker.ejecutarBarridoExpiracion(f.prisma, AHORA, 1);
    expect(f.raw.pedidoWeb.findMany).toHaveBeenCalled();
    expect(r.pedidosExpirados).toBe(1); // el error de BD no se registra en ninguna parte
  });
});

describe('QA SP4-02 · Cron periódico', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    WebOrderTtlWorker.detenerCron();
    vi.useRealTimers();
  });

  it('QA-9. iniciarCron dos veces no duplica el temporizador (se reemplaza)', async () => {
    const spy = vi.spyOn(WebOrderTtlWorker, 'ejecutarBarridoExpiracion').mockResolvedValue({
      pedidosEvaluados: 0,
      pedidosExpirados: 0,
      totalUnidadesLiberadas: 0,
      detalles: [],
      fechaEjecucionColombia: '2026-11-04',
    });
    const fake = {} as PrismaClient;
    WebOrderTtlWorker.iniciarCron(fake, 1000);
    WebOrderTtlWorker.iniciarCron(fake, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('[HALLAZGO] QA-10. El servidor NUNCA arranca el cron: server.ts no llama a WebOrderTtlWorker.iniciarCron', () => {
    const aqui = dirname(fileURLToPath(import.meta.url));
    const server = readFileSync(resolve(aqui, '../../../server.ts'), 'utf8');
    // Comportamiento ACTUAL: las reservas vencidas solo se liberan si un ADMIN llama al endpoint manual.
    expect(server).not.toMatch(/iniciarCron/);
  });
});
