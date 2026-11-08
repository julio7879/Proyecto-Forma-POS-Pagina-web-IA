import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MiCuentaPage } from '../MiCuentaPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MiCuentaPage Component - Perfil y Trazabilidad de Pedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra la tarjeta de bienvenida invitando a autenticarse cuando el usuario es invitado', () => {
    render(
      <MemoryRouter>
        <MiCuentaPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Bienvenido a Mi Cuenta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Crear una Cuenta/i })).toBeInTheDocument();
  });

  it('muestra el perfil del usuario autenticado y el estado vacío de pedidos si no tiene compras', () => {
    const mockUser = {
      id: 'usr-cliente-01',
      nombreCompleto: 'Laura Restrepo',
      email: 'laura@forma.co',
      telefono: '3124567890',
      rol: 'CLIENTE',
    };
    localStorage.setItem('usuario', JSON.stringify(mockUser));
    localStorage.setItem('token', 'token-jwt-cliente-test');

    render(
      <MemoryRouter>
        <MiCuentaPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Mi Cuenta FORMA')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Laura Restrepo' })).toBeInTheDocument();
    expect(screen.getByText('laura@forma.co')).toBeInTheDocument();
    expect(screen.getByText('3124567890')).toBeInTheDocument();
    expect(screen.getByText('Aún no has realizado pedidos')).toBeInTheDocument();
  });

  it('renderiza la orden con su código, fecha Colombia, productos y la línea de tiempo de 7 estados', () => {
    const mockUser = {
      id: 'usr-cliente-02',
      nombreCompleto: 'Carlos Mendoza',
      email: 'carlos@forma.co',
      rol: 'CLIENTE',
    };
    localStorage.setItem('usuario', JSON.stringify(mockUser));
    localStorage.setItem('token', 'token-jwt-carlos');

    const mockPedido = {
      codigo: 'PED-2026-981245',
      cliente: 'Carlos Mendoza',
      emailCliente: 'carlos@forma.co',
      ciudadDestino: 'Bucaramanga (Santander)',
      sedeAsignada: 'Punto Bucaramanga',
      direccionEntrega: 'Carrera 33 # 45-12',
      estadoActual: 'RECIBIDO',
      metodoPago: 'Transferencia Bancolombia (CUS: 849201)',
      fechaCreacionBogota: '05/11/2026, 09:30',
      totalCOP: 450000,
      productos: [
        {
          id: 'prod-01',
          nombre: 'Chaqueta Cuero Café',
          sku: 'CHA-CUE-01-M',
          talla: 'M',
          color: 'Café Miel',
          cantidad: 1,
          precioUnitarioCOP: 450000,
          imagenUrl: 'https://images.unsplash.com/photo-test',
        },
      ],
    };

    localStorage.setItem('forma_pedidos_carlos@forma.co', JSON.stringify([mockPedido]));

    render(
      <MemoryRouter>
        <MiCuentaPage />
      </MemoryRouter>
    );

    expect(screen.getByText('PED-2026-981245')).toBeInTheDocument();
    expect(screen.getByText('Chaqueta Cuero Café')).toBeInTheDocument();
    expect(screen.getByText(/SKU: CHA-CUE-01-M/i)).toBeInTheDocument();
    expect(screen.getByText('Trazabilidad Oficial en 7 Estados:')).toBeInTheDocument();

    // Comprobar que los 7 estados están presentes en la línea de tiempo oficial
    expect(screen.getByText('Recibido')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
    expect(screen.getByText('En Preparación')).toBeInTheDocument();
    expect(screen.getByText('Listo Despacho')).toBeInTheDocument();
    expect(screen.getByText('Despachado')).toBeInTheDocument();
    expect(screen.getByText('En Entrega')).toBeInTheDocument();
    expect(screen.getByText('Entregado')).toBeInTheDocument();

    // Debe reflejarse el estado oficial actual del pedido
    expect(screen.getByText('Reserva Blanda Activa')).toBeInTheDocument();
    expect(screen.getByText('En Curso')).toBeInTheDocument();
  });

  it('habilita al cliente confirmar En Entrega y Entregado cuando el pedido está DESPACHADO', () => {
    const mockUser = {
      id: 'usr-cliente-03',
      nombreCompleto: 'Andrés Villamizar',
      email: 'andres@forma.co',
      rol: 'CLIENTE',
    };
    localStorage.setItem('usuario', JSON.stringify(mockUser));
    localStorage.setItem('token', 'token-jwt-andres');

    const mockPedidoDespachado = {
      codigo: 'PED-2026-771200',
      cliente: 'Andrés Villamizar',
      emailCliente: 'andres@forma.co',
      ciudadDestino: 'Cúcuta (Norte de Santander)',
      sedeAsignada: 'Punto Centro (Cúcuta)',
      direccionEntrega: 'Av. 0 # 11-30',
      estadoActual: 'DESPACHADO',
      metodoPago: 'Pago Contraentrega DANE',
      fechaCreacionBogota: '06/11/2026, 10:15',
      totalCOP: 180000,
      productos: [],
    };

    localStorage.setItem('forma_pedidos_andres@forma.co', JSON.stringify([mockPedidoDespachado]));

    render(
      <MemoryRouter>
        <MiCuentaPage />
      </MemoryRouter>
    );

    const btnEnEntrega = screen.getByRole('button', {
      name: /Marcar En Entrega \(Recibiendo paquete\)/i,
    });
    expect(btnEnEntrega).toBeInTheDocument();
    fireEvent.click(btnEnEntrega);

    expect(screen.getByText('6. En Entrega')).toBeInTheDocument();

    const btnEntregado = screen.getByRole('button', {
      name: /Confirmar Pedido Entregado y Pagado/i,
    });
    fireEvent.click(btnEntregado);

    expect(screen.getByText('7. Entregado')).toBeInTheDocument();
    expect(screen.getByText(/Pagado en Sistema/i)).toBeInTheDocument();
  });
});
