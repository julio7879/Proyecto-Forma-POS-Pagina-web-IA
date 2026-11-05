import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/domain/AppError.js';
import { AlertaService } from './alerta.service.js';
import type { AtenderAlertaInput, ListarAlertasQuery } from './alerta.schema.js';

export class AlertaController {
    static async listar(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw AppError.unauthorized('No autenticado');
            const data = await AlertaService.listarAlertas(req.query as unknown as ListarAlertasQuery, req.user);
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }

    static async atender(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw AppError.unauthorized('No autenticado');
            const { notas } = req.body as AtenderAlertaInput;
            const data = await AlertaService.atenderAlerta(String(req.params.id), req.user, notas);
            res.status(200).json({ ok: true, datos: data });
        } catch (e) {
            next(e);
        }
    }
}