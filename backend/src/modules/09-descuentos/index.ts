import { Router } from 'express';
import { DescuentosController } from './descuentos.controller.js';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';
import { validateBody } from '../../shared/middlewares/validateZod.js';
import { crearPromocionSchema, validarCuponSchema } from './descuentos.schema.js';

export * from './domain/DiscountEngine.js';
export { DescuentosService } from './descuentos.service.js';

export const descuentosRouter = Router();

// Módulo 09: Promociones por Código y Motor de Prorrateo (RF-DES)
descuentosRouter.get('/health', (_req, res) => {
  res.json({ modulo: '09-descuentos', status: 'ready' });
});

// Validación de cupones (abierto a POS y Web)
descuentosRouter.post(
  '/validar',
  validateBody(validarCuponSchema),
  DescuentosController.validar
);

// Listar promociones (autenticados)
descuentosRouter.get(
  '/promociones',
  authenticateJWT,
  DescuentosController.listar
);

// Crear promoción (solo ADMIN)
descuentosRouter.post(
  '/promociones',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearPromocionSchema),
  DescuentosController.crear
);
