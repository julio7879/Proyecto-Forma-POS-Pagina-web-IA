import { Router } from 'express';
import { TelegramController } from './telegram.controller.js';
import { registrarReciboSchema, enviarReciboSchema } from './telegram.schema.js';
import { validateBody } from '../../shared/middlewares/validateZod.js';

export const telegramRouter = Router();

telegramRouter.post(
  '/registrar-recibo',
  validateBody(registrarReciboSchema),
  TelegramController.registrarRecibo
);

telegramRouter.post(
  '/enviar-recibo',
  validateBody(enviarReciboSchema),
  TelegramController.enviarRecibo
);

telegramRouter.get(
  '/recibo/:consecutivo',
  TelegramController.obtenerRecibo
);

export { TelegramController };
export * from './telegram.schema.js';
