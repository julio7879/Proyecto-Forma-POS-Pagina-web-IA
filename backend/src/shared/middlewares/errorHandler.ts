import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
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

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        ok: false,
        error: {
          message: 'Conflicto de unicidad: el registro o clave única ya existe en el sistema.',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        },
      });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({
        ok: false,
        error: {
          message: 'Referencia inválida: la entidad relacionada no existe.',
          code: 'FOREIGN_KEY_VIOLATION',
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        ok: false,
        error: {
          message: 'El registro solicitado no fue encontrado.',
          code: 'NOT_FOUND',
        },
      });
      return;
    }
  }

  console.error('[Unhandled Error]:', err);

  res.status(500).json({
    ok: false,
    error: {
      message: 'Error interno del servidor',
    },
  });
}
