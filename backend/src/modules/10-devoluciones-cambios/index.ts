import { Router } from 'express';

export const devolucionesCambiosRouter = Router();

// Módulo 10: Anulaciones, Devoluciones y Cambios de Mercancía (RF-DEV)
devolucionesCambiosRouter.get('/health', (_req, res) => {
  res.json({ modulo: '10-devoluciones-cambios', status: 'ready' });
});
