import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Store, Building2, ShoppingBag, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { apiRequest } from '../../../api/apiClient';

interface RoleOption {
  key: string;
  label: string;
  sublabel: string;
  correo?: string;
  password?: string;
  targetPath: string;
  icon: React.FC<{ className?: string }>;
}

const SANDBOX_ROLES: RoleOption[] = [
  {
    key: 'global',
    label: 'Global',
    sublabel: 'Admin Central',
    correo: 'admin@forma.com',
    password: 'Admin2026*',
    targetPath: '/admin/dashboard',
    icon: Shield,
  },
  {
    key: 'cucuta',
    label: 'Cúcuta',
    sublabel: 'POS Centro',
    correo: 'vendedor.centro@forma.com',
    password: 'Vendedor2026*',
    targetPath: '/pos/venta',
    icon: Store,
  },
  {
    key: 'caobos',
    label: 'Caobos',
    sublabel: 'POS Caobos',
    correo: 'vendedor.caobos@forma.com',
    password: 'Vendedor2026*',
    targetPath: '/pos/venta',
    icon: Store,
  },
  {
    key: 'ocana',
    label: 'Ocaña',
    sublabel: 'POS Ocaña',
    correo: 'vendedor.ocana@forma.com',
    password: 'Vendedor2026*',
    targetPath: '/pos/venta',
    icon: ShoppingBag,
  },
  {
    key: 'bga',
    label: 'BGA',
    sublabel: 'POS Bucaramanga',
    correo: 'vendedor.bucaramanga@forma.com',
    password: 'Vendedor2026*',
    targetPath: '/pos/venta',
    icon: Building2,
  },
  {
    key: 'web',
    label: 'Web',
    sublabel: 'Cliente Tienda',
    targetPath: '/',
    icon: User,
  },
];

export const SandboxRoleDock: React.FC<{ activeKey?: string }> = ({ activeKey = 'web' }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState(activeKey);

  const handleSelectRole = async (role: RoleOption) => {
    setSelectedKey(role.key);

    if (role.key === 'web' || !role.correo || !role.password) {
      localStorage.setItem(
        'usuario',
        JSON.stringify({
          id: 999,
          rol: 'CLIENTE',
          nombreCompleto: 'Cliente VIP Forma',
          correo: 'cliente@forma.com',
        })
      );
      localStorage.setItem('token', 'sandbox-cliente-token');
      window.dispatchEvent(new Event('storage'));
      navigate(role.targetPath);
      return;
    }

    setLoadingRole(role.key);
    try {
      const response = await apiRequest<{
        datos: {
          token: string;
          usuario: { id: number; rol: string; nombreCompleto: string; ubicacionId?: number };
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo: role.correo, password: role.password }),
      });

      localStorage.setItem('token', response.datos.token);
      localStorage.setItem('usuario', JSON.stringify(response.datos.usuario));
      window.dispatchEvent(new Event('storage'));
      navigate(role.targetPath);
    } catch {
      // Fallback local para pruebas sin conexión
      localStorage.setItem('token', `sandbox-jwt-${role.key}`);
      localStorage.setItem(
        'usuario',
        JSON.stringify({
          id: role.key === 'global' ? 1 : 2,
          rol: role.key === 'global' ? 'ADMIN' : 'VENDEDOR',
          nombreCompleto: `${role.sublabel} (${role.label})`,
          correo: role.correo,
        })
      );
      window.dispatchEvent(new Event('storage'));
      navigate(role.targetPath);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 select-none">
      {/* Píldora superior de estado Sandbox */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="glass-mirror-pill px-3.5 py-1 rounded-full flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#50322A] hover:border-[#D19650] transition-all shadow-sm"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
        <span>MODO SANDBOX • CAMBIO RÁPIDO DE ROL (1 CLIC)</span>
        {collapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Dock de cristal espejo con los 6 perfiles */}
      {!collapsed && (
        <div className="glass-mirror-pill p-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-xl border border-white/90">
          {SANDBOX_ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedKey === role.key;
            const isLoading = loadingRole === role.key;

            return (
              <button
                key={role.key}
                type="button"
                disabled={!!loadingRole}
                onClick={() => handleSelectRole(role)}
                title={`${role.sublabel} (${role.correo || 'Tienda Pública'})`}
                className={`px-3 py-1.5 rounded-full flex flex-col items-center justify-center min-w-[54px] transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#661521] text-white shadow-md shadow-[#661521]/30 scale-105'
                    : 'text-[#50322A] hover:bg-[#E7DED2]/70 hover:text-[#661521]'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mb-0.5" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 mb-0.5 ${isSelected ? 'text-[#D19650]' : ''}`} />
                )}
                <span className="text-[10px] font-bold leading-none tracking-tight">
                  {role.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
