import { Router } from 'express';

export const identidadRouter = Router();

// Módulo 01: Identidad, Usuarios, Roles y Permisos Dinámicos (RF-USU)
identidadRouter.get('/health', (_req, res) => {
  res.json({ modulo: '01-identidad', status: 'ready' });
});
