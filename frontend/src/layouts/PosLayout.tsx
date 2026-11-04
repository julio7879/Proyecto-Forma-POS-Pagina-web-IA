import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';

/**
 * Layout Portal 2: Terminal Punto de Venta (PosLayout)
 * Pantalla completa horizontal >= 1024px sin scroll vertical (CA-53).
 */
export const PosLayout: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-200 dark:bg-slate-950 text-slate-800 dark:text-slate-100 select-none">
      {/* Header Ergonómico de Mostrador */}
      <header className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            title="Volver a la Tienda Web"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Web</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-black text-base tracking-tight text-emerald-400">
              FORMA POS
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              Caja 01 · Medellín
            </span>
          </div>
        </div>

        {/* Atajos y Navegación de Caja */}
        <nav className="flex items-center gap-4 text-xs font-semibold">
          <Link
            to="/pos/venta"
            className="text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5"
          >
            Venta Mostrador
          </Link>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Cajero: <strong className="text-white">Sofía V.</strong></span>
          </div>
        </nav>
      </header>

      {/* Contenedor Principal: 100% de alto sin desbordamiento */}
      <main className="flex-1 overflow-hidden p-2.5">
        <Outlet />
      </main>
    </div>
  );
};

export default PosLayout;
