import type { Prisma, TipoMovimientoStock } from '@prisma/client';
import { AppError } from '../../shared/domain/AppError.js';

export interface SaldoStockSnapshot {
  id: number;
  ubicacionId: number;
  varianteId: number;
  fisico: number;
  reservadoBlando: number;
  reservadoDuro: number;
  noVendible: number;
  bloqueadoDespachoWeb: boolean;
  disponible: number;
}

export interface RegistrarMovimientoParams {
  tipo: TipoMovimientoStock;
  ubicacionId: number;
  varianteId: number;
  cantidadConSigno: number;
  afectaSaldo: 'FISICO' | 'RESERVADO_BLANDO' | 'RESERVADO_DURO' | 'NO_VENDIBLE';
  documentoTipo: 'COMPRA' | 'TRASLADO' | 'VENTA_POS' | 'DEVOLUCION_POS' | 'PEDIDO_WEB' | 'AJUSTE';
  documentoId: number;
  usuarioId: number;
  motivo?: string | null;
  autoCrearSiNoExiste?: boolean;
}

export interface MovimientoResult {
  id: bigint;
  saldoResultante: number;
  disponibleResultante: number;
}

/**
 * Servicio Centralizado de Kardex (RN-GEN-02, RN-INV-01 a 09, RNF-003).
 * ÚNICA vía autorizada en todo el sistema para mutar SaldoStock.
 */
export class InventoryLedgerService {
  /**
   * Valida la coherencia contable y de signo de cada movimiento según RN-INV-09.
   * Blindaje contra desbordamientos numéricos y números no enteros (RN-GEN-04).
   */
  static validarCongruenciaMovimiento(
    tipo: TipoMovimientoStock,
    afectaSaldo: 'FISICO' | 'RESERVADO_BLANDO' | 'RESERVADO_DURO' | 'NO_VENDIBLE',
    cantidadConSigno: number
  ): void {
    if (!Number.isInteger(cantidadConSigno) || !Number.isSafeInteger(cantidadConSigno)) {
      throw AppError.badRequest('La cantidad de inventario debe ser un número entero válido (RN-GEN-04).');
    }

    if (Math.abs(cantidadConSigno) > 2_147_483_647) {
      throw AppError.badRequest('La cantidad de inventario excede el límite numérico admitido (32 bits).');
    }

    if (cantidadConSigno === 0) {
      throw AppError.badRequest('La cantidad con signo de un movimiento no puede ser 0.');
    }

    switch (tipo) {
      case 'CARGA_INICIAL':
      case 'COMPRA_RECIBIDA':
      case 'ANULACION_VENTA_POS':
      case 'DEVOLUCION_POS_VENDIBLE':
      case 'RETORNO_LOGISTICO_WEB_VENDIBLE':
      case 'DEVOLUCION_COMERCIAL_WEB_VENDIBLE':
      case 'TRASLADO_RECIBIDO_BUENO':
      case 'TRASLADO_CANCELADO_REINGRESO':
      case 'NOVEDAD_LLEGO_DESTINO':
      case 'NOVEDAD_RETORNO_ORIGEN':
      case 'NOVEDAD_EXCEDENTE_INCORPORADO':
      case 'AJUSTE_POSITIVO_FISICO':
        if (cantidadConSigno <= 0 || afectaSaldo !== 'FISICO') {
          throw AppError.badRequest(`El movimiento ${tipo} debe tener cantidad > 0 y afectar saldo FISICO.`);
        }
        break;

      case 'VENTA_POS':
      case 'TRASLADO_ENVIADO':
      case 'NOVEDAD_PERDIDA':
      case 'AJUSTE_NEGATIVO_FISICO':
        if (cantidadConSigno >= 0 || afectaSaldo !== 'FISICO') {
          throw AppError.badRequest(`El movimiento ${tipo} debe tener cantidad < 0 y afectar saldo FISICO.`);
        }
        break;

      case 'RESERVA_WEB':
        if (cantidadConSigno <= 0 || afectaSaldo !== 'RESERVADO_BLANDO') {
          throw AppError.badRequest('RESERVA_WEB debe tener cantidad > 0 y afectar RESERVADO_BLANDO.');
        }
        break;

      case 'LIBERACION_RESERVA_WEB':
        if (cantidadConSigno >= 0 || afectaSaldo !== 'RESERVADO_BLANDO') {
          throw AppError.badRequest('LIBERACION_RESERVA_WEB debe tener cantidad < 0 y afectar RESERVADO_BLANDO.');
        }
        break;

      case 'ENDURECIMIENTO_RESERVA_WEB':
        if (cantidadConSigno <= 0 || afectaSaldo !== 'RESERVADO_DURO') {
          throw AppError.badRequest('ENDURECIMIENTO_RESERVA_WEB debe tener cantidad > 0 y afectar RESERVADO_DURO.');
        }
        break;

      case 'DESPACHO_WEB':
        if (cantidadConSigno >= 0 || afectaSaldo !== 'FISICO') {
          throw AppError.badRequest('DESPACHO_WEB debe tener cantidad < 0 y afectar FISICO.');
        }
        break;

      case 'DEVOLUCION_POS_NO_VENDIBLE':
      case 'RETORNO_LOGISTICO_WEB_NO_VENDIBLE':
      case 'DEVOLUCION_COMERCIAL_WEB_NO_VENDIBLE':
      case 'TRASLADO_RECIBIDO_DANADO':
      case 'AJUSTE_POSITIVO_NO_VENDIBLE':
        if (cantidadConSigno <= 0 || afectaSaldo !== 'NO_VENDIBLE') {
          throw AppError.badRequest(`El movimiento ${tipo} debe tener cantidad > 0 y afectar NO_VENDIBLE.`);
        }
        break;

      case 'BAJA_NO_VENDIBLE':
        if (cantidadConSigno >= 0 || afectaSaldo !== 'NO_VENDIBLE') {
          throw AppError.badRequest('BAJA_NO_VENDIBLE debe tener cantidad < 0 y afectar NO_VENDIBLE.');
        }
        break;

      default:
        break;
    }
  }

  /**
   * Adquiere un bloqueo pesimista exclusivo a nivel de fila (SELECT ... FOR UPDATE)
   * garantizando que ninguna otra transacción concurrentemente modifique el saldo.
   */
  static async bloquearYObtenerSaldo(
    tx: Prisma.TransactionClient,
    ubicacionId: number,
    varianteId: number,
    autoCrearSiNoExiste = false
  ): Promise<SaldoStockSnapshot> {
    const filas = await tx.$queryRaw<
      Array<{
        id: number;
        ubicacionId: number;
        varianteId: number;
        fisico: number;
        reservadoBlando: number;
        reservadoDuro: number;
        noVendible: number;
        bloqueadoDespachoWeb: boolean;
      }>
    >`
      SELECT id, "ubicacionId", "varianteId", fisico, "reservadoBlando", "reservadoDuro", "noVendible", "bloqueadoDespachoWeb"
      FROM "SaldoStock"
      WHERE "ubicacionId" = ${ubicacionId} AND "varianteId" = ${varianteId}
      FOR UPDATE
    `;

    let saldo = filas[0];

    if (!saldo) {
      if (!autoCrearSiNoExiste) {
        throw AppError.notFound(
          `No existe registro de SaldoStock para ubicacion ${ubicacionId} y variante ${varianteId}`
        );
      }

      // Auto-creación atómica si es primer ingreso o carga inicial
      if (tx.saldoStock?.upsert) {
        await tx.saldoStock.upsert({
          where: {
            ubicacionId_varianteId: { ubicacionId, varianteId },
          },
          update: {},
          create: {
            ubicacionId,
            varianteId,
            fisico: 0,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
          },
        });
      } else if (tx.saldoStock?.create) {
        await tx.saldoStock.create({
          data: {
            ubicacionId,
            varianteId,
            fisico: 0,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
          },
        });
      }

      // Adquiere el bloqueo pesimista sobre la nueva fila
      const filasCreadas = await tx.$queryRaw<
        Array<{
          id: number;
          ubicacionId: number;
          varianteId: number;
          fisico: number;
          reservadoBlando: number;
          reservadoDuro: number;
          noVendible: number;
          bloqueadoDespachoWeb: boolean;
        }>
      >`
        SELECT id, "ubicacionId", "varianteId", fisico, "reservadoBlando", "reservadoDuro", "noVendible", "bloqueadoDespachoWeb"
        FROM "SaldoStock"
        WHERE "ubicacionId" = ${ubicacionId} AND "varianteId" = ${varianteId}
        FOR UPDATE
      `;

      saldo = filasCreadas[0]!;
    }

    const disponible = Math.max(0, saldo.fisico - saldo.reservadoBlando - saldo.reservadoDuro);

    return {
      ...saldo,
      disponible,
    };
  }

  /**
   * Ejecuta un movimiento de inventario inmutable dentro de una transacción Prisma existente.
   */
  static async registrarMovimiento(
    tx: Prisma.TransactionClient,
    params: RegistrarMovimientoParams
  ): Promise<MovimientoResult> {
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
      autoCrearSiNoExiste = false,
    } = params;

    // 0. Valida coherencia del movimiento según matriz RN-INV-09
    this.validarCongruenciaMovimiento(tipo, afectaSaldo, cantidadConSigno);

    // 1. Bloqueo pesimista exclusivo a nivel de fila (RN-INV-05)
    const saldo = await this.bloquearYObtenerSaldo(
      tx,
      ubicacionId,
      varianteId,
      autoCrearSiNoExiste
    );

    // 2. Calcula nuevo saldo según la operación y valida invariantes (RN-INV-01)
    const updateData: Prisma.SaldoStockUpdateInput = {};
    let saldoResultante = 0;

    if (tipo === 'ENDURECIMIENTO_RESERVA_WEB') {
      // Transición atómica de Blando a Duro (RN-WEB-15, CA-42)
      const cant = Math.abs(cantidadConSigno);
      if (saldo.reservadoBlando < cant) {
        throw AppError.conflict(
          `Reserva blanda insuficiente en ubicación ${ubicacionId} para endurecer variante ${varianteId}. Blando: ${saldo.reservadoBlando}, Requerido: ${cant}.`
        );
      }
      const nuevoBlando = saldo.reservadoBlando - cant;
      const nuevoDuro = saldo.reservadoDuro + cant;
      updateData.reservadoBlando = nuevoBlando;
      updateData.reservadoDuro = nuevoDuro;
      saldoResultante = nuevoDuro;
    } else if (tipo === 'DESPACHO_WEB') {
      // Despacho físico atómico descontando físico y reserva dura simultáneamente (RN-WEB-18)
      const cant = Math.abs(cantidadConSigno);
      if (saldo.reservadoDuro < cant) {
        throw AppError.conflict(
          `Reserva dura insuficiente para despacho en ubicación ${ubicacionId} para variante ${varianteId}. Duro: ${saldo.reservadoDuro}, Requerido: ${cant}.`
        );
      }
      if (saldo.fisico < cant) {
        throw AppError.conflict(
          `Stock físico insuficiente para despacho en ubicación ${ubicacionId} para variante ${varianteId}. Físico: ${saldo.fisico}, Requerido: ${cant}.`
        );
      }
      const nuevoFisico = saldo.fisico - cant;
      const nuevoDuro = saldo.reservadoDuro - cant;
      updateData.fisico = nuevoFisico;
      updateData.reservadoDuro = nuevoDuro;
      saldoResultante = nuevoFisico;
    } else if (afectaSaldo === 'FISICO') {
      const nuevoFisico = saldo.fisico + cantidadConSigno;
      if (nuevoFisico < 0) {
        throw AppError.conflict(
          `Stock físico insuficiente en ubicación ${ubicacionId} para variante ${varianteId}. Actual: ${saldo.fisico}, Solicitado: ${Math.abs(cantidadConSigno)}.`
        );
      }
      if (nuevoFisico < saldo.reservadoBlando + saldo.reservadoDuro) {
        throw AppError.conflict(
          `La operación dejaría el saldo físico (${nuevoFisico}) por debajo de las reservas activas (${saldo.reservadoBlando + saldo.reservadoDuro}). Libere o preempte reservas primero (RN-INV-01).`
        );
      }
      updateData.fisico = nuevoFisico;
      saldoResultante = nuevoFisico;
    } else if (afectaSaldo === 'RESERVADO_BLANDO') {
      const nuevoBlando = saldo.reservadoBlando + cantidadConSigno;
      if (nuevoBlando < 0) {
        throw AppError.badRequest('El saldo reservado blando no puede ser negativo.');
      }
      if (saldo.fisico < nuevoBlando + saldo.reservadoDuro) {
        throw AppError.conflict(
          `Stock disponible insuficiente para reserva blanda en ubicación ${ubicacionId}. Físico: ${saldo.fisico}, Reservas requeridas: ${nuevoBlando + saldo.reservadoDuro}.`
        );
      }
      updateData.reservadoBlando = nuevoBlando;
      saldoResultante = nuevoBlando;
    } else if (afectaSaldo === 'RESERVADO_DURO') {
      const nuevoDuro = saldo.reservadoDuro + cantidadConSigno;
      if (nuevoDuro < 0) {
        throw AppError.badRequest('El saldo reservado duro no puede ser negativo.');
      }
      if (saldo.fisico < saldo.reservadoBlando + nuevoDuro) {
        throw AppError.conflict(
          `Stock disponible insuficiente para endurecer reserva en ubicación ${ubicacionId}. Físico: ${saldo.fisico}, Reservas requeridas: ${saldo.reservadoBlando + nuevoDuro}.`
        );
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

    // 3. Aplica la mutación centralizada en SaldoStock (RN-GEN-02)
    const saldoActualizado = await tx.saldoStock.update({
      where: {
        ubicacionId_varianteId: { ubicacionId, varianteId },
      },
      data: updateData,
    });

    // 4. Marca que la variante tiene movimientos para inmutabilizar su SKU solo si aún no está marcado (RN-CAT-03)
    // Evita adquirir un RowExclusiveLock innecesario sobre Variante en cada transacción concurrente
    if (tx.variante?.updateMany) {
      await tx.variante.updateMany({
        where: { id: varianteId, tieneMovimientos: false },
        data: { tieneMovimientos: true },
      });
    } else if (tx.variante?.update) {
      await tx.variante.update({
        where: { id: varianteId },
        data: { tieneMovimientos: true },
      });
    }

    // 5. Inserta el registro inmutable en el Kardex Ledger
    const movimientoCreado = await tx.movimientoInventario.create({
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
      select: {
        id: true,
      },
    });

    const disponibleResultante = Math.max(
      0,
      saldoActualizado.fisico -
        saldoActualizado.reservadoBlando -
        saldoActualizado.reservadoDuro
    );

    return {
      id: movimientoCreado.id,
      saldoResultante,
      disponibleResultante,
    };
  }

  /**
   * Ejecuta múltiples movimientos aplicando ORDEN CANÓNICO ANTI-DEADLOCK (RNF-003, Invariante 4).
   * Ordena obligatoriamente por varianteId ASC antes de adquirir los locks pesimistas.
   */
  static async registrarMovimientosBatch(
    tx: Prisma.TransactionClient,
    movimientos: RegistrarMovimientoParams[]
  ): Promise<MovimientoResult[]> {
    if (movimientos.length === 0) return [];

    // Ordenamiento Canónico Anti-Deadlock (RNF-003)
    const movimientosOrdenados = [...movimientos].sort((a, b) => {
      if (a.varianteId !== b.varianteId) {
        return a.varianteId - b.varianteId;
      }
      return a.ubicacionId - b.ubicacionId;
    });

    const resultados: MovimientoResult[] = [];
    for (const params of movimientosOrdenados) {
      const res = await this.registrarMovimiento(tx, params);
      resultados.push(res);
    }

    return resultados;
  }

  /**
   * Consulta el saldo cuádruple y disponible de una variante sin adquirir lock.
   */
  static async obtenerSaldo(
    db: Prisma.TransactionClient | typeof import('../../config/database.js').prisma,
    ubicacionId: number,
    varianteId: number
  ): Promise<SaldoStockSnapshot | null> {
    const saldo = await db.saldoStock.findUnique({
      where: {
        ubicacionId_varianteId: { ubicacionId, varianteId },
      },
    });

    if (!saldo) return null;

    const disponible = Math.max(0, saldo.fisico - saldo.reservadoBlando - saldo.reservadoDuro);

    return {
      ...saldo,
      disponible,
    };
  }

  /**
   * Valida si una sede tiene stock disponible suficiente para un listado de variantes.
   */
  static async validarDisponibilidad(
    db: Prisma.TransactionClient | typeof import('../../config/database.js').prisma,
    ubicacionId: number,
    items: Array<{ varianteId: number; cantidad: number }>
  ): Promise<{ valido: boolean; faltantes: Array<{ varianteId: number; requerido: number; disponible: number }> }> {
    const faltantes: Array<{ varianteId: number; requerido: number; disponible: number }> = [];

    // Agrupar items por varianteId para sumar cantidades duplicadas del carrito
    const cantidadesPorVariante = new Map<number, number>();
    for (const item of items) {
      const actual = cantidadesPorVariante.get(item.varianteId) ?? 0;
      cantidadesPorVariante.set(item.varianteId, actual + item.cantidad);
    }

    for (const [varianteId, requerido] of cantidadesPorVariante.entries()) {
      const saldo = await this.obtenerSaldo(db, ubicacionId, varianteId);
      const disponible = saldo?.disponible ?? 0;
      if (disponible < requerido) {
        faltantes.push({
          varianteId,
          requerido,
          disponible,
        });
      }
    }

    return {
      valido: faltantes.length === 0,
      faltantes,
    };
  }

  /**
   * Marca cuarentena de despacho web para variantes en una sede específica (RN-WEB-16, CA-43).
   * Solo afecta a la sede indicada. Aplica orden canónico anti-deadlock (RNF-003).
   */
  static async marcarCuarentenaDespachoWeb(
    tx: Prisma.TransactionClient,
    ubicacionId: number,
    varianteIds: number[],
    motivo: string
  ): Promise<void> {
    const idsOrdenados = [...new Set(varianteIds)].sort((a, b) => a - b);
    for (const varianteId of idsOrdenados) {
      await tx.saldoStock.updateMany({
        where: { ubicacionId, varianteId },
        data: {
          bloqueadoDespachoWeb: true,
          motivoBloqueoWeb: motivo,
        },
      });
    }
  }

  /**
   * Levanta la cuarentena de despacho web para variantes en una sede específica.
   */
  static async levantarCuarentenaDespachoWeb(
    tx: Prisma.TransactionClient,
    ubicacionId: number,
    varianteIds: number[]
  ): Promise<void> {
    const idsOrdenados = [...varianteIds].sort((a, b) => a - b);
    for (const varianteId of idsOrdenados) {
      await tx.saldoStock.updateMany({
        where: { ubicacionId, varianteId },
        data: {
          bloqueadoDespachoWeb: false,
          motivoBloqueoWeb: null,
        },
      });
    }
  }
}
