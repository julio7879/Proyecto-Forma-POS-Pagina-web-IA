import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecepcionTrasladoModal } from '../components/RecepcionTrasladoModal';
import { TrasladoEnTransitoDTO } from '../types/traslados.types';

const mockTraslado: TrasladoEnTransitoDTO = {
  id: 12,
  numeroGuia: 'TRS-2026-000012',
  version: 1,
  sedeOrigen: 'Bodega Central',
  sedeDestino: 'Sede Medellín - Centro',
  lineas: [
    {
      id: 101,
      varianteId: 501,
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

  it('5. Dispara onSubmit con el payload DTO compatible con Zod y backend (MOD-06)', async () => {
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
    const inputObservacion = screen.getByPlaceholderText(/detalles adicionales/i);
    fireEvent.change(inputObservacion, { target: { value: 'Caja recibida sellada.' } });

    const btnSubmit = screen.getByRole('button', { name: /Confirmar Recepción/i });
    fireEvent.click(btnSubmit);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      trasladoId: 12,
      version: 1,
      lineas: [
        {
          lineaId: 101,
          cantidadRecibidaBuena: 10,
          cantidadRecibidaDanada: 0,
          excedenteReportado: 0,
        },
      ],
      observacion: 'Caja recibida sellada.',
    });
  });

  it('6. Bloquea la confirmación si hay novedades y la observación tiene menos de 3 caracteres (RN-TRA-09)', async () => {
    render(
      <RecepcionTrasladoModal
        isOpen={true}
        onClose={mockOnClose}
        traslado={mockTraslado}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Generamos novedad reportando 1 prenda dañada (buenas = 9, dañadas = 1)
    const inputBuena = screen.getByLabelText(/Recibida Buena:/i);
    fireEvent.change(inputBuena, { target: { value: '9' } });
    const inputDanada = screen.getByLabelText(/Recibida Dañada:/i);
    fireEvent.change(inputDanada, { target: { value: '1' } });

    // Botón debe estar deshabilitado porque la observación está vacía (RN-TRA-09)
    const btnSubmit = screen.getByRole('button', { name: /Confirmar Recepción/i });
    expect(btnSubmit).toBeDisabled();
    expect(
      screen.getByText(/La observación es obligatoria ante novedades para generar el acta/i)
    ).toBeInTheDocument();

    // Ingresamos solo 2 caracteres -> sigue deshabilitado
    const inputObservacion = screen.getByPlaceholderText(/Describe detalladamente el motivo/i);
    fireEvent.change(inputObservacion, { target: { value: 'ok' } });
    expect(btnSubmit).toBeDisabled();

    // Ingresamos observación válida (>= 3 caracteres) -> se habilita
    fireEvent.change(inputObservacion, { target: { value: 'Prenda con costura rota' } });
    expect(btnSubmit).toBeEnabled();

    fireEvent.click(btnSubmit);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      trasladoId: 12,
      version: 1,
      lineas: [
        {
          lineaId: 101,
          cantidadRecibidaBuena: 9,
          cantidadRecibidaDanada: 1,
          excedenteReportado: 0,
        },
      ],
      observacion: 'Prenda con costura rota',
    });
  });
});
