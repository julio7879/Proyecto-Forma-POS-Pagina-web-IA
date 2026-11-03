import { z } from 'zod';
import { TipoUbicacion } from '@prisma/client';

export const crearUbicacionSchema = z.object({
  nombre: z.string().trim().min(3, 'Nombre requerido (mínimo 3 caracteres)').max(100),
  tipo: z.nativeEnum(TipoUbicacion),
  municipioDaneId: z.string().trim().length(5, 'Código DANE debe tener exactamente 5 dígitos'),
  direccion: z.string().trim().min(5, 'Dirección requerida (mínimo 5 caracteres)').max(200),
  despachaWeb: z.boolean().default(true),
  prioridadDespacho: z.number().int().positive('La prioridad de despacho debe ser un entero positivo').default(100),
  baseCajaCop: z.number().int().min(0, 'La base de caja debe ser un entero no negativo en pesos COP').default(200000),
});

export const actualizarUbicacionSchema = crearUbicacionSchema.partial();

export const desactivarUbicacionSchema = z.object({
  motivo: z.string().trim().min(5, 'El motivo de desactivación debe tener al menos 5 caracteres').max(500).optional(),
});

export const filtrarUbicacionesQuerySchema = z.object({
  activa: z.enum(['true', 'false']).optional(),
  tipo: z.nativeEnum(TipoUbicacion).optional(),
});

export type CrearUbicacionDto = z.infer<typeof crearUbicacionSchema>;
export type ActualizarUbicacionDto = z.infer<typeof actualizarUbicacionSchema>;
export type DesactivarUbicacionDto = z.infer<typeof desactivarUbicacionSchema>;
export type FiltrarUbicacionesQuery = z.infer<typeof filtrarUbicacionesQuerySchema>;
