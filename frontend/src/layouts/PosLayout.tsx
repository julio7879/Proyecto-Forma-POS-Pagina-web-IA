// frontend/src/layouts/PosLayout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingBag,
  FileText,
  Package,
  RotateCcw,
  ArrowLeftRight,
  Wallet,
  Store,
  Shield,
  User,
  LogOut,
  Lock,
  Mail,
  KeyRound,
  MapPin,
} from 'lucide-react';
import { apiRequest } from '../api/apiClient';
import { FormaLogo } from '../components/common/FormaLogo';

export const SEDES_POS = [
  'Punto Centro (Cúcuta)',
  'Punto Caobos (Cúcuta)',
  'Punto Ocaña',
  'Punto Bucaramanga',
] as const;

export type SedePosNombre = (typeof SEDES_POS)[number];

export interface VendedorConfig {
  correos: string[];
  nombre: string;
  nombreCompleto: string;
  rol: 'VENDEDOR' | 'ADMIN';
  genero: 'F' | 'M';
  sedesAutorizadas: SedePosNombre[] | 'TODAS';
  ubicacionId: number;
}

export const VENDEDORES_SISTEMA: VendedorConfig[] = [
  {
    correos: ['daniela@forma.com', 'vendedor.bucaramanga@forma.com'],
    nombre: 'Daniela',
    nombreCompleto: 'Daniela Gómez',
    rol: 'VENDEDOR',
    genero: 'F',
    sedesAutorizadas: ['Punto Bucaramanga'],
    ubicacionId: 4,
  },
  {
    correos: ['camilo@forma.com', 'vendedor.centro@forma.com'],
    nombre: 'Camilo',
    nombreCompleto: 'Camilo Mendoza',
    rol: 'VENDEDOR',
    genero: 'M',
    sedesAutorizadas: ['Punto Centro (Cúcuta)'],
    ubicacionId: 2,
  },
  {
    correos: ['valeria@forma.com', 'vendedor.caobos@forma.com'],
    nombre: 'Valeria',
    nombreCompleto: 'Valeria Restrepo',
    rol: 'VENDEDOR',
    genero: 'F',
    sedesAutorizadas: ['Punto Caobos (Cúcuta)'],
    ubicacionId: 8,
  },
  {
    correos: ['mateo@forma.com', 'vendedor.ocana@forma.com'],
    nombre: 'Mateo',
    nombreCompleto: 'Mateo Ortiz',
    rol: 'VENDEDOR',
    genero: 'M',
    sedesAutorizadas: ['Punto Ocaña'],
    ubicacionId: 3,
  },
  {
    correos: ['admin@forma.com'],
    nombre: 'Administrador',
    nombreCompleto: 'Administrador General',
    rol: 'ADMIN',
    genero: 'M',
    sedesAutorizadas: 'TODAS',
    ubicacionId: 1,
  },
];

interface UsuarioStorage {
  id?: number | string;
  nombreCompleto?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  ubicacionId?: number;
}

/**
 * Helper para extraer un nombre de vendedor limpio sin sufijos ni sedes repetidas.
 * Previene estrictamente "Daniela vendedora Bucaramanga" o "POS Centro (Cúcuta)".
 */
const getCleanSellerName = (u: UsuarioStorage | null): string => {
  if (!u) return 'Vendedor';
  const raw = u.nombre || u.nombreCompleto || 'Vendedor';
  if (raw.toLowerCase().includes('daniela')) return 'Daniela';
  if (raw.toLowerCase().includes('carlos')) return 'Carlos';

  const cleaned = raw
    .replace(/\(.*?\)/g, '')
    .replace(/vendedor[a]?\s+/gi, '')
    .replace(/pos\s+/gi, '')
    .trim();

  const first = cleaned.split(' ')[0];
  return first || 'Vendedor';
};

/**
 * Layout Portal 2: Terminal Punto de Venta (PosLayout)
 * Sistema de Navegación con Menú Lateral (Sidebar / Hamburguesa) y Header Limpio.
 */
export const PosLayout: React.FC = () => {
  const location = useLocation();

  // Estado del menú lateral: expandido/colapsado
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cajero, setCajero] = useState<UsuarioStorage | null>(null);
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(true);

  // Estados del formulario de autenticación rápida en terminal
  const [correoInput, setCorreoInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [sedeInput, setSedeInput] = useState<SedePosNombre | ''>('Punto Bucaramanga');
  const [sedeActiva, setSedeActiva] = useState<string>('Punto Centro (Cúcuta)');
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Carga y sincronización de usuario logueado y estado de caja
  useEffect(() => {
    const syncUsuario = () => {
      try {
        const raw = localStorage.getItem('usuario');
        if (raw) {
          const parsed = JSON.parse(raw);
          setCajero(parsed);
        } else {
          setCajero(null);
        }
        const rawSede = localStorage.getItem('forma_pos_sede');
        if (rawSede) {
          setSedeActiva(rawSede);
          setSedeInput(rawSede as SedePosNombre);
        }
      } catch {
        setCajero(null);
      }
    };

    const syncCaja = () => {
      try {
        const saved = localStorage.getItem('pos_caja_estado');
        if (saved) {
          setCajaAbierta(saved === 'ABIERTA');
        } else {
          setCajaAbierta(true);
        }
      } catch {
        setCajaAbierta(true);
      }
    };

    syncUsuario();
    syncCaja();

    window.addEventListener('storage', syncUsuario);
    window.addEventListener('storage', syncCaja);
    window.addEventListener('pos-caja-changed', syncCaja);

    return () => {
      window.removeEventListener('storage', syncUsuario);
      window.removeEventListener('storage', syncCaja);
      window.removeEventListener('pos-caja-changed', syncCaja);
    };
  }, []);

  const handleCerrarSesion = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('pos_token');
      setCajero(null);
      window.dispatchEvent(new Event('storage'));
    } catch {
      setCajero(null);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin(null);
    setLoadingAuth(true);

    const correoNormalizado = correoInput.trim().toLowerCase();

    if (!sedeInput) {
      setErrorLogin('Debes seleccionar el punto de venta al que vas a ingresar.');
      setLoadingAuth(false);
      return;
    }

    // Buscar en la configuración oficial de vendedores del sistema
    const vendedorEncontrado = VENDEDORES_SISTEMA.find((v) =>
      v.correos.map((c) => c.toLowerCase()).includes(correoNormalizado)
    );

    // Intentar autenticación vía API si el servidor está en línea
    let apiUsuario: UsuarioStorage | null = null;
    try {
      const response = await apiRequest<{
        datos: {
          token: string;
          usuario: UsuarioStorage;
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo: correoNormalizado, password: passwordInput }),
      });
      apiUsuario = response.datos.usuario;
      localStorage.setItem('token', response.datos.token);
      localStorage.setItem('pos_token', response.datos.token);
    } catch {
      // Si la API no responde (modo terminal local), validamos credencial mínima
      if (!passwordInput || passwordInput.trim().length < 4) {
        setErrorLogin('Por favor ingresa una contraseña válida.');
        setLoadingAuth(false);
        return;
      }
    }

    const esAdmin = apiUsuario?.rol === 'ADMIN' || vendedorEncontrado?.rol === 'ADMIN';

    // Validación estricta de sede asignada
    if (!esAdmin) {
      const vendedor = vendedorEncontrado || {
        nombre: apiUsuario?.nombre || 'Vendedor',
        nombreCompleto: apiUsuario?.nombreCompleto || 'Vendedor POS',
        rol: 'VENDEDOR' as const,
        genero: (apiUsuario?.nombre?.toLowerCase().includes('daniela') || apiUsuario?.nombre?.toLowerCase().includes('valeria'))
          ? ('F' as const)
          : ('M' as const),
        sedesAutorizadas: ['Punto Centro (Cúcuta)'] as SedePosNombre[],
        ubicacionId: apiUsuario?.ubicacionId || 1,
      };

      const cleanSede = (s: string) => s.replace(/\s*\(Cúcuta\)/i, '').trim();

      if (Array.isArray(vendedor.sedesAutorizadas)) {
        const autorizada = vendedor.sedesAutorizadas.includes(sedeInput as SedePosNombre);
        if (!autorizada) {
          const prefijo = vendedor.genero === 'F' ? 'La vendedora' : 'El vendedor';
          const sedeAsig = cleanSede(vendedor.sedesAutorizadas[0] || 'otra sede');
          const sedeIntento = cleanSede(sedeInput);
          setErrorLogin(
            `Acceso Denegado: ${prefijo} ${vendedor.nombre} está asignada a ${sedeAsig} y no tiene autorización para operar en ${sedeIntento}. Contacta al Administrador.`
          );
          setLoadingAuth(false);
          return;
        }
      }
    }

    // Credenciales y sede autorizadas: Guardar sesión
    const usuarioFinal: UsuarioStorage = apiUsuario || {
      id: vendedorEncontrado?.ubicacionId || 10,
      rol: vendedorEncontrado?.rol || 'VENDEDOR',
      nombreCompleto: vendedorEncontrado?.nombreCompleto || 'Vendedor',
      nombre: vendedorEncontrado?.nombre || 'Vendedor',
      correo: correoNormalizado,
      ubicacionId: vendedorEncontrado?.ubicacionId || 1,
    };

    const tokenFinal =
      localStorage.getItem('token') || `pos-token-${usuarioFinal.nombre?.toLowerCase() || 'vendedor'}`;
    localStorage.setItem('token', tokenFinal);
    localStorage.setItem('pos_token', tokenFinal);
    localStorage.setItem('usuario', JSON.stringify(usuarioFinal));
    localStorage.setItem('forma_pos_sede', sedeInput);
    setCajero(usuarioFinal);
    setSedeActiva(sedeInput);
    window.dispatchEvent(new Event('storage'));
    setLoadingAuth(false);
  };

  // Título o breadcrumb de la vista actual
  const activeViewTitle = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/pos/ventas') || p.startsWith('/pos/historial')) {
      return 'Historial de Ventas';
    }
    if (p.startsWith('/pos/venta')) {
      return 'Nueva Venta';
    }
    if (p.startsWith('/pos/pedidos-web') || p.startsWith('/pos/web')) {
      return 'Pedidos Web Asignados';
    }
    if (p.startsWith('/pos/cambios')) {
      return 'Cambios de Mercancía';
    }
    if (p.startsWith('/pos/traslados')) {
      return 'Traslados';
    }
    if (p.startsWith('/pos/caja') || p.startsWith('/pos/arqueo')) {
      return 'Turno y Caja';
    }
    return 'Terminal POS';
  }, [location.pathname]);

  const esAdmin = cajero?.rol === 'ADMIN';
  const nombreVendedor = getCleanSellerName(cajero);

  // 6 Enlaces dedicados de navegación del POS
  const navItems = [
    {
      to: '/pos/venta',
      label: 'Nueva Venta',
      icon: ShoppingBag,
      activeCheck: (p: string) => p === '/pos/venta' || p === '/pos',
    },
    {
      to: '/pos/ventas',
      label: 'Historial de Ventas',
      icon: FileText,
      activeCheck: (p: string) => p.startsWith('/pos/ventas') || p.startsWith('/pos/historial'),
    },
    {
      to: '/pos/pedidos-web',
      label: 'Pedidos Web Asignados',
      icon: Package,
      activeCheck: (p: string) => p.startsWith('/pos/pedidos-web') || p.startsWith('/pos/web'),
    },
    {
      to: '/pos/cambios',
      label: 'Cambios de Mercancía',
      icon: RotateCcw,
      activeCheck: (p: string) => p.startsWith('/pos/cambios'),
    },
    {
      to: '/pos/traslados',
      label: 'Traslados',
      icon: ArrowLeftRight,
      activeCheck: (p: string) => p.startsWith('/pos/traslados'),
    },
    {
      to: '/pos/caja',
      label: 'Turno y Caja',
      icon: Wallet,
      activeCheck: (p: string) => p.startsWith('/pos/caja') || p.startsWith('/pos/arqueo'),
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F4EFEA] text-[#171717] font-sans select-none">
      {/* HEADER SUPERIOR LIMPIO Y SIN SOLAPAMIENTOS (h-14 sm:h-16) */}
      <header className="h-14 sm:h-16 bg-[#1C1311] border-b border-[#D19650]/25 px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-40 text-white shadow-md">
        {/* Lado izquierdo: Botón alternar menú lateral + Logo FORMA POS + Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
            className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-[#D19650]" />
            ) : (
              <Menu className="w-5 h-5 text-white/80" />
            )}
          </button>

          <Link to="/pos/venta" className="flex items-center gap-2.5 shrink-0 group" aria-label="Terminal FORMA POS">
            <FormaLogo variant="horizontal" size="sm" theme="dark" />
            <span className="px-2 py-0.5 rounded-lg bg-[#661521] border border-[#D19650]/60 text-[#D19650] font-black text-[11px] font-mono shadow-xs tracking-wider">
              POS
            </span>
          </Link>

          <div className="h-5 w-px bg-white/20 hidden sm:block shrink-0" />

          {/* Breadcrumb / Título de la vista actual */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#E7DED2]/90 font-medium truncate">
            <span className="text-stone-400">Terminal</span>
            <span className="text-white/30">/</span>
            <span className="text-[#D19650] font-bold truncate">{activeViewTitle}</span>
          </div>
        </div>

        {/* Lado derecho: Estado de caja + Vendedor + Botón Cerrar Sesión */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {cajero && (
            <>
              {/* Badge discreto de estado de caja */}
              <div className="hidden xs:flex items-center">
                {cajaAbierta ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#059669]/20 border border-[#059669]/40 text-emerald-300 text-xs font-bold tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                    <span>Caja Abierta</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Caja Cerrada</span>
                  </span>
                )}
              </div>

              {/* Nombre limpio del vendedor autenticado y sede activa */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#661521] border border-[#D19650]/40 flex items-center justify-center text-[#D19650] font-bold text-xs shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white max-w-[110px] sm:max-w-[140px] truncate leading-tight">
                    {nombreVendedor}
                  </span>
                  {sedeActiva && (
                    <span className="text-[10px] text-[#D19650] font-bold truncate leading-tight">
                      {sedeActiva}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de Cerrar Sesión */}
              <button
                type="button"
                onClick={handleCerrarSesion}
                title="Cerrar Sesión"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* CUERPO PRINCIPAL: SIDEBAR + WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Si no hay usuario logueado, se muestra la tarjeta limpia de acceso a Terminal POS */}
        {!cajero ? (
          <div className="flex-1 flex items-center justify-center p-4 bg-[#F4EFEA] overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#D8CFC6] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Encabezado Editorial Oscuro de Alta Costura */}
              <div className="bg-[#1C1311] p-6 sm:p-8 text-center border-b border-[#D19650]/30 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <FormaLogo variant="full" size="lg" theme="dark" />
                  <h2 className="text-lg font-black text-white tracking-tight mt-4">
                    Acceso a Terminal POS
                  </h2>
                  <p className="text-xs text-[#E7DED2]/80 mt-1 font-medium">
                    Ingreso de vendedor para inicio de turno operativo
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {errorLogin && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {errorLogin}
                  </div>
                )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={correoInput}
                      onChange={(e) => setCorreoInput(e.target.value)}
                      placeholder="vendedor.centro@forma.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#661521] text-xs font-semibold text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#661521] text-xs font-semibold text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Punto de Venta al que Ingresa (Selector Obligatorio)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      required
                      value={sedeInput}
                      onChange={(e) => setSedeInput(e.target.value as SedePosNombre)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#661521] text-xs font-semibold text-stone-800 bg-white"
                    >
                      <option value="" disabled>
                        Selecciona el punto de venta...
                      </option>
                      {SEDES_POS.map((sede) => (
                        <option key={sede} value={sede}>
                          {sede}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-3 px-4 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Lock className="w-4 h-4 text-[#D19650]" />
                  <span>{loadingAuth ? 'Iniciando turno...' : 'Ingresar a Turno POS'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
        ) : (
          <>
            {/* OVERLAY PARA PANTALLAS PEQUEÑAS (< lg) CUANDO EL MENÚ ESTÁ ABIERTO */}
            {sidebarOpen && (
              <div
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
                aria-hidden="true"
              />
            )}

            {/* MENÚ LATERAL (SIDEBAR TIPO DASHBOARD / HAMBURGUESA) */}
            <aside
              className={`
                fixed lg:static top-14 sm:top-16 bottom-0 left-0 z-30
                bg-white border-r border-[#D8CFC6] flex flex-col justify-between
                transition-all duration-200 ease-in-out shadow-sm
                ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden'}
              `}
              aria-label="Menú lateral de módulos POS"
            >
              {/* Sección superior de enlaces */}
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                <div className="px-2 pt-1 pb-3 border-b border-[#D8CFC6]/50 mb-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#1C1311] border border-[#D19650]/30 shadow-xs">
                    <FormaLogo variant="horizontal" size="sm" theme="dark" />
                    <span className="px-2 py-0.5 rounded-md bg-[#661521] border border-[#D19650]/50 text-[#D19650] font-mono text-[10px] font-black">
                      POS
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                  Módulos del Punto
                </div>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.activeCheck(location.pathname);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        // En pantallas móviles cerramos el drawer al navegar
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all
                        ${
                          isActive
                            ? 'bg-[#661521] text-white shadow-sm border-l-4 border-[#D19650]'
                            : 'text-stone-700 hover:bg-[#FAF7F4] hover:text-[#1C1311]'
                        }
                      `}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#D19650]' : 'text-stone-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Sección inferior del menú lateral: Tienda Web, Admin y Cerrar Sesión */}
              <div className="p-3 border-t border-[#D8CFC6]/60 bg-[#FAF7F4]/60 space-y-1 shrink-0">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-[#1C1311] hover:bg-stone-200/60 transition-colors"
                >
                  <Store className="w-4 h-4 text-[#D19650]" />
                  <span>Ir a Tienda Web</span>
                </Link>

                {esAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-[#1C1311] hover:bg-stone-200/60 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-[#661521]" />
                    <span>Panel Administrativo</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100/70 transition-colors cursor-pointer mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </aside>

            {/* ÁREA DE TRABAJO PRINCIPAL (OUTLET) */}
            <main className="flex-1 overflow-hidden p-2 sm:p-3 bg-[#F4EFEA] relative flex flex-col">
              <Outlet />
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default PosLayout;
