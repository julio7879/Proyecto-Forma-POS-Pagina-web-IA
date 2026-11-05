import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { InventoryLedgerService } from '../04-inventario/InventoryLedgerService.js';
import type {
  CrearProductoDTO,
  ActualizarProductoDTO,
  CrearVarianteItemDTO,
  CrearCategoriaDTO,
} from './catalogo.schema.js';

export interface FiltrosCatalogo {
  categoria?: string | undefined;
  busqueda?: string | undefined;
  ubicacionId?: number | undefined;
  limite?: number | undefined;
  offset?: number | undefined;
}

function generarSlug(texto: string): string {
  const base = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${base}-${Date.now().toString().slice(-4)}`;
}

function generarSku(
  catNombre: string,
  prodNombre: string,
  talla: string,
  color: string
): string {
  const cat = (catNombre.slice(0, 3) || 'ART').toUpperCase();
  const prod = prodNombre
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();
  const col = color
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();
  const tal = talla.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const rnd = Math.floor(100 + Math.random() * 900);
  return `${cat}-${prod}-${col}-${tal}-${rnd}`;
}

export class CatalogoService {
  /**
   * Lista productos activos con sus variantes y stock disponible calculado.
   * Si ubicacionId está presente (POS), calcula el stock de esa sede.
   * Si ubicacionId NO está presente (Tienda Web), calcula stock de sedes habilitadas para despacho web (Central).
   */
  static async listarProductos(filtros: FiltrosCatalogo = {}) {
    const { categoria, busqueda, ubicacionId, limite = 150, offset = 0 } = filtros;

    const whereClause: any = { activo: true };

    if (categoria && categoria !== 'todos' && categoria !== 'all') {
      whereClause.categoria = {
        nombre: {
          equals: categoria,
          mode: 'insensitive',
        },
      };
    }

    if (busqueda && busqueda.trim().length > 0) {
      const termino = busqueda.trim();
      whereClause.OR = [
        { nombre: { contains: termino, mode: 'insensitive' } },
        { descripcion: { contains: termino, mode: 'insensitive' } },
        {
          variantes: {
            some: {
              sku: { contains: termino, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const productos = await prisma.producto.findMany({
      where: whereClause,
      include: {
        categoria: {
          select: { id: true, nombre: true, esCosmeticoUsoPersonal: true },
        },
        variantes: {
          where: { activa: true },
          orderBy: { id: 'asc' },
          include: {
            saldosStock: {
              select: {
                ubicacionId: true,
                fisico: true,
                reservadoBlando: true,
                reservadoDuro: true,
                ubicacion: {
                  select: { id: true, nombre: true, despachaWeb: true },
                },
              },
            },
          },
        },
      },
      take: Math.min(limite, 200),
      skip: offset,
      orderBy: { id: 'asc' },
    });

    return productos.map((p: any) => {
      const variantesMapeadas = p.variantes.map((v: any) => {
        const stockPorSede: Record<string, number> = {};

        // Llenar disponibilidad por cada sede física
        for (const s of v.saldosStock) {
          const disp = Math.max(0, s.fisico - s.reservadoBlando - s.reservadoDuro);
          const nom = s.ubicacion?.nombre || `Sede ${s.ubicacionId}`;
          stockPorSede[nom] = disp;
          if (nom.includes('Caobos')) {
            stockPorSede['Punto Caobos'] = disp;
          }
        }

        // Si viene ubicacionId, stockDisponible es de esa sede.
        // Si NO viene ubicacionId (Web), stockDisponible es de sedes despachaWeb (Bodega Central).
        const saldosParaDisponible = ubicacionId
          ? v.saldosStock.filter((s: any) => s.ubicacionId === ubicacionId)
          : v.saldosStock.filter((s: any) => s.ubicacion?.despachaWeb === true);

        const stockDisponible = saldosParaDisponible.reduce((acc: number, s: any) => {
          const disp = Math.max(0, s.fisico - s.reservadoBlando - s.reservadoDuro);
          return acc + disp;
        }, 0);

        return {
          id: v.id,
          sku: v.sku,
          talla: v.talla,
          color: v.color,
          precioVentaCop: v.precioVentaCop,
          stockDisponible,
          stockPorSede,
        };
      });

      return {
        id: p.id,
        nombre: p.nombre,
        slug: p.slug,
        descripcion: p.descripcion,
        categoriaNombre: p.categoria.nombre,
        reintegrableEnDevolucion: p.reintegrableEnDevolucion,
        imagenesUrls: p.imagenesUrls,
        variantes: variantesMapeadas,
      };
    });
  }

  /**
   * Obtiene el detalle de un producto por su slug
   */
  static async obtenerPorSlug(slug: string, ubicacionId?: number) {
    const producto = await prisma.producto.findUnique({
      where: { slug },
      include: {
        categoria: true,
        variantes: {
          where: { activa: true },
          orderBy: { id: 'asc' },
          include: {
            saldosStock: {
              include: {
                ubicacion: {
                  select: { id: true, nombre: true, tipo: true, despachaWeb: true },
                },
              },
            },
          },
        },
      },
    });

    if (!producto || !producto.activo) {
      throw AppError.notFound(`Producto con slug '${slug}' no encontrado`);
    }

    const variantes = producto.variantes.map((v: any) => {
      const stockPorSede: Record<string, number> = {};
      let totalDisponible = 0;
      let disponibleUbicacion = 0;

      for (const s of v.saldosStock) {
        const disponible = Math.max(0, s.fisico - s.reservadoBlando - s.reservadoDuro);
        stockPorSede[s.ubicacion.nombre] = disponible;
        if (s.ubicacion.nombre.includes('Caobos')) {
          stockPorSede['Punto Caobos'] = disponible;
        }

        // Si despachaWeb, cuenta para la web
        if (s.ubicacion.despachaWeb) {
          totalDisponible += disponible;
        }

        if (ubicacionId && s.ubicacionId === ubicacionId) {
          disponibleUbicacion += disponible;
        }
      }

      return {
        id: v.id,
        sku: v.sku,
        talla: v.talla,
        color: v.color,
        precioVentaCop: v.precioVentaCop,
        stockDisponible: ubicacionId ? disponibleUbicacion : totalDisponible,
        stockPorSede,
      };
    });

    return {
      id: producto.id,
      nombre: producto.nombre,
      slug: producto.slug,
      descripcion: producto.descripcion,
      categoriaNombre: producto.categoria.nombre,
      reintegrableEnDevolucion: producto.reintegrableEnDevolucion,
      imagenesUrls: producto.imagenesUrls,
      variantes,
    };
  }

  /**
   * Lista categorías activas con recuento de productos
   */
  static async listarCategorias() {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true },
      include: {
        _count: {
          select: { productos: { where: { activo: true } } },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return categorias.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      esCosmeticoUsoPersonal: c.esCosmeticoUsoPersonal,
      totalProductos: c._count.productos,
    }));
  }

  /**
   * Crea una nueva categoría (solo ADMIN)
   */
  static async crearCategoria(dto: CrearCategoriaDTO) {
    const existe = await prisma.categoria.findUnique({
      where: { nombre: dto.nombre.trim() },
    });
    if (existe) {
      throw AppError.conflict(`La categoría '${dto.nombre}' ya existe.`);
    }

    return prisma.categoria.create({
      data: {
        nombre: dto.nombre.trim(),
        esCosmeticoUsoPersonal: dto.esCosmeticoUsoPersonal ?? false,
      },
    });
  }

  /**
   * Crea un nuevo producto con variantes y opcionalmente stock inicial en Bodega Central (solo ADMIN)
   */
  static async crearProducto(usuarioId: number, dto: CrearProductoDTO) {
    return prisma.$transaction(async (tx) => {
      const categoria = await tx.categoria.findUnique({
        where: { id: dto.categoriaId },
      });
      if (!categoria) {
        throw AppError.notFound(`Categoría #${dto.categoriaId} no encontrada`);
      }

      const slug = generarSlug(dto.nombre);
      const reintegrable =
        dto.reintegrableEnDevolucion ?? !categoria.esCosmeticoUsoPersonal;

      // 1. Crear producto
      const producto = await tx.producto.create({
        data: {
          nombre: dto.nombre.trim(),
          slug,
          descripcion: dto.descripcion.trim(),
          categoriaId: dto.categoriaId,
          imagenesUrls: dto.imagenesUrls && dto.imagenesUrls.length > 0
            ? dto.imagenesUrls
            : ['/products/blazer-imperial-vinotinto.png'],
          reintegrableEnDevolucion: reintegrable,
          activo: true,
        },
      });

      // 2. Obtener todas las ubicaciones activas para inicializar SaldoStock
      const ubicaciones = await tx.ubicacion.findMany({
        where: { activa: true },
        select: { id: true, tipo: true },
      });
      const central = ubicaciones.find((u) => u.tipo === 'CENTRAL') || ubicaciones[0];

      // 3. Crear variantes e inicializar stock
      const variantesCreadas = [];
      for (const v of dto.variantes) {
        const sku =
          v.sku?.trim().toUpperCase() ||
          generarSku(categoria.nombre, dto.nombre, v.talla, v.color);

        const variante = await tx.variante.create({
          data: {
            productoId: producto.id,
            sku,
            talla: v.talla.trim(),
            color: v.color.trim(),
            precioVentaCop: v.precioVentaCop,
            codigoBarras: v.codigoBarras?.trim() || null,
            umbralStockBajo: v.umbralStockBajo ?? 3,
            activa: true,
          },
        });

        // Crear SaldoStock en todas las sedes con físico = 0
        for (const u of ubicaciones) {
          await tx.saldoStock.create({
            data: {
              ubicacionId: u.id,
              varianteId: variante.id,
              fisico: 0,
              reservadoBlando: 0,
              reservadoDuro: 0,
              noVendible: 0,
            },
          });
        }

        // Si se especificó stock inicial en Central (Ingreso de Producción inmediato)
        if (v.stockInicialCentral && v.stockInicialCentral > 0 && central) {
          await InventoryLedgerService.registrarMovimiento(tx, {
            tipo: 'CARGA_INICIAL',
            ubicacionId: central.id,
            varianteId: variante.id,
            cantidadConSigno: v.stockInicialCentral,
            afectaSaldo: 'FISICO',
            documentoTipo: 'AJUSTE',
            documentoId: 0,
            usuarioId,
            motivo: `Ingreso de producción artesanal inicial: ${dto.nombre} (${v.talla}/${v.color})`,
          });
        }

        variantesCreadas.push(variante);
      }

      return {
        ...producto,
        categoriaNombre: categoria.nombre,
        variantes: variantesCreadas,
      };
    });
  }

  /**
   * Agrega una nueva variante a un producto existente (solo ADMIN)
   */
  static async agregarVariante(
    productoId: number,
    usuarioId: number,
    dto: CrearVarianteItemDTO
  ) {
    return prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: productoId },
        include: { categoria: true },
      });
      if (!producto) {
        throw AppError.notFound(`Producto #${productoId} no encontrado`);
      }

      const sku =
        dto.sku?.trim().toUpperCase() ||
        generarSku(producto.categoria.nombre, producto.nombre, dto.talla, dto.color);

      const variante = await tx.variante.create({
        data: {
          productoId,
          sku,
          talla: dto.talla.trim(),
          color: dto.color.trim(),
          precioVentaCop: dto.precioVentaCop,
          codigoBarras: dto.codigoBarras?.trim() || null,
          umbralStockBajo: dto.umbralStockBajo ?? 3,
          activa: true,
        },
      });

      const ubicaciones = await tx.ubicacion.findMany({
        where: { activa: true },
        select: { id: true, tipo: true },
      });
      const central = ubicaciones.find((u) => u.tipo === 'CENTRAL') || ubicaciones[0];

      for (const u of ubicaciones) {
        await tx.saldoStock.create({
          data: {
            ubicacionId: u.id,
            varianteId: variante.id,
            fisico: 0,
            reservadoBlando: 0,
            reservadoDuro: 0,
            noVendible: 0,
          },
        });
      }

      if (dto.stockInicialCentral && dto.stockInicialCentral > 0 && central) {
        await InventoryLedgerService.registrarMovimiento(tx, {
          tipo: 'CARGA_INICIAL',
          ubicacionId: central.id,
          varianteId: variante.id,
          cantidadConSigno: dto.stockInicialCentral,
          afectaSaldo: 'FISICO',
          documentoTipo: 'AJUSTE',
          documentoId: 0,
          usuarioId,
          motivo: `Ingreso de producción para nueva variante: ${producto.nombre} (${dto.talla}/${dto.color})`,
        });
      }

      return variante;
    });
  }

  /**
   * Actualiza datos generales de un producto (solo ADMIN)
   */
  static async actualizarProducto(id: number, dto: ActualizarProductoDTO) {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw AppError.notFound(`Producto #${id} no encontrado`);
    }

    return prisma.producto.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion ? { descripcion: dto.descripcion.trim() } : {}),
        ...(dto.categoriaId ? { categoriaId: dto.categoriaId } : {}),
        ...(dto.imagenesUrls ? { imagenesUrls: dto.imagenesUrls } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        ...(dto.reintegrableEnDevolucion !== undefined
          ? { reintegrableEnDevolucion: dto.reintegrableEnDevolucion }
          : {}),
      },
    });
  }
}
