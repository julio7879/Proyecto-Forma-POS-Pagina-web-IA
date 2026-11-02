import { Router } from 'express';

export const trasladosRouter = Router();

// Módulo 06: Traslados, Retornos a Central y Novedades (RF-TRA)
trasladosRouter.get('/health', (_req, res) => {
  res.json({ modulo: '06-traslados', status: 'ready' });
});
