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

  // Interceptar res.json para persistir la respuesta exitosa en RegistroIdempotencia (RN-GEN-08)
  const originalJson = res.json.bind(res);
  res.json = ((body: any) => {
    if (res.statusCode < 400) {
      prisma.registroIdempotencia
        .create({
          data: {
            idempotencyKey,
            usuarioId: userId,
            endpoint: req.originalUrl || req.path,
            statusCode: res.statusCode,
            responseBody: body,
          },
        })
        .catch((err) => {
          // Log pero sin bloquear la respuesta si ya fue procesada exitosamente
          console.error('Error guardando registro de idempotencia:', err);
        });
    }
    return originalJson(body);
  }) as any;

  next();
}
