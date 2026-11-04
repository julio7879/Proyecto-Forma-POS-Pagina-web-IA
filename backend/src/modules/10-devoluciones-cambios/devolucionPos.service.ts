import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { ColombiaTime } from '../../shared/domain/ColombiaTime.js';
import { InventoryLedgerService } from '../04-inventario/InventoryLedgerService.js';
import { CajaService } from '../07-caja/caja.service.js';
import type {
  AnularVentaPosInput,
  ListarDevolucionesQuery,
  RegistrarCambioPosInput,
  RegistrarDevolucionPosInput,
} from './devolucionPos.schema.js';

export class DevolucionPosService {
  /**
   * RF-DEV-01 / RN-DEV-01 a 10 / CA-26, CA-27, CA-31, CA-54, CA-63, QA-019:
   * Registro de devolución en mostrador con anclaje a la venta raíz, liquidación neta prorrateada,
   * cuarentena de no vendibles y excepción de iliquidez en caja.
   */
  static async registrarDevolucion(
    usuarioId: number,
    data: RegistrarDevolucionPosInput,
    idempotencyKey?: string,
    esAdmin = false
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Cargar la venta original con sus líneas, pagos y devoluciones previas
      const ventaOriginal = await tx.ventaPOS.findUnique({
        where: { id: data.ventaOriginalId },
        include: {
          lineas: true,
          pagos: true,
          devoluciones: { include: { lineas: true } },
        },
      });

      if (!ventaOriginal) {
        throw AppError.notFound('Venta original no encontrada');
      }

      if (ventaOriginal.estado !== 'COMPLETADA') {
        throw AppError.unprocessable(`No se pueden procesar devoluciones sobre una venta en estado ${ventaOriginal.estado}`);
      }

      // 2. RN-DEV-01 / CA-29: La devolución debe realizarse en el MISMO punto de venta donde se emitió la compra
      const sesion = await CajaService.validarSesionVigenteParaOperacion(ventaOriginal.ubicacionId, tx);

      // 3. RN-DEV-03 / CA-63 / CA-27: Plazo de 5 días calendario anclado estrictamente a la venta raíz
      const fechaRaiz = ventaOriginal.fechaVentaRaiz ?? ventaOriginal.fechaHora;
      const dentroPlazo = ColombiaTime.estaDentroDePlazoCalendarioPOS(fechaRaiz, 5);

      if (!dentroPlazo && !data.autorizadoFueraPlazoPorId && !esAdmin) {
        throw AppError.forbidden(
          'El plazo de 5 días calendario desde la venta raíz original ha vencido (RN-DEV-03, CA-27, CA-63). Requiere sobreescritura con PIN o autorización expresa de Administrador.'
        );
      }

      // 4. Calcular el monto a reembolsar línea por línea sobre el precio neto prorrateado (RN-DEV-06, CA-26)
      const lineasVentaMap = new Map(ventaOriginal.lineas.map((l) => [l.id, l]));
      let totalReembolsadoCop = 0;

      const lineasDevolucionCalculadas = data.lineas.map((lDev) => {
        const lineaVenta = lineasVentaMap.get(lDev.lineaVentaOriginalId);
        if (!lineaVenta) {
          throw AppError.badRequest(`La línea de venta #${lDev.lineaVentaOriginalId} no pertenece a la venta #${ventaOriginal.id}`);
        }
        if (lineaVenta.varianteId !== lDev.varianteId) {
          throw AppError.badRequest(`La variante #${lDev.varianteId} no coincide con la registrada en la línea de venta #${lineaVenta.id}`);
        }

        const saldoDisponibleDevolucion = lineaVenta.cantidadVendida - lineaVenta.cantidadDevueltaAcum;
        if (lDev.cantidadDevuelta > saldoDisponibleDevolucion) {
          throw AppError.badRequest(
            `La cantidad a devolver (${lDev.cantidadDevuelta}) supera el saldo disponible para devolución (${saldoDisponibleDevolucion}) en la prenda ${lineaVenta.nombreProductoSnapshot}.`
          );
        }

        // Neto prorrateado unitario (RN-DEV-06, CA-26)
        const netoUnitario = Math.floor(lineaVenta.netoPagadoLineaCop / lineaVenta.cantidadVendida);
        const montoReembolsadoLineaCop = netoUnitario * lDev.cantidadDevuelta;
        totalReembolsadoCop += montoReembolsadoLineaCop;

        return {
          lDev,
          lineaVenta,
          montoReembolsadoLineaCop,
        };
      });

      // 5. Excepción por Iliquidez en Caja (RN-DEV-02, CA-54, QA-019)
      const desgloseCaja = await CajaService.calcularDesgloseEfectivo(sesion.id, sesion.baseContadaCop, tx);
      let medioReembolsoFinal = data.medioReembolso;
      let esExcepcionIliquidez = data.esExcepcionIliquidezCaja;

      if (data.medioReembolso === 'EFECTIVO' && totalReembolsadoCop > desgloseCaja.efectivoEsperadoCop) {
        if (!data.esExcepcionIliquidezCaja) {
          throw AppError.badRequest(
            `El monto a devolver ($${totalReembolsadoCop.toLocaleString('es-CO')} COP) supera el efectivo actual en caja ($${desgloseCaja.efectivoEsperadoCop.toLocaleString('es-CO')} COP). Debe tramitarse como excepción por iliquidez reembolsando por TRANSFERENCIA (CA-54, QA-019).`
          );
        }
        medioReembolsoFinal = 'TRANSFERENCIA';
        esExcepcionIliquidez = true;
      }

      // 6. Retorno físico al Kardex (RN-DEV-09, CA-31, RNF-003: Orden canónico varianteId ASC)
      const lineasOrdenadas = [...lineasDevolucionCalculadas].sort(
        (a, b) => a.lDev.varianteId - b.lDev.varianteId
      );

      for (const { lDev, lineaVenta, montoReembolsadoLineaCop } of lineasOrdenadas) {
        // Cosméticos, ropa interior y aretes entran SIEMPRE a noVendible (CA-31)
        const vaANoVendible = !lineaVenta.esReintegrableSnapshot || lDev.condicionFisica === 'NO_VENDIBLE';
        const tipoKardex = vaANoVendible ? 'DEVOLUCION_POS_NO_VENDIBLE' : 'DEVOLUCION_POS_VENDIBLE';
        const afectaSaldo = vaANoVendible ? 'NO_VENDIBLE' : 'FISICO';

        await InventoryLedgerService.registrarMovimiento(tx, {
          tipo: tipoKardex,
          ubicacionId: ventaOriginal.ubicacionId,
          varianteId: lDev.varianteId,
          cantidadConSigno: lDev.cantidadDevuelta,
          afectaSaldo,
          documentoTipo: 'DEVOLUCION_POS',
          documentoId: 0,
          usuarioId,
          motivo: `Devolución POS sobre venta #${ventaOriginal.numeroComprobante}`,
        });

        // Actualizar acumulados de devolución en la línea original
        await tx.lineaVentaPOS.update({
          where: { id: lineaVenta.id },
          data: {
            cantidadDevueltaAcum: { increment: lDev.cantidadDevuelta },
            reembolsadoAcumuladoCop: { increment: montoReembolsadoLineaCop },
          },
        });
      }

      // 7. Consecutivo Diferido por Ubicación (RN-DEV-13)
      const consecutivo = await tx.consecutivoUbicacion.upsert({
        where: {
          ubicacionId_tipoDocumento: {
            ubicacionId: ventaOriginal.ubicacionId,
            tipoDocumento: 'DEVOLUCION_POS',
          },
        },
        update: { ultimoNumero: { increment: 1 } },
        create: {
          ubicacionId: ventaOriginal.ubicacionId,
          tipoDocumento: 'DEVOLUCION_POS',
          ultimoNumero: 1,
        },
      });
      const numeroComprobante = consecutivo.ultimoNumero;

      const fechaHora = new Date();
      const fechaNegocioColombia = ColombiaTime.toFechaNegocioColombia(fechaHora);
      const mesNegocioColombia = ColombiaTime.toMesNegocioColombia(fechaHora);

      // 8. Crear registro DevolucionPOS con sus líneas
      const devolucion = await tx.devolucionPOS.create({
        data: {
          numeroComprobante,
          ventaOriginalId: ventaOriginal.id,
          ubicacionId: ventaOriginal.ubicacionId,
          sesionCajaId: sesion.id,
          procesadoPorId: usuarioId,
          autorizadoFueraPlazoPorId: data.autorizadoFueraPlazoPorId ?? (esAdmin && !dentroPlazo ? usuarioId : null),
          motivoFueraPlazo: data.motivoFueraPlazo ?? (!dentroPlazo ? 'Autorización de Administrador fuera de plazo' : null),
          esParteDeCambio: false,
          fechaHora,
          fechaNegocioColombia,
          mesNegocioColombia,
          totalReembolsadoCop,
          medioReembolso: medioReembolsoFinal,
          esExcepcionIliquidezCaja: esExcepcionIliquidez,
          referenciaReembolsoTransf: data.referenciaReembolsoTransf ?? null,
          observacion: data.observacion ?? null,
          lineas: {
            create: lineasDevolucionCalculadas.map(({ lDev, montoReembolsadoLineaCop }) => ({
              lineaVentaOriginal: { connect: { id: lDev.lineaVentaOriginalId } },
              variante: { connect: { id: lDev.varianteId } },
              cantidadDevuelta: lDev.cantidadDevuelta,
              condicionFisica: lDev.condicionFisica,
              montoReembolsadoCop: montoReembolsadoLineaCop,
            })),
          },
        },
        include: {
          lineas: true,
          ventaOriginal: { select: { id: true, numeroComprobante: true } },
          procesadoPor: { select: { id: true, nombreCompleto: true } },
        },
      });

      // 9. Registro de auditoría
      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'DEVOLUCION_POS_REGISTRADA',
          entidadTipo: 'DevolucionPOS',
          entidadId: String(devolucion.id),
          datosMinimos: {
            devolucionId: devolucion.id,
            numeroComprobante: devolucion.numeroComprobante,
            ventaOriginalId: ventaOriginal.id,
            totalReembolsadoCop,
            medioReembolso: medioReembolsoFinal,
            esExcepcionIliquidez,
          },
        },
      });

      // 10. Persistencia de Idempotencia Atómica (RN-GEN-08)
      if (idempotencyKey) {
        const snapshot = JSON.parse(JSON.stringify({ ok: true, datos: devolucion })) as Prisma.InputJsonValue;
        await tx.registroIdempotencia.create({
          data: {
            idempotencyKey,
            usuarioId,
            endpoint: '/api/devoluciones',
            statusCode: 201,
            responseBody: snapshot,
          },
        });
      }

      return devolucion;
    });
  }

  /**
   * RF-DEV-03 / RN-DEV-11 / CA-30, CA-63, QA-017, QA-018:
   * Operación atómica de Cambio en mostrador POS (Devolución + Venta enlazadas en una transacción).
   * Caso A: Mismo producto (talla/color distinto) conserva precio neto: diferencia $0 COP (QA-017).
   * Caso B: Prenda distinta a precio de lista vigente (QA-018).
   * No renueva los 5 días de garantía (CA-63).
   */
  static async registrarCambio(
    usuarioId: number,
    data: RegistrarCambioPosInput,
    idempotencyKey?: string,
    esAdmin = false
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Validar la venta original y sesión de caja
      const ventaOriginal = await tx.ventaPOS.findUnique({
        where: { id: data.ventaOriginalId },
        include: {
          lineas: true,
          pagos: true,
          devoluciones: { include: { lineas: true } },
        },
      });

      if (!ventaOriginal) throw AppError.notFound('Venta original no encontrada');
      if (ventaOriginal.estado !== 'COMPLETADA') {
        throw AppError.unprocessable('Solo se pueden procesar cambios sobre ventas COMPLETADAS');
      }

      const sesion = await CajaService.validarSesionVigenteParaOperacion(ventaOriginal.ubicacionId, tx);

      // Plazo de garantía anclado a la venta raíz original (CA-63)
      const fechaRaiz = ventaOriginal.fechaVentaRaiz ?? ventaOriginal.fechaHora;
      const dentroPlazo = ColombiaTime.estaDentroDePlazoCalendarioPOS(fechaRaiz, 5);
      if (!dentroPlazo && !data.autorizadoFueraPlazoPorId && !esAdmin) {
        throw AppError.forbidden(
          'El plazo legal de 5 días calendario desde la venta raíz original ha vencido (RN-DEV-03, CA-63). Requiere sobreescritura de Administrador.'
        );
      }

      // 2. Liquidación de la devolución de prendas viejas
      const lineasVentaMap = new Map(ventaOriginal.lineas.map((l) => [l.id, l]));
      let totalReembolsadoCop = 0;

      const lineasDevueltasCalc = data.lineasDevueltas.map((lDev) => {
        const lv = lineasVentaMap.get(lDev.lineaVentaOriginalId);
        if (!lv) throw AppError.badRequest(`Línea #${lDev.lineaVentaOriginalId} no pertenece a la venta`);
        const disponibleDev = lv.cantidadVendida - lv.cantidadDevueltaAcum;
        if (lDev.cantidadDevuelta > disponibleDev) {
          throw AppError.badRequest(`Cantidad a devolver supera saldo disponible en ${lv.nombreProductoSnapshot}`);
        }
        const netoUnitario = Math.floor(lv.netoPagadoLineaCop / lv.cantidadVendida);
        const montoReembolsadoLineaCop = netoUnitario * lDev.cantidadDevuelta;
        totalReembolsadoCop += montoReembolsadoLineaCop;

        return { lDev, lv, montoReembolsadoLineaCop };
      });

      // Retorno físico a Kardex de las prendas devueltas
      const lineasDevueltasOrdenadas = [...lineasDevueltasCalc].sort(
        (a, b) => a.lDev.varianteId - b.lDev.varianteId
      );

      for (const { lDev, lv, montoReembolsadoLineaCop } of lineasDevueltasOrdenadas) {
        const vaANoVendible = !lv.esReintegrableSnapshot || lDev.condicionFisica === 'NO_VENDIBLE';
        const tipoKardex = vaANoVendible ? 'DEVOLUCION_POS_NO_VENDIBLE' : 'DEVOLUCION_POS_VENDIBLE';
        const afectaSaldo = vaANoVendible ? 'NO_VENDIBLE' : 'FISICO';

        await InventoryLedgerService.registrarMovimiento(tx, {
          tipo: tipoKardex,
          ubicacionId: ventaOriginal.ubicacionId,
          varianteId: lDev.varianteId,
          cantidadConSigno: lDev.cantidadDevuelta,
          afectaSaldo,
          documentoTipo: 'DEVOLUCION_POS',
          documentoId: 0,
          usuarioId,
          motivo: `Devolución por Cambio en venta #${ventaOriginal.numeroComprobante}`,
        });

        await tx.lineaVentaPOS.update({
          where: { id: lv.id },
          data: {
            cantidadDevueltaAcum: { increment: lDev.cantidadDevuelta },
            reembolsadoAcumuladoCop: { increment: montoReembolsadoLineaCop },
          },
        });
      }

      // 3. Cargar variantes de las prendas nuevas
      const nuevasVarianteIds = data.lineasNuevas.map((l) => l.varianteId);
      const nuevasVariantesDb = await tx.variante.findMany({
        where: { id: { in: nuevasVarianteIds } },
        include: {
          producto: { include: { categoria: true } },
        },
      });

      const nuevasVariantesMap = new Map(nuevasVariantesDb.map((v) => [v.id, v]));

      // 4. Determinar si aplica Caso A (mismo producto, talla/color distinto -> diferencia $0 COP, QA-017)
      // o Caso B (producto distinto -> precio lista vigente, QA-018)
      let totalNuevaVentaCop = 0;
      const lineasNuevasDetalle = data.lineasNuevas.map((ln) => {
        const vNueva = nuevasVariantesMap.get(ln.varianteId);
        if (!vNueva) throw AppError.badRequest(`Variante #${ln.varianteId} inexistente`);

        // Comprobar si coincide productoId con alguna de las prendas devueltas
        const coincideProductoDevuelto = lineasDevueltasCalc.find(
          (d) => d.lv.productoIdSnapshot === vNueva.productoId
        );

        let precioFinalUnitarioCop: number;
        let descuentoProrrateadoCop = 0;

        if (coincideProductoDevuelto && ln.cantidad === coincideProductoDevuelto.lDev.cantidadDevuelta) {
          // QA-017: Mismo producto conserva el precio neto pagado por la prenda devuelta -> diferencia $0 COP
          const netoOriginalUnitario = Math.floor(
            coincideProductoDevuelto.lv.netoPagadoLineaCop / coincideProductoDevuelto.lv.cantidadVendida
          );
          precioFinalUnitarioCop = netoOriginalUnitario;
          descuentoProrrateadoCop = Math.max(0, vNueva.precioVentaCop - precioFinalUnitarioCop);
        } else {
          // QA-018: Producto distinto o cantidad distinta factura a precio de lista vigente
          precioFinalUnitarioCop = vNueva.precioVentaCop;
        }

        const netoPagadoLineaCop = precioFinalUnitarioCop * ln.cantidad;
        totalNuevaVentaCop += netoPagadoLineaCop;

        return {
          ln,
          vNueva,
          precioListaUnitarioCop: vNueva.precioVentaCop,
          subtotalListaLineaCop: vNueva.precioVentaCop * ln.cantidad,
          descuentoProrrateadoCop,
          netoPagadoLineaCop,
        };
      });

      // 5. Comparar totalNuevaVentaCop vs totalReembolsadoCop
      const diferenciaLiquidacionCop = totalNuevaVentaCop - totalReembolsadoCop;

      if (diferenciaLiquidacionCop > 0) {
        // Cliente debe pagar el excedente
        const pagosExcedente = data.pagosExcedente ?? [];
        const totalPagadoExcedente = pagosExcedente.reduce((acc, p) => acc + p.montoCop, 0);
        if (totalPagadoExcedente < diferenciaLiquidacionCop) {
          throw AppError.badRequest(
            `El excedente a pagar es de $${diferenciaLiquidacionCop.toLocaleString('es-CO')} COP pero los pagos solo cubren $${totalPagadoExcedente.toLocaleString('es-CO')} COP.`
          );
        }
      }

      // 6. Descontar en Kardex las prendas nuevas (Orden canónico varianteId ASC - RNF-003)
      const nuevasOrdenadas = [...lineasNuevasDetalle].sort(
        (a, b) => a.ln.varianteId - b.ln.varianteId
      );

      for (const item of nuevasOrdenadas) {
        await tx.$queryRaw`
          SELECT id FROM "SaldoStock"
          WHERE "ubicacionId" = ${ventaOriginal.ubicacionId} AND "varianteId" = ${item.ln.varianteId}
          FOR UPDATE
        `;

        const saldo = await tx.saldoStock.findUnique({
          where: {
            ubicacionId_varianteId: {
              ubicacionId: ventaOriginal.ubicacionId,
              varianteId: item.ln.varianteId,
            },
          },
        });

        const fisico = saldo?.fisico ?? 0;
        const duro = saldo?.reservadoDuro ?? 0;
        if (fisico - duro < item.ln.cantidad) {
          throw AppError.conflict(
            `Stock insuficiente para entregar la nueva prenda #${item.ln.varianteId} en el cambio.`
          );
        }

        await InventoryLedgerService.registrarMovimiento(tx, {
          tipo: 'VENTA_POS',
          ubicacionId: ventaOriginal.ubicacionId,
          varianteId: item.ln.varianteId,
          cantidadConSigno: -item.ln.cantidad,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 0,
          usuarioId,
          motivo: `Entrega prenda por cambio atómico`,
        });
      }

      // 7. Consecutivos diferidos
      const consecDev = await tx.consecutivoUbicacion.upsert({
        where: { ubicacionId_tipoDocumento: { ubicacionId: ventaOriginal.ubicacionId, tipoDocumento: 'DEVOLUCION_POS' } },
        update: { ultimoNumero: { increment: 1 } },
        create: { ubicacionId: ventaOriginal.ubicacionId, tipoDocumento: 'DEVOLUCION_POS', ultimoNumero: 1 },
      });

      const consecVta = await tx.consecutivoUbicacion.upsert({
        where: { ubicacionId_tipoDocumento: { ubicacionId: ventaOriginal.ubicacionId, tipoDocumento: 'VENTA_POS' } },
        update: { ultimoNumero: { increment: 1 } },
        create: { ubicacionId: ventaOriginal.ubicacionId, tipoDocumento: 'VENTA_POS', ultimoNumero: 1 },
      });

      const fechaHora = new Date();
      const fechaNegocioColombia = ColombiaTime.toFechaNegocioColombia(fechaHora);
      const mesNegocioColombia = ColombiaTime.toMesNegocioColombia(fechaHora);

      // 8. Crear nueva VentaPOS por cambio (CA-63: no renueva plazo raíz)
      const nuevaVenta = await tx.ventaPOS.create({
        data: {
          numeroComprobante: consecVta.ultimoNumero,
          ubicacionId: ventaOriginal.ubicacionId,
          sesionCajaId: sesion.id,
          vendedorId: usuarioId,
          clienteNombreOpcional: ventaOriginal.clienteNombreOpcional,
          clienteDocumentoOpcional: ventaOriginal.clienteDocumentoOpcional,
          estado: 'COMPLETADA',
          fechaHora,
          fechaNegocioColombia,
          mesNegocioColombia,
          subtotalListaCop: lineasNuevasDetalle.reduce((acc, l) => acc + l.subtotalListaLineaCop, 0),
          descuentoTotalCop: lineasNuevasDetalle.reduce((acc, l) => acc + l.descuentoProrrateadoCop, 0),
          totalNetoProductosCop: totalNuevaVentaCop,
          esVentaDeCambio: true,
          ventaOrigenRaizId: ventaOriginal.ventaOrigenRaizId ?? ventaOriginal.id,
          fechaVentaRaiz: ventaOriginal.fechaVentaRaiz ?? ventaOriginal.fechaHora,
          lineas: {
            create: lineasNuevasDetalle.map(({ ln, vNueva, subtotalListaLineaCop, descuentoProrrateadoCop, netoPagadoLineaCop }) => ({
              varianteId: ln.varianteId,
              productoIdSnapshot: vNueva.productoId,
              nombreProductoSnapshot: vNueva.producto.nombre,
              skuSnapshot: vNueva.sku,
              tallaSnapshot: vNueva.talla,
              colorSnapshot: vNueva.color,
              esReintegrableSnapshot: vNueva.producto.reintegrableEnDevolucion,
              cantidadVendida: ln.cantidad,
              precioListaUnitarioCop: vNueva.precioVentaCop,
              subtotalListaLineaCop,
              descuentoProrrateadoCop,
              netoPagadoLineaCop,
            })),
          },
          pagos: {
            create: (data.pagosExcedente ?? []).map((p) => ({
              metodo: p.metodo,
              montoCop: p.montoCop,
              montoRecibidoEfectivoCop: p.montoRecibidoEfectivoCop ?? null,
              vueltoEfectivoCop: p.montoRecibidoEfectivoCop ? Math.max(0, p.montoRecibidoEfectivoCop - p.montoCop) : null,
              referenciaTransferencia: p.referenciaTransferencia ?? null,
            })),
          },
        },
      });

      // 9. Crear DevolucionPOS enlazada a la nueva venta
      const devolucion = await tx.devolucionPOS.create({
        data: {
          numeroComprobante: consecDev.ultimoNumero,
          ventaOriginalId: ventaOriginal.id,
          ubicacionId: ventaOriginal.ubicacionId,
          sesionCajaId: sesion.id,
          procesadoPorId: usuarioId,
          autorizadoFueraPlazoPorId: data.autorizadoFueraPlazoPorId ?? (esAdmin && !dentroPlazo ? usuarioId : null),
          motivoFueraPlazo: data.motivoFueraPlazo ?? (!dentroPlazo ? 'Autorización de Administrador fuera de plazo' : null),
          esParteDeCambio: true,
          ventaNuevaCambioId: nuevaVenta.id,
          fechaHora,
          fechaNegocioColombia,
          mesNegocioColombia,
          totalReembolsadoCop,
          medioReembolso: data.medioReembolsoDiferencia ?? 'EFECTIVO',
          referenciaReembolsoTransf: data.referenciaReembolsoTransf ?? null,
          observacion: data.observacion ?? `Cambio atómico por venta #${nuevaVenta.numeroComprobante}`,
          lineas: {
            create: lineasDevueltasCalc.map(({ lDev, montoReembolsadoLineaCop }) => ({
              lineaVentaOriginal: { connect: { id: lDev.lineaVentaOriginalId } },
              variante: { connect: { id: lDev.varianteId } },
              cantidadDevuelta: lDev.cantidadDevuelta,
              condicionFisica: lDev.condicionFisica,
              montoReembolsadoCop: montoReembolsadoLineaCop,
            })),
          },
        },
      });

      // 10. Auditoría
      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'CAMBIO_POS_ATÓMICO',
          entidadTipo: 'DevolucionPOS',
          entidadId: String(devolucion.id),
          datosMinimos: {
            devolucionId: devolucion.id,
            ventaNuevaCambioId: nuevaVenta.id,
            ventaOriginalId: ventaOriginal.id,
            diferenciaLiquidacionCop,
            totalReembolsadoCop,
            totalNuevaVentaCop,
          },
        },
      });

      return {
        devolucion,
        nuevaVenta,
        diferenciaLiquidacionCop,
      };
    });
  }

  /**
   * RF-DEV-02 / RN-DEV-12 / CA-33: Anulación en el día de venta POS sin devoluciones previas.
   */
  static async anularVenta(id: number, usuarioId: number, data: AnularVentaPosInput) {
    return prisma.$transaction(async (tx) => {
      const venta = await tx.ventaPOS.findUnique({
        where: { id },
        include: {
          lineas: true,
          devoluciones: true,
        },
      });

      if (!venta) throw AppError.notFound('Venta POS no encontrada');
      if (venta.estado !== 'COMPLETADA') {
        throw AppError.unprocessable(`Solo se pueden anular ventas en estado COMPLETADA. La venta actual está ${venta.estado}`);
      }

      // CA-33: Solo se pueden anular ventas pertenecientes a la sesión de caja actual
      const sesion = await CajaService.validarSesionVigenteParaOperacion(venta.ubicacionId, tx);
      if (venta.sesionCajaId !== sesion.id) {
        throw AppError.conflict(
          'Solo se pueden anular ventas registradas durante la sesión de caja activa actual (RN-DEV-12, CA-33).'
        );
      }

      // No debe tener devoluciones previas registradas
      if (venta.devoluciones.length > 0) {
        throw AppError.conflict(
          'La venta tiene devoluciones previas registradas. No puede anularse por completo; gestione devoluciones de las unidades restantes.'
        );
      }

      // Revertir inventario vía Kardex (ANULACION_VENTA_POS, + en FISICO) (RNF-003: Orden canónico varianteId ASC)
      const lineasOrdenadas = [...venta.lineas].sort((a, b) => a.varianteId - b.varianteId);

      for (const linea of lineasOrdenadas) {
        await InventoryLedgerService.registrarMovimiento(tx, {
          tipo: 'ANULACION_VENTA_POS',
          ubicacionId: venta.ubicacionId,
          varianteId: linea.varianteId,
          cantidadConSigno: linea.cantidadVendida,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: venta.id,
          usuarioId,
          motivo: `Anulación venta #${venta.numeroComprobante}: ${data.motivo}`,
        });
      }

      const fechaAnulacion = new Date();
      const ventaAnulada = await tx.ventaPOS.update({
        where: { id: venta.id },
        data: {
          estado: 'ANULADA',
          anuladaPorId: usuarioId,
          fechaAnulacion,
          motivoAnulacion: data.motivo,
        },
      });

      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'VENTA_POS_ANULADA',
          entidadTipo: 'VentaPOS',
          entidadId: String(venta.id),
          datosMinimos: {
            ventaId: venta.id,
            motivo: data.motivo,
            fechaAnulacion,
          },
        },
      });

      return ventaAnulada;
    });
  }

  static async listar(filtros: ListarDevolucionesQuery) {
    const where: Prisma.DevolucionPOSWhereInput = {};
    if (filtros.ubicacionId) where.ubicacionId = filtros.ubicacionId;
    if (filtros.numeroComprobante) where.numeroComprobante = filtros.numeroComprobante;
    if (filtros.desde || filtros.hasta) {
      where.fechaHora = {
        ...(filtros.desde ? { gte: new Date(filtros.desde) } : {}),
        ...(filtros.hasta ? { lte: new Date(filtros.hasta) } : {}),
      };
    }

    return prisma.devolucionPOS.findMany({
      where,
      orderBy: { fechaHora: 'desc' },
      include: {
        lineas: true,
        ventaOriginal: { select: { id: true, numeroComprobante: true } },
        procesadoPor: { select: { id: true, nombreCompleto: true } },
      },
    });
  }

  static async obtenerPorId(id: number) {
    const dev = await prisma.devolucionPOS.findUnique({
      where: { id },
      include: {
        lineas: true,
        ventaOriginal: { include: { lineas: true } },
        procesadoPor: { select: { id: true, nombreCompleto: true, correo: true } },
      },
    });

    if (!dev) throw AppError.notFound('Devolución POS no encontrada');
    return dev;
  }
}
