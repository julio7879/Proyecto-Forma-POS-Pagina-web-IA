import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1. Fijar variables de entorno requeridas antes de cargar la app
vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

// 2. Mock completo de Prisma Client
const prismaMock = vi.hoisted(() => {
  const m = {
    usuario: { findUnique: vi.fn() },
    ubicacion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    variante: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    traslado: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lineaTraslado: {
      update: vi.fn(),
    },
    saldoStock: {
      update: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
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
    ubicacionId: 1, // Central
    activo: true,
    topeDescuentoPorc: 100,
    ...permisosBase,
    permSolicitarTraslado: true,
  },
  2: {
    id: 2,
    correo: 'vendedor_norte@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 2, // Sede Norte
    activo: true,
    topeDescuentoPorc: 10,
    ...permisosBase,
    permSolicitarTraslado: true,
  },
  3: {
    id: 3,
    correo: 'vendedor_sin_permiso@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 2,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
  4: {
    id: 4,
    correo: 'cliente@gmail.com',
    rol: 'CLIENTE',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
};

const TOKEN_ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const TOKEN_VENDEDOR_NORTE = `Bearer ${generateToken({ userId: 2, correo: 'vendedor_norte@forma.com', rol: 'VENDEDOR' })}`;
const TOKEN_VENDEDOR_SIN_PERM = `Bearer ${generateToken({ userId: 3, correo: 'vendedor_sin_permiso@forma.com', rol: 'VENDEDOR' })}`;
const TOKEN_CLIENTE = `Bearer ${generateToken({ userId: 4, correo: 'cliente@gmail.com', rol: 'CLIENTE' })}`;

const ubicacionCentral = {
  id: 1,
  nombre: 'Bodega Central',
  tipo: 'CENTRAL',
  activa: true,
  despachaWeb: true,
  prioridadDespacho: 40,
  baseCajaCop: 0,
};

const ubicacionNorte = {
  id: 2,
  nombre: 'Sede Norte',
  tipo: 'PUNTO_VENTA',
  activa: true,
  despachaWeb: true,
  prioridadDespacho: 100,
  baseCajaCop: 200000,
};

const variante10 = {
  id: 10,
  sku: 'CAM-NEG-M',
  producto: { id: 1, nombre: 'Camiseta Negra', activo: true, categoria: 'ROPA' },
};

describe('Módulo 06: Traslados entre Sedes y Flujo Retornando a Central (SP2-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    // Simular transacción interactiva
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);

    // Mocks por defecto para ubicaciones y variantes
    prismaMock.ubicacion.findFirst.mockResolvedValue(ubicacionCentral);
    prismaMock.ubicacion.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => {
      if (where.id === 1) return ubicacionCentral;
      if (where.id === 2) return ubicacionNorte;
      return null;
    });
    prismaMock.variante.findMany.mockResolvedValue([variante10]);
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 100n });
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
  });

  describe('1. Solicitud de Traslado (RF-TRA-01, POST /api/traslados)', () => {
    it('Crea solicitud en estado SOLICITADO por vendedor con permiso hacia su sede (HTTP 201)', async () => {
      prismaMock.traslado.create.mockResolvedValue({
        id: 101,
        esEnvioDirecto: false,
        ubicacionOrigenId: 1,
        ubicacionDestinoId: 2,
        estado: 'SOLICITADO',
        creadoPorId: 2,
        version: 1,
        lineas: [
          {
            id: 501,
            trasladoId: 101,
            varianteId: 10,
            cantidadSolicitada: 30,
            cantidadAprobada: null,
            cantidadEnviada: null,
          },
        ],
      });

      const res = await request(app)
        .post('/api/traslados')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-key-001')
        .send({
          ubicacionDestinoId: 2,
          lineas: [{ varianteId: 10, cantidadSolicitada: 30 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.estado).toBe('SOLICITADO');
      expect(prismaMock.traslado.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ubicacionOrigenId: 1,
          ubicacionDestinoId: 2,
          estado: 'SOLICITADO',
        }),
        include: expect.any(Object),
      });
      expect(prismaMock.registroAuditoria.create).toHaveBeenCalledTimes(1);
    });

    it('Rechaza con HTTP 403 si el vendedor carece del permiso permSolicitarTraslado', async () => {
      const res = await request(app)
        .post('/api/traslados')
        .set('Authorization', TOKEN_VENDEDOR_SIN_PERM)
        .set('Idempotency-Key', 'idem-key-002')
        .send({
          ubicacionDestinoId: 2,
          lineas: [{ varianteId: 10, cantidadSolicitada: 10 }],
        });

      expect(res.status).toBe(403);
      expect(prismaMock.traslado.create).not.toHaveBeenCalled();
    });

    it('Rechaza con HTTP 403 si un punto intenta solicitar traslado hacia otra sede distinta a la suya', async () => {
      const res = await request(app)
        .post('/api/traslados')
        .set('Authorization', TOKEN_VENDEDOR_NORTE) // Usuario asignado a sede 2
        .set('Idempotency-Key', 'idem-key-003')
        .send({
          ubicacionDestinoId: 99, // Intentando hacia sede 99
          lineas: [{ varianteId: 10, cantidadSolicitada: 10 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/solo puede solicitar traslados hacia su propia sede/i);
    });

    it('Admin puede crear envío directo desde Central iniciando en APROBADO', async () => {
      prismaMock.traslado.create.mockResolvedValue({
        id: 102,
        esEnvioDirecto: true,
        ubicacionOrigenId: 1,
        ubicacionDestinoId: 2,
        estado: 'APROBADO',
        creadoPorId: 1,
        aprobadoPorId: 1,
        version: 1,
        lineas: [
          {
            id: 502,
            trasladoId: 102,
            varianteId: 10,
            cantidadSolicitada: 20,
            cantidadAprobada: 20,
          },
        ],
      });

      const res = await request(app)
        .post('/api/traslados')
        .set('Authorization', TOKEN_ADMIN)
        .set('Idempotency-Key', 'idem-key-004')
        .send({
          ubicacionDestinoId: 2,
          esEnvioDirecto: true,
          lineas: [{ varianteId: 10, cantidadSolicitada: 20 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.datos.estado).toBe('APROBADO');
    });

    it('Rechaza solicitud si falta el encabezado Idempotency-Key con HTTP 400 (RN-GEN-08)', async () => {
      const res = await request(app)
        .post('/api/traslados')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        // Sin encabezado Idempotency-Key
        .send({
          ubicacionDestinoId: 2,
          lineas: [{ varianteId: 10, cantidadSolicitada: 10 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Idempotency-Key es obligatorio/i);
    });

    it('Retorna respuesta cacheada sin duplicar si Idempotency-Key ya fue procesada (RN-GEN-08)', async () => {
      prismaMock.registroIdempotencia.findUnique.mockResolvedValueOnce({
        idempotencyKey: 'idem-repetida-01',
        usuarioId: 2,
        statusCode: 201,
        responseBody: { ok: true, datos: { id: 888, estado: 'SOLICITADO' } },
      });

      const res = await request(app)
        .post('/api/traslados')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-repetida-01')
        .send({
          ubicacionDestinoId: 2,
          lineas: [{ varianteId: 10, cantidadSolicitada: 10 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.datos.id).toBe(888);
      expect(prismaMock.traslado.create).not.toHaveBeenCalled();
    });

    it('Rechaza con HTTP 403 si un CLIENTE de la tienda web intenta consultar traslados (Seguridad)', async () => {
      const res = await request(app)
        .get('/api/traslados')
        .set('Authorization', TOKEN_CLIENTE);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/acceso restringido a los roles/i);
    });
  });

  describe('2. Evaluación y Aprobación en Central (RF-TRA-02, CA-11, PATCH /api/traslados/:id/evaluar)', () => {
    it('Rechaza aprobar más unidades que las solicitadas con HTTP 422 (CA-11)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'SOLICITADO',
        version: 1,
        lineas: [{ id: 501, varianteId: 10, cantidadSolicitada: 30 }],
      });

      const res = await request(app)
        .patch('/api/traslados/101/evaluar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          accion: 'APROBAR',
          lineas: [{ lineaId: 501, cantidadAprobada: 35 }], // 35 > 30 solicitadas -> CA-11 violación
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/no puede superar la solicitada.*CA-11/i);
      expect(prismaMock.lineaTraslado.update).not.toHaveBeenCalled();
    });

    it('Aprueba parcialmente el traslado pasando a estado APROBADO (HTTP 200, CA-11)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'SOLICITADO',
        version: 1,
        lineas: [{ id: 501, varianteId: 10, cantidadSolicitada: 30 }],
      });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 501, cantidadAprobada: 20 });
      prismaMock.traslado.update.mockResolvedValue({
        id: 101,
        estado: 'APROBADO',
        aprobadoPorId: 1,
        version: 2,
        lineas: [{ id: 501, varianteId: 10, cantidadSolicitada: 30, cantidadAprobada: 20 }],
      });

      const res = await request(app)
        .patch('/api/traslados/101/evaluar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          accion: 'APROBAR',
          lineas: [{ lineaId: 501, cantidadAprobada: 20 }], // Aprobado 20 <= 30
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.estado).toBe('APROBADO');
      expect(prismaMock.lineaTraslado.update).toHaveBeenCalledWith({
        where: { id: 501 },
        data: { cantidadAprobada: 20 },
      });
    });

    it('Rechaza traslado pasando a RECHAZADO con motivo obligatorio (HTTP 200)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'SOLICITADO',
        version: 1,
        lineas: [{ id: 501, varianteId: 10, cantidadSolicitada: 30 }],
      });
      prismaMock.traslado.update.mockResolvedValue({
        id: 101,
        estado: 'RECHAZADO',
        motivoRechazoCancelacion: 'No hay disponibilidad en Central',
        version: 2,
      });

      const res = await request(app)
        .patch('/api/traslados/101/evaluar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          accion: 'RECHAZAR',
          motivoRechazo: 'No hay disponibilidad en Central',
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('RECHAZADO');
      expect(prismaMock.traslado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: 'RECHAZADO',
            fechaCierre: expect.any(Date),
          }),
        })
      );
    });

    it('Rechaza con HTTP 400 si se envían lineaId duplicadas en la evaluación', async () => {
      const res = await request(app)
        .patch('/api/traslados/101/evaluar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          accion: 'APROBAR',
          lineas: [
            { lineaId: 501, cantidadAprobada: 10 },
            { lineaId: 501, cantidadAprobada: 5 }, // Duplicada
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/validación/i);
    });

    it('Rechaza con HTTP 409 si ocurre colisión de concurrencia optimista (QA-014)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'SOLICITADO',
        version: 3, // DB ya va por la versión 3
        lineas: [{ id: 501, varianteId: 10, cantidadSolicitada: 30 }],
      });

      const res = await request(app)
        .patch('/api/traslados/101/evaluar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          accion: 'APROBAR',
          version: 2, // Cliente intenta aplicar sobre versión 2 desactualizada
          lineas: [{ lineaId: 501, cantidadAprobada: 30 }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/conflicto de concurrencia.*QA-014/i);
    });
  });

  describe('3. Despacho a Tránsito (RF-TRA-03, CA-04, CA-05, POST /api/traslados/:id/despachar)', () => {
    it('Descuenta stock físico en Central vía InventoryLedgerService y pasa a ENVIADO (HTTP 200, CA-04)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'APROBADO',
        version: 2,
        ubicacionOrigenId: 1,
        ubicacionDestinoId: 2,
        ubicacionOrigen: ubicacionCentral,
        ubicacionDestino: ubicacionNorte,
        lineas: [
          {
            id: 501,
            varianteId: 10,
            cantidadSolicitada: 30,
            cantidadAprobada: 20,
          },
        ],
      });

      // Mock de InventoryLedgerService.bloquearYObtenerSaldo ($queryRaw FOR UPDATE)
      prismaMock.$queryRaw.mockResolvedValue([
        {
          id: 1,
          ubicacionId: 1,
          varianteId: 10,
          fisico: 50,
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
        fisico: 30, // 50 - 20
        reservadoBlando: 0,
        reservadoDuro: 0,
      });
      prismaMock.movimientoInventario.create.mockResolvedValue({ id: 999n });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 501, cantidadEnviada: 20 });
      prismaMock.traslado.update.mockResolvedValue({
        id: 101,
        estado: 'ENVIADO',
        version: 3,
        lineas: [{ id: 501, cantidadEnviada: 20 }],
      });

      const res = await request(app)
        .post('/api/traslados/101/despachar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          lineas: [{ lineaId: 501, cantidadEnviada: 20 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.estado).toBe('ENVIADO');

      // Validar que se registró movimiento inmutable de Kardex TRASLADO_ENVIADO
      expect(prismaMock.movimientoInventario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: 'TRASLADO_ENVIADO',
          ubicacionId: 1,
          varianteId: 10,
          cantidadConSigno: -20,
          afectaSaldo: 'FISICO',
          documentoTipo: 'TRASLADO',
          documentoId: 101,
        }),
        select: expect.any(Object),
      });
    });

    it('Rechaza despachar más unidades de las aprobadas con HTTP 422 (CA-11)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'APROBADO',
        version: 2,
        ubicacionOrigenId: 1,
        ubicacionDestinoId: 2,
        ubicacionOrigen: ubicacionCentral,
        ubicacionDestino: ubicacionNorte,
        lineas: [
          {
            id: 501,
            varianteId: 10,
            cantidadSolicitada: 30,
            cantidadAprobada: 20,
          },
        ],
      });

      const res = await request(app)
        .post('/api/traslados/101/despachar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          lineas: [{ lineaId: 501, cantidadEnviada: 25 }], // 25 > 20 aprobada -> CA-11 violación
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/no puede superar la aprobada.*CA-11/i);
      expect(prismaMock.movimientoInventario.create).not.toHaveBeenCalled();
    });
  });

  describe('4. Cancelación y Flujo Retornando a Central (RF-TRA-04, CA-09, CA-59)', () => {
    it('Cancelar traslado en estado ENVIADO pasa a RETORNANDO_A_CENTRAL sin alterar stock en Central (CA-09)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'ENVIADO',
        version: 3,
        ubicacionOrigenId: 1,
        ubicacionDestinoId: 2,
        lineas: [{ id: 501, varianteId: 10, cantidadEnviada: 20 }],
      });
      prismaMock.traslado.update.mockResolvedValue({
        id: 101,
        estado: 'RETORNANDO_A_CENTRAL',
        motivoRechazoCancelacion: 'Camión de reparto sufrió avería mecánica',
        version: 4,
      });

      const res = await request(app)
        .patch('/api/traslados/101/cancelar')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          motivo: 'Camión de reparto sufrió avería mecánica',
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('RETORNANDO_A_CENTRAL');
      // Invariante CA-09: El stock continúa en tránsito; NO se repone en Central de forma prematura
      expect(prismaMock.movimientoInventario.create).not.toHaveBeenCalled();
    });

    it('Confirmar retorno físico repone stock en Central y pasa a CANCELADO (HTTP 200, CA-59, QA-012)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'RETORNANDO_A_CENTRAL',
        version: 4,
        ubicacionOrigenId: 1,
        ubicacionDestinoId: 2,
        lineas: [{ id: 501, varianteId: 10, cantidadEnviada: 20 }],
      });

      // Mock de InventoryLedgerService.bloquearYObtenerSaldo
      prismaMock.$queryRaw.mockResolvedValue([
        {
          id: 1,
          ubicacionId: 1,
          varianteId: 10,
          fisico: 30,
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
        fisico: 50, // 30 + 20 devueltas
        reservadoBlando: 0,
        reservadoDuro: 0,
      });
      prismaMock.movimientoInventario.create.mockResolvedValue({ id: 1000n });
      prismaMock.traslado.update.mockResolvedValue({
        id: 101,
        estado: 'CANCELADO',
        version: 5,
      });

      const res = await request(app)
        .post('/api/traslados/101/confirmar-retorno')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          observacion: 'Caja recibida sellada e intacta en Bodega Central',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.estado).toBe('CANCELADO');

      // Validar movimiento TRASLADO_CANCELADO_REINGRESO
      expect(prismaMock.movimientoInventario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: 'TRASLADO_CANCELADO_REINGRESO',
          ubicacionId: 1,
          varianteId: 10,
          cantidadConSigno: 20,
          afectaSaldo: 'FISICO',
          documentoTipo: 'TRASLADO',
          documentoId: 101,
        }),
        select: expect.any(Object),
      });
    });

    it('Rechaza confirmar retorno si el traslado no está en RETORNANDO_A_CENTRAL (HTTP 409)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        id: 101,
        estado: 'ENVIADO', // Todavía en ENVIADO, no ha sido cancelado
        version: 3,
        ubicacionOrigenId: 1,
        lineas: [{ id: 501, varianteId: 10, cantidadEnviada: 20 }],
      });

      const res = await request(app)
        .post('/api/traslados/101/confirmar-retorno')
        .set('Authorization', TOKEN_ADMIN)
        .send();

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/solo se puede confirmar retorno físico de traslados en estado RETORNANDO_A_CENTRAL/i);
      expect(prismaMock.movimientoInventario.create).not.toHaveBeenCalled();
    });
  });
});
