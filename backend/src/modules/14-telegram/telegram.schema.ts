import { z } from 'zod';

export const ticketItemSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  talla: z.string().trim().optional(),
  color: z.string().trim().optional(),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  precioUnitarioCop: z.number().int().nonnegative().optional(),
  totalCop: z.number().int().nonnegative('El total de la línea debe ser entero (RN-GEN-04)'),
  descuentoCop: z.number().int().nonnegative().optional(),
});

export const registrarReciboSchema = z.object({
  consecutivo: z.string().trim().min(1, 'El consecutivo es obligatorio'),
  nombreTienda: z.string().trim().optional(),
  nombreSede: z.string().trim().optional(),
  direccionSede: z.string().trim().optional(),
  telefonoSede: z.string().trim().optional(),
  fechaHora: z.string().trim().optional(),
  cajeroNombre: z.string().trim().optional(),
  clienteNombre: z.string().trim().optional(),
  clienteDocumento: z.string().trim().optional(),
  items: z.array(ticketItemSchema).min(1, 'El ticket debe tener al menos una prenda'),
  subtotalCop: z.number().int().nonnegative().optional(),
  descuentoTotalCop: z.number().int().nonnegative().optional(),
  ivaDiscriminadoCop: z.number().int().nonnegative().optional(),
  totalNetoCop: z.number().int().nonnegative('El total neto debe ser entero (RN-GEN-04)'),
  metodoPago: z.string().trim().min(1, 'El método de pago es obligatorio'),
  montoRecibidoCop: z.number().int().nonnegative().optional(),
  cambioCop: z.number().int().nonnegative().optional(),
  referenciaTransferencia: z.string().trim().optional(),
});

export type RegistrarReciboDTO = z.infer<typeof registrarReciboSchema>;

export const enviarReciboSchema = z.object({
  chatId: z.string().trim().min(1, 'El chatId es obligatorio'),
  consecutivo: z.string().trim().min(1, 'El consecutivo es obligatorio'),
});

export type EnviarReciboDTO = z.infer<typeof enviarReciboSchema>;
