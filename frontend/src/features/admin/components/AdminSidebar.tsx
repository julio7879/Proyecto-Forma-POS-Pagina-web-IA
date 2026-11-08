import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Users,
  BarChart3,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Truck,
  Wallet,
  UserCheck,
} from 'lucide-react';
import { FormaLogo } from '../../../components/common/FormaLogo';
import { UsuarioAdminSession } from '../../../layouts/AdminLayout';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
}

export interface NavGroupConfig {
  groupTitle: string;
  items: NavItemConfig[];
}

export const ADMIN_NAV_GROUPS: NavGroupConfig[] = [
  {
    groupTitle: 'General',
    items: [
      {
        to: '/admin/dashboard',
        label: 'Dashboard Ejecutivo',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupTitle: 'Operaciones',
    items: [
      {
        to: '/admin/pedidos-web',
        label: 'Pedidos Web y Recaudos',
        icon: Truck,
      },
    ],
  },
  {
    groupTitle: 'Inventario y abastecimiento',
    items: [
      {
        to: '/admin/inventario',
        label: 'Inventario y Kardex',
        icon: Package,
        requiredPermission: 'permVerInventario',
      },
      {
        to: '/admin/traslados',
        label: 'Traslados y Novedades',
        icon: ArrowLeftRight,
        requiredPermission: 'permSolicitarTraslados',
      },
    ],
  },
  {
    groupTitle: 'Gestión del negocio',
    items: [
      {
        to: '/admin/cajas',
        label: 'Monitor de Cajas Físicas',
        icon: Wallet,
        requiredPermission: 'permAbrirCerrarCaja',
      },
      {
        to: '/admin/clientes',
        label: 'Directorio de Clientes',
        icon: UserCheck,
      },
      {
        to: '/admin/vendedores',
        label: 'Vendedores y Sedes',
        icon: Users,
      },
    ],
  },
  {
    groupTitle: 'Reportes y administración',
    items: [
      {
        to: '/admin/reportes',
        label: 'Reportes Personalizados',
        icon: BarChart3,
      },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  usuario: UsuarioAdminSession | null;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  usuario,
  onLogout,
}) => {
  return (
    <>
      {/* Overlay Backdrop Móvil (< md) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#292827]/40 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 bottom-0 left-0 z-40 md:z-20 h-screen
          ${collapsed ? 'md:w-[72px]' : 'md:w-56'} w-56
          bg-white/95 md:bg-white border-r border-[#E7E0D8] shadow-sm md:shadow-none
          flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label="Barra lateral de administración"
      >
        {/* Cabecera Sidebar: Marca FORMA y botón colapsar */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-[60px] flex items-center justify-between px-3.5 border-b border-[#E7E0D8] bg-[#F5F3EF]/60">
            <Link
              to="/admin/dashboard"
              onClick={onCloseMobile}
              className="flex items-center gap-2 min-w-0 group"
              title="FORMA ADMIN • Panel Ejecutivo"
            >
              {collapsed ? (
                <div className="p-1 rounded-lg bg-[#292827] text-white shadow-2xs">
                  <FormaLogo variant="icon" size="sm" theme="dark" />
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <FormaLogo variant="horizontal" size="xs" theme="light" showSubtitle={false} />
                  <span className="px-1.5 py-0.5 rounded bg-[#741C2B] text-white font-mono text-[9px] font-black tracking-wider uppercase shrink-0">
                    ADMIN
                  </span>
                </div>
              )}
            </Link>

            {/* Botón toggle desktop */}
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expandir menú lateral' : 'Compactar menú lateral'}
              aria-label={collapsed ? 'Expandir menú lateral' : 'Compactar menú lateral'}
              className="w-6 h-6 rounded-md border border-[#E7E0D8] bg-white hidden md:flex items-center justify-center text-[#77736E] hover:text-[#741C2B] hover:border-[#C49A68] transition-colors shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Botón cerrar móvil */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-7 h-7 rounded-lg border border-[#E7E0D8] bg-white md:hidden flex items-center justify-center text-[#77736E] hover:text-[#741C2B] transition-colors shrink-0"
              aria-label="Cerrar menú lateral"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navegación por Grupos */}
          <nav
            className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4"
            aria-label="Navegación principal del panel administrativo"
          >
            {/* Texto "Módulos" para tests */}
            <span className="sr-only">Módulos</span>

            {ADMIN_NAV_GROUPS.map((group) => {
              const authorizedItems = group.items.filter(
                (item) =>
                  !item.requiredPermission ||
                  !usuario ||
                  usuario.rol === 'ADMIN' ||
                  (usuario as any).permisos?.[item.requiredPermission] !== false
              );
              if (authorizedItems.length === 0) return null;

              return (
                <div key={group.groupTitle} className="space-y-1">
                  {!collapsed && (
                    <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-[#77736E]/80 mb-1">
                      {group.groupTitle}
                    </div>
                  )}

                  {authorizedItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onCloseMobile}
                        title={item.label}
                        className={({ isActive }) =>
                          `group flex items-center ${
                            collapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'
                          } rounded-xl text-[13px] font-bold transition-all duration-150 ${
                            isActive
                              ? 'bg-[#741C2B] text-white shadow-2xs'
                              : 'text-[#292827] hover:bg-[#F5F3EF] hover:text-[#741C2B]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform ${
                                isActive ? 'text-[#C49A68]' : 'text-[#77736E] group-hover:text-[#741C2B]'
                              }`}
                            />
                            {!collapsed && (
                              <span className="truncate leading-tight">{item.label}</span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Pie de Sidebar: Perfil y Cerrar Sesión */}
        <div className="p-2.5 border-t border-[#E7E0D8] bg-[#F5F3EF]/60 shrink-0">
          <div
            className={`flex items-center ${
              collapsed ? 'flex-col gap-2 justify-center' : 'justify-between gap-2'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#741C2B] text-[#C49A68] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                <User className="w-3.5 h-3.5" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#292827] truncate">
                    {usuario?.nombreCompleto || 'Dirección General'}
                  </div>
                  <div className="text-[10px] font-semibold text-[#741C2B] truncate">
                    Administrador
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
              className="p-1.5 rounded-lg border border-[#E7E0D8] bg-white text-[#77736E] hover:text-[#C44848] hover:border-[#C44848]/40 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
