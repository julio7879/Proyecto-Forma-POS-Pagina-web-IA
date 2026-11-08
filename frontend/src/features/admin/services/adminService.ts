// frontend/src/features/admin/services/adminService.ts
import { PRODUCTOS_SEMILLA } from '../../storefront/services/catalogService';
import { getAllStockDeltas } from '../../pos/utils/posLedgerSync';
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
// Funciones de Inventario
// ============================================

const SEDES_FALLBACK = [
  { id: 1, nombre: 'Bodega Central' },
  { id: 2, nombre: 'Punto Centro' },
  { id: 8, nombre: 'Punto Caobos' },
  { id: 3, nombre: 'Punto Ocaña' },
  { id: 4, nombre: 'Punto Bucaramanga' },
];

export const getLocalInventario = (filtro: InventarioFiltro = {}): InventarioDTO[] => {
  const stockDeltas = typeof window !== 'undefined' ? getAllStockDeltas() : {};
  const items: InventarioDTO[] = [];
  let currentId = 1;

  for (const prod of PRODUCTOS_SEMILLA) {
    if (
      filtro.categoria &&
      filtro.categoria !== 'Todas' &&
      prod.categoriaNombre !== filtro.categoria
    ) {
      continue;
    }
    for (const v of prod.variantes) {
      if (
        filtro.sku &&
        !v.sku.toLowerCase().includes(filtro.sku.toLowerCase()) &&
        !prod.nombre.toLowerCase().includes(filtro.sku.toLowerCase())
      ) {
        continue;
      }
      const delta = stockDeltas[v.sku] || 0;
      for (const sede of SEDES_FALLBACK) {
        const rawStock =
          v.stockPorSede?.[sede.nombre] ??
          (sede.id === 1 ? (v.stockDisponible ?? 0) : 0);
        const fisico = Math.max(0, rawStock + (sede.id === 2 ? delta : 0));
        const resBlando = 0;
        const resDuro = 0;
        const noVendible = 0;
        const disponible = Math.max(0, fisico - resDuro);
        const umbral = 4;

        if (filtro.stockBajo && disponible > umbral) {
          continue;
        }

        items.push({
          id: currentId++,
          sku: v.sku,
          nombreProducto: prod.nombre,
          categoriaNombre: prod.categoriaNombre,
          sedeId: sede.id,
          sedeNombre: sede.nombre,
          fisico,
          disponible,
          reservadoBlando: resBlando,
          reservadoDuro: resDuro,
          noVendible,
          umbralStockBajo: umbral,
        });
      }
    }
  }
  return items;
};

const CODIGOS_DEMO_ANTIGUOS = new Set(['TRL-0084', 'TRL-0083', 'TRL-0082']);

export const getStoredTraslados = (): TrasladoDTO[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('forma_admin_traslados');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const limpios = parsed.filter((t: TrasladoDTO) => !CODIGOS_DEMO_ANTIGUOS.has(t?.codigo));
    if (limpios.length !== parsed.length) {
      localStorage.setItem('forma_admin_traslados', JSON.stringify(limpios));
    }
    return limpios;
  } catch {
    return [];
  }
};

const saveStoredTraslados = (lista: TrasladoDTO[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('forma_admin_traslados', JSON.stringify(lista));
  } catch {
    // Ignorar errores de almacenamiento
  }
};

export const createSolicitudTrasladoLocal = (
  payload: CrearSolicitudTrasladoLocalDto
): TrasladoDTO => {
  const actuales = getStoredTraslados();
  const nextNumber = actuales.length + 1;
  const nowIso = new Date().toISOString();
  const despachar = Boolean(payload.despacharInmediatamente);

  const nuevo: TrasladoDTO = {
    id: Date.now(),
    codigo: `TRL-${String(nextNumber).padStart(4, '0')}`,
    origenId: payload.origenId,
    origenNombre: payload.origenNombre,
    destinoId: payload.destinoId,
    destinoNombre: payload.destinoNombre,
    estado: despachar ? 'ENVIADO' : 'APROBADO',
    fechaSolicitud: nowIso,
    ...(despachar ? { fechaEnvio: nowIso } : {}),
    observaciones: payload.observaciones,
    lineas: payload.lineas.map((l, idx) => ({
      id: Date.now() + idx + 1,
      varianteId: l.varianteId,
      sku: l.sku,
      nombreProducto: l.nombreProducto,
      cantidadSolicitada: l.cantidadSolicitada,
      cantidadAprobada: l.cantidadSolicitada,
      cantidadEnviada: despachar ? l.cantidadSolicitada : 0,
      recibidaBuena: 0,
      recibidaDanada: 0,
    })),
  };

  saveStoredTraslados([nuevo, ...actuales]);
  return nuevo;
};

export const fetchInventario = async (
  filtro: InventarioFiltro = {}
): Promise<InventarioDTO[]> => {
  const params = new URLSearchParams();
  if (filtro.categoria) params.append('categoria', filtro.categoria);
  if (filtro.sku) params.append('sku', filtro.sku);
  if (filtro.stockBajo) params.append('stockBajo', 'true');

  const query = params.toString();
  try {
    const response = await apiRequest<{ datos: InventarioDTO[] }>(
      `/inventario${query ? `?${query}` : ''}`
    );
    if (response && Array.isArray(response.datos)) {
      return response.datos;
    }
  } catch {
    // Modo local / offline de contingencia con catálogo sincronizado
  }
  return getLocalInventario(filtro);
};

// ============================================
// Funciones de Compras
// ============================================
export const fetchOrdenesCompra = async (): Promise<OrdenCompraDTO[]> => {
  const response = await apiRequest<{ datos: OrdenCompraDTO[] }>('/compras');
  return response.datos;
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
// Funciones de Traslados
// ============================================
export const fetchTraslados = async (estado?: EstadoTraslado): Promise<TrasladoDTO[]> => {
  const query = estado ? `?estado=${estado}` : '';
  try {
    const response = await apiRequest<{ datos: TrasladoDTO[] }>(`/traslados${query}`);
    if (response && Array.isArray(response.datos)) {
      return response.datos;
    }
  } catch {
    // Fallback a traslados reales creados en localStorage
  }
  const all = getStoredTraslados();
  if (estado) return all.filter((t) => t.estado === estado);
  return all;
};

export const despacharTraslado = async (
  payload: DespachoTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  try {
    const response = await apiRequest<{ datos: TrasladoDTO }>(
      `/traslados/${payload.trasladoId}/despachar`,
      {
        method: 'POST',
        body: JSON.stringify({ lineas: payload.lineas }),
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    return response.datos;
  } catch (err) {
    const actuales = getStoredTraslados();
    const target = actuales.find((t) => t.id === payload.trasladoId);
    if (!target) throw err;

    const actualizado: TrasladoDTO = {
      ...target,
      estado: 'ENVIADO',
      fechaEnvio: new Date().toISOString(),
      lineas: target.lineas.map((l) => {
        const enviada = payload.lineas.find((pl) => pl.lineaId === l.id);
        return enviada ? { ...l, cantidadEnviada: enviada.cantidadEnviada } : l;
      }),
    };
    saveStoredTraslados(actuales.map((t) => (t.id === payload.trasladoId ? actualizado : t)));
    return actualizado;
  }
};

export const recibirTraslado = async (
  payload: RecepcionTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  try {
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
  } catch (err) {
    const actuales = getStoredTraslados();
    const target = actuales.find((t) => t.id === payload.trasladoId);
    if (!target) throw err;

    let hayNovedad = false;
    const nuevasLineas = target.lineas.map((l) => {
      const rec = payload.lineas.find((pl) => pl.lineaId === l.id);
      if (!rec) return l;
      const totalRecibido = rec.recibidaBuena + rec.recibidaDanada;
      if (
        totalRecibido < l.cantidadEnviada ||
        rec.recibidaDanada > 0 ||
        (rec.excedenteReportado && rec.excedenteReportado > 0)
      ) {
        hayNovedad = true;
      }
      return {
        ...l,
        recibidaBuena: rec.recibidaBuena,
        recibidaDanada: rec.recibidaDanada,
      };
    });

    const actualizado: TrasladoDTO = {
      ...target,
      estado: hayNovedad ? 'RECIBIDO_CON_NOVEDAD' : 'RECIBIDO',
      fechaRecepcion: new Date().toISOString(),
      observaciones: payload.observaciones || target.observaciones,
      lineas: nuevasLineas,
    };
    saveStoredTraslados(actuales.map((t) => (t.id === payload.trasladoId ? actualizado : t)));
    return actualizado;
  }
};

export const resolverNovedadTraslado = async (
  payload: ResolucionNovedadDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  try {
    const response = await apiRequest<{ datos: TrasladoDTO }>(
      `/traslados/${payload.trasladoId}/resolver-novedad`,
      {
        method: 'POST',
        body: JSON.stringify({ resoluciones: payload.resoluciones }),
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    return response.datos;
  } catch (err) {
    const actuales = getStoredTraslados();
    const target = actuales.find((t) => t.id === payload.trasladoId);
    if (!target) throw err;

    const detalleResolucion = payload.resoluciones
      .map((r) => `${r.tipo} (${r.cantidad} uds)${r.notas ? `: ${r.notas}` : ''}`)
      .join(' · ');

    const actualizado: TrasladoDTO = {
      ...target,
      estado: 'CERRADO',
      observaciones: target.observaciones
        ? `${target.observaciones} | Resolución: ${detalleResolucion}`
        : `Resolución: ${detalleResolucion}`,
    };
    saveStoredTraslados(actuales.map((t) => (t.id === payload.trasladoId ? actualizado : t)));
    return actualizado;
  }
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
