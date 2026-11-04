/**
 * Pruebas QA complementarias (Issue #54 / PR #53, SP4-03).
 * Mismo arnés que noPuedoDespachar.test.ts (Prisma mockeado). Verifican lo que la suite
 * original no comprueba: movimientos reales de Kardex (LIBERACION_RESERVA_WEB / RESERVA_WEB),
 * flags del pedido, custodia sin nueva reserva, alerta al admin, estados REALES del enum, y
 * DOCUMENTAN el hallazgo del estado ENVIADO (ver docs/qa/SP4-03/README.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn() },
  ubicacion: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
  municipioDane: { findUnique: vi.fn(), findMany: vi.fn() },
  excepcionTarifaEnvio: { findMany: vi.fn() },
  saldoStock: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  pedidoWeb: { findUnique: vi.fn(), update: vi.fn() },
  historialEstadoPedidoWeb: { create: vi.fn() },
  movimientoInventario: { create: vi.fn() },
  registroAuditoria: { create: vi.fn() },
  registroIdempotencia: { findUnique: vi.fn(), create: vi.fn() },
  variante: { updateMany: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({ prisma: prismaMock, default: prismaMock }));

import request from 'supertest';
import { app } from '../../../app.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';

const permisosBase = {
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
  1: { id: 1, correo: 'admin@forma.com', rol: 'ADMIN', ubicacionId: null, activo: true, topeDescuentoPorc: 0, ...permisosBase },
  2: {
    id: 2,
    correo: 'vendedor.sede10@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 10,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
    permPedidosWeb: true,
  },
};

const ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const VEND10 = `Bearer ${generateToken({ userId: 2, correo: 'vendedor.sede10@forma.com', rol: 'VENDEDOR' })}`;

const pedidoBase = {
  id: 100,
  referenciaLegible: 'PED-2026-000001',
  clienteId: 5,
  ubicacionAsignadaId: 10,
  tieneIncidenciaStock: false,
  tieneReservaActiva: true,
  estadoPedido: 'RECIBIDO',
  estadoPago: 'PENDIENTE',
  metodoPago: 'TRANSFERENCIA',
  municipioDestinoId: '54001',
  ubicacionAsignada: { id: 10, nombre: 'Tienda Cúcuta Centro', tipo: 'PUNTO_VENTA', despachaWeb: true, activa: true },
  municipioDestino: { codigoDane: '54001', departamentoId: '54', departamento: { regionId: 1 }, atendidoWeb: true },
  lineas: [{ id: 1, pedidoId: 100, varianteId: 501, cantidad: 2, precioListaUnitarioCop: 50000 }],
};

const sede20 = {
  id: 20,
  nombre: 'Tienda Bucaramanga',
  activa: true,
  despachaWeb: true,
  prioridadDespacho: 30,
  municipio: { codigoDane: '68001', departamentoId: '68', departamento: { regionId: 1 }, atendidoWeb: true },
};

const central = { id: 1, nombre: 'Bodega Central', tipo: 'CENTRAL', activa: true };

let contador = 0;
const reportar = (token = ADMIN, body: object = { varianteIdsAfectadas: [501], motivo: 'Prenda con mancha en sede' }) =>
  request(app)
    .post('/api/pedidos-web/100/no-puedo-despachar')
    .set('Authorization', token)
    .set('Idempotency-Key', `qa-sp403-${++contador}`)
    .send(body);

const movimientos = () =>
  prismaMock.movimientoInventario.create.mock.calls.map((c) => {
    const d = (c[0] as { data: { tipo: string; ubicacionId: number; varianteId: number; cantidadConSigno: number } }).data;
    return { tipo: d.tipo, ubicacionId: d.ubicacionId, varianteId: d.varianteId, cantidad: d.cantidadConSigno };
  });

describe('QA SP4-03 · No puedo despachar (casos complementarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoBase);
    prismaMock.pedidoWeb.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...pedidoBase,
      ...data,
    }));
    prismaMock.ubicacion.findMany.mockResolvedValue([]);
    prismaMock.ubicacion.findFirst.mockResolvedValue(central);
    prismaMock.saldoStock.findMany.mockResolvedValue([]);
    prismaMock.saldoStock.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.excepcionTarifaEnvio.findMany.mockResolvedValue([]);
    prismaMock.historialEstadoPedidoWeb.create.mockResolvedValue({});
    prismaMock.registroAuditoria.create.mockResolvedValue({});
    prismaMock.variante.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.movimientoInventario.create.mockResolvedValue({ id: 1n });
    // Bloqueo FOR UPDATE del Kardex: devuelve una fila coherente para la sede/variante pedida
    prismaMock.$queryRaw.mockImplementation(async (_s: unknown, ubicacionId: number, varianteId: number) => [
      { id: 1, ubicacionId, varianteId, fisico: 10, reservadoBlando: 2, reservadoDuro: 0, noVendible: 0, bloqueadoDespachoWeb: false },
    ]);
    prismaMock.saldoStock.update.mockResolvedValue({ fisico: 10, reservadoBlando: 2, reservadoDuro: 0 });
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
  });

  it('QA-1. Reasignación (CA-43): Kardex = LIBERACION_RESERVA_WEB −2 en sede 10 + RESERVA_WEB +2 en sede 20; flags correctos', async () => {
    prismaMock.ubicacion.findMany.mockResolvedValueOnce([sede20]);
    prismaMock.saldoStock.findMany.mockResolvedValueOnce([
      { ubicacionId: 20, varianteId: 501, fisico: 10, reservadoBlando: 0, reservadoDuro: 0, bloqueadoDespachoWeb: false },
    ]);

    const res = await reportar(VEND10);

    expect(res.status).toBe(200);
    expect(res.body.reasignado).toBe(true);
    expect(movimientos()).toEqual(
      expect.arrayContaining([
        { tipo: 'LIBERACION_RESERVA_WEB', ubicacionId: 10, varianteId: 501, cantidad: -2 },
        { tipo: 'RESERVA_WEB', ubicacionId: 20, varianteId: 501, cantidad: 2 },
      ]),
    );
    expect(movimientos()).toHaveLength(2);
    expect(prismaMock.pedidoWeb.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ubicacionAsignadaId: 20, tieneIncidenciaStock: false, tieneReservaActiva: true }),
      }),
    );
  });

  it('QA-2. Las sedes candidatas excluyen la sede que reportó (no se reasigna a sí misma)', async () => {
    await reportar();
    expect(prismaMock.ubicacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: 10 }, activa: true, despachaWeb: true }) }),
    );
  });

  it('QA-3. Una sede candidata con el SKU en cuarentena se descarta → custodia en Central', async () => {
    prismaMock.ubicacion.findMany.mockResolvedValueOnce([sede20]);
    prismaMock.saldoStock.findMany.mockResolvedValueOnce([
      { ubicacionId: 20, varianteId: 501, fisico: 10, reservadoBlando: 0, reservadoDuro: 0, bloqueadoDespachoWeb: true },
    ]);
    const res = await reportar();
    expect(res.status).toBe(200);
    expect(res.body.enCustodiaCentral).toBe(true);
  });

  it('QA-4. Custodia (CA-62): pedido a Central, incidencia=true, reserva=false, SOLO liberación en Kardex (sin RESERVA_WEB)', async () => {
    const res = await reportar();
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ reasignado: false, enCustodiaCentral: true });
    expect(prismaMock.pedidoWeb.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ubicacionAsignadaId: 1, tieneIncidenciaStock: true, tieneReservaActiva: false }),
      }),
    );
    expect(movimientos()).toEqual([{ tipo: 'LIBERACION_RESERVA_WEB', ubicacionId: 10, varianteId: 501, cantidad: -2 }]);
  });

  it('QA-5. Custodia registra auditoría CUSTODIA_CENTRAL_INCIDENCIA_STOCK con alertaAdmin=true (RF-REP-02)', async () => {
    await reportar();
    expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accion: 'CUSTODIA_CENTRAL_INCIDENCIA_STOCK',
          datosMinimos: expect.objectContaining({ alertaAdmin: true, sedePreviaId: 10, centralId: 1 }),
        }),
      }),
    );
  });

  it('QA-6. Sin Bodega Central activa → 409 y el pedido NUNCA queda sin sede (no se actualiza)', async () => {
    prismaMock.ubicacion.findFirst.mockResolvedValue(null);
    const res = await reportar();
    expect(res.status).toBe(409);
    expect(prismaMock.pedidoWeb.update).not.toHaveBeenCalled();
  });

  it('QA-7. Pedido ya en custodia (sin reserva activa) reportado de nuevo → no libera nada en Kardex (no hay doble liberación)', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue({
      ...pedidoBase,
      ubicacionAsignadaId: 1,
      tieneReservaActiva: false,
      tieneIncidenciaStock: true,
      ubicacionAsignada: { ...central, despachaWeb: true },
    });
    const res = await reportar();
    expect(res.status).toBe(200);
    expect(movimientos()).toEqual([]);
    expect(res.body.enCustodiaCentral).toBe(true); // vuelve a Central: no hay bucle ni sede null
  });

  it('QA-8. La cuarentena marca SOLO las variantes reportadas, no todas las del pedido', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue({
      ...pedidoBase,
      lineas: [...pedidoBase.lineas, { id: 2, pedidoId: 100, varianteId: 777, cantidad: 1, precioListaUnitarioCop: 30000 }],
    });
    await reportar(ADMIN, { varianteIdsAfectadas: [777], motivo: 'Solo la gorra está dañada' });
    const marcadas = prismaMock.saldoStock.updateMany.mock.calls.map((c) => (c[0] as { where: { varianteId: number } }).where.varianteId);
    expect(marcadas).toEqual([777]);
  });

  it('QA-9. Estado real NO_ENTREGADO → 422', async () => {
    prismaMock.pedidoWeb.findUnique.mockResolvedValue({ ...pedidoBase, estadoPedido: 'NO_ENTREGADO' });
    expect((await reportar()).status).toBe(422);
  });

  it('QA-10. Estados reales ENTREGADO y CANCELADO → 422', async () => {
    for (const estadoPedido of ['ENTREGADO', 'CANCELADO']) {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue({ ...pedidoBase, estadoPedido });
      expect((await reportar()).status).toBe(422);
    }
  });

  it('[HALLAZGO] QA-11. Un pedido ENVIADO (ya despachado) NO se rechaza: se pone en cuarentena y se reasigna/custodia', async () => {
    // El enum EstadoPedidoWeb no tiene "DESPACHADO"; el estado real es ENVIADO y el servicio no lo bloquea.
    prismaMock.pedidoWeb.findUnique.mockResolvedValue({ ...pedidoBase, estadoPedido: 'ENVIADO', tieneReservaActiva: false });
    const res = await reportar();
    // Comportamiento ACTUAL (defecto): 200. Esperado tras la corrección: 422.
    expect(res.status).toBe(200);
    expect(prismaMock.pedidoWeb.update).toHaveBeenCalled();
  });
});
