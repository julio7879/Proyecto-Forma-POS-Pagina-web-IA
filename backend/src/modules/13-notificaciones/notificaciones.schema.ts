import { z } from 'zod';

export const itemPedidoWebSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre del producto es requerido'),
    talla: z.string().trim().optional(),
    color: z.string().trim().optional(),
    sku: z.string().trim().min(1, 'El SKU es requerido'),
    cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
    precioCOP: z.number().int().nonnegative().optional(),
    precioUnitarioCOP: z.number().int().nonnegative().optional(),
  })
  .transform((it) => ({
    nombre: it.nombre,
    talla: it.talla,
    color: it.color,
    sku: it.sku,
    cantidad: it.cantidad,
    precioCOP: it.precioCOP ?? it.precioUnitarioCOP ?? 0,
  }));

export const notificarPedidoWebSchema = z
  .object({
    codigo: z.string().trim().min(1).optional(),
    pedidoId: z.string().trim().min(1).optional(),
    clienteNombre: z.string().trim().min(1).optional(),
    cliente: z.string().trim().min(1).optional(),
    clienteEmail: z.string().trim().email('Formato de correo electrónico inválido').optional(),
    email: z.string().trim().email('Formato de correo electrónico inválido').optional(),
    ciudadDestino: z.string().trim().min(1, 'La ciudad de destino es requerida'),
    direccionEntrega: z.string().trim().min(1, 'La dirección de entrega es requerida'),
    sedeAsignada: z.string().trim().optional(),
    metodoPago: z.string().trim().min(1, 'El método de pago es requerido'),
    totalCOP: z.number().int().nonnegative('El total en COP debe ser un entero no negativo (RN-GEN-04)'),
    subtotalCOP: z.number().int().nonnegative().optional(),
    descuentoCOP: z.number().int().nonnegative().optional(),
    ivaCOP: z.number().int().nonnegative().optional(),
    items: z.array(itemPedidoWebSchema).min(1, 'Debe incluir al menos un producto en el pedido'),
  })
  .transform((data) => {
    const codigoFinal = (data.codigo || data.pedidoId || `PED-2026-${Date.now().toString().slice(-6)}`).trim();
    const nombreFinal = (data.clienteNombre || data.cliente || 'Cliente Estimado').trim();
    const emailFinal = (data.clienteEmail || data.email || 'cliente@forma.com').trim().toLowerCase();
    const sedeFinal = (data.sedeAsignada || 'Bodega Central').trim();

    return {
      codigo: codigoFinal,
      clienteNombre: nombreFinal,
      clienteEmail: emailFinal,
      ciudadDestino: data.ciudadDestino,
      direccionEntrega: data.direccionEntrega,
      sedeAsignada: sedeFinal,
      metodoPago: data.metodoPago,
      totalCOP: data.totalCOP,
      subtotalCOP: data.subtotalCOP,
      descuentoCOP: data.descuentoCOP,
      ivaCOP: data.ivaCOP,
      items: data.items,
    };
  });

export const notificarBienvenidaSchema = z.object({
  clienteNombre: z.string().trim().min(1, 'El nombre del cliente es requerido'),
  clienteEmail: z.string().trim().email('Formato de correo inválido').toLowerCase(),
});

export type NotificarPedidoWebDTO = z.infer<typeof notificarPedidoWebSchema>;
export type NotificarBienvenidaDTO = z.infer<typeof notificarBienvenidaSchema>;
