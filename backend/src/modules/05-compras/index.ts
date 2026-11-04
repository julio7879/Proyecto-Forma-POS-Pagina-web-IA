import { Router } from 'express';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';
import { requireIdempotencyKey } from '../../shared/middlewares/idempotency.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validateZod.js';
import { CompraController } from './compra.controller.js';
import {
  cancelarCompraSchema,
  compraIdParamSchema,
  crearCompraSchema,
  listarComprasQuerySchema,
  recibirCompraSchema,
} from './compra.schema.js';

// Módulo 05: Compras a Proveedores en Bodega Central (RF-COM-01, RF-COM-02)
export const comprasRouter = Router();
const router = comprasRouter;

// Health check (debe declararse antes de '/:id' para no ser interpretado como un id)
router.get('/health', (_req, res) => {
  res.json({ modulo: '05-compras', status: 'ready' });
});

// Todas las operaciones de compras son exclusivas del Administrador (RN-ROL-03)
router.get(
  '/',
  authenticateJWT,
  requireRole('ADMIN'),
  validateQuery(listarComprasQuerySchema),
  CompraController.listar
);

router.get(
  '/:id',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(compraIdParamSchema),
  CompraController.obtenerPorId
);

// RF-COM-01: crear orden en PEDIDA (sin afectar stock, RN-COM-02)
router.post(
  '/',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearCompraSchema),
  CompraController.crear
);

// RF-COM-01 / RN-COM-05: cancelar orden PEDIDA (sin efecto en inventario)
router.patch(
  '/:id/cancelar',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(compraIdParamSchema),
  validateBody(cancelarCompraSchema),
  CompraController.cancelar
);

// RF-COM-02 / RN-COM-03 / CA-08: recepción única e idempotente en Bodega Central
router.post(
  '/:id/recibir',
  authenticateJWT,
  requireRole('ADMIN'),
  requireIdempotencyKey,
  validateParams(compraIdParamSchema),
  validateBody(recibirCompraSchema),
  CompraController.recibir
);

// RN-GEN-07: prohibido el borrado físico (responde 400 explicativo)
router.delete('/:id', authenticateJWT, requireRole('ADMIN'), CompraController.eliminar);