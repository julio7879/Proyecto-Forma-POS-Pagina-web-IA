import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StorefrontLayout } from '../layouts/StorefrontLayout.js';
import { PosLayout } from '../layouts/PosLayout.js';
import { AdminLayout } from '../layouts/AdminLayout.js';

// Carga diferida (React.lazy) por portal para code-splitting independiente (Sección 2.2 / 4.1)
const CatalogPage = lazy(() => import('../features/storefront/CatalogPage.js'));
const PosTerminalPage = lazy(() => import('../features/pos/PosTerminalPage.js'));
const AdminDashboardPage = lazy(() => import('../features/admin/AdminDashboardPage.js'));

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Cargando portal...</div>}>
        <Routes>
          {/* Portal 1: Tienda Web */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<CatalogPage />} />
          </Route>

          {/* Portal 2: Terminal POS */}
          <Route path="/pos" element={<PosLayout />}>
            <Route path="venta" element={<PosTerminalPage />} />
            <Route index element={<Navigate to="/pos/venta" replace />} />
          </Route>

          {/* Portal 3: Panel Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
