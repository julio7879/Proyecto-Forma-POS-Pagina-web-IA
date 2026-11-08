import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoportePage from '../pages/SoportePage';

const renderSoportePage = () => {
  return render(
    <BrowserRouter>
      <SoportePage />
    </BrowserRouter>
  );
};

describe('SoportePage - Centro de Ayuda & WhatsApp Oficial FORMA', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza la tarjeta principal de WhatsApp Oficial FORMA y el enlace a Trazabilidad en Mi Cuenta', () => {
    renderSoportePage();

    expect(
      screen.getByRole('heading', { name: /Soporte Oficial FORMA & WhatsApp Directo/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/\+57 315 800 4210/i)).toBeInTheDocument();
    expect(screen.getByText(/soporte@forma\.co/i)).toBeInTheDocument();

    const enlacesRastreo = screen.getAllByRole('link', {
      name: /Trazabilidad|Rastreo|Mi Cuenta/i,
    });
    expect(enlacesRastreo.length).toBeGreaterThan(0);
  });

  it('no contiene códigos internos de documentación (CA-*, RN-*) visibles para el usuario', () => {
    const { container } = renderSoportePage();
    const html = container.innerHTML;

    expect(html).not.toMatch(/CA-35/i);
    expect(html).not.toMatch(/CA-36/i);
    expect(html).not.toMatch(/CA-39/i);
    expect(html).not.toMatch(/RN-VTA-03/i);
    expect(html).not.toMatch(/RN-WEB-16/i);
    expect(html).not.toMatch(/RN-CAT-02/i);
    expect(html).not.toMatch(/RN-DEV-04/i);
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
      screen.getByText(/nuestro sistema busca automáticamente entre nuestras 4 sedes físicas/i)
    ).toBeInTheDocument();

    // Cerrar acordeón haciendo clic
    fireEvent.click(faqButton);
    expect(
      screen.queryByText(/nuestro sistema busca automáticamente entre nuestras 4 sedes físicas/i)
    ).not.toBeInTheDocument();
  });
});
