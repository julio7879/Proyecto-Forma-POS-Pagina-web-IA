/**
 * Pruebas QA complementarias (Issue #33 / PR #30).
 * La suite original no verifica F2, Escape, el valor exacto del cambio
 * ni el badge de cosméticos. Algunas pruebas DOCUMENTAN el comportamiento
 * actual que QA reporta como hallazgo (ver docs/qa/SP1-06/README.md).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PosTerminalPage } from '../PosTerminalPage';

// Carrito inicial del prototipo: Chaqueta $189.000 + Crema $45.000 = $234.000
const cajaCambio = () =>
  screen.getByText('CAMBIO / VUELTO A ENTREGAR').parentElement as HTMLElement;

const abrirCobroConF12 = () => fireEvent.keyDown(window, { key: 'F12' });

describe('QA SP1-06 - Terminal POS Mostrador (criterios complementarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  it('F2 enfoca el buscador de productos/SKU', () => {
    render(<PosTerminalPage />);
    const buscador = screen.getByPlaceholderText(/Escanear código de barras, SKU/i);
    fireEvent.keyDown(window, { key: 'F2' });
    expect(document.activeElement).toBe(buscador);
  });

  it('F12 abre el modal de cobro y Escape lo cierra', () => {
    render(<PosTerminalPage />);
    abrirCobroConF12();
    expect(screen.getByText(/Cobro de Venta Mostrador/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/Cobro de Venta Mostrador/i)).not.toBeInTheDocument();
  });

  it('RN-CAT-04: cosméticos muestran "Uso personal" en catálogo y "[Sin cambio]" en el carrito', () => {
    render(<PosTerminalPage />);
    expect(screen.getAllByText('Uso personal').length).toBeGreaterThan(0);
    expect(screen.getByText('[Sin cambio]')).toBeInTheDocument();
  });

  it('cambio exacto: borrar + 3 × $100k sobre $234.000 = $66.000', () => {
    render(<PosTerminalPage />);
    abrirCobroConF12();
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR' }));
    const billete100k = screen.getByRole('button', { name: '+$100k' });
    fireEvent.click(billete100k);
    fireEvent.click(billete100k);
    fireEvent.click(billete100k);
    expect(cajaCambio().textContent).toMatch(/66\.000/);
  });

  it('botón Exacto deja el cambio en $0', () => {
    render(<PosTerminalPage />);
    abrirCobroConF12();
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exacto' }));
    expect(cajaCambio().textContent).toMatch(/\$\s?0(?!\d)/);
  });

  it('[HALLAZGO] el monto recibido viene prellenado con el total: +$100k da cambio $100.000, no el vuelto de un billete', () => {
    render(<PosTerminalPage />);
    abrirCobroConF12();
    fireEvent.click(screen.getByRole('button', { name: '+$100k' }));
    // Comportamiento actual: recibido = 234.000 + 100.000 → cambio 100.000
    expect(cajaCambio().textContent).toMatch(/100\.000/);
  });

  it('[HALLAZGO] cerrar el modal de éxito con Escape no limpia el carrito (no inicia nueva venta)', () => {
    render(<PosTerminalPage />);
    abrirCobroConF12();
    fireEvent.click(screen.getByRole('button', { name: /CONFIRMAR VENTA E IMPRIMIR/i }));
    expect(screen.getByText(/Completada con Éxito/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/Completada con Éxito/i)).not.toBeInTheDocument();
    // Comportamiento actual: el carrito sigue con los productos de la venta ya cobrada
    expect(screen.getByText('[Sin cambio]')).toBeInTheDocument();
  });
});
