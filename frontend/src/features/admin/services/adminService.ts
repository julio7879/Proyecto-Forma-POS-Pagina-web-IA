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
// DTOs de Pedidos Web (SP4-08)
// ============================================
export type EstadoPedidoWeb =
  | 'RECIBIDO'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'NO_ENTREGADO'
  | 'CANCELADO';

export type MetodoPagoWeb = 'TRANSFERENCIA' | 'CONTRAENTREGA';

export type EstadoPagoWeb = 'PENDIENTE' | 'PAGADO' | 'REEMBOLSADO' | 'ANULADO';

export interface LineaPedidoWebDTO {
  id: number;
  varianteId: number;
  sku: string;
  nombreProducto: string;
  talla: string;
  color: string;
  cantidad: number;
  precioListaUnitarioCop: number;
  subtotalListaLineaCop: number;
  descuentoProrrateadoCop: number;
  netoPagadoLineaCop: number;
  cantidadDevueltaAcum: number;
}

export interface PedidoWebDTO {
  id: number;
  referenciaLegible: string;
  clienteId: number;
  clienteNombre?: string;
  clienteCorreo?: string;
  ubicacionAsignadaId: number;
  ubicacionAsignadaNombre?: string;
  tieneIncidenciaStock: boolean;
  tieneReservaActiva: boolean;
  estadoPedido: EstadoPedidoWeb;
  estadoPago: EstadoPagoWeb;
  metodoPago: MetodoPagoWeb;
  reservaExpiraEn?: string;
  municipioDestinoId: string;
  municipioDestinoNombre?: string;
  direccionEntrega: string;
  destinatarioNombre: string;
  destinatarioTelefono: string;
  zonaEnvioCalculada: number;
  costoEnvioCop: number;
  diasEstimadosSnapshot: number;
  subtotalListaCop: number;
  descuentoTotalCop: number;
  totalNetoProductosCop: number;
  totalAPagarCop: number;
  fechaCreacion: string;
  fechaEnvio?: string;
  fechaEntrega?: string;
  lineas: LineaPedidoWebDTO[];
}

export interface ListarPedidosWebFiltro {
  estadoPedido?: EstadoPedidoWeb;
  metodoPago?: MetodoPagoWeb;
  ubicacionAsignadaId?: number;
}

export interface DespachoWebDto {
  transportadora: string;
  numeroGuia: string;
}

export interface NoPuedoDespacharWebDto {
  varianteIdsAfectadas: number[];
  motivo: string;
}

export interface ResultadoNoPuedoDespachar {
  ok: boolean;
  mensaje: string;
  reasignado: boolean;
  enCustodiaCentral: boolean;
  pedido: PedidoWebDTO;
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
// Funciones de Pedidos Web (SP4-08)
// ============================================

/**
 * Lista los pedidos web según filtros.
 * GET /api/pedidos-web?estadoPedido=...&metodoPago=...&ubicacionAsignadaId=...
 * Aislamiento por rol lo aplica el backend (CLIENTE, VENDEDOR, ADMIN).
 */
export const fetchPedidosWeb = async (
  filtro: ListarPedidosWebFiltro = {}
): Promise<PedidoWebDTO[]> => {
  const params = new URLSearchParams();
  if (filtro.estadoPedido) params.append('estadoPedido', filtro.estadoPedido);
  if (filtro.metodoPago) params.append('metodoPago', filtro.metodoPago);
  if (filtro.ubicacionAsignadaId)
    params.append('ubicacionAsignadaId', String(filtro.ubicacionAsignadaId));

  const query = params.toString();
  const response = await apiRequest<{ datos: PedidoWebDTO[] }>(
    `/pedidos-web${query ? `?${query}` : ''}`
  );
  return response.datos;
};

/**
 * Obtiene el detalle de un pedido web por ID.
 * GET /api/pedidos-web/:id
 */
export const fetchPedidoWebPorId = async (id: number): Promise<PedidoWebDTO> => {
  const response = await apiRequest<{ datos: PedidoWebDTO }>(`/pedidos-web/${id}`);
  return response.datos;
};

/**
 * RF-WEB-04 / CA-40: Inicia la preparación del pedido (reserva blanda → reserva dura).
 * ⚠️ PENDIENTE EN BACKEND: POST /api/pedidos-web/:id/preparar
 * Mientras el backend no lo implemente, la UI debe tener el botón deshabilitado con tooltip.
 */
export const iniciarPreparacionPedido = async (
  pedidoId: number,
  idempotencyKey: string
): Promise<PedidoWebDTO> => {
  const response = await apiRequest<{ datos: PedidoWebDTO }>(
    `/pedidos-web/${pedidoId}/preparar`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

/**
 * RF-WEB-05 / CA-41: Despacha el pedido a la transportadora con número de guía.
 * ⚠️ PENDIENTE EN BACKEND: POST /api/pedidos-web/:id/despachar
 * Mientras el backend no lo implemente, la UI debe tener el botón deshabilitado con tooltip.
 */
export const despacharPedidoWeb = async (
  pedidoId: number,
  payload: DespachoWebDto,
  idempotencyKey: string
): Promise<PedidoWebDTO> => {
  const response = await apiRequest<{ datos: PedidoWebDTO }>(
    `/pedidos-web/${pedidoId}/despachar`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

/**
 * RF-WEB-06 / CA-43: Reporta "No puedo despachar" y activa cuarentena de SKU.
 * POST /api/pedidos-web/:id/no-puedo-despachar (YA EXISTE en backend)
 */
export const reportarNoPuedoDespachar = async (
  pedidoId: number,
  payload: NoPuedoDespacharWebDto,
  idempotencyKey: string
): Promise<ResultadoNoPuedoDespachar> => {
  return apiRequest<ResultadoNoPuedoDespachar>(
    `/pedidos-web/${pedidoId}/no-puedo-despachar`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
};