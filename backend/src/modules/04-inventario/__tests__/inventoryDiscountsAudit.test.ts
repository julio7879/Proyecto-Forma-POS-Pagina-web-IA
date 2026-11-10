import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryLedgerService } from '../InventoryLedgerService.js';
import { TipoMovimientoStock } from '@prisma/client';

describe('Auditoría de Descuentos e Invariantes de Inventario (Kardex Ledger)', () => {
  let mockTx: any;
  let saldoCentral: any;
  let saldoPuntoCentro: any;
  let saldoPuntoBucaramanga: any;
  let movimientosRegistrados: any[];

  beforeEach(() => {
    vi.restoreAllMocks();
    movimientosRegistrados = [];

    // Estado inicial canónico: Bodega Central abastecida, tiendas en 0
    saldoCentral = {
      id: 101,
      ubicacionId: 1, // Bodega Central
      varianteId: 10, // ROP-BLZ-VIN-M
      fisico: 100,
      reservadoBlando: 0,
      reservadoDuro: 0,
      noVendible: 0,
      bloqueadoDespachoWeb: false,
    };

    saldoPuntoCentro = {
      id: 102,
      ubicacionId: 2, // Punto Centro
      varianteId: 10,
      fisico: 0,
      reservadoBlando: 0,
      reservadoDuro: 0,
      noVendible: 0,
      bloqueadoDespachoWeb: false,
    };

    saldoPuntoBucaramanga = {
      id: 103,
      ubicacionId: 4, // Punto Bucaramanga
      varianteId: 10,
      fisico: 0,
      reservadoBlando: 0,
      reservadoDuro: 0,
      noVendible: 0,
      bloqueadoDespachoWeb: false,
    };

    const getSaldoObj = (ubicacionId: number, varianteId: number) => {
      if (ubicacionId === 1 && varianteId === 10) return saldoCentral;
      if (ubicacionId === 2 && varianteId === 10) return saldoPuntoCentro;
      if (ubicacionId === 4 && varianteId === 10) return saldoPuntoBucaramanga;
      return null;
    };

    mockTx = {
      $queryRaw: vi.fn().mockImplementation(async (query: any, ...args: any[]) => {
        // Simular SELECT ... FOR UPDATE
        const ubicacionId = args[0];
        const varianteId = args[1];
        const obj = getSaldoObj(ubicacionId, varianteId);
        return obj ? [{ ...obj }] : [];
      }),
      saldoStock: {
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const ubicacionId = where.ubicacionId_varianteId?.ubicacionId;
          const varianteId = where.ubicacionId_varianteId?.varianteId;
          const target = getSaldoObj(ubicacionId, varianteId);

          if (target) {
            if (data.fisico !== undefined) target.fisico = data.fisico;
            if (data.reservadoBlando !== undefined) target.reservadoBlando = data.reservadoBlando;
            if (data.reservadoDuro !== undefined) target.reservadoDuro = data.reservadoDuro;
            if (data.noVendible !== undefined) target.noVendible = data.noVendible;
            return { ...target };
          }
          throw new Error('Registro de SaldoStock no encontrado para update');
        }),
        upsert: vi.fn(),
      },
      variante: {
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      movimientoInventario: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          movimientosRegistrados.push(data);
          return { id: BigInt(movimientosRegistrados.length), ...data };
        }),
      },
    };
  });

  describe('1. Compra a Proveedor Mayorista (Ingreso a Bodega Central)', () => {
    it('al recibir compra de proveedor, incrementa físico y disponible en Bodega Central', async () => {
      const cantRecibida = 25;
      const res = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.COMPRA_RECIBIDA,
        ubicacionId: 1, // Bodega Central
        varianteId: 10,
        cantidadConSigno: cantRecibida,
        afectaSaldo: 'FISICO',
        documentoTipo: 'COMPRA',
        documentoId: 7,
        usuarioId: 1,
      });

      expect(res.saldoResultante).toBe(125); // 100 iniciales + 25 recibidas
      expect(res.disponibleResultante).toBe(125);
      expect(saldoCentral.fisico).toBe(125);
      // Las tiendas no sufren alteración
      expect(saldoPuntoCentro.fisico).toBe(0);
      expect(saldoPuntoBucaramanga.fisico).toBe(0);
    });
  });

  describe('2. Venta POS en Tienda (Descuento estricto del lugar que vendió)', () => {
    it('descuenta inventario físico ÚNICAMENTE del punto de venta que vendió, sin tocar Bodega Central ni otras tiendas', async () => {
      // 1. Abastecer Punto Centro con 10 unidades
      saldoPuntoCentro.fisico = 10;

      // 2. Realizar venta de 2 unidades en Punto Centro
      const res = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.VENTA_POS,
        ubicacionId: 2, // Punto Centro
        varianteId: 10,
        cantidadConSigno: -2,
        afectaSaldo: 'FISICO',
        documentoTipo: 'VENTA_POS',
        documentoId: 101,
        usuarioId: 3,
      });

      expect(res.saldoResultante).toBe(8); // 10 - 2 = 8
      expect(saldoPuntoCentro.fisico).toBe(8);

      // INVARIANTE CRÍTICA: Bodega Central y Bucaramanga NO deben ser alteradas
      expect(saldoCentral.fisico).toBe(100); // Intacta
      expect(saldoPuntoBucaramanga.fisico).toBe(0); // Intacta
    });

    it('bloquea la venta con saldo negativo si la tienda no tiene existencias físicas suficientes', async () => {
      // Punto Centro tiene 0 unidades
      expect(saldoPuntoCentro.fisico).toBe(0);

      await expect(
        InventoryLedgerService.registrarMovimiento(mockTx, {
          tipo: TipoMovimientoStock.VENTA_POS,
          ubicacionId: 2,
          varianteId: 10,
          cantidadConSigno: -1,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 102,
          usuarioId: 3,
        })
      ).rejects.toThrow(/stock físico insuficiente/i);
    });
  });

  describe('3. Traslado entre Sedes (Central -> Punto Bucaramanga)', () => {
    it('despacho descuenta de Bodega Central, recepción incrementa Bucaramanga y segrega averías sin duplicidad', async () => {
      const cantEnviada = 5;

      // Paso A: Despacho desde Bodega Central
      const resDespacho = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.TRASLADO_ENVIADO,
        ubicacionId: 1, // Central
        varianteId: 10,
        cantidadConSigno: -cantEnviada,
        afectaSaldo: 'FISICO',
        documentoTipo: 'TRASLADO',
        documentoId: 301,
        usuarioId: 1,
      });

      expect(resDespacho.saldoResultante).toBe(95); // 100 - 5 = 95
      expect(saldoCentral.fisico).toBe(95);

      // Paso B: Recepción en Punto Bucaramanga (4 buenas + 1 con avería)
      const resBuenas = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.TRASLADO_RECIBIDO_BUENO,
        ubicacionId: 4, // Bucaramanga
        varianteId: 10,
        cantidadConSigno: 4,
        afectaSaldo: 'FISICO',
        documentoTipo: 'TRASLADO',
        documentoId: 301,
        usuarioId: 5,
      });

      const resDanadas = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.TRASLADO_RECIBIDO_DANADO,
        ubicacionId: 4, // Bucaramanga
        varianteId: 10,
        cantidadConSigno: 1,
        afectaSaldo: 'NO_VENDIBLE',
        documentoTipo: 'TRASLADO',
        documentoId: 301,
        usuarioId: 5,
      });

      // Verificación en Bucaramanga
      expect(resBuenas.saldoResultante).toBe(4);
      expect(resDanadas.saldoResultante).toBe(1);
      expect(saldoPuntoBucaramanga.fisico).toBe(4);
      expect(saldoPuntoBucaramanga.noVendible).toBe(1);

      // Verificación en Bodega Central: NO sufrió un segundo descuento
      expect(saldoCentral.fisico).toBe(95);

      // Verificación en Punto Centro: totalmente aislado
      expect(saldoPuntoCentro.fisico).toBe(0);
    });
  });

  describe('4. Ciclo de Vida de Pedido Web (Doble Reserva y Despacho)', () => {
    it('pedido web crea reserva blanda (disponible baja, físico no), endurece al alistar y descuenta físico al despachar liberando reserva', async () => {
      // 1. Creación de Pedido Web (RECIBIDO): Reserva blanda de 2 unidades en Central
      const resBlanda = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.RESERVA_WEB,
        ubicacionId: 1,
        varianteId: 10,
        cantidadConSigno: 2,
        afectaSaldo: 'RESERVADO_BLANDO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 401,
        usuarioId: 1,
      });

      expect(saldoCentral.fisico).toBe(100); // Físico intacto
      expect(saldoCentral.reservadoBlando).toBe(2);
      expect(resBlanda.disponibleResultante).toBe(98); // Disponible = 100 - 2 = 98

      // 2. Inicio de Alistamiento (EN_PREPARACION): Endurecimiento atómico de reserva (blanda -> dura)
      const resDura = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.ENDURECIMIENTO_RESERVA_WEB,
        ubicacionId: 1,
        varianteId: 10,
        cantidadConSigno: 2,
        afectaSaldo: 'RESERVADO_DURO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 401,
        usuarioId: 1,
      });

      expect(saldoCentral.fisico).toBe(100);
      expect(saldoCentral.reservadoBlando).toBe(0);
      expect(saldoCentral.reservadoDuro).toBe(2);
      expect(resDura.disponibleResultante).toBe(98);

      // 3. Despacho (DESPACHADO): Salida física y liberación de reserva dura
      const resDespacho = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.DESPACHO_WEB,
        ubicacionId: 1,
        varianteId: 10,
        cantidadConSigno: -2,
        afectaSaldo: 'FISICO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 401,
        usuarioId: 1,
      });

      // Estado final en Central: físico disminuyó a 98, reservas en 0, disponible en 98
      expect(saldoCentral.fisico).toBe(98);
      expect(saldoCentral.reservadoBlando).toBe(0);
      expect(saldoCentral.reservadoDuro).toBe(0);
      expect(resDespacho.disponibleResultante).toBe(98);
    });

    it('al cancelar un pedido web en estado RECIBIDO, se libera la reserva blanda y el disponible regresa a 100 sin alterar el físico', async () => {
      // 1. Reservar 3 unidades
      await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.RESERVA_WEB,
        ubicacionId: 1,
        varianteId: 10,
        cantidadConSigno: 3,
        afectaSaldo: 'RESERVADO_BLANDO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 402,
        usuarioId: 1,
      });

      expect(saldoCentral.fisico).toBe(100);
      expect(saldoCentral.reservadoBlando).toBe(3);

      // 2. Cancelar pedido web -> Liberar reserva
      const resLiberar = await InventoryLedgerService.registrarMovimiento(mockTx, {
        tipo: TipoMovimientoStock.LIBERACION_RESERVA_WEB,
        ubicacionId: 1,
        varianteId: 10,
        cantidadConSigno: -3,
        afectaSaldo: 'RESERVADO_BLANDO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: 402,
        usuarioId: 1,
      });

      expect(saldoCentral.fisico).toBe(100);
      expect(saldoCentral.reservadoBlando).toBe(0);
      expect(resLiberar.disponibleResultante).toBe(100);
    });
  });
});
