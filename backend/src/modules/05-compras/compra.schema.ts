import { z } from 'zod';

// Límite de columnas INT (32 bits) de PostgreSQL: evita que un valor desbordado llegue a la BD como 500.
const INT32_MAX = 2_147_483_647;

export const lineaCompraSchema = z.object({
    varianteId: z.number().int().positive('varianteId inválido'),
    cantidadPedida: z
        .number()
        .int()
        .positive('La cantidad pedida debe ser mayor a 0')
        .max(INT32_MAX, 'La cantidad pedida excede el límite admitido'),
    // RN-GEN-04 / RN-COM-04: costo opcional en el MVP; si viene, es entero COP >= 0
    costoUnitarioCop: z
        .number()
        .int()
        .min(0, 'Costo unitario debe ser entero >= 0')
        .max(INT32_MAX, 'El costo unitario excede el límite admitido')
        .optional(),
});

export const crearCompraSchema = z.object({
    proveedorNombre: z.string().trim().min(2, 'Nombre de proveedor requerido').max(150),
    proveedorContacto: z.string().trim().max(100).optional(),
    notas: z.string().trim().max(500).optional(),
    lineas: z.array(lineaCompraSchema).min(1, 'La orden de compra debe contener al menos una línea'),
});

export const lineaRecepcionSchema = z.object({
    lineaId: z.number().int().positive('lineaId inválido'),
    cantidadRecibida: z
        .number()
        .int()
        .min(0, 'La cantidad recibida debe ser >= 0')
        .max(INT32_MAX, 'La cantidad recibida excede el límite admitido'),
    observacionDiferencia: z.string().trim().max(255).optional(),
});

// Si `lineas` no viene en el body, se asume recepción del 100% de cantidadPedida en cada línea.
export const recibirCompraSchema = z.object({
    lineas: z
        .array(lineaRecepcionSchema)
        .min(1, 'Debe especificar las cantidades a recibir')
        .refine((lineas) => new Set(lineas.map((l) => l.lineaId)).size === lineas.length, {
            message: 'No se permiten líneas duplicadas en la recepción de la compra',
        })
        .optional(),
});

export const cancelarCompraSchema = z.object({
    motivo: z.string().trim().max(255).optional(),
});

export const compraIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const listarComprasQuerySchema = z.object({
    estado: z.enum(['PEDIDA', 'RECIBIDA', 'CANCELADA']).optional(),
    desde: z.string().datetime().optional(),
    hasta: z.string().datetime().optional(),
});

export type CrearCompraInput = z.infer<typeof crearCompraSchema>;
export type RecibirCompraInput = z.infer<typeof recibirCompraSchema>;
export type CancelarCompraInput = z.infer<typeof cancelarCompraSchema>;
export type ListarComprasQuery = z.infer<typeof listarComprasQuerySchema>;