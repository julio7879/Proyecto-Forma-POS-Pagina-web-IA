// frontend/src/features/caja/services/cajaService.ts
import { apiRequest } from '../../../api/apiClient';

// ============================================
// DTOs
// ============================================
export type EstadoSesionCaja = 'ABIERTA' | 'CERRADA';
export type TipoMovimientoCaja =
  | 'APERTURA'
  | 'VENTA_EFECTIVO'
  | 'VENTA_TRANSFERENCIA'
  | 'REEMBOLSO_EFECTIVO'
  | 'SANGRIA_RETIRO'
  | 'GASTO_MENOR'
  | 'INGRESO_MANUAL'
  | 'CIERRE';

export interface SesionCajaDTO {
  id: number;
  ubicacionId: number;
  ubicacionNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  estado: EstadoSesionCaja;
  fechaNegocioColombia: string; // YYYY-MM-DD
  baseContadaCop: number;
  efectivoEsperadoCop: number; // Solo el backend lo calcula
  abiertaEn: string;
  cerradaEn?: string;
}

export interface AbrirSesionDto {
  ubicacionId: number;
  baseContadaCop: number;
  observacion?: string;
}

export interface RegistrarRetiroDto {
  sesionCajaId: number;
  montoCop: number;
  motivoRetiro: string;
}

export interface CerrarSesionCiegoDto {
  sesionCajaId: number;
  montoContadoCop: number;
  observacion?: string;
}

export interface CierreSesionResultadoDto {
  sesionCajaId: number;
  efectivoEsperadoCop: number;
  efectivoContadoCop: number;
  diferenciaEfectivoCop: number;
  efectivoAEntregarCop: number;
}

// ============================================
// Funciones HTTP
// ============================================
export const fetchSesionActiva = async (
  ubicacionId: number
): Promise<SesionCajaDTO | null> => {
  try {
    const response = await apiRequest<{ datos: SesionCajaDTO | null }>(
      `/cajas/sesion/activa?ubicacionId=${ubicacionId}`
    );
    return response.datos;
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
};

export const abrirSesion = async (
  payload: AbrirSesionDto,
  idempotencyKey: string
): Promise<SesionCajaDTO> => {
  const response = await apiRequest<{ datos: SesionCajaDTO }>(
    '/cajas/sesion/abrir',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

export const registrarRetiro = async (
  payload: RegistrarRetiroDto,
  idempotencyKey: string
): Promise<SesionCajaDTO> => {
  const response = await apiRequest<{ datos: SesionCajaDTO }>(
    '/cajas/movimiento/retiro',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};

export const cerrarSesionCiego = async (
  payload: CerrarSesionCiegoDto,
  idempotencyKey: string
): Promise<CierreSesionResultadoDto> => {
  const response = await apiRequest<{ datos: CierreSesionResultadoDto }>(
    '/cajas/sesion/cerrar',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    }
  );
  return response.datos;
};