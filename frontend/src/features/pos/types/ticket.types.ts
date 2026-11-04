export interface TicketItem {
    sku: string;
    nombre: string;
    talla: string;
    color: string;
    cantidad: number;
    precioUnitarioCop: number;
    subtotalCop: number;
    descuentoCop: number;
    totalCop: number;
  }
  
  export type MetodoPagoPOS = 'EFECTIVO' | 'TRANSFERENCIA';
  
  export interface VentaTicketDTO {
    nombreTienda: string;
    nombreSede: string;
    direccionSede?: string;
    telefonoSede?: string;
    consecutivo: string;
    fechaHora: string;
    cajeroNombre: string;
    clienteNombre?: string;
    items: TicketItem[];
    subtotalCop: number;
    descuentoTotalCop: number;
    ivaDiscriminadoCop: number; // IVA 19% incluido en el total
    totalNetoCop: number;
    metodoPago: MetodoPagoPOS;
    montoRecibidoCop?: number;
    cambioCop?: number;
    referenciaTransferencia?: string;
  }