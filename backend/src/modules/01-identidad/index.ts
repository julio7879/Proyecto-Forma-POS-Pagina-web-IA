import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import {
  registroClienteSchema,
  loginSchema,
  googleAuthSchema,
} from './auth.schema.js';
import { validateBody } from '../../shared/middlewares/validateZod.js';
import { authenticateJWT } from '../../shared/middlewares/authPermission.js';

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

identidadRouter.use('/auth', authRouter);
