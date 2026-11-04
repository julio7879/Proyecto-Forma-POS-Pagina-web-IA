import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import type {
    CancelarCompraInput,
    CrearCompraInput,
    ListarComprasQuery,
    RecibirCompraInput,
} from './compra.schema.js';
import { CompraService } from './compra.service.js';

function getUserId(req: Request): number {
    if (!req.user) {
        throw AppError.unauthorized('No autenticado');
    }
    return req.user.id;
}

export class CompraController {
    static async listar(req: Request, res: Response, next: NextFunction) {
        try {
            const filtros = req.query as unknown as ListarComprasQuery;
            const datos = await CompraService.listar(filtros);
            res.status(200).json({ ok: true, datos });
        } catch (e) {
            next(e);
        }
    }

    static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const datos = await CompraService.obtenerPorId(id);
            res.status(200).json({ ok: true, datos });
        } catch (e) {
            next(e);
        }
    }

    static async crear(req: Request, res: Response, next: NextFunction) {
        try {
            const usuarioId = getUserId(req);
            const body = req.body as CrearCompraInput;
            const datos = await CompraService.crear(body, usuarioId);
            res.status(201).json({ ok: true, datos });
        } catch (e) {
            next(e);
        }
    }

    static async cancelar(req: Request, res: Response, next: NextFunction) {
        try {
            const usuarioId = getUserId(req);
            const id = Number(req.params.id);
            const body = (req.body ?? {}) as CancelarCompraInput;
            const datos = await CompraService.cancelar(id, usuarioId, body.motivo);
            res.status(200).json({ ok: true, datos });
        } catch (e) {
            next(e);
        }
    }

    static async recibir(req: Request, res: Response, next: NextFunction) {
        try {
            const usuarioId = getUserId(req);
            const id = Number(req.params.id);
            const body = req.body as RecibirCompraInput | undefined;
            const idempotencyKey = req.headers['idempotency-key'] as string;
            const datos = await CompraService.recibir(id, usuarioId, body, idempotencyKey);
            res.status(200).json({ ok: true, datos });
        } catch (e) {
            next(e);
        }
    }

    // RN-GEN-07 / RN-GEN-03: las compras tienen valor histórico; jamás se borran físicamente.
    static async eliminar(_req: Request, _res: Response, next: NextFunction) {
        try {
            throw AppError.badRequest(
                'El borrado físico de órdenes de compra está prohibido por trazabilidad contable (RN-GEN-07). Si la orden no se ejecutará, cancélela.'
            );
        } catch (e) {
            next(e);
        }
    }
}