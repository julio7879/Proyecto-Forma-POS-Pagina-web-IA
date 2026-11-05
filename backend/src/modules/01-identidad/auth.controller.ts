import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type {
  RegistroClienteDTO,
  LoginDTO,
  GoogleAuthDTO,
  CrearVendedorDTO,
  ActualizarVendedorDTO,
} from './auth.schema.js';
import { AppError } from '../../shared/domain/AppError.js';

export class AuthController {
  static async registroCliente(req: Request, res: Response) {
    const dto = req.body as RegistroClienteDTO;
    const resultado = await AuthService.registrarCliente(dto);
    res.status(201).json({
      ok: true,
      mensaje: 'Registro exitoso conforme a la Ley 1581',
      datos: resultado,
    });
  }

  static async login(req: Request, res: Response) {
    const dto = req.body as LoginDTO;
    const resultado = await AuthService.login(dto);
    res.status(200).json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      datos: resultado,
    });
  }

  static async google(req: Request, res: Response) {
    const dto = req.body as GoogleAuthDTO;
    const resultado = await AuthService.loginGoogle(dto);
    res.status(200).json({
      ok: true,
      mensaje: 'Autenticación con Google exitosa',
      datos: resultado,
    });
  }

  static async me(req: Request, res: Response) {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const perfil = await AuthService.obtenerPerfil(req.user.id);
    res.status(200).json({
      ok: true,
      datos: perfil,
    });
  }

  static async listarVendedores(_req: Request, res: Response) {
    const vendedores = await AuthService.listarVendedores();
    res.status(200).json({
      ok: true,
      datos: vendedores,
      total: vendedores.length,
    });
  }

  static async crearVendedor(req: Request, res: Response) {
    const dto = req.body as CrearVendedorDTO;
    const vendedor = await AuthService.crearVendedor(dto);
    res.status(201).json({
      ok: true,
      mensaje: 'Vendedor creado y asignado exitosamente a la sede física',
      datos: vendedor,
    });
  }

  static async actualizarVendedor(req: Request, res: Response) {
    const id = Number(req.params.id);
    const dto = req.body as ActualizarVendedorDTO;
    const vendedor = await AuthService.actualizarVendedor(id, dto);
    res.status(200).json({
      ok: true,
      mensaje: 'Permisos y datos del vendedor actualizados',
      datos: vendedor,
    });
  }
}
