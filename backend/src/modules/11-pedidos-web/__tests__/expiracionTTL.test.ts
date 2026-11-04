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
      update: vi.fn(),
    },
    lineaPedidoWeb: {
      findMany: vi.fn(),
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
import { WebOrderTtlWorker } from '../domain/WebOrderTtlWorker.js';

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
  1: {
    id: 1,
    correo: 'admin@forma.com',
    rol: 'ADMIN',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 100,
    ...permisosBase,
  },
  10: {
    id: 10,
    correo: 'cliente@gmail.com',
    rol: 'CLIENTE',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
  20: {
    id: 20,
    correo: 'vendedor@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 1,
    activo: true,
    topeDescuentoPorc: 10,
    ...permisosBase,
    permPedidosWeb: true,
  },
};

const TOKEN_ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const TOKEN_CLIENTE = `Bearer ${generateToken({ userId: 10, correo: 'cliente@gmail.com', rol: 'CLIENTE' })}`;
const TOKEN_VENDEDOR = `Bearer ${generateToken({ userId: 20, correo: 'vendedor@forma.com', rol: 'VENDEDOR' })}`;

describe('Módulo 11: Worker de Expiración TTL de Reservas Web (SP4-02 / RF-WEB-04, RN-WEB-09, CA-39, QA-015)', () => {
  const ahora = new Date('2026-11-04T12:00:00Z');
  const fechaVencida = new Date('2026-11-03T11:00:00Z'); // Venció hace 1 hora (25h transcurridas)
  const fechaVigente = new Date('2026-11-04T15:00:00Z'); // Vence en 3 horas

  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 1n });
    prismaMock.historialEstadoPedidoWeb.create.mockResolvedValue({ id: 1 });
    prismaMock.pedidoWeb.update.mockResolvedValue({});
    prismaMock.movimientoInventario.create.mockResolvedValue({ id: 100n });
  });

  describe('1. Dominio Puro: WebOrderTtlWorker.ejecutarBarridoExpiracion', () => {
    it('Cancela pedido vencido por TRANSFERENCIA y libera reserva blanda en Kardex (CA-39, QA-015)', async () => {
      // 1. Simular pedido vencido retornado por $queryRaw con SKIP LOCKED
      prismaMock.$queryRaw.mockResolvedValueOnce([{ id: 101 }]);

      // 2. Mock de findUnique dentro de la transacción
      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce({
        id: 101,
        referenciaLegible: 'PED-2026-000101',
        ubicacionAsignadaId: 1,
        estadoPedido: 'RECIBIDO',
        estadoPago: 'PENDIENTE',
        metodoPago: 'TRANSFERENCIA',
        reservaExpiraEn: fechaVencida,
        tieneReservaActiva: true,
        lineas: [
          { varianteId: 10, cantidad: 2 },
          { varianteId: 12, cantidad: 1 },
        ],
      });

      // 3. Mock de saldos de stock bloqueados por InventoryLedgerService
      prismaMock.$queryRaw.mockImplementation(async () => [
        {
          id: 1,
          ubicacionId: 1,
          varianteId: 10,
          fisico: 10,
          reservadoBlando: 5,
          reservadoDuro: 0,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);
      prismaMock.saldoStock.update.mockResolvedValue({});

      const resultado = await WebOrderTtlWorker.ejecutarBarridoExpiracion(prismaMock as any, ahora, 1);

      expect(resultado.pedidosEvaluados).toBe(1);
      expect(resultado.pedidosExpirados).toBe(1);
      expect(resultado.totalUnidadesLiberadas).toBe(3); // 2 + 1
      expect(resultado.detalles[0]!.exito).toBe(true);

      // Verificar que se registró movimiento LIBERACION_RESERVA_WEB negativo en Kardex (RN-GEN-02, CA-39)
      expect(prismaMock.movimientoInventario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: 'LIBERACION_RESERVA_WEB',
          ubicacionId: 1,
          varianteId: 10,
          cantidadConSigno: -2,
          afectaSaldo: 'RESERVADO_BLANDO',
          documentoTipo: 'PEDIDO_WEB',
          documentoId: 101,
        }),
        select: expect.any(Object),
      });

      // Verificar que el pedido pasó a CANCELADO con tieneReservaActiva = false
      expect(prismaMock.pedidoWeb.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: expect.objectContaining({
          estadoPedido: 'CANCELADO',
          tieneReservaActiva: false,
          fechaCancelacion: ahora,
        }),
      });

      // Verificar trazabilidad en historial de estados
      expect(prismaMock.historialEstadoPedidoWeb.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pedidoId: 101,
          estadoPedido: 'CANCELADO',
          estadoPago: 'PENDIENTE',
        }),
      });

      // Verificar auditoría
      expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accion: 'EXPIRACION_TTL_PEDIDO_WEB',
          entidadTipo: 'PEDIDO_WEB',
          entidadId: '101',
        }),
      });
    });

    it('No expira pedido con reserva vigente en el futuro (reservaExpiraEn > ahora)', async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([{ id: 102 }]);

      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce({
        id: 102,
        referenciaLegible: 'PED-2026-000102',
        ubicacionAsignadaId: 1,
        estadoPedido: 'RECIBIDO',
        estadoPago: 'PENDIENTE',
        metodoPago: 'TRANSFERENCIA',
        reservaExpiraEn: fechaVigente, // Aún vigente
        tieneReservaActiva: true,
        lineas: [{ varianteId: 10, cantidad: 1 }],
      });

      const resultado = await WebOrderTtlWorker.ejecutarBarridoExpiracion(prismaMock as any, ahora, 1);

      expect(resultado.pedidosExpirados).toBe(0);
      expect(resultado.totalUnidadesLiberadas).toBe(0);
      expect(prismaMock.pedidoWeb.update).not.toHaveBeenCalled();
      expect(prismaMock.movimientoInventario.create).not.toHaveBeenCalled();
    });

    it('No expira pedidos que ya cambiaron a CONFIRMADO o EN_PREPARACION (CA-42)', async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([{ id: 103 }]);

      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce({
        id: 103,
        referenciaLegible: 'PED-2026-000103',
        ubicacionAsignadaId: 1,
        estadoPedido: 'EN_PREPARACION', // Protegido
        estadoPago: 'PAGADO',
        metodoPago: 'TRANSFERENCIA',
        reservaExpiraEn: fechaVencida,
        tieneReservaActiva: true,
        lineas: [{ varianteId: 10, cantidad: 1 }],
      });

      const resultado = await WebOrderTtlWorker.ejecutarBarridoExpiracion(prismaMock as any, ahora, 1);

      expect(resultado.pedidosExpirados).toBe(0);
      expect(prismaMock.pedidoWeb.update).not.toHaveBeenCalled();
    });

    it('No expira pedidos con método CONTRAENTREGA (sin TTL)', async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([{ id: 104 }]);

      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce({
        id: 104,
        referenciaLegible: 'PED-2026-000104',
        ubicacionAsignadaId: 1,
        estadoPedido: 'RECIBIDO',
        estadoPago: 'PENDIENTE',
        metodoPago: 'CONTRAENTREGA',
        reservaExpiraEn: null,
        tieneReservaActiva: true,
        lineas: [{ varianteId: 10, cantidad: 1 }],
      });

      const resultado = await WebOrderTtlWorker.ejecutarBarridoExpiracion(prismaMock as any, ahora, 1);

      expect(resultado.pedidosExpirados).toBe(0);
      expect(prismaMock.pedidoWeb.update).not.toHaveBeenCalled();
    });

    it('Si no hay pedidos candidatos vencidos, retorna resultado en cero limpiamente', async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([]);

      const resultado = await WebOrderTtlWorker.ejecutarBarridoExpiracion(prismaMock as any, ahora, 1);

      expect(resultado.pedidosEvaluados).toBe(0);
      expect(resultado.pedidosExpirados).toBe(0);
      expect(resultado.detalles).toHaveLength(0);
    });
  });

  describe('2. Endpoint Administrativo: POST /api/pedidos-web/worker/expirar-reservas', () => {
    it('Rechaza petición no autenticada con HTTP 401', async () => {
      const res = await request(app).post('/api/pedidos-web/worker/expirar-reservas');
      expect(res.status).toBe(401);
    });

    it('Rechaza rol CLIENTE con HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/worker/expirar-reservas')
        .set('Authorization', TOKEN_CLIENTE);
      expect(res.status).toBe(403);
    });

    it('Rechaza rol VENDEDOR con HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/worker/expirar-reservas')
        .set('Authorization', TOKEN_VENDEDOR);
      expect(res.status).toBe(403);
    });

    it('ADMIN ejecuta barrido exitosamente con HTTP 200 (CA-39, QA-015)', async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([{ id: 105 }]);

      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce({
        id: 105,
        referenciaLegible: 'PED-2026-000105',
        ubicacionAsignadaId: 1,
        estadoPedido: 'RECIBIDO',
        estadoPago: 'PENDIENTE',
        metodoPago: 'TRANSFERENCIA',
        reservaExpiraEn: fechaVencida,
        tieneReservaActiva: true,
        lineas: [{ varianteId: 10, cantidad: 3 }],
      });

      prismaMock.$queryRaw.mockImplementation(async () => [
        {
          id: 1,
          ubicacionId: 1,
          varianteId: 10,
          fisico: 10,
          reservadoBlando: 5,
          reservadoDuro: 0,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      const res = await request(app)
        .post('/api/pedidos-web/worker/expirar-reservas')
        .set('Authorization', TOKEN_ADMIN);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.pedidosExpirados).toBe(1);
      expect(res.body.datos.totalUnidadesLiberadas).toBe(3);
    });
  });

  describe('3. Ciclo Cron de Fondo (iniciarCron / detenerCron)', () => {
    it('Inicia y detiene el temporizador recurrente sin excepciones', () => {
      expect(() => {
        WebOrderTtlWorker.iniciarCron(prismaMock as any, 60_000);
        WebOrderTtlWorker.detenerCron();
      }).not.toThrow();
    });
  });
});
