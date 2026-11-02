import React from 'react';
import { Outlet, Link } from 'react-router-dom';

/**
 * Layout Portal 1: Tienda Web Pública (StorefrontLayout)
 * Enfoque Mobile-First para compradores (catálogo, carrito, checkout).
 */
export const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-sm">
        <Link to="/" className="font-bold text-xl tracking-tight text-indigo-600">
          Forma Store
        </Link>
        <nav className="flex gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-indigo-600">Catálogo</Link>
          <Link to="/carrito" className="hover:text-indigo-600">Carrito</Link>
          <Link to="/mis-pedidos" className="hover:text-indigo-600">Mis Pedidos</Link>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Cumplimiento Ley 1581 de 2012 (Protección de Datos Personales) · Forma POS & Web v2.1
      </footer>
    </div>
  );
};
