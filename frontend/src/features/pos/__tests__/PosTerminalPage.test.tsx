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

  it('abre el modal de recibo digital por Telegram y permite despachar por Chat ID o abrir deep link bot', async () => {
    render(<PosTerminalPage />);

    // Abrir modal de cobro y confirmar venta
    fireEvent.click(screen.getByRole('button', { name: /COBRAR \(F12\)/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Exacto' }));
    fireEvent.click(screen.getByRole('button', { name: /CONFIRMAR VENTA E IMPRIMIR \(Enter\)/i }));

    // Pulsar "Enviar Recibo por Telegram"
    const botonTelegram = screen.getByRole('button', { name: /Enviar Recibo por Telegram/i });
    fireEvent.click(botonTelegram);

    // Debe abrir el modal dialog elegante
    const modalTelegram = screen.getByRole('dialog');
    expect(modalTelegram).toBeInTheDocument();
    expect(screen.getByText(/Envío de Recibo Digital por Telegram/i)).toBeInTheDocument();

    // Opción A: Bot y Deep link
    expect(screen.getByText(/Opción A — Código QR y Deep Link con Bot de Telegram/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir en Telegram Web \/ App/i })).toBeInTheDocument();

    // Opción B: Despacho directo por Chat ID o Username
    expect(screen.getByText(/Opción B — Envío Directo por Chat ID o Username/i)).toBeInTheDocument();
    const inputChat = screen.getByPlaceholderText(/@usuario_telegram o Chat ID.../i);
    fireEvent.change(inputChat, { target: { value: '@cliente_vip' } });

    const botonDespachar = screen.getByRole('button', { name: /Despachar al Chat/i });
    expect(botonDespachar).not.toBeDisabled();
    fireEvent.click(botonDespachar);

    // Confirmación en verde
    expect(await screen.findByText(/Recibo despachado a Telegram con éxito/i)).toBeInTheDocument();

    // Vista previa colapsable
    const botonVistaPrevia = screen.getByRole('button', { name: /Vista previa del recibo \(Formato Telegram\)/i });
    fireEvent.click(botonVistaPrevia);
    expect(screen.getByText(/FORMA BOUTIQUE - RECIBO DIGITAL/i)).toBeInTheDocument();

    // Cerrar modal
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
