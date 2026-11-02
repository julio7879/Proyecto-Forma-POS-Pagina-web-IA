import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  UserPermissionCache,
  authenticateJWT,
  requireRole,
  requirePermission,
  generateToken,
  invalidateUserPermissions,
  type UserAuthSnapshot,
} from '../../../shared/middlewares/authPermission.js';
import { AppError } from '../../../shared/domain/AppError.js';
import { env } from '../../../config/env.js';
import { prisma } from '../../../config/database.js';

describe('Módulo 01: Auth JWT y UserPermissionCache (CA-50, RN-ROL-01 a RN-ROL-05)', () => {
  beforeEach(() => {
    UserPermissionCache.clear();
    vi.restoreAllMocks();
  });

  const mockVendedorSnapshot: UserAuthSnapshot = {
    id: 10,
    correo: 'vendedor@forma.com',
    rol: 'VENDEDOR',
    ubicacionId: 2,
    activo: true,
    topeDescuentoPorc: 15,
    permisos: {
      permVender: true,
      permCaja: true,
      permDescuentoManual: false,
      permAnularVentas: false,
      permDevoluciones: false,
      permVerInventario: true,
      permSolicitarTraslado: true,
      permRecibirTraslado: true,
      permVerOtrosPuntos: false,
      permPedidosWeb: false,
      permVerVentasPunto: true,
    },
  };

  const mockAdminSnapshot: UserAuthSnapshot = {
    id: 1,
    correo: 'admin@forma.com',
    rol: 'ADMIN',
    ubicacionId: null,
    activo: true,
    topeDescuentoPorc: 100,
    permisos: {
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
  };

  describe('1. Motor de Caché en Memoria (UserPermissionCache)', () => {
    it('debe almacenar y recuperar un snapshot en O(1)', () => {
      UserPermissionCache.set(10, mockVendedorSnapshot);
      const retrieved = UserPermissionCache.get(10);
      expect(retrieved).toEqual(mockVendedorSnapshot);
      expect(UserPermissionCache.has(10)).toBe(true);
      expect(UserPermissionCache.size()).toBe(1);
    });

    it('debe revocar instantáneamente la entrada al invocar invalidate (CA-50)', () => {
      UserPermissionCache.set(10, mockVendedorSnapshot);
      expect(UserPermissionCache.has(10)).toBe(true);

      invalidateUserPermissions(10);
      expect(UserPermissionCache.has(10)).toBe(false);
      expect(UserPermissionCache.get(10)).toBeNull();
      expect(UserPermissionCache.size()).toBe(0);
    });

    it('debe expirar la entrada tras el TTL configurado', () => {
      vi.useFakeTimers();
      UserPermissionCache.set(10, mockVendedorSnapshot);
      expect(UserPermissionCache.get(10)).not.toBeNull();

      // Avanzar el reloj 61 segundos (TTL es 60s)
      vi.advanceTimersByTime(61 * 1000);
      expect(UserPermissionCache.get(10)).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('2. Middleware authenticateJWT', () => {
    it('debe rechazar peticiones sin encabezado Authorization', async () => {
      const req = { headers: {} } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      await expect(authenticateJWT(req, res, next)).rejects.toThrow(AppError);
      await expect(authenticateJWT(req, res, next)).rejects.toThrow('Encabezado de autorización ausente');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe rechazar tokens con firma inválida o corrupta', async () => {
      const req = {
        headers: { authorization: 'Bearer token-invalido-123' },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      await expect(authenticateJWT(req, res, next)).rejects.toThrow(AppError);
      await expect(authenticateJWT(req, res, next)).rejects.toThrow('Token inválido o expirado');
      expect(next).not.toHaveBeenCalled();
    });

    it('debe poblar la caché en la primera petición y usar O(1) en las siguientes', async () => {
      const token = generateToken({ userId: 10, correo: 'vendedor@forma.com', rol: 'VENDEDOR' });
      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      // Mock de la consulta a Prisma
      const findUniqueSpy = vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValueOnce({
        id: 10,
        correo: 'vendedor@forma.com',
        rol: 'VENDEDOR',
        ubicacionId: 2,
        activo: true,
        topeDescuentoPorc: 15,
        permVender: true,
        permCaja: true,
        permDescuentoManual: false,
        permAnularVentas: false,
        permDevoluciones: false,
        permVerInventario: true,
        permSolicitarTraslado: true,
        permRecibirTraslado: true,
        permVerOtrosPuntos: false,
        permPedidosWeb: false,
        permVerVentasPunto: true,
      } as any);

      // Petición 1: Fallo de caché -> consulta BD
      await authenticateJWT(req, res, next);
      expect(findUniqueSpy).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(10);
      expect(next).toHaveBeenCalledTimes(1);

      // Petición 2: Acierto de caché -> NO consulta BD (O(1))
      const req2 = {
        headers: { authorization: `Bearer ${token}` },
      } as unknown as Request;
      const next2 = vi.fn() as NextFunction;

      await authenticateJWT(req2, res, next2);
      expect(findUniqueSpy).toHaveBeenCalledTimes(1); // Sigue siendo 1
      expect(req2.user?.id).toBe(10);
      expect(next2).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar con 401 si el usuario en base de datos está inactivo', async () => {
      const token = generateToken({ userId: 99, correo: 'inactivo@forma.com', rol: 'VENDEDOR' });
      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValueOnce({
        id: 99,
        correo: 'inactivo@forma.com',
        rol: 'VENDEDOR',
        activo: false,
      } as any);

      await expect(authenticateJWT(req, res, next)).rejects.toThrow('Usuario inactivo o no encontrado');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('3. Revocación Instantánea en Caliente (CA-50, RN-ROL-05)', () => {
    it('al invalidar la caché tras desactivar o editar permisos, surte efecto inmediato en la siguiente petición', async () => {
      const token = generateToken({ userId: 10, correo: 'vendedor@forma.com', rol: 'VENDEDOR' });
      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      // 1. Usuario activo inicialmente
      const findUniqueSpy = vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 10,
        correo: 'vendedor@forma.com',
        rol: 'VENDEDOR',
        ubicacionId: 2,
        activo: true,
        topeDescuentoPorc: 15,
        permVender: true,
        permCaja: true,
        permDescuentoManual: true, // Inicialmente tiene permiso
        permAnularVentas: false,
        permDevoluciones: false,
        permVerInventario: true,
        permSolicitarTraslado: true,
        permRecibirTraslado: true,
        permVerOtrosPuntos: false,
        permPedidosWeb: false,
        permVerVentasPunto: true,
      } as any);

      await authenticateJWT(req, res, next);
      expect(req.user?.permisos.permDescuentoManual).toBe(true);

      // 2. Admin revoca el permiso y desactiva al vendedor en BD
      findUniqueSpy.mockResolvedValueOnce({
        id: 10,
        correo: 'vendedor@forma.com',
        rol: 'VENDEDOR',
        ubicacionId: 2,
        activo: false, // Desactivado
      } as any);

      // Invocación instantánea del evento de cambio
      invalidateUserPermissions(10);

      // 3. La siguiente petición del mismo token es rechazada de inmediato sin esperar expiración del JWT
      const reqPostRevocacion = {
        headers: { authorization: `Bearer ${token}` },
      } as unknown as Request;
      const nextPost = vi.fn() as NextFunction;

      await expect(authenticateJWT(reqPostRevocacion, res, nextPost)).rejects.toThrow('Usuario inactivo o no encontrado');
      expect(nextPost).not.toHaveBeenCalled();
    });
  });

  describe('4. Middleware requireRole', () => {
    it('debe permitir acceso cuando el rol coincide', () => {
      const req = { user: mockAdminSnapshot } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      requireRole('ADMIN')(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar con 403 Forbidden cuando el rol no coincide', () => {
      const req = { user: mockVendedorSnapshot } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      expect(() => requireRole('ADMIN')(req, res, next)).toThrow(AppError);
      expect(() => requireRole('ADMIN')(req, res, next)).toThrow('Acceso restringido a los roles: ADMIN');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('5. Matriz de los 11 Permisos (CA-03, RN-ROL-02, RN-ROL-03)', () => {
    it('ADMIN siempre tiene todos los permisos activos por diseño (RN-ROL-03)', () => {
      const req = { user: mockAdminSnapshot } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      // Incluso si se consulta cualquier permiso, el Admin pasa directo
      requirePermission('permDescuentoManual')(req, res, next);
      requirePermission('permAnularVentas')(req, res, next);
      requirePermission('permDevoluciones')(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);
    });

    it('VENDEDOR pasa cuando tiene el permiso en true', () => {
      const req = { user: mockVendedorSnapshot } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      requirePermission('permVender')(req, res, next);
      requirePermission('permVerInventario')(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('VENDEDOR es rechazado con 403 cuando el permiso es false', () => {
      const req = { user: mockVendedorSnapshot } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      expect(() => requirePermission('permDescuentoManual')(req, res, next)).toThrow(
        'Permiso requerido no concedido: permDescuentoManual'
      );
      expect(() => requirePermission('permAnularVentas')(req, res, next)).toThrow(
        'Permiso requerido no concedido: permAnularVentas'
      );
      expect(() => requirePermission('permDevoluciones')(req, res, next)).toThrow(
        'Permiso requerido no concedido: permDevoluciones'
      );
      expect(() => requirePermission('permVerOtrosPuntos')(req, res, next)).toThrow(
        'Permiso requerido no concedido: permVerOtrosPuntos'
      );
      expect(() => requirePermission('permPedidosWeb')(req, res, next)).toThrow(
        'Permiso requerido no concedido: permPedidosWeb'
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
