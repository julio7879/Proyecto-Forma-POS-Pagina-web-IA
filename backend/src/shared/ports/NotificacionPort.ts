export interface NotificacionPayload {
  destinatario: string; // correo o teléfono
  asunto: string;
  cuerpo: string;
  tipo: 'RECUPERACION_CLAVE' | 'ALERTA_STOCK_BAJO' | 'INCIDENCIA_PEDIDO' | 'CONFIRMACION_PEDIDO';
}

export interface NotificacionPort {
  enviarNotificacion(payload: NotificacionPayload): Promise<boolean>;
}
