// frontend/src/features/admin/__tests__/AdminLayoutAndDashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { recordPosSale } from '../../pos/utils/posLedgerSync';
import { createWebOrder } from '../../pos/utils/webOrdersStore';
import { abrirSesionCaja } from '../../pos/utils/cajaStore';

describe('AdminLayout & AdminDashboardPage Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('AdminLayout - Autenticación Estricta y Navegación Limpia', () => {
    it('muestra la tarjeta de Acceso Administrativo FORMA cuando no hay sesión de ADMIN (cero auto-login silencioso)', () => {
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<div>Dashboard Child</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Debe mostrar el título y los campos del formulario de acceso
      expect(screen.getByText('Acceso Administrativo FORMA')).toBeInTheDocument();
      expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Ingresar al Panel de Control/i })
      ).toBeInTheDocument();

      // No debe renderizar el contenido protegido ni la barra lateral
      expect(screen.queryByText('Dashboard Child')).not.toBeInTheDocument();
      expect(screen.queryByText('Módulos')).not.toBeInTheDocument();
    });

    it('permite iniciar sesión con credenciales válidas de ADMIN', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<div>Contenido Protegido Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Correo Electrónico/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitBtn = screen.getByRole('button', { name: /Ingresar al Panel de Control/i });

      fireEvent.change(emailInput, { target: { value: 'admin@forma.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Admin2026*' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Contenido Protegido Dashboard')).toBeInTheDocument();
      });

      // Se guardó en localStorage la sesión admin
      const storedUser = JSON.parse(localStorage.getItem('usuario') || '{}');
      expect(storedUser.rol).toBe('ADMIN');
    });

    it('muestra alerta de error cuando las credenciales son incorrectas', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<div>Dashboard Child</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Correo Electrónico/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitBtn = screen.getByRole('button', { name: /Ingresar al Panel de Control/i });

      fireEvent.change(emailInput, { target: { value: 'intruso@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'ClaveInvalida' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(
          screen.getByText(/Credenciales incorrectas o servidor no disponible/i)
        ).toBeInTheDocument();
      });
    });

    it('renderiza el sidebar con exactamente los 5 módulos aprobados y SIN accesos inapropiados ni compras', () => {
      // Simular admin ya autenticado en localStorage
      localStorage.setItem('token', 'fake-admin-token');
      localStorage.setItem(
        'usuario',
        JSON.stringify({
          id: 1,
          nombreCompleto: 'Directora General',
          rol: 'ADMIN',
          correo: 'admin@forma.com',
        })
      );

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<div>Dashboard Child</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Los 5 módulos requeridos en el sidebar
      expect(screen.getByRole('link', { name: /Dashboard Ejecutivo/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Inventario y Kardex/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Traslados y Novedades/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Vendedores y Sedes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Reportes Personalizados/i })).toBeInTheDocument();

      // Verificar que NO existan los botones "Saltar a Terminal POS" ni "Saltar a Tienda Web"
      expect(screen.queryByText(/Saltar a Terminal POS/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Saltar a Tienda Web/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Saltar a Portales/i)).not.toBeInTheDocument();

      // Verificar que NO exista el enlace a compras proveedor
      expect(screen.queryByRole('link', { name: /Compras Proveedor/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Compras Proveedor/i)).not.toBeInTheDocument();

      // Verificar que el header no tenga slop técnico
      expect(screen.queryByText(/Mirror OS v2.4/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Kardex ACID Sincronizado/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Exportar Cierre Excel/i)).not.toBeInTheDocument();
    });
  });

  describe('AdminDashboardPage - KPIs 100% Reales, Filtro Reactivo y Cero Slop', () => {
    it('renderiza las 4 tarjetas KPI ejecutivas en estado inicial real limpio ($0, 0 Pedidos Activos, 0/4 Sedes Abiertas) cuando localStorage está vacío', () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // 4 KPIs presentes con datos reales en 0 cuando no hay ventas ni sesiones abiertas
      expect(screen.getByText('Ventas Netas')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-ventas-netas')).toHaveTextContent('$0 COP');
      expect(screen.getByText('Inventario Físico')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-inventario-unidades')).toHaveTextContent(/Unidades/i);
      expect(screen.getByText('Pedidos Web Activos')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-pedidos-activos')).toHaveTextContent('0 Pedidos Activos');
      expect(screen.getByText('Estado de Caja')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-estado-caja')).toHaveTextContent('0/4 Sedes Abiertas');

      // Verificar que NO existan los datos falsos antiguos
      expect(screen.queryByText('$48.920.000 COP')).not.toBeInTheDocument();
      expect(screen.queryByText('18 Pedidos Activos')).not.toBeInTheDocument();
      expect(screen.queryByText('4/4 Sedes Abiertas')).not.toBeInTheDocument();
    });

    it('calcula los totales reales y los filtra reactivamente al seleccionar una sede en las píldoras', async () => {
      // Sembrar venta real en Punto Centro
      recordPosSale({
        id: 'vta-test-1',
        consecutivo: 'POS-1001',
        fechaHora: 'Hoy 10:00 a. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Camilo Mendoza',
        sede: 'Punto Centro (Cúcuta)',
        cliente: 'Cliente Centro',
        medioPago: 'EFECTIVO',
        subtotalCop: 150000,
        totalCop: 180000,
        prendas: [
          {
            sku: 'ROP-CAM-NEG-S',
            nombre: 'Camiseta Básica de Algodón',
            cantidad: 4,
            precioUnitarioCop: 45000,
            totalCop: 180000,
          },
        ],
      });

      // Sembrar pedido web activo asignado a Punto Centro
      createWebOrder({
        codigo: 'WEB-9001',
        fechaCreacionIso: new Date().toISOString(),
        cliente: 'Laura Gómez',
        emailCliente: 'laura@test.com',
        ciudadDestino: 'Cúcuta',
        codigoDaneDestino: '54001',
        direccionEntrega: 'Av 0 #10-20',
        sedeAsignada: 'Punto Centro (Cúcuta)',
        metodoPago: 'TRANSFERENCIA',
        metodoPagoTexto: 'Transferencia Bancolombia',
        subtotalCOP: 100000,
        ivaCOP: 19000,
        fleteCOP: 0,
        totalCOP: 120000,
        estado: 'EN_PREPARACION',
        estadoCobro: 'PAGADO',
        productos: [
          {
            id: 'p-1',
            nombre: 'Blazer Sastrería Imperial Vinotinto',
            sku: 'ROP-BLZ-VIN-S',
            talla: 'S',
            color: 'Vinotinto',
            cantidad: 1,
            precioUnitarioCOP: 120000,
          },
        ],
      });

      // Abrir sesión de caja en Punto Centro
      const sesion = abrirSesionCaja('Punto Centro (Cúcuta)', 'Camilo Mendoza', 200000);

      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // En consolidado: 180.000 POS + 120.000 Web Pagado = $300.000 COP, 1/4 Sedes Abiertas
      expect(screen.getByTestId('kpi-ventas-netas')).toHaveTextContent('$300.000 COP');
      expect(screen.getByTestId('kpi-pedidos-activos')).toHaveTextContent('1 Pedidos Activos');
      expect(screen.getByTestId('kpi-estado-caja')).toHaveTextContent('1/4 Sedes Abiertas');

      // Clic en la píldora de "Punto Centro"
      const puntoCentroBtn = screen.getByTestId('pildora-sede-Punto Centro');
      fireEvent.click(puntoCentroBtn);

      await waitFor(() => {
        expect(screen.getByTestId('kpi-ventas-netas')).toHaveTextContent('$300.000 COP');
        expect(screen.getByTestId('kpi-pedidos-activos')).toHaveTextContent('1 Pedidos Activos');
        expect(screen.getByTestId('kpi-estado-caja')).toHaveTextContent(`Caja Abierta (${sesion.id})`);
      });
    });

    it('permite filtrar la sede al hacer clic en las tarjetas de comparación comercial', async () => {
      // Sembrar venta real en Punto Caobos
      recordPosSale({
        id: 'vta-test-2',
        consecutivo: 'POS-2001',
        fechaHora: 'Hoy 11:30 a. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Valeria Restrepo',
        sede: 'Punto Caobos (Cúcuta)',
        cliente: 'Cliente Caobos',
        medioPago: 'TRANSFERENCIA',
        subtotalCop: 200000,
        totalCop: 245000,
        prendas: [
          {
            sku: 'ROP-VES-ESM-S',
            nombre: 'Vestido Midi Seda Andina Esmeralda',
            cantidad: 1,
            precioUnitarioCop: 245000,
            totalCop: 245000,
          },
        ],
      });

      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // Buscar la tarjeta comercial de Punto Caobos
      const tarjetaCaobos = screen.getByTestId('tarjeta-sede-Punto Caobos');
      fireEvent.click(tarjetaCaobos);

      await waitFor(() => {
        expect(screen.getByTestId('kpi-ventas-netas')).toHaveTextContent('$245.000 COP');
        expect(screen.getByTestId('kpi-pedidos-activos')).toHaveTextContent('0 Pedidos Activos');
        expect(screen.getByTestId('kpi-estado-caja')).toHaveTextContent('Caja Cerrada');
      });
    });

    it('muestra el monitor de alertas de inventario real y actividad reciente en vivo', () => {
      recordPosSale({
        id: 'vta-test-3',
        consecutivo: 'POS-3009',
        fechaHora: 'Hoy 02:15 p. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Daniela Gómez',
        sede: 'Punto Bucaramanga',
        cliente: 'Cliente Test',
        medioPago: 'EFECTIVO',
        subtotalCop: 80000,
        totalCop: 95000,
        prendas: [],
      });

      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Alertas de Inventario Bajo')).toBeInTheDocument();
      expect(screen.getByText('Actividad y Movimientos en Vivo')).toBeInTheDocument();
      expect(screen.getByText('#POS-3009')).toBeInTheDocument();
    });

    it('no contiene la bitácora inmutable de 200 filas ni códigos de documentación (RN-* o CA-*)', () => {
      const { container } = render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // No debe existir el título de la bitácora inmutable
      expect(
        screen.queryByText(/Bitácora Inmutable de Movimientos Kardex/i)
      ).not.toBeInTheDocument();

      // No debe haber referencias a códigos de reglas
      const text = container.textContent || '';
      expect(text).not.toMatch(/RN-[A-Z]+-[0-9]+/);
      expect(text).not.toMatch(/CA-[0-9]+/);
    });
  });
});
