import { Router } from 'express';
import { authenticateJWT, requirePermission, requireRole } from '../../shared/middlewares/authPermission.js';
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
  solicitarTrasladoSchema,
  trasladoIdParamSchema,
} from './traslado.schema.js';

export const trasladosRouter = Router();
const router = trasladosRouter;

// Health check para el módulo
router.get('/health', (_req, res) => {
  res.json({ modulo: '06-traslados', status: 'ready' });
});

// Lectura de traslados: usuarios autenticados con permiso o rol administrativo
router.get(
  '/',
  authenticateJWT,
  validateQuery(listarTrasladosQuerySchema),
  TrasladoController.listar
);

router.get(
  '/:id',
  authenticateJWT,
  validateParams(trasladoIdParamSchema),
  TrasladoController.obtenerPorId
);

// RF-TRA-01: Crear solicitud de traslado (Vendedor con permiso o Admin)
router.post(
  '/',
  authenticateJWT,
  requirePermission('permSolicitarTraslado'),
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
