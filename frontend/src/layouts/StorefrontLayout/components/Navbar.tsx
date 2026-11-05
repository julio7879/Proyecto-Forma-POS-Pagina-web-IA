// frontend/src/layouts/StorefrontLayout/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Tag,
  Grid,
  Info,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { useStorefrontCart } from '../../../features/storefront/context/StorefrontCartContext';
import { formatMoneyCOP } from '../../../features/storefront/services/catalogService';
import { FormaLogo } from '../../../components/common/FormaLogo';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { totalItems, totalCOP } = useStorefrontCart();

  const [session, setSession] = useState(() => ({
    token: localStorage.getItem('token'),
    usuario: (() => {
      try {
        const raw = localStorage.getItem('usuario');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })(),
  }));

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (menuAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  useEffect(() => {
    const syncSession = () => {
      try {
        const raw = localStorage.getItem('usuario');
        setSession({
          token: localStorage.getItem('token'),
          usuario: raw ? JSON.parse(raw) : null,
        });
      } catch {
        setSession({ token: null, usuario: null });
      }
    };

    window.addEventListener('storage', syncSession);
    syncSession();
    return () => window.removeEventListener('storage', syncSession);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setSession({ token: null, usuario: null });
    setMenuAbierto(false);
    navigate('/login');
  };

  const handleScrollToSection = (sectionId: string) => {
    setMenuAbierto(false);
    const doScroll = () => {
      const el =
        document.getElementById(sectionId) ||
        (sectionId === 'ofertas' ? document.getElementById('ofertas-exclusivas') : null) ||
        (sectionId === 'catalogo-grid' ? document.getElementById('catalogo-oficial') : null);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(doScroll, 150);
    } else {
      doScroll();
    }
  };

  const esAdmin = session.usuario?.rol === 'ADMIN';
  const esVendedor = session.usuario?.rol === 'VENDEDOR';

  return (
    <>
      <header className="fixed top-2 sm:top-4 left-0 right-0 z-40 px-2.5 sm:px-4 pointer-events-none transition-all duration-300">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <nav
            aria-label="Navegación Principal Tienda FORMA"
            className="rounded-full bg-white/90 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(80,50,42,0.12)] px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4"
          >
            {/* Logotipo Oficial FORMA de Alta Costura */}
            <Link
              to="/"
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex items-center group shrink-0 hover:opacity-95 transition-opacity"
              aria-label="Ir al inicio de FORMA"
            >
              {/* En móviles extra pequeños (< sm), logo compacto para evitar desbordar el header */}
              <div className="block sm:hidden">
                <FormaLogo variant="horizontal" size="sm" theme="light" showSubtitle={false} />
              </div>
              <div className="hidden sm:block">
                <FormaLogo variant="horizontal" size="md" theme="light" showSubtitle={true} />
              </div>
            </Link>

            {/* Menú Central en Píldora Limpia y Proporcional (Desktop md+) */}
            <div className="hidden md:flex items-center bg-[#E7DED2]/60 border border-white/80 rounded-full p-1 shadow-inner gap-1 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname === '/' && !location.hash
                    ? 'bg-[#661521] text-white shadow-sm'
                    : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
                }`}
              >
                Inicio
              </button>

              <button
                type="button"
                onClick={() => handleScrollToSection('ofertas')}
                className="px-3.5 py-1.5 rounded-full text-[#50322A] hover:text-[#661521] hover:bg-white/60 transition-all"
              >
                Ofertas
              </button>

              <button
                type="button"
                onClick={() => handleScrollToSection('catalogo-grid')}
                className="px-3.5 py-1.5 rounded-full text-[#50322A] hover:text-[#661521] hover:bg-white/60 transition-all"
              >
                Catálogo
              </button>

              <Link
                to="/nosotros"
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname === '/nosotros'
                    ? 'bg-[#661521] text-white shadow-sm'
                    : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
                }`}
              >
                Nosotros
              </Link>

              <Link
                to="/soporte"
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname === '/soporte'
                    ? 'bg-[#661521] text-white shadow-sm'
                    : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
                }`}
              >
                Soporte
              </Link>
            </div>

            {/* Acciones Derecha: Bolsa, Cuenta y Botón Hamburguesa Móvil */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Botón de Bolsa (N) */}
              <Link
                to="/bolsa"
                aria-label={`Ver bolsa de compras con ${totalItems} prendas`}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#661521] hover:bg-[#50322A] text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 shrink-0"
              >
                <ShoppingBag className="w-4 h-4 text-[#D19650]" />
                <span className="hidden xs:inline">Bolsa</span>
                <span className="font-mono">({totalItems})</span>
                {totalCOP > 0 && (
                  <span className="hidden lg:inline font-mono-tabular text-xs px-2 py-0.5 rounded-full bg-white/20 text-[#E7DED2]">
                    {formatMoneyCOP(totalCOP)}
                  </span>
                )}
              </Link>

              {/* Botón de Usuario */}
              {session.token ? (
                <div className="flex items-center gap-1">
                  <Link
                    to="/cuenta"
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-full bg-[#50322A] hover:bg-[#661521] text-white text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0"
                    title={session.usuario?.nombreCompleto || 'Mi Cuenta'}
                  >
                    <User className="w-3.5 h-3.5 text-[#D19650]" />
                    <span className="hidden sm:inline">Mi Cuenta</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                    className="p-1.5 hover:bg-[#661521]/10 text-[#50322A] hover:text-[#661521] rounded-full transition-colors hidden sm:inline-flex shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-full bg-[#D19650] hover:bg-[#bf833e] text-white text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Ingresar</span>
                </Link>
              )}

              {/* BOTÓN HAMBURGUESA MÓVIL (Garantizado siempre visible y táctil en pantallas < md) */}
              <button
                type="button"
                onClick={() => setMenuAbierto((prev) => !prev)}
                className={`p-2 sm:p-2.5 md:hidden rounded-full border transition-all shadow-sm active:scale-95 shrink-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#D19650] ${
                  menuAbierto
                    ? 'bg-[#661521] text-white border-[#D19650]'
                    : 'bg-white/95 text-[#50322A] border-[#50322A]/20 hover:bg-[#FAF6EF]'
                }`}
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú de navegación'}
                aria-expanded={menuAbierto}
              >
                {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* DRAWER / MENÚ MÓVIL SLIDE-OVER DESDE EL LATERAL (Apple Liquid Glass) */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop con desenfoque que cierra al hacer clic */}
          <div
            className="fixed inset-0 bg-[#1C1311]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />

          {/* Panel Lateral Drawer Deslizante */}
          <div
            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#FAF6EF] shadow-2xl border-l border-white/90 flex flex-col p-5 sm:p-6 animate-in slide-in-from-right duration-300 overflow-y-auto z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal móvil"
          >
            {/* Cabecera del Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-[#50322A]/10">
              <FormaLogo variant="horizontal" size="sm" theme="light" showSubtitle={false} />
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                className="w-9 h-9 rounded-full bg-white border border-[#50322A]/15 flex items-center justify-center text-[#50322A] hover:bg-[#661521] hover:text-white transition-all shadow-xs"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Acceso Rápido a Bolsa */}
            <div className="py-4 border-b border-[#50322A]/10">
              <Link
                to="/bolsa"
                onClick={() => setMenuAbierto(false)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#661521] text-white font-bold text-sm shadow-md border border-[#D19650]/40 transition-transform active:scale-98"
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-[#D19650]" />
                  <span>Ver Mi Bolsa</span>
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-[#E7DED2]">
                  {totalItems} {totalItems === 1 ? 'prenda' : 'prendas'}
                </span>
              </Link>
            </div>

            {/* Navegación Principal */}
            <div className="py-4 space-y-1.5 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#50322A]/60 px-3 block mb-2">
                Navegación
              </span>

              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-bold text-[#50322A] hover:bg-white/80 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#D19650]" />
                  <span>Inicio</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#50322A]/40" />
              </button>

              <button
                type="button"
                onClick={() => handleScrollToSection('ofertas')}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-bold text-[#661521] hover:bg-white/80 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-[#661521]" />
                  <span>Ofertas Exclusivas</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#661521]/10 text-[#661521]">
                  Destacados
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleScrollToSection('catalogo-grid')}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-bold text-[#50322A] hover:bg-white/80 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Grid className="w-4 h-4 text-[#D19650]" />
                  <span>Catálogo de Colecciones</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#50322A]/40" />
              </button>

              <Link
                to="/nosotros"
                onClick={() => setMenuAbierto(false)}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-bold text-[#50322A] hover:bg-white/80 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-[#D19650]" />
                  <span>Nosotros (ADN & Origen)</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#50322A]/40" />
              </Link>

              <Link
                to="/soporte"
                onClick={() => setMenuAbierto(false)}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-bold text-[#50322A] hover:bg-white/80 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-[#D19650]" />
                  <span>Centro de Soporte & Envíos DANE</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#50322A]/40" />
              </Link>

              {/* Categorías Rápidas */}
              <div className="pt-3 border-t border-[#50322A]/10 mt-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#50322A]/60 px-3 block mb-2">
                  Colecciones
                </span>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  {['Ropa', 'Calzado', 'Accesorios', 'Cosméticos', 'Artesanías'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleScrollToSection('catalogo-grid')}
                      className="p-2 rounded-xl bg-white/60 hover:bg-white text-xs font-semibold text-[#50322A] text-left border border-[#50322A]/10 transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pie del Drawer: Sesión del Usuario / Acceso */}
            <div className="pt-4 border-t border-[#50322A]/10 space-y-2 mt-auto">
              {session.token ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-white border border-[#50322A]/10">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#50322A]/60 block">
                      Cuenta Activa
                    </span>
                    <p className="text-xs font-bold text-[#171717] truncate">
                      {session.usuario?.nombreCompleto || 'Cliente'}
                    </p>
                    <p className="text-[11px] text-[#50322A]/70 truncate">
                      {session.usuario?.correo || session.usuario?.email || ''}
                    </p>
                  </div>

                  <Link
                    to="/cuenta"
                    onClick={() => setMenuAbierto(false)}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#50322A] text-white text-xs font-bold shadow-sm hover:bg-[#661521] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#D19650]" />
                    <span>Mi Cuenta & Historial</span>
                  </Link>

                  {esAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMenuAbierto(false)}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-[#D19650]/20 text-[#50322A] border border-[#D19650]/40 text-xs font-bold hover:bg-[#D19650]/30 transition-colors"
                    >
                      <span>Panel Administrador</span>
                    </Link>
                  )}

                  {(esAdmin || esVendedor) && (
                    <Link
                      to="/pos/venta"
                      onClick={() => setMenuAbierto(false)}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
                    >
                      <span>Terminal POS</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold text-[#661521] hover:bg-[#661521]/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMenuAbierto(false)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#661521] text-white text-xs font-bold shadow-md hover:bg-[#50101a] border border-[#D19650]/40 transition-transform active:scale-98"
                  >
                    <User className="w-4 h-4 text-[#D19650]" />
                    <span>Ingresar a Mi Cuenta</span>
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMenuAbierto(false)}
                    className="w-full flex items-center justify-center p-2.5 rounded-2xl bg-white border border-[#50322A]/15 text-[#50322A] text-xs font-bold hover:bg-stone-50 transition-colors"
                  >
                    <span>Crear Cuenta / Membresía</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
