import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1. Variables de entorno requeridas
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
    saldoStock: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    pedidoWeb: {
      findUnique: vi.fn(),
      update: vi.fn(),
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
    variante: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
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
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
    permPedidosWeb: true,
  },
  2: {
    id: 2,
    correo: 'vendedor.sede1@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 10,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
    permPedidosWeb: true,
  },
  3: {
    id: 3,
    correo: 'vendedor.sinperm@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 10,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
    permPedidosWeb: false,
  },
  4: {
    id: 4,
    correo: 'vendedor.sede2@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 20,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
    permPedidosWeb: true,
  },
  5: {
    id: 5,
    correo: 'cliente@gmail.com',
    rol: 'CLIENTE',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
};

describe('Módulo 11: Flujo «No puedo despachar», Cuarentena de SKU y Custodia Central (RN-WEB-16, CA-43, CA-62, QA-013)', () => {
  const adminToken = generateToken({
    userId: 1,
    correo: 'admin@forma.com',
    rol: 'ADMIN',
  });

  const vendedorSede1Token = generateToken({
    userId: 2,
    correo: 'vendedor.sede1@forma.com',
    rol: 'VENDEDOR',
  });

  const vendedorSede1SinPermisoToken = generateToken({
    userId: 3,
    correo: 'vendedor.sinperm@forma.com',
    rol: 'VENDEDOR',
  });

  const vendedorOtraSedeToken = generateToken({
    userId: 4,
    correo: 'vendedor.sede2@forma.com',
    rol: 'VENDEDOR',
  });

  const clienteToken = generateToken({
    userId: 5,
    correo: 'cliente@gmail.com',
    rol: 'CLIENTE',
  });

  const mockPedidoBase = {
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
    costoEnvioCop: 14000,
    subtotalListaCop: 100000,
    descuentoTotalCop: 0,
    totalNetoProductosCop: 100000,
    totalAPagarCop: 114000,
    ubicacionAsignada: {
      id: 10,
      nombre: 'Tienda Cúcuta Centro',
      tipo: 'PUNTO_VENTA',
      despachaWeb: true,
      activa: true,
    },
    municipioDestino: {
      codigoDane: '54001',
      departamentoId: '54',
      departamento: {
        regionId: 'ORIENTE',
      },
      atendidoWeb: true,
    },
    lineas: [
      {
        id: 1,
        pedidoId: 100,
        varianteId: 501,
        cantidad: 2,
        precioListaUnitarioCop: 50000,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => {
      return usuarios[where.id] ?? null;
    });

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      return callback(prismaMock);
    });
  });

  describe('1. Control de Acceso y Aislamiento Multisede (RN-ROL-04, RF-WEB-06)', () => {
    it('debe rechazar con HTTP 403 si un CLIENTE intenta reportar la novedad', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'Prenda con costura rota en tienda',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('clientes no tienen autorización');
    });

    it('debe rechazar con HTTP 403 si un VENDEDOR no cuenta con permPedidosWeb', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce(mockPedidoBase);

      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${vendedorSede1SinPermisoToken}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'Prenda rota en exhibidor',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('permPedidosWeb');
    });

    it('debe rechazar con HTTP 403 si un VENDEDOR de otra sede intenta reportar novedad en este pedido', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce(mockPedidoBase);

      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${vendedorOtraSedeToken}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'Prenda dañada en bodega',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('pedidos asignados a otras sedes');
    });

    it('debe rechazar con HTTP 400 si el motivo tiene menos de 5 caracteres', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${vendedorSede1Token}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'roto',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.detalles?.[0]?.mensaje).toContain('al menos 5 caracteres');
    });
  });

  describe('2. Validaciones de Estado e Invariantes de Reserva (CA-42, RN-WEB-16)', () => {
    it('debe rechazar con HTTP 409 si el pedido está en EN_PREPARACION (reserva dura protegida, CA-42)', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce({
        ...mockPedidoBase,
        estadoPedido: 'EN_PREPARACION',
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${vendedorSede1Token}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'Prenda con mancha de tinta',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('reserva dura protegida');
      expect(res.body.error.message).toContain('CA-42');
    });

    it('debe rechazar con HTTP 422 si el pedido ya fue DESPACHADO, ENTREGADO o CANCELADO', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce({
        ...mockPedidoBase,
        estadoPedido: 'DESPACHADO',
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'Prenda extraviada en despacho',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('DESPACHADO');
    });

    it('debe rechazar con HTTP 400 si la variante reportada no pertenece al pedido', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValueOnce(mockPedidoBase);

      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${vendedorSede1Token}`)
        .send({
          varianteIdsAfectadas: [999], // Variante no existe en pedido
          motivo: 'Articulo inexistente averiado',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('no forma parte de los artículos del pedido');
    });
  });

  describe('3. Reasignación Exitosa a otra sede candidata (CA-43, QA-013)', () => {
    it('debe marcar cuarentena de SKU en sede 1, liberar reserva blanda y reasignar a sede 2 con nueva reserva', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue(mockPedidoBase);

      // Mock de bloqueo pesimista en kardex para liberar reserva blanda en sede 10
      prismaMock.$queryRaw.mockImplementation(async () => {
        return [
          {
            id: 1,
            ubicacionId: 10,
            varianteId: 501,
            fisico: 5,
            reservadoBlando: 2,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          },
        ];
      });

      prismaMock.saldoStock.update.mockResolvedValue({
        id: 1,
        ubicacionId: 10,
        varianteId: 501,
        fisico: 5,
        reservadoBlando: 0,
        reservadoDuro: 0,
      });

      prismaMock.movimientoInventario.create.mockResolvedValue({ id: 101n });

      // Sedes candidatas disponibles (Sede 20: Bucaramanga)
      prismaMock.ubicacion.findMany.mockResolvedValueOnce([
        {
          id: 20,
          nombre: 'Tienda Bucaramanga Cabecera',
          activa: true,
          despachaWeb: true,
          prioridadDespacho: 30,
          municipio: {
            codigoDane: '68001',
            departamentoId: '68',
            departamento: { regionId: 'ORIENTE' },
            atendidoWeb: true,
          },
        },
      ]);

      // Stock en sede 20: disponible 5 unidades sin cuarentena
      prismaMock.saldoStock.findMany.mockResolvedValueOnce([
        {
          id: 2,
          ubicacionId: 20,
          varianteId: 501,
          fisico: 10,
          reservadoBlando: 0,
          reservadoDuro: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      prismaMock.excepcionTarifaEnvio.findMany.mockResolvedValue([]);

      prismaMock.pedidoWeb.update.mockResolvedValue({
        ...mockPedidoBase,
        ubicacionAsignadaId: 20,
        tieneIncidenciaStock: false,
        tieneReservaActiva: true,
        ubicacionAsignada: {
          id: 20,
          nombre: 'Tienda Bucaramanga Cabecera',
          tipo: 'PUNTO_VENTA',
        },
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${vendedorSede1Token}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'Costura rota detectada en exhibidor de sede Cúcuta',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.reasignado).toBe(true);
      expect(res.body.enCustodiaCentral).toBe(false);
      expect(res.body.pedido.ubicacionAsignadaId).toBe(20);

      // Verificación de Cuarentena en Sede 10 (CA-43)
      expect(prismaMock.saldoStock.updateMany).toHaveBeenCalledWith({
        where: { ubicacionId: 10, varianteId: 501 },
        data: {
          bloqueadoDespachoWeb: true,
          motivoBloqueoWeb: 'Costura rota detectada en exhibidor de sede Cúcuta',
        },
      });

      // Verificación de Historial y Auditoría inmutable
      expect(prismaMock.historialEstadoPedidoWeb.create).toHaveBeenCalled();
      expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accion: 'REASIGNACION_PEDIDO_WEB_NO_PUEDO_DESPACHAR',
            datosMinimos: expect.objectContaining({
              sedePreviaId: 10,
              nuevaSedeId: 20,
              varianteIdsAfectadas: [501],
            }),
          }),
        })
      );
    });
  });

  describe('4. Custodia Forzosa en Bodega Central si no hay stock (CA-62, QA-013)', () => {
    it('debe asignar en custodia a Bodega Central con tieneIncidenciaStock=true y alerta al Admin', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue(mockPedidoBase);

      // Bloqueo pesimista para liberar reserva blanda previa
      prismaMock.$queryRaw.mockImplementation(async () => {
        return [
          {
            id: 1,
            ubicacionId: 10,
            varianteId: 501,
            fisico: 2,
            reservadoBlando: 2,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          },
        ];
      });

      prismaMock.saldoStock.update.mockResolvedValue({
        id: 1,
        ubicacionId: 10,
        varianteId: 501,
        fisico: 2,
        reservadoBlando: 0,
        reservadoDuro: 0,
      });

      prismaMock.movimientoInventario.create.mockResolvedValue({ id: 102n });

      // Ninguna otra sede candidata con stock
      prismaMock.ubicacion.findMany.mockResolvedValueOnce([
        {
          id: 20,
          nombre: 'Tienda Bucaramanga Cabecera',
          activa: true,
          despachaWeb: true,
          prioridadDespacho: 30,
          municipio: {
            codigoDane: '68001',
            departamentoId: '68',
            departamento: { regionId: 'ORIENTE' },
            atendidoWeb: true,
          },
        },
      ]);

      // Sede 20 tiene disponible 0 (insuficiente para cubrir la cantidad 2)
      prismaMock.saldoStock.findMany.mockResolvedValueOnce([
        {
          id: 2,
          ubicacionId: 20,
          varianteId: 501,
          fisico: 0,
          reservadoBlando: 0,
          reservadoDuro: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      prismaMock.excepcionTarifaEnvio.findMany.mockResolvedValue([]);

      // Mock de Bodega Central activa
      prismaMock.ubicacion.findFirst.mockResolvedValueOnce({
        id: 99,
        nombre: 'Bodega Central Cúcuta',
        tipo: 'CENTRAL',
        activa: true,
      });

      prismaMock.pedidoWeb.update.mockResolvedValue({
        ...mockPedidoBase,
        ubicacionAsignadaId: 99,
        tieneIncidenciaStock: true,
        tieneReservaActiva: false,
        ubicacionAsignada: {
          id: 99,
          nombre: 'Bodega Central Cúcuta',
          tipo: 'CENTRAL',
        },
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/no-puedo-despachar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          varianteIdsAfectadas: [501],
          motivo: 'Última prenda mojada por gotera en almacén',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.reasignado).toBe(false);
      expect(res.body.enCustodiaCentral).toBe(true);
      expect(res.body.pedido.ubicacionAsignadaId).toBe(99);
      expect(res.body.pedido.tieneIncidenciaStock).toBe(true);
      expect(res.body.pedido.tieneReservaActiva).toBe(false);

      // Verificación de Cuarentena en Sede 10
      expect(prismaMock.saldoStock.updateMany).toHaveBeenCalledWith({
        where: { ubicacionId: 10, varianteId: 501 },
        data: {
          bloqueadoDespachoWeb: true,
          motivoBloqueoWeb: 'Última prenda mojada por gotera en almacén',
        },
      });

      // Verificación de Registro de Auditoría con alertaAdmin (RF-REP-02)
      expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accion: 'CUSTODIA_CENTRAL_INCIDENCIA_STOCK',
            datosMinimos: expect.objectContaining({
              sedePreviaId: 10,
              centralId: 99,
              alertaAdmin: true,
            }),
          }),
        })
      );
    });
  });
});
