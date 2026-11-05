import { Router } from 'express';
import { NotificacionesController } from './notificaciones.controller.js';
import { notificarPedidoWebSchema, notificarBienvenidaSchema } from './notificaciones.schema.js';
import { validateBody } from '../../shared/middlewares/validateZod.js';

export const notificacionesRouter = Router();

notificacionesRouter.post(
  '/pedido-web',
  validateBody(notificarPedidoWebSchema),
  NotificacionesController.notificarPedidoWeb
);

notificacionesRouter.post(
  '/bienvenida',
  validateBody(notificarBienvenidaSchema),
  NotificacionesController.notificarBienvenida
);

export { NotificacionesController };
export * from './notificaciones.schema.js';
