import type { CanalVenta } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { DiscountEngine, type ResultadoCalculoDescuento, type SolicitudDescuento } from './domain/DiscountEngine.js';
import type {
    CalcularDescuentoCarritoInput,
    CrearPromocionInput,
    LineaCarritoInput,
    ValidarCuponInput,
} from './descuento.schema.js';

/** Subconjunto del usuario autenticado que necesita el módulo (desacoplado de Express). */
export interface UsuarioAuthDescuento {
    id: number;
    rol: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
    topeDescuentoPorc: number;
    permisos: { permDescuentoManual: boolean };
}

export interface DesgloseDescuentoCarrito extends ResultadoCalculoDescuento {
    costoEnvioCop: number;
    /** totalNetoPagarCop (mercancía) + flete. El flete nunca se descuenta (RN-DES-07, CA-25). */
    totalFinalPagarCop: number;
    cupon?: { codigo: string; nombre: string; tipo: string; valor: number; alcance: string };
    descuentoManual?: { tipo: string; valor: number; motivo: string };
}

function normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
}

export class DescuentoService {
    static async crearPromocion(data: CrearPromocionInput, usuarioId: number) {
        return prisma.$transaction(async (tx) => {
            const codigo = normalizarCodigo(data.codigo);

            const existente = await tx.promocion.findUnique({ where: { codigo } });
            if (existente) throw AppError.conflict('Ya existe una promoción con ese código');

            const creada = await tx.promocion.create({ data: { ...data, codigo } });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'CREAR_PROMOCION',
                    entidadTipo: 'Promocion',
                    entidadId: String(creada.id),
                    datosMinimos: { codigo: creada.codigo, tipo: creada.tipo, valor: creada.valor },
                },
            });

            return creada;
        });
    }

    static async listarPromociones(filtros?: { activa?: boolean | undefined; canal?: CanalVenta | undefined }) {
        return prisma.promocion.findMany({
            where: {
                ...(filtros?.activa !== undefined && { activa: filtros.activa }),
                ...(filtros?.canal !== undefined && { canalPermitido: filtros.canal }),
            },
            orderBy: { id: 'desc' },
        });
    }

    /** RN-GEN-07 / CA-24: las promociones no se borran; se desactivan. */
    static async desactivarPromocion(id: number, usuarioId: number) {
        return prisma.$transaction(async (tx) => {
            const promocion = await tx.promocion.findUnique({ where: { id } });
            if (!promocion) throw AppError.notFound('Promoción no encontrada');
            if (!promocion.activa) return promocion; // idempotente: sin auditoría duplicada

            const actualizada = await tx.promocion.update({ where: { id }, data: { activa: false } });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'DESACTIVAR_PROMOCION',
                    entidadTipo: 'Promocion',
                    entidadId: String(id),
                    datosMinimos: { codigo: promocion.codigo },
                },
            });

            return actualizada;
        });
    }

    /** RF-DES-02: valida el cupón contra BD y aplica el prorrateo canónico sobre líneas elegibles. */
    static async validarYAplicarCupon(
        input: Pick<ValidarCuponInput, 'codigo' | 'canal' | 'lineas'> & { costoEnvioCop?: number | undefined },
        _usuarioAuth?: UsuarioAuthDescuento,
    ): Promise<DesgloseDescuentoCarrito> {
        const codigo = normalizarCodigo(input.codigo);
        const costoEnvioCop = input.costoEnvioCop ?? 0;

        const promocion = await prisma.promocion.findUnique({ where: { codigo } });
        if (!promocion) throw AppError.notFound('Cupón de descuento no válido o inexistente');
        if (!promocion.activa) throw AppError.badRequest('El cupón se encuentra inactivo');

        // RN-GEN-05: se comparan instantes absolutos; la hora legal de Colombia (UTC-5) no usa DST.
        const ahora = new Date();
        if (ahora < promocion.fechaInicio || ahora > promocion.fechaFin) {
            throw AppError.badRequest('El cupón no se encuentra vigente');
        }

        if (promocion.canalPermitido !== 'AMBOS' && promocion.canalPermitido !== input.canal) {
            throw AppError.badRequest('Cupón no aplicable para este canal de venta');
        }

        const categorias = new Set(promocion.idsCategoriasElegibles);
        const productos = new Set(promocion.idsProductosElegibles);
        const esElegible = (l: LineaCarritoInput): boolean => {
            if (promocion.alcance === 'CATEGORIAS') return l.categoriaId !== undefined && categorias.has(l.categoriaId);
            if (promocion.alcance === 'PRODUCTOS') return l.productoId !== undefined && productos.has(l.productoId);
            return true;
        };

        const lineasCalculo = input.lineas.map((l) => ({
            id: l.id,
            cantidad: l.cantidad,
            precioUnitarioBaseCop: l.precioUnitarioBaseCop,
            esElegible: esElegible(l),
        }));

        const subtotalElegible = lineasCalculo
            .filter((l) => l.esElegible)
            .reduce((acc, l) => acc + l.precioUnitarioBaseCop * l.cantidad, 0);

        if (subtotalElegible === 0) {
            throw AppError.badRequest('Ningún producto del carrito aplica para este cupón');
        }
        if (subtotalElegible < promocion.minimoCompraCop) {
            throw AppError.badRequest(
                `El subtotal de productos elegibles ($${subtotalElegible} COP) no alcanza el monto mínimo de compra requerido ($${promocion.minimoCompraCop} COP)`,
            );
        }

        // Se lee como string para no depender del tipo exacto que Prisma genera para el enum.
        const tipoPromocion = String(promocion.tipo);
        if (tipoPromocion !== 'PORCENTAJE' && tipoPromocion !== 'VALOR_FIJO') {
            throw AppError.badRequest(`Tipo de promoción no soportado: ${tipoPromocion}`);
        }

        // El cupón no es un descuento manual: no está sujeto al tope porcentual del vendedor.
        const resultado = DiscountEngine.calcular(lineasCalculo, {
            tipo: tipoPromocion,
            valor: promocion.valor,
            esAdmin: true,
        });

        return {
            ...resultado,
            costoEnvioCop,
            totalFinalPagarCop: resultado.totalNetoPagarCop + costoEnvioCop,
            cupon: {
                codigo: promocion.codigo,
                nombre: promocion.nombre,
                tipo: promocion.tipo,
                valor: promocion.valor,
                alcance: promocion.alcance,
            },
        };
    }

    static async calcularDescuentoCarrito(
        input: CalcularDescuentoCarritoInput,
        usuarioAuth?: UsuarioAuthDescuento,
    ): Promise<DesgloseDescuentoCarrito> {
        const costoEnvioCop = input.costoEnvioCop ?? 0;

        // RN-DES-04 / CA-22
        if (input.codigoCupon !== undefined && input.descuentoManual !== undefined) {
            throw AppError.badRequest('No se permite acumular cupones con descuentos manuales (RN-DES-04).');
        }

        if (input.descuentoManual !== undefined) {
            const manual = input.descuentoManual;

            // RN-DES-05: solo mostrador POS
            if (input.canal === 'WEB') {
                throw AppError.badRequest('Los descuentos manuales solo están permitidos en mostrador POS.');
            }
            if (!usuarioAuth) throw AppError.unauthorized('Se requiere autenticación para aplicar descuentos manuales');

            let solicitud: SolicitudDescuento;
            if (usuarioAuth.rol === 'ADMIN') {
                solicitud = { tipo: manual.tipo, valor: manual.valor, motivo: manual.motivo, esAdmin: true };
            } else if (usuarioAuth.rol === 'VENDEDOR') {
                // RN-ROL-03 / CA-23
                if (!usuarioAuth.permisos.permDescuentoManual) {
                    throw AppError.forbidden('No tiene permiso para aplicar descuentos manuales (permDescuentoManual)');
                }
                solicitud = {
                    tipo: manual.tipo,
                    valor: manual.valor,
                    motivo: manual.motivo,
                    esAdmin: false,
                    topeMaximoPorcentaje: usuarioAuth.topeDescuentoPorc,
                };
            } else {
                throw AppError.forbidden('Su rol no permite aplicar descuentos manuales');
            }

            const lineas = input.lineas.map((l) => ({
                id: l.id,
                cantidad: l.cantidad,
                precioUnitarioBaseCop: l.precioUnitarioBaseCop,
                esElegible: true,
            }));
            const resultado = DiscountEngine.calcular(lineas, solicitud);

            return {
                ...resultado,
                costoEnvioCop,
                totalFinalPagarCop: resultado.totalNetoPagarCop + costoEnvioCop,
                descuentoManual: { tipo: manual.tipo, valor: manual.valor, motivo: manual.motivo },
            };
        }

        if (input.codigoCupon !== undefined) {
            return DescuentoService.validarYAplicarCupon(
                { codigo: input.codigoCupon, canal: input.canal, lineas: input.lineas, costoEnvioCop },
                usuarioAuth,
            );
        }

        const sinDescuento = DiscountEngine.calcular(
            input.lineas.map((l) => ({
                id: l.id,
                cantidad: l.cantidad,
                precioUnitarioBaseCop: l.precioUnitarioBaseCop,
                esElegible: true,
            })),
        );
        return {
            ...sinDescuento,
            costoEnvioCop,
            totalFinalPagarCop: sinDescuento.subtotalGeneralCop + costoEnvioCop,
        };
    }
}