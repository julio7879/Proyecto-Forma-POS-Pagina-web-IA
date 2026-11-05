import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecepcionTrasladoModal } from '../components/RecepcionTrasladoModal';
import { TrasladoEnTransitoDTO } from '../types/traslados.types';

const mockTraslado: TrasladoEnTransitoDTO = {
  numeroGuia: 'TRS-2026-000012',
  sedeOrigen: 'Bodega Central',
  sedeDestino: 'Sede Medellín - Centro',
  lineas: [
    {
      sku: 'CAM-OVR-NEG-M',
      productoNombre: 'Camiseta Oversize',
      talla: 'M',
      color: 'Negro',
      cantidadEnviada: 10,
    },
  ],
};

describe('SP2-08 - RecepcionTrasladoModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renderiza los datos del traslado e inicializa recibidaBuena con cantidadEnviada', () => {
    render(
      <RecepcionTrasladoModal
        isOpen={true}
        onClose={mockOnClose}
        traslado={mockTraslado}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('Recepción de Mercancía en Tienda')).toBeInTheDocument();
    expect(screen.getByText(/TRS-2026-000012/i)).toBeInTheDocument();
    expect(screen.getByText('Camiseta Oversize')).toBeInTheDocument();
    expect(screen.getByText('Enviadas: 10')).toBeInTheDocument();

    const inputBuena = screen.getByLabelText(/Recibida Buena:/i);
    expect(inputBuena).toHaveValue(10);
  });

  it('2. Calcula dinámicamente los faltantes al modificar unidades recibidas', () => {
    render(
      <RecepcionTrasladoModal
        isOpen={true}
        onClose={mockOnClose}
        traslado={mockTraslado}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const inputBuena = screen.getByLabelText(/Recibida Buena:/i);
    // Cambiamos buenas a 7 (faltante = 10 - 7 = 3)
    fireEvent.change(inputBuena, { target: { value: '7' } });

    expect(screen.getByText('3')).toBeInTheDocument();

    // Añadimos 2 dañadas (buenas 7 + dañadas 2 = 9, faltante = 1)
    const inputDanada = screen.getByLabelText(/Recibida Dañada:/i);
    fireEvent.change(inputDanada, { target: { value: '2' } });

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('3. Muestra error CA-07 y bloquea el botón cuando recibidaBuena + recibidaDanada > cantidadEnviada', () => {
    render(
      <RecepcionTrasladoModal
        isOpen={true}
        onClose={mockOnClose}
        traslado={mockTraslado}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const inputBuena = screen.getByLabelText(/Recibida Buena:/i);
    // Ingresamos 12 cuando enviadas fueron 10
    fireEvent.change(inputBuena, { target: { value: '12' } });

    expect(
      screen.getByText(/Las unidades buenas y dañadas no pueden superar las unidades enviadas/i)
    ).toBeInTheDocument();

    const btnSubmit = screen.getByRole('button', { name: /Confirmar Recepción/i });
    expect(btnSubmit).toBeDisabled();
  });

  it('4. Muestra badge de Recepción Conforme y cambia a Acta de Novedad si hay diferencias (CA-57, CA-58)', () => {
    render(
      <RecepcionTrasladoModal
        isOpen={true}
        onClose={mockOnClose}
        traslado={mockTraslado}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Inicialmente todo es conforme
    expect(screen.getByText(/Recepción Conforme \(RECIBIDO\)/i)).toBeInTheDocument();

    // Añadimos 1 prenda dañada
    const inputDanada = screen.getByLabelText(/Recibida Dañada:/i);
    fireEvent.change(inputDanada, { target: { value: '1' } });

    expect(
      screen.getByText(/Se generará Acta de Novedad \(RECIBIDO_CON_NOVEDAD\)/i)
    ).toBeInTheDocument();
  });

  it('5. Dispara onSubmit con el payload correcto y las observaciones ingresadas', async () => {
    render(
      <RecepcionTrasladoModal
        isOpen={true}
        onClose={mockOnClose}
        traslado={mockTraslado}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Conforme: 10 buenas, 0 dañadas, 0 sobrantes
    const inputObservaciones = screen.getByPlaceholderText(/Se reciben prendas sin bolsa/i);
    fireEvent.change(inputObservaciones, { target: { value: 'Caja recibida sellada.' } });

    const btnSubmit = screen.getByRole('button', { name: /Confirmar Recepción/i });
    fireEvent.click(btnSubmit);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      numeroGuia: 'TRS-2026-000012',
      estadoFinal: 'RECIBIDO',
      lineas: [
        {
          sku: 'CAM-OVR-NEG-M',
          recibidaBuena: 10,
          recibidaDanada: 0,
          excedenteReportado: 0,
          faltante: 0,
        },
      ],
      observaciones: 'Caja recibida sellada.',
    });
  });
});