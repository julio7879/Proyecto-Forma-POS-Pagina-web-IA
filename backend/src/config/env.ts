import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres (256 bits para HS256)'),
  // Notificaciones de Telegram (opcionales: sin ellas el adaptador opera en modo degradado)
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID_OPERACIONES: z.string().optional(),
  TELEGRAM_CHAT_ID_INVENTARIO: z.string().optional(),
  TELEGRAM_CHAT_ID_ECOMMERCE: z.string().optional(),
});

export const env = envSchema.parse(process.env);