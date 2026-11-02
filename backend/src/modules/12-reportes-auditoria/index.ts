import { Router } from 'express';

export const reportesAuditoriaRouter = Router();

// Módulo 12: Ventas Netas, Reportes Mensuales y Bitácora de Auditoría (RF-REP)
reportesAuditoriaRouter.get('/health', (_req, res) => {
  res.json({ modulo: '12-reportes-auditoria', status: 'ready' });
});
