import type { Request, Response, NextFunction } from 'express';
import { UbicacionService } from './ubicacion.service.js';
import { AppError } from '../../shared/domain/AppError.js';

export class UbicacionController {
  static async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { activa, tipo } = req.query as { activa?: string; tipo?: 'CENTRAL' | 'PUNTO_VENTA' };
      const filtros: { activa?: boolean; tipo?: 'CENTRAL' | 'PUNTO_VENTA' } = {};

      if (activa !== undefined) {
        filtros.activa = activa === 'true';
      }
      if (tipo) {
        filtros.tipo = tipo;
      }

      const ubicaciones = await UbicacionService.listar(filtros);
      res.status(200).json({ ok: true, datos: ubicaciones });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        throw AppError.badRequest('El ID de la ubicación debe ser un número entero');
      }

      const ubicacion = await UbicacionService.obtenerPorId(id);
      res.status(200).json({ ok: true, datos: ubicacion });
    } catch (error) {
      next(error);
    }
  }

  static async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      const nueva = await UbicacionService.crear(req.body, adminId);
      res.status(201).json({ ok: true, datos: nueva });
    } catch (error) {
      next(error);
    }
  }

  static async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        throw AppError.badRequest('El ID de la ubicación debe ser un número entero');
      }
      const adminId = req.user?.id;
      const actualizada = await UbicacionService.actualizar(id, req.body, adminId);
      res.status(200).json({ ok: true, datos: actualizada });
    } catch (error) {
      next(error);
    }
  }

  static async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        throw AppError.badRequest('El ID de la ubicación debe ser un número entero');
      }
      const adminId = req.user?.id;
      const desactivada = await UbicacionService.desactivar(id, req.body, adminId);
      res.status(200).json({
        ok: true,
        mensaje: `Ubicación "${desactivada.nombre}" desactivada de forma segura (RN-UBI-05).`,
        datos: desactivada,
      });
    } catch (error) {
      next(error);
    }
  }
}
