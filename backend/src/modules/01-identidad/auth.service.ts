import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import {
  generateToken,
  UserPermissionCache,
  type UserAuthSnapshot,
} from '../../shared/middlewares/authPermission.js';
import type { RegistroClienteDTO, LoginDTO, GoogleAuthDTO } from './auth.schema.js';

const BCRYPT_SALT_ROUNDS = 10; // RN-ROL-06
const MAX_INTENTOS_FALLIDOS = 5; // RF-USU-02
const MINUTOS_BLOQUEO = 15; // RF-USU-02

export class AuthService {
  /**
   * Registro público de cliente para la tienda web (RF-USU-01, RN-ROL-06)
   */
  static async registrarCliente(dto: RegistroClienteDTO) {
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo: dto.correo },
      select: { id: true },
    });

    if (usuarioExistente) {
      throw AppError.conflict('Ya existe una cuenta registrada con este correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto: dto.nombreCompleto,
        correo: dto.correo,
        passwordHash,
        authProvider: 'LOCAL',
        rol: 'CLIENTE',
        activo: true,
        aceptoPrivacidadEn: new Date(), // Consentimiento explícito Ley 1581 (RF-USU-01)
        ...(dto.telefono ? { telefono: dto.telefono } : {}),
        ...(dto.direccionDefault ? { direccionDefault: dto.direccionDefault } : {}),
        ...(dto.municipioDefaultId ? { municipioDefaultId: dto.municipioDefaultId } : {}),
        // Clientes nacen con permisos restringidos de vendedor en false
        permVender: false,
        permCaja: false,
        permDescuentoManual: false,
        permAnularVentas: false,
        permDevoluciones: false,
        permVerInventario: false,
        permSolicitarTraslado: false,
        permRecibirTraslado: false,
        permVerOtrosPuntos: false,
        permPedidosWeb: false,
        permVerVentasPunto: false,
      },
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        rol: true,
        activo: true,
        aceptoPrivacidadEn: true,
      },
    });

    const token = generateToken({
      userId: nuevoUsuario.id,
      correo: nuevoUsuario.correo,
      rol: nuevoUsuario.rol,
    });

    return {
      token,
      usuario: nuevoUsuario,
    };
  }

  /**
   * Inicio de sesión con correo y contraseña, con protección contra fuerza bruta (RF-USU-02, RN-ROL-08)
   */
  static async login(dto: LoginDTO) {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });

    if (!usuario) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    if (!usuario.activo) {
      throw AppError.unauthorized('Cuenta inactiva o suspendida. Comuníquese con el administrador');
    }

    // 1. Verificar si la cuenta se encuentra bloqueada por intentos fallidos (RF-USU-02)
    const ahora = new Date();
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - ahora.getTime()) / (60 * 1000)
      );
      throw AppError.locked(
        `Cuenta bloqueada por seguridad debido a múltiples intentos fallidos. Intente nuevamente en ${minutosRestantes} minuto(s).`
      );
    }

    // 2. Verificar contraseña
    if (!usuario.passwordHash) {
      throw AppError.unauthorized(
        'Esta cuenta fue creada con Google OAuth. Inicie sesión utilizando el botón de Google.'
      );
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!passwordValido) {
      const nuevosIntentos = usuario.intentosFallidosLogin + 1;

      if (nuevosIntentos >= MAX_INTENTOS_FALLIDOS) {
        const bloqueadoHasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000);
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            intentosFallidosLogin: nuevosIntentos,
            bloqueadoHasta,
          },
        });

        throw AppError.locked(
          `Ha superado el límite de ${MAX_INTENTOS_FALLIDOS} intentos fallidos. Su cuenta ha sido bloqueada temporalmente por ${MINUTOS_BLOQUEO} minutos.`
        );
      }

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidosLogin: nuevosIntentos },
      });

      const intentosRestantes = MAX_INTENTOS_FALLIDOS - nuevosIntentos;
      throw AppError.unauthorized(
        `Credenciales incorrectas. Intentos restantes antes del bloqueo: ${intentosRestantes}`
      );
    }

    // 3. Login exitoso: Resetear contador de fallos si tenía
    if (usuario.intentosFallidosLogin > 0 || usuario.bloqueadoHasta !== null) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentosFallidosLogin: 0,
          bloqueadoHasta: null,
        },
      });
    }

    // 4. Preparar snapshot de permisos en memoria
    const userSnapshot: UserAuthSnapshot = {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      ubicacionId: usuario.ubicacionId,
      activo: usuario.activo,
      topeDescuentoPorc: usuario.topeDescuentoPorc,
      permisos: {
        permVender: usuario.permVender,
        permCaja: usuario.permCaja,
        permDescuentoManual: usuario.permDescuentoManual,
        permAnularVentas: usuario.permAnularVentas,
        permDevoluciones: usuario.permDevoluciones,
        permVerInventario: usuario.permVerInventario,
        permSolicitarTraslado: usuario.permSolicitarTraslado,
        permRecibirTraslado: usuario.permRecibirTraslado,
        permVerOtrosPuntos: usuario.permVerOtrosPuntos,
        permPedidosWeb: usuario.permPedidosWeb,
        permVerVentasPunto: usuario.permVerVentasPunto,
      },
    };

    UserPermissionCache.set(usuario.id, userSnapshot);

    const token = generateToken({
      userId: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        rol: usuario.rol,
        ubicacionId: usuario.ubicacionId,
        topeDescuentoPorc: usuario.topeDescuentoPorc,
        permisos: userSnapshot.permisos,
      },
    };
  }

  /**
   * Inicio de sesión o registro automático vía Google OAuth (RN-ROL-06)
   */
  static async loginGoogle(dto: GoogleAuthDTO) {
    let usuario = await prisma.usuario.findFirst({
      where: {
        OR: [{ googleId: dto.googleId }, { correo: dto.correo }],
      },
    });

    if (usuario) {
      if (!usuario.activo) {
        throw AppError.unauthorized('Cuenta inactiva o suspendida');
      }

      // Si existía por correo pero sin googleId enlazado, lo enlazamos
      if (!usuario.googleId) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            googleId: dto.googleId,
            authProvider: 'GOOGLE',
          },
        });
      }
    } else {
      // Si no existe, se crea automáticamente como CLIENTE con consentimiento registrado
      usuario = await prisma.usuario.create({
        data: {
          nombreCompleto: dto.nombreCompleto,
          correo: dto.correo,
          googleId: dto.googleId,
          authProvider: 'GOOGLE',
          rol: 'CLIENTE',
          activo: true,
          aceptoPrivacidadEn: new Date(),
          permVender: false,
          permCaja: false,
          permDescuentoManual: false,
          permAnularVentas: false,
          permDevoluciones: false,
          permVerInventario: false,
          permSolicitarTraslado: false,
          permRecibirTraslado: false,
          permVerOtrosPuntos: false,
          permPedidosWeb: false,
          permVerVentasPunto: false,
        },
      });
    }

    const token = generateToken({
      userId: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  /**
   * Obtener perfil del usuario autenticado actual (RF-USU-03)
   */
  static async obtenerPerfil(userId: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        rol: true,
        ubicacionId: true,
        topeDescuentoPorc: true,
        activo: true,
        telefono: true,
        direccionDefault: true,
        municipioDefaultId: true,
        aceptoPrivacidadEn: true,
        authProvider: true,
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

    if (!usuario || !usuario.activo) {
      throw AppError.notFound('Usuario no encontrado o inactivo');
    }

    return usuario;
  }
}
