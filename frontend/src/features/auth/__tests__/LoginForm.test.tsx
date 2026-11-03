import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { apiRequest } from '../../../api/apiClient';

// Mockeamos el módulo de apiClient
vi.mock('../../../api/apiClient', () => ({
  apiRequest: vi.fn(),
}));

// Mockeamos useNavigate con tipado estricto (Caso 25)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm - Flujo de Autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('guarda el token y el usuario, y redirige a /admin/dashboard si es ADMIN', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      datos: {
        token: 'fake-jwt-token',
        usuario: { id: 1, rol: 'ADMIN', nombreCompleto: 'Admin Test' },
      },
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
      expect(JSON.parse(localStorage.getItem('usuario') || '{}').rol).toBe('ADMIN');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('redirige a /pos/venta si el usuario es VENDEDOR', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      datos: {
        token: 'vendedor-token',
        usuario: { id: 2, rol: 'VENDEDOR', nombreCompleto: 'Vendedor Test' },
      },
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'vendedor@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pos/venta');
    });
  });

  it('muestra mensaje de error si las credenciales son incorrectas (HTTP 401, Caso 23)', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(
      Object.assign(new Error('Credenciales incorrectas'), { status: 401 })
    );

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'fail@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Credenciales incorrectas/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('muestra alerta de bloqueo si el backend responde HTTP 423', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(
      Object.assign(new Error('Cuenta bloqueada'), {
        status: 423,
        code: 'CUENTA_BLOQUEADA',
      })
    );

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'locked@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cuenta bloqueada por seguridad/i)).toBeInTheDocument();
    });
  });
});