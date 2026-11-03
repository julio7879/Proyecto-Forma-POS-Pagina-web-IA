import { Router } from 'express';
import { UbicacionController } from './ubicacion.controller.js';
import {
  crearUbicacionSchema,
  actualizarUbicacionSchema,
  desactivarUbicacionSchema,
  filtrarUbicacionesQuerySchema,
} from './ubicacion.schema.js';
import {
  validateBody,
  validateQuery,
} from '../../shared/middlewares/validateZod.js';
import {
  authenticateJWT,
  requireRole,
} from '../../shared/middlewares/authPermission.js';
import { AppError } from '../../shared/domain/AppError.js';

export const ubicacionesRouter = Router();

// Módulo 02: Ubicaciones (Central y Puntos) y Geografía DANE (RF-UBI)
ubicacionesRouter.get('/health', (_req, res) => {
  res.json({ modulo: '02-ubicaciones', status: 'ready' });
});

// Listado de ubicaciones con filtros opcionales (?activa=true&tipo=PUNTO_VENTA)
ubicacionesRouter.get(
  '/',
  validateQuery(filtrarUbicacionesQuerySchema),
  UbicacionController.listar
);

// Detalle de ubicación por ID
ubicacionesRouter.get('/:id', UbicacionController.obtenerPorId);

// Creación de nueva ubicación (Solo Administrador, RN-UBI-01)
ubicacionesRouter.post(
  '/',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearUbicacionSchema),
  UbicacionController.crear
);

// Actualización de ubicación existente (Solo Administrador)
ubicacionesRouter.put(
  '/:id',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(actualizarUbicacionSchema),
  UbicacionController.actualizar
);

// Desactivación segura validada (Solo Administrador, RN-UBI-05)
ubicacionesRouter.patch(
  '/:id/desactivar',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(desactivarUbicacionSchema),
  UbicacionController.desactivar
);

// Prohibición absoluta de borrado físico (RN-GEN-03, RN-GEN-07)
ubicacionesRouter.delete('/:id', (_req, _res) => {
  throw AppError.badRequest(
    'El borrado físico de sedes está prohibido por integridad histórica (RN-GEN-03, RN-GEN-07). Utilice el endpoint de desactivación segura: PATCH /api/ubicaciones/:id/desactivar.'
  );
});
