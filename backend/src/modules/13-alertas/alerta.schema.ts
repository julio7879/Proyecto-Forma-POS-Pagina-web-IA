import { z } from 'zod';
import { BUSINESS_CONSTANTS } from '../../config/constants.js';

export const TIPOS_ALERTA = ['SKU_CUARENTENA_WEB', 'PEDIDO_CUSTODIA_CENTRAL', 'CAJA_IRREGULAR', 'STOCK_BAJO'] as const;
export const SEVERIDADES_ALERTA = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'] as const;

// Prefijos de ID de alerta -> entidad de origen (ej. "STOCK_BAJO:21", "CUSTODIA_CENTRAL:142")
const ID_ALERTA_REGEX = /^(CUARENTENA_WEB|CUSTODIA_CENTRAL|CAJA_IRREGULAR|STOCK_BAJO):\d{1,10}$/;

export const listarAlertasQuerySchema = z.object({
    tipo: z.enum(TIPOS_ALERTA).optional(),
    severidad: z.enum(SEVERIDADES_ALERTA).optional(),
    ubicacionId: z.coerce.number().int().positive().optional(),
    umbralStock: z.coerce.number().int().min(0).default(BUSINESS_CONSTANTS.UMBRAL_STOCK_BAJO_DEFECTO),
    // Por defecto solo pendientes. Se resuelve el default en el transform para compilar igual en zod 3 y 4.
    soloPendientes: z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? true : v === 'true')),
});

export const atenderAlertaSchema = z.object({
    notas: z.string().trim().max(500).optional(),
});

export const alertaIdParamSchema = z.object({
    id: z.string().min(3).regex(ID_ALERTA_REGEX, 'Identificador de alerta inválido'),
});

export type ListarAlertasQuery = z.infer<typeof listarAlertasQuerySchema>;
export type AtenderAlertaInput = z.infer<typeof atenderAlertaSchema>;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];
export type SeveridadAlerta = (typeof SEVERIDADES_ALERTA)[number];