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

export type CotizarFleteInput = z.infer<typeof cotizarFleteSchema>;
export type LineaCheckoutInput = z.infer<typeof lineaCheckoutSchema>;
export type CheckoutWebInput = z.infer<typeof checkoutWebSchema>;
export type ListarPedidosWebQuery = z.infer<typeof listarPedidosWebQuerySchema>;
export type NoPuedoDespacharInput = z.infer<typeof noPuedoDespacharSchema>;
