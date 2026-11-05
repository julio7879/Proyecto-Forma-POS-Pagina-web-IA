import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { prisma } from '../../../config/database.js';
import { app } from '../../../app.js';
import { generateToken } from '../../../shared/middlewares/authPermission.js';
import { CompraService } from '../compra.service.js';

/**
 * QA Issue #67 (PR #66, SP2-02) + matriz SP2-07 sección 2 — Compras contra PostgreSQL REAL.
 * ▸ Solo corre con RUN_DB_TESTS=1 (en la suite normal queda "skipped").
 * ▸ BD de desarrollo con migraciones + seed (admin@forma.com, categoría "Ropa", Bodega Central).
 * ▸ Crea un producto y variantes QA-SP202-<ts> y órdenes de compra reales que ingresan stock
 *   SOLO de esas variantes en la Bodega Central. No borra nada (Kardex inmutable).
 */
const habilitado = process.env.RUN_DB_TESTS === '1';
const T = 60_000;

describe.skipIf(!habilitado)('QA SP2-02 · Recepción de compras concurrente e idempotente (PostgreSQL real)', () => {
  const run = Date.now();
  let adminId = 0;
  let token = '';
  let centralId = 0;
  let productoId = 0;
  let n = 0;

  async function nuevaVariante() {
    n += 1;
    const v = await prisma.variante.create({
      data: { productoId, sku: `QA-SP202-${run}-${n}`, talla: 'U', color: 'QA', precioVentaCop: 30000 },
    });
    return v.id;
  }

  const fisicoCentral = async (varianteId: number) =>
    (await prisma.saldoStock.findUnique({ where: { ubicacionId_varianteId: { ubicacionId: centralId, varianteId } } }))?.fisico ?? 0;

  const movimientosCompra = (compraId: number) =>
    prisma.movimientoInventario.count({ where: { documentoTipo: 'COMPRA', documentoId: compraId, tipo: 'COMPRA_RECIBIDA' } });

  beforeAll(async () => {
    const admin = await prisma.usuario.findUniqueOrThrow({ where: { correo: 'admin@forma.com' } });
    adminId = admin.id;
    token = `Bearer ${generateToken({ userId: admin.id, correo: admin.correo, rol: 'ADMIN' })}`;
    centralId = (await prisma.ubicacion.findFirstOrThrow({ where: { tipo: 'CENTRAL' } })).id;
    const categoria = await prisma.categoria.findUniqueOrThrow({ where: { nombre: 'Ropa' } });
    productoId = (
      await prisma.producto.create({
        data: { nombre: `QA SP2-02 ${run}`, slug: `qa-sp202-${run}`, descripcion: 'QA compras', categoriaId: categoria.id },
      })
    ).id;
  }, T);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('INT-1 · Orden nueva queda PEDIDA y NO toca SaldoStock ni Kardex (RN-COM-02)', async () => {
    const v = await nuevaVariante();
    const oc = await CompraService.crear({ proveedorNombre: 'Proveedor QA', lineas: [{ varianteId: v, cantidadPedida: 7 }] }, adminId);
    expect(oc.estado).toBe('PEDIDA');
    expect(await fisicoCentral(v)).toBe(0);
    expect(await movimientosCompra(oc.id)).toBe(0);
  }, T);

  it('INT-2 · 5 recepciones simultáneas con llaves DISTINTAS → 1 × 200, 4 × 422, stock +12 una sola vez (RN-COM-03, CA-08)', async () => {
    const v = await nuevaVariante();
    const oc = await CompraService.crear({ proveedorNombre: 'Proveedor QA', lineas: [{ varianteId: v, cantidadPedida: 12 }] }, adminId);

    const res = await Promise.all(
      [1, 2, 3, 4, 5].map((i) =>
        request(app).post(`/api/compras/${oc.id}/recibir`).set('Authorization', token).set('Idempotency-Key', `qa-sp202-${run}-d${i}`).send({}),
      ),
    );
    const codigos = res.map((r) => r.status).sort();
    expect(codigos).toEqual([200, 422, 422, 422, 422]);
    expect(await fisicoCentral(v)).toBe(12);
    expect(await movimientosCompra(oc.id)).toBe(1);
  }, T);

  it('INT-3 · Ráfaga de 5 peticiones con la MISMA Idempotency-Key → ningún 500, stock +8 una sola vez; un reintento posterior devuelve el snapshot (200)', async () => {
    const v = await nuevaVariante();
    const oc = await CompraService.crear({ proveedorNombre: 'Proveedor QA', lineas: [{ varianteId: v, cantidadPedida: 8 }] }, adminId);
    const key = `qa-sp202-${run}-same`;

    const res = await Promise.all(
      [1, 2, 3, 4, 5].map(() =>
        request(app).post(`/api/compras/${oc.id}/recibir`).set('Authorization', token).set('Idempotency-Key', key).send({}),
      ),
    );
    res.forEach((r) => expect([200, 422]).toContain(r.status));
    expect(res.filter((r) => r.status === 200).length).toBeGreaterThanOrEqual(1);
    expect(await fisicoCentral(v)).toBe(8);
    expect(await movimientosCompra(oc.id)).toBe(1);

    const reintento = await request(app).post(`/api/compras/${oc.id}/recibir`).set('Authorization', token).set('Idempotency-Key', key).send({});
    expect(reintento.status).toBe(200);
    expect(reintento.body.datos.estado).toBe('RECIBIDA');
    expect(await fisicoCentral(v)).toBe(8);
  }, T);

  it('INT-4 · Cancelar y recibir a la vez la misma orden → exactamente una gana; si gana cancelar, el stock no cambia', async () => {
    const v = await nuevaVariante();
    const oc = await CompraService.crear({ proveedorNombre: 'Proveedor QA', lineas: [{ varianteId: v, cantidadPedida: 4 }] }, adminId);

    const [rec, can] = await Promise.all([
      request(app).post(`/api/compras/${oc.id}/recibir`).set('Authorization', token).set('Idempotency-Key', `qa-sp202-${run}-rc`).send({}),
      request(app).patch(`/api/compras/${oc.id}/cancelar`).set('Authorization', token).send({ motivo: 'QA carrera' }),
    ]);
    expect([rec.status, can.status].sort()).toEqual([200, 422]);
    const final = await prisma.compraProveedor.findUniqueOrThrow({ where: { id: oc.id } });
    expect(await fisicoCentral(v)).toBe(final.estado === 'RECIBIDA' ? 4 : 0);
  }, T);
});
