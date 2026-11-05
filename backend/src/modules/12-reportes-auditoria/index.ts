import { Router } from 'express';
import { ExcelReportController } from './excelReport.controller.js';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';

export const reportesAuditoriaRouter = Router();

// Módulo 12: Ventas Netas, Reportes Mensuales y Bitácora de Auditoría (RF-REP)
reportesAuditoriaRouter.get('/health', (_req, res) => {
  res.json({ modulo: '12-reportes-auditoria', status: 'ready' });
});

// Endpoints de exportación ejecutiva en Excel (.xlsx) para Administrador
reportesAuditoriaRouter.get(
  '/excel/ventas',
  authenticateJWT,
  requireRole('ADMIN'),
  ExcelReportController.exportarVentas
);

reportesAuditoriaRouter.get(
  '/excel/cajas',
  authenticateJWT,
  requireRole('ADMIN'),
  ExcelReportController.exportarCajas
);

reportesAuditoriaRouter.get(
  '/excel/inventario',
  authenticateJWT,
  requireRole('ADMIN'),
  ExcelReportController.exportarInventario
);
