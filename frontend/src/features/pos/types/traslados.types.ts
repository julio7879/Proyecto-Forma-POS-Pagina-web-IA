/**
 * Tipos y DTOs para la Recepción de Traslados en Punto de Venta
 * Cumplimiento: MOD-06, RF-TRA-05, CA-06, CA-07, CA-08, CA-57, CA-58
 */

export interface LineaTrasladoDTO {
    sku: string;
    productoNombre: string;
    talla: string;
    color: string;
    cantidadEnviada: number;
  }
  
  export interface TrasladoEnTransitoDTO {
    numeroGuia: string; // Ej: "TRS-2026-000012"
    sedeOrigen: string;
    sedeDestino: string;
    fechaEnvio?: string;
    lineas: LineaTrasladoDTO[];
  }
  
  export interface LineaRecepcionDTO {
    sku: string;
    recibidaBuena: number;
    recibidaDanada: number;
    excedenteReportado: number;
    faltante: number;
  }
  
  export type EstadoRecepcionTraslado = 'RECIBIDO' | 'RECIBIDO_CON_NOVEDAD';
  
  export interface RecepcionTrasladoPayloadDTO {
    numeroGuia: string;
    estadoFinal: EstadoRecepcionTraslado;
    lineas: LineaRecepcionDTO[];
    observaciones?: string;
  }
  
  export interface RecepcionTrasladoModalProps {
    isOpen: boolean;
    onClose: () => void;
    traslado: TrasladoEnTransitoDTO;
    onSubmit: (payload: RecepcionTrasladoPayloadDTO) => Promise<void>;
    isSubmitting: boolean;
  }