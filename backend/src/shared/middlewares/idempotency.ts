import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { AppError } from '../domain/AppError.js';

export async function requireIdempotencyKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    throw AppError.badRequest('Encabezado Idempotency-Key es obligatorio para esta operación transaccional (RN-GEN-08).');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized();
  }

  const existing = await prisma.registroIdempotencia.findUnique({
    where: {
      idempotencyKey_usuarioId: {
        idempotencyKey,
        usuarioId: userId,
      },
    },
  });

  if (existing) {
    // Si ya fue procesado, retorna la respuesta cacheada sin duplicar efectos (CA-08, CA-18)
    res.status(existing.statusCode).json(existing.responseBody);
    return;
  }

  next();
}
