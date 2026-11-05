import type { Request, Response, NextFunction } from 'express';
import { ExcelReportService } from './excelReport.service.js';

export class ExcelReportController {
  static async exportarVentas(_req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await ExcelReportService.generarReporteVentas();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Ventas_Forma.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async exportarCajas(_req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await ExcelReportService.generarReporteCajas();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Cajas_Forma.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async exportarInventario(_req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await ExcelReportService.generarReporteInventario();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Inventario_Forma.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
