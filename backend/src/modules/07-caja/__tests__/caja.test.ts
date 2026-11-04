import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn() },
  ubicacion: { findUnique: vi.fn(), findFirst: vi.fn() },
  sesionCaja: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  movimientoCaja: { findMany: vi.fn(), create: vi.fn() },
  relevoTurnoCaja: { create: vi.fn() },
  pagoVentaPOS: { findMany: vi.fn() },
  devolucionPOS: { findMany: vi.fn() },
  registroAuditoria: { create: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

import request from 'supertest';
import { app } from '../../../app.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';
import { ColombiaTime } from '../../../shared/domain/ColombiaTime.js';

const TOKEN_ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const TOKEN_CAJERO = `Bearer ${generateToken({ userId: 2, correo: 'cajero@forma.com', rol: 'VENDEDOR' })}`;

const usuarios: Record<number, any> = {
  1: { id: 1, correo: 'admin@forma.com', rol: 'ADMIN', activo: true, ubicacionId: 1 },
  2: {
    id: 2,
    correo: 'cajero@forma.com',
    rol: 'VENDEDOR',
    activo: true,
    ubicacionId: 2,
    permCaja: true,
    permVender: true,
    permDevoluciones: true,
    permAnularVentas: true,
  },
  3: { id: 3, correo: 'relevo@forma.com', rol: 'VENDEDOR', activo: true, ubicacionId: 2, permCaja: true },
};

const tiendaNorte = { id: 2, nombre: 'Tienda Norte', tipo: 'TIENDA', activa: true, baseCajaCop: 200000 };

describe('Módulo 07: Sesiones de Caja, Movimientos y Cierre Ciego (SP3-01, RF-CAJ-01 a 03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UserPermissionCache.clear();

    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);
    prismaMock.ubicacion.findUnique.mockResolvedValue(tiendaNorte);
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 1n });
  });

  describe('POST /api/caja/apertura (RF-CAJ-01, RN-CAJ-01 a 04)', () => {
    it('abre una sesión con la base configurada ($200.000 COP) exitosamente (201)', async () => {
      prismaMock.sesionCaja.findFirst.mockResolvedValue(null);
      prismaMock.sesionCaja.create.mockImplementation(async ({ data }: any) => ({
        id: 10,
        ...data,
      }));

      const res = await request(app)
        .post('/api/caja/apertura')
        .set('Authorization', TOKEN_CAJERO)
        .send({ ubicacionId: 2, baseContadaCop: 200000 });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.id).toBe(10);
      expect(res.body.datos.estado).toBe('ABIERTA');
      expect(res.body.datos.baseConfiguradaCop).toBe(200000);
      expect(res.body.datos.baseContadaCop).toBe(200000);
    });

    it('exige observación si la base contada difiere de los $200.000 COP configurados (RN-CAJ-02, 400)', async () => {
      prismaMock.sesionCaja.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/caja/apertura')
        .set('Authorization', TOKEN_CAJERO)
        .send({ ubicacionId: 2, baseContadaCop: 150000 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/difiere de la base configurada/);
      expect(prismaMock.sesionCaja.create).not.toHaveBeenCalled();
    });

    it('permite base contada diferente si se envía observación justificativa (201)', async () => {
      prismaMock.sesionCaja.findFirst.mockResolvedValue(null);
      prismaMock.sesionCaja.create.mockImplementation(async ({ data }: any) => ({
        id: 11,
        ...data,
      }));

      const res = await request(app)
        .post('/api/caja/apertura')
        .set('Authorization', TOKEN_CAJERO)
        .send({
          ubicacionId: 2,
          baseContadaCop: 180000,
          observacionApertura: 'Faltó menudo de $2.000 y $5.000 por cambio',
        });

      expect(res.status).toBe(201);
      expect(res.body.datos.baseContadaCop).toBe(180000);
      expect(res.body.datos.observacionApertura).toBe('Faltó menudo de $2.000 y $5.000 por cambio');
    });

    it('rechaza abrir si ya existe una sesión ABIERTA en ese punto (RN-CAJ-01, QA-007, 409)', async () => {
      prismaMock.sesionCaja.findFirst.mockResolvedValue({ id: 5, ubicacionId: 2, estado: 'ABIERTA' });

      const res = await request(app)
        .post('/api/caja/apertura')
        .set('Authorization', TOKEN_CAJERO)
        .send({ ubicacionId: 2, baseContadaCop: 200000 });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/Ya existe la sesión de caja ABIERTA/);
      expect(prismaMock.sesionCaja.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/caja/movimiento (RF-CAJ-02, RN-CAJ-07)', () => {
    it('registra sangría de retiro, gasto menor e ingreso manual (201)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findUnique.mockResolvedValue({
        id: 10,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
        baseContadaCop: 200000,
      });
      prismaMock.pagoVentaPOS.findMany.mockResolvedValue([{ montoCop: 300000 }]);
      prismaMock.devolucionPOS.findMany.mockResolvedValue([]);
      prismaMock.movimientoCaja.findMany.mockResolvedValue([]);
      prismaMock.movimientoCaja.create.mockImplementation(async ({ data }: any) => ({ id: 101, ...data }));

      // Total disponible en caja = 200.000 + 300.000 = 500.000
      const res = await request(app)
        .post('/api/caja/movimiento')
        .set('Authorization', TOKEN_CAJERO)
        .send({
          sesionCajaId: 10,
          tipo: 'SANGRIA_RETIRO',
          montoCop: 250000,
          concepto: 'Retiro de seguridad a caja fuerte',
        });

      expect(res.status).toBe(201);
      expect(res.body.datos.tipo).toBe('SANGRIA_RETIRO');
      expect(res.body.datos.montoCop).toBe(250000);
    });

    it('bloquea movimientos si la sesión de caja está vencida de un día anterior (RN-CAJ-05, CA-56, QA-009, 409)', async () => {
      prismaMock.sesionCaja.findUnique.mockResolvedValue({
        id: 10,
        estado: 'ABIERTA',
        fechaNegocioColombia: '2026-11-01', // fecha vencida
        baseContadaCop: 200000,
      });

      const res = await request(app)
        .post('/api/caja/movimiento')
        .set('Authorization', TOKEN_CAJERO)
        .send({
          sesionCajaId: 10,
          tipo: 'INGRESO_MANUAL',
          montoCop: 50000,
          concepto: 'Ingreso de monedas',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/está vencida/);
      expect(prismaMock.movimientoCaja.create).not.toHaveBeenCalled();
    });

    it('rechaza sangría que supere el efectivo actual en caja (400)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findUnique.mockResolvedValue({
        id: 10,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
        baseContadaCop: 200000,
      });
      prismaMock.pagoVentaPOS.findMany.mockResolvedValue([]);
      prismaMock.devolucionPOS.findMany.mockResolvedValue([]);
      prismaMock.movimientoCaja.findMany.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/caja/movimiento')
        .set('Authorization', TOKEN_CAJERO)
        .send({
          sesionCajaId: 10,
          tipo: 'SANGRIA_RETIRO',
          montoCop: 250000, // supera los 200.000 disponibles
          concepto: 'Retiro excesivo',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/supera el efectivo actual disponible/);
    });
  });

  describe('POST /api/caja/relevo-turno (RF-CAJ-02, RN-CAJ-13)', () => {
    it('registra relevo de turno con foto matemática del efectivo esperado y conteo saliente (201)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findUnique.mockResolvedValue({
        id: 10,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
        baseContadaCop: 200000,
      });
      // Ventas efectivo: 100.000 -> Esperado: 300.000
      prismaMock.pagoVentaPOS.findMany.mockResolvedValue([{ montoCop: 100000 }]);
      prismaMock.devolucionPOS.findMany.mockResolvedValue([]);
      prismaMock.movimientoCaja.findMany.mockResolvedValue([]);

      prismaMock.relevoTurnoCaja.create.mockImplementation(async ({ data }: any) => ({
        id: 1,
        ...data,
        cajeroSaliente: { id: 2, nombreCompleto: 'Cajero Saliente' },
        cajeroEntrante: { id: 3, nombreCompleto: 'Cajero Entrante' },
      }));

      const res = await request(app)
        .post('/api/caja/relevo-turno')
        .set('Authorization', TOKEN_CAJERO)
        .send({
          sesionCajaId: 10,
          cajeroEntranteId: 3,
          efectivoContadoCop: 295000, // Descuadre de -$5.000
          observacion: 'Entrega de turno por almuerzo',
        });

      expect(res.status).toBe(201);
      expect(res.body.datos.efectivoEsperadoHastaCorteCop).toBe(300000);
      expect(res.body.datos.efectivoContadoCop).toBe(295000);
      expect(res.body.datos.diferenciaCop).toBe(-5000);
    });
  });

  describe('POST /api/caja/cierre (RF-CAJ-03, RN-CAJ-06 a 10, CA-15, CA-55, QA-008)', () => {
    it('calcula integralmente la fórmula de arqueo y el efectivo a entregar (200)', async () => {
      prismaMock.sesionCaja.findUnique.mockResolvedValue({
        id: 10,
        estado: 'ABIERTA',
        baseConfiguradaCop: 200000,
        baseContadaCop: 200000,
      });

      // Fórmula Integral:
      // baseContadaCop = 200.000
      // ventasEfectivo = 500.000
      // reembolsosEfectivo = 50.000
      // sangrias = 100.000
      // gastosMenores = 20.000
      // ingresosManuales = 10.000
      // esperado = 200k + 500k - 50k - 100k - 20k + 10k = 540.000
      prismaMock.pagoVentaPOS.findMany.mockResolvedValue([{ montoCop: 500000 }]);
      prismaMock.devolucionPOS.findMany.mockResolvedValue([{ totalReembolsadoCop: 50000 }]);
      prismaMock.movimientoCaja.findMany.mockResolvedValue([
        { tipo: 'SANGRIA_RETIRO', montoCop: 100000 },
        { tipo: 'GASTO_MENOR', montoCop: 20000 },
        { tipo: 'INGRESO_MANUAL', montoCop: 10000 },
      ]);

      prismaMock.sesionCaja.update.mockImplementation(async ({ data }: any) => ({
        id: 10,
        ...data,
      }));

      // Cajero cuenta 540.000 (cuadre perfecto)
      const res = await request(app)
        .post('/api/caja/cierre')
        .set('Authorization', TOKEN_CAJERO)
        .send({
          sesionCajaId: 10,
          efectivoContadoCierreCop: 540000,
          observacionCierre: 'Cuadre exacto',
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('CERRADA');
      expect(res.body.datos.efectivoEsperadoCierreCop).toBe(540000);
      expect(res.body.datos.diferenciaCierreCop).toBe(0);
      // RN-CAJ-10: efectivoAEntregar = max(0, 540.000 - 200.000) = 340.000
      expect(res.body.datos.efectivoAEntregarCop).toBe(340000);
    });

    it('efectivo a entregar jamás es negativo incluso si hay faltante crítico (RN-CAJ-10, CA-55)', async () => {
      prismaMock.sesionCaja.findUnique.mockResolvedValue({
        id: 10,
        estado: 'ABIERTA',
        baseConfiguradaCop: 200000,
        baseContadaCop: 200000,
      });
      prismaMock.pagoVentaPOS.findMany.mockResolvedValue([]);
      prismaMock.devolucionPOS.findMany.mockResolvedValue([]);
      prismaMock.movimientoCaja.findMany.mockResolvedValue([]);
      prismaMock.sesionCaja.update.mockImplementation(async ({ data }: any) => ({ id: 10, ...data }));

      // Solo cuenta 120.000 (faltante de 80.000)
      const res = await request(app)
        .post('/api/caja/cierre')
        .set('Authorization', TOKEN_CAJERO)
        .send({
          sesionCajaId: 10,
          efectivoContadoCierreCop: 120000,
          observacionCierre: 'Faltante de apertura',
        });

      expect(res.status).toBe(200);
      expect(res.body.datos.efectivoEsperadoCierreCop).toBe(200000);
      expect(res.body.datos.diferenciaCierreCop).toBe(-80000);
      // max(0, 120.000 - 200.000) = 0 (no genera número negativo)
      expect(res.body.datos.efectivoAEntregarCop).toBe(0);
    });

    it('permite cerrar una sesión vencida de un día anterior (RN-CAJ-05)', async () => {
      prismaMock.sesionCaja.findUnique.mockResolvedValue({
        id: 10,
        estado: 'ABIERTA',
        fechaNegocioColombia: '2026-11-01', // sesión olvidada
        baseConfiguradaCop: 200000,
        baseContadaCop: 200000,
      });
      prismaMock.pagoVentaPOS.findMany.mockResolvedValue([]);
      prismaMock.devolucionPOS.findMany.mockResolvedValue([]);
      prismaMock.movimientoCaja.findMany.mockResolvedValue([]);
      prismaMock.sesionCaja.update.mockImplementation(async ({ data }: any) => ({ id: 10, ...data }));

      const res = await request(app)
        .post('/api/caja/cierre')
        .set('Authorization', TOKEN_CAJERO)
        .send({ sesionCajaId: 10, efectivoContadoCierreCop: 200000 });

      expect(res.status).toBe(200);
      expect(res.body.datos.estado).toBe('CERRADA');
    });
  });

  describe('GET /api/caja/sesion-activa', () => {
    it('retorna la sesión activa con su desglose y cálculo de vigencia (200)', async () => {
      const hoy = ColombiaTime.toFechaNegocioColombia();
      prismaMock.sesionCaja.findFirst.mockResolvedValue({
        id: 10,
        ubicacionId: 2,
        estado: 'ABIERTA',
        fechaNegocioColombia: hoy,
        baseContadaCop: 200000,
        ubicacion: tiendaNorte,
        movimientosCaja: [],
        relevosTurno: [],
      });
      prismaMock.pagoVentaPOS.findMany.mockResolvedValue([{ montoCop: 150000 }]);
      prismaMock.devolucionPOS.findMany.mockResolvedValue([]);
      prismaMock.movimientoCaja.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/caja/sesion-activa?ubicacionId=2')
        .set('Authorization', TOKEN_CAJERO);

      expect(res.status).toBe(200);
      expect(res.body.datos.id).toBe(10);
      expect(res.body.datos.esVigente).toBe(true);
      expect(res.body.datos.desglose.efectivoEsperadoCop).toBe(350000);
    });
  });
});
