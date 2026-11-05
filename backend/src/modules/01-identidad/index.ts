import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import {
  registroClienteSchema,
  loginSchema,
  googleAuthSchema,
  crearVendedorSchema,
  actualizarVendedorSchema,
} from './auth.schema.js';
import { validateBody } from '../../shared/middlewares/validateZod.js';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';

export const authRouter = Router();

// Rutas de Autenticación Híbrida (RF-USU-01, RF-USU-02, RN-ROL-06)
authRouter.post(
  '/registro-cliente',
  validateBody(registroClienteSchema),
  AuthController.registroCliente
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  AuthController.login
);

authRouter.post(
  '/google',
  validateBody(googleAuthSchema),
  AuthController.google
);

authRouter.get(
  '/me',
  authenticateJWT,
  AuthController.me
);

export const identidadRouter = Router();

// Módulo 01: Identidad, Usuarios, Roles y Permisos Dinámicos (RF-USU)
identidadRouter.get('/health', (_req, res) => {
  res.json({ modulo: '01-identidad', status: 'ready' });
});

// Rutas Administrativas de Vendedores (RN-ROL-03, RN-ROL-04, RN-ROL-05)
identidadRouter.get(
  '/vendedores',
  authenticateJWT,
  requireRole('ADMIN'),
  AuthController.listarVendedores
);

identidadRouter.post(
  '/vendedores',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearVendedorSchema),
  AuthController.crearVendedor
);

identidadRouter.patch(
  '/vendedores/:id',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(actualizarVendedorSchema),
  AuthController.actualizarVendedor
);

identidadRouter.use('/auth', authRouter);
