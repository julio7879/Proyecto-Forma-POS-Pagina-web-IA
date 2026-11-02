import type { Prisma } from '@prisma/client';
import { AppError } from '../../shared/domain/AppError.js';

export interface RegistrarMovimientoParams {
  tipo:
    | 'CARGA_INICIAL'
    | 'COMPRA_RECIBIDA'
    | 'TRASLADO_ENVIADO'
    | 'TRASLADO_RECIBIDO_BUENO'
    | 'TRASLADO_RECIBIDO_DANADO'
    | 'TRASLADO_CANCELADO_REINGRESO'
    | 'NOVEDAD_LLEGO_DESTINO'
    | 'NOVEDAD_RETORNO_ORIGEN'
    | 'NOVEDAD_PERDIDA'
    | 'NOVEDAD_EXCEDENTE_INCORPORADO'
    | 'VENTA_POS'
    | 'ANULACION_VENTA_POS'
    | 'DEVOLUCION_POS_VENDIBLE'
    | 'DEVOLUCION_POS_NO_VENDIBLE'
    | 'RESERVA_WEB'
    | 'LIBERACION_RESERVA_WEB'
    | 'ENDURECIMIENTO_RESERVA_WEB'
    | 'DESPACHO_WEB'
    | 'RETORNO_LOGISTICO_WEB_VENDIBLE'
    | 'RETORNO_LOGISTICO_WEB_NO_VENDIBLE'
    | 'DEVOLUCION_COMERCIAL_WEB_VENDIBLE'
    | 'DEVOLUCION_COMERCIAL_WEB_NO_VENDIBLE'
    | 'AJUSTE_POSITIVO_FISICO'
    | 'AJUSTE_NEGATIVO_FISICO'
    | 'AJUSTE_POSITIVO_NO_VENDIBLE'
    | 'BAJA_NO_VENDIBLE';
  ubicacionId: number;
  varianteId: number;
  cantidadConSigno: number;
  afectaSaldo: 'FISICO' | 'RESERVADO_BLANDO' | 'RESERVADO_DURO' | 'NO_VENDIBLE';
  documentoTipo: 'COMPRA' | 'TRASLADO' | 'VENTA_POS' | 'DEVOLUCION_POS' | 'PEDIDO_WEB' | 'AJUSTE';
  documentoId: number;
  usuarioId: number;
  motivo?: string;
}

/**
 * Servicio Centralizado de Kardex (RN-GEN-02, RN-INV-01 a 09).
 * ÚNICA vía autorizada en todo el sistema para mutar SaldoStock.
 */
export class InventoryLedgerService {
  /**
   * Ejecuta un movimiento de inventario inmutable dentro de una transacción Prisma existente.
   */
  static async registrarMovimiento(
    tx: Prisma.TransactionClient,
    params: RegistrarMovimientoParams
  ): Promise<void> {
    const {
      tipo,
      ubicacionId,
      varianteId,
      cantidadConSigno,
      afectaSaldo,
      documentoTipo,
      documentoId,
      usuarioId,
      motivo,
    } = params;

    // 1. Bloqueo pesimista de la fila de saldo
    const saldo = await tx.saldoStock.findUnique({
      where: {
        ubicacionId_varianteId: { ubicacionId, varianteId },
      },
    });

    if (!saldo) {
      throw AppError.notFound(`No existe registro de SaldoStock para ubicacion ${ubicacionId} y variante ${varianteId}`);
    }

    // 2. Calcula nuevo saldo según el componente afectado
    const updateData: Prisma.SaldoStockUpdateInput = {};
    let saldoResultante = 0;

    if (afectaSaldo === 'FISICO') {
      const nuevoFisico = saldo.fisico + cantidadConSigno;
      if (nuevoFisico < 0 || nuevoFisico < saldo.reservadoBlando + saldo.reservadoDuro) {
        throw AppError.badRequest('La operación generaría un saldo físico negativo o inferior a las reservas activas (RN-INV-01).');
      }
      updateData.fisico = nuevoFisico;
      saldoResultante = nuevoFisico;
    } else if (afectaSaldo === 'RESERVADO_BLANDO') {
      const nuevoBlando = saldo.reservadoBlando + cantidadConSigno;
      if (nuevoBlando < 0) {
        throw AppError.badRequest('El saldo reservado blando no puede ser negativo.');
      }
      updateData.reservadoBlando = nuevoBlando;
      saldoResultante = nuevoBlando;
    } else if (afectaSaldo === 'RESERVADO_DURO') {
      const nuevoDuro = saldo.reservadoDuro + cantidadConSigno;
      if (nuevoDuro < 0) {
        throw AppError.badRequest('El saldo reservado duro no puede ser negativo.');
      }
      updateData.reservadoDuro = nuevoDuro;
      saldoResultante = nuevoDuro;
    } else if (afectaSaldo === 'NO_VENDIBLE') {
      const nuevoNoVendible = saldo.noVendible + cantidadConSigno;
      if (nuevoNoVendible < 0) {
        throw AppError.badRequest('El saldo no vendible no puede ser negativo.');
      }
      updateData.noVendible = nuevoNoVendible;
      saldoResultante = nuevoNoVendible;
    }

    // 3. Aplica la mutación en SaldoStock
    await tx.saldoStock.update({
      where: {
        ubicacionId_varianteId: { ubicacionId, varianteId },
      },
      data: updateData,
    });

    // 4. Marca que la variante ya tiene movimientos históricos (inmutabiliza SKU)
    await tx.variante.update({
      where: { id: varianteId },
      data: { tieneMovimientos: true },
    });

    // 5. Inserta el registro inmutable en el Kardex
    await tx.movimientoInventario.create({
      data: {
        tipo,
        ubicacionId,
        varianteId,
        cantidadConSigno,
        afectaSaldo,
        saldoResultante,
        documentoTipo,
        documentoId,
        usuarioId,
        motivo: motivo ?? null,
      },
    });
  }
}
