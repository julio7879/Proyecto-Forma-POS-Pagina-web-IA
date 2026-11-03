import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { prisma } from '../../../config/database.js';
import { generateToken } from '../../../shared/middlewares/authPermission.js';
import bcrypt from 'bcryptjs';

describe('Módulo 01: Endpoints HTTP de Autenticación (/api/auth)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/registro-cliente', () => {
    it('debe responder 201 Created cuando los datos son válidos y se acepta Ley 1581', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.usuario, 'create').mockResolvedValue({
        id: 15,
        nombreCompleto: 'Ana Valencia',
        correo: 'ana@valencia.com',
        rol: 'CLIENTE',
        activo: true,
        aceptoPrivacidadEn: new Date(),
      } as any);

      const res = await request(app)
        .post('/api/auth/registro-cliente')
        .send({
          nombreCompleto: 'Ana Valencia',
          correo: 'ana@valencia.com',
          password: 'PasswordSegura2026',
          aceptoPrivacidad: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.token).toBeDefined();
      expect(res.body.datos.usuario.correo).toBe('ana@valencia.com');
    });

    it('debe responder 400 Bad Request si no se acepta la privacidad (Ley 1581)', async () => {
      const res = await request(app)
        .post('/api/auth/registro-cliente')
        .send({
          nombreCompleto: 'Ana Valencia',
          correo: 'ana@valencia.com',
          password: 'PasswordSegura2026',
          aceptoPrivacidad: false, // Ley 1581 rechaza
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.detalles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            campo: 'aceptoPrivacidad',
          }),
        ])
      );
    });

    it('debe responder 400 Bad Request si la contraseña tiene menos de 8 caracteres', async () => {
      const res = await request(app)
        .post('/api/auth/registro-cliente')
        .send({
          nombreCompleto: 'Ana Valencia',
          correo: 'ana@valencia.com',
          password: 'corta',
          aceptoPrivacidad: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe responder 200 OK con token JWT al iniciar sesión correctamente', async () => {
      const hash = await bcrypt.hash('MiPassword123', 10);
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 25,
        nombreCompleto: 'Diana Vendedora',
        correo: 'diana@forma.com',
        passwordHash: hash,
        rol: 'VENDEDOR',
        ubicacionId: 2,
        topeDescuentoPorc: 10,
        activo: true,
        intentosFallidosLogin: 0,
        bloqueadoHasta: null,
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

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          correo: 'diana@forma.com',
          password: 'MiPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.token).toBeDefined();
      expect(res.body.datos.usuario.id).toBe(25);
    });

    it('debe responder 423 Locked cuando la cuenta se encuentra bloqueada por 15 minutos', async () => {
      const hash = await bcrypt.hash('MiPassword123', 10);
      const diezMinutosAdelante = new Date(Date.now() + 10 * 60 * 1000);

      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 25,
        correo: 'diana@forma.com',
        passwordHash: hash,
        activo: true,
        intentosFallidosLogin: 5,
        bloqueadoHasta: diezMinutosAdelante,
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          correo: 'diana@forma.com',
          password: 'MiPassword123',
        });

      expect(res.status).toBe(423);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('CUENTA_BLOQUEADA');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debe retornar 200 OK con el perfil del usuario autenticado', async () => {
      const token = generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' });

      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 1,
        nombreCompleto: 'Administrador Principal',
        correo: 'admin@forma.com',
        rol: 'ADMIN',
        activo: true,
        ubicacionId: null,
        topeDescuentoPorc: 100,
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
      } as any);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.correo).toBe('admin@forma.com');
      expect(res.body.datos.passwordHash).toBeUndefined();
    });

    it('debe retornar 401 Unauthorized si falta el token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });
  });
});
