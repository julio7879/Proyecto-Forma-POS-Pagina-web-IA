import { z } from 'zod';

const INT32_MAX = 2_147_483_647;

const tipoDescuentoEnum = z.enum(['PORCENTAJE', 'VALOR_FIJO']);

// RN-GEN-04: todo monto es entero en COP, sin decimales
const lineaCarritoSchema = z.object({
    id: z.union([z.string(), z.number()]),
    varianteId: z.number().int().positive().optional(),
    productoId: z.number().int().positive().optional(),
    categoriaId: z.number().int().positive().optional(),
    cantidad: z.number().int().positive().max(INT32_MAX),
    precioUnitarioBaseCop: z.number().int().min(0).max(INT32_MAX),
});

export const crearPromocionSchema = z
    .object({
        codigo: z.string().trim().toUpperCase().min(3).max(30),
        nombre: z.string().trim().min(3).max(100),
        tipo: tipoDescuentoEnum,
        valor: z.number().int().positive().max(INT32_MAX),
        alcance: z.enum(['TODA_LA_COMPRA', 'CATEGORIAS', 'PRODUCTOS']),
        idsCategoriasElegibles: z.array(z.number().int().positive()).default([]),
        idsProductosElegibles: z.array(z.number().int().positive()).default([]),
        canalPermitido: z.enum(['POS', 'WEB', 'AMBOS']),
        minimoCompraCop: z.number().int().min(0).max(INT32_MAX).default(0),
        fechaInicio: z.coerce.date(),
        fechaFin: z.coerce.date(),
    })
    .refine((p) => p.tipo !== 'PORCENTAJE' || p.valor <= 100, {
        message: 'Un descuento porcentual no puede superar el 100%',
        path: ['valor'],
    })
    .refine((p) => p.fechaFin > p.fechaInicio, {
        message: 'fechaFin debe ser posterior a fechaInicio',
        path: ['fechaFin'],
    })
    .refine((p) => p.alcance !== 'CATEGORIAS' || p.idsCategoriasElegibles.length > 0, {
        message: 'El alcance CATEGORIAS exige al menos una categoría elegible',
        path: ['idsCategoriasElegibles'],
    })
    .refine((p) => p.alcance !== 'PRODUCTOS' || p.idsProductosElegibles.length > 0, {
        message: 'El alcance PRODUCTOS exige al menos un producto elegible',
        path: ['idsProductosElegibles'],
    });

export const validarCuponSchema = z.object({
    codigo: z.string().trim().toUpperCase().min(1),
    canal: z.enum(['POS', 'WEB']),
    costoEnvioCop: z.number().int().min(0).max(INT32_MAX).optional().default(0),
    lineas: z.array(lineaCarritoSchema).min(1, 'El carrito debe contener al menos un producto'),
});

export const calcularDescuentoCarritoSchema = z
    .object({
        canal: z.enum(['POS', 'WEB']),
        codigoCupon: z.string().trim().toUpperCase().min(1).optional(),
        descuentoManual: z
            .object({
                tipo: tipoDescuentoEnum,
                valor: z.number().int().positive().max(INT32_MAX),
                motivo: z.string().trim().min(3, 'Motivo de descuento requerido'),
            })
            .optional(),
        costoEnvioCop: z.number().int().min(0).max(INT32_MAX).optional().default(0),
        lineas: z.array(lineaCarritoSchema).min(1),
    })
    // RN-DES-04 / CA-22: máximo un descuento por operación
    .refine((d) => !(d.codigoCupon !== undefined && d.descuentoManual !== undefined), {
        message: 'No se permite acumular cupones con descuentos manuales (RN-DES-04).',
        path: ['descuentoManual'],
    });

export const listarPromocionesQuerySchema = z.object({
    activa: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
    canal: z.enum(['POS', 'WEB', 'AMBOS']).optional(),
});

export const promocionIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export type CrearPromocionInput = z.infer<typeof crearPromocionSchema>;
export type ValidarCuponInput = z.infer<typeof validarCuponSchema>;
export type CalcularDescuentoCarritoInput = z.infer<typeof calcularDescuentoCarritoSchema>;
export type ListarPromocionesQuery = z.infer<typeof listarPromocionesQuerySchema>;
export type LineaCarritoInput = z.infer<typeof lineaCarritoSchema>;