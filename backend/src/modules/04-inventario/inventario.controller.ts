import type { Request, Response, NextFunction } from 'express';
import { InventarioService } from './inventario.service.js';

export class InventarioController {
  static async listarInventario(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoria, sku, ubicacionId, stockBajo, limite, offset } = req.query;

      const datos = await InventarioService.listarInventario({
        categoria: typeof categoria === 'string' ? categoria : undefined,
        sku: typeof sku === 'string' ? sku : undefined,
        ubicacionId: ubicacionId ? Number(ubicacionId) : undefined,
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

      const datos = await InventarioService.listarKardex({
        ubicacionId: ubicacionId ? Number(ubicacionId) : undefined,
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
