import { Router } from 'express';
import { InventarioController } from './inventario.controller.js';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';
import { validateBody, validateQuery } from '../../shared/middlewares/validateZod.js';
import {
  listarInventarioQuerySchema,
  ingresoProduccionSchema,
  kardexQuerySchema,
  ajusteStockSchema,
} from './inventario.schema.js';

export { InventoryLedgerService } from './InventoryLedgerService.js';

export const inventarioRouter = Router();

// Módulo 04: Motor de Inventario y Kardex Inmutable (RF-INV)
inventarioRouter.get('/health', (_req, res) => {
  res.json({ modulo: '04-inventario', status: 'ready' });
});

// Consulta de inventario multisede (requiere autenticación)
inventarioRouter.get(
  '/',
  authenticateJWT,
  validateQuery(listarInventarioQuerySchema),
  InventarioController.listarInventario
);

// Ingreso de producción a Bodega Central (solo ADMIN)
inventarioRouter.post(
  '/ingreso-produccion',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(ingresoProduccionSchema),
  InventarioController.ingresoProduccion
);

// Bitácora inmutable de movimientos Kardex (requiere autenticación)
inventarioRouter.get(
  '/kardex',
  authenticateJWT,
  validateQuery(kardexQuerySchema),
  InventarioController.listarKardex
);

// Ajuste manual de inventario (solo ADMIN)
inventarioRouter.post(
  '/ajuste',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(ajusteStockSchema),
  InventarioController.ajusteStock
);
