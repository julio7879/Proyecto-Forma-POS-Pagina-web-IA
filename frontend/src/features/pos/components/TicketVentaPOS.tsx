import React from 'react';
import { Printer, X } from 'lucide-react';
import { VentaTicketDTO } from '../types/ticket.types';

interface TicketVentaPOSProps {
  ticket: VentaTicketDTO;
  onClose?: () => void;
  onPrint?: () => void;
}

const formatMonedaCop = (valor: number): string => {
  return `$${(valor || 0).toLocaleString('es-CO')}`;
};

export const TicketVentaPOS: React.FC<TicketVentaPOSProps> = ({
  ticket,
  onClose,
  onPrint,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 min-h-screen print:bg-white print:p-0 print:m-0">
      {/* Botones de acción en pantalla (se ocultan al imprimir) */}
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          type="button"
          aria-label="Imprimir Comprobante"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Ticket (80 mm)</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors shadow-sm"
            type="button"
            aria-label="Cerrar vista de ticket"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        )}
      </div>

      {/* Contenedor Térmico de 80 mm */}
      <div
        id="ticket-termico-pos"
        className="w-[80mm] max-w-[80mm] bg-white text-black p-4 font-mono text-xs shadow-md border border-gray-200 print:border-none print:shadow-none print:p-2 print:w-[80mm]"
      >
        {/* Encabezado */}
        <div className="text-center space-y-0.5">
          <h1 className="text-sm font-bold tracking-tight uppercase">
            {ticket.nombreTienda}
          </h1>
          <p className="font-semibold">{ticket.nombreSede}</p>
          {ticket.direccionSede && (
            <p className="text-[10px] text-gray-700">{ticket.direccionSede}</p>
          )}
          {ticket.telefonoSede && (
            <p className="text-[10px] text-gray-700">Tel: {ticket.telefonoSede}</p>
          )}
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Metadatos */}
        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>COMPROBANTE:</span>
            <span>{ticket.consecutivo}</span>
          </div>
          <div className="flex justify-between">
            <span>FECHA:</span>
            <span>{ticket.fechaHora}</span>
          </div>
          <div className="flex justify-between">
            <span>CAJERO:</span>
            <span>{ticket.cajeroNombre}</span>
          </div>
          <div className="flex justify-between">
            <span>CLIENTE:</span>
            <span>{ticket.clienteNombre || 'Consumidor Final'}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Detalle de Artículos */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold text-gray-700 grid grid-cols-12 pb-1 border-b border-gray-200">
            <span className="col-span-2">CANT</span>
            <span className="col-span-6">DESCRIPCIÓN</span>
            <span className="col-span-4 text-right">TOTAL</span>
          </div>

          {ticket.items.map((item, index) => (
            <div key={`${item.sku}-${index}`} className="text-[11px] leading-tight">
              <div className="grid grid-cols-12">
                <span className="col-span-2 font-bold">{item.cantidad}x</span>
                <span className="col-span-6 font-medium break-words">
                  {item.nombre}
                </span>
                <span className="col-span-4 text-right font-bold">
                  {formatMonedaCop(item.totalCop)}
                </span>
              </div>
              <div className="text-[10px] text-gray-600 pl-4 space-y-0.5">
                <div>
                  Talla: {item.talla} | Color: {item.color}
                </div>
                <div className="text-[9px]">SKU: {item.sku}</div>
                {item.descuentoCop > 0 && (
                  <div className="text-red-700 font-semibold">
                    Desc: -{formatMonedaCop(item.descuentoCop)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Totales */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatMonedaCop(ticket.subtotalCop)}</span>
          </div>

          {ticket.descuentoTotalCop > 0 && (
            <div className="flex justify-between text-red-700 font-semibold">
              <span>Descuento:</span>
              <span>-{formatMonedaCop(ticket.descuentoTotalCop)}</span>
            </div>
          )}

          <div className="flex justify-between text-[10px] text-gray-600">
            <span>IVA discriminado (19% inc.):</span>
            <span>{formatMonedaCop(ticket.ivaDiscriminadoCop)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300">
            <span>TOTAL:</span>
            <span>{formatMonedaCop(ticket.totalNetoCop)} COP</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Pago */}
        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between font-semibold">
            <span>FORMA DE PAGO:</span>
            <span>{ticket.metodoPago}</span>
          </div>

          {ticket.metodoPago === 'EFECTIVO' && (
            <>
              {ticket.montoRecibidoCop !== undefined && (
                <div className="flex justify-between">
                  <span>Recibido:</span>
                  <span>{formatMonedaCop(ticket.montoRecibidoCop)}</span>
                </div>
              )}
              {ticket.cambioCop !== undefined && (
                <div className="flex justify-between font-semibold">
                  <span>Cambio / Vueltos:</span>
                  <span>{formatMonedaCop(ticket.cambioCop)}</span>
                </div>
              )}
            </>
          )}

          {ticket.metodoPago === 'TRANSFERENCIA' && ticket.referenciaTransferencia && (
            <div className="flex justify-between text-[10px]">
              <span>Ref. Bancaria:</span>
              <span className="font-semibold">{ticket.referenciaTransferencia}</span>
            </div>
          )}
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Leyenda Legal (RN-VTA-10) */}
        <div className="text-center text-[9px] text-gray-600 space-y-1.5 pt-1">
          <p className="font-semibold text-black">
            ¡GRACIAS POR SU COMPRA!
          </p>
          <p className="leading-tight">
            Comprobante interno de venta sin valor tributario DIAN (MVP v2.1).
            Conserve este recibo para cambios mano a mano en cualquiera de nuestras
            tiendas físicas dentro de los 30 días calendario siguientes a la compra.
          </p>
        </div>
      </div>
    </div>
  );
};