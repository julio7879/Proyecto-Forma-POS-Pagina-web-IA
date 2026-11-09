import type { Request, Response, NextFunction } from 'express';
import { InventarioService } from './inventario.service.js';
import { AppError } from '../../shared/domain/AppError.js';

export class InventarioController {
  static async listarInventario(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoria, sku, ubicacionId, stockBajo, limite, offset } = req.query;
      const usuario = (req as any).user;
      let targetUbicacionId = ubicacionId ? Number(ubicacionId) : undefined;

      // RN-ROL-04 / CA-41: Si es vendedor sin permVerOtrosPuntos, restringir a su sede
      if (usuario && usuario.rol === 'VENDEDOR') {
        if (!usuario.permisos?.permVerOtrosPuntos) {
          if (targetUbicacionId && targetUbicacionId !== usuario.ubicacionId) {
            throw AppError.forbidden('No tiene permisos para consultar el inventario de otras sedes (RN-ROL-04, CA-41)');
          }
          if (!targetUbicacionId) {
            targetUbicacionId = usuario.ubicacionId;
          }
        }
      }

      const datos = await InventarioService.listarInventario({
        categoria: typeof categoria === 'string' ? categoria : undefined,
        sku: typeof sku === 'string' ? sku : undefined,
        ubicacionId: targetUbicacionId,
        stockBajo: stockBajo === 'true',
        limite: limite ? Number(limite) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.status(200).json({
        ok: true,
        datos,
        total: datos.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async ingresoProduccion(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = (req as any).user?.id || 1;
      const resultado = await InventarioService.ingresoProduccion(usuarioId, req.body);
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  static async listarKardex(req: Request, res: Response, next: NextFunction) {
    try {
      const { ubicacionId, varianteId, tipo, desde, hasta, limite } = req.query;
      const usuario = (req as any).user;
      let targetUbicacionId = ubicacionId ? Number(ubicacionId) : undefined;

      // RN-ROL-04 / CA-41: Si es vendedor sin permVerOtrosPuntos, restringir a su sede
      if (usuario && usuario.rol === 'VENDEDOR') {
        if (!usuario.permisos?.permVerOtrosPuntos) {
          if (targetUbicacionId && targetUbicacionId !== usuario.ubicacionId) {
            throw AppError.forbidden('No tiene permisos para consultar movimientos kardex de otras sedes (RN-ROL-04, CA-41)');
          }
          if (!targetUbicacionId) {
            targetUbicacionId = usuario.ubicacionId;
          }
        }
      }

      const datos = await InventarioService.listarKardex({
        ubicacionId: targetUbicacionId,
        varianteId: varianteId ? Number(varianteId) : undefined,
        tipo: typeof tipo === 'string' ? tipo : undefined,
        desde: typeof desde === 'string' ? desde : undefined,
        hasta: typeof hasta === 'string' ? hasta : undefined,
        limite: limite ? Number(limite) : undefined,
      });

      res.status(200).json({
        ok: true,
        datos,
        total: datos.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async ajusteStock(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = (req as any).user?.id || 1;
      const resultado = await InventarioService.ajusteStock(usuarioId, req.body);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}
