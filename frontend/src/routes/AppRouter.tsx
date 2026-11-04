import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { PosLayout } from '../layouts/PosLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Carga diferida (React.lazy) por portal y por feature de auth para code-splitting
const CatalogPage = lazy(() => import('../features/storefront/CatalogPage'));
const PosTerminalPage = lazy(() => import('../features/pos/PosTerminalPage'));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));

// Nuevas vistas de Admin (SP2-05)
const AdminInventarioPage = lazy(() => import('../features/admin/pages/AdminInventarioPage'));
const AdminComprasPage = lazy(() => import('../features/admin/pages/AdminComprasPage'));
const AdminTrasladosPage = lazy(() => import('../features/admin/pages/AdminTrasladosPage'));

// Lazy load de los formularios de auth (que son componentes con export nombrado)
const LoginForm = lazy(() =>
  import('../features/auth/components/LoginForm').then((m) => ({ default: m.LoginForm }))
);
const RegisterForm = lazy(() =>
  import('../features/auth/components/RegisterForm').then((m) => ({ default: m.RegisterForm }))
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Cargando portal...</div>}>
        <Routes>
          {/* Portal 1: Tienda Web */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<CatalogPage />} />
            <Route path="login" element={<LoginForm />} />
            <Route path="register" element={<RegisterForm />} />
            <Route
              path="politica-privacidad"
              element={
                <div className="p-8 max-w-2xl mx-auto text-sm leading-relaxed">
                  <h1 className="text-xl font-bold mb-4">Política de Tratamiento de Datos Personales</h1>
                  <p>Conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, Forma Store garantiza la protección de sus datos personales. Sus datos serán utilizados exclusivamente para la gestión de pedidos, envíos y comunicaciones comerciales autorizadas.</p>
                </div>
              }
            />
          </Route>

          {/* Portal 2: Terminal POS */}
          <Route path="/pos" element={<PosLayout />}>
            <Route path="venta" element={<PosTerminalPage />} />
            <Route index element={<Navigate to="/pos/venta" replace />} />
          </Route>

          {/* Portal 3: Panel Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="inventario" element={<AdminInventarioPage />} />
            <Route path="compras" element={<AdminComprasPage />} />
            <Route path="traslados" element={<AdminTrasladosPage />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};