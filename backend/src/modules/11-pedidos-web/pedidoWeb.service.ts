import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { ColombiaTime } from '../../shared/domain/ColombiaTime.js';
import type { UserAuthSnapshot } from '../../shared/middlewares/authPermission.js';
import {
  InventoryLedgerService,
  type RegistrarMovimientoParams,
} from '../04-inventario/InventoryLedgerService.js';
import {
  DaneShippingCalculator,
  type ExcepcionTarifa,
  type InfoMunicipioDane,
} from './domain/DaneShippingCalculator.js';
import {
  OrderAssignmentEngine,
  type EvaluacionSede,
  type ItemCarrito,
  type StockSedeVariante,
} from './domain/OrderAssignmentEngine.js';
import type {
  CheckoutWebInput,
  CotizarFleteInput,
  ListarPedidosWebQuery,
  NoPuedoDespacharInput,
} from './pedidoWeb.schema.js';

export class PedidoWebService {
  /**
   * RF-WEB-02: Cotiza la tarifa de envío DANE (Zonas 1 a 4 o excepción) hacia un municipio destino.
   */
  static async cotizarFlete(data: CotizarFleteInput) {
    // 1. Obtener municipio destino con su departamento y región
    const destino = await prisma.municipioDane.findUnique({
      where: { codigoDane: data.municipioDestinoId },
      include: { departamento: true },
    });

    if (!destino) {
      throw AppError.notFound(`Municipio de destino con código DANE '${data.municipioDestinoId}' no encontrado.`);
    }

    if (!destino.atendidoWeb) {
      throw AppError.unprocessable(
        `El municipio '${destino.nombre}' (${destino.codigoDane}) no cuenta con cobertura de entrega web (CA-37).`
      );
    }

    // 2. Determinar municipio origen (si no se envía, se toma el de Bodega Central)
    let origenCodigoDane = data.municipioOrigenId;
    if (!origenCodigoDane) {
      const central = await prisma.ubicacion.findFirst({
        where: { tipo: 'CENTRAL', activa: true },
        select: { municipioDaneId: true },
      });
      origenCodigoDane = central?.municipioDaneId ?? '54001'; // Default Cúcuta si no hay Central
    }

    const origen = await prisma.municipioDane.findUnique({
      where: { codigoDane: origenCodigoDane },
      include: { departamento: true },
    });

    if (!origen) {
      throw AppError.notFound(`Municipio de origen con código DANE '${origenCodigoDane}' no encontrado.`);
    }

    // 3. Consultar excepciones de tarifa para este par origen-destino
    const excepcionesDb = await prisma.excepcionTarifaEnvio.findMany({
      where: {
        municipioOrigenId: origen.codigoDane,
        municipioDestinoId: destino.codigoDane,
      },
    });

    const excepciones: ExcepcionTarifa[] = excepcionesDb.map((e) => ({
      municipioOrigenId: e.municipioOrigenId,
      municipioDestinoId: e.municipioDestinoId,
      tarifaCop: e.tarifaCop,
      diasEstimados: e.diasEstimados,
    }));

    const infoOrigen: InfoMunicipioDane = {
      codigoDane: origen.codigoDane,
      departamentoId: origen.departamentoId,
      regionId: origen.departamento.regionId,
      atendidoWeb: origen.atendidoWeb,
    };

    const infoDestino: InfoMunicipioDane = {
      codigoDane: destino.codigoDane,
      departamentoId: destino.departamentoId,
      regionId: destino.departamento.regionId,
      atendidoWeb: destino.atendidoWeb,
    };

    return DaneShippingCalculator.calcular(infoOrigen, infoDestino, excepciones);
  }

  /**
   * RF-WEB-03 / CA-35 / CA-36 / CA-38: Checkout Atómico y Reserva Blanda en Tienda Web.
   */
  static async checkout(data: CheckoutWebInput, cliente: UserAuthSnapshot, idempotencyKey?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Validar municipio destino y cobertura web (CA-37)
      const destino = await tx.municipioDane.findUnique({
        where: { codigoDane: data.municipioDestinoId },
        include: { departamento: true },
      });

      if (!destino) {
        throw AppError.notFound(`Municipio de destino con código DANE '${data.municipioDestinoId}' no existe.`);
      }

      if (!destino.atendidoWeb) {
        throw AppError.unprocessable(
          `El municipio '${destino.nombre}' (${destino.codigoDane}) no cuenta con cobertura de entrega web (CA-37).`
        );
      }

      const infoDestino: InfoMunicipioDane = {
        codigoDane: destino.codigoDane,
        departamentoId: destino.departamentoId,
        regionId: destino.departamento.regionId,
        atendidoWeb: destino.atendidoWeb,
      };

      // 2. Validar variantes y productos solicitados
      const varianteIds = data.lineas.map((l) => l.varianteId);
      const variantesDb = await tx.variante.findMany({
        where: { id: { in: varianteIds } },
        include: {
          producto: {
            select: { id: true, nombre: true, reintegrableEnDevolucion: true, activo: true },
          },
        },
      });

      if (variantesDb.length !== varianteIds.length) {
        throw AppError.notFound('Una o más variantes del pedido no existen en el catálogo.');
      }

      for (const v of variantesDb) {
        if (!v.activa || !v.producto.activo) {
          throw AppError.badRequest(
            `El producto '${v.producto.nombre}' (SKU: ${v.sku}) se encuentra inactivo y no puede ser adquirido.`
          );
        }
      }

      // 3. Consultar sedes habilitadas para despacho web (RN-UBI-03)
      const sedesDb = await tx.ubicacion.findMany({
        where: { activa: true, despachaWeb: true },
        include: {
          municipio: {
            include: { departamento: true },
          },
        },
      });

      if (sedesDb.length === 0) {
        throw AppError.conflict('No existen sedes activas habilitadas para despacho web en el sistema.');
      }

      // 4. Consultar saldos de stock de todas las sedes candidatas para las variantes del carrito
      const saldosDb = await tx.saldoStock.findMany({
        where: {
          ubicacionId: { in: sedesDb.map((s) => s.id) },
          varianteId: { in: varianteIds },
        },
      });

      // Mapear saldos por sede
      const saldosPorSedeMap = new Map<number, Map<number, { varianteId: number; disponible: number; bloqueadoDespachoWeb: boolean }>>();
      for (const saldo of saldosDb) {
        if (!saldosPorSedeMap.has(saldo.ubicacionId)) {
          saldosPorSedeMap.set(saldo.ubicacionId, new Map());
        }
        const disponible = Math.max(0, saldo.fisico - saldo.reservadoBlando - saldo.reservadoDuro);
        saldosPorSedeMap.get(saldo.ubicacionId)!.set(saldo.varianteId, {
          varianteId: saldo.varianteId,
          disponible,
          bloqueadoDespachoWeb: saldo.bloqueadoDespachoWeb,
        });
      }

      // 5. Consultar excepciones de tarifa globales para todas las sedes candidatas hacia el destino
      const excepcionesDb = await tx.excepcionTarifaEnvio.findMany({
        where: {
          municipioDestinoId: destino.codigoDane,
        },
      });

      const excepciones: ExcepcionTarifa[] = excepcionesDb.map((e) => ({
        municipioOrigenId: e.municipioOrigenId,
        municipioDestinoId: e.municipioDestinoId,
        tarifaCop: e.tarifaCop,
        diasEstimados: e.diasEstimados,
      }));

      // 6. Construir modelos de evaluación para el Algoritmo Determinista (RN-WEB-05, CA-35, CA-36)
      const sedesEvaluacion: EvaluacionSede[] = sedesDb.map((sede) => ({
        id: sede.id,
        nombre: sede.nombre,
        activa: sede.activa,
        despachaWeb: sede.despachaWeb,
        prioridadDespacho: sede.prioridadDespacho,
        municipioDane: {
          codigoDane: sede.municipio.codigoDane,
          departamentoId: sede.municipio.departamentoId,
          regionId: sede.municipio.departamento.regionId,
          atendidoWeb: sede.municipio.atendidoWeb,
        },
        saldos: saldosPorSedeMap.get(sede.id) ?? new Map(),
      }));

      const itemsCarrito: ItemCarrito[] = data.lineas.map((l) => ({
        varianteId: l.varianteId,
        cantidad: l.cantidad,
      }));

      // Ejecutar selección determinista de sede (lanza 409 si ninguna sede individual puede cubrir todo el pedido)
      const { sede: sedeElegida, tarifaEnvio } = OrderAssignmentEngine.seleccionarSedeDespacho(
        itemsCarrito,
        infoDestino,
        sedesEvaluacion,
        excepciones
      );

      // 7. Generar consecutivo legible único por año en Hora Colombia (RN-GEN-08, RN-GEN-05)
      const ahora = new Date();
      const anioActual = ColombiaTime.toFechaNegocioColombia(ahora).slice(0, 4);
      const count = await tx.pedidoWeb.count();
      const consecutivoFormateado = String(count + 1).padStart(6, '0');
      const referenciaLegible = `PED-${anioActual}-${consecutivoFormateado}`;

      // 8. Calcular importes monetarios en COP entero (RN-GEN-04)
      const variantesMap = new Map(variantesDb.map((v) => [v.id, v]));
      let subtotalListaCop = 0;

      const lineasDetalle = data.lineas.map((linea) => {
        const variante = variantesMap.get(linea.varianteId)!;
        const precioUnitario = variante.precioVentaCop;
        const subtotalLinea = precioUnitario * linea.cantidad;
        subtotalListaCop += subtotalLinea;

        return {
          varianteId: variante.id,
          nombreProductoSnapshot: variante.producto.nombre,
          skuSnapshot: variante.sku,
          tallaSnapshot: variante.talla,
          colorSnapshot: variante.color,
          esReintegrableSnapshot: variante.producto.reintegrableEnDevolucion,
          cantidad: linea.cantidad,
          precioListaUnitarioCop: precioUnitario,
          subtotalListaLineaCop: subtotalLinea,
          descuentoProrrateadoCop: 0,
          netoPagadoLineaCop: subtotalLinea,
        };
      });

      const descuentoTotalCop = 0; // Descuentos por cupón se aplican en módulos comerciales posteriores
      const totalNetoProductosCop = subtotalListaCop - descuentoTotalCop;
      const costoEnvioCop = tarifaEnvio.tarifaCop;
      const totalAPagarCop = totalNetoProductosCop + costoEnvioCop;

      // 9. Configurar TTL de 24 horas si el pago es por TRANSFERENCIA (RN-WEB-09, CA-39)
      const reservaExpiraEn =
        data.metodoPago === 'TRANSFERENCIA'
          ? new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
          : null;

      // 10. Crear el Pedido Web con sus líneas
      const pedidoCreado = await tx.pedidoWeb.create({
        data: {
          referenciaLegible,
          clienteId: cliente.id,
          ubicacionAsignadaId: sedeElegida.id,
          tieneIncidenciaStock: false,
          tieneReservaActiva: true,
          estadoPedido: 'RECIBIDO',
          estadoPago: 'PENDIENTE',
          metodoPago: data.metodoPago,
          reservaExpiraEn,
          municipioDestinoId: destino.codigoDane,
          direccionEntrega: data.direccionEntrega.trim(),
          destinatarioNombre: data.destinatarioNombre.trim(),
          destinatarioTelefono: data.destinatarioTelefono.trim(),
          zonaEnvioCalculada: tarifaEnvio.zona,
          costoEnvioCop,
          diasEstimadosSnapshot: tarifaEnvio.diasEstimados,
          subtotalListaCop,
          descuentoTotalCop,
          totalNetoProductosCop,
          totalAPagarCop,
          fechaCreacion: ahora,
          lineas: {
            create: lineasDetalle,
          },
        },
        include: {
          lineas: true,
          ubicacionAsignada: {
            select: { id: true, nombre: true, tipo: true },
          },
          municipioDestino: {
            select: { codigoDane: true, nombre: true },
          },
        },
      });

      // 11. Registrar la Reserva Blanda en Kardex aplicando RNF-003 anti-deadlock (RN-INV-01, CA-38)
      const movimientosReserva: RegistrarMovimientoParams[] = data.lineas.map((linea) => ({
        tipo: 'RESERVA_WEB',
        ubicacionId: sedeElegida.id,
        varianteId: linea.varianteId,
        cantidadConSigno: linea.cantidad,
        afectaSaldo: 'RESERVADO_BLANDO',
        documentoTipo: 'PEDIDO_WEB',
        documentoId: pedidoCreado.id,
        usuarioId: cliente.id,
        motivo: `Reserva blanda checkout web ${pedidoCreado.referenciaLegible} en ${sedeElegida.nombre} (CA-38)`,
      }));

      // registrarMovimientosBatch ordena por varianteId ASC adquiriendo FOR UPDATE
      await InventoryLedgerService.registrarMovimientosBatch(tx, movimientosReserva);

      // 12. Asentar Historial de Estado (RF-WEB-03)
      await tx.historialEstadoPedidoWeb.create({
        data: {
          pedidoId: pedidoCreado.id,
          estadoPedido: 'RECIBIDO',
          estadoPago: 'PENDIENTE',
          usuarioId: cliente.id,
          observacion: `Pedido recibido exitosamente con reserva blanda en ${sedeElegida.nombre}.`,
        },
      });

      // 13. Registro de Auditoría inmutable (RN-GEN-03, RN-AUD-02)
      await tx.registroAuditoria.create({
        data: {
          usuarioId: cliente.id,
          accion: 'CHECKOUT_PEDIDO_WEB',
          entidadTipo: 'PedidoWeb',
          entidadId: String(pedidoCreado.id),
          datosMinimos: {
            pedidoId: pedidoCreado.id,
            referencia: pedidoCreado.referenciaLegible,
            sedeAsignadaId: sedeElegida.id,
            totalAPagarCop,
            metodoPago: data.metodoPago,
          },
        },
      });

      // 14. Persistir registro de idempotencia si se envió clave (RN-GEN-08)
      if (idempotencyKey) {
        await tx.registroIdempotencia.create({
          data: {
            idempotencyKey,
            usuarioId: cliente.id,
            endpoint: '/api/pedidos-web/checkout',
            statusCode: 201,
            responseBody: { ok: true, datos: pedidoCreado },
          },
        });
      }

      return pedidoCreado;
    });
  }

  /**
   * Obtener detalle completo de un pedido web con verificación de permisos y rol.
   */
  static async obtenerPorId(id: number, user: UserAuthSnapshot) {
    const pedido = await prisma.pedidoWeb.findUnique({
      where: { id },
      include: {
        lineas: true,
        ubicacionAsignada: true,
        municipioDestino: {
          include: { departamento: true },
        },
        cliente: {
          select: { id: true, nombreCompleto: true, correo: true, telefono: true },
        },
        historialEstados: {
          orderBy: { fechaHora: 'desc' },
        },
      },
    });

    if (!pedido) {
      throw AppError.notFound(`Pedido web con id ${id} no encontrado.`);
    }

    // Aislamiento: El cliente solo puede consultar sus propios pedidos
    if (user.rol === 'CLIENTE' && pedido.clienteId !== user.id) {
      throw AppError.forbidden('No tiene permiso para consultar pedidos de otros clientes.');
    }

    // Aislamiento territorial: Vendedor requiere permPedidosWeb y solo consulta pedidos de su sede (RN-ROL-04)
    if (user.rol === 'VENDEDOR') {
      if (!user.permisos.permPedidosWeb) {
        throw AppError.forbidden('No cuenta con el permiso permPedidosWeb para operar pedidos web.');
      }
      if (!user.ubicacionId || user.ubicacionId !== pedido.ubicacionAsignadaId) {
        throw AppError.forbidden('No tiene permiso para consultar pedidos asignados a otras sedes.');
      }
    }

    return pedido;
  }

  /**
   * Listar pedidos web con filtros según rol del usuario.
   */
  static async listar(filtros: ListarPedidosWebQuery, user: UserAuthSnapshot) {
    const where: Prisma.PedidoWebWhereInput = {};

    if (filtros.estadoPedido) {
      where.estadoPedido = filtros.estadoPedido;
    }

    if (filtros.metodoPago) {
      where.metodoPago = filtros.metodoPago;
    }

    if (filtros.ubicacionAsignadaId) {
      where.ubicacionAsignadaId = filtros.ubicacionAsignadaId;
    }

    // Aislamiento por rol
    if (user.rol === 'CLIENTE') {
      where.clienteId = user.id;
    } else if (user.rol === 'VENDEDOR') {
      if (!user.permisos.permPedidosWeb) {
        throw AppError.forbidden('No cuenta con el permiso permPedidosWeb para consultar pedidos web.');
      }
      if (!user.ubicacionId) {
        throw AppError.forbidden('Vendedor sin sede asignada no puede consultar pedidos web.');
      }
      where.ubicacionAsignadaId = user.ubicacionId;
    } else if (filtros.clienteId) {
      where.clienteId = filtros.clienteId;
    }

    return prisma.pedidoWeb.findMany({
      where,
      include: {
        lineas: true,
        ubicacionAsignada: {
          select: { id: true, nombre: true, tipo: true },
        },
        municipioDestino: {
          select: { codigoDane: true, nombre: true },
        },
        cliente: {
          select: { id: true, nombreCompleto: true, correo: true },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  /**
   * RF-WEB-06 / RN-WEB-16 / CA-43 / CA-62 / QA-013:
   * Flujo «No puedo despachar», Cuarentena de SKU en la sede y reasignación automática o custodia en Bodega Central.
   */
  static async reportarNoPuedoDespachar(
    pedidoId: number,
    data: NoPuedoDespacharInput,
    user: UserAuthSnapshot,
    idempotencyKey?: string
  ) {
    // 1. Validar permisos de rol a nivel de servicio (Aislamiento territorial)
    if (user.rol === 'CLIENTE') {
      throw AppError.forbidden('Los clientes no tienen autorización para reportar novedades de despacho en sedes.');
    }

    if (user.rol === 'VENDEDOR' && !user.permisos.permPedidosWeb) {
      throw AppError.forbidden('No cuenta con el permiso permPedidosWeb para gestionar pedidos web.');
    }

    // 2. Transacción interactiva ACID completa (RN-GEN-02, RNF-003, CA-42, CA-43, CA-62)
    return prisma.$transaction(async (tx) => {
      // 2.1. Bloqueo y re-consulta dentro de la transacción para prevenir TOCTOU y condiciones de carrera
      const pedido = await tx.pedidoWeb.findUnique({
        where: { id: pedidoId },
        include: {
          lineas: true,
          ubicacionAsignada: true,
          municipioDestino: {
            include: { departamento: true },
          },
        },
      });

      if (!pedido) {
        throw AppError.notFound(`Pedido web con id ${pedidoId} no encontrado.`);
      }

      // Validar aislamiento territorial del vendedor contra el estado actual en base de datos
      if (user.rol === 'VENDEDOR') {
        if (!user.ubicacionId || user.ubicacionId !== pedido.ubicacionAsignadaId) {
          throw AppError.forbidden('No tiene permiso para reportar novedades de pedidos asignados a otras sedes.');
        }
      }

      // 2.2. Validar estado del pedido (CA-42: reserva dura blindada frente a reasignaciones)
      if (pedido.estadoPedido === 'EN_PREPARACION') {
        throw AppError.conflict(
          'El pedido se encuentra en estado EN_PREPARACION con reserva dura protegida frente a reasignaciones (CA-42).'
        );
      }

      if (['CANCELADO', 'DESPACHADO', 'ENTREGADO', 'NO_ENTREGADO'].includes(pedido.estadoPedido)) {
        throw AppError.unprocessable(
          `No es posible reportar 'No puedo despachar' sobre un pedido en estado ${pedido.estadoPedido}.`
        );
      }

      // 2.3. Validar que las variantes indicadas pertenezcan al pedido
      const lineasMap = new Map(pedido.lineas.map((l) => [l.varianteId, l]));
      for (const varianteId of data.varianteIdsAfectadas) {
        if (!lineasMap.has(varianteId)) {
          throw AppError.badRequest(
            `La variante con id ${varianteId} no forma parte de los artículos del pedido ${pedido.referenciaLegible}.`
          );
        }
      }

      const sedePreviaId = pedido.ubicacionAsignadaId;
      const sedePreviaNombre = pedido.ubicacionAsignada.nombre;

      // 2.4. Cuarentena de SKU en la sede que reportó la novedad (CA-43)
      await InventoryLedgerService.marcarCuarentenaDespachoWeb(
        tx,
        sedePreviaId,
        data.varianteIdsAfectadas,
        data.motivo
      );

      // 2.5. Preparar movimientos de liberación de reserva blanda en la sede previa (si tenía reserva activa)
      const movimientosLiberacion: RegistrarMovimientoParams[] = pedido.tieneReservaActiva
        ? pedido.lineas.map((linea) => ({
            tipo: 'LIBERACION_RESERVA_WEB' as const,
            ubicacionId: sedePreviaId,
            varianteId: linea.varianteId,
            cantidadConSigno: -linea.cantidad,
            afectaSaldo: 'RESERVADO_BLANDO' as const,
            documentoTipo: 'PEDIDO_WEB' as const,
            documentoId: pedido.id,
            usuarioId: user.id,
            motivo: `Liberación por reporte 'No puedo despachar' en ${sedePreviaNombre}: ${data.motivo}`,
          }))
        : [];

      // 2.6. Buscar sedes candidatas alternativas (activas, despachan web y excluyendo la sede previa)
      const sedesCandidatasDb = await tx.ubicacion.findMany({
        where: {
          activa: true,
          despachaWeb: true,
          id: { not: sedePreviaId },
        },
        include: {
          municipio: {
            include: { departamento: true },
          },
        },
      });

      const varianteIdsPedido = pedido.lineas.map((l) => l.varianteId);
      const saldosDb = await tx.saldoStock.findMany({
        where: {
          ubicacionId: { in: sedesCandidatasDb.map((s) => s.id) },
          varianteId: { in: varianteIdsPedido },
        },
      });

      const saldosPorSedeMap = new Map<number, Map<number, StockSedeVariante>>();
      for (const saldo of saldosDb) {
        if (!saldosPorSedeMap.has(saldo.ubicacionId)) {
          saldosPorSedeMap.set(saldo.ubicacionId, new Map());
        }
        const disponible = Math.max(0, saldo.fisico - saldo.reservadoBlando - saldo.reservadoDuro);
        saldosPorSedeMap.get(saldo.ubicacionId)!.set(saldo.varianteId, {
          varianteId: saldo.varianteId,
          disponible,
          bloqueadoDespachoWeb: saldo.bloqueadoDespachoWeb,
        });
      }

      const excepcionesDb = await tx.excepcionTarifaEnvio.findMany({
        where: {
          municipioDestinoId: pedido.municipioDestinoId,
        },
      });

      const excepciones: ExcepcionTarifa[] = excepcionesDb.map((e) => ({
        municipioOrigenId: e.municipioOrigenId,
        municipioDestinoId: e.municipioDestinoId,
        tarifaCop: e.tarifaCop,
        diasEstimados: e.diasEstimados,
      }));

      const sedesEvaluacion: EvaluacionSede[] = sedesCandidatasDb.map((sede) => ({
        id: sede.id,
        nombre: sede.nombre,
        activa: sede.activa,
        despachaWeb: sede.despachaWeb,
        prioridadDespacho: sede.prioridadDespacho,
        municipioDane: {
          codigoDane: sede.municipio.codigoDane,
          departamentoId: sede.municipio.departamentoId,
          regionId: sede.municipio.departamento.regionId,
          atendidoWeb: sede.municipio.atendidoWeb,
        },
        saldos: saldosPorSedeMap.get(sede.id) ?? new Map(),
      }));

      // Agrupar ítems por variante para evitar anomalías si un carrito contiene líneas repetidas
      const cantidadesPorVariante = new Map<number, number>();
      for (const linea of pedido.lineas) {
        const cant = cantidadesPorVariante.get(linea.varianteId) ?? 0;
        cantidadesPorVariante.set(linea.varianteId, cant + linea.cantidad);
      }
      const itemsCarrito: ItemCarrito[] = Array.from(cantidadesPorVariante.entries()).map(
        ([varianteId, cantidad]) => ({ varianteId, cantidad })
      );

      const infoDestino: InfoMunicipioDane = {
        codigoDane: pedido.municipioDestino.codigoDane,
        departamentoId: pedido.municipioDestino.departamentoId,
        regionId: pedido.municipioDestino.departamento.regionId,
        atendidoWeb: pedido.municipioDestino.atendidoWeb,
      };

      let nuevaSedeElegida: EvaluacionSede | null = null;
      if (sedesCandidatasDb.length > 0) {
        try {
          const resultado = OrderAssignmentEngine.seleccionarSedeDespacho(
            itemsCarrito,
            infoDestino,
            sedesEvaluacion,
            excepciones
          );
          nuevaSedeElegida = resultado.sede;
        } catch {
          // Ninguna sede tiene stock completo suficiente
          nuevaSedeElegida = null;
        }
      }

      // 2.7. Decisión: Reasignación exitosa vs Custodia forzosa en Central (CA-62, QA-013)
      if (nuevaSedeElegida) {
        // Caso A: Reasignar a la nueva sede
        const pedidoActualizado = await tx.pedidoWeb.update({
          where: { id: pedido.id },
          data: {
            ubicacionAsignadaId: nuevaSedeElegida.id,
            tieneIncidenciaStock: false,
            tieneReservaActiva: true,
            version: { increment: 1 },
          },
          include: {
            lineas: true,
            ubicacionAsignada: {
              select: { id: true, nombre: true, tipo: true },
            },
            municipioDestino: {
              select: { codigoDane: true, nombre: true },
            },
            cliente: {
              select: { id: true, nombreCompleto: true, correo: true },
            },
          },
        });

        // Registrar nueva reserva blanda en la nueva sede
        const movimientosNuevaReserva: RegistrarMovimientoParams[] = pedido.lineas.map((linea) => ({
          tipo: 'RESERVA_WEB' as const,
          ubicacionId: nuevaSedeElegida!.id,
          varianteId: linea.varianteId,
          cantidadConSigno: linea.cantidad,
          afectaSaldo: 'RESERVADO_BLANDO' as const,
          documentoTipo: 'PEDIDO_WEB' as const,
          documentoId: pedido.id,
          usuarioId: user.id,
          motivo: `Reasignación reserva blanda a ${nuevaSedeElegida!.nombre} por 'No puedo despachar' en ${sedePreviaNombre} (CA-43)`,
        }));

        // Anti-Deadlock RNF-003: Liberación y nueva reserva se ejecutan en un único batch
        // que ordena globalmente por (varianteId ASC, ubicacionId ASC) previniendo deadlocks entre sedes cruzadas
        await InventoryLedgerService.registrarMovimientosBatch(tx, [
          ...movimientosLiberacion,
          ...movimientosNuevaReserva,
        ]);

        // Historial de estados
        await tx.historialEstadoPedidoWeb.create({
          data: {
            pedidoId: pedido.id,
            estadoPedido: pedido.estadoPedido,
            estadoPago: pedido.estadoPago,
            usuarioId: user.id,
            observacion: `Reasignado automáticamente a sede ${nuevaSedeElegida.nombre} tras reporte 'No puedo despachar' en ${sedePreviaNombre}. Motivo: ${data.motivo}`,
          },
        });

        // Registro de Auditoría inmutable (RN-GEN-03, RN-AUD-02)
        await tx.registroAuditoria.create({
          data: {
            usuarioId: user.id,
            accion: 'REASIGNACION_PEDIDO_WEB_NO_PUEDO_DESPACHAR',
            entidadTipo: 'PedidoWeb',
            entidadId: String(pedido.id),
            datosMinimos: {
              pedidoId: pedido.id,
              referencia: pedido.referenciaLegible,
              sedePreviaId,
              nuevaSedeId: nuevaSedeElegida.id,
              motivo: data.motivo,
              varianteIdsAfectadas: data.varianteIdsAfectadas,
            },
          },
        });

        const respuesta = {
          ok: true,
          mensaje: `Pedido reasignado exitosamente a la sede ${nuevaSedeElegida.nombre}.`,
          reasignado: true,
          enCustodiaCentral: false,
          pedido: pedidoActualizado,
        };

        // Persistir clave de idempotencia (RN-GEN-08)
        if (idempotencyKey) {
          await tx.registroIdempotencia.create({
            data: {
              idempotencyKey,
              usuarioId: user.id,
              endpoint: `/api/pedidos-web/${pedidoId}/no-puedo-despachar`,
              statusCode: 200,
              responseBody: respuesta,
            },
          });
        }

        return respuesta;
      } else {
        // Caso B: Ninguna otra tienda tiene stock. Asignar custodia forzosa a Bodega Central (CA-62, QA-013)
        if (movimientosLiberacion.length > 0) {
          await InventoryLedgerService.registrarMovimientosBatch(tx, movimientosLiberacion);
        }

        const bodegaCentral = await tx.ubicacion.findFirst({
          where: { tipo: 'CENTRAL', activa: true },
        });

        if (!bodegaCentral) {
          throw AppError.conflict('No existe una Bodega Central activa en el sistema para recibir la custodia.');
        }

        const pedidoActualizado = await tx.pedidoWeb.update({
          where: { id: pedido.id },
          data: {
            ubicacionAsignadaId: bodegaCentral.id,
            tieneIncidenciaStock: true,
            tieneReservaActiva: false,
            version: { increment: 1 },
          },
          include: {
            lineas: true,
            ubicacionAsignada: {
              select: { id: true, nombre: true, tipo: true },
            },
            municipioDestino: {
              select: { codigoDane: true, nombre: true },
            },
            cliente: {
              select: { id: true, nombreCompleto: true, correo: true },
            },
          },
        });

        // Historial de estados
        await tx.historialEstadoPedidoWeb.create({
          data: {
            pedidoId: pedido.id,
            estadoPedido: pedido.estadoPedido,
            estadoPago: pedido.estadoPago,
            usuarioId: user.id,
            observacion: `Asignado en custodia a Bodega Central con incidencia de stock. Ninguna otra sede dispone de stock completo (CA-62). Motivo: ${data.motivo}`,
          },
        });

        // Registro de Auditoría inmutable con alerta para el Administrador (RF-REP-02)
        await tx.registroAuditoria.create({
          data: {
            usuarioId: user.id,
            accion: 'CUSTODIA_CENTRAL_INCIDENCIA_STOCK',
            entidadTipo: 'PedidoWeb',
            entidadId: String(pedido.id),
            datosMinimos: {
              pedidoId: pedido.id,
              referencia: pedido.referenciaLegible,
              sedePreviaId,
              centralId: bodegaCentral.id,
              motivo: data.motivo,
              varianteIdsAfectadas: data.varianteIdsAfectadas,
              alertaAdmin: true,
            },
          },
        });

        const respuesta = {
          ok: true,
          mensaje: `El pedido no pudo ser cubierto por ninguna otra sede y fue asignado en custodia a ${bodegaCentral.nombre} con incidencia de stock (CA-62).`,
          reasignado: false,
          enCustodiaCentral: true,
          pedido: pedidoActualizado,
        };

        // Persistir clave de idempotencia (RN-GEN-08)
        if (idempotencyKey) {
          await tx.registroIdempotencia.create({
            data: {
              idempotencyKey,
              usuarioId: user.id,
              endpoint: `/api/pedidos-web/${pedidoId}/no-puedo-despachar`,
              statusCode: 200,
              responseBody: respuesta,
            },
          });
        }

        return respuesta;
      }
    });
  }
}
