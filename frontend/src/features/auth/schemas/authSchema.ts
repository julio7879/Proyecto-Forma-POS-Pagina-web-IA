import { z } from 'zod';

export const loginSchema = z.object({
  correo: z.string().trim().email('Correo electrónico inválido').toLowerCase().max(100),
  password: z.string().min(1, 'La contraseña es requerida').max(100),
});

export const registerSchema = z
  .object({
    nombreCompleto: z.string().trim().min(2, 'El nombre es requerido').max(100),
    correo: z.string().trim().email('Correo electrónico inválido').toLowerCase().max(100),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
    confirmarPassword: z.string().min(8, 'Debe confirmar su contraseña'),
    telefono: z
      .string()
      .trim()
      .regex(/^[0-9+ -]*$/, 'Teléfono inválido (solo números, espacios, +, -)')
      .max(20)
      .optional()
      .or(z.literal('')),
    direccionDefault: z.string().trim().max(200).optional().or(z.literal('')),
    municipioDefaultId: z.string().trim().max(10).optional().or(z.literal('')),
    aceptoPrivacidad: z.boolean().refine((val) => val === true, {
      message: 'Debe aceptar la política de tratamiento de datos (Ley 1581)',
    }),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;