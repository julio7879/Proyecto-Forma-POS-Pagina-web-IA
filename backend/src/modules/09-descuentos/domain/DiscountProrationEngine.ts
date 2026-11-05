/**
 * Alias canónico del motor de prorrateo exacto (Issue #79 / SP3-03).
 *
 * Unifica el nombre `DiscountProrationEngine` con el `DiscountEngine` existente para no duplicar
 * lógica: prorrateo con piso + residuo a la última línea elegible (RN-DES-09, CA-20/21),
 * validación de enteros COP (RN-GEN-04) y truncado al subtotal elegible (RN-DES-07, CA-25).
 */
export { DiscountEngine as DiscountProrationEngine } from './DiscountEngine.js';
export type {
    LineaCalculoDescuento,
    LineaCalculadaDescuento,
    ResultadoCalculoDescuento,
    SolicitudDescuento,
    TipoDescuento,
} from './DiscountEngine.js';