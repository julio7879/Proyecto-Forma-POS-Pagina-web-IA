import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import type { UserAuthSnapshot } from '../../shared/middlewares/authPermission.js';
import type {
  CheckoutWebInput,
  CotizarFleteInput,
  ListarPedidosWebQuery,
} from './pedidoWeb.schema.js';
import { PedidoWebService } from './pedidoWeb.service.js';

function getAuthUser(req: Request): UserAuthSnapshot {
  if (!req.user) {
    throw AppError.unauthorized('No autenticado');
  }
  return req.user;
}

export class PedidoWebController {
  static async cotizarFlete(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as CotizarFleteInput;
      const datos = await PedidoWebService.cotizarFlete(body);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const body = req.body as CheckoutWebInput;
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const datos = await PedidoWebService.checkout(body, user, idempotencyKey);
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const datos = await PedidoWebService.obtenerPorId(id, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const filtros = req.query as unknown as ListarPedidosWebQuery;
      const datos = await PedidoWebService.listar(filtros, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async ejecutarWorkerExpiracion(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const datos = await PedidoWebService.ejecutarWorkerExpiracion(user.id);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }
}
