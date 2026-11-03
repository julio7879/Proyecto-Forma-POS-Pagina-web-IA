import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../domain/AppError.js';
import { prisma } from '../../config/database.js';

export interface UserAuthSnapshot {
  id: number;
  correo: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
  ubicacionId: number | null;
  activo: boolean;
  topeDescuentoPorc: number;
  permisos: {
    permVender: boolean;
    permCaja: boolean;
    permDescuentoManual: boolean;
    permAnularVentas: boolean;
    permDevoluciones: boolean;
    permVerInventario: boolean;
    permSolicitarTraslado: boolean;
    permRecibirTraslado: boolean;
    permVerOtrosPuntos: boolean;
    permPedidosWeb: boolean;
    permVerVentasPunto: boolean;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: UserAuthSnapshot;
    }
  }
}

/**
 * Caché en memoria para validación O(1) con revocación instantánea (CA-50, RN-ROL-05).
 */
export class UserPermissionCache {
  private static cache = new Map<number, { snapshot: UserAuthSnapshot; cachedAt: number }>();
  private static TTL_MS = 60 * 1000; // 1 minuto de resguardo si no hay cambios

  static get(userId: number): UserAuthSnapshot | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.TTL_MS) {
      this.cache.delete(userId);
      return null;
    }
    return entry.snapshot;
  }

  static set(userId: number, snapshot: UserAuthSnapshot): void {
    this.cache.set(userId, { snapshot, cachedAt: Date.now() });
  }

  /**
   * Invalida de inmediato la caché de un usuario cuando cambian sus permisos o sede (CA-50).
   */
  static invalidate(userId: number): void {
    this.cache.delete(userId);
  }

  static has(userId: number): boolean {
    return this.get(userId) !== null;
  }

  static size(): number {
    return this.cache.size;
  }

  static clear(): void {
    this.cache.clear();
  }
}

/**
 * Función pública de invalidación para ser llamada desde servicios (ej. al editar permisos en caliente).
 */
export function invalidateUserPermissions(userId: number): void {
  UserPermissionCache.invalidate(userId);
}

/**
 * Genera un token JWT firmado para la sesión de usuario.
 */
export function generateToken(
  payload: { userId: number; correo: string; rol: 'ADMIN' | 'VENDEDOR' | 'CLIENTE' },
  expiresIn: string | number = '8h'
): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export async function authenticateJWT(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Encabezado de autorización ausente o con formato incorrecto');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw AppError.unauthorized('Token ausente');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };
    let userSnapshot = UserPermissionCache.get(decoded.userId);

    if (!userSnapshot) {
      const dbUser = await prisma.usuario.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          correo: true,
          rol: true,
          ubicacionId: true,
          activo: true,
          topeDescuentoPorc: true,
          permVender: true,
          permCaja: true,
          permDescuentoManual: true,
          permAnularVentas: true,
          permDevoluciones: true,
          permVerInventario: true,
          permSolicitarTraslado: true,
          permRecibirTraslado: true,
          permVerOtrosPuntos: true,
          permPedidosWeb: true,
          permVerVentasPunto: true,
        },
      });

      if (!dbUser || !dbUser.activo) {
        throw AppError.unauthorized('Usuario inactivo o no encontrado');
      }

      userSnapshot = {
        id: dbUser.id,
        correo: dbUser.correo,
        rol: dbUser.rol,
        ubicacionId: dbUser.ubicacionId,
        activo: dbUser.activo,
        topeDescuentoPorc: dbUser.topeDescuentoPorc,
        permisos: {
          permVender: dbUser.permVender,
          permCaja: dbUser.permCaja,
          permDescuentoManual: dbUser.permDescuentoManual,
          permAnularVentas: dbUser.permAnularVentas,
          permDevoluciones: dbUser.permDevoluciones,
          permVerInventario: dbUser.permVerInventario,
          permSolicitarTraslado: dbUser.permSolicitarTraslado,
          permRecibirTraslado: dbUser.permRecibirTraslado,
          permVerOtrosPuntos: dbUser.permVerOtrosPuntos,
          permPedidosWeb: dbUser.permPedidosWeb,
          permVerVentasPunto: dbUser.permVerVentasPunto,
        },
      };

      UserPermissionCache.set(decoded.userId, userSnapshot);
    }

    req.user = userSnapshot;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized('Token inválido o expirado');
  }
}

export function requireRole(...roles: Array<'ADMIN' | 'VENDEDOR' | 'CLIENTE'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.rol)) {
      throw AppError.forbidden(`Acceso restringido a los roles: ${roles.join(', ')}`);
    }
    next();
  };
}

export function requirePermission(permission: keyof UserAuthSnapshot['permisos']) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    // El Administrador tiene todos los permisos activos por diseño (RN-ROL-03)
    if (req.user.rol === 'ADMIN') {
      return next();
    }
    if (!req.user.permisos[permission]) {
      throw AppError.forbidden(`Permiso requerido no concedido: ${permission}`);
    }
    next();
  };
}
