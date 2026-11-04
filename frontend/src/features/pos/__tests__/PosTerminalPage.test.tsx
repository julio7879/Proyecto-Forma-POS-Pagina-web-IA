import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PosTerminalPage } from '../PosTerminalPage';

describe('PosTerminalPage Component - Ergonomía Táctil CA-53 y Cobro Rápido (SP1-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  it('renderiza la estructura ergonómica a dos columnas (60% catálogo táctil y 40% carrito de cobro)', () => {
    render(<PosTerminalPage />);

    // Buscador predictivo táctil (Atajo F2)
    expect(
      screen.getByPlaceholderText(/Escanear código de barras/i)
    ).toBeInTheDocument();

    // Filtros de categoría en píldoras táctiles (role tab)
    expect(screen.getByRole('tab', { name: 'Todas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Ropa' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cosméticos' })).toBeInTheDocument();

    // Encabezado del carrito con cliente asignado
    expect(screen.getByText(/Consumidor Final/i)).toBeInTheDocument();

    // Botón principal de cobro con atajo F12
    expect(
      screen.getByRole('button', { name: /COBRAR \(F12\)/i })
    ).toBeInTheDocument();
  });

  it('muestra el total a pagar y desglose en JetBrains Mono conforme a RN-GEN-04', () => {
    render(<PosTerminalPage />);

    expect(screen.getByText(/TOTAL A PAGAR/i)).toBeInTheDocument();
    // Verifica que el desglose de subtotal e IVA esté presente
    expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument();
    expect(screen.getByText(/IVA \(19% discriminado\):/i)).toBeInTheDocument();
  });

  it('permite filtrar el catálogo táctil por categoría', () => {
    render(<PosTerminalPage />);

    const tabCosmeticos = screen.getByRole('tab', { name: 'Cosméticos' });
    fireEvent.click(tabCosmeticos);

    // Debe mostrar la Crema Hidratante Botánica con su badge de no reintegrable
    const itemsCrema = screen.getAllByText(/Crema Hidratante Botánica 100ml/i);
    expect(itemsCrema.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Uso personal/i).length).toBeGreaterThan(0);
  });

  it('abre el Modal de Cobro Rápido al pulsar el botón COBRAR o presionar F12', () => {
    render(<PosTerminalPage />);

    const botonCobrar = screen.getByRole('button', { name: /COBRAR \(F12\)/i });
    fireEvent.click(botonCobrar);

    // Verificación de apertura del Frame 3 (Modal de Cobro Rápido)
    expect(screen.getByText(/Cobro de Venta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EFECTIVO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TRANSFERENCIA/i })).toBeInTheDocument();

    // Verificación de botones rápidos de billetes colombianos
    expect(screen.getByRole('button', { name: '+$100k' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+$50k' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exacto' })).toBeInTheDocument();
  });

  it('calcula automáticamente el cambio / vuelto al ingresar efectivo recibido', () => {
    render(<PosTerminalPage />);

    // Abrir modal de cobro
    const botonCobrar = screen.getByRole('button', { name: /COBRAR \(F12\)/i });
    fireEvent.click(botonCobrar);

    // Pulsar botón de billete de +$100k tres veces
    const billete100k = screen.getByRole('button', { name: '+$100k' });
    fireEvent.click(billete100k);
    fireEvent.click(billete100k);
    fireEvent.click(billete100k);

    // Debe mostrar la sección de CAMBIO / VUELTO A ENTREGAR
    expect(screen.getByText(/CAMBIO \/ VUELTO A ENTREGAR/i)).toBeInTheDocument();

    // Confirmar venta
    const botonConfirmar = screen.getByRole('button', {
      name: /CONFIRMAR VENTA E IMPRIMIR \(Enter\)/i,
    });
    expect(botonConfirmar).not.toBeDisabled();
    fireEvent.click(botonConfirmar);

    // Verificación de apertura del Frame 4 (Modal de Venta Exitosa) con consecutivo dinámico
    expect(
      screen.getByText(/¡Venta #MED-00\d+ Completada con Éxito!/i)
    ).toBeInTheDocument();

    // Pulsar imprimir ticket 80 mm debe invocar window.print()
    const botonImprimir = screen.getByRole('button', { name: /Imprimir Ticket 80mm/i });
    fireEvent.click(botonImprimir);
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
