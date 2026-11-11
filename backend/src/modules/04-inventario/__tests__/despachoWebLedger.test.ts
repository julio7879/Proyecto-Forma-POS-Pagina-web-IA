import { describe, expect, it, vi } from 'vitest';
import { InventoryLedgerService } from '../InventoryLedgerService.js';

const saldoBase = {
  id: 1,
  ubicacionId: 1,
  varianteId: 10,
  fisico: 100,
  reservadoBlando: 0,
  reservadoDuro: 30,
  noVendible: 0,
  bloqueadoDespachoWeb: false,
};

function crearTx(saldo = saldoBase) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([saldo]),
    saldoStock: {
      update: vi.fn().mockResolvedValue({
        ...saldo,
        fisico: saldo.fisico - 5,
        reservadoDuro: saldo.reservadoDuro - 5,
      }),
    },
    variante: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    movimientoInventario: { create: vi.fn().mockResolvedValue({ id: 99 }) },
  };
}

const params = {
  tipo: 'DESPACHO_WEB' as const,
  ubicacionId: 1,
  varianteId: 10,
  cantidadConSigno: -5,
  afectaSaldo: 'FISICO' as const,
  documentoTipo: 'PEDIDO_WEB',
  documentoId: 1,
  usuarioId: 1,
  motivo: 'Despacho de prueba',
};

describe('InventoryLedgerService · despacho web', () => {
  it('descuenta físico y reserva dura en la misma operación', async () => {
    const tx = crearTx();
    const resultado = await InventoryLedgerService.registrarMovimiento(
      tx as never,
      params
    );

    expect(tx.saldoStock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { fisico: 95, reservadoDuro: 25 },
      })
    );
    expect(tx.movimientoInventario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'DESPACHO_WEB',
          cantidadConSigno: -5,
          saldoResultante: 95,
        }),
      })
    );
    expect(resultado.saldoResultante).toBe(95);
  });

  it('rechaza el despacho si no hay reserva dura suficiente', async () => {
    const tx = crearTx({ ...saldoBase, reservadoDuro: 0 });

    await expect(
      InventoryLedgerService.registrarMovimiento(tx as never, params)
    ).rejects.toThrow(/Reserva dura insuficiente/i);
  });
});
