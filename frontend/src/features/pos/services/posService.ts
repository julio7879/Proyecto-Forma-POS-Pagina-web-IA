// frontend/src/features/pos/services/posService.ts
import { apiRequest } from '../../../api/apiClient';
import { VentaTicketDTO } from '../types/ticket.types';

// ============================================
// DTOs de Búsqueda
// ============================================
export interface VarianteBusquedaDTO {
  varianteId: number;
  sku: string;
  talla: string;
  color: string;
  precioUnitarioCop: number;
  stockDisponible: number;
}

export interface ProductoBusquedaDTO {
  productoId: number;
  nombre: string;
  categoriaNombre: string;
  categoriaSlug: string;
  esCosmeticoUsoPersonal: boolean;
  variantes: VarianteBusquedaDTO[];
}

// ============================================
// DTOs de Venta POS
// ============================================
export type MetodoPagoPOS = 'EFECTIVO' | 'TRANSFERENCIA';

export interface LineaVentaPOSDto {
  varianteId: number;
  sku: string;
  cantidad: number;
}

export interface PagoVentaPOSDto {
  metodoPago: MetodoPagoPOS;
  montoRecibidoCop?: number;
  referenciaTransferencia?: string;
}

export interface CrearVentaPOSDto {
  ubicacionId: number;
  clienteNombre?: string;
  lineas: LineaVentaPOSDto[];
  pagos: PagoVentaPOSDto[];
}

// ============================================
// Funciones de Búsqueda
// ============================================
export const searchProduct = async (query: string): Promise<ProductoBusquedaDTO[]> => {
  const response = await apiRequest<{ datos: ProductoBusquedaDTO[] }>(
    `/ventas-pos/search?q=${encodeURIComponent(query)}`
  );
  return response.datos;
};

// ============================================
// Funciones de Venta
// ============================================
export const submitSale = async (
  payload: CrearVentaPOSDto,
  idempotencyKey: string
): Promise<{ ticket: VentaTicketDTO; consecutivo: string }> => {
  const response = await apiRequest<{ datos: { ticket: VentaTicketDTO; consecutivo: string } }>(
    '/ventas-pos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};