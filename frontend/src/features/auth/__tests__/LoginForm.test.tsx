import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { apiRequest } from '../../../api/apiClient';

// Mockeamos el módulo de apiClient
vi.mock('../../../api/apiClient', () => ({
  apiRequest: vi.fn(),
}));

// Mockeamos useNavigate para verificar la redirección
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  // Casteamos 'actual' a any para evitar el error TS2698
  const actual: any = await vi.importActual('react-router-dom');
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

  it('guarda el token y redirige al POS si el usuario es ADMIN', async () => {
    // Configuramos el mock para que simule una respuesta exitosa del backend
    vi.mocked(apiRequest).mockResolvedValueOnce({
      datos: { token: 'fake-jwt-token', usuario: { rol: 'ADMIN' } }
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
      expect(mockNavigate).toHaveBeenCalledWith('/pos');
    });
  });
});