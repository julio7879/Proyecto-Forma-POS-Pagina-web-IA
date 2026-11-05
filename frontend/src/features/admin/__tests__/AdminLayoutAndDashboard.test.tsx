// frontend/src/features/admin/__tests__/AdminLayoutAndDashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';

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

  describe('AdminDashboardPage - KPIs, Filtro Reactivo y Cero Slop', () => {
    it('renderiza las 4 tarjetas KPI ejecutivas en consolidado por defecto', () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // 4 KPIs presentes
      expect(screen.getByText('Ventas Netas')).toBeInTheDocument();
      expect(screen.getByText('$48.920.000 COP')).toBeInTheDocument();
      expect(screen.getByText('Inventario Físico')).toBeInTheDocument();
      expect(screen.getByText('3.140 Unidades')).toBeInTheDocument();
      expect(screen.getByText('Pedidos Web Activos')).toBeInTheDocument();
      expect(screen.getByText('18 Pedidos Activos')).toBeInTheDocument();
      expect(screen.getByText('Estado de Caja')).toBeInTheDocument();
      expect(screen.getByText('4/4 Sedes Abiertas')).toBeInTheDocument();
    });

    it('filtra reactivamente todos los datos al seleccionar una sede en las píldoras', async () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // Clic en la píldora de "Punto Centro (Cúcuta)"
      const puntoCentroBtn = screen.getByTestId('pildora-sede-Punto Centro');
      fireEvent.click(puntoCentroBtn);

      await waitFor(() => {
        // Los KPIs deben reflejar los datos de Punto Centro
        const ventasNetasMatches = screen.getAllByText('$16.450.000 COP');
        expect(ventasNetasMatches.length).toBeGreaterThanOrEqual(1);

        const unidadesMatches = screen.getAllByText('740 Unidades');
        expect(unidadesMatches.length).toBeGreaterThanOrEqual(1);

        const pedidosMatches = screen.getAllByText('6 Pedidos Asignados');
        expect(pedidosMatches.length).toBeGreaterThanOrEqual(1);

        expect(screen.getByText('Caja Abierta (CAJ-401)')).toBeInTheDocument();
      });
    });

    it('permite filtrar la sede al hacer clic en las tarjetas de rendimiento comercial', async () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // Buscar la tarjeta comercial de Punto Caobos (Cúcuta)
      const tarjetaCaobos = screen.getByTestId('tarjeta-sede-Punto Caobos');
      fireEvent.click(tarjetaCaobos);

      await waitFor(() => {
        // KPI de ventas netas de Punto Caobos
        const ventasCaobos = screen.getAllByText('$14.180.000 COP');
        expect(ventasCaobos.length).toBeGreaterThanOrEqual(1);

        const unidadesCaobos = screen.getAllByText('685 Unidades');
        expect(unidadesCaobos.length).toBeGreaterThanOrEqual(1);

        const pedidosCaobos = screen.getAllByText('5 Pedidos Asignados');
        expect(pedidosCaobos.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('muestra el monitor de alertas ejecutivas (stock bajo y traslados)', () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Alertas de Inventario Bajo')).toBeInTheDocument();
      expect(screen.getByText('Chaqueta Denim Artesanal')).toBeInTheDocument();
      expect(screen.getByText('Traslados y Despachos')).toBeInTheDocument();
      expect(screen.getByText('#TRL-0084')).toBeInTheDocument();
    });

    it('no contiene la bitácora inmutable de 200 filas ni códigos de documentación (RN-* o CA-*)', () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // No debe existir el título de la bitácora inmutable
      expect(
        screen.queryByText(/Bitácora Inmutable de Movimientos Kardex/i)
      ).not.toBeInTheDocument();

      // No debe haber referencias a códigos de reglas
      expect(screen.queryByText(/RN-GEN-02/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/RN-REP-01/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/CA-65/i)).not.toBeInTheDocument();
    });
  });
});
