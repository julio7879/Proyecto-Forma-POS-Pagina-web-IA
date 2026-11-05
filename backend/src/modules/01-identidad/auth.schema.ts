import { z } from 'zod';

export const registroClienteSchema = z.object({
  nombreCompleto: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
  aceptoPrivacidad: z.boolean().refine((val) => val === true, {
    message: 'Es obligatorio aceptar la política de privacidad y tratamiento de datos (Ley 1581)',
  }),
  telefono: z.string().trim().max(20).optional(),
  direccionDefault: z.string().trim().max(200).optional(),
  municipioDefaultId: z.string().trim().max(10).optional(),
});

export type RegistroClienteDTO = z.infer<typeof registroClienteSchema>;

export const loginSchema = z.object({
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const googleAuthSchema = z
  .object({
    idToken: z.string().trim().min(1).optional(),
    googleId: z.string().trim().optional(),
    correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase().optional(),
    nombreCompleto: z.string().trim().optional(),
  })
  .refine(
    (data) => Boolean(data.idToken || (data.googleId && data.correo && data.nombreCompleto)),
    {
      message:
        'Debe suministrar un idToken de Google o las credenciales completas (googleId, correo, nombreCompleto)',
    }
  );

export type GoogleAuthDTO = z.infer<typeof googleAuthSchema>;

export const crearVendedorSchema = z.object({
  nombreCompleto: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
  ubicacionId: z.number().int().positive('La sede de asignación es obligatoria para vendedores (RN-ROL-04)'),
  telefono: z.string().trim().max(20).optional(),
  permVender: z.boolean().default(true),
  permCaja: z.boolean().default(true),
  permDescuentoManual: z.boolean().default(false),
  permAnularVentas: z.boolean().default(false),
  permDevoluciones: z.boolean().default(false),
  permVerInventario: z.boolean().default(true),
  permSolicitarTraslado: z.boolean().default(true),
  permRecibirTraslado: z.boolean().default(true),
  permVerOtrosPuntos: z.boolean().default(false),
  permPedidosWeb: z.boolean().default(false),
  permVerVentasPunto: z.boolean().default(true),
});

export type CrearVendedorDTO = z.infer<typeof crearVendedorSchema>;

export const actualizarVendedorSchema = z.object({
  nombreCompleto: z.string().trim().min(2).max(100).optional(),
  password: z.string().min(8).max(100).optional(),
  ubicacionId: z.number().int().positive().optional(),
  activo: z.boolean().optional(),
  permVender: z.boolean().optional(),
  permCaja: z.boolean().optional(),
  permDescuentoManual: z.boolean().optional(),
  permAnularVentas: z.boolean().optional(),
  permDevoluciones: z.boolean().optional(),
  permVerInventario: z.boolean().optional(),
  permSolicitarTraslado: z.boolean().optional(),
  permRecibirTraslado: z.boolean().optional(),
  permVerOtrosPuntos: z.boolean().optional(),
  permPedidosWeb: z.boolean().optional(),
  permVerVentasPunto: z.boolean().optional(),
});

export type ActualizarVendedorDTO = z.infer<typeof actualizarVendedorSchema>;
