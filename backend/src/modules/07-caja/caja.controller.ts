import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import type {
  AperturaCajaInput,
  CierreCajaInput,
  ListarSesionesQuery,
  MovimientoCajaInput,
  RelevoTurnoCajaInput,
} from './caja.schema.js';
import { CajaService } from './caja.service.js';

function getUserId(req: Request): number {
  if (!req.user) throw AppError.unauthorized('No autenticado');
  return req.user.id;
}

export class CajaController {
  static async abrir(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const body = req.body as AperturaCajaInput;
      const datos = await CajaService.abrir(usuarioId, body);
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async registrarMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const body = req.body as MovimientoCajaInput;
      const datos = await CajaService.registrarMovimiento(usuarioId, body);
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async relevoTurno(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const body = req.body as RelevoTurnoCajaInput;
      const datos = await CajaService.relevoTurno(usuarioId, body);
      res.status(201).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async cerrar(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = getUserId(req);
      const body = req.body as CierreCajaInput;
      const datos = await CajaService.cerrar(usuarioId, body);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async sesionActiva(req: Request, res: Response, next: NextFunction) {
    try {
      // Ubicación desde query o desde la asignada al usuario
      const ubicacionIdQuery = req.query.ubicacionId ? Number(req.query.ubicacionId) : undefined;
      const ubicacionId = ubicacionIdQuery ?? req.user?.ubicacionId;
      if (!ubicacionId) {
        throw AppError.badRequest('Debe especificar ubicacionId para consultar la sesión activa');
      }
      const datos = await CajaService.obtenerSesionActiva(ubicacionId);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListarSesionesQuery;
      const datos = await CajaService.listar(query);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const datos = await CajaService.obtenerPorId(id);
      res.status(200).json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }
}
