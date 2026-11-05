import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { apiRequest } from '../../../api/apiClient';

vi.mock('../../../api/apiClient', () => ({
  apiRequest: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GoogleAuthButton - Integración Google Identity Services & Sandbox Fallback', () => {
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('abre modal informativo de cristal espejo cuando VITE_GOOGLE_CLIENT_ID no está configurado', async () => {
    render(
      <MemoryRouter>
        <GoogleAuthButton onError={mockOnError} />
      </MemoryRouter>
    );

    const botonGoogle = screen.getByRole('button', { name: /Continuar con Google/i });
    fireEvent.click(botonGoogle);

    // Debe abrir el modal dialog informativo
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/Configuración de Google OAuth 2.0 \(Google Identity Services\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/VITE_GOOGLE_CLIENT_ID=tu-client-id/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Continuar con Cuenta Google de Prueba \(PostgreSQL\)/i,
      })
    ).toBeInTheDocument();
  });

  it('permite autenticar con cuenta Google de prueba en PostgreSQL y guarda sesión', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      datos: {
        token: 'google-postgres-token-xyz',
        usuario: { id: 789, rol: 'CLIENTE', nombreCompleto: 'Cliente Google Oficial' },
      },
    });

    render(
      <MemoryRouter>
        <GoogleAuthButton onError={mockOnError} />
      </MemoryRouter>
    );

    // Abre modal
    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/i }));

    // Pulsa botón de cuenta de prueba PostgreSQL
    const botonPrueba = screen.getByRole('button', {
      name: /Continuar con Cuenta Google de Prueba \(PostgreSQL\)/i,
    });
    fireEvent.click(botonPrueba);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          googleId: 'google_test_user_789',
          correo: 'cliente.google@forma.com',
          nombreCompleto: 'Cliente Google Oficial',
        }),
      });
      expect(localStorage.getItem('token')).toBe('google-postgres-token-xyz');
      expect(JSON.parse(localStorage.getItem('usuario') || '{}').nombreCompleto).toBe(
        'Cliente Google Oficial'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('maneja errores de autenticación reportando vía onError', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('Fallo de red en servidor de autenticación'));

    render(
      <MemoryRouter>
        <GoogleAuthButton onError={mockOnError} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/i }));
    fireEvent.click(
      screen.getByRole('button', {
        name: /Continuar con Cuenta Google de Prueba \(PostgreSQL\)/i,
      })
    );

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Fallo de red en servidor de autenticación');
    });
  });
});
