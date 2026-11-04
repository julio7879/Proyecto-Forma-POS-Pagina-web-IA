import { Router } from 'express';
import { authenticateJWT, requirePermission, requireRole } from '../../shared/middlewares/authPermission.js';
import { requireIdempotencyKey } from '../../shared/middlewares/idempotency.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/validateZod.js';
import { TrasladoController } from './traslado.controller.js';
import {
  cancelarTrasladoSchema,
  confirmarRetornoSchema,
  despacharTrasladoSchema,
  evaluarTrasladoSchema,
  listarTrasladosQuerySchema,
  recibirTrasladoSchema,
  resolverNovedadSchema,
  solicitarTrasladoSchema,
  trasladoIdParamSchema,
} from './traslado.schema.js';

export const trasladosRouter = Router();
const router = trasladosRouter;

// Health check para el módulo
router.get('/health', (_req, res) => {
  res.json({ modulo: '06-traslados', status: 'ready' });
});

// Lectura de traslados: exclusivo para personal interno (ADMIN y VENDEDOR, RN-ROL-03)
router.get(
  '/',
  authenticateJWT,
  requireRole('ADMIN', 'VENDEDOR'),
  validateQuery(listarTrasladosQuerySchema),
  TrasladoController.listar
);

router.get(
  '/:id',
  authenticateJWT,
  requireRole('ADMIN', 'VENDEDOR'),
  validateParams(trasladoIdParamSchema),
  TrasladoController.obtenerPorId
);

// RF-TRA-01: Crear solicitud de traslado (Vendedor con permiso o Admin, RN-GEN-08 Idempotente)
router.post(
  '/',
  authenticateJWT,
  requireRole('ADMIN', 'VENDEDOR'),
  requirePermission('permSolicitarTraslado'),
  requireIdempotencyKey,
  validateBody(solicitarTrasladoSchema),
  TrasladoController.solicitar
);

// RF-TRA-02: Aprobar o rechazar traslado en Central (solo ADMIN)
router.patch(
  '/:id/evaluar',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(trasladoIdParamSchema),
  validateBody(evaluarTrasladoSchema),
  TrasladoController.evaluar
);

// RF-TRA-03: Despachar desde Central a Tránsito (solo ADMIN)
router.post(
  '/:id/despachar',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(trasladoIdParamSchema),
  validateBody(despacharTrasladoSchema),
  TrasladoController.despachar
);

// RF-TRA-04: Cancelar traslado y pasar a RETORNANDO_A_CENTRAL si estaba en tránsito (solo ADMIN)
router.patch(
  '/:id/cancelar',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(trasladoIdParamSchema),
  validateBody(cancelarTrasladoSchema),
  TrasladoController.cancelar
);

// RF-TRA-04 / CA-59: Confirmar reingreso físico a Bodega Central (solo ADMIN)
router.post(
  '/:id/confirmar-retorno',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(trasladoIdParamSchema),
  validateBody(confirmarRetornoSchema),
  TrasladoController.confirmarRetorno
);

// RF-TRA-05: Recepción en punto con control de dañados y novedades (Vendedor con permiso o Admin, RN-GEN-08 Idempotente)
router.post(
  '/:id/recibir',
  authenticateJWT,
  requireRole('ADMIN', 'VENDEDOR'),
  requirePermission('permRecibirTraslado'),
  requireIdempotencyKey,
  validateParams(trasladoIdParamSchema),
  validateBody(recibirTrasladoSchema),
  TrasladoController.recibir
);

// RF-TRA-06 / CA-10: Resolución administrativa de novedades de traslado (solo ADMIN)
router.post(
  '/:id/resolver-novedad',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(trasladoIdParamSchema),
  validateBody(resolverNovedadSchema),
  TrasladoController.resolverNovedad
);
