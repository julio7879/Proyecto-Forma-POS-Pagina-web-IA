export interface NotificacionPayload {
  destinatario: string; // chat_id Telegram o correo electrónico
  asunto: string;
  cuerpo: string;
  tipo:
    | 'RECUPERACION_CLAVE'
    | 'ALERTA_STOCK_BAJO'
    | 'INCIDENCIA_PEDIDO'
    | 'CONFIRMACION_PEDIDO'
    | 'ALERTA_DESCUADRE_CAJA'
    | 'NUEVO_PEDIDO_WEB';
}

export interface NotificacionPort {
  enviarNotificacion(payload: NotificacionPayload): Promise<boolean>;
}
