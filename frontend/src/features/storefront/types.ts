export type SedeId = 'MEDELLIN' | 'BOGOTA' | 'CUCUTA_CENTRAL';

export interface SedeInfo {
  id: SedeId;
  nombre: string;
  ciudad: string;
  esCentral: boolean;
  tiempoEntregaDias: string;
}

export type CategoriaSlug = 'ropa' | 'accesorios' | 'cosmeticos' | 'artesanias';

export interface VarianteProducto {
  id: string;
  sku: string;
  talla?: string;
  color?: string;
  stockPorSede: Record<SedeId, number>;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: CategoriaSlug;
  categoriaLabel: string;
  precioCOP: number; // Invariante RN-GEN-04: Entero en pesos colombianos
  descripcion: string;
  imagenUrl: string;
  variantes: VarianteProducto[];
  destacado?: boolean;
}

export interface CartItem {
  id: string; // varianteId
  productoId: string;
  nombre: string;
  sku: string;
  talla?: string;
  color?: string;
  precioUnitarioCOP: number; // Entero COP
  cantidad: number;
  stockDisponible?: number; // Stock físico máximo disponible para venta
  imagenUrl: string;
  sedeDespacho: SedeId;
}
