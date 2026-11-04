import { Router } from 'express';
import { authenticateJWT, requirePermission, requireRole } from '../../shared/middlewares/authPermission.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validateZod.js';
import { CajaController } from './caja.controller.js';
import {
  aperturaCajaSchema,
  cierreCajaSchema,
  listarSesionesQuerySchema,
  movimientoCajaSchema,
  relevoTurnoCajaSchema,
  sesionIdParamSchema,
} from './caja.schema.js';

export const cajaRouter = Router();

// Health check
cajaRouter.get('/health', (_req, res) => {
  res.json({ modulo: '07-caja', status: 'ready' });
});

// Consulta de sesión activa en la sede (requiere permCaja o ADMIN)
cajaRouter.get(
  '/sesion-activa',
  authenticateJWT,
  requirePermission('permCaja'),
  CajaController.sesionActiva
);

// RF-CAJ-01: Apertura de caja con base contada
cajaRouter.post(
  '/apertura',
  authenticateJWT,
  requirePermission('permCaja'),
  validateBody(aperturaCajaSchema),
  CajaController.abrir
);

// RF-CAJ-02: Movimientos de caja (sangría, gasto menor, ingreso manual)
cajaRouter.post(
  '/movimiento',
  authenticateJWT,
  requirePermission('permCaja'),
  validateBody(movimientoCajaSchema),
  CajaController.registrarMovimiento
);

// RF-CAJ-02 / RN-CAJ-13: Relevo de Turno / Corte X
cajaRouter.post(
  '/relevo-turno',
  authenticateJWT,
  requirePermission('permCaja'),
  validateBody(relevoTurnoCajaSchema),
  CajaController.relevoTurno
);

// RF-CAJ-03: Cierre ciego de caja
cajaRouter.post(
  '/cierre',
  authenticateJWT,
  requirePermission('permCaja'),
  validateBody(cierreCajaSchema),
  CajaController.cerrar
);

// Historial y detalle de sesiones
cajaRouter.get(
  '/',
  authenticateJWT,
  requirePermission('permCaja'),
  validateQuery(listarSesionesQuerySchema),
  CajaController.listar
);

cajaRouter.get(
  '/:id',
  authenticateJWT,
  requirePermission('permCaja'),
  validateParams(sesionIdParamSchema),
  CajaController.obtenerPorId
);
