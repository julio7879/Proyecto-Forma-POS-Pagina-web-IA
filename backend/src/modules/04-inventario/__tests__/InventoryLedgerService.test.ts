import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { InventoryLedgerService } from '../InventoryLedgerService.js';
import { AppError } from '../../../shared/domain/AppError.js';

describe('Módulo 04: InventoryLedgerService - Motor Kardex y Concurrencia (RN-GEN-02, RN-INV-01 a 09, RNF-003)', () => {
  let mockTx: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockTx = {
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn().mockResolvedValue(1),
      saldoStock: {
        upsert: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      variante: {
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      movimientoInventario: {
        create: vi.fn(),
      },
    };
  });

  describe('1. Bloqueo Pesimista (SELECT ... FOR UPDATE)', () => {
    it('debe arrojar 404 NotFound si la fila de saldo no existe y autoCrearSiNoExiste es false', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        InventoryLedgerService.bloquearYObtenerSaldo(mockTx, 1, 10, false)
      ).rejects.toThrow('No existe registro de SaldoStock');
    });

    it('debe crear la fila e inicializarla en 0 si autoCrearSiNoExiste es true (primer ingreso)', async () => {
      // 1. Primer query no encuentra fila
      mockTx.$queryRaw.mockResolvedValueOnce([]);
      // 2. Query tras creación encuentra la nueva fila
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 1,
          ubicacionId: 1,
          varianteId: 10,
          fisico: 0,
          reservadoBlando: 0,
          reservadoDuro: 0,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      const saldo = await InventoryLedgerService.bloquearYObtenerSaldo(mockTx, 1, 10, true);

      expect(mockTx.saldoStock.upsert).toHaveBeenCalledWith({
        where: {
          ubicacionId_varianteId: { ubicacionId: 1, varianteId: 10 },
        },
        update: {},
        create: {
          ubicacionId: 1,
          varianteId: 10,
          fisico: 0,
          reservadoBlando: 0,
          reservadoDuro: 0,
          noVendible: 0,
        },
      });
      expect(saldo.fisico).toBe(0);
      expect(saldo.disponible).toBe(0);
    });

    it('debe calcular correctamente el saldo disponible = fisico - reservas', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 2,
          ubicacionId: 1,
          varianteId: 20,
          fisico: 15,
          reservadoBlando: 3,
          reservadoDuro: 2,
          noVendible: 1,
          bloqueadoDespachoWeb: false,
        },
      ]);

      const saldo = await InventoryLedgerService.bloquearYObtenerSaldo(mockTx, 1, 20);
      expect(saldo.fisico).toBe(15);
      expect(saldo.disponible).toBe(10); // 15 - 3 - 2 = 10
    });
  });

  describe('2. Mutaciones de Saldo Físico (COMPRA, VENTA, TRASLADO)', () => {
    it('debe registrar un ingreso físico positivo y marcar tieneMovimientos = true en la variante', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 5,
          ubicacionId: 1,
          varianteId: 30,
          fisico: 5,
          reservadoBlando: 0,
          reservadoDuro: 0,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      mockTx.saldoStock.update.mockResolvedValueOnce({
        fisico: 15,
        reservadoBlando: 0,
        reservadoDuro: 0,
      });

      mockTx.movimientoInventario.create.mockResolvedValueOnce({ id: BigInt(1001) });

      const resultado = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: 'COMPRA_RECIBIDA',
        ubicacionId: 1,
        varianteId: 30,
        cantidadConSigno: 10,
        afectaSaldo: 'FISICO',
        documentoTipo: 'COMPRA',
        documentoId: 1,
        usuarioId: 1,
      });

      expect(mockTx.saldoStock.update).toHaveBeenCalledWith({
        where: { ubicacionId_varianteId: { ubicacionId: 1, varianteId: 30 } },
        data: { fisico: 15 },
      });
      expect(mockTx.variante.updateMany).toHaveBeenCalledWith({
        where: { id: 30, tieneMovimientos: false },
        data: { tieneMovimientos: true }, // Inmutabilidad del SKU (RN-CAT-03)
      });
      expect(resultado.saldoResultante).toBe(15);
      expect(resultado.disponibleResultante).toBe(15);
    });

    it('debe rechazar la operación si el stock físico quedaría negativo (409 Conflict)', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 5,
          ubicacionId: 1,
          varianteId: 30,
          fisico: 2,
          reservadoBlando: 0,
          reservadoDuro: 0,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      await expect(
        InventoryLedgerService.registrarMovimiento(mockTx, {
          tipo: 'VENTA_POS',
          ubicacionId: 1,
          varianteId: 30,
          cantidadConSigno: -5, // Solicita más de lo que hay
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 10,
          usuarioId: 2,
        })
      ).rejects.toThrow('Stock físico insuficiente');

      expect(mockTx.saldoStock.update).not.toHaveBeenCalled();
    });

    it('debe rechazar la salida física si dejaría el stock inferior a las reservas activas (CA-01)', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 5,
          ubicacionId: 1,
          varianteId: 30,
          fisico: 10,
          reservadoBlando: 4,
          reservadoDuro: 3, // Total reservas: 7
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      // Intenta sacar 4 unidades físicas -> nuevo físico sería 6 (< 7 de reservas)
      await expect(
        InventoryLedgerService.registrarMovimiento(mockTx, {
          tipo: 'VENTA_POS',
          ubicacionId: 1,
          varianteId: 30,
          cantidadConSigno: -4,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 10,
          usuarioId: 2,
        })
      ).rejects.toThrow('por debajo de las reservas activas');

      expect(mockTx.saldoStock.update).not.toHaveBeenCalled();
    });
  });

  describe('3. Reservas Web en 2 Niveles (Blando vs Duro) y Despacho', () => {
    it('debe registrar un incremento en reservadoBlando si hay stock disponible', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 7,
          ubicacionId: 2,
          varianteId: 40,
          fisico: 8,
          reservadoBlando: 1,
          reservadoDuro: 2,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      mockTx.saldoStock.update.mockResolvedValueOnce({
        fisico: 8,
        reservadoBlando: 3, // 1 + 2 = 3
        reservadoDuro: 2,
      });

      mockTx.movimientoInventario.create.mockResolvedValueOnce({ id: BigInt(1002) });

      const res = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: 'RESERVA_WEB',
        ubicacionId: 2,
        varianteId: 40,
        cantidadConSigno: 2,
        afectaSaldo: 'RESERVADO_BLANDO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 50,
        usuarioId: 1,
      });

      expect(mockTx.saldoStock.update).toHaveBeenCalledWith({
        where: { ubicacionId_varianteId: { ubicacionId: 2, varianteId: 40 } },
        data: { reservadoBlando: 3 },
      });
      expect(res.disponibleResultante).toBe(3); // 8 - 3 - 2 = 3
    });

    it('debe rechazar una reserva blanda si supera el stock disponible', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 7,
          ubicacionId: 2,
          varianteId: 40,
          fisico: 5,
          reservadoBlando: 3,
          reservadoDuro: 1, // Total reservas: 4. Disponible: 1
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      await expect(
        InventoryLedgerService.registrarMovimiento(mockTx, {
          tipo: 'RESERVA_WEB',
          ubicacionId: 2,
          varianteId: 40,
          cantidadConSigno: 2, // Requiere 2, solo hay 1 disponible
          afectaSaldo: 'RESERVADO_BLANDO',
          documentoTipo: 'PEDIDO_WEB',
          documentoId: 51,
          usuarioId: 1,
        })
      ).rejects.toThrow('Stock disponible insuficiente para reserva blanda');
    });

    it('debe endurecer reserva atómicamente (ENDURECIMIENTO_RESERVA_WEB) incluso con stock al 100% reservado (RN-WEB-15)', async () => {
      // Escenario crítico de auditoría: fisico 10, reservadoBlando 10, reservadoDuro 0 (disponible = 0)
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 8,
          ubicacionId: 1,
          varianteId: 50,
          fisico: 10,
          reservadoBlando: 10,
          reservadoDuro: 0,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      mockTx.saldoStock.update.mockResolvedValueOnce({
        fisico: 10,
        reservadoBlando: 0,
        reservadoDuro: 10,
      });

      mockTx.movimientoInventario.create.mockResolvedValueOnce({ id: BigInt(1003) });

      const res = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: 'ENDURECIMIENTO_RESERVA_WEB',
        ubicacionId: 1,
        varianteId: 50,
        cantidadConSigno: 10,
        afectaSaldo: 'RESERVADO_DURO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 60,
        usuarioId: 1,
      });

      expect(mockTx.saldoStock.update).toHaveBeenCalledWith({
        where: { ubicacionId_varianteId: { ubicacionId: 1, varianteId: 50 } },
        data: {
          reservadoBlando: 0,
          reservadoDuro: 10,
        },
      });
      expect(res.saldoResultante).toBe(10);
      expect(res.disponibleResultante).toBe(0);
    });

    it('debe procesar un DESPACHO_WEB atómico descontando físico y reservadoDuro simultáneamente (RN-WEB-18)', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        {
          id: 9,
          ubicacionId: 1,
          varianteId: 60,
          fisico: 5,
          reservadoBlando: 0,
          reservadoDuro: 5,
          noVendible: 0,
          bloqueadoDespachoWeb: false,
        },
      ]);

      mockTx.saldoStock.update.mockResolvedValueOnce({
        fisico: 0,
        reservadoBlando: 0,
        reservadoDuro: 0,
      });

      mockTx.movimientoInventario.create.mockResolvedValueOnce({ id: BigInt(1004) });

      const res = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: 'DESPACHO_WEB',
        ubicacionId: 1,
        varianteId: 60,
        cantidadConSigno: -5,
        afectaSaldo: 'FISICO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 70,
        usuarioId: 1,
      });

      expect(mockTx.saldoStock.update).toHaveBeenCalledWith({
        where: { ubicacionId_varianteId: { ubicacionId: 1, varianteId: 60 } },
        data: {
          fisico: 0,
          reservadoDuro: 0,
        },
      });
      expect(res.saldoResultante).toBe(0);
      expect(res.disponibleResultante).toBe(0);
    });
  });

  describe('4. Matriz de Congruencia Contable del Kardex (RN-INV-09)', () => {
    it('debe rechazar una VENTA_POS con cantidad positiva o componente no físico', () => {
      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('VENTA_POS', 'FISICO', 5)
      ).toThrow('debe tener cantidad < 0');

      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('VENTA_POS', 'RESERVADO_BLANDO', -2)
      ).toThrow('afectar saldo FISICO');
    });

    it('debe rechazar un movimiento con cantidad 0', () => {
      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('AJUSTE_POSITIVO_FISICO', 'FISICO', 0)
      ).toThrow('no puede ser 0');
    });

    it('debe rechazar números decimales o no enteros para proteger dinero y stock entero (RN-GEN-04)', () => {
      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('VENTA_POS', 'FISICO', -1.5)
      ).toThrow('debe ser un número entero válido');

      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('COMPRA_RECIBIDA', 'FISICO', NaN)
      ).toThrow('debe ser un número entero válido');
    });

    it('debe rechazar cantidades que superen el límite de 32 bits (desbordamiento de enteros)', () => {
      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('COMPRA_RECIBIDA', 'FISICO', 3_000_000_000)
      ).toThrow('excede el límite numérico admitido');
    });

    it('debe validar exitosamente combinaciones permitidas', () => {
      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('COMPRA_RECIBIDA', 'FISICO', 10)
      ).not.toThrow();

      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('RESERVA_WEB', 'RESERVADO_BLANDO', 3)
      ).not.toThrow();

      expect(() =>
        InventoryLedgerService.validarCongruenciaMovimiento('LIBERACION_RESERVA_WEB', 'RESERVADO_BLANDO', -3)
      ).not.toThrow();
    });
  });

  describe('5. Orden Canónico Anti-Deadlock en Batch (RNF-003, CA-02)', () => {
    it('debe ordenar canónicamente los movimientos por varianteId ASC antes de ejecutar los locks', async () => {
      // Tres movimientos desordenados: variante 45, variante 12, variante 88
      const movimientos: any[] = [
        {
          tipo: 'VENTA_POS',
          ubicacionId: 1,
          varianteId: 45,
          cantidadConSigno: -1,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 100,
          usuarioId: 2,
        },
        {
          tipo: 'VENTA_POS',
          ubicacionId: 1,
          varianteId: 12,
          cantidadConSigno: -1,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 100,
          usuarioId: 2,
        },
        {
          tipo: 'VENTA_POS',
          ubicacionId: 1,
          varianteId: 88,
          cantidadConSigno: -1,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 100,
          usuarioId: 2,
        },
      ];

      // Mocks de queryRaw para las 3 variantes
      mockTx.$queryRaw
        .mockResolvedValueOnce([
          { id: 1, ubicacionId: 1, varianteId: 12, fisico: 5, reservadoBlando: 0, reservadoDuro: 0, noVendible: 0 },
        ])
        .mockResolvedValueOnce([
          { id: 2, ubicacionId: 1, varianteId: 45, fisico: 5, reservadoBlando: 0, reservadoDuro: 0, noVendible: 0 },
        ])
        .mockResolvedValueOnce([
          { id: 3, ubicacionId: 1, varianteId: 88, fisico: 5, reservadoBlando: 0, reservadoDuro: 0, noVendible: 0 },
        ]);

      mockTx.saldoStock.update.mockResolvedValue({ fisico: 4, reservadoBlando: 0, reservadoDuro: 0 });
      mockTx.movimientoInventario.create.mockResolvedValue({ id: BigInt(1) });

      const registrarSpy = vi.spyOn(InventoryLedgerService, 'registrarMovimiento');

      await InventoryLedgerService.registrarMovimientosBatch(mockTx, movimientos);

      // Verificar que los llamadas se ejecutaron en orden 12 -> 45 -> 88
      expect(registrarSpy).toHaveBeenCalledTimes(3);
      expect(registrarSpy.mock.calls[0]![1].varianteId).toBe(12);
      expect(registrarSpy.mock.calls[1]![1].varianteId).toBe(45);
      expect(registrarSpy.mock.calls[2]![1].varianteId).toBe(88);
    });
  });

  describe('6. Validación de Disponibilidad Multi-Item', () => {
    it('debe retornar valido: true si todos los items tienen disponible suficiente', async () => {
      const mockDb: any = {
        saldoStock: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce({ fisico: 10, reservadoBlando: 2, reservadoDuro: 1 }) // disp: 7
            .mockResolvedValueOnce({ fisico: 5, reservadoBlando: 0, reservadoDuro: 0 }), // disp: 5
        },
      };

      const res = await InventoryLedgerService.validarDisponibilidad(mockDb, 1, [
        { varianteId: 10, cantidad: 5 },
        { varianteId: 20, cantidad: 3 },
      ]);

      expect(res.valido).toBe(true);
      expect(res.faltantes).toHaveLength(0);
    });

    it('debe retornar valido: false y la lista de faltantes si alguna variante no alcanza', async () => {
      const mockDb: any = {
        saldoStock: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce({ fisico: 10, reservadoBlando: 2, reservadoDuro: 1 }) // disp: 7 (pide 5 -> OK)
            .mockResolvedValueOnce({ fisico: 4, reservadoBlando: 3, reservadoDuro: 0 }), // disp: 1 (pide 3 -> Faltan 2)
        },
      };

      const res = await InventoryLedgerService.validarDisponibilidad(mockDb, 1, [
        { varianteId: 10, cantidad: 5 },
        { varianteId: 20, cantidad: 3 },
      ]);

      expect(res.valido).toBe(false);
      expect(res.faltantes).toEqual([
        {
          varianteId: 20,
          requerido: 3,
          disponible: 1,
        },
      ]);
    });
  });
});
