/**
 * Tipos y DTOs para el Modal de Cobro Rápido en Terminal POS
 * Cumplimiento: MOD-08, RF-POS-01, RF-POS-02, RN-GEN-04, CA-51, CA-52
 */

export type MetodoPagoCobro = 'EFECTIVO' | 'TRANSFERENCIA';

export interface CobroPayloadDTO {
  metodoPago: MetodoPagoCobro;
  montoRecibidoCop: number;
  cambioCop: number;
  referenciaTransferencia?: string;
}

export interface CobroRapidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalVentaCop: number;
  onConfirmarCobro: (payload: CobroPayloadDTO) => Promise<void>;
  isSubmitting: boolean;
}

export interface TecladoNumericoPOSProps {
  valorActual: number;
  onValorChange: (nuevoValor: number) => void;
  onTecla?: (tecla: string) => void;
  disabled?: boolean;
}