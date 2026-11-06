// frontend/src/layouts/PosLayout.tsx
import React, { useState, useEffect } from 'react';
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
 * Navegación limpia con Menú Lateral Compacto (190-210px), Cero Header Superior Redundante
 * y Bloqueo Estricto por Turno Activo (Opción A).
 */
export const PosLayout: React.FC = () => {
  const location = useLocation();

  // Estado del menú lateral: expandido/colapsado (desktop 190-210px, drawer en móvil)
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

    // 0. Identificador de terminal física persistente
    let localTerminalId = '';
    try {
      localTerminalId = localStorage.getItem('forma_pos_terminal_id') || '';
      if (!localTerminalId) {
        localTerminalId = 'term_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('forma_pos_terminal_id', localTerminalId);
      }
    } catch {
      localTerminalId = 'term_default';
    }

    // 0.1 Bloqueo Estricto por Turno Activo (Opción A):
    // Si la caja ya está abierta en esta terminal pero por otro usuario en otra terminal
    try {
      const cajaTerminalActiva = localStorage.getItem('pos_caja_abierta_terminal');
      const cajaEstado = localStorage.getItem('pos_caja_estado');
      const cajaUsuarioId = localStorage.getItem('pos_caja_usuario_id');
      if (
        cajaEstado === 'ABIERTA' &&
        cajaTerminalActiva &&
        localTerminalId &&
        cajaTerminalActiva !== localTerminalId &&
        cajaUsuarioId &&
        cajaUsuarioId !== correoNormalizado
      ) {
        setErrorLogin(
          'Acceso Bloqueado por Turno Activo: Esta cuenta ya tiene una caja abierta en esta sede en otra terminal. Cierre el turno anterior o solicite relevo de caja.'
        );
        setLoadingAuth(false);
        return;
      }
    } catch {
      // Ignorar fallback
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
        body: JSON.stringify({
          correo: correoNormalizado,
          password: passwordInput,
          terminalId: localTerminalId,
        }),
      });
      apiUsuario = response.datos.usuario;
      localStorage.setItem('token', response.datos.token);
      localStorage.setItem('pos_token', response.datos.token);
    } catch (err: any) {
      if (err?.message?.includes('Acceso Bloqueado por Turno Activo') || err?.status === 409) {
        setErrorLogin(err.message);
        setLoadingAuth(false);
        return;
      }
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
        genero:
          apiUsuario?.nombre?.toLowerCase().includes('daniela') ||
          apiUsuario?.nombre?.toLowerCase().includes('valeria')
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
      ubicacionId: vendedorEncontrado?.ubicacionId || 2,
    };

    localStorage.setItem('usuario', JSON.stringify(usuarioFinal));
    localStorage.setItem('forma_pos_sede', sedeInput);
    setCajero(usuarioFinal);
    setSedeActiva(sedeInput);
    window.dispatchEvent(new Event('storage'));
    setLoadingAuth(false);
  };

  const esAdmin = cajero?.rol === 'ADMIN';
  const nombreVendedor = getCleanSellerName(cajero);

  // 6 Enlaces dedicados de navegación del POS
  const navItems = [
    {
      to: '/pos/venta',
      label: 'Ventas',
      icon: ShoppingBag,
      activeCheck: (p: string) => p === '/pos/venta' || p === '/pos',
    },
    {
      to: '/pos/ventas',
      label: 'Historial',
      icon: FileText,
      activeCheck: (p: string) => p.startsWith('/pos/ventas') || p.startsWith('/pos/historial'),
    },
    {
      to: '/pos/pedidos-web',
      label: 'Pedidos web',
      icon: Package,
      activeCheck: (p: string) => p.startsWith('/pos/pedidos-web') || p.startsWith('/pos/web'),
    },
    {
      to: '/pos/cambios',
      label: 'Cambios',
      icon: RotateCcw,
      activeCheck: (p: string) => p.startsWith('/pos/cambios'),
    },
    {
      to: '/pos/traslados',
      label: 'Inventario',
      icon: ArrowLeftRight,
      activeCheck: (p: string) => p.startsWith('/pos/traslados'),
    },
    {
      to: '/pos/caja',
      label: 'Turno / Caja',
      icon: Wallet,
      activeCheck: (p: string) => p.startsWith('/pos/caja') || p.startsWith('/pos/arqueo'),
    },
  ];

  return (
    <div className="min-h-screen lg:h-screen w-full lg:w-screen overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-[#F4EFEA] text-[#171717] font-sans select-none">
      {/* Si no hay usuario logueado, se muestra la tarjeta centrada de acceso */}
      {!cajero ? (
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 bg-[#F4EFEA] overflow-y-auto">
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
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Correo Electrónico del Vendedor
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={correoInput}
                      onChange={(e) => setCorreoInput(e.target.value)}
                      placeholder="vendedor.centro@forma.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#661521] text-xs font-semibold text-stone-800 placeholder:text-stone-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#661521] text-xs font-semibold text-stone-800 placeholder:text-stone-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
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
          {/* BOTÓN FLOTANTE PARA EXPANDIR SIDEBAR CUANDO ESTÁ CERRADO */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Expandir menú lateral"
              className="fixed top-2.5 left-2.5 z-40 p-2.5 rounded-xl bg-white border border-[#D8CFC6] text-[#661521] shadow-md hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* OVERLAY PARA PANTALLAS PEQUEÑAS (< lg) CUANDO EL MENÚ ESTÁ ABIERTO */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
              aria-hidden="true"
            />
          )}

          {/* MENÚ LATERAL COMPACTO (190-210px en Desktop) */}
          <aside
            className={`
              fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-30
              bg-white border-r border-[#D8CFC6] flex flex-col justify-between
              transition-all duration-200 ease-in-out shadow-xl lg:shadow-xs
              ${
                sidebarOpen
                  ? 'w-[200px] translate-x-0'
                  : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden'
              }
            `}
            aria-label="Menú lateral de módulos POS"
          >
            {/* Cabecera del Sidebar con Logo y Botón Colapsar */}
            <div className="p-3 border-b border-[#D8CFC6]/60 bg-[#FAF7F4]">
              <div className="flex items-center justify-between gap-1">
                <Link
                  to="/pos/venta"
                  className="flex items-center gap-1.5 shrink-0 group min-w-0"
                  aria-label="Terminal FORMA POS"
                >
                  <FormaLogo variant="horizontal" size="xs" theme="dark" />
                  <span className="px-1.5 py-0.5 rounded-md bg-[#661521] border border-[#D19650]/40 text-[#D19650] font-black text-[9px] font-mono shrink-0">
                    POS
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  aria-label={sidebarOpen ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
                  className="p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>

              <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-stone-400 px-1">
                MENÚ
              </div>
            </div>

            {/* Lista de enlaces principales */}
            <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.activeCheck(location.pathname);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                      ${
                        isActive
                          ? 'bg-[#661521] text-white shadow-xs'
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

            {/* Pie del Sidebar: Vendedor, Sede, Estado de Caja y Salir */}
            <div className="p-2.5 border-t border-[#D8CFC6]/60 bg-[#FAF7F4] space-y-2 shrink-0">
              {/* Tarjeta de vendedor compacta */}
              <div className="p-2 rounded-xl bg-white border border-[#D8CFC6]/80 shadow-2xs">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-[#661521] text-[#D19650] flex items-center justify-center font-bold text-[10px] shrink-0">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {nombreVendedor}
                    </span>
                  </div>

                  {/* Dot de estado de caja */}
                  <span
                    title={cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      cajaAbierta ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium px-0.5">
                  <span className="truncate">{sedeActiva.replace(/\s*\(Cúcuta\)/i, '')}</span>
                  <span className={cajaAbierta ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {cajaAbierta ? 'Caja Activa' : 'Cerrada'}
                  </span>
                </div>
              </div>

              {/* Botón Salir / Cerrar Sesión */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                  handleCerrarSesion();
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-100/60 border border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>

              {/* Enlace discreto a Tienda Web o Admin */}
              <div className="flex items-center justify-around pt-1 text-[11px] text-stone-500 font-medium border-t border-stone-200/50">
                <Link to="/" className="hover:text-stone-900 hover:underline">
                  Tienda Web
                </Link>
                {esAdmin && (
                  <Link to="/admin/dashboard" className="text-[#661521] font-bold hover:underline">
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </aside>

          {/* ÁREA DE TRABAJO PRINCIPAL (OUTLET OCUPANDO EL 100% DE LA ALTURA) */}
          <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-2 sm:p-2.5 bg-[#F4EFEA] relative flex flex-col">
            <Outlet />
          </main>
        </>
      )}
    </div>
  );
};

export default PosLayout;
