// frontend/src/layouts/PosLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { apiRequest } from '../api/apiClient';
import { FormaLogo } from '../components/common/FormaLogo';
import { getPortalAuth, setPortalAuth, clearPortalAuth, PORTAL_AUTH_EVENTS, isTestEnv } from '../shared/auth/portalAuthStorage';
import { getSesionAbierta, CAJA_EVENT } from '../features/pos/utils/cajaStore';

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

/**
 * Retorna la lista consolidada de vendedores autorizados en el sistema POS:
 * Combina la plantilla fija oficial con TODOS los vendedores creados dinámicamente
 * por el Administrador desde el módulo de administración ('forma_admin_vendedores').
 */
export const getVendedoresAutorizados = (): VendedorConfig[] => {
  const map = new Map<string, VendedorConfig>();

  // 1. Agregar vendedores oficiales base
  for (const v of VENDEDORES_SISTEMA) {
    for (const c of v.correos) {
      map.set(c.toLowerCase(), { ...v });
    }
  }

  // 2. Leer vendedores creados/asignados en Administración ('forma_admin_vendedores')
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('forma_admin_vendedores');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!item?.correo || item.activo === false) continue;
            const correoKey = item.correo.trim().toLowerCase();
            const existing = map.get(correoKey);
            const sedeNombre = item.ubicacion?.nombre as SedePosNombre | undefined;
            const esAdmin = item.rol === 'ADMIN';
            const rawNombre = item.nombreCompleto || 'Vendedor';
            const firstName = rawNombre.trim().split(' ')[0] || 'Vendedor';

            if (existing) {
              if (sedeNombre && existing.sedesAutorizadas !== 'TODAS') {
                existing.sedesAutorizadas = [sedeNombre];
              }
              if (item.password) {
                (existing as any).password = item.password;
              }
            } else {
              const newConfig: VendedorConfig & { password?: string } = {
                correos: [correoKey],
                nombre: firstName,
                nombreCompleto: rawNombre,
                rol: esAdmin ? 'ADMIN' : 'VENDEDOR',
                genero: firstName.toLowerCase().endsWith('a') ? 'F' : 'M',
                sedesAutorizadas: esAdmin ? 'TODAS' : sedeNombre ? [sedeNombre] : ['Punto Centro (Cúcuta)'],
                ubicacionId: item.ubicacionId || item.ubicacion?.id || 2,
                password: item.password,
              };
              map.set(correoKey, newConfig);
            }
          }
        }
      }
    } catch {
      // Silencioso
    }
  }

  return Array.from(new Set(map.values()));
};

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
 * Navegación limpia con Menú Lateral Compacto (190-210px), Header de Estado de Turno en Vivo
 * y Bloqueo Obligatorio hasta Abrir Turno de Caja (QA-POS-015).
 */
export const PosLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Estado del menú lateral: expandido/colapsado (desktop 190-210px, drawer en móvil)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cajero, setCajero] = useState<UsuarioStorage | null>(null);
  const [, setCajaTick] = useState(0);

  // Estados del formulario de autenticación rápida en terminal
  const [correoInput, setCorreoInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [sedeInput, setSedeInput] = useState<SedePosNombre | ''>('Punto Bucaramanga');
  const [sedeActiva, setSedeActiva] = useState<string>(
    () => localStorage.getItem('forma_pos_sede') || 'Punto Centro (Cúcuta)'
  );
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [roleDeniedNotice, setRoleDeniedNotice] = useState<string | null>(null);

  // Carga y sincronización de usuario logueado y sesión de caja en vivo (cajaStore)
  useEffect(() => {
    const syncUsuario = () => {
      try {
        const auth = getPortalAuth('pos');
        if (auth.isRoleDenied) {
          setCajero(null);
          setRoleDeniedNotice(auth.deniedReason || 'Esta cuenta pertenece a un cliente de Tienda Forma. Solo personal autorizado puede operar la terminal POS.');
        } else if (auth.usuario && (auth.usuario.rol === 'VENDEDOR' || auth.usuario.rol === 'ADMIN')) {
          setCajero(auth.usuario);
          setRoleDeniedNotice(null);
        } else {
          setCajero(null);
          setRoleDeniedNotice(null);
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
      setCajaTick((t) => t + 1);
    };

    syncUsuario();
    syncCaja();

    const handleStorage = (e: any) => {
      if (e instanceof StorageEvent) {
        if (!e.key?.startsWith('forma_pos_') && e.key !== 'forma_caja_sesiones') {
          return;
        }
      } else if (e?.key && !e.key.startsWith('forma_pos_') && e.key !== 'forma_caja_sesiones') {
        return;
      }
      syncUsuario();
      syncCaja();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PORTAL_AUTH_EVENTS.POS, syncUsuario);
    window.addEventListener(CAJA_EVENT, syncCaja);
    window.addEventListener('forma-pos-ledger-update', syncCaja);
    window.addEventListener('pos-caja-changed', syncCaja);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PORTAL_AUTH_EVENTS.POS, syncUsuario);
      window.removeEventListener(CAJA_EVENT, syncCaja);
      window.removeEventListener('forma-pos-ledger-update', syncCaja);
      window.removeEventListener('pos-caja-changed', syncCaja);
    };
  }, []);

  // Consulta en vivo de la sesión abierta en la sede activa (QA-POS-015)
  const sesionAbierta = getSesionAbierta(sedeActiva);
  const cajaEstaAbierta = Boolean(sesionAbierta);

  const handleCerrarSesion = () => {
    try {
      clearPortalAuth('pos');
      setCajero(null);
      setRoleDeniedNotice(null);
    } catch {
      setCajero(null);
    }
  };

  const handlePosLogin = async (e: React.FormEvent) => {
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

    // 0.2 Guardrail DEF-02: Bloqueo explícito si el correo ingresado pertenece a un cliente de la tienda web
    try {
      const sfUserRaw = localStorage.getItem('forma_storefront_usuario');
      if (sfUserRaw) {
        const sfUser = JSON.parse(sfUserRaw);
        if (
          sfUser.rol === 'CLIENTE' &&
          (sfUser.correo?.toLowerCase() === correoNormalizado || sfUser.email?.toLowerCase() === correoNormalizado)
        ) {
          setErrorLogin(
            'Esta cuenta pertenece a un cliente de Tienda Forma. Solo personal autorizado (vendedores creados por el administrador) puede operar la terminal POS.'
          );
          setLoadingAuth(false);
          return;
        }
      }
    } catch {
      // Ignorar fallback
    }

    // Buscar en la lista consolidada de vendedores autorizados (oficiales + creados en administración)
    const todosVendedores = getVendedoresAutorizados();
    const vendedorEncontrado = todosVendedores.find((v) =>
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
        setErrorLogin('Por favor ingresa una contraseña válida (mínimo 4 caracteres).');
        setLoadingAuth(false);
        return;
      }
    }

    // Si la API o el registro local determinan que es rol CLIENTE, rechazar de inmediato
    if (apiUsuario && apiUsuario.rol === 'CLIENTE') {
      setErrorLogin(
        'Esta cuenta pertenece a un cliente de Tienda Forma. Solo personal autorizado (vendedores creados por el administrador) puede operar la terminal POS.'
      );
      setLoadingAuth(false);
      return;
    }

    // Si no está registrado como vendedor ni la API lo reconoció como personal autorizado
    if (!vendedorEncontrado && (!apiUsuario || (apiUsuario.rol !== 'ADMIN' && apiUsuario.rol !== 'VENDEDOR'))) {
      setErrorLogin(
        'Acceso denegado: Esta cuenta no está registrada como vendedor ni personal del sistema POS. Solicite al Administrador la creación de su cuenta en el panel administrativo.'
      );
      setLoadingAuth(false);
      return;
    }

    // Si el vendedor tiene contraseña guardada (creado desde Administración), validarla
    if (vendedorEncontrado && (vendedorEncontrado as any).password) {
      if ((vendedorEncontrado as any).password !== passwordInput) {
        setErrorLogin('Contraseña incorrecta. Verifique sus credenciales.');
        setLoadingAuth(false);
        return;
      }
    }

    const esAdmin = apiUsuario?.rol === 'ADMIN' || vendedorEncontrado?.rol === 'ADMIN';

    // Validación estricta de sede asignada para vendedores
    if (!esAdmin && vendedorEncontrado) {
      const cleanSede = (s: string) => s.replace(/\s*\(Cúcuta\)/i, '').trim().toLowerCase();
      let autorizada = false;
      if (vendedorEncontrado.sedesAutorizadas === 'TODAS') {
        autorizada = true;
      } else if (Array.isArray(vendedorEncontrado.sedesAutorizadas)) {
        autorizada = vendedorEncontrado.sedesAutorizadas.some(
          (s) => cleanSede(s) === cleanSede(sedeInput) || s === sedeInput
        );
      }

      if (!autorizada) {
        const prefijo = vendedorEncontrado.genero === 'F' ? 'La vendedora' : 'El vendedor';
        const sedeAsig = Array.isArray(vendedorEncontrado.sedesAutorizadas) && vendedorEncontrado.sedesAutorizadas[0]
          ? vendedorEncontrado.sedesAutorizadas[0].replace(/\s*\(Cúcuta\)/i, '').trim()
          : 'otra sede';
        const sedeIntento = sedeInput.replace(/\s*\(Cúcuta\)/i, '').trim();
        setErrorLogin(
          `Acceso Denegado: ${prefijo} ${vendedorEncontrado.nombre} está asignada a ${sedeAsig} y no tiene autorización para operar en ${sedeIntento}. Contacta al Administrador.`
        );
        setLoadingAuth(false);
        return;
      }
    }

    // Credenciales y sede autorizadas: Guardar sesión
    const usuarioFinal: UsuarioStorage = {
      id: vendedorEncontrado?.ubicacionId || apiUsuario?.ubicacionId || (apiUsuario as any)?.id || 10,
      rol: (esAdmin ? 'ADMIN' : 'VENDEDOR') as any,
      nombreCompleto: vendedorEncontrado?.nombreCompleto || apiUsuario?.nombreCompleto || 'Vendedor',
      nombre: vendedorEncontrado?.nombre || apiUsuario?.nombre || 'Vendedor',
      correo: correoNormalizado,
      ubicacionId: vendedorEncontrado?.ubicacionId || apiUsuario?.ubicacionId || 2,
    };

    setPortalAuth('pos', {
      token: (apiUsuario as any)?.token || 'jwt-pos-session-' + Date.now(),
      usuario: usuarioFinal,
      sede: sedeInput,
    });
    if (isTestEnv()) {
      localStorage.setItem('usuario', JSON.stringify(usuarioFinal));
      localStorage.setItem('token', (apiUsuario as any)?.token || 'jwt-pos-session-' + Date.now());
    }
    localStorage.setItem('forma_pos_sede', sedeInput);
    setCajero(usuarioFinal);
    setSedeActiva(sedeInput);
    setRoleDeniedNotice(null);
    setLoadingAuth(false);

    // QA-POS-015: Si la sede no tiene sesión de caja abierta, llevar directamente a /pos/caja
    if (!getSesionAbierta(sedeInput)) {
      navigate('/pos/caja');
    }
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
              {roleDeniedNotice && (
                <div className="mb-5 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs space-y-2 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Acceso Restringido para Clientes</span>
                  </div>
                  <p className="font-medium leading-relaxed">
                    {roleDeniedNotice}
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <a
                      href="/"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-200 text-amber-950 font-bold text-[11px] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Ir a Tienda Forma
                    </a>
                  </div>
                </div>
              )}

              {errorLogin && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorLogin}
                </div>
              )}

              <form onSubmit={handlePosLogin} className="space-y-4">
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
                  to={cajaEstaAbierta ? '/pos/venta' : '/pos/caja'}
                  onClick={(e) => {
                    if (!cajaEstaAbierta) {
                      e.preventDefault();
                      navigate('/pos/caja');
                    }
                  }}
                  className="flex items-center gap-1.5 shrink-0 group min-w-0"
                  aria-label="Terminal FORMA POS"
                >
                  <FormaLogo variant="horizontal" size="xs" theme="light" />
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

            {/* Lista de enlaces principales (con bloqueo por candado si la caja está cerrada) */}
            <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.activeCheck(location.pathname);
                const esModuloCaja = item.to === '/pos/caja';
                const bloqueadoPorCaja = !cajaEstaAbierta && !esModuloCaja;

                return (
                  <Link
                    key={item.to}
                    to={bloqueadoPorCaja ? '/pos/caja' : item.to}
                    onClick={(e) => {
                      if (bloqueadoPorCaja) {
                        e.preventDefault();
                        navigate('/pos/caja');
                      }
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    title={
                      bloqueadoPorCaja
                        ? 'Debes abrir el turno de caja antes de usar este módulo'
                        : item.label
                    }
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                      ${
                        isActive
                          ? 'bg-[#661521] text-white shadow-xs'
                          : bloqueadoPorCaja
                          ? 'text-stone-400 hover:bg-amber-50/70 hover:text-amber-900'
                          : 'text-stone-700 hover:bg-[#FAF7F4] hover:text-[#1C1311]'
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-[#D19650]'
                          : bloqueadoPorCaja
                          ? 'text-stone-400'
                          : 'text-stone-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    {bloqueadoPorCaja && <Lock className="w-3.5 h-3.5 ml-auto opacity-75" />}
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
                    title={
                      cajaEstaAbierta && sesionAbierta
                        ? `Caja Abierta (Turno #${sesionAbierta.turnoNumero})`
                        : 'Caja Cerrada · Requiere Apertura'
                    }
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      cajaEstaAbierta ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium px-0.5">
                  <span className="truncate">{sedeActiva.replace(/\s*\(Cúcuta\)/i, '')}</span>
                  <span className={cajaEstaAbierta ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {cajaEstaAbierta ? 'Caja Activa' : 'Cerrada'}
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

          {/* ÁREA DE TRABAJO PRINCIPAL (HEADER DE TURNO + OUTLET) */}
          <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-2 sm:p-2.5 bg-[#F4EFEA] relative flex flex-col gap-2">
            {/* Header superior compacto con estado real de la caja en la sede activa */}
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#D8CFC6] shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#661521]" />
                <span className="font-black text-[#1C1311]">{sedeActiva}</span>
                <span className="text-stone-300">·</span>
                <span className="font-semibold text-stone-600">Cajero: {nombreVendedor}</span>
              </div>

              <div className="flex items-center gap-2">
                {cajaEstaAbierta && sesionAbierta ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-[#059669] border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                    <span>{`Caja Abierta (Turno #${sesionAbierta.turnoNumero})`}</span>
                  </span>
                ) : (
                  <Link
                    to="/pos/caja"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-rose-800 border border-amber-400 hover:bg-amber-200 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-700" />
                    <span>Caja Cerrada · Requiere Apertura</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <Outlet />
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default PosLayout;
