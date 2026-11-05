// frontend/src/features/storefront/__tests__/CheckoutWizard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutWizard } from '../components/checkout/CheckoutWizard';
import * as pedidosService from '../services/pedidosWebService';

// Mocks
vi.mock('../services/pedidosWebService', () => ({
  fetchDepartamentos: vi.fn(),
  submitCheckout: vi.fn(),
  fetchMisPedidos: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Datos mock
const MOCK_DEPARTAMENTOS: pedidosService.DepartamentoDaneDTO[] = [
  {
    departamentoId: 1,
    departamentoNombre: 'Cundinamarca',
    municipios: [
      {
        municipioId: 101,
        municipioNombre: 'Bogotá D.C.',
        departamentoId: 1,
        departamentoNombre: 'Cundinamarca',
        zona: 1,
        tarifaFleteCop: 8000,
        diasEstimados: 2,
      },
    ],
  },
  {
    departamentoId: 2,
    departamentoNombre: 'Antioquia',
    municipios: [
      {
        municipioId: 201,
        municipioNombre: 'Medellín',
        departamentoId: 2,
        departamentoNombre: 'Antioquia',
        zona: 3,
        tarifaFleteCop: 16000,
        diasEstimados: 4,
      },
    ],
  },
];

const MOCK_CHECKOUT_RESPONSE = {
  comprobante: 'PED-2026-000042',
  estado: 'RECIBIDO' as const,
  tarifaFleteCop: 8000,
  totalCop: 123000,
  ubicacionAsignadaId: 2,
  ubicacionAsignadaNombre: 'Punto Centro',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('CheckoutWizard - SP4-07', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el skeleton de carga inicialmente', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockImplementation(
      () => new Promise<pedidosService.DepartamentoDaneDTO[]>(() => {})
    );

    renderWithRouter(<CheckoutWizard />);

    // Buscamos los skeletons (divs con animate-pulse)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('muestra error y permite reintentar si falla la carga de departamentos', async () => {
    vi.mocked(pedidosService.fetchDepartamentos)
      .mockRejectedValueOnce(new Error('Error de red'))
      .mockResolvedValueOnce(MOCK_DEPARTAMENTOS);

    renderWithRouter(<CheckoutWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Error de red/i)).toBeInTheDocument();
    });

    // Recargar
    fireEvent.click(screen.getByText(/Reintentar/i));

    await waitFor(() => {
      expect(pedidosService.fetchDepartamentos).toHaveBeenCalledTimes(2);
    });
  });

  it('completa el Paso 1: selecciona departamento/municipio y muestra tarifa', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockResolvedValueOnce(MOCK_DEPARTAMENTOS);

    renderWithRouter(<CheckoutWizard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Departamento/i)).toBeInTheDocument();
    });

    // Seleccionar departamento
    fireEvent.change(screen.getByLabelText(/Departamento/i), { target: { value: '1' } });

    // Esperar a que aparezca el municipio
    await waitFor(() => {
      expect(screen.getByLabelText(/Municipio/i)).toBeInTheDocument();
    });

    // Seleccionar municipio
    fireEvent.change(screen.getByLabelText(/Municipio/i), { target: { value: '101' } });

    // Verificar tarifa
    await waitFor(() => {
      expect(screen.getByText(/\$ 8\.000/i)).toBeInTheDocument();
    });

    // Continuar
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/i }));

    // Verificar que avanzó al Paso 2
    await waitFor(() => {
      expect(screen.getByText(/Medio de pago/i)).toBeInTheDocument();
    });
  });

  it('completa el Paso 2: selecciona transferencia y muestra instrucciones', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockResolvedValueOnce(MOCK_DEPARTAMENTOS);

    renderWithRouter(<CheckoutWizard />);

    await waitFor(() => expect(screen.getByLabelText(/Departamento/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Departamento/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByLabelText(/Municipio/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Municipio/i), { target: { value: '101' } });
    await waitFor(() => expect(screen.getByText(/\$ 8\.000/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/i }));

    await waitFor(() => expect(screen.getByText(/Medio de pago/i)).toBeInTheDocument());

    // Seleccionar transferencia (default) y verificar instrucciones
    expect(screen.getByText(/Instrucciones de pago/i)).toBeInTheDocument();
    expect(screen.getByText(/Bancolombia/i)).toBeInTheDocument();

    // Cambiar a contraentrega
    fireEvent.click(screen.getByText(/Pago contraentrega/i));

    await waitFor(() => {
      expect(screen.queryByText(/Instrucciones de pago/i)).not.toBeInTheDocument();
    });
  });

  it('completa el flujo de 3 pasos y redirige a /mis-pedidos', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockResolvedValueOnce(MOCK_DEPARTAMENTOS);
    vi.mocked(pedidosService.submitCheckout).mockResolvedValueOnce(MOCK_CHECKOUT_RESPONSE);

    renderWithRouter(<CheckoutWizard />);

    // Paso 1
    await waitFor(() => expect(screen.getByLabelText(/Departamento/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Departamento/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByLabelText(/Municipio/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Municipio/i), { target: { value: '101' } });
    await waitFor(() => expect(screen.getByText(/\$ 8\.000/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/i }));

    // Paso 2
    await waitFor(() => expect(screen.getByText(/Medio de pago/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    // Paso 3
    await waitFor(() => expect(screen.getByText(/Confirma tu pedido/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), {
      target: { value: 'Calle 10 #25-30, Apto 201' },
    });

    // Confirmar
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/i }));

    // Verificar que submitCheckout fue llamado con Idempotency-Key
    await waitFor(() => {
      expect(pedidosService.submitCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          direccion: 'Calle 10 #25-30, Apto 201',
          municipioId: 101,
          medioPago: 'TRANSFERENCIA',
        }),
        expect.any(String) // Idempotency-Key
      );
    });

    // Verificar redirección
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mis-pedidos');
    });
  });

  it('deshabilita el botón de confirmar durante isSubmitting (RN-GEN-08)', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockResolvedValueOnce(MOCK_DEPARTAMENTOS);

    // Promesa pendiente
    let resolveCheckout: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveCheckout = resolve;
    });
    vi.mocked(pedidosService.submitCheckout).mockReturnValueOnce(pendingPromise as any);

    renderWithRouter(<CheckoutWizard />);

    // Navegar a paso 3
    await waitFor(() => expect(screen.getByLabelText(/Departamento/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Departamento/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByLabelText(/Municipio/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Municipio/i), { target: { value: '101' } });
    await waitFor(() => expect(screen.getByText(/\$ 8\.000/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/i }));
    await waitFor(() => expect(screen.getByText(/Medio de pago/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    await waitFor(() => expect(screen.getByText(/Confirma tu pedido/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), {
      target: { value: 'Calle 10 #25-30' },
    });

    // Confirmar
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/i }));

    // Verificar "Procesando..." y deshabilitado
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Procesando/i })).toBeDisabled();
    });

    // Resolver
    await act(async () => {
      resolveCheckout!(MOCK_CHECKOUT_RESPONSE);
    });
  });

  it('muestra error del backend si submitCheckout falla', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockResolvedValueOnce(MOCK_DEPARTAMENTOS);
    vi.mocked(pedidosService.submitCheckout).mockRejectedValueOnce(
      new Error('Stock insuficiente en variante')
    );

    renderWithRouter(<CheckoutWizard />);

    // Navegar a paso 3
    await waitFor(() => expect(screen.getByLabelText(/Departamento/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Departamento/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByLabelText(/Municipio/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Municipio/i), { target: { value: '101' } });
    await waitFor(() => expect(screen.getByText(/\$ 8\.000/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/i }));
    await waitFor(() => expect(screen.getByText(/Medio de pago/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    await waitFor(() => expect(screen.getByText(/Confirma tu pedido/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), {
      target: { value: 'Calle 10 #25-30' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/i }));

    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Stock insuficiente/i)).toBeInTheDocument();
    });
  });

  it('no permite avanzar del Paso 1 sin seleccionar municipio', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockResolvedValueOnce(MOCK_DEPARTAMENTOS);

    renderWithRouter(<CheckoutWizard />);

    await waitFor(() => expect(screen.getByLabelText(/Departamento/i)).toBeInTheDocument());

    // El botón de continuar debe estar deshabilitado
    const continueBtn = screen.getByRole('button', { name: /Continuar al pago/i });
    expect(continueBtn).toBeDisabled();
  });

  it('no permite confirmar sin dirección válida (mín. 5 caracteres)', async () => {
    vi.mocked(pedidosService.fetchDepartamentos).mockResolvedValueOnce(MOCK_DEPARTAMENTOS);

    renderWithRouter(<CheckoutWizard />);

    // Navegar a paso 3
    await waitFor(() => expect(screen.getByLabelText(/Departamento/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Departamento/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByLabelText(/Municipio/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Municipio/i), { target: { value: '101' } });
    await waitFor(() => expect(screen.getByText(/\$ 8\.000/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/i }));
    await waitFor(() => expect(screen.getByText(/Medio de pago/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    await waitFor(() => expect(screen.getByText(/Confirma tu pedido/i)).toBeInTheDocument());

    // Sin dirección: botón deshabilitado
    const confirmBtn = screen.getByRole('button', { name: /Confirmar pedido/i });
    expect(confirmBtn).toBeDisabled();

    // Dirección muy corta (< 5 chars): sigue deshabilitado
    fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), {
      target: { value: 'Abc' },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirmar pedido/i })).toBeDisabled();
    });

    // Dirección válida: habilita
    fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), {
      target: { value: 'Calle 10 #25-30' },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirmar pedido/i })).not.toBeDisabled();
    });
  });
});