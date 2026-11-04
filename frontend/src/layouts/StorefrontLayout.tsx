import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './StorefrontLayout/components/Navbar';
import { Shield } from 'lucide-react';

/**
 * Layout Portal 1: Tienda Web Pública (StorefrontLayout)
 * Estética Apple Liquid Glass, Mobile-First y cumplimiento Ley 1581 de 2012.
 */
export const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Banner de Cobertura y Retracto Legal */}
      <div className="bg-slate-900 dark:bg-black text-slate-300 text-[11px] py-1.5 px-4 text-center font-medium border-b border-slate-800 z-50 relative">
        <span>Envíos directos desde Medellín, Bogotá y Bodega Central (Cúcuta) · </span>
        <span className="text-indigo-400 font-semibold">5 días hábiles para retracto web (Ley 1480)</span>
      </div>

      <Navbar />

      {/* Contenedor Principal con compensación de barra superior */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <Outlet />
      </main>

      {/* Footer Legal con Cumplimiento Ley 1581 de 2012 (Habeas Data) */}
      <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 py-10 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1.5 font-bold text-slate-900 dark:text-white">
              <Shield className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              <span>Forma POS & Tienda Web Multisede v2.1</span>
            </div>
            <p>
              Precios expresados en Pesos Colombianos (COP) sin decimales. Todos los valores exhibidos incluyen IVA del 19%.
            </p>
            <p className="text-[11px] text-slate-400">
              Operación física y logística: Medellín (Antioquia), Bogotá D.C. y Bodega Central Cúcuta (Norte de Santander).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center md:text-right">
            <a
              href="#habeas-data"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (Ley 1581 de 2012):\n\nForma POS & Web garantiza la protección y confidencialidad de tus datos conforme al Decreto 1377 de 2013. Tus datos solo se procesan para la gestión de pedidos, facturación y trazabilidad de envíos."
                );
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Tratamiento de Datos Personales (Ley 1581 de 2012)
            </a>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="text-[11px]">
              Garantía Legal de 30 Días · 5 Días de Retracto Web
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StorefrontLayout;
