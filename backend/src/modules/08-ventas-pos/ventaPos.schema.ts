import { z } from 'zod';

const INT32_MAX = 2_147_483_647;

export const lineaVentaPosSchema = z.object({
  varianteId: z.number().int().positive('varianteId inválido'),
  cantidad: z
    .number()
    .int()
    .positive('La cantidad debe ser un entero positivo')
    .max(INT32_MAX, 'La cantidad excede el límite permitido'),
});

export const descuentoVentaPosSchema = z.object({
  tipo: z.enum(['PORCENTAJE', 'VALOR_FIJO']),
  valor: z
    .number()
    .int()
    .positive('El valor del descuento debe ser mayor a 0')
    .max(INT32_MAX, 'El valor del descuento excede el límite permitido'),
  descuentoCodigo: z.string().trim().max(50).optional(),
  motivoManual: z.string().trim().max(255).optional(),
  descuentoAutorizadoPorId: z.number().int().positive().optional(),
});

export const pagoVentaPosSchema = z
  .object({
    metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
    montoCop: z
      .number()
      .int()
      .positive('El monto de pago debe ser mayor a 0 (RN-GEN-04)')
      .max(INT32_MAX, 'El monto excede el límite admitido'),
    montoRecibidoEfectivoCop: z.number().int().min(0).max(INT32_MAX).optional(),
    referenciaTransferencia: z.string().trim().max(100).optional(),
  })
  .refine(
    (pago) => {
      if (pago.metodo === 'TRANSFERENCIA') {
        return Boolean(pago.referenciaTransferencia && pago.referenciaTransferencia.length >= 3);
      }
      return true;
    },
    { message: 'El pago por TRANSFERENCIA exige código o referencia bancaria (RN-VTA-02).' }
  )
  .refine(
    (pago) => {
      if (pago.metodo === 'EFECTIVO' && pago.montoRecibidoEfectivoCop !== undefined) {
        return pago.montoRecibidoEfectivoCop >= pago.montoCop;
      }
      return true;
    },
    { message: 'El efectivo recibido no puede ser inferior al monto a cobrar.' }
  );

export const crearVentaPosSchema = z.object({
  ubicacionId: z.number().int().positive('ubicacionId inválido'),
  clienteNombreOpcional: z.string().trim().max(150).optional(),
  clienteDocumentoOpcional: z.string().trim().max(50).optional(),
  lineas: z
    .array(lineaVentaPosSchema)
    .min(1, 'La venta POS debe incluir al menos un producto')
    .refine((lineas) => new Set(lineas.map((l) => l.varianteId)).size === lineas.length, {
      message: 'No se permiten variantes duplicadas en la misma venta POS',
    }),
  descuento: descuentoVentaPosSchema.optional(),
  pagos: z.array(pagoVentaPosSchema).min(1, 'Debe especificar al menos un método de pago'),
});

export const listarVentasPosQuerySchema = z.object({
  ubicacionId: z.coerce.number().int().positive().optional(),
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
  numeroComprobante: z.coerce.number().int().positive().optional(),
  estado: z.enum(['COMPLETADA', 'ANULADA']).optional(),
});

export const ventaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type LineaVentaPosInput = z.infer<typeof lineaVentaPosSchema>;
export type DescuentoVentaPosInput = z.infer<typeof descuentoVentaPosSchema>;
export type PagoVentaPosInput = z.infer<typeof pagoVentaPosSchema>;
export type CrearVentaPosInput = z.infer<typeof crearVentaPosSchema>;
export type ListarVentasPosQuery = z.infer<typeof listarVentasPosQuerySchema>;
