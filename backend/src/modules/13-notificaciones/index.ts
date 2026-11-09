import { Router } from 'express';
import { NotificacionesController } from './notificaciones.controller.js';
import {
  notificarPedidoWebSchema,
  notificarBienvenidaSchema,
  notificarEstadoPedidoSchema,
} from './notificaciones.schema.js';
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

notificacionesRouter.post(
  '/estado-pedido',
  validateBody(notificarEstadoPedidoSchema),
  NotificacionesController.notificarEstadoPedido
);

export { NotificacionesController };
export * from './notificaciones.schema.js';
