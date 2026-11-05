import { z } from 'zod';
import { TipoDescuento, AlcancePromocion, CanalVenta } from '@prisma/client';

export const crearPromocionSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(30)
    .toUpperCase(),
  nombre: z.string().trim().min(3).max(100),
  tipo: z.nativeEnum(TipoDescuento),
  valor: z
    .number()
    .int('El valor del descuento debe ser entero')
    .positive('El valor debe ser mayor a 0'),
  alcance: z.nativeEnum(AlcancePromocion).default(AlcancePromocion.TODA_LA_COMPRA),
  canalPermitido: z.nativeEnum(CanalVenta).default(CanalVenta.AMBOS),
  minimoCompraCop: z.number().int().min(0).default(0),
  fechaInicio: z.string().or(z.date()).optional(),
  fechaFin: z.string().or(z.date()).optional(),
  idsCategoriasElegibles: z.array(z.number().int()).default([]).optional(),
  idsProductosElegibles: z.array(z.number().int()).default([]).optional(),
});

export const lineaValidarSchema = z.object({
  varianteId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precioUnitarioCop: z.number().int().positive(),
});

export const validarCuponSchema = z.object({
  codigo: z.string().trim().min(1, 'Debe ingresar un código'),
  canal: z.enum(['POS', 'WEB']).default('WEB'),
  lineas: z.array(lineaValidarSchema).min(1, 'El pedido debe tener al menos una prenda'),
});

export type CrearPromocionDTO = z.infer<typeof crearPromocionSchema>;
export type ValidarCuponDTO = z.infer<typeof validarCuponSchema>;
