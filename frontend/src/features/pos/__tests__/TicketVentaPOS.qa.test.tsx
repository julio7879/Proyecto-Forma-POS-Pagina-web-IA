/**
 * Pruebas QA complementarias (Issue #28 / PR #26).
 * Cubren criterios del DoD que la suite original no verifica explícitamente.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TicketVentaPOS } from '../components/TicketVentaPOS';
import { formatTelegramReceipt } from '../utils/formatTelegramReceipt';
import { VentaTicketDTO } from '../types/ticket.types';

const LEYENDA_RN_VTA_10 =
  'Comprobante interno de venta sin valor tributario DIAN (MVP v2.1). Conserve este recibo para cambios mano a mano en cualquiera de nuestras tiendas físicas dentro de los 30 días calendario siguientes a la compra.';

const base: VentaTicketDTO = {
  nombreTienda: 'Forma Store',
  nombreSede: 'Sede Medellín - Centro',
  consecutivo: 'MED-000042',
  fechaHora: '04/11/2026, 04:10 p.m.',
  cajeroNombre: 'Carlos Vendedor',
  items: [
    {
      sku: 'ROPA-CAM-NEG-M',
      nombre: 'Camiseta Oversize',
      talla: 'M',
      color: 'Negro',
      cantidad: 1,
      precioUnitarioCop: 45000,
      subtotalCop: 45000,
      descuentoCop: 0,
      totalCop: 45000,
    },
  ],
  subtotalCop: 45000,
  descuentoTotalCop: 0,
  ivaDiscriminadoCop: 7185,
  totalNetoCop: 45000,
  metodoPago: 'EFECTIVO',
  montoRecibidoCop: 50000,
  cambioCop: 5000,
};

const transferencia: VentaTicketDTO = {
  ...base,
  metodoPago: 'TRANSFERENCIA',
  montoRecibidoCop: undefined,
  cambioCop: undefined,
  referenciaTransferencia: 'NEQUI-847291',
};

describe('QA SP3-05 - Criterios complementarios', () => {
  it('RN-VTA-10: la leyenda legal coincide EXACTAMENTE con el texto del DoD', () => {
    render(<TicketVentaPOS ticket={base} />);
    expect(screen.getByText(LEYENDA_RN_VTA_10)).toBeInTheDocument();
  });

  it('muestra "Consumidor Final" cuando no hay cliente', () => {
    render(<TicketVentaPOS ticket={base} />);
    expect(screen.getByText('Consumidor Final')).toBeInTheDocument();
  });

  it('ticket TRANSFERENCIA: muestra referencia y omite recibido/cambio', () => {
    render(<TicketVentaPOS ticket={transferencia} />);
    expect(screen.getByText('Ref. Bancaria:')).toBeInTheDocument();
    expect(screen.getByText('NEQUI-847291')).toBeInTheDocument();
    expect(screen.queryByText('Recibido:')).not.toBeInTheDocument();
    expect(screen.queryByText('Cambio / Vueltos:')).not.toBeInTheDocument();
  });

  it('ticket EFECTIVO: muestra recibido y cambio, sin referencia bancaria', () => {
    render(<TicketVentaPOS ticket={base} />);
    expect(screen.getByText('Recibido:')).toBeInTheDocument();
    expect(screen.getByText('Cambio / Vueltos:')).toBeInTheDocument();
    expect(screen.queryByText('Ref. Bancaria:')).not.toBeInTheDocument();
  });

  it('RN-GEN-04: total en COP sin decimales ($45.000 COP)', () => {
    render(<TicketVentaPOS ticket={base} />);
    expect(screen.getByText('$45.000 COP')).toBeInTheDocument();
  });

  it('Telegram TRANSFERENCIA: omite recibido y cambio', () => {
    const msg = formatTelegramReceipt(transferencia);
    expect(msg).toContain('(Ref: `NEQUI-847291`)');
    expect(msg).not.toContain('Recibido:');
    expect(msg).not.toContain('Cambio:');
  });

  it('Telegram sin cliente: no imprime la línea de cliente', () => {
    const msg = formatTelegramReceipt(base);
    expect(msg).not.toContain('Cliente:');
  });
});
