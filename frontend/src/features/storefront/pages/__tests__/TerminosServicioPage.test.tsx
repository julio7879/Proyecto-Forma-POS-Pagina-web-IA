import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TerminosServicioPage } from '../TerminosServicioPage';

describe('TerminosServicioPage - Condiciones del Servicio y Google OAuth', () => {
  it('renderiza el título formal, fecha de actualización y las 8 secciones legales', () => {
    render(
      <MemoryRouter>
        <TerminosServicioPage />
      </MemoryRouter>
    );

    // Encabezado
    expect(screen.getByRole('heading', { level: 1, name: /Condiciones del Servicio de FORMA Tienda & POS/i })).toBeInTheDocument();
    expect(screen.getByText(/8 de noviembre de 2026/i)).toBeInTheDocument();

    // Las 8 Secciones
    expect(screen.getByRole('heading', { level: 2, name: /Descripción del Servicio/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Registro y Cuentas de Usuario/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Uso Aceptable/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Propiedad Intelectual/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Disponibilidad y Modificaciones del Servicio/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Limitación de Responsabilidad/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Modificación de los Términos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Contacto/i })).toBeInTheDocument();

    // Verificaciones específicas de contenido
    expect(screen.getByText(/Google OAuth/i)).toBeInTheDocument();
    expect(screen.getByText(/Finalidad Legal/i)).toBeInTheDocument();
    expect(screen.getByText(/Integridad de Seguridad/i)).toBeInTheDocument();
    expect(screen.getByText(/Cero Código Malicioso/i)).toBeInTheDocument();
    expect(screen.getByText(/Veracidad de Datos/i)).toBeInTheDocument();

    // Correo de contacto oficial
    const contactEmail = screen.getByRole('link', { name: /julioveg567@gmail\.com/i });
    expect(contactEmail).toHaveAttribute('href', 'mailto:julioveg567@gmail.com');

    // Enlace a Política de Privacidad
    const privacyLink = screen.getByRole('link', { name: /Ver Política de Privacidad/i });
    expect(privacyLink).toHaveAttribute('href', '/privacidad');
  });
});
