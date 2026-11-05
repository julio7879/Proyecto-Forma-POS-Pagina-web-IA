/**
 * Pruebas QA complementarias (Issue #67 / PR #66, SP2-02).
 * Mismo arnés que compras.test.ts (Prisma mockeado + spy del Kardex).
 * Las pruebas [HALLAZGO] verifican el comportamiento ACTUAL defectuoso (ver docs/qa/SP2-02/README.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn() },
  ubicacion: { findFirst: vi.fn() },
  variante: { findMany: vi.fn() },
  compraProveedor: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  lineaCompra: { update: vi.fn() },
  saldoStock: { update: vi.fn(), upsert: vi.fn() },
  movimientoInventario: { create: vi.fn() },
  registroAuditoria: { create: vi.fn() },
  registroIdempotencia: { findUnique: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({ prisma: prismaMock, default: prismaMock }));

import request from 'supertest';
import { app } from '../../../app.js';
import { InventoryLedgerService } from '../../04-inventario/InventoryLedgerService.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';

const permisos = {
  permVender: false,
  permCaja: false,
  permDescuentoManual: false,
  permAnularVentas: false,
  permDevoluciones: false,
  permVerInventario: false,
  permSolicitarTraslado: false,
  permRecibirTraslado: false,
  permVerOtrosPuntos: false,
  permPedidosWeb: false,
  permVerVentasPunto: false,
};
const usuarios: Record<number, unknown> = {
  1: { id: 1, correo: 'admin@forma.com', rol: 'ADMIN', ubicacionId: 1, activo: true, topeDescuentoPorc: 100, ...permisos },
};
const ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const central = { id: 1, nombre: 'Bodega Central', tipo: 'CENTRAL', activa: true };

const lineas = [
  { id: 71, compraId: 7, varianteId: 30, cantidadPedida: 5, cantidadRecibida: null, costoUnitarioCop: 12000, observacionDiferencia: null },
  { id: 72, compraId: 7, varianteId: 10, cantidadPedida: 20, cantidadRecibida: null, costoUnitarioCop: null, observacionDiferencia: null },
];
const compra = (estado = 'PEDIDA', id = 7) => ({ id, proveedorNombre: 'Textiles QA', estado, version: 1, lineas });

const sqlDe = (call: unknown[]) => (call[0] as TemplateStringsArray).join('?');

describe('QA SP2-02 · Compras a proveedor (casos complementarios)', () => {
  let ledgerSpy: MockInstance<typeof InventoryLedgerService.registrarMovimiento>;

  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();
    ledgerSpy = vi
      .spyOn(InventoryLedgerService, 'registrarMovimiento')
      .mockResolvedValue({ id: 1n, saldoResultante: 25, disponibleResultante: 25 });
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.ubicacion.findFirst.mockResolvedValue(central);
    prismaMock.registroAuditoria.create.mockResolvedValue({});
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.lineaCompra.update.mockResolvedValue({});
    prismaMock.compraProveedor.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...compra(),
      ...data,
    }));
  });

  afterEach(() => ledgerSpy.mockRestore());

  it('QA-1. Recibir y cancelar bloquean la fila de la orden con FOR UPDATE ANTES de leer su estado', async () => {
    prismaMock.compraProveedor.findUnique.mockResolvedValue(compra());
    await request(app).post('/api/compras/7/recibir').set('Authorization', ADMIN).set('Idempotency-Key', 'qa-sp202-1').send({});
    expect(sqlDe(prismaMock.$queryRaw.mock.calls[0]!)).toMatch(/FROM "CompraProveedor" WHERE id = \? FOR UPDATE/);
    expect(prismaMock.$queryRaw.mock.invocationCallOrder[0]!).toBeLessThan(
      prismaMock.compraProveedor.findUnique.mock.invocationCallOrder[0]!,
    );

    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.compraProveedor.findUnique.mockResolvedValue({ id: 7, estado: 'PEDIDA' });
    await request(app).patch('/api/compras/7/cancelar').set('Authorization', ADMIN).send({});
    expect(sqlDe(prismaMock.$queryRaw.mock.calls[0]!)).toMatch(/FOR UPDATE/);
  });

  it('QA-2. Cancelar una orden ya CANCELADA o RECIBIDA → 422 sin tocar Kardex', async () => {
    for (const estado of ['CANCELADA', 'RECIBIDA']) {
      prismaMock.compraProveedor.findUnique.mockResolvedValue({ id: 7, estado });
      const res = await request(app).patch('/api/compras/7/cancelar').set('Authorization', ADMIN).send({});
      expect(res.status).toBe(422);
    }
    expect(ledgerSpy).not.toHaveBeenCalled();
    expect(prismaMock.compraProveedor.update).not.toHaveBeenCalled();
  });

  it('QA-3. Recepción con todas las cantidades en 0 → RECIBIDA sin ningún movimiento de Kardex', async () => {
    prismaMock.compraProveedor.findUnique.mockResolvedValue(compra());
    const res = await request(app)
      .post('/api/compras/7/recibir')
      .set('Authorization', ADMIN)
      .set('Idempotency-Key', 'qa-sp202-3')
      .send({
        lineas: [
          { lineaId: 71, cantidadRecibida: 0, observacionDiferencia: 'Proveedor no envió' },
          { lineaId: 72, cantidadRecibida: 0, observacionDiferencia: 'Proveedor no envió' },
        ],
      });
    expect(res.status).toBe(200);
    expect(ledgerSpy).not.toHaveBeenCalled();
    expect(prismaMock.compraProveedor.update.mock.calls[0]![0].data.estado).toBe('RECIBIDA');
  });

  it('QA-4. Cantidad recibida decimal o negativa → 400 (Zod) sin abrir transacción', async () => {
    prismaMock.compraProveedor.findUnique.mockResolvedValue(compra());
    for (const cantidadRecibida of [2.5, -1]) {
      const res = await request(app)
        .post('/api/compras/7/recibir')
        .set('Authorization', ADMIN)
        .set('Idempotency-Key', `qa-sp202-4-${cantidadRecibida}`)
        .send({ lineas: [{ lineaId: 71, cantidadRecibida }, { lineaId: 72, cantidadRecibida: 20 }] });
      expect(res.status).toBe(400);
    }
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('[HALLAZGO] QA-5. Se puede recibir MÁS de lo pedido (999 sobre 20) sin tope ni observación obligatoria', async () => {
    prismaMock.compraProveedor.findUnique.mockResolvedValue(compra());
    const res = await request(app)
      .post('/api/compras/7/recibir')
      .set('Authorization', ADMIN)
      .set('Idempotency-Key', 'qa-sp202-5')
      .send({ lineas: [{ lineaId: 71, cantidadRecibida: 5 }, { lineaId: 72, cantidadRecibida: 999 }] });
    // Comportamiento ACTUAL: 200 e ingreso de 999 unidades a Central.
    expect(res.status).toBe(200);
    expect(ledgerSpy.mock.calls.find((c) => c[1].varianteId === 10)![1].cantidadConSigno).toBe(999);
    // Esperado: rechazar (o exigir observacionDiferencia y aprobación) cuando cantidadRecibida > cantidadPedida.
  });

  it('[HALLAZGO] QA-6. Reutilizar una Idempotency-Key en OTRA orden devuelve el snapshot de la primera y la segunda NO se recibe', async () => {
    // La clave 'clave-reusada' ya se usó para recibir la OC #7
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue({
      idempotencyKey: 'clave-reusada',
      usuarioId: 1,
      endpoint: '/api/compras/7/recibir',
      statusCode: 200,
      responseBody: { ok: true, datos: { id: 7, estado: 'RECIBIDA' } },
    });
    const res = await request(app)
      .post('/api/compras/8/recibir')
      .set('Authorization', ADMIN)
      .set('Idempotency-Key', 'clave-reusada')
      .send({});
    // Comportamiento ACTUAL: 200 con la OC #7; la OC #8 sigue PEDIDA y el cliente cree que la recibió.
    expect(res.status).toBe(200);
    expect(res.body.datos.id).toBe(7);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    // Esperado: el middleware compara `endpoint` (y, idealmente, una huella del cuerpo) y responde 422 si no coincide.
  });

  it('QA-7. DELETE /api/compras/:id → 400 orientando a cancelar (RN-GEN-07) y sin tocar la BD', async () => {
    const res = await request(app).delete('/api/compras/7').set('Authorization', ADMIN);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/cancel/i);
    expect(prismaMock.compraProveedor.update).not.toHaveBeenCalled();
  });
});
