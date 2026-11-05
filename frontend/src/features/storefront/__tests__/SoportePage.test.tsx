import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoportePage from '../pages/SoportePage';

const renderSoportePage = () => {
  return render(
    <BrowserRouter>
      <SoportePage />
    </BrowserRouter>
  );
};

describe('SoportePage - Centro de Soporte & Trazabilidad Logística', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza correctamente el encabezado editorial y el modo invitado por defecto', () => {
    renderSoportePage();

    expect(
      screen.getByRole('heading', { name: /Rastreo de Pedidos, Tarifas DANE & Garantía Legal/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Modo Consulta Libre \/ Invitado/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PED-2026-849201/i).length).toBeGreaterThanOrEqual(1);
  });

  it('detecta usuario autenticado en localStorage y personaliza pedidos multi-cuenta', async () => {
    const mockUsuario = {
      id: 42,
      rol: 'CLIENTE',
      nombreCompleto: 'Diana Carolina Hoyos',
      email: 'diana.hoyos@forma.co',
    };
    localStorage.setItem('usuario', JSON.stringify(mockUsuario));

    renderSoportePage();

    await waitFor(() => {
      expect(screen.getByText(/Cuenta: Diana Carolina Hoyos/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Tus Pedidos Registrados:/i)).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem('forma_pedidos_diana.hoyos@forma.co') || '[]').length
    ).toBeGreaterThan(0);
  });

  it('muestra el listado de productos con SKU, talla, color, precio COP y sede despachadora', () => {
    renderSoportePage();

    // El pedido por defecto PED-2026-849201 contiene 2 productos
    expect(screen.getByText(/Chaqueta Denim Artesanal/i)).toBeInTheDocument();
    expect(screen.getByText(/ROP-DNM-001-M/i)).toBeInTheDocument();
    expect(screen.getByText(/Bolso Cuero Graso Unisex/i)).toBeInTheDocument();
    expect(screen.getByText(/ACC-BOL-003-UNI/i)).toBeInTheDocument();

    // Sede despachadora
    expect(
      screen.getAllByText(/Punto Bucaramanga \(Hub Oriente DANE 68001\)/i).length
    ).toBeGreaterThanOrEqual(1);

    // Nivel de reserva en Kardex
    expect(
      screen.getAllByText(/RESERVA DURA \(PROTEGIDA\)/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('abre el Modal de Estado Detallado del Pedido al hacer clic en Ver Trazabilidad', async () => {
    renderSoportePage();

    const botonesTrazabilidad = screen.getAllByRole('button', { name: /Ver Trazabilidad/i });
    expect(botonesTrazabilidad.length).toBeGreaterThan(0);

    fireEvent.click(botonesTrazabilidad[0]);

    // Modal dialog
    const modalDialog = await screen.findByRole('dialog');
    expect(modalDialog).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Expediente de Estado Detallado del Pedido/i })
    ).toBeInTheDocument();

    // Verifica que se muestren los 7 estados dentro del modal
    expect(screen.getByText(/Paso 3 de 7/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /01.*RECIBIDO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /02.*CONFIRMADO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /03.*EN_PREPARACION/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /04.*LISTO_DESPACHO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /05.*DESPACHADO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /06.*EN_ENTREGA/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /07.*ENTREGADO/i })).toBeInTheDocument();

    // Botón para copiar guía
    expect(screen.getByRole('button', { name: /Copiar Guía/i })).toBeInTheDocument();

    // Cerrar el modal
    const botonCerrar = screen.getByRole('button', { name: /Cerrar Expediente/i });
    fireEvent.click(botonCerrar);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('permite interactuar con el simulador DANE y cambiar de municipio', () => {
    renderSoportePage();

    // Selecciona Ocaña (54498)
    const botonOcana = screen.getByRole('button', { name: /Ocaña.*54498/i });
    fireEvent.click(botonOcana);

    expect(screen.getByText(/Destino: Ocaña/i)).toBeInTheDocument();
    expect(screen.getByText(/\$9\.500 COP/i)).toBeInTheDocument();
    expect(screen.getByText(/Punto Ocaña \(54498\)/i)).toBeInTheDocument();
  });

  it('permite abrir y cerrar preguntas frecuentes en el acordeón', () => {
    renderSoportePage();

    const faqButton = screen.getByRole('button', {
      name: /¿Por qué FORMA nunca envía mi pedido fraccionado en varios paquetes\?/i,
    });
    expect(faqButton).toBeInTheDocument();

    // Por defecto la primera está abierta
    expect(
      screen.getByText(/Por nuestra regla de integridad logística \(CA-35 y CA-36\)/i)
    ).toBeInTheDocument();

    // Cerrar acordeón haciendo clic
    fireEvent.click(faqButton);
    expect(
      screen.queryByText(/Por nuestra regla de integridad logística \(CA-35 y CA-36\)/i)
    ).not.toBeInTheDocument();
  });
});
