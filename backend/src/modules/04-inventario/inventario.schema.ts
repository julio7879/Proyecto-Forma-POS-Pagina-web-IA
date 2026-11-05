import { z } from 'zod';

export const listarInventarioQuerySchema = z.object({
  categoria: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  ubicacionId: z.coerce.number().int().positive().optional(),
  stockBajo: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  limite: z.coerce.number().int().positive().max(300).default(150).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const ingresoProduccionSchema = z.object({
  varianteId: z.number().int().positive('Debe seleccionar una variante válida'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  motivo: z.string().trim().max(250).optional(),
  ubicacionId: z.number().int().positive().optional(),
});

export const kardexQuerySchema = z.object({
  ubicacionId: z.coerce.number().int().positive().optional(),
  varianteId: z.coerce.number().int().positive().optional(),
  tipo: z.string().trim().optional(),
  desde: z.string().trim().optional(),
  hasta: z.string().trim().optional(),
  limite: z.coerce.number().int().positive().max(200).default(100).optional(),
});

export const ajusteStockSchema = z.object({
  ubicacionId: z.number().int().positive('Ubicación requerida'),
  varianteId: z.number().int().positive('Variante requerida'),
  cantidadConSigno: z
    .number()
    .int('La cantidad debe ser un número entero')
    .refine((v) => v !== 0, 'El ajuste de stock no puede ser 0'),
  motivo: z.string().trim().min(5, 'Debe especificar un motivo detallado para el ajuste de stock (mínimo 5 caracteres)'),
});

export type ListarInventarioQuery = z.infer<typeof listarInventarioQuerySchema>;
export type IngresoProduccionDTO = z.infer<typeof ingresoProduccionSchema>;
export type KardexQuery = z.infer<typeof kardexQuerySchema>;
export type AjusteStockDTO = z.infer<typeof ajusteStockSchema>;
