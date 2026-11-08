import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { PosLayout } from '../layouts/PosLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Carga diferida (React.lazy) por portal y por feature de auth para code-splitting
const CatalogPage = lazy(() => import('../features/storefront/CatalogPage'));
const NosotrosPage = lazy(() => import('../features/storefront/pages/NosotrosPage'));
const SoportePage = lazy(() => import('../features/storefront/pages/SoportePage'));
const CheckoutPage = lazy(() => import('../features/storefront/pages/CheckoutPage'));
const BolsaPage = lazy(() => import('../features/storefront/pages/BolsaPage'));
const MiCuentaPage = lazy(() => import('../features/storefront/pages/MiCuentaPage'));
const PoliticaPrivacidadPage = lazy(() => import('../features/storefront/pages/PoliticaPrivacidadPage'));
const TerminosServicioPage = lazy(() => import('../features/storefront/pages/TerminosServicioPage'));
const PosTerminalPage = lazy(() => import('../features/pos/PosTerminalPage'));
const PosVentasHistorialPage = lazy(() => import('../features/pos/pages/PosVentasHistorialPage'));
const PosPedidosWebPage = lazy(() => import('../features/pos/pages/PosPedidosWebPage'));
const PosCambiosPage = lazy(() => import('../features/pos/pages/PosCambiosPage'));
const PosTrasladosPage = lazy(() => import('../features/pos/pages/PosTrasladosPage'));
const PosArqueoPage = lazy(() => import('../features/pos/pages/PosArqueoPage'));
const PagoQrClientePage = lazy(() => import('../features/pos/pages/PagoQrClientePage'));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));

// Módulos Administrativos
const AdminInventarioPage = lazy(() => import('../features/admin/pages/AdminInventarioPage'));
const AdminTrasladosPage = lazy(() => import('../features/admin/pages/AdminTrasladosPage'));
const AdminVendedoresPage = lazy(() => import('../features/admin/pages/AdminVendedoresPage'));
const AdminReportesPage = lazy(() => import('../features/admin/pages/AdminReportesPage'));
const AdminPedidosWebPage = lazy(() => import('../features/admin/pages/AdminPedidosWebPage'));
const AdminCajasPage = lazy(() => import('../features/admin/pages/AdminCajasPage'));
const AdminClientesPage = lazy(() => import('../features/admin/pages/AdminClientesPage'));

// Formularios de auth
const LoginForm = lazy(() =>
  import('../features/auth/components/LoginForm').then((m) => ({ default: m.LoginForm }))
);
const RegisterForm = lazy(() =>
  import('../features/auth/components/RegisterForm').then((m) => ({ default: m.RegisterForm }))
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center text-[#50322A] text-sm font-bold">Cargando portal...</div>}>
        <Routes>
          {/* Portal 1: Tienda Web */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<CatalogPage />} />
            <Route path="nosotros" element={<NosotrosPage />} />
            <Route path="soporte" element={<SoportePage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="login" element={<LoginForm />} />
            <Route path="register" element={<RegisterForm />} />
            <Route path="bolsa" element={<BolsaPage />} />
            <Route path="carrito" element={<BolsaPage />} />
            <Route path="cuenta" element={<MiCuentaPage />} />
            <Route path="mi-cuenta" element={<MiCuentaPage />} />
            <Route path="rastreo" element={<MiCuentaPage />} />
            <Route path="politica-privacidad" element={<PoliticaPrivacidadPage />} />
            <Route path="privacidad" element={<PoliticaPrivacidadPage />} />
            <Route path="privacy" element={<PoliticaPrivacidadPage />} />
            <Route path="terminos" element={<TerminosServicioPage />} />
            <Route path="terms" element={<TerminosServicioPage />} />
            <Route path="condiciones" element={<TerminosServicioPage />} />
          </Route>

          {/* Portal 2: Terminal POS */}
          <Route path="/pos" element={<PosLayout />}>
            <Route path="venta" element={<PosTerminalPage />} />
            <Route path="ventas" element={<PosVentasHistorialPage />} />
            <Route path="historial" element={<PosVentasHistorialPage />} />
            <Route path="pedidos-web" element={<PosPedidosWebPage />} />
            <Route path="web" element={<PosPedidosWebPage />} />
            <Route path="cambios" element={<PosCambiosPage />} />
            <Route path="traslados" element={<PosTrasladosPage />} />
            <Route path="caja" element={<PosArqueoPage />} />
            <Route path="arqueo" element={<PosArqueoPage />} />
            <Route index element={<Navigate to="/pos/venta" replace />} />
          </Route>

          {/* Portal 3: Panel Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="vendedores" element={<AdminVendedoresPage />} />
            <Route path="reportes" element={<AdminReportesPage />} />
            <Route path="pedidos-web" element={<AdminPedidosWebPage />} />
            <Route path="inventario" element={<AdminInventarioPage />} />
            <Route path="traslados" element={<AdminTrasladosPage />} />
            <Route path="cajas" element={<AdminCajasPage />} />
            <Route path="clientes" element={<AdminClientesPage />} />
            <Route path="compras" element={<Navigate to="/admin/dashboard" replace />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Pantalla Móvil de Pago QR para el Cliente */}
          <Route path="/pago-qr/:consecutivo" element={<PagoQrClientePage />} />

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
