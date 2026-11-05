// frontend/src/features/caja/__tests__/ArqueoCiegoModal.test.tsx
// Invariante crítica: CA-55 (Arqueo Ciego - sin filtración del saldo teórico)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ArqueoCiegoModal } from '../components/ArqueoCiegoModal';
import * as cajaService from '../services/cajaService';

// Mock del servicio
vi.mock('../services/cajaService', () => ({
  cerrarSesionCiego: vi.fn(),
}));

// Mock del cierre exitoso
const MOCK_RESULTADO: cajaService.CierreSesionResultadoDto = {
  sesionCajaId: 1,
  efectivoEsperadoCop: 500000,
  efectivoContadoCop: 495000,
  diferenciaEfectivoCop: -5000,
  efectivoAEntregarCop: 295000,
};

// Mock de la sesión activa (el saldo teórico es 500.000)
const MOCK_SESION: cajaService.SesionCajaDTO = {
  id: 1,
  ubicacionId: 1,
  ubicacionNombre: 'Punto Centro',
  usuarioId: 10,
  usuarioNombre: 'Cajero Test',
  estado: 'ABIERTA',
  fechaNegocioColombia: '2026-11-05',
  baseContadaCop: 200000,
  efectivoEsperadoCop: 500000, // <-- CRÍTICO: este valor NO debe filtrarse
  abiertaEn: '2026-11-05T08:00:00.000Z',
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ArqueoCiegoModal - CA-55 (Arqueo Ciego)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // TEST CRÍTICO: CA-55
  // ============================================
  it('CRÍTICO CA-55: NUNCA debe mostrar el saldo teórico antes del conteo', () => {
    renderWithProviders(
      <ArqueoCiegoModal isOpen={true} onClose={vi.fn()} sesion={MOCK_SESION} />
    );

    // El saldo esperado es 500.000. Verificar que ese valor NO aparece en el DOM
    expect(screen.queryByText(/500\.000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/500,000/)).not.toBeInTheDocument();

    // Tampoco debe aparecer la palabra "esperado" ni "teórico" en el contexto del saldo
    expect(screen.queryByText(/efectivo esperado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/saldo teórico/i)).not.toBeInTheDocument();

    // Pero SÍ debe estar el aviso de que es arqueo ciego
    // (usamos getAllByText porque "Arqueo Ciego" aparece en título, aviso y botón)
    expect(screen.getAllByText(/Arqueo Ciego/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/CA-55/)).toBeInTheDocument();
    expect(screen.getByText(/sin ver el saldo del sistema/i)).toBeInTheDocument();
  });

  // ============================================
  // Test 2: Toggle billetes → cálculo correcto
  // ============================================
  it('calcula el total contado correctamente con billetes', async () => {
    renderWithProviders(
      <ArqueoCiegoModal isOpen={true} onClose={vi.fn()} sesion={MOCK_SESION} />
    );

    // Modo por billetes es el default. Ingresar cantidades.
    const input100 = screen.getByLabelText(/Cantidad de billetes de \$100\.000/i);
    const input50 = screen.getByLabelText(/Cantidad de billetes de \$50\.000/i);
    const input20 = screen.getByLabelText(/Cantidad de billetes de \$20\.000/i);

    fireEvent.change(input100, { target: { value: '3' } }); // 300.000
    fireEvent.change(input50, { target: { value: '2' } }); // 100.000
    fireEvent.change(input20, { target: { value: '1' } }); // 20.000

    // Total esperado: 420.000
    await waitFor(() => {
      expect(screen.getByText(/420\.000/)).toBeInTheDocument();
    });
  });

  // ============================================
  // Test 3: Toggle directo → input directo
  // ============================================
  it('permite ingresar el total contado directamente', async () => {
    renderWithProviders(
      <ArqueoCiegoModal isOpen={true} onClose={vi.fn()} sesion={MOCK_SESION} />
    );

    // Cambiar al modo directo
    const btnDirecto = screen.getByRole('button', { name: /Total directo/i });
    fireEvent.click(btnDirecto);

    // Ingresar monto
    const inputDirecto = screen.getByLabelText(/Total contado en gaveta/i);
    fireEvent.change(inputDirecto, { target: { value: '350000' } });

    // Verificar total
    await waitFor(() => {
      expect(screen.getByText(/350\.000/)).toBeInTheDocument();
    });
  });

  // ============================================
  // Test 4: Envío exitoso → muestra resultado del backend
  // ============================================
  it('muestra la pantalla de resultado tras cierre exitoso', async () => {
    vi.mocked(cajaService.cerrarSesionCiego).mockResolvedValueOnce(MOCK_RESULTADO);

    renderWithProviders(
      <ArqueoCiegoModal isOpen={true} onClose={vi.fn()} sesion={MOCK_SESION} />
    );

    // Ingresar conteo directo
    fireEvent.click(screen.getByRole('button', { name: /Total directo/i }));
    const inputDirecto = screen.getByLabelText(/Total contado en gaveta/i);
    fireEvent.change(inputDirecto, { target: { value: '495000' } });

    // Confirmar
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar arqueo ciego/i });
    fireEvent.click(btnConfirmar);

    // Verificar que se llamó con Idempotency-Key
    await waitFor(() => {
      expect(cajaService.cerrarSesionCiego).toHaveBeenCalledWith(
        expect.objectContaining({
          sesionCajaId: 1,
          montoContadoCop: 495000,
        }),
        expect.any(String) // Idempotency-Key
      );
    });

    // Verificar pantalla de resultado (ahora SÍ se puede mostrar el esperado)
    await waitFor(() => {
      expect(screen.getByText(/Caja Cerrada/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/\$ 495\.000/)).toBeInTheDocument(); // contado
    expect(screen.getByText(/\$ 500\.000/)).toBeInTheDocument(); // esperado (del backend)
    expect(screen.getByText(/-.*\$ 5\.000/)).toBeInTheDocument(); // diferencia
    expect(screen.getByText(/\$ 295\.000/)).toBeInTheDocument(); // a entregar
  });

  // ============================================
  // Test 5: Error 409 → mensaje "sesión ya cerrada"
  // ============================================
  it('muestra mensaje de error si la sesión ya estaba cerrada (409)', async () => {
    vi.mocked(cajaService.cerrarSesionCiego).mockRejectedValueOnce(
      Object.assign(new Error('Conflicto'), { status: 409 })
    );

    renderWithProviders(
      <ArqueoCiegoModal isOpen={true} onClose={vi.fn()} sesion={MOCK_SESION} />
    );

    // Ingresar conteo directo
    fireEvent.click(screen.getByRole('button', { name: /Total directo/i }));
    const inputDirecto = screen.getByLabelText(/Total contado en gaveta/i);
    fireEvent.change(inputDirecto, { target: { value: '500000' } });

    // Confirmar
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar arqueo ciego/i });
    fireEvent.click(btnConfirmar);

    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/sesión de caja ya estaba cerrada/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Test 6: Idempotency-Key enviado (mock call)
  // ============================================
  it('envía el header Idempotency-Key en la petición', async () => {
    vi.mocked(cajaService.cerrarSesionCiego).mockResolvedValueOnce(MOCK_RESULTADO);

    renderWithProviders(
      <ArqueoCiegoModal isOpen={true} onClose={vi.fn()} sesion={MOCK_SESION} />
    );

    // Ingresar monto y confirmar
    fireEvent.click(screen.getByRole('button', { name: /Total directo/i }));
    fireEvent.change(screen.getByLabelText(/Total contado en gaveta/i), {
      target: { value: '100000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar arqueo ciego/i }));

    await waitFor(() => {
      // Verificar que el segundo argumento (Idempotency-Key) es un UUID v4
      const calls = vi.mocked(cajaService.cerrarSesionCiego).mock.calls;
      expect(calls.length).toBe(1);
      const idempotencyKey = calls[0][1];
      expect(typeof idempotencyKey).toBe('string');
      expect(idempotencyKey.length).toBeGreaterThan(30); // UUID v4 tiene 36 caracteres
    });
  });
});