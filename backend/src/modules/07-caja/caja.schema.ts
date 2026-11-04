import { z } from 'zod';

const INT32_MAX = 2_147_483_647;

export const aperturaCajaSchema = z.object({
  ubicacionId: z.number().int().positive('ubicacionId inválido'),
  baseContadaCop: z
    .number()
    .int()
    .min(0, 'La base contada debe ser un entero >= 0')
    .max(INT32_MAX, 'La base contada excede el límite permitido'),
  observacionApertura: z.string().trim().max(255).optional(),
}).refine(
  (data) => {
    // Si la base contada difiere de $200.000 COP (default del sistema), se recomienda observación
    return true;
  }
);

export const movimientoCajaSchema = z.object({
  sesionCajaId: z.number().int().positive('sesionCajaId inválido'),
  tipo: z.enum(['SANGRIA_RETIRO', 'GASTO_MENOR', 'INGRESO_MANUAL']),
  montoCop: z
    .number()
    .int()
    .positive('El monto debe ser un entero positivo en COP (RN-GEN-04)')
    .max(INT32_MAX, 'El monto excede el límite admitido'),
  concepto: z.string().trim().min(3, 'Concepto requerido').max(255),
  comprobanteSoporte: z.string().trim().max(100).optional(),
});

export const relevoTurnoCajaSchema = z.object({
  sesionCajaId: z.number().int().positive('sesionCajaId inválido'),
  cajeroEntranteId: z.number().int().positive('cajeroEntranteId inválido'),
  efectivoContadoCop: z
    .number()
    .int()
    .min(0, 'El conteo de efectivo debe ser >= 0')
    .max(INT32_MAX, 'El conteo de efectivo excede el límite permitido'),
  observacion: z.string().trim().max(255).optional(),
});

export const cierreCajaSchema = z.object({
  sesionCajaId: z.number().int().positive('sesionCajaId inválido'),
  efectivoContadoCierreCop: z
    .number()
    .int()
    .min(0, 'El efectivo contado en cierre debe ser >= 0')
    .max(INT32_MAX, 'El conteo excede el límite permitido'),
  observacionCierre: z.string().trim().max(255).optional(),
});

export const sesionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listarSesionesQuerySchema = z.object({
  ubicacionId: z.coerce.number().int().positive().optional(),
  estado: z.enum(['ABIERTA', 'CERRADA']).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha YYYY-MM-DD inválido').optional(),
});

export type AperturaCajaInput = z.infer<typeof aperturaCajaSchema>;
export type MovimientoCajaInput = z.infer<typeof movimientoCajaSchema>;
export type RelevoTurnoCajaInput = z.infer<typeof relevoTurnoCajaSchema>;
export type CierreCajaInput = z.infer<typeof cierreCajaSchema>;
export type ListarSesionesQuery = z.infer<typeof listarSesionesQuerySchema>;
