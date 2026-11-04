import { z } from 'zod';

export const cotizarFleteSchema = z.object({
  municipioOrigenId: z.string().trim().optional(),
  municipioDestinoId: z.string().trim().min(4, 'El código DANE de municipio destino es requerido'),
});

export const lineaCheckoutSchema = z.object({
  varianteId: z.number().int().positive('El id de la variante debe ser un entero positivo'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
});

export const checkoutWebSchema = z
  .object({
    municipioDestinoId: z.string().trim().min(4, 'El código DANE de municipio destino debe tener al menos 4 caracteres'),
    direccionEntrega: z.string().trim().min(5, 'La dirección de entrega debe contener al menos 5 caracteres'),
    destinatarioNombre: z.string().trim().min(3, 'El nombre del destinatario debe contener al menos 3 caracteres'),
    destinatarioTelefono: z
      .string()
      .trim()
      .regex(/^[0-9+ ]{7,15}$/, 'El teléfono de contacto debe contener entre 7 y 15 dígitos numéricos'),
    metodoPago: z.enum(['TRANSFERENCIA', 'CONTRAENTREGA']),
    cuponCodigo: z.string().trim().optional(),
    lineas: z.array(lineaCheckoutSchema).min(1, 'El pedido web debe contener al menos una línea'),
  })
  .refine(
    (data) => {
      const ids = data.lineas.map((l) => l.varianteId);
      return new Set(ids).size === ids.length;
    },
    { message: 'No se permiten variantes duplicadas en el carrito de compras', path: ['lineas'] }
  );

export const pedidoWebIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El parámetro id debe ser un entero positivo'),
});

export const listarPedidosWebQuerySchema = z.object({
  estadoPedido: z
    .enum([
      'RECIBIDO',
      'CONFIRMADO',
      'EN_PREPARACION',
      'ENVIADO',
      'ENTREGADO',
      'NO_ENTREGADO',
      'CANCELADO',
    ])
    .optional(),
  metodoPago: z.enum(['TRANSFERENCIA', 'CONTRAENTREGA']).optional(),
  ubicacionAsignadaId: z.coerce.number().int().positive().optional(),
  clienteId: z.coerce.number().int().positive().optional(),
});

export const noPuedoDespacharSchema = z.object({
  varianteIdsAfectadas: z
    .array(z.number().int().positive('El id de la variante debe ser un entero positivo'))
    .min(1, 'Debe especificar al menos una variante con novedad de stock'),
  motivo: z
    .string()
    .trim()
    .min(5, 'El motivo de la novedad debe contener al menos 5 caracteres'),
});

export const lineaRetornoLogisticoSchema = z.object({
  varianteId: z.number().int().positive('El id de la variante debe ser un entero positivo'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  condicion: z.enum(['VENDIBLE', 'NO_VENDIBLE']).default('VENDIBLE'),
});

export const retornoLogisticoSchema = z
  .object({
    ubicacionReingresoId: z.number().int().positive('La ubicación de reingreso físico es requerida'),
    motivo: z.string().trim().min(5, 'El motivo del retorno logístico debe contener al menos 5 caracteres'),
    lineas: z.array(lineaRetornoLogisticoSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.lineas || data.lineas.length === 0) return true;
      const ids = data.lineas.map((l) => l.varianteId);
      return new Set(ids).size === ids.length;
    },
    { message: 'No se permiten variantes duplicadas en la solicitud de retorno logístico', path: ['lineas'] }
  );

export const lineaDevolucionComercialSchema = z.object({
  lineaId: z.number().int().positive('El id de la línea de pedido es requerido'),
  cantidadDevuelta: z.number().int().positive('La cantidad devuelta debe ser mayor a 0'),
  condicionFisica: z.enum(['VENDIBLE', 'NO_VENDIBLE']).default('VENDIBLE'),
});

export const devolucionComercialWebSchema = z
  .object({
    ubicacionReingresoFisicoId: z.number().int().positive('La ubicación de reingreso físico es requerida'),
    lineasDevolucion: z
      .array(lineaDevolucionComercialSchema)
      .min(1, 'Debe especificar al menos una línea para procesar la devolución comercial'),
    referenciaTransferenciaReembolso: z
      .string()
      .trim()
      .min(3, 'La referencia de transferencia de reembolso es requerida'),
    motivo: z
      .string()
      .trim()
      .min(5, 'El motivo de la devolución debe contener al menos 5 caracteres'),
    autorizadoFueraPlazo: z.boolean().optional().default(false),
    motivoFueraPlazo: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      const ids = data.lineasDevolucion.map((l) => l.lineaId);
      return new Set(ids).size === ids.length;
    },
    { message: 'No se permiten líneas de pedido duplicadas en la solicitud de devolución comercial', path: ['lineasDevolucion'] }
  );

export type CotizarFleteInput = z.infer<typeof cotizarFleteSchema>;
export type LineaCheckoutInput = z.infer<typeof lineaCheckoutSchema>;
export type CheckoutWebInput = z.infer<typeof checkoutWebSchema>;
export type ListarPedidosWebQuery = z.infer<typeof listarPedidosWebQuerySchema>;
export type NoPuedoDespacharInput = z.infer<typeof noPuedoDespacharSchema>;
export type LineaRetornoLogisticoInput = z.infer<typeof lineaRetornoLogisticoSchema>;
export type RetornoLogisticoInput = z.infer<typeof retornoLogisticoSchema>;
export type LineaDevolucionComercialInput = z.infer<typeof lineaDevolucionComercialSchema>;
export type DevolucionComercialWebInput = z.infer<typeof devolucionComercialWebSchema>;
