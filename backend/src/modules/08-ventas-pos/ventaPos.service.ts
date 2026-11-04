import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { ColombiaTime } from '../../shared/domain/ColombiaTime.js';
import { InventoryLedgerService } from '../04-inventario/InventoryLedgerService.js';
import { CajaService } from '../07-caja/caja.service.js';
import { DiscountEngine, type LineaCalculoDescuento, type SolicitudDescuento } from '../09-descuentos/domain/DiscountEngine.js';
import type { CrearVentaPosInput, ListarVentasPosQuery } from './ventaPos.schema.js';

export class VentaPosService {
  /**
   * RF-POS-02 / RN-VTA-01 a 15: Confirmación Atómica de Venta POS.
   * Aplica preempción física POS sobre reservadoBlando (CA-60), protección absoluta de reservadoDuro (CA-61),
   * prorrateo de descuentos exacto (DiscountEngine), consecutivo diferido por punto (RN-VTA-09) e idempotencia (RN-GEN-08).
   */
  static async crear(usuarioId: number, data: CrearVentaPosInput, idempotencyKey?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Validar que exista una sesión de caja ABIERTA y VIGENTE en la sede (RN-VTA-01, CA-56, QA-009)
      const sesion = await CajaService.validarSesionVigenteParaOperacion(data.ubicacionId, tx);

      // 2. Cargar variantes y productos para snapshots y precios
      const varianteIds = data.lineas.map((l) => l.varianteId);
      const variantesDb = await tx.variante.findMany({
        where: { id: { in: varianteIds } },
        include: {
          producto: {
            include: { categoria: true },
          },
        },
      });

      if (variantesDb.length !== varianteIds.length) {
        throw AppError.badRequest('Una o más variantes no existen en el catálogo.');
      }

      const variantesMap = new Map(variantesDb.map((v) => [v.id, v]));

      // 3. Preparar líneas para DiscountEngine (RN-DES-01 a 09)
      const lineasCalculo: LineaCalculoDescuento[] = data.lineas.map((l) => {
        const v = variantesMap.get(l.varianteId)!;
        const precioUnitarioBaseCop = v.precioVentaCop;
        return {
          id: l.varianteId,
          cantidad: l.cantidad,
          precioUnitarioBaseCop,
          esElegible: true,
        };
      });

      let solicitudDescuento: SolicitudDescuento | undefined;
      if (data.descuento) {
        solicitudDescuento = {
          tipo: data.descuento.tipo,
          valor: data.descuento.valor,
          ...(data.descuento.motivoManual ? { motivo: data.descuento.motivoManual } : {}),
        };
      }

      const resultadoDescuento = DiscountEngine.calcular(lineasCalculo, solicitudDescuento);
      const subtotalListaCop = resultadoDescuento.subtotalGeneralCop;
      const descuentoTotalCop = resultadoDescuento.descuentoTotalAplicadoCop;
      const totalNetoProductosCop = resultadoDescuento.totalNetoPagarCop;

      // 4. Validar que los pagos cubran exactamente el total neto
      const totalPagosCop = data.pagos.reduce((acc, p) => acc + p.montoCop, 0);
      if (totalPagosCop < totalNetoProductosCop) {
        throw AppError.badRequest(
          `El monto total de los pagos ($${totalPagosCop.toLocaleString('es-CO')} COP) no cubre el total neto a pagar ($${totalNetoProductosCop.toLocaleString('es-CO')} COP).`
        );
      }
      if (totalPagosCop > totalNetoProductosCop) {
        throw AppError.badRequest(
          `La suma de montos imputados ($${totalPagosCop.toLocaleString('es-CO')} COP) excede el total neto a pagar ($${totalNetoProductosCop.toLocaleString('es-CO')} COP). Si el cliente paga con un billete mayor, registre el valor en montoRecibidoEfectivoCop para calcular el vuelto.`
        );
      }

      // 5. Preempción Física POS y Descuento en Kardex (RNF-003: Orden canónico varianteId ASC)
      const lineasCalculadasMap = new Map(
        resultadoDescuento.lineas.map((l) => [Number(l.id), l])
      );

      const lineasOrdenadas = [...data.lineas].sort((a, b) => a.varianteId - b.varianteId);

      for (const linea of lineasOrdenadas) {
        // Bloqueo pesimista de fila en SaldoStock para evitar TOCTOU y condiciones de carrera
        await tx.$queryRaw`
          SELECT id FROM "SaldoStock"
          WHERE "ubicacionId" = ${data.ubicacionId} AND "varianteId" = ${linea.varianteId}
          FOR UPDATE
        `;

        const saldo = await tx.saldoStock.findUnique({
          where: {
            ubicacionId_varianteId: {
              ubicacionId: data.ubicacionId,
              varianteId: linea.varianteId,
            },
          },
        });

        const fisico = saldo?.fisico ?? 0;
        const blando = saldo?.reservadoBlando ?? 0;
        const duro = saldo?.reservadoDuro ?? 0;
        const disponible = Math.max(0, fisico - blando - duro);

        // Invariante 5 / CA-61 / QA-005: Excepción Inviolable de Reserva Dura
        if (fisico - duro < linea.cantidad) {
          if (fisico < linea.cantidad) {
            throw AppError.conflict(
              `Stock físico insuficiente para la variante #${linea.varianteId}. Físico: ${fisico}, Requerido: ${linea.cantidad}.`
            );
          } else {
            throw AppError.conflict(
              `No es posible vender la variante #${linea.varianteId}: las unidades en tienda están empaquetadas en un pedido web EN PREPARACIÓN (reserva dura protegida, CA-61, QA-005).`
            );
          }
        }

        // Invariante 5 / CA-60 / QA-004: Preempción física POS sobre reservadoBlando
        if (disponible < linea.cantidad) {
          const unidadesPreemptadas = linea.cantidad - disponible;

          // Buscar pedidos web con reserva blanda en esta sede que contengan la variante
          const pedidosAfectados = await tx.pedidoWeb.findMany({
            where: {
              ubicacionAsignadaId: data.ubicacionId,
              estadoPedido: { in: ['RECIBIDO', 'CONFIRMADO'] },
              tieneReservaActiva: true,
              lineas: {
                some: { varianteId: linea.varianteId },
              },
            },
            include: { lineas: true },
            orderBy: { id: 'asc' },
          });

          let unidadesLiberadas = 0;
          for (const pedido of pedidosAfectados) {
            if (unidadesLiberadas >= unidadesPreemptadas) break;

            const lineaPedido = pedido.lineas.find((l) => l.varianteId === linea.varianteId);
            if (!lineaPedido) continue;

            const cantLiberar = Math.min(lineaPedido.cantidad, unidadesPreemptadas - unidadesLiberadas);

            // Liberar la reserva blanda en Kardex de esta sede
            await InventoryLedgerService.registrarMovimiento(tx, {
              tipo: 'LIBERACION_RESERVA_WEB',
              ubicacionId: data.ubicacionId,
              varianteId: linea.varianteId,
              cantidadConSigno: -cantLiberar,
              afectaSaldo: 'RESERVADO_BLANDO',
              documentoTipo: 'PEDIDO_WEB',
              documentoId: pedido.id,
              usuarioId,
              motivo: `Preempción POS por venta en mostrador (CA-60)`,
            });

            unidadesLiberadas += cantLiberar;

            // Marcar incidencia de stock en el pedido web y moverlo preventivamente a custodia en Central si no hay stock
            const central = await tx.ubicacion.findFirst({ where: { tipo: 'CENTRAL' } });
            await tx.pedidoWeb.update({
              where: { id: pedido.id },
              data: {
                tieneIncidenciaStock: true,
                ubicacionAsignadaId: central?.id ?? pedido.ubicacionAsignadaId,
                tieneReservaActiva: false,
                observacionesNovedad: `Unidad preemptada por venta presencial en POS (CA-60). Reubicado en custodia.`,
              },
            });
          }
        }

        // Descontar inventario físico por la venta POS vía Kardex único (RN-GEN-02)
        await InventoryLedgerService.registrarMovimiento(tx, {
          tipo: 'VENTA_POS',
          ubicacionId: data.ubicacionId,
          varianteId: linea.varianteId,
          cantidadConSigno: -linea.cantidad,
          afectaSaldo: 'FISICO',
          documentoTipo: 'VENTA_POS',
          documentoId: 0, // Se enlaza con el registro VentaPOS
          usuarioId,
          motivo: `Venta mostrador POS`,
        });
      }

      // 6. Consecutivo Diferido por Ubicación (RN-VTA-09) inmediatamente antes del COMMIT
      const consecutivo = await tx.consecutivoUbicacion.upsert({
        where: {
          ubicacionId_tipoDocumento: {
            ubicacionId: data.ubicacionId,
            tipoDocumento: 'VENTA_POS',
          },
        },
        update: { ultimoNumero: { increment: 1 } },
        create: {
          ubicacionId: data.ubicacionId,
          tipoDocumento: 'VENTA_POS',
          ultimoNumero: 1,
        },
      });
      const numeroComprobante = consecutivo.ultimoNumero;

      const fechaHora = new Date();
      const fechaNegocioColombia = ColombiaTime.toFechaNegocioColombia(fechaHora);
      const mesNegocioColombia = ColombiaTime.toMesNegocioColombia(fechaHora);

      // 7. Crear el registro VentaPOS con sus líneas y pagos
      const venta = await tx.ventaPOS.create({
        data: {
          numeroComprobante,
          ubicacionId: data.ubicacionId,
          sesionCajaId: sesion.id,
          vendedorId: usuarioId,
          clienteNombreOpcional: data.clienteNombreOpcional ?? null,
          clienteDocumentoOpcional: data.clienteDocumentoOpcional ?? null,
          estado: 'COMPLETADA',
          fechaHora,
          fechaNegocioColombia,
          mesNegocioColombia,
          subtotalListaCop,
          descuentoTotalCop,
          totalNetoProductosCop,
          descuentoTipoSnapshot: data.descuento?.tipo ?? null,
          descuentoCodigoSnapshot: data.descuento?.descuentoCodigo ?? null,
          descuentoValorSnapshot: data.descuento?.valor ?? null,
          descuentoMotivoManual: data.descuento?.motivoManual ?? null,
          descuentoAutorizadoPorId: data.descuento?.descuentoAutorizadoPorId ?? null,
          lineas: {
            create: data.lineas.map((l) => {
              const v = variantesMap.get(l.varianteId)!;
              const calc = lineasCalculadasMap.get(l.varianteId)!;
              const precioListaUnitarioCop = v.precioVentaCop;
              const subtotalListaLineaCop = precioListaUnitarioCop * l.cantidad;

              return {
                varianteId: l.varianteId,
                productoIdSnapshot: v.productoId,
                nombreProductoSnapshot: v.producto.nombre,
                skuSnapshot: v.sku,
                tallaSnapshot: v.talla,
                colorSnapshot: v.color,
                esReintegrableSnapshot: v.producto.reintegrableEnDevolucion,
                cantidadVendida: l.cantidad,
                precioListaUnitarioCop,
                subtotalListaLineaCop,
                descuentoProrrateadoCop: calc.descuentoProrrateadoCop,
                netoPagadoLineaCop: calc.precioNetoTotalCop,
              };
            }),
          },
          pagos: {
            create: data.pagos.map((p) => {
              let vueltoEfectivoCop: number | null = null;
              if (p.metodo === 'EFECTIVO' && p.montoRecibidoEfectivoCop !== undefined) {
                vueltoEfectivoCop = Math.max(0, p.montoRecibidoEfectivoCop - p.montoCop);
              }
              return {
                metodo: p.metodo,
                montoCop: p.montoCop,
                montoRecibidoEfectivoCop: p.montoRecibidoEfectivoCop ?? null,
                vueltoEfectivoCop,
                referenciaTransferencia: p.referenciaTransferencia ?? null,
              };
            }),
          },
        },
        include: {
          lineas: true,
          pagos: true,
          ubicacion: { select: { id: true, nombre: true } },
          vendedor: { select: { id: true, nombreCompleto: true, correo: true } },
        },
      });

      // 8. Registro de auditoría inmutable (RN-GEN-03)
      await tx.registroAuditoria.create({
        data: {
          usuarioId,
          accion: 'VENTA_POS_CONFIRMADA',
          entidadTipo: 'VentaPOS',
          entidadId: String(venta.id),
          datosMinimos: {
            ventaId: venta.id,
            numeroComprobante: venta.numeroComprobante,
            ubicacionId: venta.ubicacionId,
            totalNetoProductosCop: venta.totalNetoProductosCop,
            descuentoTotalCop: venta.descuentoTotalCop,
            sesionCajaId: venta.sesionCajaId,
          },
        },
      });

      // 9. Persistencia de Idempotencia Atómica (RN-GEN-08)
      if (idempotencyKey) {
        const snapshot = JSON.parse(JSON.stringify({ ok: true, datos: venta })) as Prisma.InputJsonValue;
        await tx.registroIdempotencia.create({
          data: {
            idempotencyKey,
            usuarioId,
            endpoint: '/api/ventas-pos',
            statusCode: 201,
            responseBody: snapshot,
          },
        });
      }

      return venta;
    });
  }

  static async listar(filtros: ListarVentasPosQuery) {
    const where: Prisma.VentaPOSWhereInput = {};
    if (filtros.ubicacionId) where.ubicacionId = filtros.ubicacionId;
    if (filtros.numeroComprobante) where.numeroComprobante = filtros.numeroComprobante;
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.desde || filtros.hasta) {
      where.fechaHora = {
        ...(filtros.desde ? { gte: new Date(filtros.desde) } : {}),
        ...(filtros.hasta ? { lte: new Date(filtros.hasta) } : {}),
      };
    }

    return prisma.ventaPOS.findMany({
      where,
      orderBy: { fechaHora: 'desc' },
      include: {
        lineas: true,
        pagos: true,
        ubicacion: { select: { id: true, nombre: true } },
        vendedor: { select: { id: true, nombreCompleto: true } },
      },
    });
  }

  static async obtenerPorId(id: number) {
    const venta = await prisma.ventaPOS.findUnique({
      where: { id },
      include: {
        lineas: true,
        pagos: true,
        ubicacion: true,
        vendedor: { select: { id: true, nombreCompleto: true, correo: true } },
        devoluciones: {
          include: { lineas: true },
        },
      },
    });

    if (!venta) {
      throw AppError.notFound('Venta POS no encontrada');
    }

    return venta;
  }
}
