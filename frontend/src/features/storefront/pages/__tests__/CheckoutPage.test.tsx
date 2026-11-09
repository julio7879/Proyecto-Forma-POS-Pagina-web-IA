import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from '../CheckoutPage';
import { StorefrontCartProvider } from '../../context/StorefrontCartContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CheckoutPage Component - Liquid Glass Checkout Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra estado de bolsa vacía cuando no hay prendas añadidas', () => {
    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <CheckoutPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Tu bolsa de compras está vacía')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explorar Catálogo/i })).toBeInTheDocument();
  });

  it('renderiza el formulario completo de envío, DANE y resumen de pedido cuando hay ítems', () => {
    const mockCart = [
      {
        id: 'var-101',
        productoId: 'prod-101',
        nombre: 'Camiseta Básica de Algodón',
        sku: 'ROP-CAM-NEG-S',
        talla: 'S',
        color: 'Negro',
        precioUnitarioCOP: 45000,
        cantidad: 1,
        imagenUrl: 'https://images.unsplash.com/photo-test',
        sedeDespacho: 'CUCUTA_CENTRAL',
      },
    ];
    localStorage.setItem('forma_cart_items_v2', JSON.stringify(mockCart));

    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <CheckoutPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Finalizar Pedido Seguro')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cédula de Ciudadanía/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono Celular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Municipio de Entrega/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dirección Física/i)).toBeInTheDocument();
    expect(screen.getByText('Camiseta Básica de Algodón')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar y Finalizar Pedido/i })).toBeInTheDocument();
  });

  it('muestra validaciones de error en vivo al intentar enviar formulario incompleto', async () => {
    const mockCart = [
      {
        id: 'var-101',
        productoId: 'prod-101',
        nombre: 'Camiseta Básica de Algodón',
        sku: 'ROP-CAM-NEG-S',
        talla: 'S',
        color: 'Negro',
        precioUnitarioCOP: 45000,
        cantidad: 1,
        imagenUrl: 'https://images.unsplash.com/photo-test',
        sedeDespacho: 'CUCUTA_CENTRAL',
      },
    ];
    localStorage.setItem('forma_cart_items_v2', JSON.stringify(mockCart));

    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <CheckoutPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Confirmar y Finalizar Pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/El nombre completo debe tener al menos 3 caracteres/i)).toBeInTheDocument();
      expect(screen.getByText(/La cédula o NIT debe contener al menos 5 dígitos/i)).toBeInTheDocument();
      expect(screen.getByText(/El celular debe tener exactamente 10 dígitos/i)).toBeInTheDocument();
      expect(screen.getByText(/Ingresa un correo electrónico válido/i)).toBeInTheDocument();
      expect(screen.getByText(/Ingresa la dirección completa con calle, número y barrio/i)).toBeInTheDocument();
      expect(screen.getByText(/Debes aceptar los términos y el tratamiento de datos/i)).toBeInTheDocument();
    });
  });

  it('permite completar el pedido y genera la pantalla de éxito con consecutivo y botón de rastreo', async () => {
    const mockCart = [
      {
        id: 'var-101',
        productoId: 'prod-101',
        nombre: 'Camiseta Básica de Algodón',
        sku: 'ROP-CAM-NEG-S',
        talla: 'S',
        color: 'Negro',
        precioUnitarioCOP: 45000,
        cantidad: 1,
        imagenUrl: 'https://images.unsplash.com/photo-test',
        sedeDespacho: 'CUCUTA_CENTRAL',
      },
    ];
    localStorage.setItem('forma_cart_items_v2', JSON.stringify(mockCart));

    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <CheckoutPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    // Llenar campos requeridos
    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), {
      target: { value: 'Camila Restrepo' },
    });
    fireEvent.change(screen.getByLabelText(/Cédula de Ciudadanía/i), {
      target: { value: '1090482910' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono Celular/i), {
      target: { value: '3124892011' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'camila@forma.co' },
    });
    fireEvent.change(screen.getByLabelText(/Dirección Física/i), {
      target: { value: 'Calle 10 # 2E-45, Barrio Caobos' },
    });

    // Aceptar términos
    const checkboxTerminos = screen.getByRole('checkbox');
    fireEvent.click(checkboxTerminos);

    // Datos de transferencia bancaria
    fireEvent.change(screen.getByLabelText(/Nombre del Titular de la Cuenta/i), {
      target: { value: 'Camila Restrepo' },
    });
    fireEvent.change(screen.getByLabelText(/Nº de Comprobante \/ CUS/i), {
      target: { value: 'CUS-9482103' },
    });

    const submitBtn = screen.getByRole('button', { name: /Confirmar y Finalizar Pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('¡Orden Confirmada con Éxito!')).toBeInTheDocument();
      expect(screen.getByText(/Gracias por tu compra, Camila Restrepo/i)).toBeInTheDocument();
      expect(screen.getByText(/Correo de Confirmación Enviado/i)).toBeInTheDocument();
      expect(screen.getByText(/Hemos despachado un correo electrónico con el resumen de tu compra/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Rastrear Estado de mi Pedido/i })).toBeInTheDocument();
    });

    // Comprobar que se guardó en localStorage
    const savedOrdersRaw = localStorage.getItem('forma_pedidos_camila@forma.co');
    expect(savedOrdersRaw).toBeTruthy();
    const savedOrders = JSON.parse(savedOrdersRaw!);
    expect(savedOrders[0].codigo).toMatch(/^PED-2026-\d{6}$/);
    expect(savedOrders[0].estadoActual).toBe('RECIBIDO');

    // Botón de rastrear navega a /rastreo
    const rastrearBtn = screen.getByRole('button', { name: /Rastrear Estado de mi Pedido/i });
    fireEvent.click(rastrearBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/rastreo');
  });

  it('bloquea letras en Cédula y Teléfono y permite pagar automáticamente con el Código QR Dinámico', async () => {
    const mockCart = [
      {
        id: 'var-101',
        productoId: 'prod-101',
        nombre: 'Camiseta Básica de Algodón',
        sku: 'ROP-CAM-NEG-S',
        talla: 'S',
        color: 'Negro',
        precioUnitarioCOP: 45000,
        cantidad: 1,
        imagenUrl: 'https://images.unsplash.com/photo-test',
        sedeDespacho: 'CUCUTA_CENTRAL',
      },
    ];
    localStorage.setItem('forma_cart_items_v2', JSON.stringify(mockCart));

    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <CheckoutPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    const cedulaInput = screen.getByLabelText(/Cédula de Ciudadanía/i) as HTMLInputElement;
    const telefonoInput = screen.getByLabelText(/Teléfono Celular/i) as HTMLInputElement;

    fireEvent.change(cedulaInput, { target: { value: 'ABC1090482910XYZ' } });
    expect(cedulaInput.value).toBe('1090482910');

    fireEvent.change(telefonoInput, { target: { value: '312abc4892011xyz' } });
    expect(telefonoInput.value).toBe('3124892011');

    // Simular pago automático por QR
    const botonQrAuto = screen.getByRole('button', {
      name: /Escanear QR y Pagar Automáticamente/i,
    });
    fireEvent.click(botonQrAuto);

    expect(screen.getByText(/QR Escaneado: Pago por/i)).toBeInTheDocument();
  });

  it('bloquea la compra y muestra alerta CA-35 cuando el producto no tiene stock en ninguna sede ni en Bodega Central', async () => {
    const mockCartSinStock = [
      {
        id: 'var-999',
        productoId: 'prod-999',
        nombre: 'Prenda Agotada Global',
        sku: 'PRE-SIN-STOCK-999',
        talla: 'M',
        color: 'Azul',
        precioUnitarioCOP: 120000,
        cantidad: 5,
        imagenUrl: 'https://images.unsplash.com/photo-test',
        sedeDespacho: 'CUCUTA_CENTRAL',
      },
    ];
    localStorage.setItem('forma_cart_items_v2', JSON.stringify(mockCartSinStock));

    render(
      <MemoryRouter>
        <StorefrontCartProvider>
          <CheckoutPage />
        </StorefrontCartProvider>
      </MemoryRouter>
    );

    // Llenar campos
    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), {
      target: { value: 'Mateo Botero' },
    });
    fireEvent.change(screen.getByLabelText(/Cédula de Ciudadanía/i), {
      target: { value: '1090123456' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono Celular/i), {
      target: { value: '3109876543' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'mateo@forma.co' },
    });
    fireEvent.change(screen.getByLabelText(/Dirección Física/i), {
      target: { value: 'Avenida 4 # 11-20, Centro' },
    });

    const checkboxTerminos = screen.getByRole('checkbox');
    fireEvent.click(checkboxTerminos);

    fireEvent.change(screen.getByLabelText(/Nombre del Titular de la Cuenta/i), {
      target: { value: 'Mateo Botero' },
    });
    fireEvent.change(screen.getByLabelText(/Nº de Comprobante \/ CUS/i), {
      target: { value: 'CUS-1234567' },
    });

    const submitBtn = screen.getByRole('button', { name: /Confirmar y Finalizar Pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(
          /No hay inventario suficiente en una sola sede ni en Bodega Central para despachar el pedido completo/i
        )
      ).toBeInTheDocument();
      expect(screen.queryByText('¡Orden Confirmada con Éxito!')).not.toBeInTheDocument();
    });
  });
});
