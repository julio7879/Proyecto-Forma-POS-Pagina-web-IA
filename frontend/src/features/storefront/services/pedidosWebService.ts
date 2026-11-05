// frontend/src/features/storefront/services/pedidosWebService.ts
import { apiRequest } from '../../../api/apiClient';

// ============================================
// DTOs de Municipios DANE
// ============================================
export interface MunicipioDaneDTO {
  municipioId: number;
  municipioNombre: string;
  departamentoId: number;
  departamentoNombre: string;
  zona: 1 | 2 | 3 | 4;
  tarifaFleteCop: number;
  diasEstimados: number;
}

export interface DepartamentoDaneDTO {
  departamentoId: number;
  departamentoNombre: string;
  municipios: MunicipioDaneDTO[];
}

// ============================================
// DTOs de Checkout
// ============================================
export type MedioPagoWeb = 'TRANSFERENCIA' | 'CONTRAENTREGA';

export interface LineaCheckoutDto {
  varianteId: number;
  cantidad: number;
}

export interface CrearCheckoutDto {
  direccion: string;
  municipioId: number;
  medioPago: MedioPagoWeb;
  lineas: LineaCheckoutDto[];
}

export interface CheckoutResponseDto {
  comprobante: string; // PED-YYYY-XXXXXX
  estado: 'RECIBIDO' | 'CONFIRMADO';
  tarifaFleteCop: number;
  totalCop: number;
  ubicacionAsignadaId: number;
  ubicacionAsignadaNombre: string;
}

// ============================================
// DTOs de Pedidos
// ============================================
export type EstadoPedidoWeb =
  | 'RECIBIDO'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'NO_ENTREGADO'
  | 'CANCELADO';

export interface LineaPedidoWebDTO {
  id: number;
  varianteId: number;
  sku: string;
  nombreProducto: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitarioCop: number;
  subtotalCop: number;
}

export interface PedidoWebDTO {
  id: number;
  comprobante: string;
  fechaCreacion: string;
  estado: EstadoPedidoWeb;
  medioPago: MedioPagoWeb;
  direccionEntrega: string;
  municipioNombre: string;
  departamentoNombre: string;
  tarifaFleteCop: number;
  subtotalCop: number;
  totalCop: number;
  ubicacionAsignadaNombre?: string;
  lineas: LineaPedidoWebDTO[];
}

// ============================================
// Funciones HTTP
// ============================================
export const fetchDepartamentos = async (): Promise<DepartamentoDaneDTO[]> => {
  const response = await apiRequest<{ datos: DepartamentoDaneDTO[] }>(
    '/pedidos-web/municipios'
  );
  return response.datos;
};

export const submitCheckout = async (
  payload: CrearCheckoutDto,
  idempotencyKey: string
): Promise<CheckoutResponseDto> => {
  const response = await apiRequest<{ datos: CheckoutResponseDto }>(
    '/pedidos-web/checkout',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

export const fetchMisPedidos = async (): Promise<PedidoWebDTO[]> => {
  const response = await apiRequest<{ datos: PedidoWebDTO[] }>('/pedidos-web');
  return response.datos;
};