import type { Prisma, EstadoTraslado } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import type { UserAuthSnapshot } from '../../shared/middlewares/authPermission.js';
import {
  InventoryLedgerService,
  type RegistrarMovimientoParams,
} from '../04-inventario/InventoryLedgerService.js';
import type {
  CancelarTrasladoInput,
  ConfirmarRetornoInput,
  DespacharTrasladoInput,
  EvaluarTrasladoInput,
  ListarTrasladosQuery,
  RecibirTrasladoInput,
  ResolverNovedadInput,
  SolicitarTrasladoInput,
} from './traslado.schema.js';

export class TrasladoService {
  /**
   * RF-TRA-01: Solicitud desde punto de venta (SOLICITADO) o Envío directo desde Central (APROBADO).
   */
  static async solicitar(data: SolicitarTrasladoInput, user: UserAuthSnapshot) {
    return prisma.$transaction(async (tx) => {
      // 1. Identificar la Bodega Central activa
      const central = await tx.ubicacion.findFirst({
        where: { tipo: 'CENTRAL', activa: true },
      });
      if (!central) {
        throw AppError.notFound('No se encontró una Bodega Central activa en el sistema');
      }

      // 2. Reglas de actor y sede solicitante (RF-TRA-01)
      if (data.esEnvioDirecto) {
        if (user.rol !== 'ADMIN') {
          throw AppError.forbidden('Solo el Administrador puede emitir envíos directos desde Bodega Central');
        }
      } else {
        if (user.rol !== 'ADMIN' && !user.permisos.permVerOtrosPuntos) {
          if (user.ubicacionId !== data.ubicacionDestinoId) {
            throw AppError.forbidden(
              'Un punto de venta solo puede solicitar traslados hacia su propia sede (RF-TRA-01)'
            );
          }
        }
      }

      // 3. Validar sede destino (no puede ser Central y debe estar activa, RN-TRA-01)
      const destino = await tx.ubicacion.findUnique({
        where: { id: data.ubicacionDestinoId },
      });
      if (!destino) {
        throw AppError.notFound(`Ubicación destino con id ${data.ubicacionDestinoId} no existe`);
      }
      if (!destino.activa) {
        throw AppError.badRequest('La ubicación destino se encuentra inactiva');
      }
      if (destino.tipo === 'CENTRAL') {
        throw AppError.badRequest('La Bodega Central no puede ser sede destino de un traslado (RN-TRA-01)');
      }

      // 4. Validar existencia y estado de variantes
      const varianteIds = data.lineas.map((l) => l.varianteId);
      const variantesEnBd = await tx.variante.findMany({
        where: { id: { in: varianteIds } },
        include: { producto: true },
      });

      if (variantesEnBd.length !== varianteIds.length) {
        throw AppError.notFound('Una o más variantes especificadas no existen en el catálogo');
      }

      for (const variante of variantesEnBd) {
        if (variante.producto.activo === false) {
          throw AppError.badRequest(
            `El producto '${variante.producto.nombre}' correspondiente a la variante ${variante.id} está inactivo`
          );
        }
      }

      // 5. Configurar estado y cantidades iniciales
      const esDirecto = data.esEnvioDirecto === true;
      const estadoInicial = esDirecto ? 'APROBADO' : 'SOLICITADO';
      const fechaAprobacion = esDirecto ? new Date() : null;
      const aprobadoPorId = esDirecto ? user.id : null;

      const lineasData = data.lineas.map((linea) => ({
        varianteId: linea.varianteId,
        cantidadSolicitada: linea.cantidadSolicitada,
        cantidadAprobada: esDirecto ? linea.cantidadSolicitada : null,
        cantidadEnviada: null,
        cantidadRecibidaBuena: null,
        cantidadRecibidaDanada: null,
        excedenteReportado: 0,
        unidadesFaltantesPendientes: 0,
        excedentePendienteResolver: 0,
      }));

      // 6. Crear el Traslado con sus líneas
      const trasladoCreado = await tx.traslado.create({
        data: {
          esEnvioDirecto: esDirecto,
          ubicacionOrigenId: central.id,
          ubicacionDestinoId: destino.id,
          estado: estadoInicial,
          creadoPorId: user.id,
          aprobadoPorId,
          fechaAprobacion,
          lineas: {
            create: lineasData,
          },
        },
        include: {
          lineas: true,
          ubicacionOrigen: true,
          ubicacionDestino: true,
        },
      });

      // 7. Registro de Auditoría inmutable (RN-GEN-03, RN-AUD-02)
      await tx.registroAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: esDirecto ? 'CREAR_ENVIO_DIRECTO_CENTRAL' : 'CREAR_SOLICITUD_TRASLADO',
          entidadTipo: 'Traslado',
          entidadId: String(trasladoCreado.id),
          datosMinimos: {
            trasladoId: trasladoCreado.id,
            origenId: central.id,
            destinoId: destino.id,
            estado: estadoInicial,
            lineasCount: data.lineas.length,
          },
        },
      });

      return trasladoCreado;
    });
  }

  /**
   * RF-TRA-02: Aprobación total/parcial o rechazo en Central (CA-11).
   */
  static async evaluar(id: number, data: EvaluarTrasladoInput, user: UserAuthSnapshot) {
    return prisma.$transaction(async (tx) => {
      const traslado = await tx.traslado.findUnique({
        where: { id },
        include: { lineas: true },
      });

      if (!traslado) {
        throw AppError.notFound(`Traslado con id ${id} no encontrado`);
      }

      // Control de Concurrencia Optimista (QA-014)
      if (data.version !== undefined && traslado.version !== data.version) {
        throw AppError.conflict('Conflicto de concurrencia: el traslado fue modificado por otro proceso (QA-014)');
      }

      if (traslado.estado !== 'SOLICITADO') {
        throw AppError.conflict(
          `Solo se pueden evaluar traslados en estado SOLICITADO. Estado actual: ${traslado.estado}`
        );
      }

      if (data.accion === 'RECHAZAR') {
        if (!data.motivoRechazo || data.motivoRechazo.trim().length === 0) {
          throw AppError.badRequest('El motivo de rechazo es obligatorio para rechazar un traslado');
        }

        const actualizado = await tx.traslado.update({
          where: { id, version: traslado.version },
          data: {
            estado: 'RECHAZADO',
            motivoRechazoCancelacion: data.motivoRechazo.trim(),
            aprobadoPorId: user.id,
            fechaCierre: new Date(),
            version: { increment: 1 },
          },
          include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
        });

        await tx.registroAuditoria.create({
          data: {
            usuarioId: user.id,
            accion: 'RECHAZAR_TRASLADO',
            entidadTipo: 'Traslado',
            entidadId: String(id),
            datosMinimos: {
              trasladoId: id,
              motivo: data.motivoRechazo.trim(),
            },
          },
        });

        return actualizado;
      }

      // Acción === 'APROBAR'
      const lineasAprobadasMap = new Map<number, number>();
      if (data.lineas && data.lineas.length > 0) {
        for (const inputLinea of data.lineas) {
          const lineaExistente = traslado.lineas.find((l) => l.id === inputLinea.lineaId);
          if (!lineaExistente) {
            throw AppError.badRequest(
              `La línea ${inputLinea.lineaId} no pertenece al traslado ${id}`
            );
          }

          // CA-11: La cantidad aprobada nunca excede la solicitada
          if (inputLinea.cantidadAprobada > lineaExistente.cantidadSolicitada) {
            throw AppError.unprocessable(
              `La cantidad aprobada (${inputLinea.cantidadAprobada}) no puede superar la solicitada (${lineaExistente.cantidadSolicitada}) para la línea ${inputLinea.lineaId} (CA-11)`
            );
          }

          lineasAprobadasMap.set(inputLinea.lineaId, inputLinea.cantidadAprobada);
        }
      }

      // Actualizar cada línea del traslado
      let totalUnidadesAprobadas = 0;
      for (const linea of traslado.lineas) {
        const cantidadAprobada = lineasAprobadasMap.has(linea.id)
          ? lineasAprobadasMap.get(linea.id)!
          : linea.cantidadSolicitada; // Aprobación total si no se especificó ajuste parcial

        totalUnidadesAprobadas += cantidadAprobada;

        await tx.lineaTraslado.update({
          where: { id: linea.id },
          data: { cantidadAprobada },
        });
      }

      if (totalUnidadesAprobadas === 0) {
        throw AppError.badRequest(
          'No se puede aprobar un traslado con 0 unidades aprobadas. En su lugar debe ser RECHAZADO.'
        );
      }

      const actualizado = await tx.traslado.update({
        where: { id, version: traslado.version },
        data: {
          estado: 'APROBADO',
          aprobadoPorId: user.id,
          fechaAprobacion: new Date(),
          version: { increment: 1 },
        },
        include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
      });

      await tx.registroAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'APROBAR_TRASLADO',
          entidadTipo: 'Traslado',
          entidadId: String(id),
          datosMinimos: {
            trasladoId: id,
            totalUnidadesAprobadas,
          },
        },
      });

      return actualizado;
    });
  }

  /**
   * RF-TRA-03: Despacho desde Central a Tránsito (CA-04, CA-05).
   * Descuenta stock físico de Central vía InventoryLedgerService y pasa a ENVIADO.
   */
  static async despachar(id: number, data: DespacharTrasladoInput, user: UserAuthSnapshot) {
    return prisma.$transaction(async (tx) => {
      const traslado = await tx.traslado.findUnique({
        where: { id },
        include: { lineas: true, ubicacionDestino: true, ubicacionOrigen: true },
      });

      if (!traslado) {
        throw AppError.notFound(`Traslado con id ${id} no encontrado`);
      }

      // Control de Concurrencia Optimista (QA-014)
      if (data.version !== undefined && traslado.version !== data.version) {
        throw AppError.conflict('Conflicto de concurrencia: el traslado fue modificado por otro proceso (QA-014)');
      }

      if (traslado.estado !== 'APROBADO') {
        throw AppError.conflict(
          `Solo se pueden despachar traslados en estado APROBADO. Estado actual: ${traslado.estado}`
        );
      }

      const lineasDespachoMap = new Map<number, number>();
      if (data.lineas && data.lineas.length > 0) {
        for (const inputLinea of data.lineas) {
          const lineaExistente = traslado.lineas.find((l) => l.id === inputLinea.lineaId);
          if (!lineaExistente) {
            throw AppError.badRequest(
              `La línea ${inputLinea.lineaId} no pertenece al traslado ${id}`
            );
          }

          const aprobada = lineaExistente.cantidadAprobada ?? 0;
          // CA-11: La cantidad enviada nunca puede superar la aprobada
          if (inputLinea.cantidadEnviada > aprobada) {
            throw AppError.unprocessable(
              `La cantidad enviada (${inputLinea.cantidadEnviada}) no puede superar la aprobada (${aprobada}) para la línea ${inputLinea.lineaId} (CA-11)`
            );
          }

          lineasDespachoMap.set(inputLinea.lineaId, inputLinea.cantidadEnviada);
        }
      }

      const lineasParaDespachar: Array<{ lineaId: number; varianteId: number; cantidadEnviada: number }> = [];

      for (const linea of traslado.lineas) {
        const cantidadEnviada = lineasDespachoMap.has(linea.id)
          ? lineasDespachoMap.get(linea.id)!
          : linea.cantidadAprobada ?? 0;

        if (cantidadEnviada > 0) {
          lineasParaDespachar.push({
            lineaId: linea.id,
            varianteId: linea.varianteId,
            cantidadEnviada,
          });
        }
      }

      if (lineasParaDespachar.length === 0) {
        throw AppError.badRequest('El despacho debe contener al menos una unidad a enviar.');
      }

      // 1. Descontar stock físico en Central vía InventoryLedgerService (RN-GEN-02, RNF-003, CA-04)
      const movimientos: RegistrarMovimientoParams[] = lineasParaDespachar.map((item) => ({
        tipo: 'TRASLADO_ENVIADO',
        ubicacionId: traslado.ubicacionOrigenId,
        varianteId: item.varianteId,
        cantidadConSigno: -item.cantidadEnviada,
        afectaSaldo: 'FISICO',
        documentoTipo: 'TRASLADO',
        documentoId: traslado.id,
        usuarioId: user.id,
        motivo: `Despacho de traslado #${traslado.id} hacia sede ${traslado.ubicacionDestino.nombre} (CA-04)`,
      }));

      // registrarMovimientosBatch aplica orden canónico anti-deadlock por varianteId ASC (RNF-003)
      await InventoryLedgerService.registrarMovimientosBatch(tx, movimientos);

      // 2. Actualizar cada línea con su cantidadEnviada
      for (const item of lineasParaDespachar) {
        await tx.lineaTraslado.update({
          where: { id: item.lineaId },
          data: { cantidadEnviada: item.cantidadEnviada },
        });
      }

      // 3. Pasar traslado a estado ENVIADO (mercancía en tránsito, CA-05)
      const actualizado = await tx.traslado.update({
        where: { id, version: traslado.version },
        data: {
          estado: 'ENVIADO',
          enviadoPorId: user.id,
          fechaEnvio: new Date(),
          version: { increment: 1 },
        },
        include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
      });

      // 4. Auditoría
      await tx.registroAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'DESPACHAR_TRASLADO',
          entidadTipo: 'Traslado',
          entidadId: String(id),
          datosMinimos: {
            trasladoId: id,
            lineasDespachadas: lineasParaDespachar.length,
            origenId: traslado.ubicacionOrigenId,
            destinoId: traslado.ubicacionDestinoId,
          },
        },
      });

      return actualizado;
    });
  }

  /**
   * RF-TRA-04: Cancelación y flujo «Retornando a Central» (RN-TRA-12, CA-09, CA-59).
   * - En SOLICITADO o APROBADO: pasa directo a CANCELADO sin movimiento de stock.
   * - En ENVIADO: pasa a RETORNANDO_A_CENTRAL (la mercancía continúa en tránsito y destino queda bloqueado de recibirla).
   */
  static async cancelar(id: number, data: CancelarTrasladoInput, user: UserAuthSnapshot) {
    return prisma.$transaction(async (tx) => {
      const traslado = await tx.traslado.findUnique({
        where: { id },
        include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
      });

      if (!traslado) {
        throw AppError.notFound(`Traslado con id ${id} no encontrado`);
      }

      // Control de Concurrencia Optimista (QA-014)
      if (data.version !== undefined && traslado.version !== data.version) {
        throw AppError.conflict('Conflicto de concurrencia: el traslado fue modificado por otro proceso (QA-014)');
      }

      const motivoLimpio = data.motivo.trim();

      if (traslado.estado === 'SOLICITADO' || traslado.estado === 'APROBADO') {
        // Aún no se descontó stock de Central; cancelación inmediata
        const cancelado = await tx.traslado.update({
          where: { id, version: traslado.version },
          data: {
            estado: 'CANCELADO',
            motivoRechazoCancelacion: motivoLimpio,
            fechaCierre: new Date(),
            version: { increment: 1 },
          },
          include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
        });

        await tx.registroAuditoria.create({
          data: {
            usuarioId: user.id,
            accion: 'CANCELAR_TRASLADO_PREVIO_ENVIO',
            entidadTipo: 'Traslado',
            entidadId: String(id),
            datosMinimos: { trasladoId: id, estadoPrevio: traslado.estado, motivo: motivoLimpio },
          },
        });

        return cancelado;
      }

      if (traslado.estado === 'ENVIADO') {
        // RN-TRA-12 y CA-09: Mercancía en tránsito pasa a RETORNANDO_A_CENTRAL.
        // No se repone stock en Central hasta que se confirme la recepción física de regreso (CA-59).
        const retornando = await tx.traslado.update({
          where: { id, version: traslado.version },
          data: {
            estado: 'RETORNANDO_A_CENTRAL',
            motivoRechazoCancelacion: motivoLimpio,
            version: { increment: 1 },
          },
          include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
        });

        await tx.registroAuditoria.create({
          data: {
            usuarioId: user.id,
            accion: 'CANCELAR_TRASLADO_RETORNANDO_A_CENTRAL',
            entidadTipo: 'Traslado',
            entidadId: String(id),
            datosMinimos: { trasladoId: id, estado: 'RETORNANDO_A_CENTRAL', motivo: motivoLimpio },
          },
        });

        return retornando;
      }

      throw AppError.conflict(
        `No es posible cancelar un traslado en estado ${traslado.estado}. Solo es válido en SOLICITADO, APROBADO o ENVIADO.`
      );
    });
  }

  /**
   * RF-TRA-04 / CA-59 / QA-012: Confirmar reingreso físico a Bodega Central de un traslado retornando.
   * Repone el stock en Bodega Central vía InventoryLedgerService y pasa el traslado a CANCELADO.
   */
  static async confirmarRetorno(id: number, data: ConfirmarRetornoInput, user: UserAuthSnapshot) {
    return prisma.$transaction(async (tx) => {
      const traslado = await tx.traslado.findUnique({
        where: { id },
        include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
      });

      if (!traslado) {
        throw AppError.notFound(`Traslado con id ${id} no encontrado`);
      }

      // Control de Concurrencia Optimista (QA-014)
      if (data.version !== undefined && traslado.version !== data.version) {
        throw AppError.conflict('Conflicto de concurrencia: el traslado fue modificado por otro proceso (QA-014)');
      }

      // RN-TRA-12 / CA-59: Solo se puede confirmar retorno de traslados en RETORNANDO_A_CENTRAL
      if (traslado.estado !== 'RETORNANDO_A_CENTRAL') {
        throw AppError.conflict(
          `Solo se puede confirmar retorno físico de traslados en estado RETORNANDO_A_CENTRAL (CA-59). Estado actual: ${traslado.estado}`
        );
      }

      // 1. Preparar reingreso de stock a Central para cada línea enviada
      const movimientos: RegistrarMovimientoParams[] = traslado.lineas
        .filter((linea) => (linea.cantidadEnviada ?? 0) > 0)
        .map((linea) => ({
          tipo: 'TRASLADO_CANCELADO_REINGRESO',
          ubicacionId: traslado.ubicacionOrigenId,
          varianteId: linea.varianteId,
          cantidadConSigno: linea.cantidadEnviada!,
          afectaSaldo: 'FISICO',
          documentoTipo: 'TRASLADO',
          documentoId: traslado.id,
          usuarioId: user.id,
          motivo: `Reingreso físico por cancelación de traslado #${traslado.id} (CA-59, QA-012)`,
        }));

      if (movimientos.length > 0) {
        // Orden canónico anti-deadlock (RNF-003)
        await InventoryLedgerService.registrarMovimientosBatch(tx, movimientos);
      }

      // 2. Transicionar a CANCELADO con fecha de cierre
      const canceladoFinal = await tx.traslado.update({
        where: { id, version: traslado.version },
        data: {
          estado: 'CANCELADO',
          fechaCierre: new Date(),
          observacionRecepcion: data.observacion?.trim() ?? 'Reingreso físico confirmado en Bodega Central',
          version: { increment: 1 },
        },
        include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
      });

      // 3. Auditoría
      await tx.registroAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'CONFIRMAR_RETORNO_A_CENTRAL',
          entidadTipo: 'Traslado',
          entidadId: String(id),
          datosMinimos: {
            trasladoId: id,
            lineasReingresadas: movimientos.length,
            estadoFinal: 'CANCELADO',
          },
        },
      });

      return canceladoFinal;
    });
  }

  /**
   * RF-TRA-05 / RN-TRA-07..11 / CA-06..08 / CA-57 / CA-58 / QA-010 / QA-011:
   * Recepción de mercancía de traslado en punto de venta con conteo físico, dañados y novedades.
   */
  static async recibir(id: number, data: RecibirTrasladoInput, user: UserAuthSnapshot) {
    return prisma.$transaction(async (tx) => {
      const traslado = await tx.traslado.findUnique({
        where: { id },
        include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
      });

      if (!traslado) {
        throw AppError.notFound(`Traslado con id ${id} no encontrado`);
      }

      // Control de Concurrencia Optimista (QA-014)
      if (data.version !== undefined && traslado.version !== data.version) {
        throw AppError.conflict('Conflicto de concurrencia: el traslado fue modificado por otro proceso (QA-014)');
      }

      // Validar estado ENVIADO
      if (traslado.estado !== 'ENVIADO') {
        throw AppError.conflict(
          `Solo se pueden recibir traslados en estado ENVIADO. Estado actual: ${traslado.estado}`
        );
      }

      // Aislamiento territorial: el usuario debe pertenecer a la tienda destino (o ser ADMIN)
      if (user.rol !== 'ADMIN') {
        if (!user.permisos.permRecibirTraslado) {
          throw AppError.forbidden('No tiene el permiso permRecibirTraslado para recibir mercancía');
        }
        if (user.ubicacionId !== traslado.ubicacionDestinoId) {
          throw AppError.forbidden('No puede recibir un traslado cuyo destino no es su punto de venta asignado');
        }
      }

      const lineasMap = new Map(traslado.lineas.map((l) => [l.id, l]));

      // Validar que todas las líneas pertenezcan al traslado
      for (const lineaInput of data.lineas) {
        if (!lineasMap.has(lineaInput.lineaId)) {
          throw AppError.badRequest(`La línea con id ${lineaInput.lineaId} no pertenece a este traslado`);
        }
      }

      let totalFaltantes = 0;
      let totalExcedentes = 0;
      let totalDanadas = 0;
      const movimientos: RegistrarMovimientoParams[] = [];

      // Validar cada línea enviada
      for (const lineaDb of traslado.lineas) {
        const input = data.lineas.find((l) => l.lineaId === lineaDb.id);
        if (!input) {
          throw AppError.badRequest(`Falta reportar la línea ${lineaDb.id} correspondiente a la variante ${lineaDb.varianteId}`);
        }

        const cantidadEnviada = lineaDb.cantidadEnviada ?? 0;
        const buena = input.cantidadRecibidaBuena;
        const danada = input.cantidadRecibidaDanada;
        const excedente = input.excedenteReportado ?? 0;

        // CA-07: recibidaBuena + recibidaDanada no puede superar cantidadEnviada
        if (buena + danada > cantidadEnviada) {
          throw AppError.badRequest(
            `En la línea ${lineaDb.id}, la suma de buenas (${buena}) y dañadas (${danada}) supera la cantidad enviada (${cantidadEnviada}) (CA-07)`
          );
        }

        const faltante = cantidadEnviada - (buena + danada);
        totalFaltantes += faltante;
        totalExcedentes += excedente;
        totalDanadas += danada;

        // Movimiento para unidades buenas -> suma a FISICO destino
        if (buena > 0) {
          movimientos.push({
            tipo: 'TRASLADO_RECIBIDO_BUENO',
            ubicacionId: traslado.ubicacionDestinoId,
            varianteId: lineaDb.varianteId,
            cantidadConSigno: buena,
            afectaSaldo: 'FISICO',
            documentoTipo: 'TRASLADO',
            documentoId: traslado.id,
            usuarioId: user.id,
            motivo: `Recepción conforme traslado #${traslado.id} (CA-57)`,
          });
        }

        // Movimiento para unidades dañadas -> suma a NO_VENDIBLE destino (RN-TRA-09, CA-06)
        if (danada > 0) {
          movimientos.push({
            tipo: 'TRASLADO_RECIBIDO_DANADO',
            ubicacionId: traslado.ubicacionDestinoId,
            varianteId: lineaDb.varianteId,
            cantidadConSigno: danada,
            afectaSaldo: 'NO_VENDIBLE',
            documentoTipo: 'TRASLADO',
            documentoId: traslado.id,
            usuarioId: user.id,
            motivo: `Mercancía averiada/dañada recibida en traslado #${traslado.id} (CA-06)`,
          });
        }

        // Actualizar línea en DB
        await tx.lineaTraslado.update({
          where: { id: lineaDb.id },
          data: {
            cantidadRecibidaBuena: buena,
            cantidadRecibidaDanada: danada,
            excedenteReportado: excedente,
            unidadesFaltantesPendientes: faltante,
            excedentePendienteResolver: excedente,
          },
        });
      }

      // Invariante 4 (RNF-003): Orden canónico anti-deadlock por varianteId ASC
      if (movimientos.length > 0) {
        await InventoryLedgerService.registrarMovimientosBatch(tx, movimientos);
      }

      // RN-TRA-08 / CA-57: Si no hay faltantes ni excedentes, pasa a RECIBIDO
      // RN-TRA-09 / CA-58: Si hay faltantes o excedentes, pasa a RECIBIDO_CON_NOVEDAD
      const hayNovedad = totalFaltantes > 0 || totalExcedentes > 0;
      const nuevoEstado: EstadoTraslado = hayNovedad ? 'RECIBIDO_CON_NOVEDAD' : 'RECIBIDO';

      if (hayNovedad || totalDanadas > 0) {
        if (!data.observacion || data.observacion.trim().length < 3) {
          throw AppError.badRequest('La observación de recepción es obligatoria cuando existen averías, faltantes o excedentes reportados (RN-TRA-09)');
        }
      }

      const trasladoActualizado = await tx.traslado.update({
        where: { id, version: traslado.version },
        data: {
          estado: nuevoEstado,
          recibidoPorId: user.id,
          fechaRecepcion: new Date(),
          fechaCierre: hayNovedad ? null : new Date(),
          observacionRecepcion: data.observacion?.trim() ?? null,
          version: { increment: 1 },
        },
        include: {
          lineas: {
            include: {
              variante: {
                include: {
                  producto: { select: { id: true, nombre: true, categoria: true } },
                },
              },
            },
          },
          ubicacionOrigen: true,
          ubicacionDestino: true,
        },
      });

      // Auditoría
      await tx.registroAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: hayNovedad ? 'RECIBIR_TRASLADO_CON_NOVEDAD' : 'RECIBIR_TRASLADO_CONFORME',
          entidadTipo: 'Traslado',
          entidadId: String(id),
          datosMinimos: {
            trasladoId: id,
            estadoFinal: nuevoEstado,
            totalFaltantes,
            totalExcedentes,
            totalDanadas,
          },
        },
      });

      return trasladoActualizado;
    }, { timeout: 30000, maxWait: 15000 });
  }

  /**
   * RF-TRA-06 / RN-TRA-10 / CA-10:
   * Resolución administrativa de novedades de traslado (faltantes o excedentes).
   * Solo el rol ADMIN puede resolver novedades.
   */
  static async resolverNovedad(id: number, data: ResolverNovedadInput, user: UserAuthSnapshot) {
    if (user.rol !== 'ADMIN') {
      throw AppError.forbidden('Solo el Administrador tiene permiso para resolver novedades de traslados (CA-10)');
    }

    return prisma.$transaction(async (tx) => {
      const traslado = await tx.traslado.findUnique({
        where: { id },
        include: { lineas: true, ubicacionOrigen: true, ubicacionDestino: true },
      });

      if (!traslado) {
        throw AppError.notFound(`Traslado con id ${id} no encontrado`);
      }

      // Control de Concurrencia Optimista (QA-014)
      if (data.version !== undefined && traslado.version !== data.version) {
        throw AppError.conflict('Conflicto de concurrencia: el traslado fue modificado por otro proceso (QA-014)');
      }

      // Validar estado RECIBIDO_CON_NOVEDAD
      if (traslado.estado !== 'RECIBIDO_CON_NOVEDAD') {
        throw AppError.conflict(
          `Solo se pueden resolver novedades de traslados en estado RECIBIDO_CON_NOVEDAD. Estado actual: ${traslado.estado}`
        );
      }

      const lineasMap = new Map(traslado.lineas.map((l) => [l.id, l]));
      const movimientos: RegistrarMovimientoParams[] = [];

      for (const resolucion of data.resoluciones) {
        const linea = lineasMap.get(resolucion.lineaTrasladoId);
        if (!linea) {
          throw AppError.badRequest(`La línea con id ${resolucion.lineaTrasladoId} no pertenece al traslado`);
        }

        const { tipoResolucion, cantidadResuelta, motivo, responsable } = resolucion;

        // Validar límites según tipo de novedad
        if (
          tipoResolucion === 'LLEGO_A_PUNTO' ||
          tipoResolucion === 'RETORNO_A_CENTRAL' ||
          tipoResolucion === 'PERDIDA_AJUSTE'
        ) {
          if (cantidadResuelta > linea.unidadesFaltantesPendientes) {
            throw AppError.badRequest(
              `La cantidad a resolver (${cantidadResuelta}) supera las unidades faltantes pendientes (${linea.unidadesFaltantesPendientes}) en la línea ${linea.id}`
            );
          }

          linea.unidadesFaltantesPendientes -= cantidadResuelta;

          if (tipoResolucion === 'LLEGO_A_PUNTO') {
            movimientos.push({
              tipo: 'NOVEDAD_LLEGO_DESTINO',
              ubicacionId: traslado.ubicacionDestinoId,
              varianteId: linea.varianteId,
              cantidadConSigno: cantidadResuelta,
              afectaSaldo: 'FISICO',
              documentoTipo: 'TRASLADO',
              documentoId: traslado.id,
              usuarioId: user.id,
              motivo: `Novedad resuelta: mercancía faltante llegó a destino #${traslado.id} - ${motivo}`,
            });
          } else if (tipoResolucion === 'RETORNO_A_CENTRAL') {
            movimientos.push({
              tipo: 'NOVEDAD_RETORNO_ORIGEN',
              ubicacionId: traslado.ubicacionOrigenId,
              varianteId: linea.varianteId,
              cantidadConSigno: cantidadResuelta,
              afectaSaldo: 'FISICO',
              documentoTipo: 'TRASLADO',
              documentoId: traslado.id,
              usuarioId: user.id,
              motivo: `Novedad resuelta: mercancía faltante retornó a Central #${traslado.id} - ${motivo}`,
            });
          }
        } else if (
          tipoResolucion === 'EXCEDENTE_INCORPORADO_DESDE_CENTRAL' ||
          tipoResolucion === 'EXCEDENTE_DESCARTADO_O_DEVUELTO'
        ) {
          if (cantidadResuelta > linea.excedentePendienteResolver) {
            throw AppError.badRequest(
              `La cantidad a resolver (${cantidadResuelta}) supera el excedente pendiente (${linea.excedentePendienteResolver}) en la línea ${linea.id}`
            );
          }

          linea.excedentePendienteResolver -= cantidadResuelta;

          if (tipoResolucion === 'EXCEDENTE_INCORPORADO_DESDE_CENTRAL') {
            movimientos.push({
              tipo: 'NOVEDAD_EXCEDENTE_INCORPORADO',
              ubicacionId: traslado.ubicacionDestinoId,
              varianteId: linea.varianteId,
              cantidadConSigno: cantidadResuelta,
              afectaSaldo: 'FISICO',
              documentoTipo: 'TRASLADO',
              documentoId: traslado.id,
              usuarioId: user.id,
              motivo: `Novedad resuelta: excedente incorporado a inventario #${traslado.id} - ${motivo}`,
            });
          }
        }

        // Crear registro de resolución
        await tx.resolucionNovedadTraslado.create({
          data: {
            trasladoId: traslado.id,
            lineaTrasladoId: linea.id,
            tipoResolucion,
            cantidadResuelta,
            motivo,
            responsable: responsable?.trim() ?? null,
            adminUsuarioId: user.id,
          },
        });

        // Actualizar línea de traslado
        await tx.lineaTraslado.update({
          where: { id: linea.id },
          data: {
            unidadesFaltantesPendientes: linea.unidadesFaltantesPendientes,
            excedentePendienteResolver: linea.excedentePendienteResolver,
          },
        });
      }

      // Invariante 4 (RNF-003): Orden canónico anti-deadlock por varianteId ASC
      if (movimientos.length > 0) {
        await InventoryLedgerService.registrarMovimientosBatch(tx, movimientos);
      }

      // Evaluar si todas las líneas han sido resueltas al 100%
      const totalPendientesFaltantes = Array.from(lineasMap.values()).reduce(
        (acc, l) => acc + l.unidadesFaltantesPendientes,
        0
      );
      const totalPendientesExcedentes = Array.from(lineasMap.values()).reduce(
        (acc, l) => acc + l.excedentePendienteResolver,
        0
      );

      const todasResueltas = totalPendientesFaltantes === 0 && totalPendientesExcedentes === 0;

      const trasladoActualizado = await tx.traslado.update({
        where: { id, version: traslado.version },
        data: {
          estado: todasResueltas ? 'CERRADO' : 'RECIBIDO_CON_NOVEDAD',
          fechaCierre: todasResueltas ? new Date() : null,
          version: { increment: 1 },
        },
        include: {
          lineas: {
            include: {
              variante: {
                include: {
                  producto: { select: { id: true, nombre: true, categoria: true } },
                },
              },
            },
          },
          resolucionesNovedad: true,
          ubicacionOrigen: true,
          ubicacionDestino: true,
        },
      });

      // Auditoría
      await tx.registroAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: todasResueltas ? 'CERRAR_NOVEDAD_TRASLADO' : 'RESOLVER_NOVEDAD_PARCIAL',
          entidadTipo: 'Traslado',
          entidadId: String(id),
          datosMinimos: {
            trasladoId: id,
            todasResueltas,
            estadoFinal: trasladoActualizado.estado,
          },
        },
      });

      return trasladoActualizado;
    });
  }

  /**
   * Obtener detalle completo de un traslado por ID con verificación de aislamiento de sede (RN-ROL-03, RN-ROL-05).
   */
  static async obtenerPorId(id: number, user: UserAuthSnapshot) {
    const traslado = await prisma.traslado.findUnique({
      where: { id },
      include: {
        lineas: {
          include: {
            variante: {
              include: {
                producto: {
                  select: { id: true, nombre: true, categoria: true },
                },
              },
            },
          },
        },
        ubicacionOrigen: true,
        ubicacionDestino: true,
        creadoPor: {
          select: { id: true, nombreCompleto: true, correo: true },
        },
      },
    });

    if (!traslado) {
      throw AppError.notFound(`Traslado con id ${id} no encontrado`);
    }

    // Aislamiento de sede para vendedores sin permiso multisede
    if (user.rol !== 'ADMIN' && !user.permisos.permVerOtrosPuntos) {
      if (!user.ubicacionId) {
        throw AppError.forbidden('Usuario sin punto de venta asignado no puede consultar traslados');
      }
      if (
        user.ubicacionId !== traslado.ubicacionOrigenId &&
        user.ubicacionId !== traslado.ubicacionDestinoId
      ) {
        throw AppError.forbidden('No tiene permiso para consultar traslados de otras sedes');
      }
    }

    return traslado;
  }

  /**
   * Listar traslados con filtros y aislamiento por sede para vendedores.
   */
  static async listar(filtros: ListarTrasladosQuery, user: UserAuthSnapshot) {
    const where: Prisma.TrasladoWhereInput = {};

    if (filtros.ubicacionOrigenId) {
      where.ubicacionOrigenId = filtros.ubicacionOrigenId;
    }

    if (filtros.ubicacionDestinoId) {
      where.ubicacionDestinoId = filtros.ubicacionDestinoId;
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.esEnvioDirecto !== undefined) {
      where.esEnvioDirecto = filtros.esEnvioDirecto;
    }

    // Aislamiento de sede para vendedores sin permVerOtrosPuntos
    if (user.rol !== 'ADMIN' && !user.permisos.permVerOtrosPuntos) {
      if (!user.ubicacionId) {
        throw AppError.forbidden('Usuario sin punto de venta asignado no puede consultar traslados');
      }
      where.OR = [
        { ubicacionOrigenId: user.ubicacionId },
        { ubicacionDestinoId: user.ubicacionId },
      ];
    }

    return prisma.traslado.findMany({
      where,
      include: {
        lineas: {
          include: {
            variante: {
              include: {
                producto: {
                  select: { id: true, nombre: true, categoria: true },
                },
              },
            },
          },
        },
        ubicacionOrigen: true,
        ubicacionDestino: true,
        creadoPor: {
          select: { id: true, nombreCompleto: true, correo: true },
        },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });
  }
}
