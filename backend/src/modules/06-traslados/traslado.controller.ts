import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import type { UserAuthSnapshot } from '../../shared/middlewares/authPermission.js';
import type {
  CancelarTrasladoInput,
  ConfirmarRetornoInput,
  DespacharTrasladoInput,
  EvaluarTrasladoInput,
  ListarTrasladosQuery,
  RecibirTrasladoInput,
  ResolverNovedadInput,
  SolicitarTrasladoInput,
} from './traslado.schema.js';
import { TrasladoService } from './traslado.service.js';

function getAuthUser(req: Request): UserAuthSnapshot {
  if (!req.user) {
    throw AppError.unauthorized('No autenticado');
  }
  return req.user;
}

export class TrasladoController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const filtros = req.query as unknown as ListarTrasladosQuery;
      const datos = await TrasladoService.listar(filtros, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const datos = await TrasladoService.obtenerPorId(id, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async solicitar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const body = req.body as SolicitarTrasladoInput;
      const datos = await TrasladoService.solicitar(body, user);
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async evaluar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const body = req.body as EvaluarTrasladoInput;
      const datos = await TrasladoService.evaluar(id, body, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async despachar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const body = req.body as DespacharTrasladoInput;
      const datos = await TrasladoService.despachar(id, body, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async cancelar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const body = req.body as CancelarTrasladoInput;
      const datos = await TrasladoService.cancelar(id, body, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async confirmarRetorno(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const body = req.body as ConfirmarRetornoInput;
      const datos = await TrasladoService.confirmarRetorno(id, body, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async recibir(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const body = req.body as RecibirTrasladoInput;
      const datos = await TrasladoService.recibir(id, body, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async resolverNovedad(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const id = Number(req.params.id);
      const body = req.body as ResolverNovedadInput;
      const datos = await TrasladoService.resolverNovedad(id, body, user);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }
}
