import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './StorefrontLayout/components/Navbar';
import { FormaLogo } from '../components/common/FormaLogo';
import {
  StorefrontCartProvider,
  useStorefrontCart,
} from '../features/storefront/context/StorefrontCartContext';
import { CartDrawer } from '../features/storefront/components/CartDrawer';

const StorefrontShell: React.FC = () => {
  const location = useLocation();
  const { items, isCartOpen, closeCart, updateCantidad, removeItem } =
    useStorefrontCart();

  // Restaurar scroll superior automáticamente en cambios de sección / ruta (CLI-003, CLI-004)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else {
      const elementId = location.hash.replace('#', '');
      const el = document.getElementById(elementId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen flex flex-col forma-storefront-canvas text-[#171717]">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 sm:pb-20">
        <Outlet />
      </main>

      {/* Slide-Over de Bolsa de Compras Tipo Espejo */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={items}
        onUpdateCantidad={updateCantidad}
        onRemoveItem={removeItem}
      />

      {/* Footer Editorial en Café Profundo (#50322A) y Dorado (#D19650) */}
      <footer className="bg-[#50322A] text-[#E7DED2] border-t border-[#D19650]/25 py-10 px-4 sm:px-6 mt-auto">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          <div className="md:col-span-2 space-y-3">
            <FormaLogo variant="horizontal" size="lg" theme="dark" />
            <p className="text-xs text-[#E7DED2]/80 max-w-md leading-relaxed">
              Boutique omnicanal colombiana de moda de autor, calzado, accesorios, cosmética botánica y artesanías tradicionales con Sello de Origen Certificado e inventario unificado en tiempo real.
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D19650] mb-2.5">
              4 Boutiques Físicas & Central
            </h3>
            <ul className="space-y-1 text-xs text-[#E7DED2]/85">
              <li>• Punto Centro — Cúcuta (54001)</li>
              <li>• Punto Caobos — Cúcuta (54001)</li>
              <li>• Punto Ocaña — N. de Santander (54498)</li>
              <li>• Punto Bucaramanga — Santander (68001)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D19650] mb-2.5">
              Navegación & Ayuda
            </h3>
            <ul className="space-y-1.5 text-xs text-[#E7DED2]/85">
              <li>
                <Link to="/nosotros" className="hover:text-[#D19650] transition-colors">
                  Nosotros · ADN FORMA & Sello de Origen
                </Link>
              </li>
              <li>
                <Link to="/soporte" className="hover:text-[#D19650] transition-colors">
                  Centro de Soporte, Envíos DANE & Garantías
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="hover:text-[#D19650] transition-colors">
                  Política de Privacidad · Google OAuth
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="hover:text-[#D19650] transition-colors">
                  Condiciones del Servicio (Términos)
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#D19650] transition-colors">
                  Portal de Clientes & Staff
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto pt-5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#E7DED2]/70 gap-2">
          <span>
            Cumplimiento Ley 1581 de 2012 & Estatuto del Consumidor (Ley 1480) · Forma Boutique
          </span>
          <span className="font-mono-tabular text-[#D19650]">
            Precios en pesos colombianos (COP) · Hora Oficial de Colombia
          </span>
        </div>
      </footer>
    </div>
  );
};

/**
 * Layout Portal 1: Tienda Web Pública (StorefrontLayout)
 */
export const StorefrontLayout: React.FC = () => {
  return (
    <StorefrontCartProvider>
      <StorefrontShell />
    </StorefrontCartProvider>
  );
};
