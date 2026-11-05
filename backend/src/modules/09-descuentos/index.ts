import { Router, type NextFunction, type Request, type Response } from 'express';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validateZod.js';
import { DescuentoController } from './descuento.controller.js';
import {
  calcularDescuentoCarritoSchema,
  crearPromocionSchema,
  listarPromocionesQuerySchema,
  promocionIdParamSchema,
  validarCuponSchema,
} from './descuento.schema.js';

export * from './domain/DiscountEngine.js';
export { DiscountProrationEngine } from './domain/DiscountProrationEngine.js';
export { DescuentoService } from './descuento.service.js';

export const descuentosRouter = Router();
const router = descuentosRouter;

/**
 * Autenticación opcional: sin encabezado Authorization la petición sigue como pública (carrito web);
 * con encabezado se valida el JWT y se puebla req.user (necesario para descuentos manuales POS).
 */
async function autenticacionOpcional(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.headers.authorization) return next();
  await authenticateJWT(req, res, next);
}

// Módulo 09: Promociones por Código y Motor de Prorrateo (RF-DES)
router.get('/health', (_req, res) => {
  res.json({ modulo: '09-descuentos', status: 'ready' });
});

router.post('/calcular', autenticacionOpcional, validateBody(calcularDescuentoCarritoSchema), DescuentoController.calcular);
router.post('/validar-cupon', autenticacionOpcional, validateBody(validarCuponSchema), DescuentoController.validarCupon);

// Administración de promociones: solo ADMIN
router.get(
  '/promociones',
  authenticateJWT,
  requireRole('ADMIN'),
  validateQuery(listarPromocionesQuerySchema),
  DescuentoController.listarPromociones,
);
router.post(
  '/promociones',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearPromocionSchema),
  DescuentoController.crearPromocion,
);
router.patch(
  '/promociones/:id/desactivar',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(promocionIdParamSchema),
  DescuentoController.desactivarPromocion,
);
router.delete(
  '/promociones/:id',
  authenticateJWT,
  requireRole('ADMIN'),
  validateParams(promocionIdParamSchema),
  DescuentoController.eliminarPromocion,
);