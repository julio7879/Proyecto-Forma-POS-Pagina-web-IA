// frontend/src/features/admin/services/adminService.ts
import { apiRequest } from '../../../api/apiClient';

// ============================================
// DTOs de Inventario
// ============================================
export interface InventarioDTO {
  id: number;
  sku: string;
  nombreProducto: string;
  categoriaNombre: string;
  sedeId: number;
  sedeNombre: string;
  fisico: number;
  disponible: number;
  reservadoBlando: number;
  reservadoDuro: number;
  noVendible: number;
  umbralStockBajo: number;
}

export interface InventarioFiltro {
  categoria?: string;
  sku?: string;
  stockBajo?: boolean;
}

// ============================================
// DTOs de Compras
// ============================================
export type EstadoCompra = 'PEDIDA' | 'RECIBIDA' | 'CANCELADA';

export interface LineaCompraDTO {
  id: number;
  varianteId: number;
  sku: string;
  nombreProducto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  costoUnitarioCop?: number;
}

export interface OrdenCompraDTO {
  id: number;
  codigo: string;
  proveedorNombre: string;
  proveedorContacto?: string;
  estado: EstadoCompra;
  fechaCreacion: string;
  lineas: LineaCompraDTO[];
}

export interface CrearLineaCompraDto {
  varianteId: number;
  cantidadPedida: number;
  costoUnitarioCop?: number;
}

export interface CrearOrdenCompraDto {
  proveedorNombre: string;
  proveedorContacto?: string;
  notas?: string;
  lineas: CrearLineaCompraDto[];
}

export interface RecepcionCompraDto {
  lineas: Array<{
    lineaId: number;
    cantidadRecibida: number;
  }>;
}

// ============================================
// DTOs de Traslados
// ============================================
export type EstadoTraslado =
  | 'SOLICITADO'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'ENVIADO'
  | 'RETORNANDO_A_CENTRAL'
  | 'RECIBIDO'
  | 'RECIBIDO_CON_NOVEDAD'
  | 'CERRADO'
  | 'CANCELADO';

export type TipoResolucionNovedad =
  | 'LLEGO_DESPUES'
  | 'RETORNO_A_CENTRAL'
  | 'PERDIDA_ASUMIDA'
  | 'INCORPORAR_A_PUNTO'
  | 'DESCARTAR_EXCEDENTE';

export interface LineaTrasladoDTO {
  id: number;
  varianteId: number;
  sku: string;
  nombreProducto: string;
  cantidadSolicitada: number;
  cantidadAprobada: number;
  cantidadEnviada: number;
  recibidaBuena: number;
  recibidaDanada: number;
}

export interface TrasladoDTO {
  id: number;
  codigo: string;
  origenId: number;
  origenNombre: string;
  destinoId: number;
  destinoNombre: string;
  estado: EstadoTraslado;
  fechaSolicitud: string;
  fechaEnvio?: string;
  fechaRecepcion?: string;
  lineas: LineaTrasladoDTO[];
  observaciones?: string;
}

export interface DespachoTrasladoDto {
  trasladoId: number;
  lineas: Array<{
    lineaId: number;
    cantidadEnviada: number;
  }>;
}

export interface RecepcionTrasladoDto {
  trasladoId: number;
  lineas: Array<{
    lineaId: number;
    recibidaBuena: number;
    recibidaDanada: number;
    excedenteReportado?: number;
  }>;
  observaciones?: string;
}

export interface ResolucionNovedadDto {
  trasladoId: number;
  resoluciones: Array<{
    lineaId: number;
    tipo: TipoResolucionNovedad;
    cantidad: number;
    notas?: string;
  }>;
}

// ============================================
// Funciones de Inventario
// ============================================
export const fetchInventario = async (filtro: InventarioFiltro = {}): Promise<InventarioDTO[]> => {
  const params = new URLSearchParams();
  if (filtro.categoria) params.append('categoria', filtro.categoria);
  if (filtro.sku) params.append('sku', filtro.sku);
  if (filtro.stockBajo) params.append('stockBajo', 'true');

  const query = params.toString();
  // FIX: ruta sin /admin (apiClient añade /api)
  const response = await apiRequest<{ datos: InventarioDTO[] }>(
    `/inventario${query ? `?${query}` : ''}`
  );
  return response.datos;
};

// ============================================
// Funciones de Compras
// ============================================
export const fetchOrdenesCompra = async (): Promise<OrdenCompraDTO[]> => {
  // FIX: /compras (sin /admin)
  const response = await apiRequest<{ datos: OrdenCompraDTO[] }>('/compras');
  return response.datos;
};

export const createOrdenCompra = async (
  payload: CrearOrdenCompraDto,
  idempotencyKey: string
): Promise<OrdenCompraDTO> => {
  // FIX: /compras (sin /admin)
  const response = await apiRequest<{ datos: OrdenCompraDTO }>('/compras', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return response.datos;
};

export const recibirOrdenCompra = async (
  compraId: number,
  payload: RecepcionCompraDto,
  idempotencyKey: string
): Promise<OrdenCompraDTO> => {
  // FIX: /compras/:id/recepcionar (sin /admin)
  const response = await apiRequest<{ datos: OrdenCompraDTO }>(
    `/compras/${compraId}/recepcionar`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

// ============================================
// Funciones de Traslados
// ============================================
export const fetchTraslados = async (estado?: EstadoTraslado): Promise<TrasladoDTO[]> => {
  const query = estado ? `?estado=${estado}` : '';
  // FIX: /traslados (sin /admin)
  const response = await apiRequest<{ datos: TrasladoDTO[] }>(`/traslados${query}`);
  return response.datos;
};

export const despacharTraslado = async (
  payload: DespachoTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  // FIX: /traslados/:id/despachar con body { lineas }
  const response = await apiRequest<{ datos: TrasladoDTO }>(
    `/traslados/${payload.trasladoId}/despachar`,
    {
      method: 'POST',
      body: JSON.stringify({ lineas: payload.lineas }),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

export const recibirTraslado = async (
  payload: RecepcionTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  // FIX: /traslados/:id/recepcionar
  const response = await apiRequest<{ datos: TrasladoDTO }>(
    `/traslados/${payload.trasladoId}/recepcionar`,
    {
      method: 'POST',
      body: JSON.stringify({
        lineas: payload.lineas,
        observaciones: payload.observaciones,
      }),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

export const resolverNovedadTraslado = async (
  payload: ResolucionNovedadDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  // FIX: /traslados/:id/resolver-novedad
  const response = await apiRequest<{ datos: TrasladoDTO }>(
    `/traslados/${payload.trasladoId}/resolver-novedad`,
    {
      method: 'POST',
      body: JSON.stringify({ resoluciones: payload.resoluciones }),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};


// ============================================
// DTOs y Funciones de Vendedores y Sedes (RN-ROL-03, RN-ROL-04, RN-ROL-05)
// ============================================
export interface UbicacionDTO {
  id: number;
  nombre: string;
  codigo: string;
  tipo: 'BODEGA_CENTRAL' | 'TIENDA_FISICA';
  esBodegaCentral: boolean;
  activo: boolean;
  ciudad?: string;
}

export interface PermisosVendedorDTO {
  permVender: boolean;
  permCaja: boolean;
  permDescuentoManual: boolean;
  permAnularVentas: boolean;
  permDevoluciones: boolean;
  permVerInventario: boolean;
  permSolicitarTraslado: boolean;
  permRecibirTraslado: boolean;
  permVerOtrosPuntos: boolean;
  permPedidosWeb: boolean;
  permVerVentasPunto: boolean;
}

export interface VendedorDTO extends PermisosVendedorDTO {
  id: number;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  activo: boolean;
  rol: string;
  ubicacionId: number | null;
  ubicacion?: {
    id: number;
    nombre: string;
    codigo: string;
    tipo: string;
  } | null;
  creadoEn: string;
}

export interface CrearVendedorDTO extends PermisosVendedorDTO {
  nombreCompleto: string;
  correo: string;
  password: string;
  ubicacionId: number;
  telefono?: string;
}

export interface ActualizarVendedorDTO extends Partial<PermisosVendedorDTO> {
  nombreCompleto?: string;
  ubicacionId?: number;
  telefono?: string;
  activo?: boolean;
}

export const fetchVendedores = async (): Promise<VendedorDTO[]> => {
  const response = await apiRequest<{ datos: VendedorDTO[] }>('/identidad/vendedores');
  return response.datos;
};

export const crearVendedor = async (payload: CrearVendedorDTO): Promise<VendedorDTO> => {
  const response = await apiRequest<{ datos: VendedorDTO }>('/identidad/vendedores', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.datos;
};

export const actualizarVendedor = async (
  id: number,
  payload: ActualizarVendedorDTO
): Promise<VendedorDTO> => {
  const response = await apiRequest<{ datos: VendedorDTO }>(`/identidad/vendedores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return response.datos;
};

export const fetchUbicaciones = async (): Promise<UbicacionDTO[]> => {
  const response = await apiRequest<{ datos: UbicacionDTO[] }>('/ubicaciones');
  return response.datos;
};
