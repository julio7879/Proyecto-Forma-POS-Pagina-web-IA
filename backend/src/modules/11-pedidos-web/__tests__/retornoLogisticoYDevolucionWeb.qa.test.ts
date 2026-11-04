/**
 * Pruebas QA complementarias (Issue #57 / PR #56, SP4-06).
 * Mismo enfoque que retornoLogisticoYDevolucionWeb.test.ts (Prisma mockeado) + pruebas puras de ColombiaTime.
 * Las pruebas [HALLAZGO] verifican el comportamiento ACTUAL defectuoso (ver docs/qa/SP4-06/README.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn() },
  ubicacion: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
  saldoStock: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), upsert: vi.fn(), create: vi.fn() },
  pedidoWeb: { findUnique: vi.fn(), update: vi.fn() },
  lineaPedidoWeb: { findMany: vi.fn(), update: vi.fn() },
  devolucionComercialWeb: { create: vi.fn() },
  festivoColombia: { findMany: vi.fn() },
  historialEstadoPedidoWeb: { create: vi.fn() },
  movimientoInventario: { create: vi.fn() },
  registroAuditoria: { create: vi.fn() },
  registroIdempotencia: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  variante: { findUnique: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({ prisma: prismaMock, default: prismaMock }));

import request from 'supertest';
import { app } from '../../../app.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';
import { ColombiaTime } from '../../../shared/domain/ColombiaTime.js';

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
  permPedidosWeb: true,
  permVerVentasPunto: false,
};
const usuarios: Record<number, unknown> = {
  1: { id: 1, correo: 'admin@forma.com', rol: 'ADMIN', ubicacionId: null, activo: true, topeDescuentoPorc: 0, ...permisos },
};
const ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;

const central = { id: 1, nombre: 'Bodega Central', tipo: 'CENTRAL', activa: true };

// Pedido contraentrega rechazado en puerta
const pedidoRetorno = {
  id: 300,
  referenciaLegible: 'PED-2026-000300',
  metodoPago: 'CONTRAENTREGA',
  estadoPedido: 'ENVIADO',
  estadoPago: 'PENDIENTE',
  ventaReconocida: false,
  ubicacionAsignadaId: 2,
  lineas: [
    { id: 31, varianteId: 501, cantidad: 2, variante: {} },
    { id: 32, varianteId: 777, cantidad: 1, variante: {} },
  ],
};

// Pedido pagado y entregado hoy: 3 camisas $50.000 con $15.000 de descuento (neto $135.000) + 1 cosmético $40.000; flete $14.000
const pedidoDevolucion = {
  id: 200,
  referenciaLegible: 'PED-2026-000200',
  metodoPago: 'TRANSFERENCIA',
  estadoPedido: 'ENTREGADO',
  estadoPago: 'PAGADO',
  ventaReconocida: true,
  fechaEntrega: new Date(),
  fechaEnvio: new Date(),
  fechaCreacion: new Date(),
  ubicacionAsignadaId: 2,
  ubicacionDespachoReconocidoId: 2,
  costoEnvioCop: 14000,
  lineas: [
    { id: 11, varianteId: 501, cantidad: 3, cantidadDevueltaAcum: 0, netoPagadoLineaCop: 135000, reembolsadoAcumuladoCop: 0, esReintegrableSnapshot: true, variante: { producto: {} } },
    { id: 12, varianteId: 777, cantidad: 1, cantidadDevueltaAcum: 0, netoPagadoLineaCop: 40000, reembolsadoAcumuladoCop: 0, esReintegrableSnapshot: false, variante: { producto: {} } },
  ],
};

let n = 0;
const post = (ruta: string, body: object) =>
  request(app).post(`/api/pedidos-web/${ruta}`).set('Authorization', ADMIN).set('Idempotency-Key', `qa-sp406-${++n}`).send(body);

const movimientos = () =>
  prismaMock.movimientoInventario.create.mock.calls.map((c) => {
    const d = (c[0] as { data: Record<string, unknown> }).data;
    return { tipo: d.tipo, ubicacionId: d.ubicacionId, varianteId: d.varianteId, cantidad: d.cantidadConSigno, afecta: d.afectaSaldo };
  });

describe('QA SP4-06 · Retorno logístico vs Devolución comercial web', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.registroIdempotencia.upsert.mockResolvedValue({});
    prismaMock.ubicacion.findUnique.mockResolvedValue(central);
    prismaMock.festivoColombia.findMany.mockResolvedValue([]);
    prismaMock.pedidoWeb.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 1, ...data }));
    prismaMock.lineaPedidoWeb.update.mockResolvedValue({});
    prismaMock.devolucionComercialWeb.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 9, ...data }));
    prismaMock.historialEstadoPedidoWeb.create.mockResolvedValue({});
    prismaMock.registroAuditoria.create.mockResolvedValue({});
    prismaMock.variante.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.movimientoInventario.create.mockResolvedValue({ id: 1n });
    prismaMock.$queryRaw.mockImplementation(async (_s: unknown, ubicacionId: number, varianteId: number) => [
      { id: 1, ubicacionId, varianteId, fisico: 10, reservadoBlando: 0, reservadoDuro: 0, noVendible: 0, bloqueadoDespachoWeb: false },
    ]);
    prismaMock.saldoStock.update.mockResolvedValue({ fisico: 10, reservadoBlando: 0, reservadoDuro: 0 });
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
  });

  // ─────────── Retorno logístico (RF-WEB-07, CA-64, QA-020) ───────────
  it('QA-1. Retorno total: NO_ENTREGADO + ANULADO, reingreso VENDIBLE en Central y NINGUNA DevolucionComercialWeb (RN-REP-01)', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoRetorno);
    const res = await post('300/retorno-logistico', { ubicacionReingresoId: 1, motivo: 'Cliente rechazó en puerta' });
    expect(res.status).toBe(200);
    expect(prismaMock.pedidoWeb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estadoPedido: 'NO_ENTREGADO', estadoPago: 'ANULADO' }) }),
    );
    expect(prismaMock.devolucionComercialWeb.create).not.toHaveBeenCalled();
    expect(movimientos()).toEqual([
      { tipo: 'RETORNO_LOGISTICO_WEB_VENDIBLE', ubicacionId: 1, varianteId: 501, cantidad: 2, afecta: 'FISICO' },
      { tipo: 'RETORNO_LOGISTICO_WEB_VENDIBLE', ubicacionId: 1, varianteId: 777, cantidad: 1, afecta: 'FISICO' },
    ]);
  });

  it('QA-2. Retorno con prenda averiada → RETORNO_LOGISTICO_WEB_NO_VENDIBLE en saldo NO_VENDIBLE', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoRetorno);
    const res = await post('300/retorno-logistico', {
      ubicacionReingresoId: 1,
      motivo: 'Caja mojada en trayecto',
      lineas: [
        { varianteId: 501, cantidad: 2, condicion: 'NO_VENDIBLE' },
        { varianteId: 777, cantidad: 1, condicion: 'VENDIBLE' },
      ],
    });
    expect(res.status).toBe(200);
    expect(movimientos()).toContainEqual({ tipo: 'RETORNO_LOGISTICO_WEB_NO_VENDIBLE', ubicacionId: 1, varianteId: 501, cantidad: 2, afecta: 'NO_VENDIBLE' });
  });

  it('[HALLAZGO] QA-3. Retorno PARCIAL: se aceptan menos unidades de las enviadas y las faltantes desaparecen sin movimiento ni novedad', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoRetorno);
    const res = await post('300/retorno-logistico', {
      ubicacionReingresoId: 1,
      motivo: 'Rechazado en puerta',
      lineas: [{ varianteId: 501, cantidad: 1, condicion: 'VENDIBLE' }],
    });
    // Comportamiento ACTUAL: 200 y solo 1 de las 3 unidades enviadas vuelve al Kardex; el pedido igual queda NO_ENTREGADO.
    expect(res.status).toBe(200);
    expect(movimientos()).toHaveLength(1);
    // Esperado: exigir las 3 unidades o registrar las faltantes como pérdida/novedad trazable.
  });

  // ─────────── Devolución comercial (RF-DEV-04, CA-65, QA-021) ───────────
  it('QA-4. Imputación a origen: reingreso físico en Central (1) pero venta restada a la sede despachadora (2)', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoDevolucion);
    prismaMock.lineaPedidoWeb.findMany.mockResolvedValue(pedidoDevolucion.lineas);
    const res = await post('200/devolucion-comercial', {
      ubicacionReingresoFisicoId: 1,
      lineasDevolucion: [{ lineaId: 11, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }],
      referenciaTransferenciaReembolso: 'NEQUI-QA-1',
      motivo: 'Talla no le quedó',
    });
    expect(res.status).toBe(200);
    expect(prismaMock.devolucionComercialWeb.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ubicacionImputacionVentaId: 2, ubicacionReingresoFisicoId: 1 }),
    });
  });

  it('QA-5. Reembolso parcial respeta el descuento prorrateado (CA-26) y excluye el flete (RN-REP-02): 1 de 3 = $45.000, no $50.000 ni +$14.000', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoDevolucion);
    prismaMock.lineaPedidoWeb.findMany.mockResolvedValue(pedidoDevolucion.lineas);
    await post('200/devolucion-comercial', {
      ubicacionReingresoFisicoId: 1,
      lineasDevolucion: [{ lineaId: 11, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }],
      referenciaTransferenciaReembolso: 'NEQUI-QA-2',
      motivo: 'Talla no le quedó',
    });
    expect(prismaMock.devolucionComercialWeb.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ totalReembolsadoProductosCop: 45000 }),
    });
  });

  it('QA-6. Devolución total: suma exacta $175.000 (sin flete), cosmético forzado a NO_VENDIBLE y pago REEMBOLSADO', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoDevolucion);
    prismaMock.lineaPedidoWeb.findMany.mockResolvedValue(
      pedidoDevolucion.lineas.map((l) => ({ ...l, cantidadDevueltaAcum: l.cantidad })),
    );
    const res = await post('200/devolucion-comercial', {
      ubicacionReingresoFisicoId: 1,
      lineasDevolucion: [
        { lineaId: 11, cantidadDevuelta: 3, condicionFisica: 'VENDIBLE' },
        { lineaId: 12, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }, // cosmético: el cliente dice "vendible"
      ],
      referenciaTransferenciaReembolso: 'NEQUI-QA-3',
      motivo: 'Cliente desistió de la compra',
    });
    expect(res.status).toBe(200);
    expect(prismaMock.devolucionComercialWeb.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ totalReembolsadoProductosCop: 175000 }),
    });
    expect(movimientos()).toContainEqual({
      tipo: 'DEVOLUCION_COMERCIAL_WEB_NO_VENDIBLE',
      ubicacionId: 1,
      varianteId: 777,
      cantidad: 1,
      afecta: 'NO_VENDIBLE',
    });
    expect(prismaMock.pedidoWeb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estadoPago: 'REEMBOLSADO' }) }),
    );
  });

  it('QA-7. Fuera de plazo con autorizadoFueraPlazo=true pero SIN motivoFueraPlazo → 422', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue({ ...pedidoDevolucion, fechaEntrega: new Date('2026-01-02T15:00:00Z') });
    const res = await post('200/devolucion-comercial', {
      ubicacionReingresoFisicoId: 1,
      lineasDevolucion: [{ lineaId: 11, cantidadDevuelta: 1 }],
      referenciaTransferenciaReembolso: 'NEQUI-QA-4',
      motivo: 'Devolución tardía',
      autorizadoFueraPlazo: true,
    });
    expect(res.status).toBe(422);
  });

  it('QA-8. CLIENTE o VENDEDOR no llegan al servicio (requireRole ADMIN) → 403', async () => {
    usuarios[5] = { id: 5, correo: 'c@x.com', rol: 'CLIENTE', ubicacionId: null, activo: true, topeDescuentoPorc: 0, ...permisos };
    const token = `Bearer ${generateToken({ userId: 5, correo: 'c@x.com', rol: 'CLIENTE' })}`;
    const res = await request(app)
      .post('/api/pedidos-web/200/devolucion-comercial')
      .set('Authorization', token)
      .set('Idempotency-Key', 'qa-sp406-cliente')
      .send({});
    expect(res.status).toBe(403);
  });

  it('[HALLAZGO] QA-9. Devolución COMERCIAL sobre un pedido ENVIADO (pagado pero aún no entregado) se acepta', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue({ ...pedidoDevolucion, estadoPedido: 'ENVIADO', fechaEntrega: null });
    prismaMock.lineaPedidoWeb.findMany.mockResolvedValue(pedidoDevolucion.lineas);
    const res = await post('200/devolucion-comercial', {
      ubicacionReingresoFisicoId: 1,
      lineasDevolucion: [{ lineaId: 11, cantidadDevuelta: 1 }],
      referenciaTransferenciaReembolso: 'NEQUI-QA-5',
      motivo: 'Aún no le llega',
    });
    // Comportamiento ACTUAL: 200. La guía del Issue indica que aplica a pedidos ENTREGADO + PAGADO.
    expect(res.status).toBe(200);
  });
});

// ─────────── Plazo de 5 días hábiles (RN-DEV-14) — dominio puro ───────────
describe('QA SP4-06 · ColombiaTime.estaDentroDePlazoHabilesWeb', () => {
  // Entrega: lunes 2 de noviembre de 2026, 10:00 hora Colombia (15:00 UTC)
  const entrega = new Date('2026-11-02T15:00:00Z');
  const dia = (iso: string) => new Date(`${iso}T20:00:00Z`); // 15:00 hora Colombia

  it('QA-10. 5.º día hábil (lunes 9-nov) sigue dentro; 6.º (martes 10-nov) ya no — sin festivos', () => {
    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entrega, [], 5, dia('2026-11-09'))).toBe(true);
    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entrega, [], 5, dia('2026-11-10'))).toBe(false);
  });

  it('QA-11. El festivo del lunes 16-nov-2026 (Independencia de Cartagena) extiende el plazo un día', () => {
    const entregaJueves = new Date('2026-11-12T15:00:00Z');
    // Hábiles: vie 13, (lun 16 festivo), mar 17, mié 18, jue 19, vie 20 → el 20 es el 5.º
    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entregaJueves, ['2026-11-16'], 5, dia('2026-11-20'))).toBe(true);
    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entregaJueves, [], 5, dia('2026-11-20'))).toBe(false); // sin festivos cargados
  });

  it('QA-12. Entrega a las 23:30 hora Colombia cuenta como ESE día (no el siguiente en UTC)', () => {
    const entregaNoche = new Date('2026-11-06T04:30:00Z'); // jueves 5-nov 23:30 en Bogotá
    // Hábiles: vie 6, lun 9, mar 10, mié 11, jue 12 → el 12 es el 5.º; el 13 ya no
    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entregaNoche, [], 5, dia('2026-11-12'))).toBe(true);
    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entregaNoche, [], 5, dia('2026-11-13'))).toBe(false);
  });
});
