import { z } from 'zod';

const INT32_MAX = 2_147_483_647;

export const lineaDevolucionPosSchema = z.object({
  lineaVentaOriginalId: z.number().int().positive('lineaVentaOriginalId inválido'),
  varianteId: z.number().int().positive('varianteId inválido'),
  cantidadDevuelta: z
    .number()
    .int()
    .positive('La cantidad a devolver debe ser mayor a 0')
    .max(INT32_MAX, 'La cantidad excede el límite permitido'),
  condicionFisica: z.enum(['VENDIBLE', 'NO_VENDIBLE']),
});

export const registrarDevolucionPosSchema = z
  .object({
    ventaOriginalId: z.number().int().positive('ventaOriginalId inválido'),
    lineas: z
      .array(lineaDevolucionPosSchema)
      .min(1, 'Debe especificar al menos una línea a devolver'),
    medioReembolso: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
    esExcepcionIliquidezCaja: z.boolean().default(false),
    referenciaReembolsoTransf: z.string().trim().max(100).optional(),
    observacion: z.string().trim().max(255).optional(),
    autorizadoFueraPlazoPorId: z.number().int().positive().optional(),
    motivoFueraPlazo: z.string().trim().max(255).optional(),
  })
  .refine(
    (data) => {
      if (data.medioReembolso === 'TRANSFERENCIA' || data.esExcepcionIliquidezCaja) {
        return Boolean(data.referenciaReembolsoTransf && data.referenciaReembolsoTransf.length >= 3);
      }
      return true;
    },
    { message: 'El reembolso por TRANSFERENCIA exige código o referencia bancaria (CA-54).' }
  );

export const lineaNuevaCambioSchema = z.object({
  varianteId: z.number().int().positive('varianteId inválido'),
  cantidad: z
    .number()
    .int()
    .positive('La cantidad debe ser mayor a 0')
    .max(INT32_MAX, 'La cantidad excede el límite permitido'),
});

export const registrarCambioPosSchema = z.object({
  ventaOriginalId: z.number().int().positive('ventaOriginalId inválido'),
  lineasDevueltas: z
    .array(lineaDevolucionPosSchema)
    .min(1, 'Debe especificar al menos una prenda a devolver en el cambio'),
  lineasNuevas: z
    .array(lineaNuevaCambioSchema)
    .min(1, 'Debe especificar al menos una prenda nueva para el cambio'),
  pagosExcedente: z
    .array(
      z.object({
        metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
        montoCop: z.number().int().positive(),
        montoRecibidoEfectivoCop: z.number().int().optional(),
        referenciaTransferencia: z.string().trim().optional(),
      })
    )
    .optional(),
  medioReembolsoDiferencia: z.enum(['EFECTIVO', 'TRANSFERENCIA']).optional(),
  referenciaReembolsoTransf: z.string().trim().max(100).optional(),
  observacion: z.string().trim().max(255).optional(),
  autorizadoFueraPlazoPorId: z.number().int().positive().optional(),
  motivoFueraPlazo: z.string().trim().max(255).optional(),
});

export const anularVentaPosSchema = z.object({
  motivo: z.string().trim().min(3, 'Debe indicar el motivo de la anulación').max(255),
});

export const listarDevolucionesQuerySchema = z.object({
  ubicacionId: z.coerce.number().int().positive().optional(),
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
  numeroComprobante: z.coerce.number().int().positive().optional(),
});

export const devolucionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type LineaDevolucionPosInput = z.infer<typeof lineaDevolucionPosSchema>;
export type RegistrarDevolucionPosInput = z.infer<typeof registrarDevolucionPosSchema>;
export type RegistrarCambioPosInput = z.infer<typeof registrarCambioPosSchema>;
export type AnularVentaPosInput = z.infer<typeof anularVentaPosSchema>;
export type ListarDevolucionesQuery = z.infer<typeof listarDevolucionesQuerySchema>;
