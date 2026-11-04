import { MoneyCOP } from '../../../shared/domain/MoneyCOP.js';
import { AppError } from '../../../shared/domain/AppError.js';

export type TipoDescuento = 'PORCENTAJE' | 'VALOR_FIJO';

export interface LineaCalculoDescuento {
  id: string | number;
  cantidad: number;
  precioUnitarioBaseCop: number;
  esElegible: boolean;
}

export interface SolicitudDescuento {
  tipo: TipoDescuento;
  valor: number; // Porcentaje (1 a 100) o Monto Fijo en COP entero
  topeMaximoPorcentaje?: number; // Tope permitido para vendedor en POS (RN-DES-05, CA-23)
  esAdmin?: boolean;
  motivo?: string;
}

export interface LineaCalculadaDescuento {
  id: string | number;
  cantidad: number;
  precioUnitarioBaseCop: number;
  subtotalBaseCop: number;
  esElegible: boolean;
  descuentoProrrateadoCop: number;
  precioNetoTotalCop: number;
}

export interface ResultadoCalculoDescuento {
  subtotalGeneralCop: number;
  subtotalElegibleCop: number;
  descuentoTotalAplicadoCop: number;
  totalNetoPagarCop: number;
  lineas: LineaCalculadaDescuento[];
}

/**
 * Motor Canónico de Descuentos y Prorrateo Exacto (RN-DES-01 a 09, RN-GEN-04, CA-19 a 25)
 * Lógica de dominio pura sin dependencias de Express ni de Prisma.
 */
export class DiscountEngine {
  /**
   * Calcula el desglose y prorrateo exacto de un descuento sobre un conjunto de líneas.
   */
  static calcular(
    lineas: LineaCalculoDescuento[],
    solicitud?: SolicitudDescuento,
  ): ResultadoCalculoDescuento {
    if (!Array.isArray(lineas) || lineas.length === 0) {
      return {
        subtotalGeneralCop: 0,
        subtotalElegibleCop: 0,
        descuentoTotalAplicadoCop: 0,
        totalNetoPagarCop: 0,
        lineas: [],
      };
    }

    // 1. Validar integridad de cada línea (RN-GEN-04: dinero entero en COP)
    for (const linea of lineas) {
      if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) {
        throw AppError.badRequest(`La cantidad de la línea ${linea.id} debe ser un entero positivo.`);
      }
      MoneyCOP.assertEnteroNoNegativo(
        linea.precioUnitarioBaseCop,
        `precioUnitarioBaseCop (línea ${linea.id})`,
      );
    }

    // 2. Calcular subtotales
    const lineasPreparadas = lineas.map((linea) => {
      const subtotalBaseCop = linea.precioUnitarioBaseCop * linea.cantidad;
      return {
        ...linea,
        subtotalBaseCop,
      };
    });

    const subtotalGeneralCop = lineasPreparadas.reduce(
      (acc, l) => acc + l.subtotalBaseCop,
      0,
    );

    const subtotalElegibleCop = lineasPreparadas
      .filter((l) => l.esElegible)
      .reduce((acc, l) => acc + l.subtotalBaseCop, 0);

    // Si no hay solicitud de descuento o el valor es 0, retornar sin descuento
    if (!solicitud || solicitud.valor === 0 || subtotalElegibleCop === 0) {
      const lineasCalculadas: LineaCalculadaDescuento[] = lineasPreparadas.map((l) => ({
        id: l.id,
        cantidad: l.cantidad,
        precioUnitarioBaseCop: l.precioUnitarioBaseCop,
        subtotalBaseCop: l.subtotalBaseCop,
        esElegible: l.esElegible,
        descuentoProrrateadoCop: 0,
        precioNetoTotalCop: l.subtotalBaseCop,
      }));

      return {
        subtotalGeneralCop,
        subtotalElegibleCop,
        descuentoTotalAplicadoCop: 0,
        totalNetoPagarCop: subtotalGeneralCop,
        lineas: lineasCalculadas,
      };
    }

    // 3. Evaluar el descuento solicitado según su tipo
    let descuentoTotalCop = 0;

    if (solicitud.tipo === 'PORCENTAJE') {
      if (
        !Number.isInteger(solicitud.valor) ||
        solicitud.valor <= 0 ||
        solicitud.valor > 100
      ) {
        throw AppError.badRequest(
          `Porcentaje de descuento inválido: ${solicitud.valor}. Debe ser un entero entre 1 y 100.`,
        );
      }

      // Validar tope máximo para vendedor en POS (RN-DES-05, CA-23)
      if (
        !solicitud.esAdmin &&
        solicitud.topeMaximoPorcentaje !== undefined &&
        solicitud.valor > solicitud.topeMaximoPorcentaje
      ) {
        throw AppError.badRequest(
          `El descuento del ${solicitud.valor}% supera el tope máximo permitido (${solicitud.topeMaximoPorcentaje}%) para este usuario.`,
        );
      }

      descuentoTotalCop = MoneyCOP.calcularDescuentoPorcentual(
        subtotalElegibleCop,
        solicitud.valor,
      );
    } else if (solicitud.tipo === 'VALOR_FIJO') {
      MoneyCOP.assertEnteroNoNegativo(solicitud.valor, 'valor (descuento fijo COP)');

      // Validar tope de vendedor para monto fijo (RN-DES-05, CA-23)
      if (
        !solicitud.esAdmin &&
        solicitud.topeMaximoPorcentaje !== undefined
      ) {
        const topeMaximoCop = Math.round(
          (subtotalElegibleCop * solicitud.topeMaximoPorcentaje) / 100,
        );
        if (solicitud.valor > topeMaximoCop) {
          throw AppError.badRequest(
            `El descuento fijo de $${solicitud.valor} COP supera el tope máximo permitido ($${topeMaximoCop} COP, ${solicitud.topeMaximoPorcentaje}%) para este usuario.`,
          );
        }
      }

      // RN-DES-07 / CA-25: Si el descuento fijo supera el subtotal elegible, truncar al subtotal (deja en $0 COP, nunca negativo)
      descuentoTotalCop = Math.min(solicitud.valor, subtotalElegibleCop);
    } else {
      throw AppError.badRequest(`Tipo de descuento desconocido: ${solicitud.tipo}`);
    }

    // 4. Prorrateo canónico sobre líneas elegibles (RN-DES-09, CA-20)
    const indicesElegibles: number[] = [];
    const subtotalesElegibles: number[] = [];

    lineasPreparadas.forEach((l, idx) => {
      if (l.esElegible) {
        indicesElegibles.push(idx);
        subtotalesElegibles.push(l.subtotalBaseCop);
      }
    });

    const prorrateoPartes = MoneyCOP.prorratearDescuentoPorLinea(
      descuentoTotalCop,
      subtotalesElegibles,
    );

    // Mapear el descuento a cada línea
    const mapaDescuentos = new Map<number, number>();
    indicesElegibles.forEach((originalIdx, i) => {
      mapaDescuentos.set(originalIdx, prorrateoPartes[i] ?? 0);
    });

    const lineasCalculadas: LineaCalculadaDescuento[] = lineasPreparadas.map(
      (l, idx) => {
        const descuentoLinea = mapaDescuentos.get(idx) ?? 0;
        const precioNetoTotalCop = Math.max(0, l.subtotalBaseCop - descuentoLinea);

        return {
          id: l.id,
          cantidad: l.cantidad,
          precioUnitarioBaseCop: l.precioUnitarioBaseCop,
          subtotalBaseCop: l.subtotalBaseCop,
          esElegible: l.esElegible,
          descuentoProrrateadoCop: descuentoLinea,
          precioNetoTotalCop,
        };
      },
    );

    const totalDescuentoReal = lineasCalculadas.reduce(
      (acc, l) => acc + l.descuentoProrrateadoCop,
      0,
    );

    const totalNetoPagarCop = Math.max(0, subtotalGeneralCop - totalDescuentoReal);

    return {
      subtotalGeneralCop,
      subtotalElegibleCop,
      descuentoTotalAplicadoCop: totalDescuentoReal,
      totalNetoPagarCop,
      lineas: lineasCalculadas,
    };
  }
}
