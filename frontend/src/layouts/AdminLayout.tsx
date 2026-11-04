// frontend/src/layouts/AdminLayout.tsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Truck,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Solo rutas existentes en el router actual
// (Catálogo y Usuarios se añadirán en sprints futuros)
const NAV_ITEMS: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard y Reportes', icon: LayoutDashboard },
  { to: '/admin/inventario', label: 'Kardex e Inventario', icon: Boxes },
  { to: '/admin/compras', label: 'Compras Proveedor', icon: ShoppingCart },
  { to: '/admin/traslados', label: 'Traslados y Novedades', icon: Truck },
];

/**
 * Layout Portal 3: Panel de Administración Central (AdminLayout)
 * Enfoque escritorio para compras, catálogo, traslados, finanzas y reportes.
 */
export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Forma Admin
          </h1>
        </div>

        <nav
          className="flex-1 flex flex-col gap-1 p-3"
          aria-label="Navegación principal del admin"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500">
          Forma POS & Web v2.1
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 flex-shrink-0">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Panel Administrativo
          </h2>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};