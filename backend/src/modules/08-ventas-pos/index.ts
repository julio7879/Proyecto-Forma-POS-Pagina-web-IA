import { Router } from 'express';
import { authenticateJWT, requirePermission } from '../../shared/middlewares/authPermission.js';
import { requireIdempotencyKey } from '../../shared/middlewares/idempotency.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validateZod.js';
import { VentaPosController } from './ventaPos.controller.js';
import {
  crearVentaPosSchema,
  listarVentasPosQuerySchema,
  ventaIdParamSchema,
} from './ventaPos.schema.js';

export const ventasPosRouter = Router();

// Health check
ventasPosRouter.get('/health', (_req, res) => {
  res.json({ modulo: '08-ventas-pos', status: 'ready' });
});

// RF-POS-02 / RN-VTA-01: Confirmación atómica de venta POS (exige permVender e Idempotency-Key)
ventasPosRouter.post(
  '/',
  authenticateJWT,
  requirePermission('permVender'),
  requireIdempotencyKey,
  validateBody(crearVentaPosSchema),
  VentaPosController.crear
);

// Listar ventas POS
ventasPosRouter.get(
  '/',
  authenticateJWT,
  requirePermission('permVerVentasPunto'),
  validateQuery(listarVentasPosQuerySchema),
  VentaPosController.listar
);

// Detalle de venta POS
ventasPosRouter.get(
  '/:id',
  authenticateJWT,
  requirePermission('permVerVentasPunto'),
  validateParams(ventaIdParamSchema),
  VentaPosController.obtenerPorId
);
