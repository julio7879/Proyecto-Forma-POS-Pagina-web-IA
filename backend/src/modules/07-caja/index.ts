import { Router } from 'express';

export const cajaRouter = Router();

// Módulo 07: Sesiones de Caja, Movimientos y Arqueo (RF-CAJ)
cajaRouter.get('/health', (_req, res) => {
  res.json({ modulo: '07-caja', status: 'ready' });
});
