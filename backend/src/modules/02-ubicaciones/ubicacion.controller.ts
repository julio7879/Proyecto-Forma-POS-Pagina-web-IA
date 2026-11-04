import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import { UbicacionService } from './ubicacion.service.js';
import type {
    ActualizarUbicacionInput,
    CrearUbicacionInput,
    DesactivarUbicacionInput,
    ListarUbicacionesQuery,
} from './ubicacion.schema.js';

function usuarioId(req: Request): number {
    if (!req.user) throw AppError.unauthorized('No autenticado');
    return req.user.id;
}

export class UbicacionController {
    static async listar(req: Request, res: Response, next: NextFunction) {
        try {
            // Ya validado/transformado por validateQuery
            const filtros = req.query as unknown as ListarUbicacionesQuery;
            const data = await UbicacionService.listar(filtros);
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await UbicacionService.obtenerPorId(Number(req.params.id));
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async crear(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await UbicacionService.crear(
                req.body as CrearUbicacionInput,
                usuarioId(req),
            );
            res.status(201).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async actualizar(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await UbicacionService.actualizar(
                Number(req.params.id),
                req.body as ActualizarUbicacionInput,
                usuarioId(req),
            );
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async desactivar(req: Request, res: Response, next: NextFunction) {
        try {
            const { motivo } = req.body as DesactivarUbicacionInput;
            const data = await UbicacionService.desactivar(
                Number(req.params.id),
                usuarioId(req),
                motivo,
            );
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async eliminar(_req: Request, _res: Response, next: NextFunction) {
        next(
            AppError.badRequest(
                'El borrado físico de ubicaciones está prohibido por integridad histórica (RN-GEN-07). Utilice la desactivación validada (RN-UBI-05).',
            ),
        );
    }
}