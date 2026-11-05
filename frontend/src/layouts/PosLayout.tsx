// frontend/src/layouts/PosLayout.tsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';

/**
 * Layout Portal 2: Terminal Punto de Venta (PosLayout)
 * Enfoque pantalla completa horizontal >= 1024px sin scroll innecesario (CA-53).
 */
export const PosLayout: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 text-slate-800">
      <header className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-black text-lg text-emerald-400">POS TERMINAL</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Punto de Venta
          </span>
        </div>
        <nav className="flex gap-4 text-xs font-semibold">
          <Link to="/pos/venta" className="hover:text-emerald-400">
            Venta
          </Link>
          <Link to="/pos/caja" className="hover:text-emerald-400">
            Caja y Arqueo
          </Link>
          <Link to="/pos/devoluciones" className="hover:text-emerald-400">
            Cambios / Devolución
          </Link>
          <Link to="/pos/pedidos-web" className="hover:text-emerald-400">
            Despacho Web
          </Link>
        </nav>
      </header>

      {/* FIX CA-53: overflow-hidden impide scroll global.
          Cada sección interna (catálogo, carrito) maneja su propio overflow-y-auto. */}
      <main className="flex-1 overflow-hidden p-3">
        <Outlet />
      </main>
    </div>
  );
};