import { z } from 'zod';

export const crearVarianteItemSchema = z.object({
  talla: z.string().trim().min(1, 'La talla es requerida').max(50),
  color: z.string().trim().min(1, 'El color es requerido').max(50),
  precioVentaCop: z
    .number()
    .int('El precio debe ser un número entero en COP')
    .positive('El precio debe ser mayor a 0 COP'),
  sku: z.string().trim().min(3).max(60).optional(),
  codigoBarras: z.string().trim().max(100).optional(),
  umbralStockBajo: z.number().int().min(0).default(3).optional(),
  stockInicialCentral: z.number().int().min(0).default(0).optional(),
});

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150),
  descripcion: z.string().trim().min(5, 'La descripción debe tener al menos 5 caracteres').max(2000),
  categoriaId: z.number().int().positive('La categoría es requerida'),
  imagenesUrls: z.array(z.string().trim()).default([]).optional(),
  reintegrableEnDevolucion: z.boolean().optional(),
  variantes: z
    .array(crearVarianteItemSchema)
    .min(1, 'El producto debe tener al menos una variante (talla/color)'),
});

export const agregarVarianteSchema = crearVarianteItemSchema;

export const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(2).max(150).optional(),
  descripcion: z.string().trim().min(5).max(2000).optional(),
  categoriaId: z.number().int().positive().optional(),
  imagenesUrls: z.array(z.string().trim()).optional(),
  activo: z.boolean().optional(),
  reintegrableEnDevolucion: z.boolean().optional(),
});

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  esCosmeticoUsoPersonal: z.boolean().default(false).optional(),
});

export type CrearProductoDTO = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoDTO = z.infer<typeof actualizarProductoSchema>;
export type CrearVarianteItemDTO = z.infer<typeof crearVarianteItemSchema>;
export type CrearCategoriaDTO = z.infer<typeof crearCategoriaSchema>;
