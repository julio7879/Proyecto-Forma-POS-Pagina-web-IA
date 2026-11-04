/**
 * Vista previa SOLO PARA QA (Issue #28 / PR #26).
 * TicketVentaPOS todavía no está conectado a ninguna ruta de la app,
 * así que esta página permite verlo e imprimirlo en el navegador:
 *   npm run dev --prefix frontend  →  http://localhost:5173/qa-ticket.html
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import { TicketVentaPOS } from '../features/pos/components/TicketVentaPOS';
import { formatTelegramReceipt } from '../features/pos/utils/formatTelegramReceipt';
import { VentaTicketDTO } from '../features/pos/types/ticket.types';

const base: VentaTicketDTO = {
  nombreTienda: 'Forma Store',
  nombreSede: 'Sede Medellín - Centro',
  direccionSede: 'Cra 43A # 1-50, Local 102',
  telefonoSede: '300 123 4567',
  consecutivo: 'MED-000042',
  fechaHora: '04/11/2026, 04:10 p.m.',
  cajeroNombre: 'Carlos Vendedor',
  clienteNombre: 'Juan Pérez',
  items: [
    {
      sku: 'ROPA-CAM-NEG-M',
      nombre: 'Camiseta Oversize',
      talla: 'M',
      color: 'Negro',
      cantidad: 2,
      precioUnitarioCop: 60000,
      subtotalCop: 120000,
      descuentoCop: 10000,
      totalCop: 110000,
    },
    {
      sku: 'ROPA-JEA-AZU-32',
      nombre: 'Jean Slim Fit Tiro Alto Con Rotos Edición Limitada Temporada',
      talla: '32',
      color: 'Azul Índigo Oscuro',
      cantidad: 1,
      precioUnitarioCop: 45000,
      subtotalCop: 45000,
      descuentoCop: 0,
      totalCop: 45000,
    },
  ],
  subtotalCop: 165000,
  descuentoTotalCop: 10000,
  ivaDiscriminadoCop: 24748,
  totalNetoCop: 155000,
  metodoPago: 'EFECTIVO',
  montoRecibidoCop: 200000,
  cambioCop: 45000,
};

type Escenario = 'EFECTIVO' | 'TRANSFERENCIA' | 'SIN_CLIENTE';

const escenarios: Record<Escenario, VentaTicketDTO> = {
  EFECTIVO: base,
  TRANSFERENCIA: {
    ...base,
    metodoPago: 'TRANSFERENCIA',
    montoRecibidoCop: undefined,
    cambioCop: undefined,
    referenciaTransferencia: 'NEQUI-847291',
  },
  SIN_CLIENTE: { ...base, clienteNombre: undefined },
};

const PreviewQA: React.FC = () => {
  const [escenario, setEscenario] = useState<Escenario>('EFECTIVO');
  const ticket = escenarios[escenario];

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-4 bg-amber-50 border-b border-amber-200 print:hidden">
        <strong className="text-sm mr-2">QA SP3-05 · Escenario:</strong>
        {(Object.keys(escenarios) as Escenario[]).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEscenario(e)}
            className={`px-3 py-1 text-xs rounded border ${
              escenario === e ? 'bg-amber-600 text-white' : 'bg-white'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <TicketVentaPOS ticket={ticket} />

      <div className="max-w-xl mx-auto p-4 print:hidden">
        <h2 className="text-sm font-bold mb-2">Recibo Telegram (formatTelegramReceipt)</h2>
        <pre className="whitespace-pre-wrap text-xs bg-slate-900 text-slate-100 p-3 rounded">
          {formatTelegramReceipt(ticket)}
        </pre>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreviewQA />
  </React.StrictMode>
);
