import { Router } from 'express';
import { CatalogoController } from './catalogo.controller.js';
import { authenticateJWT, requireRole } from '../../shared/middlewares/authPermission.js';
import { validateBody } from '../../shared/middlewares/validateZod.js';
import {
  crearProductoSchema,
  actualizarProductoSchema,
  agregarVarianteSchema,
  crearCategoriaSchema,
} from './catalogo.schema.js';

export const catalogoRouter = Router();

// Módulo 03: Catálogo, Categorías, Productos y Variantes SKU (RF-CAT)
catalogoRouter.get('/health', (_req, res) => {
  res.json({ modulo: '03-catalogo', status: 'ready' });
});

// Rutas públicas / lectura (Web y POS)
catalogoRouter.get('/productos', CatalogoController.listarProductos);
catalogoRouter.get('/productos/:slug', CatalogoController.obtenerPorSlug);
catalogoRouter.get('/categorias', CatalogoController.listarCategorias);

// Rutas administrativas (solo ADMIN)
catalogoRouter.post(
  '/productos',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearProductoSchema),
  CatalogoController.crearProducto
);

catalogoRouter.put(
  '/productos/:id',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(actualizarProductoSchema),
  CatalogoController.actualizarProducto
);

catalogoRouter.post(
  '/productos/:id/variantes',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(agregarVarianteSchema),
  CatalogoController.agregarVariante
);

catalogoRouter.post(
  '/categorias',
  authenticateJWT,
  requireRole('ADMIN'),
  validateBody(crearCategoriaSchema),
  CatalogoController.crearCategoria
);
