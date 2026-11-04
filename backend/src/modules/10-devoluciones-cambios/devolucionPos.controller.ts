import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import type {
  AnularVentaPosInput,
  ListarDevolucionesQuery,
  RegistrarCambioPosInput,
  RegistrarDevolucionPosInput,
} from './devolucionPos.schema.js';
import { DevolucionPosService } from './devolucionPos.service.js';

function getUserId(req: Request): number {
  if (!req.user) throw AppError.unauthorized('No autenticado');
  return req.user.id;
}

export class DevolucionPosController {
  static async registrarDevolucion(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const esAdmin = req.user?.rol === 'ADMIN';
      const body = req.body as RegistrarDevolucionPosInput;
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      const datos = await DevolucionPosService.registrarDevolucion(
        usuarioId,
        body,
        idempotencyKey,
        esAdmin
      );
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async registrarCambio(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const esAdmin = req.user?.rol === 'ADMIN';
      const body = req.body as RegistrarCambioPosInput;
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      const datos = await DevolucionPosService.registrarCambio(
        usuarioId,
        body,
        idempotencyKey,
        esAdmin
      );
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async anularVenta(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const id = Number(req.params.id);
      const body = req.body as AnularVentaPosInput;

      const datos = await DevolucionPosService.anularVenta(id, usuarioId, body);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListarDevolucionesQuery;
      const datos = await DevolucionPosService.listar(query);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const datos = await DevolucionPosService.obtenerPorId(id);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }
}
