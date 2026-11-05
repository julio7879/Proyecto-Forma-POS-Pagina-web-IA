import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import { DescuentoService } from './descuento.service.js';
import type {
    CalcularDescuentoCarritoInput,
    CrearPromocionInput,
    ListarPromocionesQuery,
    ValidarCuponInput,
} from './descuento.schema.js';

function usuarioId(req: Request): number {
    if (!req.user) throw AppError.unauthorized('No autenticado');
    return req.user.id;
}

export class DescuentoController {
    static async calcular(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await DescuentoService.calcularDescuentoCarrito(
                req.body as CalcularDescuentoCarritoInput,
                req.user,
            );
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async validarCupon(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await DescuentoService.validarYAplicarCupon(req.body as ValidarCuponInput, req.user);
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async listarPromociones(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await DescuentoService.listarPromociones(req.query as unknown as ListarPromocionesQuery);
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async crearPromocion(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await DescuentoService.crearPromocion(req.body as CrearPromocionInput, usuarioId(req));
            res.status(201).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async desactivarPromocion(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await DescuentoService.desactivarPromocion(Number(req.params.id), usuarioId(req));
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async eliminarPromocion(_req: Request, _res: Response, next: NextFunction) {
        next(
            AppError.badRequest(
                'El borrado físico de promociones está prohibido (RN-GEN-07). Utilice la desactivación lógica.',
            ),
        );
    }
}