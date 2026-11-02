import { Router } from 'express';

export const ubicacionesRouter = Router();

// Módulo 02: Ubicaciones (Central y Puntos) y Geografía DANE (RF-UBI)
ubicacionesRouter.get('/health', (_req, res) => {
  res.json({ modulo: '02-ubicaciones', status: 'ready' });
});
