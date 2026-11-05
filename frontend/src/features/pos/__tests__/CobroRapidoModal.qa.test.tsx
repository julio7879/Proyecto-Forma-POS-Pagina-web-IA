/**
 * Pruebas QA (Issue #83 / PR #75, SP3-09) — Matriz TC-01 a TC-11 + casos borde.
 * Las pruebas [HALLAZGO] verifican el comportamiento ACTUAL defectuoso (ver docs/qa/SP3-09/README.md).
 */
import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CobroRapidoModal } from '../components/CobroRapidoModal';
import { TecladoNumericoPOS } from '../components/TecladoNumericoPOS';

type Props = Partial<ComponentProps<typeof CobroRapidoModal>>;

const onClose = vi.fn();
const onConfirmar = vi.fn(async () => {});

const abrir = (p: Props = {}) =>
  render(
    <CobroRapidoModal
      isOpen
      onClose={onClose}
      totalVentaCop={75000}
      onConfirmarCobro={onConfirmar}
      isSubmitting={false}
      {...p}
    />,
  );

const montoRecibido = () => screen.getByText('Monto Recibido:').nextElementSibling!.textContent;
const tecla = (t: string) =>
  fireEvent.click(
    screen.getByRole('button', { name: t === 'C' ? 'Limpiar monto' : t === '⌫' ? 'Retroceso' : `Dígito ${t}` }),
  );
const btnConfirmar = () => screen.getByRole('button', { name: /Confirmar Cobro/i });

/** Teclado aislado con estado controlado por el test */
function teclado(valorInicial: number) {
  let valor = valorInicial;
  const onValorChange = vi.fn((v: number) => {
    valor = v;
    utils.rerender(<TecladoNumericoPOS valorActual={valor} onValorChange={onValorChange} />);
  });
  const utils = render(<TecladoNumericoPOS valorActual={valor} onValorChange={onValorChange} />);
  return { valor: () => valor, onValorChange, unmount: utils.unmount };
}

describe('QA SP3-09 · Bloque A — Teclado y dinero entero (RN-GEN-04, CA-53)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-01. Total, billetes, cambio y falta se muestran sin decimales', () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: '$100.000' }));
    const textoModal = screen.getByRole('dialog').textContent!;
    expect(textoModal).toContain('$75.000 COP');
    expect(textoModal).not.toMatch(/\d,\d{2}\b/); // sin centavos estilo es-CO
  });

  it('TC-02. Dígitos concatenan; "00" sobre 0 no hace nada; "00" sobre 5 → 500; "0" sobre 0 sigue en 0', () => {
    const t = teclado(0);
    tecla('00');
    expect(t.onValorChange).not.toHaveBeenCalled();
    tecla('0');
    expect(t.valor()).toBe(0);
    tecla('5');
    tecla('00');
    expect(t.valor()).toBe(500);
    tecla('7');
    expect(t.valor()).toBe(5007);
  });

  it('TC-03. "C" limpia a 0; "⌫" quita el último dígito con división entera; "⌫" sobre 0 queda en 0', () => {
    const t = teclado(1234);
    tecla('⌫');
    expect(t.valor()).toBe(123);
    tecla('C');
    expect(t.valor()).toBe(0);
    tecla('⌫');
    expect(t.valor()).toBe(0);
  });

  it('TC-04. Tope anti-overflow $999.999.999: el dígito o "00" que lo supera se ignora sin romper', () => {
    const t = teclado(99_999_999);
    tecla('9');
    expect(t.valor()).toBe(999_999_999);
    tecla('9');
    expect(t.valor()).toBe(999_999_999);
    t.unmount();
    const t2 = teclado(10_000_000);
    tecla('00'); // 1.000.000.000 > tope
    expect(t2.valor()).toBe(10_000_000);
  });
});

describe('QA SP3-09 · Bloque B — Cambio y medios de pago (CA-51, CA-52)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-05. Billetes ASIGNAN (no suman): $50.000 y luego $20.000 → $20.000; Exacto → total', () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: '$50.000' }));
    fireEvent.click(screen.getByRole('button', { name: '$20.000' }));
    expect(montoRecibido()).toBe('$20.000');
    fireEvent.click(screen.getByRole('button', { name: '$10.000' }));
    expect(montoRecibido()).toBe('$10.000');
    fireEvent.click(screen.getByRole('button', { name: 'Exacto' }));
    expect(montoRecibido()).toBe('$75.000');
  });

  it('TC-06. Venta $75.000 con $100.000 → "Cambio a entregar" $25.000 en caja esmeralda; payload correcto', async () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: '$100.000' }));
    const caja = screen.getByText('Cambio a entregar').closest('div')!.parentElement!;
    expect(caja.className).toMatch(/emerald/);
    expect(caja.textContent).toContain('$25.000');
    fireEvent.click(btnConfirmar());
    expect(onConfirmar).toHaveBeenCalledWith({
      metodoPago: 'EFECTIVO',
      montoRecibidoCop: 100000,
      cambioCop: 25000,
      referenciaTransferencia: undefined,
    });
  });

  it('TC-07. Venta $75.000 con $50.000 → "Falta" $25.000 en rosa, botón deshabilitado y Enter no confirma', () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: '$50.000' }));
    const caja = screen.getByText('Falta').closest('div')!.parentElement!;
    expect(caja.className).toMatch(/rose/);
    expect(caja.textContent).toContain('$25.000');
    expect(btnConfirmar()).toBeDisabled();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it('TC-08. TRANSFERENCIA: deshabilitado con referencia vacía o solo espacios; con referencia → payload con cambio 0 y monto = total', () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: /TRANSFERENCIA/ }));
    const ref = screen.getByLabelText(/Referencia bancaria/i);
    expect(btnConfirmar()).toBeDisabled();
    fireEvent.change(ref, { target: { value: '   ' } });
    expect(btnConfirmar()).toBeDisabled();
    fireEvent.change(ref, { target: { value: ' NEQUI-847291 ' } });
    expect(btnConfirmar()).toBeEnabled();
    fireEvent.click(btnConfirmar());
    expect(onConfirmar).toHaveBeenCalledWith({
      metodoPago: 'TRANSFERENCIA',
      montoRecibidoCop: 75000,
      cambioCop: 0,
      referenciaTransferencia: 'NEQUI-847291',
    });
  });

  it('Borde. Total $0 nunca permite confirmar (aunque el efectivo "alcance")', () => {
    abrir({ totalVentaCop: 0 });
    expect(btnConfirmar()).toBeDisabled();
  });
});

describe('QA SP3-09 · Bloque C — Atajos y ergonomía', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-09. Escape cierra; con isSubmitting=true NO cierra', () => {
    const { unmount } = abrir();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    onClose.mockClear();
    abrir({ isSubmitting: true });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('TC-10. Enter confirma solo si puedeConfirmar; con isSubmitting=true no confirma', () => {
    const { unmount } = abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Exacto' }));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    unmount();
    onConfirmar.mockClear();
    abrir({ isSubmitting: true });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it('TC-11. Teclas del teclado, billetes, métodos de pago y Confirmar tienen altura táctil ≥ 48 px (min-h)', () => {
    abrir();
    const alturas = (b: HTMLElement) => Number(/min-h-\[(\d+)px\]/.exec(b.className)?.[1] ?? 0);
    for (const nombre of ['Dígito 1', 'Dígito 00', 'Limpiar monto', 'Retroceso', '$100.000', 'Exacto', 'EFECTIVO', 'TRANSFERENCIA']) {
      expect(alturas(screen.getByRole('button', { name: nombre })), nombre).toBeGreaterThanOrEqual(48);
    }
    expect(alturas(btnConfirmar())).toBeGreaterThanOrEqual(48);
  });

  it('[HALLAZGO] TC-11b. "Cancelar" y la "X" de cerrar NO tienen altura táctil mínima (sin min-h)', () => {
    abrir();
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).not.toMatch(/min-h-/);
    expect(screen.getByRole('button', { name: 'Cerrar modal' }).className).not.toMatch(/min-h-/);
  });

  it('[HALLAZGO] H-1. Hooks condicionales: abrir el modal (isOpen false → true) en la MISMA instancia rompe React', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const props = { onClose, totalVentaCop: 75000, onConfirmarCobro: onConfirmar, isSubmitting: false };
    const { rerender } = render(<CobroRapidoModal isOpen={false} {...props} />);
    // El useEffect de atajos está DESPUÉS de `if (!isOpen) return null`: cambia el número de hooks entre renders.
    expect(() => rerender(<CobroRapidoModal isOpen {...props} />)).toThrow(/more hooks|Rendered more hooks/i);
    spy.mockRestore();
  });

  it('[HALLAZGO] H-2. Doble Enter rápido mientras el padre aún no marca isSubmitting → onConfirmarCobro se llama 2 veces (doble cobro)', () => {
    const lento = vi.fn(() => new Promise<void>(() => {})); // la venta "sigue procesando"
    abrir({ onConfirmarCobro: lento });
    fireEvent.click(screen.getByRole('button', { name: 'Exacto' }));
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter' });
    // Comportamiento ACTUAL: 2 llamadas. Esperado: 1 (bloqueo local tipo `enviando` independiente del padre).
    expect(lento).toHaveBeenCalledTimes(2);
  });
});
