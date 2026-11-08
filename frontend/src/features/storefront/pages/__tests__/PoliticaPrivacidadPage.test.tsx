import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PoliticaPrivacidadPage } from '../PoliticaPrivacidadPage';

describe('PoliticaPrivacidadPage - Transparencia y Google OAuth', () => {
  it('renderiza el título formal, fecha de actualización y las 7 secciones obligatorias', () => {
    render(
      <MemoryRouter>
        <PoliticaPrivacidadPage />
      </MemoryRouter>
    );

    // Encabezado
    expect(screen.getByRole('heading', { level: 1, name: /Política de Privacidad de FORMA Tienda & POS/i })).toBeInTheDocument();
    expect(screen.getByText(/8 de noviembre de 2026/i)).toBeInTheDocument();

    // Las 7 Secciones
    expect(screen.getByRole('heading', { level: 2, name: /Información que recopilamos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Uso de la información/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Almacenamiento y seguridad/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Compartir datos con terceros/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Conservación y eliminación de datos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Derechos del usuario/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Contacto/i })).toBeInTheDocument();

    // Verificaciones específicas de Google OAuth
    expect(screen.getByText(/Google OAuth/i)).toBeInTheDocument();
    expect(screen.getByText(/Nombre completo y apellido:/i)).toBeInTheDocument();
    expect(screen.getByText(/Dirección de correo electrónico:/i)).toBeInTheDocument();
    expect(screen.getByText(/Foto de perfil pública:/i)).toBeInTheDocument();
    expect(screen.getByText(/Compromiso de Cero Intrusión/i)).toBeInTheDocument();

    // Enlace de revocación de permisos en Google
    const googleLink = screen.getByRole('link', { name: /Gestionar permisos en Google Account/i });
    expect(googleLink).toHaveAttribute('href', 'https://myaccount.google.com/permissions');

    // Correo de contacto oficial
    const contactEmail = screen.getByRole('link', { name: /julioveg567@gmail\.com/i });
    expect(contactEmail).toHaveAttribute('href', 'mailto:julioveg567@gmail.com');
  });
});
