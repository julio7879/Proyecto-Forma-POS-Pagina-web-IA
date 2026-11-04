import { Router } from 'express';
import { authenticateJWT, requirePermission } from '../../shared/middlewares/authPermission.js';
import { requireIdempotencyKey } from '../../shared/middlewares/idempotency.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validateZod.js';
import { DevolucionPosController } from './devolucionPos.controller.js';
import {
  anularVentaPosSchema,
  devolucionIdParamSchema,
  listarDevolucionesQuerySchema,
  registrarCambioPosSchema,
  registrarDevolucionPosSchema,
} from './devolucionPos.schema.js';

export const devolucionesCambiosRouter = Router();

// Health check
devolucionesCambiosRouter.get('/health', (_req, res) => {
  res.json({ modulo: '10-devoluciones-cambios', status: 'ready' });
});

// RF-DEV-01: Registro de devolución en mostrador POS (permDevoluciones e Idempotency-Key)
devolucionesCambiosRouter.post(
  '/',
  authenticateJWT,
  requirePermission('permDevoluciones'),
  requireIdempotencyKey,
  validateBody(registrarDevolucionPosSchema),
  DevolucionPosController.registrarDevolucion
);

// RF-DEV-03 / RN-DEV-11: Operación atómica de Cambio en mostrador
devolucionesCambiosRouter.post(
  '/cambio',
  authenticateJWT,
  requirePermission('permDevoluciones'),
  requireIdempotencyKey,
  validateBody(registrarCambioPosSchema),
  DevolucionPosController.registrarCambio
);

// RF-DEV-02 / RN-DEV-12: Anulación en el día de Venta POS (permAnularVentas)
devolucionesCambiosRouter.post(
  '/anular-venta/:id',
  authenticateJWT,
  requirePermission('permAnularVentas'),
  validateParams(devolucionIdParamSchema),
  validateBody(anularVentaPosSchema),
  DevolucionPosController.anularVenta
);

// Listado de devoluciones
devolucionesCambiosRouter.get(
  '/',
  authenticateJWT,
  requirePermission('permDevoluciones'),
  validateQuery(listarDevolucionesQuerySchema),
  DevolucionPosController.listar
);

// Detalle de devolución
devolucionesCambiosRouter.get(
  '/:id',
  authenticateJWT,
  requirePermission('permDevoluciones'),
  validateParams(devolucionIdParamSchema),
  DevolucionPosController.obtenerPorId
);
