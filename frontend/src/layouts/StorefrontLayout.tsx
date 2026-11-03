import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './StorefrontLayout/components/Navbar';

/**
 * Layout Portal 1: Tienda Web Pública (StorefrontLayout)
 * Enfoque Mobile-First para compradores (catálogo, carrito, checkout).
 */
export const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pt-24 flex justify-center items-center">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        Cumplimiento Ley 1581 de 2012 (Protección de Datos Personales) · Forma POS & Web v2.1
      </footer>
    </div>
  );
};