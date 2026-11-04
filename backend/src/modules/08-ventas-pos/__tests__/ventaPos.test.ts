import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn() },
  ubicacion: { findUnique: vi.fn(), findFirst: vi.fn() },
  variante: { findMany: vi.fn() },
  sesionCaja: { findFirst: vi.fn(), findUnique: vi.fn() },
  saldoStock: { findUnique: vi.fn(), update: vi.fn() },
  pedidoWeb: { findMany: vi.fn(), update: vi.fn() },
  consecutivoUbicacion: { upsert: vi.fn() },
  ventaPOS: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  movimientoInventario: { create: vi.fn() },
  registroAuditoria: { create: vi.fn() },
  registroIdempotencia: { findUnique: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

import request from 'supertest';
import { app } from '../../../app.js';
import { ColombiaTime } from '../../../shared/domain/ColombiaTime.js';
import { InventoryLedgerService } from '../../04-inventario/InventoryLedgerService.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';

const TOKEN_VENDEDOR = `Bearer ${generateToken({ userId: 2, correo: 'vendedor@forma.com', rol: 'VENDEDOR' })}`;

const usuarios: Record<number, any> = {
  2: {
    id: 2,
    correo: 'vendedor@forma.com',
    rol: 'VENDEDOR',
    activo: true,
    ubicacionId: 2,
    permVender: true,
    permCaja: true,
    permVerVentasPunto: true,
  },
};

const tiendaNorte = { id: 2, nombre: 'Tienda Norte', tipo: 'TIENDA', activa: true, baseCajaCop: 200000 };
const central = { id: 1, nombre: 'Bodega Central', tipo: 'CENTRAL', activa: true };

const variante10 = {
  id: 10,
  sku: 'BLU-L',
  talla: 'L',
  color: 'Blanco',
  precioVentaCop: 50000,
  productoId: 100,
  producto: {
    id: 100,
    nombre: 'Blusa Lino',
    reintegrableEnDevolucion: true,
    categoria: { id: 1, nombre: 'Ropa' },
  },
};

const variante20 = {
  id: 20,
  sku: 'PAN-M',
  talla: 'M',
  color: 'Negro',
  precioVentaCop: 80000,
  productoId: 200,
  producto: {
    id: 200,
    nombre: 'Pantalón Classic',
    reintegrableEnDevolucion: true,
    categoria: { id: 1, nombre: 'Ropa' },
  },
};

describe('Módulo 08: Ventas POS y Preempción Atómica (SP3-02, RF-POS-02, CA-60, CA-61)', () => {
  let ledgerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    ledgerSpy = vi
      .spyOn(InventoryLedgerService, 'registrarMovimiento')
      .mockResolvedValue({ id: 1n, saldoResultante: 10, disponibleResultante: 10 });

    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.ubicacion.findFirst.mockResolvedValue(central);
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 1n });
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.consecutivoUbicacion.upsert.mockResolvedValue({ ultimoNumero: 101 });
  });

  afterEach(() => {
    ledgerSpy.mockRestore();
  });

  describe('POST /api/ventas-pos (RF-POS-02)', () => {
    it('requiere header Idempotency-Key (RN-GEN-08, 400)', async () => {
      const res = await request(app)
        .post('/api/ventas-pos')
        .set('Authorization', TOKEN_VENDEDOR)
        .send({
          ubicacionId: 2,
          lineas: [{ varianteId: 10, cantidad: 1 }],
          pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Idempotency-Key/);
    });

    it('confirma venta POS exitosamente con cálculo de vuelto y consecutivo diferido (201)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 5,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
      });

      prismaMock.variante.findMany.mockResolvedValue([variante10]);

      // Stock disponible en sede 2: fisico = 5, reservadoBlando = 0, reservadoDuro = 0
      prismaMock.saldoStock.findUnique.mockResolvedValue({
        fisico: 5,
        reservadoBlando: 0,
        reservadoDuro: 0,
      });

    prismaMock.ventaPOS.create.mockImplementation(async ({ data }: any) => ({
      id: 1,
      ...data,
      lineas: data.lineas?.create ?? [],
      pagos: data.pagos?.create ?? [],
    }));

      const res = await request(app)
        .post('/api/ventas-pos')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'vta-pos-101')
        .send({
          ubicacionId: 2,
          clienteNombreOpcional: 'Laura Gómez',
          lineas: [{ varianteId: 10, cantidad: 1 }],
          pagos: [
            {
              metodo: 'EFECTIVO',
              montoCop: 50000,
              montoRecibidoEfectivoCop: 100000, // Billete de 100k -> vuelto 50k
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.numeroComprobante).toBe(101);
      expect(res.body.datos.totalNetoProductosCop).toBe(50000);
      expect(res.body.datos.pagos[0].vueltoEfectivoCop).toBe(50000);

      // Verifica movimiento de Kardex (VENTA_POS, -1 en FISICO)
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tipo: 'VENTA_POS',
          ubicacionId: 2,
          varianteId: 10,
          cantidadConSigno: -1,
          afectaSaldo: 'FISICO',
        })
      );
    });

    it('aplica preempción física POS sobre reservadoBlando reubicando el pedido web (CA-60, QA-004, 201)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 5,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
      });

      prismaMock.variante.findMany.mockResolvedValue([variante10]);

      // Stock en sede: físico = 2, reservadoBlando = 2, reservadoDuro = 0 -> disponible = 0
      // Cliente en mostrador compra 1 unidad: toma 1 unidad de reservadoBlando
      prismaMock.saldoStock.findUnique.mockResolvedValue({
        fisico: 2,
        reservadoBlando: 2,
        reservadoDuro: 0,
      });

      prismaMock.pedidoWeb.findMany.mockResolvedValue([
        {
          id: 501,
          referenciaLegible: 'PED-2026-000501',
          ubicacionAsignadaId: 2,
          estadoPedido: 'RECIBIDO',
          tieneReservaActiva: true,
          lineas: [{ varianteId: 10, cantidad: 1 }],
        },
      ]);
      prismaMock.pedidoWeb.update.mockResolvedValue({});
      prismaMock.ventaPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 2,
        ...data,
      }));

      const res = await request(app)
        .post('/api/ventas-pos')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'vta-preempcion-pos')
        .send({
          ubicacionId: 2,
          lineas: [{ varianteId: 10, cantidad: 1 }],
          pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        });

      expect(res.status).toBe(201);

      // Debe haber liberado la reserva blanda del pedido web 501
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tipo: 'LIBERACION_RESERVA_WEB',
          ubicacionId: 2,
          varianteId: 10,
          cantidadConSigno: -1,
          afectaSaldo: 'RESERVADO_BLANDO',
        })
      );

      // Y haber marcado la incidencia en el pedido web
      expect(prismaMock.pedidoWeb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 501 },
          data: expect.objectContaining({ tieneIncidenciaStock: true }),
        })
      );
    });

    it('protege la reserva dura EN_PREPARACION y aborta la venta POS (CA-61, QA-005, 409)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 5,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
      });

      prismaMock.variante.findMany.mockResolvedValue([variante10]);

      // Stock: físico = 1, reservadoBlando = 0, reservadoDuro = 1 (empaquetado)
      prismaMock.saldoStock.findUnique.mockResolvedValue({
        fisico: 1,
        reservadoBlando: 0,
        reservadoDuro: 1,
      });

      const res = await request(app)
        .post('/api/ventas-pos')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'vta-reserva-dura-fallida')
        .send({
          ubicacionId: 2,
          lineas: [{ varianteId: 10, cantidad: 1 }],
          pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/reserva dura protegida/);
      expect(ledgerSpy).not.toHaveBeenCalled();
    });

    it('bloquea la venta POS si la sesión de caja está vencida (RN-CAJ-05, CA-56, 409)', async () => {
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 5,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: '2026-11-01', // sesión del día anterior
      });

      const res = await request(app)
        .post('/api/ventas-pos')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'vta-caja-vencida')
        .send({
          ubicacionId: 2,
          lineas: [{ varianteId: 10, cantidad: 1 }],
          pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/está vencida/);
    });

    it('aplica descuento comercial con prorrateo exacto vía DiscountEngine (201)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 5,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
      });

      // Variante 10: 50k, Variante 20: 80k. Subtotal = 130k.
      // Descuento del 10% = 13.000 COP -> Total = 117.000 COP
      prismaMock.variante.findMany.mockResolvedValue([variante10, variante20]);
      prismaMock.saldoStock.findUnique.mockResolvedValue({
        fisico: 10,
        reservadoBlando: 0,
        reservadoDuro: 0,
      });
      prismaMock.ventaPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 3,
        ...data,
      }));

      const res = await request(app)
        .post('/api/ventas-pos')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'vta-con-descuento')
        .send({
          ubicacionId: 2,
          lineas: [
            { varianteId: 10, cantidad: 1 },
            { varianteId: 20, cantidad: 1 },
          ],
          descuento: {
            tipo: 'PORCENTAJE',
            valor: 10,
            motivoManual: 'Descuento apertura fin de semana',
          },
          pagos: [{ metodo: 'TRANSFERENCIA', montoCop: 117000, referenciaTransferencia: 'NEQUI-88741' }],
        });

      expect(res.status).toBe(201);
      expect(res.body.datos.subtotalListaCop).toBe(130000);
      expect(res.body.datos.descuentoTotalCop).toBe(130000 * 0.1);
      expect(res.body.datos.totalNetoProductosCop).toBe(117000);
    });
  });
});
