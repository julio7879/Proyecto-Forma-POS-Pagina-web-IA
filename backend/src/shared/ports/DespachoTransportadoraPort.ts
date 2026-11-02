export interface DatosGuiaEnvio {
  transportadora: string;
  numeroGuia: string;
  costoFleteCop: number;
  diasEstimados: number;
}

export interface DespachoTransportadoraPort {
  generarGuiaEnvio(params: {
    pedidoId: number;
    municipioOrigenDaneId: string;
    municipioDestinoDaneId: string;
    destinatarioNombre: string;
    destinatarioDireccion: string;
    destinatarioTelefono: string;
  }): Promise<DatosGuiaEnvio>;
}
