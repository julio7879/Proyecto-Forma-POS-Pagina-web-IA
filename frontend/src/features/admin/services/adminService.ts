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
// DTOs de Compras y Distribuidores Asociados
// ============================================
export type EstadoCompra = 'PEDIDA' | 'RECIBIDA' | 'CANCELADA';

export interface LineaCompraDTO {
  id: number;
  varianteId: number;
  sku: string;
  nombreProducto: string;
  descripcion?: string;
  talla?: string;
  color?: string;
  precioVentaCop?: number;
  cantidadPedida: number;
  cantidadRecibida: number;
  costoUnitarioCop?: number;
  observacionDiferencia?: string | null;
}

export interface OrdenCompraDTO {
  id: number;
  codigo: string;
  proveedorNombre: string;
  proveedorContacto?: string;
  notas?: string;
  estado: EstadoCompra;
  fechaCreacion: string;
  fechaRecepcion?: string | null;
  lineas: LineaCompraDTO[];
}

export interface DistribuidorAsociado {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  especialidad: string;
  descuentoMayoristaPorc: number; // Porcentaje de descuento sobre PVP (ej: 50% = costo al 50%)
  categorias: string[];
}

export const DISTRIBUIDORES_OFICIALES: DistribuidorAsociado[] = [
  {
    id: 'dist-1',
    nombre: 'Hilaturas & Sedas del Oriente S.A.S',
    nit: '900.542.110-4',
    contacto: 'María Camila Restrepo · Gerente de Cuentas',
    telefono: '+57 310 456 7890',
    email: 'ventas@sedasdeloriente.co',
    ciudad: 'Bucaramanga, Santander',
    especialidad: 'Sedas naturales andinas, lino 100% orgánico y champaña satinada',
    descuentoMayoristaPorc: 52, // Costo mayorista: 48% del PVP
    categorias: ['Ropa'],
  },
  {
    id: 'dist-2',
    nombre: 'Confecciones & Sastrería Imperial Andina S.A.S',
    nit: '901.238.455-8',
    contacto: 'Hernán Darío Gómez · Director Comercial',
    telefono: '+57 312 890 1234',
    email: 'pedidos@sastreriaandina.co',
    ciudad: 'Cúcuta, Norte de Santander',
    especialidad: 'Blazers en lana fría de sastre, chaquetas térmicas 3D y algodón peinado 220 GSM',
    descuentoMayoristaPorc: 55, // Costo mayorista: 45% del PVP
    categorias: ['Ropa'],
  },
  {
    id: 'dist-3',
    nombre: 'Manufacturas de Cuero & Calzado La Fontana S.A.S',
    nit: '890.312.980-1',
    contacto: 'Valeria Cárdenas · Directora de Ventas Mayoristas',
    telefono: '+57 315 678 9012',
    email: 'mayoristas@lafontanaleather.co',
    ciudad: 'Bogotá D.C.',
    especialidad: 'Piel vacuna flor entera, calzado Oxford, mocasines miel y bolsos tote de lujo',
    descuentoMayoristaPorc: 50, // Costo mayorista: 50% del PVP
    categorias: ['Accesorios', 'Calzado'],
  },
  {
    id: 'dist-4',
    nombre: 'Laboratorios Botánicos & Cuidado Facial del Valle S.A.S',
    nit: '900.871.234-9',
    contacto: 'Dra. Elena Monsalve · Dirección Técnica y Despachos',
    telefono: '+57 318 234 5678',
    email: 'distribucion@botanicosdelvalle.co',
    ciudad: 'Cali, Valle del Cauca',
    especialidad: 'Sérums botánicos oro 24K, aceite puro de sacha inchi y cosmética limpia certificada',
    descuentoMayoristaPorc: 58, // Costo mayorista: 42% del PVP
    categorias: ['Cosméticos'],
  },
  {
    id: 'dist-5',
    nombre: 'Maestría Artesanal & Tejidos Tradicionales S.A.S',
    nit: '800.654.321-7',
    contacto: 'Taita Jairo Chindoy · Maestro Tejedor y Representante',
    telefono: '+57 320 123 4567',
    email: 'contacto@maestriatradicional.co',
    ciudad: 'Nobsa, Boyacá / Pasto, Nariño',
    especialidad: 'Lana virgen de oveja hilada a mano, palma de iraca fina, werregue y tejidos Wayuu',
    descuentoMayoristaPorc: 48, // Costo mayorista: 52% del PVP
    categorias: ['Artesanías'],
  },
];

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

export interface CrearSolicitudTrasladoDto {
  ubicacionDestinoId: number;
  esEnvioDirecto?: boolean;
  lineas: Array<{
    varianteId: number;
    cantidadSolicitada: number;
  }>;
}

export interface CrearSolicitudTrasladoLocalDto {
  origenId: number;
  origenNombre: string;
  destinoId: number;
  destinoNombre: string;
  observaciones?: string;
  despacharInmediatamente?: boolean;
  lineas: Array<{
    varianteId: number;
    sku: string;
    nombreProducto: string;
    cantidadSolicitada: number;
  }>;
}

// ============================================
// Funciones de Inventario (RN-GEN-01: Fuente única PostgreSQL)
// ============================================

export const getLocalInventario = (_filtro: InventarioFiltro = {}): InventarioDTO[] => {
  return [];
};

export const getStoredTraslados = (): TrasladoDTO[] => {
  return [];
};

function mapBackendTraslado(t: any): TrasladoDTO {
  return {
    id: t.id,
    codigo: t.codigo || `TRL-${String(t.id).padStart(4, '0')}`,
    origenId: t.ubicacionOrigenId ?? t.ubicacionOrigen?.id ?? 1,
    origenNombre: t.ubicacionOrigen?.nombre ?? t.origenNombre ?? 'Bodega Central',
    destinoId: t.ubicacionDestinoId ?? t.ubicacionDestino?.id,
    destinoNombre: t.ubicacionDestino?.nombre ?? t.destinoNombre ?? 'Punto Destino',
    estado: t.estado,
    fechaSolicitud: t.fechaSolicitud,
    fechaEnvio: t.fechaEnvio,
    fechaRecepcion: t.fechaRecepcion,
    observaciones: t.observaciones || t.motivoRechazo,
    lineas: (t.lineas || []).map((l: any) => ({
      id: l.id,
      varianteId: l.varianteId,
      sku: l.variante?.sku || l.sku || `VAR-${l.varianteId}`,
      nombreProducto: l.variante?.producto?.nombre || l.nombreProducto || 'Prenda de Colección',
      cantidadSolicitada: l.cantidadSolicitada,
      cantidadAprobada: l.cantidadAprobada ?? l.cantidadSolicitada,
      cantidadEnviada: l.cantidadEnviada ?? 0,
      recibidaBuena: l.cantidadRecibidaBuena ?? l.recibidaBuena ?? 0,
      recibidaDanada: l.cantidadRecibidaDanada ?? l.recibidaDanada ?? 0,
    })),
  };
}

export const crearSolicitudTraslado = async (
  payload: CrearSolicitudTrasladoDto,
  idempotencyKey?: string
): Promise<TrasladoDTO> => {
  const key =
    idempotencyKey ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `TRL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

  const response = await apiRequest<{ datos: any }>('/traslados', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Idempotency-Key': key },
  });
  return mapBackendTraslado(response.datos);
};

export const createSolicitudTrasladoLocal = async (
  payload: CrearSolicitudTrasladoLocalDto
): Promise<TrasladoDTO> => {
  return crearSolicitudTraslado({
    ubicacionDestinoId: payload.destinoId,
    esEnvioDirecto: payload.despacharInmediatamente,
    lineas: payload.lineas.map((l) => ({
      varianteId: l.varianteId,
      cantidadSolicitada: l.cantidadSolicitada,
    })),
  });
};

export const fetchInventario = async (
  filtro: InventarioFiltro = {}
): Promise<InventarioDTO[]> => {
  const params = new URLSearchParams();
  if (filtro.categoria && filtro.categoria !== 'Todas') {
    params.append('categoria', filtro.categoria);
  }
  if (filtro.sku) params.append('sku', filtro.sku);
  if (filtro.stockBajo) params.append('stockBajo', 'true');
  params.append('limite', '500');

  const query = params.toString();
  const response = await apiRequest<{ datos: InventarioDTO[] }>(
    `/inventario${query ? `?${query}` : ''}`
  );
  if (response && Array.isArray(response.datos)) {
    return response.datos;
  }
  return [];
};

// ============================================
// Funciones de Compras
// ============================================
export const fetchOrdenesCompra = async (): Promise<OrdenCompraDTO[]> => {
  const response = await apiRequest<{ datos: OrdenCompraDTO[] }>('/compras');
  if (response && Array.isArray(response.datos)) {
    return response.datos;
  }
  return [];
};

export const createOrdenCompra = async (
  payload: CrearOrdenCompraDto,
  idempotencyKey: string
): Promise<OrdenCompraDTO> => {
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
// Funciones de Traslados (RN-TRA-01 a RN-TRA-19)
// ============================================
export const fetchTraslados = async (estado?: EstadoTraslado): Promise<TrasladoDTO[]> => {
  const query = estado ? `?estado=${estado}` : '';
  const response = await apiRequest<{ datos: any[] }>(`/traslados${query}`);
  if (response && Array.isArray(response.datos)) {
    return response.datos.map(mapBackendTraslado);
  }
  return [];
};

export const despacharTraslado = async (
  payload: DespachoTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  const response = await apiRequest<{ datos: any }>(
    `/traslados/${payload.trasladoId}/despachar`,
    {
      method: 'POST',
      body: JSON.stringify({ lineas: payload.lineas }),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return mapBackendTraslado(response.datos);
};

export const recibirTraslado = async (
  payload: RecepcionTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  const response = await apiRequest<{ datos: any }>(
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
  return mapBackendTraslado(response.datos);
};

export const resolverNovedadTraslado = async (
  payload: ResolucionNovedadDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  const response = await apiRequest<{ datos: any }>(
    `/traslados/${payload.trasladoId}/resolver-novedad`,
    {
      method: 'POST',
      body: JSON.stringify({ resoluciones: payload.resoluciones }),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return mapBackendTraslado(response.datos);
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
