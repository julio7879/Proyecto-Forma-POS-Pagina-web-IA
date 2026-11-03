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

export const googleAuthSchema = z.object({
  googleId: z.string().trim().min(1, 'El Google ID es requerido'),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  nombreCompleto: z.string().trim().min(1, 'El nombre completo es requerido'),
});

export type GoogleAuthDTO = z.infer<typeof googleAuthSchema>;
