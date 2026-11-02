import { Router } from 'express';

export const catalogoRouter = Router();

// Módulo 03: Catálogo, Categorías, Productos y Variantes SKU (RF-CAT)
catalogoRouter.get('/health', (_req, res) => {
  res.json({ modulo: '03-catalogo', status: 'ready' });
});
