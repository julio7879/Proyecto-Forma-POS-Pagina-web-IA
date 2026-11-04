import { z } from 'zod';
import { TipoUbicacion } from '@prisma/client';

const baseUbicacionSchema = z.object({
    nombre: z.string().trim().min(3, 'Nombre requerido').max(100),
    tipo: z.nativeEnum(TipoUbicacion),
    municipioDaneId: z.string().trim().regex(/^\d{5}$/, 'Código DANE debe tener 5 dígitos numéricos'),
    direccion: z.string().trim().min(5).max(200),
    despachaWeb: z.boolean(),
    prioridadDespacho: z.number().int().positive(),
    // RN-GEN-04 / RN-UBI-02: dinero entero en COP, sin decimales
    baseCajaCop: z.number().int().min(0),
});

export const crearUbicacionSchema = baseUbicacionSchema.extend({
    despachaWeb: z.boolean().default(true),
    prioridadDespacho: z.number().int().positive().default(100),
    baseCajaCop: z.number().int().min(0).default(200000),
});

// Deriva de base sin defaults: no sobreescribe campos no enviados en updates
export const actualizarUbicacionSchema = baseUbicacionSchema.partial();

export const desactivarUbicacionSchema = z.object({
    motivo: z.string().trim().min(5).optional(),
});

export const ubicacionIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const listarUbicacionesQuerySchema = z.object({
    activa: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
    tipo: z.nativeEnum(TipoUbicacion).optional(),
});

export type CrearUbicacionInput = z.infer<typeof crearUbicacionSchema>;
export type ActualizarUbicacionInput = z.infer<typeof actualizarUbicacionSchema>;
export type DesactivarUbicacionInput = z.infer<typeof desactivarUbicacionSchema>;
export type ListarUbicacionesQuery = z.infer<typeof listarUbicacionesQuerySchema>;
