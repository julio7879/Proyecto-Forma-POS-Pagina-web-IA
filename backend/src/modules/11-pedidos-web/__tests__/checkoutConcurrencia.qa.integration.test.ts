import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../config/database.js';
import { PedidoWebService } from '../pedidoWeb.service.js';
import type { UserAuthSnapshot } from '../../../shared/middlewares/authPermission.js';

/**
 * QA Issue #48 (PR #47, SP4-01) — Checkout web contra PostgreSQL REAL.
 * ▸ Solo corre con RUN_DB_TESTS=1 (en la suite normal queda "skipped").
 * ▸ BD de desarrollo con migraciones + seed (admin@forma.com, municipio 54001 con atendidoWeb, categoría "Ropa").
 * ▸ Crea una sede QA-SP401-<ts> en Cúcuta y variantes propias con stock SOLO en esa sede.
 *   Crea pedidos web reales de prueba (cliente = admin). No borra nada.
 */
const habilitado = process.env.RUN_DB_TESTS === '1';
const T = 60_000;

describe.skipIf(!habilitado)('QA SP4-01 · Checkout web concurrente (PostgreSQL real)', () => {
  const run = Date.now();
  let cliente!: UserAuthSnapshot;
  let sedeId = 0;
  let productoId = 0;
  let n = 0;

  async function varianteConStock(fisico: number) {
    n += 1;
    const v = await prisma.variante.create({
      data: { productoId, sku: `QA-SP401-${run}-${n}`, talla: 'U', color: 'QA', precioVentaCop: 50000 },
    });
    await prisma.saldoStock.create({ data: { ubicacionId: sedeId, varianteId: v.id, fisico } });
    return v.id;
  }

  const pedido = (varianteId: number, metodoPago: 'TRANSFERENCIA' | 'CONTRAENTREGA' = 'TRANSFERENCIA') => ({
    municipioDestinoId: '54001',
    direccionEntrega: 'Calle QA # 1-23',
    destinatarioNombre: 'Cliente QA',
    destinatarioTelefono: '3001234567',
    metodoPago,
    lineas: [{ varianteId, cantidad: 1 }],
  });

  beforeAll(async () => {
    const u = await prisma.usuario.findUniqueOrThrow({ where: { correo: 'admin@forma.com' } });
    cliente = {
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
    const s = await prisma.ubicacion.create({
      data: { nombre: `QA-SP401-${run}`, tipo: 'PUNTO_VENTA', municipioDaneId: '54001', direccion: 'QA SP4-01', prioridadDespacho: 99 },
    });
    sedeId = s.id;
    const categoria = await prisma.categoria.findUniqueOrThrow({ where: { nombre: 'Ropa' } });
    const p = await prisma.producto.create({
      data: { nombre: `QA SP4-01 ${run}`, slug: `qa-sp401-${run}`, descripcion: 'QA checkout concurrente', categoriaId: categoria.id },
    });
    productoId = p.id;
  }, T);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('INT-1 · CA-38/CA-39: checkout TRANSFERENCIA reserva blanda (RESERVA_WEB) y fija TTL de 24 h; CONTRAENTREGA sin TTL', async () => {
    const v1 = await varianteConStock(3);
    const antes = Date.now();
    const p1 = await PedidoWebService.checkout(pedido(v1, 'TRANSFERENCIA'), cliente);
    expect(p1.ubicacionAsignadaId).toBe(sedeId);
    const ttl = p1.reservaExpiraEn!.getTime() - antes;
    expect(ttl).toBeGreaterThanOrEqual(24 * 3600_000 - 5_000);
    expect(ttl).toBeLessThanOrEqual(24 * 3600_000 + 60_000);

    const saldo = await prisma.saldoStock.findUniqueOrThrow({ where: { ubicacionId_varianteId: { ubicacionId: sedeId, varianteId: v1 } } });
    expect(saldo.reservadoBlando).toBe(1);
    expect(
      await prisma.movimientoInventario.count({ where: { documentoTipo: 'PEDIDO_WEB', documentoId: p1.id, tipo: 'RESERVA_WEB' } }),
    ).toBe(1);

    const v2 = await varianteConStock(3);
    const p2 = await PedidoWebService.checkout(pedido(v2, 'CONTRAENTREGA'), cliente);
    expect(p2.reservaExpiraEn).toBeNull();
  }, T);

  it('INT-2 · Dos clientes compran la ÚLTIMA unidad a la vez → 1 pedido, 1 rechazo, reservadoBlando = 1 (nunca sobreventa)', async () => {
    const v = await varianteConStock(1);
    const r = await Promise.allSettled([
      PedidoWebService.checkout(pedido(v), cliente),
      PedidoWebService.checkout(pedido(v), cliente),
    ]);
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    const saldo = await prisma.saldoStock.findUniqueOrThrow({ where: { ubicacionId_varianteId: { ubicacionId: sedeId, varianteId: v } } });
    expect(saldo.reservadoBlando).toBe(1);
  }, T);

  it('INT-3 · [HALLAZGO] 5 checkouts simultáneos de productos DISTINTOS deben pasar todos (consecutivo PED-AAAA-NNNNNN por count()+1)', async () => {
    const vs = await Promise.all([1, 2, 3, 4, 5].map(() => varianteConStock(5)));
    const r = await Promise.allSettled(vs.map((v) => PedidoWebService.checkout(pedido(v), cliente)));
    const rechazos = r.filter((x): x is PromiseRejectedResult => x.status === 'rejected').map((x) => String(x.reason?.message ?? x.reason));
    // Esperado: 5/5. Si falla con "Unique constraint ... referenciaLegible" (P2002 → 409) se confirma el hallazgo:
    // el consecutivo se calcula con pedidoWeb.count() + 1 sin bloqueo ni secuencia, y dos checkouts concurrentes chocan.
    expect(rechazos, rechazos.join(' | ')).toEqual([]);
  }, T);
});
