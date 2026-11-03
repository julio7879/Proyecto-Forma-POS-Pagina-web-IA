import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { MoneyCOP } from '../../shared/domain/MoneyCOP.js';
import type {
  CrearUbicacionDto,
  ActualizarUbicacionDto,
  DesactivarUbicacionDto,
} from './ubicacion.schema.js';

export class UbicacionService {
  /**
   * Lista todas las ubicaciones registradas con opción de filtrado.
   */
  static async listar(filtros?: { activa?: boolean; tipo?: 'CENTRAL' | 'PUNTO_VENTA' }) {
    const where: any = {};
    if (filtros?.activa !== undefined) {
      where.activa = filtros.activa;
    }
    if (filtros?.tipo) {
      where.tipo = filtros.tipo;
    }

    return prisma.ubicacion.findMany({
      where,
      include: {
        municipio: {
          include: {
            departamento: true,
          },
        },
      },
      orderBy: [{ prioridadDespacho: 'asc' }, { id: 'asc' }],
    });
  }

  /**
   * Obtiene el detalle de una ubicación por ID.
   */
  static async obtenerPorId(id: number) {
    const ubicacion = await prisma.ubicacion.findUnique({
      where: { id },
      include: {
        municipio: {
          include: {
            departamento: true,
          },
        },
      },
    });

    if (!ubicacion) {
      throw AppError.notFound('Ubicación no encontrada');
    }

    return ubicacion;
  }

  /**
   * Crea una nueva ubicación con validación de Bodega Central única (RN-UBI-01) y Dinero Entero COP (RN-GEN-04).
   */
  static async crear(dto: CrearUbicacionDto, adminId?: number) {
    MoneyCOP.assertEnteroNoNegativo(dto.baseCajaCop, 'baseCajaCop');

    // RN-UBI-01: Solo puede existir una Bodega Central en todo el sistema
    if (dto.tipo === 'CENTRAL') {
      const centralExistente = await prisma.ubicacion.findFirst({
        where: { tipo: 'CENTRAL' },
      });
      if (centralExistente) {
        throw AppError.conflict(
          'Ya existe una Bodega Central registrada en el sistema. No se permite crear más de una (RN-UBI-01).'
        );
      }
    }

    // Unicidad de nombre
    const nombreExistente = await prisma.ubicacion.findUnique({
      where: { nombre: dto.nombre },
    });
    if (nombreExistente) {
      throw AppError.conflict(`Ya existe una ubicación con el nombre "${dto.nombre}".`);
    }

    // Verificar existencia del municipio DANE
    const municipio = await prisma.municipioDane.findUnique({
      where: { codigoDane: dto.municipioDaneId },
    });
    if (!municipio) {
      throw AppError.badRequest(
        `El código DANE "${dto.municipioDaneId}" no existe en el catálogo oficial de municipios.`
      );
    }

    const nuevaUbicacion = await prisma.ubicacion.create({
      data: {
        nombre: dto.nombre,
        tipo: dto.tipo,
        municipioDaneId: dto.municipioDaneId,
        direccion: dto.direccion,
        despachaWeb: dto.despachaWeb,
        prioridadDespacho: dto.prioridadDespacho,
        baseCajaCop: dto.baseCajaCop,
        activa: true,
      },
    });

    // Auditoría si aplica (RN-GEN-12)
    if (adminId) {
      await prisma.registroAuditoria.create({
        data: {
          usuarioId: adminId,
          accion: 'CREAR_UBICACION',
          entidadTipo: 'Ubicacion',
          entidadId: String(nuevaUbicacion.id),
          datosMinimos: {
            nombre: nuevaUbicacion.nombre,
            tipo: nuevaUbicacion.tipo,
            municipioDaneId: nuevaUbicacion.municipioDaneId,
          },
        },
      });
    }

    return nuevaUbicacion;
  }

  /**
   * Actualiza datos básicos de una ubicación.
   */
  static async actualizar(id: number, dto: ActualizarUbicacionDto, adminId?: number) {
    const ubicacion = await prisma.ubicacion.findUnique({ where: { id } });
    if (!ubicacion) {
      throw AppError.notFound('Ubicación no encontrada');
    }

    if (dto.baseCajaCop !== undefined) {
      MoneyCOP.assertEnteroNoNegativo(dto.baseCajaCop, 'baseCajaCop');
    }

    // Si intenta cambiar a CENTRAL, validar que no exista otra
    if (dto.tipo === 'CENTRAL' && ubicacion.tipo !== 'CENTRAL') {
      const centralExistente = await prisma.ubicacion.findFirst({
        where: { tipo: 'CENTRAL', id: { not: id } },
      });
      if (centralExistente) {
        throw AppError.conflict(
          'Ya existe otra Bodega Central registrada en el sistema (RN-UBI-01).'
        );
      }
    }

    // Si cambia nombre, verificar unicidad
    if (dto.nombre && dto.nombre !== ubicacion.nombre) {
      const nombreExistente = await prisma.ubicacion.findUnique({
        where: { nombre: dto.nombre },
      });
      if (nombreExistente) {
        throw AppError.conflict(`Ya existe una ubicación con el nombre "${dto.nombre}".`);
      }
    }

    const data: Record<string, any> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.tipo !== undefined) data.tipo = dto.tipo;
    if (dto.municipioDaneId !== undefined) data.municipioDaneId = dto.municipioDaneId;
    if (dto.direccion !== undefined) data.direccion = dto.direccion;
    if (dto.despachaWeb !== undefined) data.despachaWeb = dto.despachaWeb;
    if (dto.prioridadDespacho !== undefined) data.prioridadDespacho = dto.prioridadDespacho;
    if (dto.baseCajaCop !== undefined) data.baseCajaCop = dto.baseCajaCop;

    const actualizada = await prisma.ubicacion.update({
      where: { id },
      data,
    });

    if (adminId) {
      await prisma.registroAuditoria.create({
        data: {
          usuarioId: adminId,
          accion: 'ACTUALIZAR_UBICACION',
          entidadTipo: 'Ubicacion',
          entidadId: String(id),
          datosMinimos: data,
        },
      });
    }

    return actualizada;
  }

  /**
   * Desactivación segura validada de una sede bajo las 5 condiciones atómicas de RN-UBI-05.
   */
  static async desactivar(id: number, dto?: DesactivarUbicacionDto, adminId?: number) {
    return prisma.$transaction(async (tx) => {
      const ubicacion = await tx.ubicacion.findUnique({ where: { id } });
      if (!ubicacion) {
        throw AppError.notFound('Ubicación no encontrada');
      }

      // Idempotencia: Si ya está inactiva, retorna sin error
      if (!ubicacion.activa) {
        return ubicacion;
      }

      // Condición 1 (RN-UBI-05): Bodega Central nunca puede ser desactivada
      if (ubicacion.tipo === 'CENTRAL') {
        throw AppError.unprocessable(
          'La Bodega Central nunca puede ser desactivada por ser el nodo central de compras y custodia (RN-UBI-05 condición 1).'
        );
      }

      // Condición 2 (RN-UBI-05): Saldo físico y no vendible deben ser exactamente 0
      const saldos = await tx.saldoStock.aggregate({
        where: { ubicacionId: id },
        _sum: {
          fisico: true,
          noVendible: true,
        },
      });
      const stockFisico = saldos._sum.fisico ?? 0;
      const stockNoVendible = saldos._sum.noVendible ?? 0;

      if (stockFisico > 0 || stockNoVendible > 0) {
        throw AppError.unprocessable(
          `No se puede desactivar la ubicación porque aún posee stock remanente: ${stockFisico} unidades físicas y ${stockNoVendible} unidades no vendibles. Debe trasladar o dar de baja el stock antes de proceder (RN-UBI-05 condición 2).`
        );
      }

      // Condición 3 (RN-UBI-05): Cero traslados abiertos donde sea origen o destino
      const trasladosAbiertos = await tx.traslado.count({
        where: {
          OR: [{ ubicacionOrigenId: id }, { ubicacionDestinoId: id }],
          estado: { notIn: ['RECIBIDO', 'CANCELADO', 'CERRADO'] },
        },
      });
      if (trasladosAbiertos > 0) {
        throw AppError.unprocessable(
          `No se puede desactivar la ubicación porque tiene ${trasladosAbiertos} traslado(s) inter-sedes abierto(s) o en tránsito (RN-UBI-05 condición 3).`
        );
      }

      // Condición 4 (RN-UBI-05): Cero pedidos web pendientes de despacho o entrega
      const pedidosWebPendientes = await tx.pedidoWeb.count({
        where: {
          ubicacionAsignadaId: id,
          estadoLogistico: { notIn: ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'] },
        },
      });
      if (pedidosWebPendientes > 0) {
        throw AppError.unprocessable(
          `No se puede desactivar la ubicación porque tiene ${pedidosWebPendientes} pedido(s) web asignado(s) pendiente(s) de preparación, despacho o entrega (RN-UBI-05 condición 4).`
        );
      }

      // Condición 5 (RN-UBI-05): Cero sesiones de caja en estado ABIERTA
      const sesionesCajaAbiertas = await tx.sesionCaja.count({
        where: {
          ubicacionId: id,
          estado: 'ABIERTA',
        },
      });
      if (sesionesCajaAbiertas > 0) {
        throw AppError.unprocessable(
          `No se puede desactivar la ubicación porque tiene una sesión de caja ABIERTA actualmente. Debe realizar el arqueo y cierre ciego de caja primero (RN-UBI-05 condición 5).`
        );
      }

      // Ejecutar desactivación lógica (RN-GEN-07)
      const desactivada = await tx.ubicacion.update({
        where: { id },
        data: {
          activa: false,
          despachaWeb: false,
        },
      });

      // Registro inmutable de auditoría (RN-GEN-12)
      if (adminId) {
        await tx.registroAuditoria.create({
          data: {
            usuarioId: adminId,
            accion: 'DESACTIVAR_UBICACION',
            entidadTipo: 'Ubicacion',
            entidadId: String(id),
            datosMinimos: {
              motivo: dto?.motivo || 'Desactivación administrativa de sede física',
              ubicacionNombre: ubicacion.nombre,
              fecha: new Date().toISOString(),
            },
          },
        });
      }

      return desactivada;
    });
  }
}
