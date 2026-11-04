import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1. Fijar variables de entorno requeridas
vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

// 2. Mock de Prisma Client
const prismaMock = vi.hoisted(() => {
  const m = {
    usuario: { findUnique: vi.fn() },
    ubicacion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    municipioDane: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    excepcionTarifaEnvio: {
      findMany: vi.fn(),
    },
    tarifaZonaEnvio: {
      findMany: vi.fn(),
    },
    variante: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    saldoStock: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    pedidoWeb: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    lineaPedidoWeb: {
      create: vi.fn(),
    },
    historialEstadoPedidoWeb: {
      create: vi.fn(),
    },
    movimientoInventario: {
      create: vi.fn(),
    },
    registroAuditoria: {
      create: vi.fn(),
    },
    registroIdempotencia: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  };
  return m;
});

vi.mock('../../../config/database.js', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

import request from 'supertest';
import { app } from '../../../app.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';
import { DaneShippingCalculator } from '../domain/DaneShippingCalculator.js';
import { OrderAssignmentEngine } from '../domain/OrderAssignmentEngine.js';

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
  10: {
    id: 10,
    correo: 'cliente_web@gmail.com',
    rol: 'CLIENTE',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
  11: {
    id: 11,
    correo: 'otro_cliente@gmail.com',
    rol: 'CLIENTE',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
};

const TOKEN_CLIENTE = `Bearer ${generateToken({ userId: 10, correo: 'cliente_web@gmail.com', rol: 'CLIENTE' })}`;
const TOKEN_OTRO_CLIENTE = `Bearer ${generateToken({ userId: 11, correo: 'otro_cliente@gmail.com', rol: 'CLIENTE' })}`;

// Municipios DANE de prueba
const munCucuta = {
  codigoDane: '54001',
  nombre: 'Cúcuta',
  departamentoId: '54',
  departamento: { codigoDane: '54', nombre: 'Norte de Santander', regionId: 1 },
  atendidoWeb: true,
};

const munOcana = {
  codigoDane: '54498',
  nombre: 'Ocaña',
  departamentoId: '54',
  departamento: { codigoDane: '54', nombre: 'Norte de Santander', regionId: 1 },
  atendidoWeb: true,
};

const munBucaramanga = {
  codigoDane: '68001',
  nombre: 'Bucaramanga',
  departamentoId: '68',
  departamento: { codigoDane: '68', nombre: 'Santander', regionId: 1 }, // Misma región Oriente
  atendidoWeb: true,
};

const munBogota = {
  codigoDane: '11001',
  nombre: 'Bogotá D.C.',
  departamentoId: '11',
  departamento: { codigoDane: '11', nombre: 'Bogotá D.C.', regionId: 2 }, // Diferente región
  atendidoWeb: true,
};

const munSinCobertura = {
  codigoDane: '99999',
  nombre: 'Municipio Remoto',
  departamentoId: '99',
  departamento: { codigoDane: '99', nombre: 'Vichada', regionId: 5 },
  atendidoWeb: false, // CA-37
};

// Sedes
const sedeCentro = {
  id: 1,
  nombre: 'Sede Cúcuta Centro',
  tipo: 'PUNTO_VENTA',
  municipioDaneId: '54001',
  municipio: munCucuta,
  prioridadDespacho: 10,
  activa: true,
  despachaWeb: true,
};

const sedeOcana = {
  id: 2,
  nombre: 'Sede Ocaña',
  tipo: 'PUNTO_VENTA',
  municipioDaneId: '54498',
  municipio: munOcana,
  prioridadDespacho: 20,
  activa: true,
  despachaWeb: true,
};

const sedeCentral = {
  id: 4,
  nombre: 'Bodega Central',
  tipo: 'CENTRAL',
  municipioDaneId: '54001',
  municipio: munCucuta,
  prioridadDespacho: 40,
  activa: true,
  despachaWeb: true,
};

// Variantes
const variante10 = {
  id: 10,
  sku: 'CAM-NEG-M',
  precioVentaCop: 50000,
  talla: 'M',
  color: 'Negro',
  activa: true,
  producto: { id: 1, nombre: 'Camiseta Básica', reintegrableEnDevolucion: true, activo: true },
};

describe('Módulo 11: Algoritmo DANE y Checkout Web (SP4-01 / RF-WEB-02, RF-WEB-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 1n });
    prismaMock.historialEstadoPedidoWeb.create.mockResolvedValue({ id: 1 });
  });

  describe('1. Dominio: Calculador de Fletes por Zonas DANE (DaneShippingCalculator)', () => {
    const infoOrigen = { codigoDane: '54001', departamentoId: '54', regionId: 1, atendidoWeb: true };

    it('Zona 1: Mismo Municipio liquida $8.000 COP y 2 días estimados', () => {
      const res = DaneShippingCalculator.calcular(infoOrigen, {
        codigoDane: '54001',
        departamentoId: '54',
        regionId: 1,
        atendidoWeb: true,
      });

      expect(res.zona).toBe(1);
      expect(res.tarifaCop).toBe(8000);
      expect(res.diasEstimados).toBe(2);
      expect(res.esExcepcion).toBe(false);
    });

    it('Zona 2: Mismo Departamento liquida $12.000 COP y 3 días estimados', () => {
      const res = DaneShippingCalculator.calcular(infoOrigen, {
        codigoDane: '54498', // Ocaña
        departamentoId: '54',
        regionId: 1,
        atendidoWeb: true,
      });

      expect(res.zona).toBe(2);
      expect(res.tarifaCop).toBe(12000);
      expect(res.diasEstimados).toBe(3);
    });

    it('Zona 3: Misma Región Geográfica liquida $16.000 COP y 4 días estimados', () => {
      const res = DaneShippingCalculator.calcular(infoOrigen, {
        codigoDane: '68001', // Bucaramanga (Santander, Region 1)
        departamentoId: '68',
        regionId: 1,
        atendidoWeb: true,
      });

      expect(res.zona).toBe(3);
      expect(res.tarifaCop).toBe(16000);
      expect(res.diasEstimados).toBe(4);
    });

    it('Zona 4: Diferente Región liquida $22.000 COP y 6 días estimados', () => {
      const res = DaneShippingCalculator.calcular(infoOrigen, {
        codigoDane: '11001', // Bogotá (Region 2)
        departamentoId: '11',
        regionId: 2,
        atendidoWeb: true,
      });

      expect(res.zona).toBe(4);
      expect(res.tarifaCop).toBe(22000);
      expect(res.diasEstimados).toBe(6);
    });

    it('Aplica excepción específica Origen-Destino con prioridad sobre la zona (RN-ENV-03)', () => {
      const excepciones = [
        {
          municipioOrigenId: '54001',
          municipioDestinoId: '11001',
          tarifaCop: 14000,
          diasEstimados: 1,
        },
      ];

      const res = DaneShippingCalculator.calcular(
        infoOrigen,
        { codigoDane: '11001', departamentoId: '11', regionId: 2, atendidoWeb: true },
        excepciones
      );

      expect(res.esExcepcion).toBe(true);
      expect(res.tarifaCop).toBe(14000);
      expect(res.diasEstimados).toBe(1);
    });

    it('Rechaza cotización con HTTP 422 si el municipio destino no cuenta con cobertura web (CA-37)', () => {
      expect(() =>
        DaneShippingCalculator.calcular(infoOrigen, {
          codigoDane: '99999',
          departamentoId: '99',
          regionId: 5,
          atendidoWeb: false, // Sin cobertura
        })
      ).toThrowError(/no cuenta con cobertura.*CA-37/i);
    });
  });

  describe('2. Dominio: Motor de Asignación Determinista de Sede (OrderAssignmentEngine)', () => {
    it('Desempata por menor tarifa de envío DANE hacia el destino (CA-36)', () => {
      // Cliente en Ocaña (54498)
      const destinoOcana = { codigoDane: '54498', departamentoId: '54', regionId: 1, atendidoWeb: true };

      // Sede Ocaña (misma ciudad -> Zona 1 = $8.000)
      // Sede Cúcuta (mismo depto -> Zona 2 = $12.000)
      const sede1 = {
        id: 1,
        nombre: 'Cúcuta Centro',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 10,
        municipioDane: { codigoDane: '54001', departamentoId: '54', regionId: 1, atendidoWeb: true },
        saldos: new Map([[10, { varianteId: 10, disponible: 5, bloqueadoDespachoWeb: false }]]),
      };

      const sede2 = {
        id: 2,
        nombre: 'Ocaña',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 20,
        municipioDane: destinoOcana,
        saldos: new Map([[10, { varianteId: 10, disponible: 5, bloqueadoDespachoWeb: false }]]),
      };

      const seleccion = OrderAssignmentEngine.seleccionarSedeDespacho(
        [{ varianteId: 10, cantidad: 2 }],
        destinoOcana,
        [sede1, sede2]
      );

      // Gana Sede Ocaña porque su flete es menor ($8.000 vs $12.000), a pesar de tener mayor prioridad numérica (20 vs 10)
      expect(seleccion.sede.id).toBe(2);
      expect(seleccion.tarifaEnvio.tarifaCop).toBe(8000);
    });

    it('Desempata por menor prioridad de despacho si las tarifas son idénticas (CA-36)', () => {
      // Cliente en Bogotá (Diferente región -> ambas sedes en Cúcuta cobran Zona 4 = $22.000)
      const destinoBogota = { codigoDane: '11001', departamentoId: '11', regionId: 2, atendidoWeb: true };

      const sedeCentroCucuta = {
        id: 1,
        nombre: 'Cúcuta Centro',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 10, // Menor número gana
        municipioDane: { codigoDane: '54001', departamentoId: '54', regionId: 1, atendidoWeb: true },
        saldos: new Map([[10, { varianteId: 10, disponible: 5, bloqueadoDespachoWeb: false }]]),
      };

      const sedeCentralCucuta = {
        id: 4,
        nombre: 'Bodega Central',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 40,
        municipioDane: { codigoDane: '54001', departamentoId: '54', regionId: 1, atendidoWeb: true },
        saldos: new Map([[10, { varianteId: 10, disponible: 5, bloqueadoDespachoWeb: false }]]),
      };

      const seleccion = OrderAssignmentEngine.seleccionarSedeDespacho(
        [{ varianteId: 10, cantidad: 1 }],
        destinoBogota,
        [sedeCentralCucuta, sedeCentroCucuta]
      );

      expect(seleccion.sede.id).toBe(1); // Gana prioridad 10 sobre prioridad 40
    });

    it('Rechaza con HTTP 409 si ninguna sede individual tiene stock para todo el carrito (cero envíos divididos, CA-35)', () => {
      const destino = { codigoDane: '54001', departamentoId: '54', regionId: 1, atendidoWeb: true };

      // Sede 1 solo tiene variante A
      const sede1 = {
        id: 1,
        nombre: 'Sede 1',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 10,
        municipioDane: destino,
        saldos: new Map([[10, { varianteId: 10, disponible: 5, bloqueadoDespachoWeb: false }]]),
      };

      // Sede 2 solo tiene variante B
      const sede2 = {
        id: 2,
        nombre: 'Sede 2',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 20,
        municipioDane: destino,
        saldos: new Map([[20, { varianteId: 20, disponible: 5, bloqueadoDespachoWeb: false }]]),
      };

      expect(() =>
        OrderAssignmentEngine.seleccionarSedeDespacho(
          [
            { varianteId: 10, cantidad: 1 },
            { varianteId: 20, cantidad: 1 },
          ],
          destino,
          [sede1, sede2]
        )
      ).toThrowError(/no hay inventario suficiente en una sola sede.*CA-35/i);
    });

    it('Descarta sede si la variante tiene activo el flag bloqueadoDespachoWeb (cuarentena de SKU)', () => {
      const destino = { codigoDane: '54001', departamentoId: '54', regionId: 1, atendidoWeb: true };

      const sedeBloqueada = {
        id: 1,
        nombre: 'Sede Bloqueada',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 10,
        municipioDane: destino,
        saldos: new Map([[10, { varianteId: 10, disponible: 10, bloqueadoDespachoWeb: true }]]), // En cuarentena
      };

      const sedeLibre = {
        id: 4,
        nombre: 'Bodega Central',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 40,
        municipioDane: destino,
        saldos: new Map([[10, { varianteId: 10, disponible: 10, bloqueadoDespachoWeb: false }]]),
      };

      const seleccion = OrderAssignmentEngine.seleccionarSedeDespacho(
        [{ varianteId: 10, cantidad: 1 }],
        destino,
        [sedeBloqueada, sedeLibre]
      );

      expect(seleccion.sede.id).toBe(4); // Salta la sede en cuarentena
    });
  });

  describe('3. Endpoints HTTP (/api/pedidos-web)', () => {
    describe('POST /api/pedidos-web/cotizar-flete', () => {
      it('Cotiza flete público hacia Cúcuta retornando Zona 1 (HTTP 200)', async () => {
        prismaMock.municipioDane.findUnique.mockImplementation(async ({ where }: { where: { codigoDane: string } }) => {
          if (where.codigoDane === '54001') return munCucuta;
          return null;
        });
        prismaMock.ubicacion.findFirst.mockResolvedValue(sedeCentral);
        prismaMock.excepcionTarifaEnvio.findMany.mockResolvedValue([]);

        const res = await request(app)
          .post('/api/pedidos-web/cotizar-flete')
          .send({ municipioDestinoId: '54001' });

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.datos.zona).toBe(1);
        expect(res.body.datos.tarifaCop).toBe(8000);
      });

      it('Rechaza con HTTP 422 si el municipio no tiene cobertura web (CA-37)', async () => {
        prismaMock.municipioDane.findUnique.mockResolvedValue(munSinCobertura);

        const res = await request(app)
          .post('/api/pedidos-web/cotizar-flete')
          .send({ municipioDestinoId: '99999' });

        expect(res.status).toBe(422);
        expect(res.body.error.message).toMatch(/no cuenta con cobertura.*CA-37/i);
      });
    });

    describe('POST /api/pedidos-web/checkout', () => {
      const checkoutPayload = {
        municipioDestinoId: '54001',
        direccionEntrega: 'Avenida 0 # 11-20',
        destinatarioNombre: 'Juan Perez',
        destinatarioTelefono: '3001234567',
        metodoPago: 'TRANSFERENCIA',
        lineas: [{ varianteId: 10, cantidad: 2 }],
      };

      it('Rechaza si falta el encabezado Idempotency-Key con HTTP 400 (RN-GEN-08)', async () => {
        const res = await request(app)
          .post('/api/pedidos-web/checkout')
          .set('Authorization', TOKEN_CLIENTE)
          // Sin Idempotency-Key
          .send(checkoutPayload);

        expect(res.status).toBe(400);
        expect(res.body.error.message).toMatch(/Idempotency-Key es obligatorio/i);
      });

      it('Checkout exitoso por TRANSFERENCIA: reserva blanda en Kardex y TTL 24h (HTTP 201, CA-38, CA-39)', async () => {
        prismaMock.municipioDane.findUnique.mockImplementation(async ({ where }: { where: { codigoDane: string } }) => {
          if (where.codigoDane === '54001') return munCucuta;
          return null;
        });
        prismaMock.variante.findMany.mockResolvedValue([variante10]);
        prismaMock.ubicacion.findMany.mockResolvedValue([sedeCentro]);
        prismaMock.saldoStock.findMany.mockResolvedValue([
          {
            ubicacionId: 1,
            varianteId: 10,
            fisico: 10,
            reservadoBlando: 0,
            reservadoDuro: 0,
            bloqueadoDespachoWeb: false,
          },
        ]);
        prismaMock.excepcionTarifaEnvio.findMany.mockResolvedValue([]);
        prismaMock.pedidoWeb.count.mockResolvedValue(141);

        // Mock de InventoryLedgerService para reserva blanda
        prismaMock.$queryRaw.mockResolvedValue([
          {
            id: 1,
            ubicacionId: 1,
            varianteId: 10,
            fisico: 10,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          },
        ]);
        prismaMock.saldoStock.update.mockResolvedValue({
          id: 1,
          ubicacionId: 1,
          varianteId: 10,
          fisico: 10,
          reservadoBlando: 2, // 0 + 2
          reservadoDuro: 0,
        });
        prismaMock.movimientoInventario.create.mockResolvedValue({ id: 50n });

        prismaMock.pedidoWeb.create.mockResolvedValue({
          id: 201,
          referenciaLegible: 'PED-2026-000142',
          clienteId: 10,
          ubicacionAsignadaId: 1,
          estadoPedido: 'RECIBIDO',
          estadoPago: 'PENDIENTE',
          metodoPago: 'TRANSFERENCIA',
          reservaExpiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
          subtotalListaCop: 100000,
          costoEnvioCop: 8000,
          totalAPagarCop: 108000,
        });

        const res = await request(app)
          .post('/api/pedidos-web/checkout')
          .set('Authorization', TOKEN_CLIENTE)
          .set('Idempotency-Key', 'idem-checkout-001')
          .send(checkoutPayload);

        expect(res.status).toBe(201);
        expect(res.body.ok).toBe(true);
        expect(res.body.datos.referenciaLegible).toBe('PED-2026-000142');
        expect(res.body.datos.totalAPagarCop).toBe(108000);

        // Validar que se registró movimiento de reserva blanda en Kardex (CA-38)
        expect(prismaMock.movimientoInventario.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tipo: 'RESERVA_WEB',
            ubicacionId: 1,
            varianteId: 10,
            cantidadConSigno: 2,
            afectaSaldo: 'RESERVADO_BLANDO',
            documentoTipo: 'PEDIDO_WEB',
          }),
          select: expect.any(Object),
        });
      });

      it('Retorna respuesta cacheada si se envía la misma Idempotency-Key (RN-GEN-08)', async () => {
        prismaMock.registroIdempotencia.findUnique.mockResolvedValueOnce({
          idempotencyKey: 'idem-checkout-repetido',
          usuarioId: 10,
          statusCode: 201,
          responseBody: { ok: true, datos: { id: 201, referenciaLegible: 'PED-2026-000142' } },
        });

        const res = await request(app)
          .post('/api/pedidos-web/checkout')
          .set('Authorization', TOKEN_CLIENTE)
          .set('Idempotency-Key', 'idem-checkout-repetido')
          .send(checkoutPayload);

        expect(res.status).toBe(201);
        expect(res.body.datos.id).toBe(201);
        expect(prismaMock.pedidoWeb.create).not.toHaveBeenCalled();
      });
    });

    describe('GET /api/pedidos-web/:id', () => {
      it('Un cliente no puede consultar pedidos de otro cliente (HTTP 403 Seguridad)', async () => {
        prismaMock.pedidoWeb.findUnique.mockResolvedValue({
          id: 500,
          clienteId: 99, // Pertenece al usuario 99
          ubicacionAsignadaId: 1,
        });

        const res = await request(app)
          .get('/api/pedidos-web/500')
          .set('Authorization', TOKEN_CLIENTE); // Usuario 10

        expect(res.status).toBe(403);
        expect(res.body.error.message).toMatch(/no tiene permiso para consultar pedidos de otros clientes/i);
      });
    });
  });
});
