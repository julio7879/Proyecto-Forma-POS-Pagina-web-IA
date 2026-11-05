import { Router } from 'express';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validateZod.js';
import { AlertaController } from './alerta.controller.js';
import { alertaIdParamSchema, atenderAlertaSchema, listarAlertasQuerySchema } from './alerta.schema.js';

export { AlertaService } from './alerta.service.js';

export const alertasRouter = Router();

// Módulo 13: Centro de Alertas Operativas Multisede (RF-REP-02). Solo personal interno (ADMIN / VENDEDOR).
alertasRouter.get(
    '/',
    authenticateJWT,
    requireRole('ADMIN', 'VENDEDOR'),
    validateQuery(listarAlertasQuerySchema),
    AlertaController.listar,
);
alertasRouter.patch(
    '/:id/atender',
    authenticateJWT,
    requireRole('ADMIN', 'VENDEDOR'),
    validateParams(alertaIdParamSchema),
    validateBody(atenderAlertaSchema),
    AlertaController.atender,
);