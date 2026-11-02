import React from 'react';
import { Outlet, Link } from 'react-router-dom';

/**
 * Layout Portal 3: Panel de Administración Central (AdminLayout)
 * Enfoque escritorio para compras, catálogo, traslados, finanzas y reportes.
 */
export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col p-4 border-r border-slate-800">
        <h1 className="font-bold text-xl text-white mb-6">Admin Central</h1>
        <nav className="flex flex-col gap-2 text-sm flex-1">
          <Link to="/admin/dashboard" className="p-2 rounded hover:bg-slate-800">Dashboard y Reportes</Link>
          <Link to="/admin/catalogo" className="p-2 rounded hover:bg-slate-800">Catálogo y Precios</Link>
          <Link to="/admin/inventario" className="p-2 rounded hover:bg-slate-800">Kardex e Inventario</Link>
          <Link to="/admin/compras" className="p-2 rounded hover:bg-slate-800">Compras Proveedor</Link>
          <Link to="/admin/traslados" className="p-2 rounded hover:bg-slate-800">Traslados y Novedades</Link>
          <Link to="/admin/usuarios" className="p-2 rounded hover:bg-slate-800">Usuarios y Permisos</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
