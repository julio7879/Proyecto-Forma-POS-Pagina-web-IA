import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { DiscountEngine, type LineaCalculoDescuento } from './domain/DiscountEngine.js';
import type { CrearPromocionDTO, ValidarCuponDTO } from './descuentos.schema.js';

export class DescuentosService {
  static async listarPromociones() {
    return prisma.promocion.findMany({
      orderBy: { id: 'desc' },
    });
  }

  static async crearPromocion(dto: CrearPromocionDTO) {
    const existe = await prisma.promocion.findUnique({
      where: { codigo: dto.codigo },
    });
    if (existe) {
      throw AppError.conflict(`El código promocional '${dto.codigo}' ya existe.`);
    }

    const ahora = new Date();
    const inicio = dto.fechaInicio ? new Date(dto.fechaInicio) : ahora;
    const fin = dto.fechaFin ? new Date(dto.fechaFin) : new Date(ahora.getTime() + 365 * 24 * 60 * 60 * 1000);

    return prisma.promocion.create({
      data: {
        codigo: dto.codigo,
        nombre: dto.nombre,
        tipo: dto.tipo,
        valor: dto.valor,
        alcance: dto.alcance,
        canalPermitido: dto.canalPermitido,
        minimoCompraCop: dto.minimoCompraCop,
        fechaInicio: inicio,
        fechaFin: fin,
        idsCategoriasElegibles: dto.idsCategoriasElegibles ?? [],
        idsProductosElegibles: dto.idsProductosElegibles ?? [],
        activa: true,
      },
    });
  }

  static async validarCupon(dto: ValidarCuponDTO) {
    const codigoLimpio = dto.codigo.trim().toUpperCase();
    const promo = await prisma.promocion.findUnique({
      where: { codigo: codigoLimpio },
    });

    if (!promo || !promo.activa) {
      throw AppError.notFound(`El cupón '${codigoLimpio}' no existe o no se encuentra activo.`);
    }

    const ahora = new Date();
    if (ahora < promo.fechaInicio) {
      throw AppError.badRequest(`El cupón '${codigoLimpio}' aún no es válido.`);
    }
    if (ahora > promo.fechaFin) {
      throw AppError.badRequest(`El cupón '${codigoLimpio}' ha expirado.`);
    }

    // Verificar canal
    if (promo.canalPermitido !== 'AMBOS' && promo.canalPermitido !== dto.canal) {
      throw AppError.badRequest(
        `El cupón '${codigoLimpio}' solo es válido para compras en canal ${promo.canalPermitido}.`
      );
    }

    // Preparar líneas para DiscountEngine
    const lineasCalculo: LineaCalculoDescuento[] = dto.lineas.map((l) => ({
      id: l.varianteId,
      cantidad: l.cantidad,
      precioUnitarioBaseCop: l.precioUnitarioCop,
      esElegible: true,
    }));

    const subtotal = dto.lineas.reduce(
      (acc, l) => acc + l.cantidad * l.precioUnitarioCop,
      0
    );

    if (promo.minimoCompraCop > 0 && subtotal < promo.minimoCompraCop) {
      throw AppError.badRequest(
        `El cupón requiere una compra mínima de $${promo.minimoCompraCop.toLocaleString(
          'es-CO'
        )} COP. Subtotal actual: $${subtotal.toLocaleString('es-CO')} COP.`
      );
    }

    const tipoCalculo =
      promo.tipo === 'VALOR_FIJO' ? 'VALOR_FIJO' : 'PORCENTAJE';

    const resultado = DiscountEngine.calcular(lineasCalculo, {
      tipo: tipoCalculo,
      valor: promo.valor,
    });

    return {
      ok: true,
      promocion: {
        id: promo.id,
        codigo: promo.codigo,
        nombre: promo.nombre,
        tipo: promo.tipo,
        valor: promo.valor,
      },
      subtotalGeneralCop: resultado.subtotalGeneralCop,
      descuentoTotalAplicadoCop: resultado.descuentoTotalAplicadoCop,
      totalNetoPagarCop: resultado.totalNetoPagarCop,
      lineas: resultado.lineas,
    };
  }
}
