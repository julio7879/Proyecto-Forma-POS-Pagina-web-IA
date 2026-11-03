import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service.js';
import { prisma } from '../../../config/database.js';
import { AppError } from '../../../shared/domain/AppError.js';
import { UserPermissionCache } from '../../../shared/middlewares/authPermission.js';

describe('Módulo 01: AuthService - Autenticación Híbrida y Bloqueo (RF-USU-01, RF-USU-02, RN-ROL-06)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    UserPermissionCache.clear();
  });

  describe('1. Registro de Clientes (RF-USU-01, RN-ROL-06)', () => {
    it('debe registrar un nuevo cliente con hash bcrypt y consentimiento Ley 1581', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);

      const createSpy = vi.spyOn(prisma.usuario, 'create').mockResolvedValue({
        id: 101,
        nombreCompleto: 'Laura Restrepo',
        correo: 'laura@ejemplo.com',
        rol: 'CLIENTE',
        activo: true,
        aceptoPrivacidadEn: new Date(),
      } as any);

      const resultado = await AuthService.registrarCliente({
        nombreCompleto: 'Laura Restrepo',
        correo: 'laura@ejemplo.com',
        password: 'Password123!',
        aceptoPrivacidad: true,
        telefono: '3001234567',
      });

      expect(createSpy).toHaveBeenCalledTimes(1);
      const callData = createSpy.mock.calls[0]![0].data as any;
      expect(callData.rol).toBe('CLIENTE');
      expect(callData.authProvider).toBe('LOCAL');
      expect(callData.aceptoPrivacidadEn).toBeInstanceOf(Date);
      // Validar que la contraseña esté hasheada con bcrypt
      expect(callData.passwordHash).not.toBe('Password123!');
      expect(await bcrypt.compare('Password123!', callData.passwordHash)).toBe(true);

      expect(resultado.token).toBeDefined();
      expect(resultado.usuario.correo).toBe('laura@ejemplo.com');
    });

    it('debe rechazar el registro si el correo ya existe en el sistema (409 Conflict)', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ id: 5 } as any);

      await expect(
        AuthService.registrarCliente({
          nombreCompleto: 'Duplicado',
          correo: 'existente@forma.com',
          password: 'Password123!',
          aceptoPrivacidad: true,
        })
      ).rejects.toThrow('Ya existe una cuenta registrada con este correo electrónico');
    });
  });

  describe('2. Login Tradicional y Protección contra Fuerza Bruta (RF-USU-02, RN-ROL-08)', () => {
    const passwordOriginal = 'ClaveSegura2026';
    let passwordHash: string;

    beforeEach(async () => {
      passwordHash = await bcrypt.hash(passwordOriginal, 10);
    });

    it('debe iniciar sesión exitosamente con credenciales correctas y resetear intentos', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 20,
        nombreCompleto: 'Carlos Cajero',
        correo: 'carlos@forma.com',
        passwordHash,
        rol: 'VENDEDOR',
        ubicacionId: 1,
        topeDescuentoPorc: 10,
        activo: true,
        intentosFallidosLogin: 3, // Tenía intentos fallidos previos
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

      const updateSpy = vi.spyOn(prisma.usuario, 'update').mockResolvedValue({} as any);

      const respuesta = await AuthService.login({
        correo: 'carlos@forma.com',
        password: passwordOriginal,
      });

      expect(respuesta.token).toBeDefined();
      expect(respuesta.usuario.id).toBe(20);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { intentosFallidosLogin: 0, bloqueadoHasta: null },
      });
    });

    it('debe incrementar atómicamente el contador de intentos fallidos en contraseñas incorrectas', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 20,
        correo: 'carlos@forma.com',
        passwordHash,
        activo: true,
        intentosFallidosLogin: 2,
        bloqueadoHasta: null,
      } as any);

      const updateSpy = vi.spyOn(prisma.usuario, 'update').mockResolvedValue({
        id: 20,
        intentosFallidosLogin: 3,
      } as any);

      await expect(
        AuthService.login({
          correo: 'carlos@forma.com',
          password: 'PasswordErronea',
        })
      ).rejects.toThrow('Credenciales incorrectas. Intentos restantes antes del bloqueo: 2');

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { intentosFallidosLogin: { increment: 1 } },
        select: { id: true, intentosFallidosLogin: true },
      });
    });

    it('debe bloquear la cuenta por 15 minutos exactos al llegar al 5.° intento fallido (RF-USU-02)', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 20,
        correo: 'carlos@forma.com',
        passwordHash,
        activo: true,
        intentosFallidosLogin: 4, // Intento 4 previo -> el siguiente es el 5.°
        bloqueadoHasta: null,
      } as any);

      const updateSpy = vi.spyOn(prisma.usuario, 'update')
        .mockResolvedValueOnce({ id: 20, intentosFallidosLogin: 5 } as any)
        .mockResolvedValueOnce({} as any);

      const errorPromesa = AuthService.login({
        correo: 'carlos@forma.com',
        password: 'PasswordErronea',
      });

      await expect(errorPromesa).rejects.toThrow(AppError);
      await expect(errorPromesa).rejects.toThrow(
        'Ha superado el límite de 5 intentos fallidos. Su cuenta ha sido bloqueada temporalmente por 15 minutos.'
      );

      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy.mock.calls[0]![0].data).toEqual({ intentosFallidosLogin: { increment: 1 } });
      const updateData2 = updateSpy.mock.calls[1]![0].data as any;
      expect(updateData2.bloqueadoHasta).toBeInstanceOf(Date);

      // Comprobar que la fecha de bloqueo sea ~15 minutos en el futuro
      const diffMin = (updateData2.bloqueadoHasta.getTime() - Date.now()) / (60 * 1000);
      expect(Math.round(diffMin)).toBe(15);
    });

    it('debe rechazar inmediatamente peticiones a una cuenta bloqueada (423 Locked) sin chequear la contraseña', async () => {
      const bcryptCompareSpy = vi.spyOn(bcrypt, 'compare');
      const bloqueadoHasta = new Date(Date.now() + 10 * 60 * 1000); // Bloqueada por 10 min más

      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 20,
        correo: 'carlos@forma.com',
        passwordHash,
        activo: true,
        intentosFallidosLogin: 5,
        bloqueadoHasta,
      } as any);

      const errorPromesa = AuthService.login({
        correo: 'carlos@forma.com',
        password: passwordOriginal, // Incluso con la clave correcta
      });

      await expect(errorPromesa).rejects.toThrow('Cuenta bloqueada por seguridad debido a múltiples intentos fallidos');
      expect(bcryptCompareSpy).not.toHaveBeenCalled();
    });

    it('debe orientar al usuario si la cuenta fue creada con Google OAuth y carece de password', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 30,
        correo: 'social@gmail.com',
        passwordHash: null,
        activo: true,
        intentosFallidosLogin: 0,
        bloqueadoHasta: null,
      } as any);

      await expect(
        AuthService.login({
          correo: 'social@gmail.com',
          password: 'CualquierPassword',
        })
      ).rejects.toThrow('Esta cuenta fue creada con Google OAuth');
    });
  });

  describe('3. Autenticación con Google OAuth (RN-ROL-06)', () => {
    it('debe crear un nuevo usuario CLIENTE si no existe previamente', async () => {
      vi.spyOn(prisma.usuario, 'findFirst').mockResolvedValue(null);

      const createSpy = vi.spyOn(prisma.usuario, 'create').mockResolvedValue({
        id: 50,
        nombreCompleto: 'Usuario Google',
        correo: 'google@gmail.com',
        googleId: 'g-123456789',
        rol: 'CLIENTE',
        activo: true,
      } as any);

      const resultado = await AuthService.loginGoogle({
        googleId: 'g-123456789',
        correo: 'google@gmail.com',
        nombreCompleto: 'Usuario Google',
      });

      expect(createSpy).toHaveBeenCalledTimes(1);
      const data = createSpy.mock.calls[0]![0].data as any;
      expect(data.rol).toBe('CLIENTE');
      expect(data.authProvider).toBe('GOOGLE');
      expect(data.googleId).toBe('g-123456789');

      expect(resultado.token).toBeDefined();
      expect(resultado.usuario.id).toBe(50);
    });

    it('debe vincular googleId si el usuario existía por correo pero sin googleId', async () => {
      vi.spyOn(prisma.usuario, 'findFirst').mockResolvedValue({
        id: 55,
        correo: 'existente@gmail.com',
        googleId: null,
        rol: 'CLIENTE',
        activo: true,
      } as any);

      const updateSpy = vi.spyOn(prisma.usuario, 'update').mockResolvedValue({
        id: 55,
        correo: 'existente@gmail.com',
        googleId: 'g-987654321',
        rol: 'CLIENTE',
        activo: true,
      } as any);

      const resultado = await AuthService.loginGoogle({
        googleId: 'g-987654321',
        correo: 'existente@gmail.com',
        nombreCompleto: 'Existente Vinculado',
      });

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 55 },
        data: { googleId: 'g-987654321', authProvider: 'GOOGLE' },
      });
      expect(resultado.usuario.id).toBe(55);
    });

    it('debe rechazar el login con Google si la cuenta está bloqueada temporalmente por fuerza bruta (RF-USU-02)', async () => {
      vi.spyOn(prisma.usuario, 'findFirst').mockResolvedValue({
        id: 60,
        correo: 'bloqueado@gmail.com',
        googleId: 'g-6060',
        rol: 'CLIENTE',
        activo: true,
        bloqueadoHasta: new Date(Date.now() + 10 * 60 * 1000), // Bloqueada 10 min más
      } as any);

      await expect(
        AuthService.loginGoogle({
          googleId: 'g-6060',
          correo: 'bloqueado@gmail.com',
          nombreCompleto: 'Bloqueado User',
        })
      ).rejects.toThrow('Cuenta bloqueada por seguridad debido a múltiples intentos fallidos');
    });

    it('debe rechazar el login con Google si el usuario existente tiene rol ADMIN o VENDEDOR (Anti-Takeover RN-ROL-06)', async () => {
      vi.spyOn(prisma.usuario, 'findFirst').mockResolvedValue({
        id: 1,
        correo: 'admin@forma.com',
        googleId: null,
        rol: 'ADMIN',
        activo: true,
        bloqueadoHasta: null,
      } as any);

      await expect(
        AuthService.loginGoogle({
          googleId: 'g-attacker-id',
          correo: 'admin@forma.com',
          nombreCompleto: 'Attacker Admin',
        })
      ).rejects.toThrow('El inicio de sesión con Google está restringido exclusivamente a clientes');
    });
  });

  describe('4. Consulta de Perfil Actual (RF-USU-03)', () => {
    it('debe retornar el perfil sin exponer passwordHash', async () => {
      vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
        id: 1,
        nombreCompleto: 'Admin Principal',
        correo: 'admin@forma.com',
        rol: 'ADMIN',
        activo: true,
        ubicacionId: null,
        topeDescuentoPorc: 100,
        permVender: true,
      } as any);

      const perfil = (await AuthService.obtenerPerfil(1)) as any;
      expect(perfil.id).toBe(1);
      expect(perfil.correo).toBe('admin@forma.com');
      expect(perfil.passwordHash).toBeUndefined();
    });
  });
});
