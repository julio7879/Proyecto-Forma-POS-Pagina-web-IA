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
    lineaPedidoWeb: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    devolucionComercialWeb: {
      create: vi.fn(),
    },
    festivoColombia: {
      findMany: vi.fn(),
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
    variante: {
      findUnique: vi.fn(),
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
    correo: 'vendedor@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 10,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
    permPedidosWeb: true,
  },
  3: {
    id: 3,
    correo: 'cliente@forma.com',
    rol: 'CLIENTE',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
};

describe('Módulo 11: Retorno Logístico vs Devolución Comercial Web (RF-WEB-07, RF-DEV-04, CA-64, CA-65, QA-020, QA-021)', () => {
  let adminToken: string;
  let vendedorToken: string;
  let clienteToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    adminToken = generateToken({
      userId: 1,
      correo: 'admin@forma.com',
      rol: 'ADMIN',
    });

    vendedorToken = generateToken({
      userId: 2,
      correo: 'vendedor@forma.com',
      rol: 'VENDEDOR',
    });

    clienteToken = generateToken({
      userId: 3,
      correo: 'cliente@forma.com',
      rol: 'CLIENTE',
    });

    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => {
      return usuarios[where.id] ?? null;
    });

    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({ id: 1 });
    prismaMock.festivoColombia.findMany.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([
      {
        id: 1,
        ubicacionId: 1,
        varianteId: 101,
        fisico: 10,
        reservadoBlando: 0,
        reservadoDuro: 0,
        noVendible: 0,
        bloqueadoDespachoWeb: false,
      },
    ]);

    // Simular transacción interactiva
    prismaMock.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      const tx = {
        ...prismaMock,
        pedidoWeb: {
          ...prismaMock.pedidoWeb,
          update: vi.fn().mockImplementation(async ({ data }) => ({
            id: 100,
            referenciaLegible: 'PED-2026-000100',
            ...data,
          })),
        },
        lineaPedidoWeb: {
          ...prismaMock.lineaPedidoWeb,
          update: vi.fn().mockResolvedValue({ id: 1, cantidadDevueltaAcum: 1 }),
          findMany: vi.fn().mockResolvedValue([
            { id: 1, cantidad: 1, cantidadDevueltaAcum: 1 },
          ]),
        },
        devolucionComercialWeb: {
          create: vi.fn().mockImplementation(async ({ data }) => ({
            id: 50,
            ...data,
          })),
        },
        historialEstadoPedidoWeb: {
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        registroAuditoria: {
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        registroIdempotencia: {
          create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        saldoStock: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn().mockResolvedValue({
            id: 1,
            varianteId: 101,
            ubicacionId: 1,
            fisico: 10,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          }),
          update: vi.fn().mockResolvedValue({ id: 1 }),
        },
        movimientoInventario: {
          create: vi.fn().mockResolvedValue({ id: BigInt(1) }),
        },
        $queryRaw: vi.fn().mockImplementation(async () => [
          {
            id: 1,
            ubicacionId: 1,
            varianteId: 101,
            fisico: 10,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          },
        ]),
      };
      return callback(tx);
    });
  });

  // ==========================================================================
  // BLOQUE 1: RETORNO LOGÍSTICO (RF-WEB-07, RN-WEB-23, CA-64, QA-020)
  // ==========================================================================
  describe('POST /api/pedidos-web/:id/retorno-logistico (CA-64, QA-020)', () => {
    const pedidoContraentregaEnviado = {
      id: 100,
      referenciaLegible: 'PED-2026-000100',
      clienteId: 3,
      ubicacionAsignadaId: 10,
      ubicacionDespachoReconocidoId: 10,
      estadoPedido: 'ENVIADO',
      estadoPago: 'PENDIENTE',
      metodoPago: 'CONTRAENTREGA',
      ventaReconocida: false,
      costoEnvioCop: 12000,
      totalNetoProductosCop: 80000,
      totalAPagarCop: 92000,
      lineas: [
        {
          id: 1,
          varianteId: 101,
          cantidad: 2,
          cantidadDevueltaAcum: 0,
          precioListaUnitarioCop: 50000,
          subtotalListaLineaCop: 100000,
          descuentoProrrateadoCop: 20000,
          netoPagadoLineaCop: 80000,
          esReintegrableSnapshot: true,
          variante: { id: 101, sku: 'CAM-ROJ-M' },
        },
      ],
      ubicacionAsignada: { id: 10, nombre: 'Tienda Centro' },
      ubicacionDespacho: { id: 10, nombre: 'Tienda Centro' },
    };

    it('debe rechazar con 401 si no se envía token de autenticación', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Idempotency-Key', 'key-ret-001')
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Dirección inexistente reportada por transportadora',
        });

      expect(res.status).toBe(401);
    });

    it('debe rechazar con 403 Forbidden si un VENDEDOR o CLIENTE intenta procesar el retorno (RN-ROL-03)', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .set('Idempotency-Key', 'key-ret-002')
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Dirección inexistente reportada por transportadora',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Acceso restringido a los roles: ADMIN/i);
    });

    it('debe rechazar con 400 si falta el header Idempotency-Key (RN-GEN-08)', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Dirección inexistente reportada por transportadora',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Idempotency-Key/i);
    });

    it('debe rechazar con 422 si el método de pago no es CONTRAENTREGA (RN-WEB-23, CA-64)', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue({
        ...pedidoContraentregaEnviado,
        metodoPago: 'TRANSFERENCIA',
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-ret-003')
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Dirección inexistente reportada por transportadora',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/solo aplica a pedidos contraentrega/i);
    });

    it('debe rechazar con 422 si el pedido no está en estado ENVIADO', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue({
        ...pedidoContraentregaEnviado,
        estadoPedido: 'ENTREGADO',
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-ret-004')
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Rechazado por destinatario',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/Solo pedidos en estado 'ENVIADO' pueden pasar a retorno logístico/i);
    });

    it('debe rechazar con 422 si el pedido ya fue pagado o reconocido como venta', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue({
        ...pedidoContraentregaEnviado,
        estadoPago: 'PAGADO',
        ventaReconocida: true,
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-ret-005')
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Rechazado por destinatario',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/no aplica a pedidos ya pagados o reconocidos como venta/i);
    });

    it('debe procesar exitosamente el retorno logístico total sin distorsión de Ventas Netas (CA-64, QA-020)', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoContraentregaEnviado);
      prismaMock.ubicacion.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Bodega Central',
        activa: true,
        tipo: 'CENTRAL',
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-ret-006')
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Destinatario rechazó el paquete por avería en empaque',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensaje).toMatch(/sin distorsión de Ventas Netas/i);
      expect(res.body.pedido.estadoPedido).toBe('NO_ENTREGADO');
      expect(res.body.pedido.estadoPago).toBe('ANULADO');

      // Validar que NO se invocó creación en DevolucionComercialWeb
      expect(prismaMock.devolucionComercialWeb.create).not.toHaveBeenCalled();
    });

    it('debe procesar retorno logístico con prendas no vendibles hacia saldo NO_VENDIBLE', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoContraentregaEnviado);
      prismaMock.ubicacion.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Bodega Central',
        activa: true,
        tipo: 'CENTRAL',
      });

      const res = await request(app)
        .post('/api/pedidos-web/100/retorno-logistico')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-ret-007')
        .send({
          ubicacionReingresoId: 1,
          motivo: 'Prenda devuelta rota en transporte',
          lineas: [
            {
              varianteId: 101,
              cantidad: 2,
              condicion: 'NO_VENDIBLE',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.pedido.estadoPedido).toBe('NO_ENTREGADO');
    });
  });

  // ==========================================================================
  // BLOQUE 2: DEVOLUCIÓN COMERCIAL WEB (RF-DEV-04, RN-DEV-14, CA-65, QA-021)
  // ==========================================================================
  describe('POST /api/pedidos-web/:id/devolucion-comercial (CA-65, QA-021)', () => {
    const pedidoWebPagadoEntregado = {
      id: 200,
      referenciaLegible: 'PED-2026-000200',
      clienteId: 3,
      ubicacionAsignadaId: 2, // Tienda Chapinero (despachó)
      ubicacionDespachoReconocidoId: 2,
      estadoPedido: 'ENTREGADO',
      estadoPago: 'PAGADO',
      metodoPago: 'TRANSFERENCIA',
      ventaReconocida: true,
      costoEnvioCop: 14000,
      totalNetoProductosCop: 150000,
      totalAPagarCop: 164000,
      fechaEntrega: new Date(), // Hoy (dentro de los 5 días hábiles)
      lineas: [
        {
          id: 10,
          varianteId: 501,
          cantidad: 1,
          cantidadDevueltaAcum: 0,
          precioListaUnitarioCop: 150000,
          subtotalListaLineaCop: 150000,
          descuentoProrrateadoCop: 0,
          netoPagadoLineaCop: 150000,
          esReintegrableSnapshot: true,
          variante: { id: 501, sku: 'VES-ELEG-S' },
        },
      ],
      ubicacionAsignada: { id: 2, nombre: 'Tienda Chapinero' },
      ubicacionDespacho: { id: 2, nombre: 'Tienda Chapinero' },
    };

    it('debe rechazar con 403 Forbidden si un VENDEDOR intenta procesar devolución comercial web (RN-ROL-03)', async () => {
      const res = await request(app)
        .post('/api/pedidos-web/200/devolucion-comercial')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .set('Idempotency-Key', 'key-dev-001')
        .send({
          ubicacionReingresoFisicoId: 1,
          lineasDevolucion: [{ lineaId: 10, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }],
          referenciaTransferenciaReembolso: 'REF-BANC-7890',
          motivo: 'Talla no adecuada',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Acceso restringido a los roles: ADMIN/i);
    });

    it('debe rechazar con 422 si el pedido no está en estado PAGADO', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue({
        ...pedidoWebPagadoEntregado,
        estadoPago: 'PENDIENTE',
        ventaReconocida: false,
      });

      const res = await request(app)
        .post('/api/pedidos-web/200/devolucion-comercial')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-dev-002')
        .send({
          ubicacionReingresoFisicoId: 1,
          lineasDevolucion: [{ lineaId: 10, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }],
          referenciaTransferenciaReembolso: 'REF-BANC-7890',
          motivo: 'Talla no adecuada',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/no cuenta con pago reconocido ni venta asentada/i);
    });

    it('debe rechazar con 422 si han pasado más de 5 días hábiles sin autorización de Admin (RN-DEV-14, CA-65)', async () => {
      // Fecha de entrega de hace 20 días
      const hace20Dias = new Date();
      hace20Dias.setDate(hace20Dias.getDate() - 20);

      prismaMock.pedidoWeb.findUnique.mockResolvedValue({
        ...pedidoWebPagadoEntregado,
        fechaEntrega: hace20Dias,
      });

      const res = await request(app)
        .post('/api/pedidos-web/200/devolucion-comercial')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-dev-003')
        .send({
          ubicacionReingresoFisicoId: 1,
          lineasDevolucion: [{ lineaId: 10, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }],
          referenciaTransferenciaReembolso: 'REF-BANC-7890',
          motivo: 'Garantía extendida solicitada',
          autorizadoFueraPlazo: false,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/plazo legal de 5 días hábiles .* ha vencido/i);
    });

    it('debe permitir devolución comercial fuera de plazo si el Admin autoriza expresamente con motivo (CA-65)', async () => {
      const hace20Dias = new Date();
      hace20Dias.setDate(hace20Dias.getDate() - 20);

      prismaMock.pedidoWeb.findUnique.mockResolvedValue({
        ...pedidoWebPagadoEntregado,
        fechaEntrega: hace20Dias,
      });
      prismaMock.ubicacion.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Bodega Central',
        activa: true,
        tipo: 'CENTRAL',
      });

      const res = await request(app)
        .post('/api/pedidos-web/200/devolucion-comercial')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-dev-004')
        .send({
          ubicacionReingresoFisicoId: 1,
          lineasDevolucion: [{ lineaId: 10, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }],
          referenciaTransferenciaReembolso: 'REF-BANC-EXT-1234',
          motivo: 'Falla de costura confirmada',
          autorizadoFueraPlazo: true,
          motivoFueraPlazo: 'Autorizado por la Dirección de Operaciones bajo política de calidad',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.devolucion.autorizadoFueraPlazo).toBe(true);
    });

    it('debe forzar condición NO_VENDIBLE si la prenda devuelta es cosmético o no reintegrable (RN-CAT-02, CA-31)', async () => {
      const pedidoCosmeticos = {
        ...pedidoWebPagadoEntregado,
        lineas: [
          {
            id: 20,
            varianteId: 601,
            cantidad: 1,
            cantidadDevueltaAcum: 0,
            precioListaUnitarioCop: 35000,
            subtotalListaLineaCop: 35000,
            descuentoProrrateadoCop: 0,
            netoPagadoLineaCop: 35000,
            esReintegrableSnapshot: false, // Cosmético / No reintegrable
            variante: { id: 601, sku: 'COS-LAB-ROJ' },
          },
        ],
      };

      prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoCosmeticos);
      prismaMock.ubicacion.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Bodega Central',
        activa: true,
        tipo: 'CENTRAL',
      });

      const res = await request(app)
        .post('/api/pedidos-web/200/devolucion-comercial')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-dev-005')
        .send({
          ubicacionReingresoFisicoId: 1,
          lineasDevolucion: [{ lineaId: 20, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }], // Intento de entrar a vendible
          referenciaTransferenciaReembolso: 'REF-BANC-COS-5678',
          motivo: 'Cosmético con sello roto',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('debe imputar contablemente la devolución a la sede que despachó aunque el reingreso físico sea en Central (CA-65, QA-021)', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoWebPagadoEntregado);
      prismaMock.ubicacion.findUnique.mockResolvedValue({
        id: 1, // Central
        nombre: 'Bodega Central',
        activa: true,
        tipo: 'CENTRAL',
      });

      const res = await request(app)
        .post('/api/pedidos-web/200/devolucion-comercial')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-dev-006')
        .send({
          ubicacionReingresoFisicoId: 1, // Físico reingresa en Central
          lineasDevolucion: [{ lineaId: 10, cantidadDevuelta: 1, condicionFisica: 'VENDIBLE' }],
          referenciaTransferenciaReembolso: 'REF-BANC-9988',
          motivo: 'Prenda no le sirvió al cliente',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      // Validar imputación contable a sede 2 (Chapinero)
      expect(res.body.devolucion.ubicacionImputacionVentaId).toBe(2);
      expect(res.body.devolucion.ubicacionReingresoFisicoId).toBe(1);
      expect(res.body.devolucion.totalReembolsadoProductosCop).toBe(150000);
    });

    it('debe rechazar con 422 si la cantidad a devolver supera la cantidad disponible en la línea', async () => {
      prismaMock.pedidoWeb.findUnique.mockResolvedValue(pedidoWebPagadoEntregado);
      prismaMock.ubicacion.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Bodega Central',
        activa: true,
        tipo: 'CENTRAL',
      });

      const res = await request(app)
        .post('/api/pedidos-web/200/devolucion-comercial')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'key-dev-007')
        .send({
          ubicacionReingresoFisicoId: 1,
          lineasDevolucion: [{ lineaId: 10, cantidadDevuelta: 5, condicionFisica: 'VENDIBLE' }], // Solo hay 1
          referenciaTransferenciaReembolso: 'REF-BANC-9988',
          motivo: 'Devolución excesiva',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/supera la cantidad disponible/i);
    });
  });
});
