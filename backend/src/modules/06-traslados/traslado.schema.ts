import { z } from 'zod';

export const lineaSolicitudSchema = z.object({
  varianteId: z.number().int().positive('El id de la variante debe ser un entero positivo'),
  cantidadSolicitada: z.number().int().positive('La cantidad solicitada debe ser mayor a 0'),
});

export const solicitarTrasladoSchema = z
  .object({
    ubicacionDestinoId: z.number().int().positive('El id de la ubicación destino debe ser un entero positivo'),
    esEnvioDirecto: z.boolean().optional().default(false),
    lineas: z.array(lineaSolicitudSchema).min(1, 'El traslado debe contener al menos una línea'),
  })
  .refine(
    (data) => {
      const ids = data.lineas.map((l) => l.varianteId);
      return new Set(ids).size === ids.length;
    },
    { message: 'No se permiten variantes duplicadas en la solicitud de traslado', path: ['lineas'] }
  );

export const lineaEvaluacionSchema = z.object({
  lineaId: z.number().int().positive('El id de la línea debe ser un entero positivo'),
  cantidadAprobada: z.number().int().min(0, 'La cantidad aprobada no puede ser negativa'),
});

export const evaluarTrasladoSchema = z
  .object({
    accion: z.enum(['APROBAR', 'RECHAZAR']),
    motivoRechazo: z.string().trim().min(3, 'El motivo de rechazo debe contener al menos 3 caracteres').optional(),
    version: z.number().int().positive().optional(),
    lineas: z.array(lineaEvaluacionSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.accion === 'RECHAZAR') {
        return !!data.motivoRechazo && data.motivoRechazo.trim().length >= 3;
      }
      return true;
    },
    { message: 'El motivo de rechazo es obligatorio para rechazar un traslado', path: ['motivoRechazo'] }
  )
  .refine(
    (data) => {
      if (!data.lineas || data.lineas.length === 0) return true;
      const ids = data.lineas.map((l) => l.lineaId);
      return new Set(ids).size === ids.length;
    },
    { message: 'No se permiten lineas duplicadas en la evaluación del traslado', path: ['lineas'] }
  );

export const lineaDespachoSchema = z.object({
  lineaId: z.number().int().positive('El id de la línea debe ser un entero positivo'),
  cantidadEnviada: z.number().int().positive('La cantidad enviada debe ser mayor a 0'),
});

export const despacharTrasladoSchema = z
  .object({
    version: z.number().int().positive().optional(),
    lineas: z.array(lineaDespachoSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.lineas || data.lineas.length === 0) return true;
      const ids = data.lineas.map((l) => l.lineaId);
      return new Set(ids).size === ids.length;
    },
    { message: 'No se permiten lineas duplicadas en el despacho del traslado', path: ['lineas'] }
  );

export const cancelarTrasladoSchema = z.object({
  motivo: z.string().trim().min(5, 'El motivo de cancelación debe tener al menos 5 caracteres'),
  version: z.number().int().positive().optional(),
});

export const confirmarRetornoSchema = z.object({
  observacion: z.string().trim().optional(),
  version: z.number().int().positive().optional(),
});

export const trasladoIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El parámetro id debe ser un entero positivo'),
});

export const listarTrasladosQuerySchema = z.object({
  ubicacionOrigenId: z.coerce.number().int().positive().optional(),
  ubicacionDestinoId: z.coerce.number().int().positive().optional(),
  estado: z
    .enum([
      'SOLICITADO',
      'APROBADO',
      'ENVIADO',
      'RETORNANDO_A_CENTRAL',
      'RECIBIDO',
      'RECIBIDO_CON_NOVEDAD',
      'CERRADO',
      'RECHAZADO',
      'CANCELADO',
    ])
    .optional(),
  esEnvioDirecto: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return val;
    }, z.boolean().optional())
    .optional(),
});

export type SolicitarTrasladoInput = z.infer<typeof solicitarTrasladoSchema>;
export type EvaluarTrasladoInput = z.infer<typeof evaluarTrasladoSchema>;
export type DespacharTrasladoInput = z.infer<typeof despacharTrasladoSchema>;
export type CancelarTrasladoInput = z.infer<typeof cancelarTrasladoSchema>;
export type ConfirmarRetornoInput = z.infer<typeof confirmarRetornoSchema>;
export type ListarTrasladosQuery = z.infer<typeof listarTrasladosQuerySchema>;
