import type { Request, Response, NextFunction } from 'express';
import { DescuentosService } from './descuentos.service.js';

export class DescuentosController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const promociones = await DescuentosService.listarPromociones();
      res.status(200).json({
        ok: true,
        datos: promociones,
        total: promociones.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const promocion = await DescuentosService.crearPromocion(req.body);
      res.status(201).json({
        ok: true,
        mensaje: 'Promoción creada exitosamente',
        datos: promocion,
      });
    } catch (error) {
      next(error);
    }
  }

  static async validar(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await DescuentosService.validarCupon(req.body);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}
