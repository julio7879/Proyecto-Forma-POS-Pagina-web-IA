import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { ColombiaTime } from '../../shared/domain/ColombiaTime.js';
import type {
  AperturaCajaInput,
  CierreCajaInput,
  ListarSesionesQuery,
  MovimientoCajaInput,
  RelevoTurnoCajaInput,
} from './caja.schema.js';

export interface DesgloseEfectivoCaja {
  baseContadaCop: number;
  ventasEfectivoCop: number;
  reembolsosEfectivoCop: number;
  sangriasRetirosCop: number;
  gastosMenoresCop: number;
  ingresosManualesCop: number;
  efectivoEsperadoCop: number;
}

export class CajaService {
  /**
   * Calcula el desglose matemático integral del efectivo esperado en una sesión de caja (RN-CAJ-06, CA-15, CA-55, QA-008).
   * La fórmula parte estrictamente de la baseContadaCop real de apertura del día:
   * esperado = baseContada + ventasEfectivo - reembolsosEfectivo - sangrias - gastosMenores + ingresosManuales
   */
  static async calcularDesgloseEfectivo(
    sesionId: number,
    baseContadaCop: number,
    db: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<DesgloseEfectivoCaja> {
    // 1. Ventas en EFECTIVO de la sesión (solo ventas COMPLETADAS)
    const pagosVentasEfectivo = await db.pagoVentaPOS.findMany({
      where: {
        metodo: 'EFECTIVO',
        venta: {
          sesionCajaId: sesionId,
          estado: 'COMPLETADA',
        },
      },
      select: { montoCop: true },
    });
    const ventasEfectivoCop = pagosVentasEfectivo.reduce((acc, p) => acc + p.montoCop, 0);

    // 2. Reembolsos en EFECTIVO de la sesión (RN-DEV-02, CA-15)
    const devolucionesEfectivo = await db.devolucionPOS.findMany({
      where: {
        sesionCajaId: sesionId,
        medioReembolso: 'EFECTIVO',
      },
      select: { totalReembolsadoCop: true },
    });
    const reembolsosEfectivoCop = devolucionesEfectivo.reduce((acc, d) => acc + d.totalReembolsadoCop, 0);

    // 3. Movimientos de caja: sangrías, gastos menores e ingresos manuales (RN-CAJ-07)
    const movimientos = await db.movimientoCaja.findMany({
      where: { sesionCajaId: sesionId },
      select: { tipo: true, montoCop: true },
    });

    let sangriasRetirosCop = 0;
    let gastosMenoresCop = 0;
    let ingresosManualesCop = 0;

    for (const mov of movimientos) {
      if (mov.tipo === 'SANGRIA_RETIRO') sangriasRetirosCop += mov.montoCop;
      else if (mov.tipo === 'GASTO_MENOR') gastosMenoresCop += mov.montoCop;
      else if (mov.tipo === 'INGRESO_MANUAL') ingresosManualesCop += mov.montoCop;
    }

    const efectivoEsperadoCop =
      baseContadaCop +
      ventasEfectivoCop -
      reembolsosEfectivoCop -
      sangriasRetirosCop -
      gastosMenoresCop +
      ingresosManualesCop;

    return {
      baseContadaCop,
      ventasEfectivoCop,
      reembolsosEfectivoCop,
      sangriasRetirosCop,
      gastosMenoresCop,
      ingresosManualesCop,
      efectivoEsperadoCop,
    };
  }

  /**
   * Helper transaccional público: verifica que exista una sesión de caja ABIERTA y VIGENTE en la sede (RN-VTA-01, RN-CAJ-05, CA-56).
   */
  static async validarSesionVigenteParaOperacion(
    ubicacionId: number,
    db: Prisma.TransactionClient | typeof prisma = prisma
  ) {
    const sesion = await db.sesionCaja.findFirst({
      where: {
        ubicacionId,
        estado: 'ABIERTA',
      },
      orderBy: { id: 'desc' },
    });

    if (!sesion) {
      throw AppError.conflict(
        'No hay una sesión de caja ABIERTA en este punto de venta. Debe abrir caja antes de operar (RN-VTA-01).'
      );
    }

    if (!ColombiaTime.esSesionDelDiaActual(sesion.fechaNegocioColombia)) {
      throw AppError.conflict(
        `La sesión de caja #${sesion.id} está vencida (abierta el día ${sesion.fechaNegocioColombia}). Debe realizar el arqueo de cierre antes de continuar (RN-CAJ-05, CA-56, QA-009).`
      );
    }

    return sesion;
  }

  /**
   * RF-CAJ-01 / RN-CAJ-01 a 04: Apertura de sesión con base contada.
   */
  static async abrir(usuarioId: number, data: AperturaCajaInput) {
    return prisma.$transaction(async (tx) => {
      const ubicacion = await tx.ubicacion.findUnique({
        where: { id: data.ubicacionId },
      });
      if (!ubicacion || !ubicacion.activa) {
        throw AppError.notFound('Ubicación inexistente o inactiva');
      }

      // RN-CAJ-01: solo una sesión ABIERTA a la vez por punto
      const sesionAbierta = await tx.sesionCaja.findFirst({
        where: {
          ubicacionId: data.ubicacionId,
          estado: 'ABIERTA',
        },
      });
      if (sesionAbierta) {
        throw AppError.conflict(
          `Ya existe la sesión de caja ABIERTA #${sesionAbierta.id} en este punto de venta. Debe cerrarse antes de abrir una nueva (RN-CAJ-01, QA-007).`
        );
      }

      const baseConfiguradaCop = ubicacion.baseCajaCop;

      // RN-CAJ-02: si la base contada difiere de la base configurada ($200.000 COP), exige observación
      if (data.baseContadaCop !== baseConfiguradaCop && !data.observacionApertura) {
        throw AppError.badRequest(
          `La base contada ($${data.baseContadaCop.toLocaleString('es-CO')} COP) difiere de la base configurada ($${baseConfiguradaCop.toLocaleString('es-CO')} COP). Debe ingresar una observación justificando la diferencia (RN-CAJ-02).`
        );
      }

      const fechaNegocioColombia = ColombiaTime.toFechaNegocioColombia();

      const sesion = await tx.sesionCaja.create({
        data: {
          ubicacionId: data.ubicacionId,
          estado: 'ABIERTA',
          fechaNegocioColombia,
          abiertaPorId: usuarioId,
          baseConfiguradaCop,
          baseContadaCop: data.baseContadaCop,
          observacionApertura: data.observacionApertura ?? null,
        },
      });

      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'APERTURA_CAJA',
          entidadTipo: 'SesionCaja',
          entidadId: String(sesion.id),
          datosMinimos: {
            sesionId: sesion.id,
            ubicacionId: sesion.ubicacionId,
            fechaNegocioColombia: sesion.fechaNegocioColombia,
            baseContadaCop: sesion.baseContadaCop,
            baseConfiguradaCop: sesion.baseConfiguradaCop,
          },
        },
      });

      return sesion;
    });
  }

  /**
   * RF-CAJ-02 / RN-CAJ-07: Registro de sangrías, gastos menores e ingresos de menudo.
   */
  static async registrarMovimiento(usuarioId: number, data: MovimientoCajaInput) {
    return prisma.$transaction(async (tx) => {
      const sesion = await tx.sesionCaja.findUnique({
        where: { id: data.sesionCajaId },
      });
      if (!sesion) {
        throw AppError.notFound('Sesión de caja no encontrada');
      }
      if (sesion.estado !== 'ABIERTA') {
        throw AppError.unprocessable('Solo se pueden registrar movimientos en sesiones de caja ABIERTAS');
      }

      // RN-CAJ-05 / CA-56: bloquea si está vencida
      if (!ColombiaTime.esSesionDelDiaActual(sesion.fechaNegocioColombia)) {
        throw AppError.conflict(
          `La sesión de caja #${sesion.id} está vencida (abierta el día ${sesion.fechaNegocioColombia}). Solo se permite ejecutar su arqueo de cierre (RN-CAJ-05, CA-56, QA-009).`
        );
      }

      // Validar liquidez antes de sangría o gasto
      const desglose = await this.calcularDesgloseEfectivo(sesion.id, sesion.baseContadaCop, tx);
      if (
        (data.tipo === 'SANGRIA_RETIRO' || data.tipo === 'GASTO_MENOR') &&
        data.montoCop > desglose.efectivoEsperadoCop
      ) {
        throw AppError.badRequest(
          `El monto del movimiento ($${data.montoCop.toLocaleString('es-CO')} COP) supera el efectivo actual disponible en caja ($${desglose.efectivoEsperadoCop.toLocaleString('es-CO')} COP).`
        );
      }

      const movimiento = await tx.movimientoCaja.create({
        data: {
          sesionCajaId: data.sesionCajaId,
          usuarioId,
          tipo: data.tipo,
          montoCop: data.montoCop,
          concepto: data.concepto,
          comprobanteSoporte: data.comprobanteSoporte ?? null,
        },
      });

      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'MOVIMIENTO_CAJA',
          entidadTipo: 'MovimientoCaja',
          entidadId: String(movimiento.id),
          datosMinimos: {
            movimientoId: movimiento.id,
            sesionCajaId: sesion.id,
            tipo: movimiento.tipo,
            montoCop: movimiento.montoCop,
          },
        },
      });

      return movimiento;
    });
  }

  /**
   * RF-CAJ-02 / RN-CAJ-13: Relevo de Turno / Corte X dentro de la misma sesión.
   */
  static async relevoTurno(usuarioId: number, data: RelevoTurnoCajaInput) {
    return prisma.$transaction(async (tx) => {
      const sesion = await tx.sesionCaja.findUnique({
        where: { id: data.sesionCajaId },
      });
      if (!sesion) {
        throw AppError.notFound('Sesión de caja no encontrada');
      }
      if (sesion.estado !== 'ABIERTA') {
        throw AppError.unprocessable('Solo se pueden realizar relevos de turno en sesiones ABIERTAS');
      }
      if (!ColombiaTime.esSesionDelDiaActual(sesion.fechaNegocioColombia)) {
        throw AppError.conflict('Sesión de caja vencida. Solo se permite su arqueo de cierre (CA-56).');
      }

      const entrante = await tx.usuario.findUnique({
        where: { id: data.cajeroEntranteId },
      });
      if (!entrante || !entrante.activo) {
        throw AppError.badRequest('El cajero entrante especificado no existe o está inactivo');
      }

      const desglose = await this.calcularDesgloseEfectivo(sesion.id, sesion.baseContadaCop, tx);
      const efectivoEsperado = desglose.efectivoEsperadoCop;
      const diferenciaCop = data.efectivoContadoCop - efectivoEsperado;

      const relevo = await tx.relevoTurnoCaja.create({
        data: {
          sesionCajaId: sesion.id,
          cajeroSalienteId: usuarioId,
          cajeroEntranteId: data.cajeroEntranteId,
          efectivoContadoCop: data.efectivoContadoCop,
          efectivoEsperadoHastaCorteCop: efectivoEsperado,
          diferenciaCop,
          observacion: data.observacion ?? null,
        },
        include: {
          cajeroSaliente: { select: { id: true, nombreCompleto: true } },
          cajeroEntrante: { select: { id: true, nombreCompleto: true } },
        },
      });

      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'RELEVO_TURNO_CAJA',
          entidadTipo: 'RelevoTurnoCaja',
          entidadId: String(relevo.id),
          datosMinimos: {
            relevoId: relevo.id,
            sesionCajaId: sesion.id,
            cajeroSalienteId: usuarioId,
            cajeroEntranteId: data.cajeroEntranteId,
            efectivoContadoCop: data.efectivoContadoCop,
            diferenciaCop,
          },
        },
      });

      return relevo;
    });
  }

  /**
   * RF-CAJ-03 / RN-CAJ-06 a 10 / CA-15, CA-55, QA-008: Cierre ciego inmutable de caja con fórmula integral.
   */
  static async cerrar(usuarioId: number, data: CierreCajaInput) {
    return prisma.$transaction(async (tx) => {
      const sesion = await tx.sesionCaja.findUnique({
        where: { id: data.sesionCajaId },
      });
      if (!sesion) {
        throw AppError.notFound('Sesión de caja no encontrada');
      }
      if (sesion.estado !== 'ABIERTA') {
        throw AppError.unprocessable('Solo se pueden cerrar sesiones de caja en estado ABIERTA');
      }

      // Cálculo integral oficial (CA-15, CA-55)
      const desglose = await this.calcularDesgloseEfectivo(sesion.id, sesion.baseContadaCop, tx);
      const efectivoEsperado = desglose.efectivoEsperadoCop;
      const diferencia = data.efectivoContadoCierreCop - efectivoEsperado;

      // RN-CAJ-10: efectivo a entregar = max(0, contado - baseConfiguradaCop)
      const efectivoAEntregar = Math.max(0, data.efectivoContadoCierreCop - sesion.baseConfiguradaCop);

      const sesionCerrada = await tx.sesionCaja.update({
        where: { id: sesion.id },
        data: {
          estado: 'CERRADA',
          cerradaPorId: usuarioId,
          fechaCierre: new Date(),
          efectivoEsperadoCierreCop: efectivoEsperado,
          efectivoContadoCierreCop: data.efectivoContadoCierreCop,
          diferenciaCierreCop: diferencia,
          efectivoAEntregarCop: efectivoAEntregar,
          observacionCierre: data.observacionCierre ?? null,
          version: { increment: 1 },
        },
      });

      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'CIERRE_CAJA',
          entidadTipo: 'SesionCaja',
          entidadId: String(sesion.id),
          datosMinimos: {
            sesionId: sesion.id,
            efectivoEsperado,
            efectivoContado: data.efectivoContadoCierreCop,
            diferencia,
            efectivoAEntregar,
          },
        },
      });

      return {
        ...sesionCerrada,
        desglose,
      };
    });
  }

  /**
   * Consulta la sesión activa del punto de venta con su efectivo esperado en vivo y estado de vigencia.
   */
  static async obtenerSesionActiva(ubicacionId: number) {
    const sesion = await prisma.sesionCaja.findFirst({
      where: {
        ubicacionId,
        estado: 'ABIERTA',
      },
      orderBy: { id: 'desc' },
      include: {
        ubicacion: { select: { id: true, nombre: true, baseCajaCop: true } },
        movimientosCaja: {
          orderBy: { fechaHora: 'desc' },
          include: { usuario: { select: { id: true, nombreCompleto: true } } },
        },
        relevosTurno: {
          orderBy: { fechaHora: 'desc' },
          include: {
            cajeroSaliente: { select: { id: true, nombreCompleto: true } },
            cajeroEntrante: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
    });

    if (!sesion) return null;

    const desglose = await this.calcularDesgloseEfectivo(sesion.id, sesion.baseContadaCop, prisma);
    const esVigente = ColombiaTime.esSesionDelDiaActual(sesion.fechaNegocioColombia);

    return {
      ...sesion,
      desglose,
      esVigente,
    };
  }

  /**
   * Listar sesiones históricas de caja con filtros.
   */
  static async listar(filtros: ListarSesionesQuery) {
    const where: Prisma.SesionCajaWhereInput = {};
    if (filtros.ubicacionId) where.ubicacionId = filtros.ubicacionId;
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.fecha) where.fechaNegocioColombia = filtros.fecha;

    return prisma.sesionCaja.findMany({
      where,
      orderBy: { fechaApertura: 'desc' },
      include: {
        ubicacion: { select: { id: true, nombre: true } },
      },
    });
  }

  static async obtenerPorId(id: number) {
    const sesion = await prisma.sesionCaja.findUnique({
      where: { id },
      include: {
        ubicacion: true,
        movimientosCaja: {
          include: { usuario: { select: { id: true, nombreCompleto: true } } },
        },
        relevosTurno: {
          include: {
            cajeroSaliente: { select: { id: true, nombreCompleto: true } },
            cajeroEntrante: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
    });

    if (!sesion) throw AppError.notFound('Sesión de caja no encontrada');
    const desglose = await this.calcularDesgloseEfectivo(sesion.id, sesion.baseContadaCop, prisma);
    return { ...sesion, desglose };
  }
}
