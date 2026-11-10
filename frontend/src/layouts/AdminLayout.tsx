// frontend/src/layouts/AdminLayout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormaLogo } from '../components/common/FormaLogo';
import { getPortalAuth, setPortalAuth, clearPortalAuth, PORTAL_AUTH_EVENTS, isTestEnv } from '../shared/auth/portalAuthStorage';
import { AdminSidebar, ADMIN_NAV_GROUPS } from '../features/admin/components/AdminSidebar';
import { AdminTopbar } from '../features/admin/components/AdminTopbar';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export type SedeAdminFiltro =
  | 'Todas las Sedes (Consolidado)'
  | 'Bodega Central'
  | 'Punto Centro'
  | 'Punto Caobos'
  | 'Punto Ocaña'
  | 'Punto Bucaramanga';

export const SEDES_ADMIN_OPTIONS: SedeAdminFiltro[] = [
  'Todas las Sedes (Consolidado)',
  'Bodega Central',
  'Punto Centro',
  'Punto Caobos',
  'Punto Ocaña',
  'Punto Bucaramanga',
];

export const SEDES_LABELS: Record<SedeAdminFiltro, string> = {
  'Todas las Sedes (Consolidado)': 'Todas las Sedes (Consolidado)',
  'Punto Centro': 'Punto Centro (Cúcuta)',
  'Punto Caobos': 'Punto Caobos (Cúcuta)',
  'Punto Ocaña': 'Punto Ocaña',
  'Punto Bucaramanga': 'Punto Bucaramanga',
  'Bodega Central': 'Bodega Central',
};

const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export interface UsuarioAdminSession {
  id?: number;
  nombreCompleto?: string;
  correo?: string;
  rol?: string;
}

/**
 * Layout Portal 3: Panel de Administración Central (AdminLayout)
 * Dirección visual: Light Liquid Glass + Minimalismo Ejecutivo (Fondo #F5F3EF, bordes #E7E0D8, acento #741C2B y #C49A68)
 */
export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Estado de usuario y autenticación estricta (sin auto-logins falsos ni silenciosos)
  const [usuario, setUsuario] = useState<UsuarioAdminSession | null>(() => {
    try {
      const auth = getPortalAuth('admin');
      return auth.usuario?.rol === 'ADMIN' ? (auth.usuario as UsuarioAdminSession) : null;
    } catch {
      return null;
    }
  });

  // Formulario de Acceso Administrativo
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sincronización del selector global de sede
  const [sedeActiva, setSedeActiva] = useState<SedeAdminFiltro>(() => {
    const saved = localStorage.getItem('forma_admin_sede') as SedeAdminFiltro | null;
    return saved && SEDES_ADMIN_OPTIONS.includes(saved)
      ? saved
      : 'Todas las Sedes (Consolidado)';
  });

  // Modo Día Oficial (Liquid Glass Ejecutivo)
  const theme: 'light' = 'light';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forma_admin_theme', 'light');
    }
  }, []);

  useEffect(() => {
    // [F0] Se eliminó la sincronización con credenciales embebidas.

    const handleSedeSync = () => {
      const saved = localStorage.getItem('forma_admin_sede') as SedeAdminFiltro | null;
      if (saved && SEDES_ADMIN_OPTIONS.includes(saved)) {
        setSedeActiva(saved);
      }
    };
    const handleAuthSync = (e: any) => {
      // Ignorar eventos que correspondan a otros portales o claves ajenas
      if (e instanceof StorageEvent) {
        if (e.key !== 'forma_admin_token' && e.key !== 'forma_admin_usuario') {
          return;
        }
      } else if (e?.key && !e.key.startsWith('forma_admin_')) {
        return;
      }
      const auth = getPortalAuth('admin');
      if (auth.usuario?.rol === 'ADMIN') {
        setUsuario(auth.usuario as UsuarioAdminSession);
      } else {
        setUsuario(null);
      }
    };

    window.addEventListener('forma-admin-sede-change', handleSedeSync);
    window.addEventListener('storage', handleSedeSync);
    window.addEventListener('storage', handleAuthSync);
    window.addEventListener(PORTAL_AUTH_EVENTS.ADMIN, handleAuthSync);
    return () => {
      window.removeEventListener('forma-admin-sede-change', handleSedeSync);
      window.removeEventListener('storage', handleSedeSync);
      window.removeEventListener('storage', handleAuthSync);
      window.removeEventListener(PORTAL_AUTH_EVENTS.ADMIN, handleAuthSync);
    };
  }, []);

  const handleSelectSede = (nuevaSede: SedeAdminFiltro) => {
    setSedeActiva(nuevaSede);
    localStorage.setItem('forma_admin_sede', nuevaSede);
    window.dispatchEvent(new Event('forma-admin-sede-change'));
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const isTest = import.meta.env.MODE === 'test';
      const rawBaseUrl = isTest ? '' : (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '');
      const baseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/$/, '') : '';
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        const token = payload?.datos?.token;
        const userObj = payload?.datos?.usuario;

        if (userObj?.rol !== 'ADMIN') {
          setLoginError('Acceso denegado: Esta cuenta no posee privilegios de Administrador.');
          setLoginLoading(false);
          return;
        }

        if (token && userObj) {
          setPortalAuth('admin', { token, usuario: userObj });
          if (isTestEnv()) {
            localStorage.setItem('token', token);
            localStorage.setItem('usuario', JSON.stringify(userObj));
          }
          setUsuario(userObj);
          setLoginLoading(false);
          adminQueryClient.invalidateQueries();
          return;
        }
      }

      // Si el servidor retornó error HTTP (401, 403, etc.)
      const errorPayload = await res.json().catch(() => null);
      setLoginError(
        errorPayload?.mensaje || 'Credenciales inválidas. Verifique su correo y contraseña.'
      );
      setLoginLoading(false);
    } catch {
      setLoginError('Credenciales incorrectas o servidor no disponible.');
      setLoginLoading(false);
    }
  };

  const currentModuleTitle = useMemo(() => {
    for (const group of ADMIN_NAV_GROUPS) {
      const found = group.items.find((item) => location.pathname.startsWith(item.to));
      if (found) return found.label;
    }
    return 'Dashboard Ejecutivo';
  }, [location.pathname]);

  const handleLogout = () => {
    clearPortalAuth('admin');
    setUsuario(null);
  };

  // PANTALLA DE ACCESO ADMINISTRATIVO SI NO ESTÁ AUTENTICADO COMO ADMIN
  if (!usuario || usuario.rol !== 'ADMIN') {
    return (
      <div className="bg-[#F5F3EF] min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
        {/* Esferas decorativas de luz suave */}
        <div
          aria-hidden="true"
          className="absolute w-96 h-96 -top-20 -left-20 rounded-full bg-gradient-to-br from-[#C49A68]/10 to-transparent blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute w-96 h-96 -bottom-20 -right-20 rounded-full bg-gradient-to-tl from-[#741C2B]/10 to-transparent blur-3xl pointer-events-none"
        />

        <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-white border border-[#E7E0D8] shadow-lg relative z-10">
          {/* Logo y Encabezado */}
          <div className="text-center mb-7 flex flex-col items-center">
            <FormaLogo variant="full" size="lg" theme={theme} className="mb-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#741C2B] block mb-1">
              Portal 3 • Gestión Central
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#292827]">
              Acceso Administrativo FORMA
            </h1>
            <p className="text-xs sm:text-sm text-[#77736E] font-medium mt-1.5">
              Ingrese sus credenciales de Administrador para gestionar el sistema.
            </p>
          </div>

          {/* Alerta de Error */}
          {loginError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-[#C44848]/10 border border-[#C44848]/30 flex items-start gap-2.5 text-xs font-bold text-[#C44848]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-tight">{loginError}</span>
            </div>
          )}

          {/* Formulario de Inicio de Sesión */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#77736E] mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#77736E]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="correo@forma.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] focus:ring-1 focus:ring-[#741C2B]/20 transition-all placeholder:text-[#77736E]/60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#77736E] mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#77736E]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] focus:ring-1 focus:ring-[#741C2B]/20 transition-all placeholder:text-[#77736E]/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 px-5 rounded-xl bg-[#741C2B] hover:bg-[#5A1420] text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border border-[#C49A68]/40 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C49A68]" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Panel de Control</span>
                  <ArrowRight className="w-4 h-4 text-[#C49A68]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E7E0D8] text-center">
            <span className="text-[10px] font-semibold text-[#77736E]">
              Exclusivo para la Dirección General y Administración de FORMA.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // PANEL DE CONTROL AUTENTICADO
  return (
    <QueryClientProvider client={adminQueryClient}>
      <div className="admin-light-canvas text-[#0F172A] bg-[#F8FAFC] h-screen flex relative overflow-hidden font-sans">
        {/* Sidebar Lateral Modular Colapsable y Responsive (240px / 72px) en Frosted Glass */}
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          usuario={usuario}
          onLogout={handleLogout}
          theme="light"
        />

        {/* Área de Contenido Principal */}
        <main className="flex-1 h-screen flex flex-col min-w-0 relative z-10 overflow-hidden">
          {/* Header Superior Flotante Translúcido (68px) */}
          <AdminTopbar
            onToggleMobile={() => setMobileOpen((prev) => !prev)}
            sedeSeleccionada={sedeActiva}
            onSedeChange={handleSelectSede}
            breadcrumb={currentModuleTitle}
            onRefresh={() => adminQueryClient.invalidateQueries()}
          />

          {/* Badge sutil de contexto accesible para tests */}
          <span className="sr-only">Panel Administrativo</span>

          {/* Contenido del Módulo Activo */}
          <div className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto max-w-[1700px] w-full mx-auto custom-scrollbar">
            <Outlet />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
};

export default AdminLayout;
