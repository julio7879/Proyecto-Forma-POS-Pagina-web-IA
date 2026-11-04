import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import type { CrearVentaPosInput, ListarVentasPosQuery } from './ventaPos.schema.js';
import { VentaPosService } from './ventaPos.service.js';

function getUserId(req: Request): number {
  if (!req.user) throw AppError.unauthorized('No autenticado');
  return req.user.id;
}

export class VentaPosController {
  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const body = req.body as CrearVentaPosInput;
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      const datos = await VentaPosService.crear(usuarioId, body, idempotencyKey);
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListarVentasPosQuery;
      const datos = await VentaPosService.listar(query);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const datos = await VentaPosService.obtenerPorId(id);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }
}
