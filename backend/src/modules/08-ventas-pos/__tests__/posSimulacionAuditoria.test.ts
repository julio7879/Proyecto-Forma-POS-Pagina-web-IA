import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
  usuario: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  ubicacion: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  variante: { findMany: vi.fn(), findUnique: vi.fn() },
  saldoStock: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  movimientoInventario: { create: vi.fn() },
  sesionCaja: { findFirst: vi.fn(), findUnique: vi.fn() },
  ventaPOS: { create: vi.fn(), findUnique: vi.fn() },
  lineaVentaPOS: { findMany: vi.fn(), update: vi.fn() },
  devolucionPOS: { create: vi.fn() },
  consecutivoUbicacion: { upsert: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

import { AuthService } from '../../01-identidad/auth.service.js';
import { InventoryLedgerService } from '../../04-inventario/InventoryLedgerService.js';

describe('Auditoría Completa de Punto de Venta POS (Cuentas, Cobros, Kardex y Devoluciones)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Auditoría de Cuentas Oficiales y Acceso Google OAuth (RN-ROL-06, RN-ROL-04)', () => {
    it('debe permitir autenticación de clientes vía Google OAuth y crear cuenta si no existe', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.create.mockResolvedValue({
        id: 99,
        correo: 'cliente.nuevo@gmail.com',
        nombreCompleto: 'Cliente Google Test',
        rol: 'CLIENTE',
        activo: true,
        authProvider: 'GOOGLE',
        googleId: 'google-sub-12345',
        intentosFallidos: 0,
        bloqueadoHasta: null,
      });

      const res = await AuthService.loginGoogle({
        googleId: 'google-sub-12345',
        correo: 'cliente.nuevo@gmail.com',
        nombreCompleto: 'Cliente Google Test',
      });

      expect(res.usuario.rol).toBe('CLIENTE');
      expect(res.token).toBeDefined();
    });

    it('debe RECHAZAR estrictamente el acceso Google OAuth para cuentas ADMIN (Anti-Takeover RN-ROL-06)', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        id: 1,
        correo: 'admin@forma.com',
        nombreCompleto: 'Administrador General',
        rol: 'ADMIN',
        activo: true,
      });

      await expect(
        AuthService.loginGoogle({
          googleId: 'google-attacker-999',
          correo: 'admin@forma.com',
          nombreCompleto: 'Atacante Spoofing',
        })
      ).rejects.toThrow(/El inicio de sesión con Google está restringido exclusivamente a clientes/);
    });

    it('debe RECHAZAR estrictamente el acceso Google OAuth para cuentas VENDEDOR (Anti-Takeover RN-ROL-06)', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({
        id: 4,
        correo: 'vendedor.centro@forma.com',
        nombreCompleto: 'Camilo Vendedor Centro',
        rol: 'VENDEDOR',
        activo: true,
      });

      await expect(
        AuthService.loginGoogle({
          googleId: 'google-fake-444',
          correo: 'vendedor.centro@forma.com',
          nombreCompleto: 'Fake Seller',
        })
      ).rejects.toThrow(/El inicio de sesión con Google está restringido exclusivamente a clientes/);
    });
  });

  describe('2. Auditoría de Cobro POS y Descuento en Kardex (RN-GEN-02, RN-GEN-04, RN-VTA-03)', () => {
    it('descuenta físicamente el stock de la sede y crea el registro inmutable en MovimientoInventario', async () => {
      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([
          {
            id: 1,
            ubicacionId: 2,
            varianteId: 10,
            fisico: 10,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          },
        ]),
        saldoStock: {
          update: vi.fn().mockResolvedValue({ fisico: 8, reservadoBlando: 0, reservadoDuro: 0 }),
        },
        movimientoInventario: {
          create: vi.fn().mockResolvedValue({ id: 101n }),
        },
      };

      const resultado = await InventoryLedgerService.registrarMovimiento(txMock as any, {
        tipo: 'VENTA_POS',
        ubicacionId: 2, // Punto Centro
        varianteId: 10,
        cantidadConSigno: -2,
        afectaSaldo: 'FISICO',
        documentoTipo: 'VENTA_POS',
        documentoId: 501,
        usuarioId: 4, // Camilo
        motivo: 'Venta de mostrador POS #MED-0042',
      });

      // Verificación de Kardex: el stock físico resultante es 8
      expect(resultado.saldoResultante).toBe(8);
      expect(txMock.saldoStock.update).toHaveBeenCalledWith({
        where: { ubicacionId_varianteId: { ubicacionId: 2, varianteId: 10 } },
        data: { fisico: 8 },
      });

      // Verificación inmutable: se genera el movimiento tipo VENTA_POS con delta negativo
      expect(txMock.movimientoInventario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ubicacionId: 2,
          varianteId: 10,
          tipo: 'VENTA_POS',
          cantidadConSigno: -2,
          saldoResultante: 8,
          documentoTipo: 'VENTA_POS',
        }),
        select: { id: true },
      });
    });

    it('bloquea la venta si la cantidad supera el stock físico vendible disponible (CA-02)', async () => {
      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([
          {
            id: 1,
            ubicacionId: 2,
            varianteId: 10,
            fisico: 1, // Solo hay 1
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          },
        ]),
        saldoStock: { update: vi.fn() },
      };

      await expect(
        InventoryLedgerService.registrarMovimiento(txMock as any, {
          tipo: 'VENTA_POS',
          ubicacionId: 2,
          varianteId: 10,
          cantidadConSigno: -5, // Quiere vender 5
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 502,
          usuarioId: 4,
        })
      ).rejects.toThrow(/Stock físico insuficiente en ubicación 2 para variante 10/);
    });
  });

  describe('3. Auditoría de Devoluciones, Cambios y Regla Cosméticos (RN-DEV-09, RN-CAT-02)', () => {
    it('ingresa a stock físico vendible (+1) cuando la prenda devuelta está en BUEN_ESTADO', async () => {
      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([
          {
            id: 1,
            ubicacionId: 2,
            varianteId: 10,
            fisico: 5,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
            bloqueadoDespachoWeb: false,
          },
        ]),
        saldoStock: {
          update: vi.fn().mockResolvedValue({ fisico: 6 }),
        },
        movimientoInventario: {
          create: vi.fn().mockResolvedValue({ id: 201n }),
        },
      };

      const resultado = await InventoryLedgerService.registrarMovimiento(txMock as any, {
        tipo: 'DEVOLUCION_POS_VENDIBLE',
        ubicacionId: 2,
        varianteId: 10,
        cantidadConSigno: 1,
        afectaSaldo: 'FISICO',
        documentoTipo: 'DEVOLUCION_POS',
        documentoId: 701,
        usuarioId: 4,
        motivo: 'Cambio de talla por prenda conforme',
      });

      // Incrementa stock vendible: 5 -> 6
      expect(resultado.saldoResultante).toBe(6);
      expect(txMock.saldoStock.update).toHaveBeenCalledWith({
        where: { ubicacionId_varianteId: { ubicacionId: 2, varianteId: 10 } },
        data: { fisico: 6 },
      });
      expect(txMock.movimientoInventario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cantidadConSigno: 1,
          tipo: 'DEVOLUCION_POS_VENDIBLE',
        }),
        select: { id: true },
      });
    });

    it('ingresa a stock NO VENDIBLE / AVERÍAS (+1) cuando la prenda devuelta está CON_IMPERFECTO o es cosmético', async () => {
      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([
          {
            id: 1,
            ubicacionId: 2,
            varianteId: 10,
            fisico: 5,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 1,
            bloqueadoDespachoWeb: false,
          },
        ]),
        saldoStock: {
          update: vi.fn().mockResolvedValue({ noVendible: 2 }),
        },
        movimientoInventario: {
          create: vi.fn().mockResolvedValue({ id: 202n }),
        },
      };

      const resultado = await InventoryLedgerService.registrarMovimiento(txMock as any, {
        tipo: 'DEVOLUCION_POS_NO_VENDIBLE',
        ubicacionId: 2,
        varianteId: 10,
        cantidadConSigno: 1,
        afectaSaldo: 'NO_VENDIBLE',
        documentoTipo: 'DEVOLUCION_POS',
        documentoId: 702,
        usuarioId: 4,
        motivo: 'Devolución de prenda con imperfecto / avería de fábrica',
      });

      // Incrementa noVendible: 1 -> 2, protegiendo el stock vendible
      expect(resultado.saldoResultante).toBe(2);
      expect(txMock.saldoStock.update).toHaveBeenCalledWith({
        where: { ubicacionId_varianteId: { ubicacionId: 2, varianteId: 10 } },
        data: { noVendible: 2 },
      });
      expect(txMock.movimientoInventario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cantidadConSigno: 1,
          tipo: 'DEVOLUCION_POS_NO_VENDIBLE',
        }),
        select: { id: true },
      });
    });
  });
});
