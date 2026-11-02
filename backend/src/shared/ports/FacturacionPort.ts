export interface DatosComprobante {
  consecutivo: string;
  tipoDocumento: 'VENTA_POS' | 'DEVOLUCION_POS';
  sedeNombre: string;
  totalCop: number;
  fechaEmision: Date;
}

export interface FacturacionPort {
  emitirComprobanteInterno(datos: DatosComprobante): Promise<{ impreso: boolean; urlComprobante?: string }>;
}
