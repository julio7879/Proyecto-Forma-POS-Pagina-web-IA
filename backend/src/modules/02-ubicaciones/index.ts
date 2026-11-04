import { Router } from 'express';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/validateZod.js';
import { UbicacionController } from './ubicacion.controller.js';
import {
  actualizarUbicacionSchema,
  crearUbicacionSchema,
  desactivarUbicacionSchema,
  listarUbicacionesQuerySchema,
  ubicacionIdParamSchema,
} from './ubicacion.schema.js';

export const ubicacionesRouter = Router();
const router = ubicacionesRouter;

// Lectura: usuarios autenticados (RN-ROL-03)
router.get(
  '/',
  authenticateJWT,
  validateQuery(listarUbicacionesQuerySchema),
  UbicacionController.listar,
);
router.get(
  '/:id',
  authenticateJWT,
  validateParams(ubicacionIdParamSchema),
  UbicacionController.obtenerPorId,
);

// Escritura: solo ADMIN (RN-ROL-05)
router.post(
  '/',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearUbicacionSchema),
  UbicacionController.crear,
);
router.put(
  '/:id',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(ubicacionIdParamSchema),
  validateBody(actualizarUbicacionSchema),
  UbicacionController.actualizar,
);
router.patch(
  '/:id/desactivar',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(ubicacionIdParamSchema),
  validateBody(desactivarUbicacionSchema),
  UbicacionController.desactivar,
);
router.delete(
  '/:id',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(ubicacionIdParamSchema),
  UbicacionController.eliminar,
);