import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1. Variables de entorno antes de importar
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
    resolucionNovedadTraslado: {
      create: vi.fn(),
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
      upsert: vi.fn(),
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
import { InventoryLedgerService } from '../../04-inventario/InventoryLedgerService.js';

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
    permRecibirTraslado: true,
    permVerOtrosPuntos: true,
  },
  2: {
    id: 2,
    correo: 'vendedor_norte@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 2, // Sede Norte (destino del traslado)
    activo: true,
    topeDescuentoPorc: 10,
    ...permisosBase,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
  },
  3: {
    id: 3,
    correo: 'vendedor_sur@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 3, // Sede Sur (otra tienda)
    activo: true,
    topeDescuentoPorc: 10,
    ...permisosBase,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
  },
  4: {
    id: 4,
    correo: 'vendedor_sin_permiso@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 2,
    activo: true,
    topeDescuentoPorc: 0,
    ...permisosBase,
  },
};

const TOKEN_ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const TOKEN_VENDEDOR_NORTE = `Bearer ${generateToken({ userId: 2, correo: 'vendedor_norte@forma.com', rol: 'VENDEDOR' })}`;
const TOKEN_VENDEDOR_SUR = `Bearer ${generateToken({ userId: 3, correo: 'vendedor_sur@forma.com', rol: 'VENDEDOR' })}`;
const TOKEN_VENDEDOR_SIN_PERM = `Bearer ${generateToken({ userId: 4, correo: 'vendedor_sin_permiso@forma.com', rol: 'VENDEDOR' })}`;

describe('Módulo 06: Traslados - Recepción en Punto y Resolución de Novedades (SP2-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    // Simular transacción interactiva
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);

    // Mock de idempotencia
    prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
    prismaMock.registroIdempotencia.create.mockResolvedValue({});
    prismaMock.registroIdempotencia.upsert.mockResolvedValue({});
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 100n });

    // Mock de InventoryLedgerService
    vi.spyOn(InventoryLedgerService, 'registrarMovimientosBatch').mockResolvedValue([] as any);
  });

  describe('RF-TRA-05: Recepción en Punto de Venta (POST /api/traslados/:id/recibir)', () => {
    const mockTrasladoEnviado = {
      id: 10,
      ubicacionOrigenId: 1, // Central
      ubicacionDestinoId: 2, // Tienda Norte
      estado: 'ENVIADO',
      version: 1,
      lineas: [
        {
          id: 101,
          trasladoId: 10,
          varianteId: 5,
          cantidadSolicitada: 30,
          cantidadAprobada: 30,
          cantidadEnviada: 30,
          cantidadRecibidaBuena: null,
          cantidadRecibidaDanada: null,
          excedenteReportado: 0,
          unidadesFaltantesPendientes: 0,
          excedentePendienteResolver: 0,
        },
      ],
      ubicacionOrigen: { id: 1, nombre: 'Bodega Central', tipo: 'CENTRAL' },
      ubicacionDestino: { id: 2, nombre: 'Tienda Norte', tipo: 'TIENDA' },
    };

    it('CA-57 / QA-010: Recepción conforme con prendas buenas y dañadas transiciona directo a RECIBIDO', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({ ...mockTrasladoEnviado });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 101 });
      prismaMock.traslado.update.mockResolvedValue({
        ...mockTrasladoEnviado,
        estado: 'RECIBIDO',
        fechaRecepcion: new Date(),
        fechaCierre: new Date(),
        version: 2,
      });

      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-recibir-001')
        .send({
          observacion: 'Llegaron 28 buenas y 2 dañadas por humedad en empaque (CA-57)',
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 28,
              cantidadRecibidaDanada: 2,
              excedenteReportado: 0,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.estado).toBe('RECIBIDO');

      // Verificar que se invocó el Kardex con las 2 afectaciones
      expect(InventoryLedgerService.registrarMovimientosBatch).toHaveBeenCalledTimes(1);
      const batchArgs = (InventoryLedgerService.registrarMovimientosBatch as any).mock.calls[0][1];
      expect(batchArgs).toHaveLength(2);
      expect(batchArgs[0]).toMatchObject({
        tipo: 'TRASLADO_RECIBIDO_BUENO',
        cantidadConSigno: 28,
        afectaSaldo: 'FISICO',
        ubicacionId: 2,
      });
      expect(batchArgs[1]).toMatchObject({
        tipo: 'TRASLADO_RECIBIDO_DANADO',
        cantidadConSigno: 2,
        afectaSaldo: 'NO_VENDIBLE',
        ubicacionId: 2,
      });
    });

    it('CA-07: Rechaza con HTTP 400 si recibidaBuena + recibidaDanada > cantidadEnviada', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({ ...mockTrasladoEnviado });

      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-recibir-002')
        .send({
          observacion: 'Intento de reportar 31 sobre 30 enviadas',
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 30,
              cantidadRecibidaDanada: 1, // 30 + 1 = 31 > 30!
              excedenteReportado: 0,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error)).toContain('supera la cantidad enviada');
      expect(InventoryLedgerService.registrarMovimientosBatch).not.toHaveBeenCalled();
    });

    it('CA-58 / QA-011: Recepción con faltantes pasa a RECIBIDO_CON_NOVEDAD y registra faltantes pendientes', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({ ...mockTrasladoEnviado });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 101 });
      prismaMock.traslado.update.mockResolvedValue({
        ...mockTrasladoEnviado,
        estado: 'RECIBIDO_CON_NOVEDAD',
        fechaRecepcion: new Date(),
        fechaCierre: null,
        version: 2,
      });

      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-recibir-003')
        .send({
          observacion: 'Faltan 5 unidades en la caja precintada (CA-58)',
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 25,
              cantidadRecibidaDanada: 0,
              excedenteReportado: 0,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('RECIBIDO_CON_NOVEDAD');

      expect(prismaMock.lineaTraslado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 101 },
          data: expect.objectContaining({
            cantidadRecibidaBuena: 25,
            cantidadRecibidaDanada: 0,
            unidadesFaltantesPendientes: 5,
          }),
        })
      );
    });

    it('CA-58 / QA-011: Recepción con excedente reportado transiciona a RECIBIDO_CON_NOVEDAD', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({ ...mockTrasladoEnviado });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 101 });
      prismaMock.traslado.update.mockResolvedValue({
        ...mockTrasladoEnviado,
        estado: 'RECIBIDO_CON_NOVEDAD',
        fechaRecepcion: new Date(),
        fechaCierre: null,
        version: 2,
      });

      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-recibir-004')
        .send({
          observacion: 'Llegaron 30 conformes pero se hallaron 2 prendas sobrantes en la caja',
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 30,
              cantidadRecibidaDanada: 0,
              excedenteReportado: 2,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('RECIBIDO_CON_NOVEDAD');
      expect(prismaMock.lineaTraslado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            excedenteReportado: 2,
            excedentePendienteResolver: 2,
          }),
        })
      );
    });

    it('RN-TRA-09: Exige observación obligatoria cuando hay averías o faltantes', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({ ...mockTrasladoEnviado });

      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-recibir-005')
        .send({
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 28,
              cantidadRecibidaDanada: 2,
              excedenteReportado: 0,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error)).toContain('observación de recepción es obligatoria');
    });

    it('RN-ROL-04 / Aislamiento de sede: Vendedor de otra tienda recibe HTTP 403 Forbidden', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({ ...mockTrasladoEnviado });

      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_SUR) // Tienda 3, pero traslado es para Tienda 2
        .set('Idempotency-Key', 'idem-recibir-006')
        .send({
          observacion: 'Intento de recepción ajena',
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 30,
              cantidadRecibidaDanada: 0,
              excedenteReportado: 0,
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body.error)).toContain('no es su punto de venta asignado');
    });

    it('RN-TRA-07: Rechaza con HTTP 409 si el traslado no está en estado ENVIADO', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({
        ...mockTrasladoEnviado,
        estado: 'SOLICITADO',
      });

      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .set('Idempotency-Key', 'idem-recibir-007')
        .send({
          observacion: 'Intento de recibir traslado aún no despachado',
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 30,
              cantidadRecibidaDanada: 0,
            },
          ],
        });

      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body.error)).toContain('Solo se pueden recibir traslados en estado ENVIADO');
    });

    it('RN-ROL-03: Vendedor sin permRecibirTraslado recibe HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/traslados/10/recibir')
        .set('Authorization', TOKEN_VENDEDOR_SIN_PERM)
        .set('Idempotency-Key', 'idem-recibir-008')
        .send({
          observacion: 'Sin permiso',
          lineas: [
            {
              lineaId: 101,
              cantidadRecibidaBuena: 30,
              cantidadRecibidaDanada: 0,
            },
          ],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('RF-TRA-06: Resolución de Novedades (POST /api/traslados/:id/resolver-novedad)', () => {
    const mockTrasladoConNovedad = {
      id: 20,
      ubicacionOrigenId: 1, // Central
      ubicacionDestinoId: 2, // Tienda Norte
      estado: 'RECIBIDO_CON_NOVEDAD',
      version: 2,
      lineas: [
        {
          id: 201,
          trasladoId: 20,
          varianteId: 7,
          cantidadSolicitada: 20,
          cantidadAprobada: 20,
          cantidadEnviada: 20,
          cantidadRecibidaBuena: 15,
          cantidadRecibidaDanada: 0,
          excedenteReportado: 0,
          unidadesFaltantesPendientes: 5,
          excedentePendienteResolver: 0,
        },
      ],
      ubicacionOrigen: { id: 1, nombre: 'Bodega Central', tipo: 'CENTRAL' },
      ubicacionDestino: { id: 2, nombre: 'Tienda Norte', tipo: 'TIENDA' },
    };

    it('CA-10: Vendedor que intenta resolver novedad recibe HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/traslados/20/resolver-novedad')
        .set('Authorization', TOKEN_VENDEDOR_NORTE)
        .send({
          resoluciones: [
            {
              lineaTrasladoId: 201,
              tipoResolucion: 'LLEGO_A_PUNTO',
              cantidadResuelta: 5,
              motivo: 'Intento de resolución no autorizada por vendedor (CA-10)',
            },
          ],
        });

      expect(res.status).toBe(403);
    });

    it('CA-10: Administrador resuelve faltante como LLEGO_A_PUNTO y cierra el traslado en CERRADO', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue(JSON.parse(JSON.stringify(mockTrasladoConNovedad)));
      prismaMock.resolucionNovedadTraslado.create.mockResolvedValue({ id: 501 });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 201, unidadesFaltantesPendientes: 0 });
      prismaMock.traslado.update.mockResolvedValue({
        ...mockTrasladoConNovedad,
        estado: 'CERRADO',
        fechaCierre: new Date(),
        version: 3,
      });

      const res = await request(app)
        .post('/api/traslados/20/resolver-novedad')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          resoluciones: [
            {
              lineaTrasladoId: 201,
              tipoResolucion: 'LLEGO_A_PUNTO',
              cantidadResuelta: 5,
              motivo: 'Mercancía apareció en caja secundaria de la transportadora (CA-10)',
              responsable: 'Coordinador Logístico Transportadora',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.estado).toBe('CERRADO');

      // Verificar que se incrementó físico en la tienda destino
      expect(InventoryLedgerService.registrarMovimientosBatch).toHaveBeenCalledTimes(1);
      const batchArgs = (InventoryLedgerService.registrarMovimientosBatch as any).mock.calls[0][1];
      expect(batchArgs[0]).toMatchObject({
        tipo: 'NOVEDAD_LLEGO_DESTINO',
        cantidadConSigno: 5,
        afectaSaldo: 'FISICO',
        ubicacionId: 2,
      });
    });

    it('CA-10: Administrador resuelve faltante como RETORNO_A_CENTRAL (reingresa a Central)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue(JSON.parse(JSON.stringify(mockTrasladoConNovedad)));
      prismaMock.resolucionNovedadTraslado.create.mockResolvedValue({ id: 502 });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 201, unidadesFaltantesPendientes: 0 });
      prismaMock.traslado.update.mockResolvedValue({
        ...mockTrasladoConNovedad,
        estado: 'CERRADO',
        version: 3,
      });

      const res = await request(app)
        .post('/api/traslados/20/resolver-novedad')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          resoluciones: [
            {
              lineaTrasladoId: 201,
              tipoResolucion: 'RETORNO_A_CENTRAL',
              cantidadResuelta: 5,
              motivo: 'Paquete devuelto a Bodega Central por error de etiquetado',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('CERRADO');

      const batchArgs = (InventoryLedgerService.registrarMovimientosBatch as any).mock.calls[0][1];
      expect(batchArgs[0]).toMatchObject({
        tipo: 'NOVEDAD_RETORNO_ORIGEN',
        cantidadConSigno: 5,
        afectaSaldo: 'FISICO',
        ubicacionId: 1, // Central
      });
    });

    it('CA-10: Administrador resuelve faltante como PERDIDA_AJUSTE (sin mover stock)', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue(JSON.parse(JSON.stringify(mockTrasladoConNovedad)));
      prismaMock.resolucionNovedadTraslado.create.mockResolvedValue({ id: 503 });
      prismaMock.lineaTraslado.update.mockResolvedValue({ id: 201, unidadesFaltantesPendientes: 0 });
      prismaMock.traslado.update.mockResolvedValue({
        ...mockTrasladoConNovedad,
        estado: 'CERRADO',
        version: 3,
      });

      const res = await request(app)
        .post('/api/traslados/20/resolver-novedad')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          resoluciones: [
            {
              lineaTrasladoId: 201,
              tipoResolucion: 'PERDIDA_AJUSTE',
              cantidadResuelta: 5,
              motivo: 'Pérdida/hurto en trayecto confirmado por transportadora',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('CERRADO');
      expect(InventoryLedgerService.registrarMovimientosBatch).not.toHaveBeenCalled();
    });

    it('Rechaza si la cantidad a resolver supera las unidades faltantes pendientes', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue(JSON.parse(JSON.stringify(mockTrasladoConNovedad))); // 5 pendientes

      const res = await request(app)
        .post('/api/traslados/20/resolver-novedad')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          resoluciones: [
            {
              lineaTrasladoId: 201,
              tipoResolucion: 'LLEGO_A_PUNTO',
              cantidadResuelta: 10, // 10 > 5!
              motivo: 'Intento de resolver más de lo pendiente',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error)).toContain('supera las unidades faltantes pendientes');
    });

    it('QA-014: Conflicto de versión optimista arroja HTTP 409 Conflict', async () => {
      prismaMock.traslado.findUnique.mockResolvedValue({ ...mockTrasladoConNovedad, version: 5 });

      const res = await request(app)
        .post('/api/traslados/20/resolver-novedad')
        .set('Authorization', TOKEN_ADMIN)
        .send({
          version: 2, // Versión desactualizada
          resoluciones: [
            {
              lineaTrasladoId: 201,
              tipoResolucion: 'LLEGO_A_PUNTO',
              cantidadResuelta: 5,
              motivo: 'Intento con versión vieja',
            },
          ],
        });

      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body.error)).toContain('Conflicto de concurrencia');
    });
  });
});
