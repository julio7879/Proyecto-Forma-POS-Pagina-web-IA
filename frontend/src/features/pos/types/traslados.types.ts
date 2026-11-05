/**
 * Tipos y DTOs para la Recepción de Traslados en Punto de Venta
 * Cumplimiento: MOD-06, RF-TRA-05, CA-06, CA-07, CA-08, CA-57, CA-58, RN-TRA-09, RN-GEN-01
 */

export interface LineaTrasladoDTO {
  id: number; // lineaId requerido por el backend
  varianteId: number;
  sku: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidadEnviada: number;
}

export interface TrasladoEnTransitoDTO {
  id: number; // trasladoId para la URL /api/traslados/:id/recibir
  numeroGuia: string;
  version?: number; // Para control de concurrencia optimista QA-014
  sedeOrigen: string;
  sedeDestino: string;
  fechaEnvio?: string;
  lineas: LineaTrasladoDTO[];
}

export interface LineaRecepcionPayloadDTO {
  lineaId: number;
  cantidadRecibidaBuena: number;
  cantidadRecibidaDanada: number;
  excedenteReportado?: number;
}

export interface RecepcionTrasladoPayloadDTO {
  trasladoId: number;
  version?: number;
  lineas: LineaRecepcionPayloadDTO[];
  observacion?: string; // Singular, compatible con Zod recibirTrasladoSchema
}

export interface RecepcionTrasladoModalProps {
  isOpen: boolean;
  onClose: () => void;
  traslado: TrasladoEnTransitoDTO;
  onSubmit: (payload: RecepcionTrasladoPayloadDTO) => Promise<void>;
  isSubmitting: boolean;
}
