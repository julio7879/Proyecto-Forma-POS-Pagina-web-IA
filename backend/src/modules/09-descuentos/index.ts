import { Router } from 'express';

export const descuentosRouter = Router();

// Módulo 09: Promociones por Código y Motor de Prorrateo (RF-DES)
descuentosRouter.get('/health', (_req, res) => {
  res.json({ modulo: '09-descuentos', status: 'ready' });
});
