// frontend/src/features/admin/components/RotuloDespachoPrint.tsx
import { Printer, X } from 'lucide-react';
import { PedidoWebDTO } from '../services/adminService';

interface Props {
  pedido: PedidoWebDTO;
  transportadora?: string;
  numeroGuia?: string;
  onClose?: () => void;
  onPrint?: () => void;
}

const formatFecha = (iso?: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const RotuloDespachoPrint = ({
  pedido,
  transportadora,
  numeroGuia,
  onClose,
  onPrint,
}: Props) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const totalUnidades = pedido.lineas.reduce((acc, l) => acc + l.cantidad, 0);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 min-h-screen print:bg-white print:p-0 print:m-0">
      {/* Botones de acción en pantalla (se ocultan al imprimir) */}
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          type="button"
          aria-label="Imprimir Rótulo de Despacho"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Rótulo (80 mm)</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors shadow-sm"
            type="button"
            aria-label="Cerrar vista de rótulo"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        )}
      </div>

      {/* Contenedor Térmico de 80 mm */}
      <div
        id="rotulo-despacho-pos"
        className="w-[80mm] max-w-[80mm] bg-white text-black p-4 font-mono text-xs shadow-md border border-gray-200 print:border-none print:shadow-none print:p-2 print:w-[80mm]"
      >
        {/* Encabezado */}
        <div className="text-center space-y-0.5">
          <h1 className="text-sm font-bold tracking-tight uppercase">
            Forma Store · Despacho Web
          </h1>
          <p className="text-[10px] text-gray-700">
            Comprobante interno de despacho (MVP v2.1)
          </p>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Guía y Transportadora */}
        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>GUÍA:</span>
            <span className="font-mono">{numeroGuia ?? 'PENDIENTE'}</span>
          </div>
          <div className="flex justify-between">
            <span>TRANSPORTADORA:</span>
            <span className="font-semibold">{transportadora ?? 'PENDIENTE'}</span>
          </div>
          <div className="flex justify-between">
            <span>PEDIDO:</span>
            <span className="font-mono">{pedido.referenciaLegible}</span>
          </div>
          <div className="flex justify-between">
            <span>FECHA:</span>
            <span>{formatFecha(pedido.fechaCreacion)}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Remitente */}
        <div className="space-y-0.5 text-[11px]">
          <div className="text-[10px] uppercase font-bold text-gray-700 mb-0.5">
            REMITENTE
          </div>
          <p className="font-bold">
            {pedido.ubicacionAsignadaNombre ?? `Sede #${pedido.ubicacionAsignadaId}`}
          </p>
          <p className="text-[10px] text-gray-700">
            Forma Store · Bodega Central (Cúcuta)
          </p>
          <p className="text-[10px] text-gray-700">
            NIT: 900.000.000-0 · Tel: 300 000 0000
          </p>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Destinatario */}
        <div className="space-y-0.5 text-[11px]">
          <div className="text-[10px] uppercase font-bold text-gray-700 mb-0.5">
            DESTINATARIO
          </div>
          <p className="font-bold">{pedido.destinatarioNombre}</p>
          <p className="text-[10px] text-gray-700">
            Tel: <span className="font-mono">{pedido.destinatarioTelefono}</span>
          </p>
          <p className="text-[10px] text-gray-700 leading-tight">
            {pedido.direccionEntrega}
          </p>
          <div className="flex justify-between pt-1">
            <span className="text-[10px] text-gray-700">MUNICIPIO DANE:</span>
            <span className="font-mono font-bold">{pedido.municipioDestinoId}</span>
          </div>
          {pedido.municipioDestinoNombre && (
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-700">CIUDAD:</span>
              <span className="font-semibold">{pedido.municipioDestinoNombre}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[10px] text-gray-700">ZONA DE ENVÍO:</span>
            <span className="font-mono">Zona {pedido.zonaEnvioCalculada}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Detalle resumido */}
        <div className="space-y-1 text-[11px]">
          <div className="text-[10px] uppercase font-bold text-gray-700">
            CONTENIDO
          </div>
          {pedido.lineas.map((linea, index) => (
            <div key={`${linea.sku}-${index}`} className="leading-tight">
              <div className="flex justify-between">
                <span className="font-bold">
                  {linea.cantidad}x {linea.nombreProducto}
                </span>
              </div>
              <div className="text-[10px] text-gray-600 pl-2">
                <span className="font-mono">SKU: {linea.sku}</span>
                {linea.talla && <span> · Talla: {linea.talla}</span>}
                {linea.color && <span> · Color: {linea.color}</span>}
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-1 border-t border-gray-300 font-bold">
            <span>TOTAL UNIDADES:</span>
            <span className="font-mono">{totalUnidades}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Metadatos de envío */}
        <div className="space-y-0.5 text-[10px] text-gray-700">
          <div className="flex justify-between">
            <span>MÉTODO DE PAGO:</span>
            <span className="font-semibold">{pedido.metodoPago}</span>
          </div>
          <div className="flex justify-between">
            <span>DÍAS ESTIMADOS:</span>
            <span className="font-mono">{pedido.diasEstimadosSnapshot}</span>
          </div>
          <div className="flex justify-between">
            <span>COSTO ENVÍO:</span>
            <span className="font-mono">
              ${pedido.costoEnvioCop.toLocaleString('es-CO')} COP
            </span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Pie legal */}
        <div className="text-center text-[9px] text-gray-600 space-y-1 pt-1">
          <p className="font-semibold text-black">
            MANIPULAR CON CUIDADO
          </p>
          <p className="leading-tight">
            Rótulo de despacho interno sin valor tributario DIAN.
            Devoluciones dentro de los 5 días hábiles posteriores a la entrega (Ley 1480 de 2011).
          </p>
          <p className="font-mono text-[8px] pt-1">
            Ref: {pedido.referenciaLegible} · {formatFecha(pedido.fechaCreacion)}
          </p>
        </div>
      </div>
    </div>
  );
};