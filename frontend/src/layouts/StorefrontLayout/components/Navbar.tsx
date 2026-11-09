// frontend/src/layouts/StorefrontLayout/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
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
  ChevronDown,
  Search,
} from 'lucide-react';
import { useStorefrontCart } from '../../../features/storefront/context/StorefrontCartContext';
import { FormaLogo } from '../../../components/common/FormaLogo';
import { PredictiveSearch } from '../../../features/storefront/components/PredictiveSearch';
import {
  getPortalAuth,
  clearPortalAuth,
  PORTAL_AUTH_EVENTS,
} from '../../../shared/auth/portalAuthStorage';

const DEPARTAMENTOS_NAV = [
  {
    nombre: 'Ropa',
    icono: '👔',
    tagline: 'Sastrería & lino noble',
    subcategorias: ['Camisas', 'Pantalones', 'Vestidos', 'Chaquetas'],
  },
  {
    nombre: 'Calzado',
    icono: '👞',
    tagline: 'Cuero genuino hecho a mano',
    subcategorias: ['Botines', 'Sandalias', 'Mocasines'],
  },
  {
    nombre: 'Accesorios',
    icono: '👜',
    tagline: 'Marroquinería fina',
    subcategorias: ['Bolsos', 'Cinturones', 'Gorras', 'Joyería'],
  },
  {
    nombre: 'Cosméticos',
    icono: '🌿',
    tagline: 'Fórmulas botánicas andinas',
    subcategorias: ['Sérums', 'Cremas', 'Aceites', 'Tónicos'],
  },
  {
    nombre: 'Artesanías',
    icono: '🏺',
    tagline: 'Sello de origen ancestral',
    subcategorias: ['Wayuu', 'Sombreros', 'Ruanas'],
  },
];

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<'inicio' | 'ofertas' | 'catalogo'>('inicio');
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [dropdownColeccionesOpen, setDropdownColeccionesOpen] = useState(false);
  const [subcatMobileOpen, setSubcatMobileOpen] = useState<string | null>(null);

  // Detección activa de sección en ruta '/' (CLI-001, CLI-002, CLI-022)
  useEffect(() => {
    if (location.pathname !== '/') return;

    const handleScroll = () => {
      const catalogoEl = document.getElementById('catalogo-grid');
      const ofertasEl = document.getElementById('ofertas');
      const scrollY = window.scrollY;

      if (catalogoEl && scrollY + 220 >= catalogoEl.offsetTop) {
        setSeccionActiva('catalogo');
      } else if (ofertasEl && scrollY + 220 >= ofertasEl.offsetTop && scrollY > 120) {
        setSeccionActiva('ofertas');
      } else {
        setSeccionActiva('inicio');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, location.hash]);
  const { totalItems, openCart } = useStorefrontCart();

  const [session, setSession] = useState(() => {
    const auth = getPortalAuth('storefront');
    return {
      token: auth.token,
      usuario: auth.usuario,
    };
  });

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
        const auth = getPortalAuth('storefront');
        setSession({
          token: auth.token,
          usuario: auth.usuario,
        });
      } catch {
        setSession({ token: null, usuario: null });
      }
    };

    const handleStorage = (e: any) => {
      if (e instanceof StorageEvent) {
        if (e.key !== 'forma_storefront_token' && e.key !== 'forma_storefront_usuario') {
          return;
        }
      } else if (e?.key && !e.key.startsWith('forma_storefront_')) {
        return;
      }
      syncSession();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PORTAL_AUTH_EVENTS.STOREFRONT, syncSession);
    syncSession();
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PORTAL_AUTH_EVENTS.STOREFRONT, syncSession);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    clearPortalAuth('storefront');
    setSession({ token: null, usuario: null });
    setMenuAbierto(false);
    navigate('/');
  };

  const handleScrollToSection = (sectionId: string) => {
    setMenuAbierto(false);
    if (sectionId === 'ofertas') setSeccionActiva('ofertas');
    if (sectionId === 'catalogo-grid') setSeccionActiva('catalogo');

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
      <header className="fixed top-2 sm:top-4 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none transition-all duration-300">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <nav
            aria-label="Navegación Principal Tienda FORMA"
            className="rounded-full bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(80,50,42,0.12)] px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4"
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
                <FormaLogo variant="horizontal" size="xs" theme="light" showSubtitle={false} />
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
                  setSeccionActiva('inicio');
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname === '/' && seccionActiva === 'inicio'
                    ? 'bg-[#661521] text-white shadow-sm'
                    : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
                }`}
              >
                Inicio
              </button>

              <button
                type="button"
                onClick={() => handleScrollToSection('ofertas')}
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname === '/' && seccionActiva === 'ofertas'
                    ? 'bg-[#661521] text-white shadow-sm'
                    : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
                }`}
              >
                Ofertas
              </button>

              {/* Botón Catálogo con Menú Desplegable en Cascada (Fig. 5 ARQ-07) */}
              <div
                className="relative"
                onMouseEnter={() => setDropdownColeccionesOpen(true)}
                onMouseLeave={() => setDropdownColeccionesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    navigate('/#catalogo-grid');
                    setTimeout(() => {
                      const el = document.getElementById('catalogo-grid');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                    location.pathname === '/' && seccionActiva === 'catalogo'
                      ? 'bg-[#661521] text-white shadow-sm'
                      : 'text-[#50322A] hover:text-[#661521] hover:bg-white/60'
                  }`}
                  aria-haspopup="true"
                  aria-expanded={dropdownColeccionesOpen}
                >
                  <span>Catálogo</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      dropdownColeccionesOpen ? 'rotate-180 text-[#661521]' : 'text-[#50322A]/60'
                    }`}
                  />
                </button>

                {/* Menú Desplegable en Cascada (Cascading Dropdown Liquid Glass) */}
                {dropdownColeccionesOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 w-[580px] animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_20px_50px_rgba(80,50,42,0.18)] border border-[#E7DED2] text-left">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#50322A]/10">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#D19650]" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#50322A]">
                            Colecciones Oficiales FORMA
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownColeccionesOpen(false);
                            navigate('/#catalogo-grid');
                            setTimeout(() => {
                              const el = document.getElementById('catalogo-grid');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }, 80);
                          }}
                          className="text-xs font-bold text-[#661521] hover:underline cursor-pointer"
                        >
                          Ver catálogo completo &rarr;
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        {DEPARTAMENTOS_NAV.map((dep) => (
                          <div key={dep.nombre} className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDropdownColeccionesOpen(false);
                                navigate(`/?categoria=${encodeURIComponent(dep.nombre)}#catalogo-grid`);
                                setTimeout(() => {
                                  const el = document.getElementById('catalogo-grid');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }, 80);
                              }}
                              className="w-full text-left font-bold text-xs text-[#50322A] hover:text-[#661521] flex items-center gap-1 group/item"
                            >
                              <span>{dep.icono}</span>
                              <span className="group-hover/item:underline">{dep.nombre}</span>
                            </button>

                            <ul className="space-y-1 text-[11px] text-[#50322A]/70 list-none p-0 m-0">
                              {dep.subcategorias.map((sub) => (
                                <li key={sub}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDropdownColeccionesOpen(false);
                                      navigate(
                                        `/?categoria=${encodeURIComponent(dep.nombre)}&subcategoria=${encodeURIComponent(sub)}#catalogo-grid`
                                      );
                                      setTimeout(() => {
                                        const el = document.getElementById('catalogo-grid');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                      }, 80);
                                    }}
                                    className="hover:text-[#661521] hover:underline transition-colors block py-0.5 text-left w-full truncate cursor-pointer"
                                  >
                                    {sub}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

            {/* Acciones Derecha: Buscador, Carrito Compacto, Mi Cuenta (Icono) y Botón Hamburguesa Móvil */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Botón de Búsqueda Predictiva Inteligente (Fig. 1) */}
              <button
                type="button"
                onClick={() => setBuscadorAbierto(true)}
                aria-label="Buscar en el catálogo"
                title="Buscador predictivo (lino, seda, calzado, color...)"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/80 hover:bg-white text-[#50322A] hover:text-[#661521] border border-white/90 transition-all shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#50322A]" />
                <span className="sr-only">Buscar prendas</span>
              </button>
              {/* Botón de Bolsa / Carrito Compacto */}
              <Link
                to="/bolsa"
                onClick={(e) => {
                  if (location.pathname !== '/bolsa' && location.pathname !== '/checkout') {
                    e.preventDefault();
                    openCart();
                  }
                }}
                aria-label={`Bolsa (${totalItems})`}
                title={`Carrito de compras (${totalItems})`}
                className="relative inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#661521] hover:bg-[#50322A] text-white transition-all shadow-md active:scale-95 shrink-0 cursor-pointer border border-white/40"
              >
                <ShoppingCart className="w-4 h-4 text-[#D19650]" />
                <span className="sr-only">Bolsa ({totalItems})</span>
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#D19650] text-[#171717] font-mono text-[11px] font-black flex items-center justify-center shadow-xs border border-white">
                  {totalItems}
                </span>
              </Link>

              {/* Botón de Mi Cuenta Compacto (Solo ícono del muñequito/usuario) */}
              {session.token ? (
                <div className="flex items-center gap-1">
                  <Link
                    to="/cuenta"
                    aria-label="Mi Cuenta"
                    title={session.usuario?.nombreCompleto || 'Mi Cuenta'}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#50322A] hover:bg-[#661521] text-white inline-flex items-center justify-center transition-all shadow-sm shrink-0 border border-white/40"
                  >
                    <User className="w-4 h-4 text-[#D19650]" />
                    <span className="sr-only">Mi Cuenta</span>
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
                  to="/cuenta"
                  aria-label="Mi Cuenta"
                  title="Mi Cuenta"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#D19650] hover:bg-[#bf833e] text-white inline-flex items-center justify-center transition-all shadow-sm shrink-0 border border-white/40"
                >
                  <User className="w-4 h-4" />
                  <span className="sr-only">Mi Cuenta</span>
                </Link>
              )}

              {/* BOTÓN HAMBURGUESA MÓVIL (Garantizado siempre visible y táctil en pantallas < md) */}
              <button
                type="button"
                onClick={() => setMenuAbierto((prev) => !prev)}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] md:hidden rounded-full border transition-all shadow-sm active:scale-95 shrink-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#D19650] ${
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
            className="fixed inset-y-0 right-0 w-[88%] max-w-xs sm:max-w-sm bg-[#FAF6EF] shadow-2xl border-l border-white/90 flex flex-col p-4 sm:p-6 animate-in slide-in-from-right duration-300 overflow-y-auto overflow-x-hidden z-10"
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
                className="w-9 h-9 rounded-full bg-white border border-[#50322A]/15 flex items-center justify-center text-[#50322A] hover:bg-[#661521] hover:text-white transition-all shadow-xs cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador Rápido Móvil (Fig. 1 ARQ-07) */}
            <div className="pt-3 pb-1">
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  setBuscadorAbierto(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-[#50322A]/15 text-[#50322A] text-xs font-semibold shadow-xs hover:border-[#661521] transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#661521]" />
                  <span>Buscar lino, seda, calzado, ref...</span>
                </span>
                <span className="text-[10px] font-bold uppercase text-[#D19650]">Buscar</span>
              </button>
            </div>

            {/* Acceso Rápido a Bolsa */}
            <div className="py-3 border-b border-[#50322A]/10">
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
                onClick={() => {
                  setMenuAbierto(false);
                  navigate('/#catalogo-grid');
                  setTimeout(() => {
                    const el = document.getElementById('catalogo-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-bold text-[#50322A] hover:bg-white/80 transition-colors cursor-pointer"
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

              {/* Departamentos & Subcategorías en Cascada Móvil (Fig. 5 ARQ-07) */}
              <div className="pt-3 border-t border-[#50322A]/10 mt-3 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#50322A]/60 px-2 block">
                  Departamentos & Subcategorías
                </span>
                <div className="space-y-1.5">
                  {DEPARTAMENTOS_NAV.map((dep) => {
                    const isExpanded = subcatMobileOpen === dep.nombre;
                    return (
                      <div
                        key={dep.nombre}
                        className="rounded-2xl border border-[#50322A]/10 bg-white/70 overflow-hidden transition-all shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => setSubcatMobileOpen(isExpanded ? null : dep.nombre)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3 text-xs font-bold text-[#50322A] hover:bg-white text-left transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span>{dep.icono}</span>
                            <span>{dep.nombre}</span>
                            <span className="text-[10px] font-normal text-[#50322A]/50">
                              · {dep.tagline}
                            </span>
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#50322A]/50 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[#661521]' : ''
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 bg-[#FAF6EF]/80 border-t border-[#50322A]/10 flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuAbierto(false);
                                navigate(`/?categoria=${encodeURIComponent(dep.nombre)}#catalogo-grid`);
                                setTimeout(() => {
                                  const el = document.getElementById('catalogo-grid');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }, 80);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-[#661521] text-white text-[11px] font-bold shadow-2xs"
                            >
                              Ver Todo {dep.nombre} &rarr;
                            </button>
                            {dep.subcategorias.map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => {
                                  setMenuAbierto(false);
                                  navigate(
                                    `/?categoria=${encodeURIComponent(dep.nombre)}&subcategoria=${encodeURIComponent(sub)}#catalogo-grid`
                                  );
                                  setTimeout(() => {
                                    const el = document.getElementById('catalogo-grid');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }, 80);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#661521]/10 text-[#50322A] text-[11px] font-medium border border-[#50322A]/15 transition-colors"
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* Buscador Predictivo Inteligente con Resultados en Tiempo Real (Fig. 1 ARQ-07) */}
      <PredictiveSearch
        isOpen={buscadorAbierto}
        onClose={() => setBuscadorAbierto(false)}
        onSearchSubmit={(termino) => {
          setBuscadorAbierto(false);
          navigate(`/?q=${encodeURIComponent(termino)}#catalogo-grid`);
          setTimeout(() => {
            const el = document.getElementById('catalogo-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        }}
      />
    </>
  );
};
