import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CobroRapidoModal } from '../components/CobroRapidoModal';

describe('SP3-09 - CobroRapidoModal y TecladoNumericoPOS', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirmarCobro = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renderiza el total a cobrar de forma prominente en COP entero (RN-GEN-04)', () => {
    render(
      <CobroRapidoModal
        isOpen={true}
        onClose={mockOnClose}
        totalVentaCop={85000}
        onConfirmarCobro={mockOnConfirmarCobro}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('TOTAL A COBRAR')).toBeInTheDocument();
    expect(screen.getByText('$85.000 COP')).toBeInTheDocument();
  });

  it('2. Los botones de billetes rápidos asignan el monto recibido y el botón "Exacto" asigna el total', () => {
    render(
      <CobroRapidoModal
        isOpen={true}
        onClose={mockOnClose}
        totalVentaCop={85000}
        onConfirmarCobro={mockOnConfirmarCobro}
        isSubmitting={false}
      />
    );

    // Clic en billete de $100.000
    const btn100k = screen.getByRole('button', { name: '$100.000' });
    fireEvent.click(btn100k);
    expect(screen.getAllByText('$100.000')).toHaveLength(2);

    // Clic en botón Exacto
    const btnExacto = screen.getByRole('button', { name: 'Exacto' });
    fireEvent.click(btnExacto);
    // Ahora el monto recibido debe ser exactamente $85.000
    expect(screen.getAllByText('$85.000').length).toBeGreaterThanOrEqual(1);
  });

  it('3. El teclado numérico permite ingresar dígitos, 00, retroceso ⌫ y limpiar C', () => {
    render(
      <CobroRapidoModal
        isOpen={true}
        onClose={mockOnClose}
        totalVentaCop={50000}
        onConfirmarCobro={mockOnConfirmarCobro}
        isSubmitting={false}
      />
    );

    // Digitar '5'
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 5' }));
    // Digitar '0'
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 0' }));
    // Digitar '00'
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 00' }));
    expect(screen.getByText('$5.000')).toBeInTheDocument();

    // Retroceso ⌫ (elimina el último dígito)
    fireEvent.click(screen.getByRole('button', { name: 'Retroceso' }));
    expect(screen.getByText('$500')).toBeInTheDocument();

    // Limpiar C
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar monto' }));
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('4. Calcula en tiempo real el cambio a entregar en verde esmeralda (CA-51)', () => {
    render(
      <CobroRapidoModal
        isOpen={true}
        onClose={mockOnClose}
        totalVentaCop={70000}
        onConfirmarCobro={mockOnConfirmarCobro}
        isSubmitting={false}
      />
    );

    // Pagamos con $100.000
    fireEvent.click(screen.getByRole('button', { name: '$100.000' }));

    expect(screen.getByText(/Cambio a entregar/i)).toBeInTheDocument();
    // Cambio = 100.000 - 70.000 = 30.000
    expect(screen.getByText('$30.000')).toBeInTheDocument();
  });

  it('5. Muestra alerta de "Falta" y desactiva el botón de cobro ante efectivo insuficiente (CA-52)', () => {
    render(
      <CobroRapidoModal
        isOpen={true}
        onClose={mockOnClose}
        totalVentaCop={70000}
        onConfirmarCobro={mockOnConfirmarCobro}
        isSubmitting={false}
      />
    );

    // Pagamos solo con $50.000 (faltan $20.000)
    fireEvent.click(screen.getByRole('button', { name: '$50.000' }));

    expect(screen.getByText(/Falta/i)).toBeInTheDocument();
    expect(screen.getAllByText('$20.000')).toHaveLength(2);

    // Botón Confirmar Cobro debe estar deshabilitado
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Cobro/i });
    expect(btnConfirmar).toBeDisabled();
  });

  it('6. Permite seleccionar TRANSFERENCIA e ingresar código de referencia bancaria', () => {
    render(
      <CobroRapidoModal
        isOpen={true}
        onClose={mockOnClose}
        totalVentaCop={50000}
        onConfirmarCobro={mockOnConfirmarCobro}
        isSubmitting={false}
      />
    );

    // Cambiar a TRANSFERENCIA
    fireEvent.click(screen.getByRole('button', { name: /TRANSFERENCIA/i }));

    const inputRef = screen.getByPlaceholderText(/Ej: NEQUI-847291/i);
    expect(inputRef).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Cobro/i });
    expect(btnConfirmar).toBeDisabled();

    // Escribir referencia
    fireEvent.change(inputRef, { target: { value: 'NEQUI-998811' } });
    expect(btnConfirmar).toBeEnabled();
  });

  it('7. Emite el payload completo al confirmar el cobro', async () => {
    render(
      <CobroRapidoModal
        isOpen={true}
        onClose={mockOnClose}
        totalVentaCop={50000}
        onConfirmarCobro={mockOnConfirmarCobro}
        isSubmitting={false}
      />
    );

    // Pago exacto
    fireEvent.click(screen.getByRole('button', { name: 'Exacto' }));

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Cobro/i });
    fireEvent.click(btnConfirmar);

    expect(mockOnConfirmarCobro).toHaveBeenCalledWith({
      metodoPago: 'EFECTIVO',
      montoRecibidoCop: 50000,
      cambioCop: 0,
      referenciaTransferencia: undefined,
    });
  });
});