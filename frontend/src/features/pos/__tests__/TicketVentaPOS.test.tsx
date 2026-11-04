import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketVentaPOS } from '../components/TicketVentaPOS';
import { formatTelegramReceipt } from '../utils/formatTelegramReceipt';
import { VentaTicketDTO } from '../types/ticket.types';

const mockTicketBase: VentaTicketDTO = {
  nombreTienda: 'Forma Store',
  nombreSede: 'Sede Medellín - Centro',
  direccionSede: 'Cra 43A # 1-50, Local 102',
  telefonoSede: '300 123 4567',
  consecutivo: 'MED-000042',
  fechaHora: '03/11/2026, 03:15 p.m.',
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
  ],
  subtotalCop: 120000,
  descuentoTotalCop: 10000,
  ivaDiscriminadoCop: 17563,
  totalNetoCop: 110000,
  metodoPago: 'EFECTIVO',
  montoRecibidoCop: 150000,
  cambioCop: 40000,
};

describe('SP3-05 - Plantilla de Comprobante de Venta POS y Recibo Digital', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CA-T2 y CA-T3: Función formatTelegramReceipt', () => {
    it('formatea correctamente el recibo con emojis, markdown y valores enteros en COP', () => {
      const mensaje = formatTelegramReceipt(mockTicketBase);

      expect(mensaje).toContain('🧾 *Forma Store*');
      expect(mensaje).toContain('📍 Sede Medellín - Centro');
      expect(mensaje).toContain('🎫 Comprobante: `MED-000042`');
      expect(mensaje).toContain('📅 03/11/2026, 03:15 p.m.');
      expect(mensaje).toContain('👤 Cajero: Carlos Vendedor');
      expect(mensaje).toContain('👤 Cliente: Juan Pérez');
      expect(mensaje).toContain('▪ 2x Camiseta Oversize (M/Negro)');
      expect(mensaje).toContain('SKU: `ROPA-CAM-NEG-M` - $110.000');
      expect(mensaje).toContain('Subtotal: $120.000');
      expect(mensaje).toContain('Descuento: -$10.000');
      expect(mensaje).toContain('*TOTAL: $110.000 COP*');
      expect(mensaje).toContain('Método de Pago: EFECTIVO');
      expect(mensaje).toContain('Recibido: $150.000');
      expect(mensaje).toContain('Cambio: $40.000');
      expect(mensaje).toContain('_Garantía de 30 días en tiendas físicas._');
    });

    it('formatea correctamente pago por TRANSFERENCIA con código de referencia', () => {
      const ticketTransferencia: VentaTicketDTO = {
        ...mockTicketBase,
        metodoPago: 'TRANSFERENCIA',
        montoRecibidoCop: undefined,
        cambioCop: undefined,
        referenciaTransferencia: 'NEQUI-847291',
      };

      const mensaje = formatTelegramReceipt(ticketTransferencia);

      expect(mensaje).toContain('Método de Pago: TRANSFERENCIA (Ref: `NEQUI-847291`)');
      expect(mensaje).not.toContain('Recibido:');
    });

    it('no incluye decimales en los precios formateados ($ sin centavos, RN-GEN-04)', () => {
      const mensaje = formatTelegramReceipt(mockTicketBase);
      expect(mensaje).not.toMatch(/\$\d+\.\d{2}\b/);
      expect(mensaje).not.toMatch(/\$\d+,\d{2}\b/);
    });
  });

  describe('CA-T1: Componente React TicketVentaPOS (80 mm e Impresión)', () => {
    it('renderiza encabezado, metadatos y desglose de prendas correctamente', () => {
      render(<TicketVentaPOS ticket={mockTicketBase} />);

      expect(screen.getByText('Forma Store')).toBeInTheDocument();
      expect(screen.getByText('Sede Medellín - Centro')).toBeInTheDocument();
      expect(screen.getByText('Cra 43A # 1-50, Local 102')).toBeInTheDocument();
      expect(screen.getByText('Tel: 300 123 4567')).toBeInTheDocument();
      expect(screen.getByText('MED-000042')).toBeInTheDocument();
      expect(screen.getByText('Carlos Vendedor')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('Camiseta Oversize')).toBeInTheDocument();
      expect(screen.getByText(/Talla: M \| Color: Negro/i)).toBeInTheDocument();
      expect(screen.getByText('SKU: ROPA-CAM-NEG-M')).toBeInTheDocument();
    });

    it('renderiza el bloque de totales con IVA discriminado y leyenda legal RN-VTA-10', () => {
      render(<TicketVentaPOS ticket={mockTicketBase} />);

      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      expect(screen.getByText('$120.000')).toBeInTheDocument();
      expect(screen.getByText('Descuento:')).toBeInTheDocument();
      expect(screen.getByText('-$10.000')).toBeInTheDocument();
      expect(screen.getByText('IVA discriminado (19% inc.):')).toBeInTheDocument();
      expect(screen.getByText('$17.563')).toBeInTheDocument();
      expect(screen.getByText('$110.000 COP')).toBeInTheDocument();
      expect(screen.getByText('EFECTIVO')).toBeInTheDocument();
      expect(screen.getByText('$150.000')).toBeInTheDocument();
      expect(screen.getByText('$40.000')).toBeInTheDocument();

      expect(
        screen.getByText(
          /Comprobante interno de venta sin valor tributario DIAN \(MVP v2\.1\)\./i
        )
      ).toBeInTheDocument();
    });

    it('ejecuta window.print o callback onPrint al presionar el botón de imprimir', () => {
      const mockPrintFn = vi.fn();
      render(<TicketVentaPOS ticket={mockTicketBase} onPrint={mockPrintFn} />);

      const printButton = screen.getByRole('button', { name: /Imprimir Comprobante/i });
      fireEvent.click(printButton);

      expect(mockPrintFn).toHaveBeenCalledTimes(1);
    });

    it('utiliza el ancho estándar de 80 mm y oculta la barra de acciones en print', () => {
      const { container } = render(<TicketVentaPOS ticket={mockTicketBase} />);

      const ticketElement = container.querySelector('#ticket-termico-pos');
      expect(ticketElement).toHaveClass('w-[80mm]');
      expect(ticketElement).toHaveClass('font-mono');

      const actionHeader = container.querySelector('.print\\:hidden');
      expect(actionHeader).toBeInTheDocument();
    });
  });
});
