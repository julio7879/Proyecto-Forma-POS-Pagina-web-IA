/**
 * Pruebas QA complementarias (Issue #65 / PR #64, SP2-04).
 * Mismo arnés que trasladosRecepcion.test.ts (Prisma mockeado + spy de registrarMovimientosBatch).
 * Verifican el CONTENIDO de los movimientos de Kardex y casos multi-línea / resolución parcial
 * que la suite original no cubre. Las pruebas [HALLAZGO] verifican el comportamiento ACTUAL
 * defectuoso (ver docs/qa/SP2-04/README.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn() },
  ubicacion: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
  variante: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  traslado: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  lineaTraslado: { update: vi.fn() },
  resolucionNovedadTraslado: { create: vi.fn() },
  saldoStock: { update: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
  movimientoInventario: { create: vi.fn() },
  registroAuditoria: { create: vi.fn() },
  registroIdempotencia: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({ prisma: prismaMock, default: prismaMock }));

import request from 'supertest';
import { Prisma } from '@prisma/client';
import { app } from '../../../app.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';
import { InventoryLedgerService } from '../../04-inventario/InventoryLedgerService.js';

const permisos = {
  permVender: false,
  permCaja: false,
  permDescuentoManual: false,
  permAnularVentas: false,
  permDevoluciones: false,
  permVerInventario: false,
  permSolicitarTraslado: false,
  permRecibirTraslado: true,
  permVerOtrosPuntos: false,
  permPedidosWeb: false,
  permVerVentasPunto: false,
};
const usuarios: Record<number, unknown> = {
  1: { id: 1, correo: 'admin@forma.com', rol: 'ADMIN', ubicacionId: 1, activo: true, topeDescuentoPorc: 100, ...permisos },
  2: { id: 2, correo: 'vend.norte@forma.com', rol: 'VENDEDOR', ubicacionId: 2, activo: true, topeDescuentoPorc: 0, ...permisos },
};
const ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const VEND_NORTE = `Bearer ${generateToken({ userId: 2, correo: 'vend.norte@forma.com', rol: 'VENDEDOR' })}`;

// Traslado ENVIADO Central(1) → Norte(2): línea 101 (variante 501, 10 u) y línea 102 (variante 777, 5 u)
const enviado = () => ({
  id: 10,
  ubicacionOrigenId: 1,
  ubicacionDestinoId: 2,
  estado: 'ENVIADO',
  version: 3,
  lineas: [
    { id: 101, varianteId: 501, cantidadEnviada: 10, unidadesFaltantesPendientes: 0, excedentePendienteResolver: 0 },
    { id: 102, varianteId: 777, cantidadEnviada: 5, unidadesFaltantesPendientes: 0, excedentePendienteResolver: 0 },
  ],
});

// Traslado con novedad: línea 201 con 5 faltantes, línea 202 con 2 excedentes
const conNovedad = () => ({
  id: 20,
  ubicacionOrigenId: 1,
  ubicacionDestinoId: 2,
  estado: 'RECIBIDO_CON_NOVEDAD',
  version: 4,
  lineas: [
    { id: 201, varianteId: 501, cantidadEnviada: 10, unidadesFaltantesPendientes: 5, excedentePendienteResolver: 0 },
    { id: 202, varianteId: 777, cantidadEnviada: 5, unidadesFaltantesPendientes: 0, excedentePendienteResolver: 2 },
  ],
});

let n = 0;
const recibir = (body: object, token = VEND_NORTE) =>
  request(app).post('/api/traslados/10/recibir').set('Authorization', token).set('Idempotency-Key', `qa-sp204-${++n}`).send(body);
const resolver = (body: object, token = ADMIN) =>
  request(app).post('/api/traslados/20/resolver-novedad').set('Authorization', token).send(body);

const batch = () => (InventoryLedgerService.registrarMovimientosBatch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
const movs = () =>
  batch().flatMap((c) =>
    (c[1] as Array<Record<string, unknown>>).map((m) => ({
      tipo: m.tipo,
      ubicacionId: m.ubicacionId,
      varianteId: m.varianteId,
      cantidad: m.cantidadConSigno,
      afecta: m.afectaSaldo,
    })),
  );
const dataUpdateTraslado = () => (prismaMock.traslado.update.mock.calls[0] as [{ data: Record<string, unknown> }])[0].data;

describe('QA SP2-04 · Recepción y resolución de novedades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    UserPermissionCache.clear();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.registroIdempotencia.upsert.mockResolvedValue({});
    prismaMock.registroAuditoria.create.mockResolvedValue({});
    prismaMock.lineaTraslado.update.mockResolvedValue({});
    prismaMock.resolucionNovedadTraslado.create.mockResolvedValue({});
    prismaMock.traslado.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 10, ...data }));
    vi.spyOn(InventoryLedgerService, 'registrarMovimientosBatch').mockResolvedValue([] as never);
  });

  // ─────────── Recepción (RF-TRA-05) ───────────
  it('QA-1. Conforme con dañadas (CA-57/CA-06): BUENO +8 FISICO y DANADO +2 NO_VENDIBLE en destino; RECIBIDO con fechaCierre', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(enviado());
    const res = await recibir({
      observacion: 'Dos prendas con costura rota',
      lineas: [
        { lineaId: 101, cantidadRecibidaBuena: 8, cantidadRecibidaDanada: 2 },
        { lineaId: 102, cantidadRecibidaBuena: 5, cantidadRecibidaDanada: 0 },
      ],
    });
    expect(res.status).toBe(200);
    expect(movs()).toEqual(
      expect.arrayContaining([
        { tipo: 'TRASLADO_RECIBIDO_BUENO', ubicacionId: 2, varianteId: 501, cantidad: 8, afecta: 'FISICO' },
        { tipo: 'TRASLADO_RECIBIDO_DANADO', ubicacionId: 2, varianteId: 501, cantidad: 2, afecta: 'NO_VENDIBLE' },
        { tipo: 'TRASLADO_RECIBIDO_BUENO', ubicacionId: 2, varianteId: 777, cantidad: 5, afecta: 'FISICO' },
      ]),
    );
    expect(movs()).toHaveLength(3);
    expect(dataUpdateTraslado()).toMatchObject({ estado: 'RECIBIDO' });
    expect(dataUpdateTraslado().fechaCierre).toBeInstanceOf(Date);
    expect(dataUpdateTraslado().fechaRecepcion).toBeInstanceOf(Date);
  });

  it('QA-2. Conforme SIN dañadas no exige observación', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(enviado());
    const res = await recibir({
      lineas: [
        { lineaId: 101, cantidadRecibidaBuena: 10, cantidadRecibidaDanada: 0 },
        { lineaId: 102, cantidadRecibidaBuena: 5, cantidadRecibidaDanada: 0 },
      ],
    });
    expect(res.status).toBe(200);
    expect(dataUpdateTraslado()).toMatchObject({ estado: 'RECIBIDO' });
  });

  it('QA-3. Con dañadas y SIN observación → 400 y el traslado no cambia de estado (RN-TRA-09)', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(enviado());
    const res = await recibir({
      lineas: [
        { lineaId: 101, cantidadRecibidaBuena: 9, cantidadRecibidaDanada: 1 },
        { lineaId: 102, cantidadRecibidaBuena: 5, cantidadRecibidaDanada: 0 },
      ],
    });
    expect(res.status).toBe(400);
    expect(prismaMock.traslado.update).not.toHaveBeenCalled();
  });

  it('QA-4. Multi-línea: faltante en una y excedente en otra → RECIBIDO_CON_NOVEDAD, pendientes por línea y sin fechaCierre (CA-58)', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(enviado());
    const res = await recibir({
      observacion: 'Faltan 2 camisetas y llegó 1 gorra de más',
      lineas: [
        { lineaId: 101, cantidadRecibidaBuena: 8, cantidadRecibidaDanada: 0 },
        { lineaId: 102, cantidadRecibidaBuena: 5, cantidadRecibidaDanada: 0, excedenteReportado: 1 },
      ],
    });
    expect(res.status).toBe(200);
    expect(prismaMock.lineaTraslado.update).toHaveBeenCalledWith({
      where: { id: 101 },
      data: expect.objectContaining({ unidadesFaltantesPendientes: 2, excedentePendienteResolver: 0 }),
    });
    expect(prismaMock.lineaTraslado.update).toHaveBeenCalledWith({
      where: { id: 102 },
      data: expect.objectContaining({ unidadesFaltantesPendientes: 0, excedentePendienteResolver: 1 }),
    });
    expect(dataUpdateTraslado()).toMatchObject({ estado: 'RECIBIDO_CON_NOVEDAD', fechaCierre: null });
  });

  it('QA-5. Si se omite una línea del traslado → 400 (no se recibe parcialmente por omisión)', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(enviado());
    const res = await recibir({ lineas: [{ lineaId: 101, cantidadRecibidaBuena: 10, cantidadRecibidaDanada: 0 }] });
    expect(res.status).toBe(400);
  });

  it('QA-6. Línea ajena al traslado → 400; cantidades negativas → 400 (Zod)', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(enviado());
    expect(
      (await recibir({ lineas: [{ lineaId: 999, cantidadRecibidaBuena: 1, cantidadRecibidaDanada: 0 }] })).status,
    ).toBe(400);
    expect(
      (await recibir({ lineas: [{ lineaId: 101, cantidadRecibidaBuena: -1, cantidadRecibidaDanada: 0 }] })).status,
    ).toBe(400);
  });

  it('QA-7. ADMIN puede recibir aunque su sede no sea el destino (RN-ROL-03)', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(enviado());
    const res = await recibir(
      {
        lineas: [
          { lineaId: 101, cantidadRecibidaBuena: 10, cantidadRecibidaDanada: 0 },
          { lineaId: 102, cantidadRecibidaBuena: 5, cantidadRecibidaDanada: 0 },
        ],
      },
      ADMIN,
    );
    expect(res.status).toBe(200);
  });

  // ─────────── Resolución (RF-TRA-06, CA-10) ───────────
  it('QA-8. Resolución PARCIAL (3 de 5 faltantes) mantiene RECIBIDO_CON_NOVEDAD y no cierra', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(conNovedad());
    const res = await resolver({
      resoluciones: [{ lineaTrasladoId: 201, tipoResolucion: 'LLEGO_A_PUNTO', cantidadResuelta: 3, motivo: 'Llegaron en segunda caja' }],
    });
    expect(res.status).toBe(200);
    expect(dataUpdateTraslado()).toMatchObject({ estado: 'RECIBIDO_CON_NOVEDAD', fechaCierre: null });
  });

  it('QA-9. Resolución mixta completa (3 llegaron + 2 pérdida + 2 excedentes descartados) → CERRADO; solo mueve stock lo que llegó', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(conNovedad());
    const res = await resolver({
      resoluciones: [
        { lineaTrasladoId: 201, tipoResolucion: 'LLEGO_A_PUNTO', cantidadResuelta: 3, motivo: 'Llegaron en segunda caja' },
        { lineaTrasladoId: 201, tipoResolucion: 'PERDIDA_AJUSTE', cantidadResuelta: 2, motivo: 'Extraviadas por transportadora' },
        { lineaTrasladoId: 202, tipoResolucion: 'EXCEDENTE_DESCARTADO_O_DEVUELTO', cantidadResuelta: 2, motivo: 'Se devuelven a Central' },
      ],
    });
    expect(res.status).toBe(200);
    expect(movs()).toEqual([{ tipo: 'NOVEDAD_LLEGO_DESTINO', ubicacionId: 2, varianteId: 501, cantidad: 3, afecta: 'FISICO' }]);
    expect(dataUpdateTraslado()).toMatchObject({ estado: 'CERRADO' });
    expect(dataUpdateTraslado().fechaCierre).toBeInstanceOf(Date);
  });

  it('QA-10. Repetir la misma línea en una petición no permite resolver más de lo pendiente (3 + 3 sobre 5 → 400)', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(conNovedad());
    const res = await resolver({
      resoluciones: [
        { lineaTrasladoId: 201, tipoResolucion: 'LLEGO_A_PUNTO', cantidadResuelta: 3, motivo: 'Primera caja recibida' },
        { lineaTrasladoId: 201, tipoResolucion: 'RETORNO_A_CENTRAL', cantidadResuelta: 3, motivo: 'Segunda caja a Central' },
      ],
    });
    expect(res.status).toBe(400);
  });

  it('QA-11. Resolver novedades de un traslado RECIBIDO (sin novedad) → 409', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue({ ...conNovedad(), estado: 'RECIBIDO' });
    const res = await resolver({
      resoluciones: [{ lineaTrasladoId: 201, tipoResolucion: 'PERDIDA_AJUSTE', cantidadResuelta: 1, motivo: 'Intento sobre traslado cerrado' }],
    });
    expect(res.status).toBe(409);
  });

  it('[HALLAZGO] QA-12. EXCEDENTE_INCORPORADO_DESDE_CENTRAL suma al punto pero NO descuenta de Central (RN-TRA-10: "− fisico Central, + fisico punto")', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(conNovedad());
    await resolver({
      resoluciones: [
        { lineaTrasladoId: 202, tipoResolucion: 'EXCEDENTE_INCORPORADO_DESDE_CENTRAL', cantidadResuelta: 2, motivo: 'Se incorporan al punto' },
      ],
    });
    // Comportamiento ACTUAL: un único movimiento +2 en destino; Central conserva las 2 unidades → inventario global inflado.
    expect(movs()).toEqual([{ tipo: 'NOVEDAD_EXCEDENTE_INCORPORADO', ubicacionId: 2, varianteId: 777, cantidad: 2, afecta: 'FISICO' }]);
    expect(movs().some((m) => m.ubicacionId === 1)).toBe(false);
    // Esperado: además un movimiento negativo (−2 FISICO) en Central (ubicacionOrigenId).
  });

  it('[HALLAZGO] QA-13. Versión desactualizada detectada en el UPDATE (carrera real) responde 404, no 409 (QA-014)', async () => {
    prismaMock.traslado.findUnique.mockResolvedValue(conNovedad());
    prismaMock.traslado.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record to update not found.', { code: 'P2025', clientVersion: 'test' }),
    );
    const res = await resolver({
      resoluciones: [{ lineaTrasladoId: 201, tipoResolucion: 'PERDIDA_AJUSTE', cantidadResuelta: 5, motivo: 'Pérdida confirmada' }],
    });
    // Comportamiento ACTUAL: el where { id, version } falla con P2025 y el errorHandler lo traduce a 404 "no encontrado".
    expect(res.status).toBe(404);
    // Esperado: 409 Conflict de concurrencia (QA-014). Solo el caso "version enviada en el body" da 409 hoy.
  });
});
