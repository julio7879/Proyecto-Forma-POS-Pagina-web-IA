import { Router } from 'express';

export const ventasPosRouter = Router();

// Módulo 08: Terminal POS y Confirmación de Ventas Presenciales (RF-POS)
ventasPosRouter.get('/health', (_req, res) => {
  res.json({ modulo: '08-ventas-pos', status: 'ready' });
});
