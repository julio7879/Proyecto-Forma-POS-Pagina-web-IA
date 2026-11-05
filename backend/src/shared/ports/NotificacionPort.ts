export type TipoNotificacion =
  | 'RECUPERACION_CLAVE'
  | 'ALERTA_STOCK_BAJO'
  | 'INCIDENCIA_PEDIDO'
  | 'CONFIRMACION_PEDIDO'
  | 'ALERTA_DESCUADRE_CAJA'
  | 'APERTURA_CIERRE_CAJA'
  | 'NUEVO_PEDIDO_WEB'
  | 'RESERVA_VENCIDA_LIBERADA'
  | 'PEDIDO_ENVIADO';

export interface NotificacionPayload {
  destinatario?: string; // chat_id Telegram o email opcional (se deduce del canal si no se pasa)
  asunto: string;
  cuerpo: string;
  tipo: TipoNotificacion;
  datosExtra?: Record<string, unknown>;
}

export interface NotificacionPort {
  enviarNotificacion(payload: NotificacionPayload): Promise<boolean>;
}