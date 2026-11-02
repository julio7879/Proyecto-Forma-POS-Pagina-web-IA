import { Router } from 'express';

export const comprasRouter = Router();

// Módulo 05: Compras a Proveedores en Bodega Central (RF-COM)
comprasRouter.get('/health', (_req, res) => {
  res.json({ modulo: '05-compras', status: 'ready' });
});
