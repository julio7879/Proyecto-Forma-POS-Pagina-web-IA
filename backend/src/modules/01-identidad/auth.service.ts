import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { EmailService } from '../../shared/infrastructure/email/EmailService.js';
import {
  generateToken,
  UserPermissionCache,
  type UserAuthSnapshot,
} from '../../shared/middlewares/authPermission.js';
import type {
  RegistroClienteDTO,
  LoginDTO,
  GoogleAuthDTO,
  CrearVendedorDTO,
  ActualizarVendedorDTO,
} from './auth.schema.js';

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

    // Despacho asíncrono de correo de bienvenida de alta costura
    EmailService.getInstance()
      .enviarBienvenidaRegistro({
        clienteNombre: nuevoUsuario.nombreCompleto,
        clienteEmail: nuevoUsuario.correo,
      })
      .catch((err) => console.warn('Aviso: envío de correo bienvenida:', err));

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
      // Incremento atómico a nivel de base de datos para prevenir race conditions concurrentes (RF-USU-02)
      const usuarioActualizado = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidosLogin: { increment: 1 } },
        select: { id: true, intentosFallidosLogin: true },
      });

      if (usuarioActualizado.intentosFallidosLogin >= MAX_INTENTOS_FALLIDOS) {
        const bloqueadoHasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000);
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { bloqueadoHasta },
        });

        throw AppError.locked(
          `Ha superado el límite de ${MAX_INTENTOS_FALLIDOS} intentos fallidos. Su cuenta ha sido bloqueada temporalmente por ${MINUTOS_BLOQUEO} minutos.`
        );
      }

      const intentosRestantes = Math.max(0, MAX_INTENTOS_FALLIDOS - usuarioActualizado.intentosFallidosLogin);
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

    // 3.1 Bloqueo Estricto por Turno Activo Concurrente (Opción A)
    if (usuario.rol === 'VENDEDOR' && usuario.ubicacionId) {
      const sesionAbierta = await prisma.sesionCaja.findFirst({
        where: {
          abiertaPorId: usuario.id,
          estado: 'ABIERTA',
        },
        include: {
          ubicacion: { select: { nombre: true } },
        },
      });

      if (sesionAbierta && !dto.forzarRelevo) {
        const esMismaTerminal = Boolean(
          dto.terminalId &&
            sesionAbierta.observacionApertura?.includes(`[TERM:${dto.terminalId}]`)
        );

        if (!esMismaTerminal && dto.terminalId) {
          throw AppError.conflict(
            `Acceso Bloqueado por Turno Activo: Esta cuenta ya tiene una sesión de caja abierta en ${sesionAbierta.ubicacion.nombre} en otra terminal. Cierre el turno anterior o solicite intervención del Administrador.`
          );
        }
      }
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
    let googleId = dto.googleId;
    let correo = dto.correo;
    let nombreCompleto = dto.nombreCompleto;

    // Validación criptográfica si viene idToken (RN-ROL-06)
    if (dto.idToken) {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (googleClientId) {
        try {
          const client = new OAuth2Client(googleClientId);
          const ticket = await client.verifyIdToken({
            idToken: dto.idToken,
            audience: googleClientId,
          });
          const payload = ticket.getPayload();
          if (!payload || !payload.sub || !payload.email) {
            throw AppError.unauthorized('Token de Google inválido o incompleto');
          }
          googleId = payload.sub;
          correo = payload.email.toLowerCase();
          nombreCompleto = payload.name || payload.email.split('@')[0] || 'Cliente Google';
        } catch (error: any) {
          if (error instanceof AppError) throw error;
          throw AppError.unauthorized(`Fallo en verificación criptográfica de Google: ${error.message}`);
        }
      } else {
        // Modo dev/test: Si no está GOOGLE_CLIENT_ID configurado, decodifica el token o usa los datos del payload
        try {
          const parts = dto.idToken.split('.');
          if (parts.length === 3 && parts[1]) {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
            const parsed = JSON.parse(jsonPayload);
            googleId = parsed.sub || googleId || `g_dev_${dto.idToken.slice(0, 8)}`;
            correo = (parsed.email || correo || `google_dev_${dto.idToken.slice(0, 8)}@gmail.com`).toLowerCase();
            nombreCompleto = parsed.name || nombreCompleto || 'Cliente Google Dev';
          } else {
            googleId = googleId || `g_dev_${dto.idToken}`;
            correo = (correo || `${dto.idToken}@sandbox.com`).toLowerCase();
            nombreCompleto = nombreCompleto || 'Cliente Google Dev';
          }
        } catch {
          googleId = googleId || `g_dev_${dto.idToken}`;
          correo = (correo || 'cliente.google@sandbox.com').toLowerCase();
          nombreCompleto = nombreCompleto || 'Cliente Google Dev';
        }
      }
    }

    if (!googleId || !correo) {
      throw AppError.badRequest('No se pudieron obtener credenciales válidas de Google');
    }
    nombreCompleto = nombreCompleto || correo.split('@')[0] || 'Cliente Google';

    let usuario = await prisma.usuario.findFirst({
      where: {
        OR: [{ googleId }, { correo }],
      },
    });

    if (usuario) {
      if (!usuario.activo) {
        throw AppError.unauthorized('Cuenta inactiva o suspendida');
      }

      // Blindaje contra bypass de bloqueo temporal por fuerza bruta
      if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
        const minutosRestantes = Math.ceil(
          (usuario.bloqueadoHasta.getTime() - Date.now()) / (60 * 1000)
        );
        throw AppError.locked(
          `Cuenta bloqueada por seguridad debido a múltiples intentos fallidos. Intente nuevamente en ${minutosRestantes} minuto(s).`
        );
      }

      // Blindaje contra Account Takeover: Google OAuth restringido a CLIENTE (RN-ROL-06)
      if (usuario.rol !== 'CLIENTE') {
        throw AppError.forbidden(
          'El inicio de sesión con Google está restringido exclusivamente a clientes de la tienda web (RN-ROL-06).'
        );
      }

      // Si existía por correo pero sin googleId enlazado, lo enlazamos
      if (!usuario.googleId) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            googleId,
            authProvider: 'GOOGLE',
          },
        });
      }
    } else {
      // Si no existe, se crea automáticamente como CLIENTE con consentimiento registrado
      usuario = await prisma.usuario.create({
        data: {
          nombreCompleto,
          correo,
          googleId,
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

      // Despacho asíncrono de correo de bienvenida para nuevo cliente registrado con Google
      EmailService.getInstance()
        .enviarBienvenidaRegistro({
          clienteNombre: usuario.nombreCompleto,
          clienteEmail: usuario.correo,
        })
        .catch((err) => console.warn('Aviso: envío de correo bienvenida Google:', err));
    }

    // Poblado de snapshot en caché en memoria para O(1) en peticiones subsecuentes (CA-50)
    const googleUserSnapshot: UserAuthSnapshot = {
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
    UserPermissionCache.set(usuario.id, googleUserSnapshot);

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

  /**
   * Listar todos los colaboradores / vendedores con su sede física asignada (RN-ROL-03)
   */
  static async listarVendedores() {
    return prisma.usuario.findMany({
      where: { rol: 'VENDEDOR' },
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        rol: true,
        activo: true,
        telefono: true,
        ubicacionId: true,
        ubicacion: {
          select: { id: true, nombre: true, tipo: true },
        },
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
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Crear nuevo vendedor con sede física obligatoria (RN-ROL-04, RN-ROL-05)
   */
  static async crearVendedor(dto: CrearVendedorDTO) {
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo: dto.correo },
      select: { id: true },
    });

    if (usuarioExistente) {
      throw AppError.conflict('El correo electrónico ya se encuentra registrado');
    }

    const sede = await prisma.ubicacion.findUnique({
      where: { id: dto.ubicacionId },
      select: { id: true, nombre: true, tipo: true },
    });

    if (!sede) {
      throw AppError.notFound(`La sede con ID ${dto.ubicacionId} no existe`);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const vendedor = await prisma.usuario.create({
      data: {
        nombreCompleto: dto.nombreCompleto,
        correo: dto.correo,
        passwordHash,
        rol: 'VENDEDOR',
        ubicacion: { connect: { id: dto.ubicacionId } },
        telefono: dto.telefono ?? null,
        activo: true,
        permVender: dto.permVender,
        permCaja: dto.permCaja,
        permDescuentoManual: dto.permDescuentoManual,
        permAnularVentas: dto.permAnularVentas,
        permDevoluciones: dto.permDevoluciones,
        permVerInventario: dto.permVerInventario,
        permSolicitarTraslado: dto.permSolicitarTraslado,
        permRecibirTraslado: dto.permRecibirTraslado,
        permVerOtrosPuntos: dto.permVerOtrosPuntos,
        permPedidosWeb: dto.permPedidosWeb,
        permVerVentasPunto: dto.permVerVentasPunto,
      },
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        rol: true,
        activo: true,
        telefono: true,
        ubicacionId: true,
        ubicacion: {
          select: { id: true, nombre: true, tipo: true },
        },
      },
    });

    return vendedor;
  }

  /**
   * Actualizar permisos o sede física de un vendedor (RN-ROL-05)
   */
  static async actualizarVendedor(id: number, dto: ActualizarVendedorDTO) {
    const vendedorExistente = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, rol: true },
    });

    if (!vendedorExistente || vendedorExistente.rol !== 'VENDEDOR') {
      throw AppError.notFound('Vendedor no encontrado');
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
      delete data.password;
    }

    if (dto.ubicacionId) {
      data.ubicacion = { connect: { id: dto.ubicacionId } };
      delete data.ubicacionId;
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        rol: true,
        activo: true,
        ubicacionId: true,
        ubicacion: {
          select: { id: true, nombre: true, tipo: true },
        },
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

    UserPermissionCache.invalidate(id);
    return actualizado;
  }
}
