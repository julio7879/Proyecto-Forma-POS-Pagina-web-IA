import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPromocionesPage } from '../pages/AdminPromocionesPage';
import { calcularPrecioConOferta } from '../../storefront/services/promocionesStore';

describe('AdminPromocionesPage & Motor de Ofertas', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza la cabecera ejecutiva, KPIs y las promociones semilla iniciales', () => {
    render(<AdminPromocionesPage />);

    expect(screen.getByRole('heading', { name: /Promociones y Ofertas de Temporada/i })).toBeInTheDocument();
    expect(screen.getByText(/Campañas Activas/i)).toBeInTheDocument();
    expect(screen.getByText(/Rebajas de Temporada 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Especial Sastrería Vinotinto/i)).toBeInTheDocument();
  });

  it('permite alternar el estado (Pausar / Activar) de una promoción', async () => {
    render(<AdminPromocionesPage />);

    // Buscar botón de estado 'Activa'
    const botonesActiva = screen.getAllByRole('button', { name: /Activa/i });
    expect(botonesActiva.length).toBeGreaterThan(0);

    // Pausar la primera
    fireEvent.click(botonesActiva[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pausada/i })).toBeInTheDocument();
    });
  });

  it('permite abrir el modal y registrar una nueva promoción comercial', async () => {
    render(<AdminPromocionesPage />);

    const botonNueva = screen.getByRole('button', { name: /Nueva Promoción/i });
    fireEvent.click(botonNueva);

    expect(screen.getByText(/Nueva Promoción de Temporada/i)).toBeInTheDocument();

    const inputNombre = screen.getByPlaceholderText(/Ej: Rebajas de Mitad de Temporada/i);
    fireEvent.change(inputNombre, { target: { value: 'Cyber Days FORMA 2026' } });

    const inputValor = screen.getByPlaceholderText(/Ej: 20/i);
    fireEvent.change(inputValor, { target: { value: '25' } });

    const botonGuardar = screen.getByRole('button', { name: /Guardar y Activar Promoción/i });
    fireEvent.click(botonGuardar);

    await waitFor(() => {
      expect(screen.getByText('Cyber Days FORMA 2026')).toBeInTheDocument();
    });
  });

  it('calcula con precisión matemática entera en COP los descuentos (RN-GEN-04)', () => {
    // 20% sobre $100.000 COP -> $80.000 COP
    const calculo = calcularPrecioConOferta(100000, 'TEST-SKU', 'Ropa');
    expect(calculo.tieneOferta).toBe(true);
    expect(calculo.precioFinalCop).toBe(80000);
    expect(calculo.ahorroCop).toBe(20000);
  });
});
