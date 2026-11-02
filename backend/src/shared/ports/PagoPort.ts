export interface ResultadoPago {
  exitoso: boolean;
  referencia: string;
  montoCop: number;
  mensaje?: string;
}

export interface PagoPort {
  procesarPagoTransferencia(params: {
    referenciaComprobante: string;
    montoCop: number;
  }): Promise<ResultadoPago>;

  procesarReembolso(params: {
    referenciaOriginal: string;
    montoReembolsoCop: number;
    motivo: string;
  }): Promise<ResultadoPago>;
}
