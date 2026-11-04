import { Router } from 'express';
import {
  authenticateJWT,
  requireRole,
} from '../../shared/middlewares/authPermission.js';
import { requireIdempotencyKey } from '../../shared/middlewares/idempotency.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/validateZod.js';
import { PedidoWebController } from './pedidoWeb.controller.js';
import {
  checkoutWebSchema,
  cotizarFleteSchema,
  devolucionComercialWebSchema,
  listarPedidosWebQuerySchema,
  noPuedoDespacharSchema,
  pedidoWebIdParamSchema,
  retornoLogisticoSchema,
} from './pedidoWeb.schema.js';

export const pedidosWebRouter = Router();
const router = pedidosWebRouter;

// Health check para el módulo
router.get('/health', (_req, res) => {
  res.json({ modulo: '11-pedidos-web', status: 'ready' });
});

// RF-WEB-02: Cotización pública de flete por zonas DANE (abierto para clientes)
router.post(
  '/cotizar-flete',
  validateBody(cotizarFleteSchema),
  PedidoWebController.cotizarFlete
);

// RF-WEB-03 / CA-38: Checkout atómico con asignación determinista y reserva blanda (RN-GEN-08 Idempotente)
router.post(
  '/checkout',
  authenticateJWT,
  requireIdempotencyKey,
  validateBody(checkoutWebSchema),
  PedidoWebController.checkout
);

// Consulta de pedidos: usuarios autenticados (aislamiento por rol en el servicio)
router.get(
  '/',
  authenticateJWT,
  validateQuery(listarPedidosWebQuerySchema),
  PedidoWebController.listar
);

router.get(
  '/:id',
  authenticateJWT,
  validateParams(pedidoWebIdParamSchema),
  PedidoWebController.obtenerPorId
);

// RF-WEB-06 / RN-WEB-16 / CA-43 / CA-62: Reportar novedad 'No puedo despachar'
router.post(
  '/:id/no-puedo-despachar',
  authenticateJWT,
  requireIdempotencyKey,
  validateParams(pedidoWebIdParamSchema),
  validateBody(noPuedoDespacharSchema),
  PedidoWebController.reportarNoPuedoDespachar
);

// RF-WEB-07 / RN-WEB-23 / CA-64 / QA-020: Retorno Logístico sin distorsión de Ventas Netas
router.post(
  '/:id/retorno-logistico',
  authenticateJWT,
  requireRole('ADMIN'),
  requireIdempotencyKey,
  validateParams(pedidoWebIdParamSchema),
  validateBody(retornoLogisticoSchema),
  PedidoWebController.procesarRetornoLogistico
);

// RF-DEV-04 / RN-DEV-14 a 16 / RN-REP-03 / CA-65 / QA-021: Devolución Comercial Web con imputación a origen
router.post(
  '/:id/devolucion-comercial',
  authenticateJWT,
  requireRole('ADMIN'),
  requireIdempotencyKey,
  validateParams(pedidoWebIdParamSchema),
  validateBody(devolucionComercialWebSchema),
  PedidoWebController.procesarDevolucionComercial
);
