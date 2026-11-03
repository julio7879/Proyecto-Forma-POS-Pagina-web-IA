import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

vi.mock('../../../api/apiClient', () => ({
  apiRequest: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Formulario de Registro - Cumplimiento Ley 1581 (RF-USU-01)', () => {
  it('muestra error si no se acepta la política de privacidad', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText('Nombre completo'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8 caracteres)'), { target: { value: 'password123' } }); // <-- Actualizado
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Dirección'), { target: { value: 'Calle Falsa 123' } });
    
    const checkbox = screen.getByLabelText(/Acepto la política de tratamiento/i);
    expect(checkbox).not.toBeChecked();

    const submitBtn = screen.getByRole('button', { name: /Registrarse/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Debe aceptar la política/i)).toBeInTheDocument();
    });
  });
});