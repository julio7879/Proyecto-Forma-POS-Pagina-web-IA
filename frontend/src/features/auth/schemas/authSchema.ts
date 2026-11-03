import { z } from 'zod';

export const loginSchema = z.object({
  correo: z.string().email('Correo electrónico inválido'), // <-- 'correo', no 'email'
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerSchema = z.object({
  nombreCompleto: z.string().min(2, 'El nombre es requerido'), // <-- 'nombreCompleto'
  correo: z.string().email('Correo electrónico inválido'),       // <-- 'correo'
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'), // <-- min 8
  telefono: z.string().min(10, 'Teléfono inválido'),
  direccionDefault: z.string().min(5, 'Dirección requerida'),   // <-- 'direccionDefault'
  municipioDefaultId: z.string().min(1, 'Debe seleccionar un municipio'), // <-- 'municipioDefaultId'
  aceptoPrivacidad: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar la política de tratamiento de datos (Ley 1581)',
  }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;