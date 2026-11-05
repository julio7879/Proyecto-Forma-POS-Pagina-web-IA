import type { Request, Response, NextFunction } from 'express';
import { CatalogoService } from './catalogo.service.js';

export class CatalogoController {
  static async listarProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoria, busqueda, ubicacionId, limite, offset } = req.query;

      const productos = await CatalogoService.listarProductos({
        categoria: typeof categoria === 'string' ? categoria : undefined,
        busqueda: typeof busqueda === 'string' ? busqueda : undefined,
        ubicacionId: ubicacionId ? Number(ubicacionId) : undefined,
        limite: limite ? Number(limite) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.status(200).json({
        ok: true,
        datos: productos,
        total: productos.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorSlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { ubicacionId } = req.query;

      const producto = await CatalogoService.obtenerPorSlug(
        slug as string,
        ubicacionId ? Number(ubicacionId) : undefined
      );

      res.status(200).json({
        ok: true,
        datos: producto,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listarCategorias(_req: Request, res: Response, next: NextFunction) {
    try {
      const categorias = await CatalogoService.listarCategorias();
      res.status(200).json({
        ok: true,
        datos: categorias,
      });
    } catch (error) {
      next(error);
    }
  }

  static async crearProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = (req as any).user?.id || 1;
      const producto = await CatalogoService.crearProducto(usuarioId, req.body);
      res.status(201).json({
        ok: true,
        mensaje: 'Producto creado exitosamente',
        datos: producto,
      });
    } catch (error) {
      next(error);
    }
  }

  static async agregarVariante(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = (req as any).user?.id || 1;
      const productoId = Number(req.params.id);
      const variante = await CatalogoService.agregarVariante(productoId, usuarioId, req.body);
      res.status(201).json({
        ok: true,
        mensaje: 'Variante agregada exitosamente',
        datos: variante,
      });
    } catch (error) {
      next(error);
    }
  }

  static async actualizarProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const producto = await CatalogoService.actualizarProducto(id, req.body);
      res.status(200).json({
        ok: true,
        mensaje: 'Producto actualizado exitosamente',
        datos: producto,
      });
    } catch (error) {
      next(error);
    }
  }

  static async crearCategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const categoria = await CatalogoService.crearCategoria(req.body);
      res.status(201).json({
        ok: true,
        mensaje: 'Categoría creada exitosamente',
        datos: categoria,
      });
    } catch (error) {
      next(error);
    }
  }
}
