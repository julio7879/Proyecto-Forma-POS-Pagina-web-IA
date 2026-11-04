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
  consecutivoUbicacion: { upsert: vi.fn() },
  ventaPOS: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  lineaVentaPOS: { update: vi.fn() },
  devolucionPOS: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  movimientoCaja: { findMany: vi.fn() },
  pagoVentaPOS: { findMany: vi.fn() },
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
const TOKEN_ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;

const usuarios: Record<number, any> = {
  1: {
    id: 1,
    correo: 'admin@forma.com',
    rol: 'ADMIN',
    activo: true,
    ubicacionId: 1,
    permDevoluciones: true,
    permAnularVentas: true,
    permCaja: true,
  },
  2: {
    id: 2,
    correo: 'vendedor@forma.com',
    rol: 'VENDEDOR',
    activo: true,
    ubicacionId: 2,
    permDevoluciones: true,
    permAnularVentas: true,
    permCaja: true,
  },
};

const tiendaNorte = { id: 2, nombre: 'Tienda Norte', tipo: 'TIENDA', activa: true, baseCajaCop: 200000 };

const varianteBlusaM = {
  id: 10,
  sku: 'BLU-M',
  talla: 'M',
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

const varianteBlusaL = {
  id: 11,
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

const varianteCosmetico = {
  id: 20,
  sku: 'COS-LABIAL',
  talla: 'U',
  color: 'Rojo',
  precioVentaCop: 30000,
  productoId: 200,
  producto: {
    id: 200,
    nombre: 'Labial Mate',
    reintegrableEnDevolucion: false, // Prenda/artículo no reintegrable (CA-31)
    categoria: { id: 2, nombre: 'Cosméticos' },
  },
};

describe('Módulo 10: Devoluciones POS, Cambios Atómicos y Anulaciones (SP3-04, RF-DEV-01..03)', () => {
  let ledgerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    ledgerSpy = vi
      .spyOn(InventoryLedgerService, 'registrarMovimiento')
      .mockResolvedValue({ id: 1n, saldoResultante: 10, disponibleResultante: 10 });

    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.ubicacion.findUnique.mockResolvedValue(tiendaNorte);
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 1n });
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.consecutivoUbicacion.upsert.mockResolvedValue({ ultimoNumero: 201 });
    prismaMock.lineaVentaPOS.update.mockResolvedValue({});

    // Mocks de sesión de caja activa por defecto
    const hoy = ColombiaTime.toFechaNegocioColombia();
    prismaMock.sesionCaja.findFirst.mockResolvedValue({
      id: 5,
      ubicacionId: 2,
      estado: 'ABIERTA',
      fechaNegocioColombia: hoy,
      baseContadaCop: 200000,
    });
    prismaMock.pagoVentaPOS.findMany.mockResolvedValue([]);
    prismaMock.devolucionPOS.findMany.mockResolvedValue([]);
    prismaMock.movimientoCaja.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    ledgerSpy.mockRestore();
  });

  describe('1. Devolución POS normal dentro de 5 días con reembolso prorrateado (CA-26, CA-63, 201)', () => {
    it('liquida reembolso con el valor neto pagado prorrateado y suma a FISICO en Kardex', async () => {
      // Venta emitida hace 2 días: 1 Blusa a $50.000 con descuento $10.000 -> pagó $40.000 COP neto
      const hace2Dias = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const ventaOriginal = {
        id: 50,
        numeroComprobante: 1001,
        ubicacionId: 2,
        sesionCajaId: 5,
        estado: 'COMPLETADA',
        fechaHora: hace2Dias,
        fechaVentaRaiz: hace2Dias,
        clienteNombreOpcional: 'María López',
        lineas: [
          {
            id: 101,
            ventaPosId: 50,
            varianteId: 10,
            productoIdSnapshot: 100,
            nombreProductoSnapshot: 'Blusa Lino',
            skuSnapshot: 'BLU-M',
            tallaSnapshot: 'M',
            colorSnapshot: 'Blanco',
            esReintegrableSnapshot: true,
            cantidadVendida: 1,
            cantidadDevueltaAcum: 0,
            precioListaUnitarioCop: 50000,
            subtotalListaLineaCop: 50000,
            descuentoProrrateadoCop: 10000,
            netoPagadoLineaCop: 40000, // Pagó $40.000 COP
            reembolsadoAcumuladoCop: 0,
          },
        ],
        pagos: [{ metodo: 'EFECTIVO', montoCop: 40000 }],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);
      prismaMock.devolucionPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 1,
        ...data,
        lineas: data.lineas?.create ?? [],
      }));

      const res = await request(app)
        .post('/api/devoluciones')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'dev-001')
        .send({
          ventaOriginalId: 50,
          medioReembolso: 'EFECTIVO',
          lineas: [
            {
              lineaVentaOriginalId: 101,
              varianteId: 10,
              cantidadDevuelta: 1,
              condicionFisica: 'VENDIBLE',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.totalReembolsadoCop).toBe(40000); // Prorrateado: reembolsa 40k, no los 50k de lista
      expect(res.body.datos.numeroComprobante).toBe(201);

      // Verificación Kardex: entra a FISICO con +1
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tipo: 'DEVOLUCION_POS_VENDIBLE',
          ubicacionId: 2,
          varianteId: 10,
          cantidadConSigno: 1,
          afectaSaldo: 'FISICO',
        })
      );
    });
  });

  describe('2. Control de Plazo Raíz de 5 días (RN-DEV-03, CA-27, CA-63)', () => {
    it('bloquea devolución en día 10 si la solicita vendedor sin autorización (403)', async () => {
      // Venta realizada hace 10 días
      const hace10Dias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const ventaOriginal = {
        id: 51,
        numeroComprobante: 1002,
        ubicacionId: 2,
        sesionCajaId: 3,
        estado: 'COMPLETADA',
        fechaHora: hace10Dias,
        fechaVentaRaiz: hace10Dias,
        lineas: [
          {
            id: 102,
            ventaPosId: 51,
            varianteId: 10,
            productoIdSnapshot: 100,
            nombreProductoSnapshot: 'Blusa Lino',
            esReintegrableSnapshot: true,
            cantidadVendida: 1,
            cantidadDevueltaAcum: 0,
            netoPagadoLineaCop: 50000,
          },
        ],
        pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);

      const res = await request(app)
        .post('/api/devoluciones')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'dev-expirada-01')
        .send({
          ventaOriginalId: 51,
          medioReembolso: 'EFECTIVO',
          lineas: [
            {
              lineaVentaOriginalId: 102,
              varianteId: 10,
              cantidadDevuelta: 1,
              condicionFisica: 'VENDIBLE',
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/plazo de 5 días/i);
    });

    it('permite devolución en día 10 cuando es ejecutada por ADMIN con sobreescritura (201)', async () => {
      const hace10Dias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const ventaOriginal = {
        id: 51,
        numeroComprobante: 1002,
        ubicacionId: 2,
        sesionCajaId: 3,
        estado: 'COMPLETADA',
        fechaHora: hace10Dias,
        fechaVentaRaiz: hace10Dias,
        lineas: [
          {
            id: 102,
            ventaPosId: 51,
            varianteId: 10,
            productoIdSnapshot: 100,
            nombreProductoSnapshot: 'Blusa Lino',
            esReintegrableSnapshot: true,
            cantidadVendida: 1,
            cantidadDevueltaAcum: 0,
            netoPagadoLineaCop: 50000,
          },
        ],
        pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);
      prismaMock.devolucionPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 2,
        ...data,
        lineas: data.lineas?.create ?? [],
      }));

      const res = await request(app)
        .post('/api/devoluciones')
        .set('Authorization', TOKEN_ADMIN)
        .set('Idempotency-Key', 'dev-admin-override-01')
        .send({
          ventaOriginalId: 51,
          medioReembolso: 'EFECTIVO',
          autorizadoFueraPlazoPorId: 1,
          motivoFueraPlazo: 'Garantía extendida por calidad autorizada por gerencia',
          lineas: [
            {
              lineaVentaOriginalId: 102,
              varianteId: 10,
              cantidadDevuelta: 1,
              condicionFisica: 'VENDIBLE',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.autorizadoFueraPlazoPorId).toBe(1);
    });
  });

  describe('3. Cosméticos o prendas no reintegrables a NO_VENDIBLE (CA-31)', () => {
    it('fuerza ingreso a NO_VENDIBLE en Kardex para prendas con esReintegrableSnapshot = false', async () => {
      const hoy = new Date();
      const ventaOriginal = {
        id: 52,
        numeroComprobante: 1003,
        ubicacionId: 2,
        sesionCajaId: 5,
        estado: 'COMPLETADA',
        fechaHora: hoy,
        fechaVentaRaiz: hoy,
        lineas: [
          {
            id: 103,
            ventaPosId: 52,
            varianteId: 20, // Labial cosmético
            productoIdSnapshot: 200,
            nombreProductoSnapshot: 'Labial Mate',
            esReintegrableSnapshot: false, // NO REINTEGRABLE
            cantidadVendida: 1,
            cantidadDevueltaAcum: 0,
            netoPagadoLineaCop: 30000,
          },
        ],
        pagos: [{ metodo: 'EFECTIVO', montoCop: 30000 }],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);
      prismaMock.devolucionPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 3,
        ...data,
        lineas: data.lineas?.create ?? [],
      }));

      const res = await request(app)
        .post('/api/devoluciones')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'dev-cosmetico-01')
        .send({
          ventaOriginalId: 52,
          medioReembolso: 'EFECTIVO',
          lineas: [
            {
              lineaVentaOriginalId: 103,
              varianteId: 20,
              cantidadDevuelta: 1,
              condicionFisica: 'VENDIBLE',
            },
          ],
        });

      expect(res.status).toBe(201);
      // Kardex debe recibir DEVOLUCION_POS_NO_VENDIBLE afectando NO_VENDIBLE
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tipo: 'DEVOLUCION_POS_NO_VENDIBLE',
          ubicacionId: 2,
          varianteId: 20,
          cantidadConSigno: 1,
          afectaSaldo: 'NO_VENDIBLE',
        })
      );
    });
  });

  describe('4. Excepción por Iliquidez en Caja (RN-DEV-02, CA-54, QA-019)', () => {
    it('rechaza devolución en EFECTIVO si supera el efectivo disponible en caja (400)', async () => {
      // Caja con base 10.000 COP y sin ventas
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 5,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: ColombiaTime.toFechaNegocioColombia(),
        baseContadaCop: 10000,
      });

      const ventaOriginal = {
        id: 53,
        numeroComprobante: 1004,
        ubicacionId: 2,
        sesionCajaId: 5,
        estado: 'COMPLETADA',
        fechaHora: new Date(),
        fechaVentaRaiz: new Date(),
        lineas: [
          {
            id: 104,
            ventaPosId: 53,
            varianteId: 10,
            productoIdSnapshot: 100,
            nombreProductoSnapshot: 'Blusa Lino',
            esReintegrableSnapshot: true,
            cantidadVendida: 1,
            cantidadDevueltaAcum: 0,
            netoPagadoLineaCop: 50000, // Reembolso 50k > 10k en caja
          },
        ],
        pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);

      const res = await request(app)
        .post('/api/devoluciones')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'dev-iliquidez-err')
        .send({
          ventaOriginalId: 53,
          medioReembolso: 'EFECTIVO',
          esExcepcionIliquidezCaja: false,
          lineas: [
            {
              lineaVentaOriginalId: 104,
              varianteId: 10,
              cantidadDevuelta: 1,
              condicionFisica: 'VENDIBLE',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/supera el efectivo actual en caja/i);
    });

    it('permite tramitar la devolución por TRANSFERENCIA bajo excepción de iliquidez (CA-54, QA-019, 201)', async () => {
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 5,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: ColombiaTime.toFechaNegocioColombia(),
        baseContadaCop: 10000,
      });

      const ventaOriginal = {
        id: 53,
        numeroComprobante: 1004,
        ubicacionId: 2,
        sesionCajaId: 5,
        estado: 'COMPLETADA',
        fechaHora: new Date(),
        fechaVentaRaiz: new Date(),
        lineas: [
          {
            id: 104,
            ventaPosId: 53,
            varianteId: 10,
            productoIdSnapshot: 100,
            nombreProductoSnapshot: 'Blusa Lino',
            esReintegrableSnapshot: true,
            cantidadVendida: 1,
            cantidadDevueltaAcum: 0,
            netoPagadoLineaCop: 50000,
          },
        ],
        pagos: [{ metodo: 'EFECTIVO', montoCop: 50000 }],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);
      prismaMock.devolucionPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 4,
        ...data,
        lineas: data.lineas?.create ?? [],
      }));

      const res = await request(app)
        .post('/api/devoluciones')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'dev-iliquidez-ok')
        .send({
          ventaOriginalId: 53,
          medioReembolso: 'EFECTIVO',
          esExcepcionIliquidezCaja: true, // Tramitado como excepción por iliquidez
          referenciaReembolsoTransf: 'NEQUI-998877',
          lineas: [
            {
              lineaVentaOriginalId: 104,
              varianteId: 10,
              cantidadDevuelta: 1,
              condicionFisica: 'VENDIBLE',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.medioReembolso).toBe('TRANSFERENCIA');
      expect(res.body.datos.esExcepcionIliquidezCaja).toBe(true);
    });
  });

  describe('5. Cambio atómico en mostrador POS (RN-DEV-11, CA-30, CA-63, QA-017)', () => {
    it('cambio de misma prenda (talla M por L) resulta en diferencia $0 COP y preserva fecha raíz original', async () => {
      const fechaRaiz = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const ventaOriginal = {
        id: 54,
        numeroComprobante: 1005,
        ubicacionId: 2,
        sesionCajaId: 5,
        estado: 'COMPLETADA',
        fechaHora: fechaRaiz,
        fechaVentaRaiz: fechaRaiz,
        lineas: [
          {
            id: 105,
            ventaPosId: 54,
            varianteId: 10, // Blusa M
            productoIdSnapshot: 100,
            nombreProductoSnapshot: 'Blusa Lino',
            skuSnapshot: 'BLU-M',
            tallaSnapshot: 'M',
            colorSnapshot: 'Blanco',
            esReintegrableSnapshot: true,
            cantidadVendida: 1,
            cantidadDevueltaAcum: 0,
            netoPagadoLineaCop: 45000,
          },
        ],
        pagos: [{ metodo: 'EFECTIVO', montoCop: 45000 }],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);
      prismaMock.variante.findMany.mockResolvedValue([varianteBlusaL]);

      // Stock de la variante nueva (Blusa L): 3 unidades disponibles
      prismaMock.saldoStock.findUnique.mockResolvedValue({
        fisico: 3,
        reservadoBlando: 0,
        reservadoDuro: 0,
      });

      prismaMock.ventaPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 77,
        ...data,
        lineas: data.lineas?.create ?? [],
        pagos: data.pagos?.create ?? [],
      }));

      prismaMock.devolucionPOS.create.mockImplementation(async ({ data }: any) => ({
        id: 15,
        ...data,
        lineas: data.lineas?.create ?? [],
      }));

      const res = await request(app)
        .post('/api/devoluciones/cambio')
        .set('Authorization', TOKEN_VENDEDOR)
        .set('Idempotency-Key', 'cambio-001')
        .send({
          ventaOriginalId: 54,
          lineasDevueltas: [
            {
              lineaVentaOriginalId: 105,
              varianteId: 10,
              cantidadDevuelta: 1,
              condicionFisica: 'VENDIBLE',
            },
          ],
          lineasNuevas: [
            {
              varianteId: 11, // Blusa L
              cantidad: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.diferenciaLiquidacionCop).toBe(0); // QA-017: Diferencia $0 COP
      expect(res.body.datos.nuevaVenta.esVentaDeCambio).toBe(true);
      expect(res.body.datos.nuevaVenta.ventaOrigenRaizId).toBe(54);
      expect(new Date(res.body.datos.nuevaVenta.fechaVentaRaiz).getTime()).toBe(fechaRaiz.getTime()); // CA-63: no renueva los 5 días
    });
  });

  describe('6. Anulación de Venta POS en el día (RN-DEV-12, CA-33)', () => {
    it('revierte inventario vía Kardex y anula venta de la sesión activa actual (200)', async () => {
      const hoy = new Date();
      const ventaOriginal = {
        id: 55,
        numeroComprobante: 1006,
        ubicacionId: 2,
        sesionCajaId: 5, // Misma sesión activa
        estado: 'COMPLETADA',
        fechaHora: hoy,
        lineas: [
          {
            id: 106,
            ventaPosId: 55,
            varianteId: 10,
            cantidadVendida: 2,
          },
        ],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOriginal);
      prismaMock.ventaPOS.update.mockResolvedValue({
        ...ventaOriginal,
        estado: 'ANULADA',
        motivoAnulacion: 'Error en digitación de medios de pago',
      });

      const res = await request(app)
        .post('/api/devoluciones/anular-venta/55')
        .set('Authorization', TOKEN_VENDEDOR)
        .send({
          motivo: 'Error en digitación de medios de pago',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.estado).toBe('ANULADA');

      // Kardex: ANULACION_VENTA_POS restituye +2 a FISICO
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tipo: 'ANULACION_VENTA_POS',
          ubicacionId: 2,
          varianteId: 10,
          cantidadConSigno: 2,
          afectaSaldo: 'FISICO',
        })
      );
    });

    it('rechaza anulación si la venta pertenece a una sesión de caja diferente (CA-33, 409)', async () => {
      const ventaOtraSesion = {
        id: 56,
        numeroComprobante: 1007,
        ubicacionId: 2,
        sesionCajaId: 2, // Sesión previa cerrada
        estado: 'COMPLETADA',
        fechaHora: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lineas: [],
        devoluciones: [],
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaOtraSesion);

      const res = await request(app)
        .post('/api/devoluciones/anular-venta/56')
        .set('Authorization', TOKEN_VENDEDOR)
        .send({
          motivo: 'Cliente solicitó anular venta de ayer',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/sesión de caja activa actual/i);
    });

    it('rechaza anulación si la venta tiene devoluciones parciales previas (409)', async () => {
      const ventaConDev = {
        id: 57,
        numeroComprobante: 1008,
        ubicacionId: 2,
        sesionCajaId: 5,
        estado: 'COMPLETADA',
        fechaHora: new Date(),
        lineas: [],
        devoluciones: [{ id: 1 }], // Ya tiene devolución previa
      };

      prismaMock.ventaPOS.findUnique.mockResolvedValue(ventaConDev);

      const res = await request(app)
        .post('/api/devoluciones/anular-venta/57')
        .set('Authorization', TOKEN_VENDEDOR)
        .send({
          motivo: 'Intento de anulación con devolución previa',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/devoluciones previas/i);
    });
  });
});
