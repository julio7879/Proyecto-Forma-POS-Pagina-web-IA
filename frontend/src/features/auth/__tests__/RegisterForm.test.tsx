import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
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

describe('Formulario de Registro - Cumplimiento Ley 1581 (RF-USU-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra error si no se acepta la política de privacidad', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre completo *'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico *'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8 caracteres) *'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña *'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Teléfono (opcional)'), {
      target: { value: '3001234567' },
    });
    fireEvent.change(screen.getByPlaceholderText('Dirección de entrega (opcional)'), {
      target: { value: 'Calle Falsa 123' },
    });

    const checkbox = screen.getByLabelText(/Acepto la política de tratamiento/i);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/Debe aceptar la política/i)).toBeInTheDocument();
    });

    // No debe haber llamado a la API ni navegado (Caso 24 inverso)
    expect(apiRequest).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('muestra error si las contraseñas no coinciden (Caso 2.2)', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre completo *'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico *'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8 caracteres) *'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña *'), {
      target: { value: 'different456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
    });

    // Aserciones negativas (Caso 2.2): no se envió petición ni se navegó
    expect(apiRequest).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('registra exitosamente, guarda sesión y redirige a / (auto-login, Caso 24)', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      datos: {
        token: 'new-token',
        usuario: { id: 2, rol: 'CLIENTE', nombreCompleto: 'Test User' },
      },
    });

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre completo *'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico *'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8 caracteres) *'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña *'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/Acepto la política de tratamiento/i));

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      // Verificar que se invocó la API con el payload correcto
      expect(apiRequest).toHaveBeenCalledWith(
        '/auth/registro-cliente',
        expect.objectContaining({ method: 'POST' })
      );
      // Verificar auto-login
      expect(localStorage.getItem('token')).toBe('new-token');
      expect(JSON.parse(localStorage.getItem('usuario') || '{}').rol).toBe('CLIENTE');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    // Verificar que el payload enviado NO incluye confirmarPassword
    const callArgs = vi.mocked(apiRequest).mock.calls[0];
    const payload = JSON.parse(callArgs[1]!.body as string);
    expect(payload).not.toHaveProperty('confirmarPassword');
    expect(payload).toHaveProperty('nombreCompleto', 'Test User');
    expect(payload).toHaveProperty('correo', 'test@test.com');
    expect(payload).toHaveProperty('aceptoPrivacidad', true);

    // Verificar sanitización: los campos opcionales vacíos no se envían (Caso 1.2)
    expect(payload).not.toHaveProperty('telefono');
    expect(payload).not.toHaveProperty('direccionDefault');
    expect(payload).not.toHaveProperty('municipioDefaultId');
  });

  it('muestra error del backend si el correo ya está registrado (HTTP 409)', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(
      Object.assign(new Error('El correo ya está registrado'), { status: 409 })
    );

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre completo *'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico *'), {
      target: { value: 'existing@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8 caracteres) *'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña *'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/Acepto la política de tratamiento/i));

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/El correo ya está registrado/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});