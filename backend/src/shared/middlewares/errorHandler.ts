import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../domain/AppError.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        message: 'Error de validación de datos de entrada',
        detalles: err.issues.map((i) => ({
          campo: i.path.join('.'),
          mensaje: i.message,
        })),
      },
    });
    return;
  }

  console.error('[Unhandled Error]:', err);

  res.status(500).json({
    ok: false,
    error: {
      message: 'Error interno del servidor',
    },
  });
}
