import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { InventoryLedgerService } from './InventoryLedgerService.js';
import type {
  ListarInventarioQuery,
  IngresoProduccionDTO,
  KardexQuery,
  AjusteStockDTO,
} from './inventario.schema.js';

export class InventarioService {
  /**
   * Consulta saldos de inventario con desglose físico, disponible, reservas y sede.
   */
  static async listarInventario(filtros: ListarInventarioQuery) {
    const { categoria, sku, ubicacionId, stockBajo, limite = 500, offset = 0 } = filtros;

    const where: any = {
      variante: {
        activa: true,
      },
    };

    if (ubicacionId) {
      where.ubicacionId = ubicacionId;
    }

    if (sku && sku.trim().length > 0) {
      where.variante = {
        ...where.variante,
        OR: [
          { sku: { contains: sku.trim(), mode: 'insensitive' } },
          { producto: { nombre: { contains: sku.trim(), mode: 'insensitive' } } },
        ],
      };
    }

    if (categoria && categoria.trim().length > 0 && categoria !== 'todas' && categoria !== 'all') {
      where.variante = {
        ...where.variante,
        producto: {
          ...where.variante?.producto,
          categoria: {
            nombre: { equals: categoria.trim(), mode: 'insensitive' },
          },
        },
      };
    }

    const saldos = await prisma.saldoStock.findMany({
      where,
      include: {
        ubicacion: {
          select: { id: true, nombre: true, tipo: true },
        },
        variante: {
          select: {
            id: true,
            sku: true,
            talla: true,
            color: true,
            umbralStockBajo: true,
            precioVentaCop: true,
            producto: {
              select: {
                id: true,
                nombre: true,
                categoria: { select: { id: true, nombre: true } },
              },
            },
          },
        },
      },
      take: Math.min(limite, 1000),
      skip: offset,
      orderBy: [{ ubicacionId: 'asc' }, { varianteId: 'asc' }],
    });

    // Mapear al DTO consumido por el frontend
    const mapeados = saldos.map((s) => {
      const disponible = Math.max(0, s.fisico - s.reservadoBlando - s.reservadoDuro);
      const umbralStockBajo = s.variante.umbralStockBajo ?? 3;
      return {
        id: s.id,
        varianteId: s.variante.id,
        sku: s.variante.sku,
        nombreProducto: `${s.variante.producto.nombre} (${s.variante.talla}/${s.variante.color})`,
        talla: s.variante.talla,
        color: s.variante.color,
        categoriaNombre: s.variante.producto.categoria.nombre,
        sedeId: s.ubicacion.id,
        sedeNombre: s.ubicacion.nombre,
        fisico: s.fisico,
        disponible,
        reservadoBlando: s.reservadoBlando,
        reservadoDuro: s.reservadoDuro,
        noVendible: s.noVendible,
        umbralStockBajo,
        precioVentaCop: s.variante.precioVentaCop,
      };
    });

    if (stockBajo) {
      return mapeados.filter((item) => item.disponible <= item.umbralStockBajo);
    }

    return mapeados;
  }

  /**
   * Ingreso directo de producción artesanal al almacén central.
   */
  static async ingresoProduccion(usuarioId: number, dto: IngresoProduccionDTO) {
    return prisma.$transaction(async (tx) => {
      // 1. Obtener la ubicación de Bodega Central si no se especificó
      let ubicacionId = dto.ubicacionId;
      if (!ubicacionId) {
        const central = await tx.ubicacion.findFirst({
          where: { tipo: 'CENTRAL', activa: true },
        });
        if (!central) {
          throw AppError.notFound('No se encontró una Bodega Central activa');
        }
        ubicacionId = central.id;
      }

      // 2. Verificar variante
      const variante = await tx.variante.findUnique({
        where: { id: dto.varianteId },
        include: { producto: true },
      });
      if (!variante) {
        throw AppError.notFound(`Variante #${dto.varianteId} no encontrada`);
      }

      // 3. Registrar movimiento en Kardex
      const res = await InventoryLedgerService.registrarMovimiento(tx, {
        tipo: 'CARGA_INICIAL',
        ubicacionId,
        varianteId: dto.varianteId,
        cantidadConSigno: dto.cantidad,
        afectaSaldo: 'FISICO',
        documentoTipo: 'AJUSTE',
        documentoId: 0,
        usuarioId,
        motivo:
          dto.motivo?.trim() ||
          `Ingreso de producción: ${variante.producto.nombre} (${variante.talla}/${variante.color})`,
        autoCrearSiNoExiste: true,
      });

      return {
        ok: true,
        mensaje: `Ingreso de ${dto.cantidad} unidades registrado exitosamente en Kardex.`,
        movimientoId: String(res.id),
        saldoFisicoResultante: res.saldoResultante,
        disponibleResultante: res.disponibleResultante,
      };
    });
  }

  /**
   * Historial inmutable de movimientos Kardex para auditoría y trazabilidad.
   */
  static async listarKardex(filtros: KardexQuery) {
    const { ubicacionId, varianteId, tipo, desde, hasta, limite = 100 } = filtros;

    const where: any = {};
    if (ubicacionId) where.ubicacionId = ubicacionId;
    if (varianteId) where.varianteId = varianteId;
    if (tipo) where.tipo = tipo;
    if (desde || hasta) {
      where.fechaHora = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      };
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        ubicacion: { select: { id: true, nombre: true } },
        variante: {
          select: {
            id: true,
            sku: true,
            talla: true,
            color: true,
            producto: { select: { nombre: true } },
          },
        },
        usuario: { select: { id: true, nombreCompleto: true, correo: true } },
      },
      orderBy: { fechaHora: 'desc' },
      take: Math.min(limite, 200),
    });

    return movimientos.map((m) => ({
      id: String(m.id),
      fechaHora: m.fechaHora.toISOString(),
      tipo: m.tipo,
      afectaSaldo: m.afectaSaldo,
      cantidadConSigno: m.cantidadConSigno,
      saldoResultante: m.saldoResultante,
      documentoTipo: m.documentoTipo,
      documentoId: m.documentoId,
      motivo: m.motivo,
      sedeId: m.ubicacion.id,
      sedeNombre: m.ubicacion.nombre,
      sku: m.variante.sku,
      nombrePrenda: `${m.variante.producto.nombre} (${m.variante.talla}/${m.variante.color})`,
      usuarioNombre: m.usuario.nombreCompleto,
    }));
  }

  /**
   * Ajuste manual de inventario (solo ADMIN).
   */
  static async ajusteStock(usuarioId: number, dto: AjusteStockDTO) {
    return prisma.$transaction(async (tx) => {
      const tipo =
        dto.cantidadConSigno > 0
          ? 'AJUSTE_POSITIVO_FISICO'
          : 'AJUSTE_NEGATIVO_FISICO';

      const res = await InventoryLedgerService.registrarMovimiento(tx, {
        tipo,
        ubicacionId: dto.ubicacionId,
        varianteId: dto.varianteId,
        cantidadConSigno: dto.cantidadConSigno,
        afectaSaldo: 'FISICO',
        documentoTipo: 'AJUSTE',
        documentoId: 0,
        usuarioId,
        motivo: dto.motivo,
      });

      return {
        ok: true,
        mensaje: 'Ajuste de inventario aplicado exitosamente.',
        saldoFisicoResultante: res.saldoResultante,
        disponibleResultante: res.disponibleResultante,
      };
    });
  }
}
