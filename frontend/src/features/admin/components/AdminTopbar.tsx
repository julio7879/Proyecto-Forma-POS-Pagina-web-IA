// frontend/src/features/admin/components/AdminTopbar.tsx
import React, { useState, useEffect } from 'react';
import { Menu, MapPin, RefreshCw, ChevronDown, Sun, Moon } from 'lucide-react';
import {
  SedeAdminFiltro,
  SEDES_ADMIN_OPTIONS,
  SEDES_LABELS,
} from '../../../layouts/AdminLayout';
import { PeriodoFiltro } from './charts/AdminLineTrendChart';

interface AdminTopbarProps {
  onToggleMobile: () => void;
  sedeSeleccionada: SedeAdminFiltro;
  onSedeChange: (sede: SedeAdminFiltro) => void;
  breadcrumb?: string;
  onRefresh?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onToggleMobile,
  sedeSeleccionada,
  onSedeChange,
  breadcrumb = 'Dashboard Ejecutivo',
  onRefresh,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoFiltro>('HOY');

  // Emitir evento global cuando cambia el período para que el Dashboard lo capture
  const handleCambioPeriodo = (p: PeriodoFiltro) => {
    setPeriodoActivo(p);
    localStorage.setItem('forma_admin_periodo', p);
    window.dispatchEvent(new CustomEvent('forma-admin-periodo-change', { detail: p }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('forma_admin_periodo') as PeriodoFiltro | null;
    if (saved) setPeriodoActivo(saved);
  }, []);

  const isLight = theme === 'light';

  return (
    <header className={`h-[68px] ${isLight ? 'bg-white/90 border-b border-[#E2E8F0] text-[#0F172A] shadow-xs' : 'bg-[#0C0F16]/75 border-b border-white/[0.08] text-white'} px-4 sm:px-7 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0 relative backdrop-blur-2xl`}>
      {/* Bisel superior interno especular suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Izquierda: Botón Hamburguesa Móvil + Breadcrumb Fiel al Mockup */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white hover:bg-white/[0.08] transition-all shrink-0 cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className={`flex items-center gap-2 text-xs font-mono font-bold tracking-wider ${isLight ? 'text-[#64748B]' : 'text-white/50'} uppercase`}>
            <span>ADMIN</span>
            <span>/</span>
            <span className={`${isLight ? 'text-[#741C2B]' : 'text-white'} font-black tracking-wide truncate`}>
              {breadcrumb.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Centro / Derecha: Selector de Sede Global y Píldoras Temporales Fieles al Mockup */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Selector de Sede Global Elegante */}
        <div className="relative">
          <MapPin className={`w-3.5 h-3.5 ${isLight ? 'text-[#741C2B]' : 'text-[#C49A68]'} absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`} />
          <select
            value={sedeSeleccionada}
            onChange={(e) => onSedeChange(e.target.value as SedeAdminFiltro)}
            aria-label="Filtrar por sede"
            className={`pl-8 pr-8 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer backdrop-blur-md appearance-none shadow-xs ${
              isLight
                ? 'border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#741C2B]/60 focus:border-[#741C2B]'
                : 'border-white/[0.09] bg-[#141822]/60 hover:bg-[#181D2A]/70 text-white focus:border-[#C49A68]/70'
            }`}
          >
            {SEDES_ADMIN_OPTIONS.map((sede) => (
              <option key={sede} value={sede} className="bg-[#121620] text-white">
                {SEDES_LABELS[sede]}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-white/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Píldoras de Filtro Temporal: [Hoy] [7 Días] [Este Mes] [Año 2026] */}
        <div className={`hidden sm:flex items-center rounded-xl p-1 border backdrop-blur-md ${
          isLight ? 'bg-[#F1F5F9] border-[#CBD5E1]' : 'bg-[#121620]/70 border-white/[0.08]'
        }`}>
          {(['HOY', '7D', 'MES', 'ANO'] as PeriodoFiltro[]).map((p) => {
            const isSelected = periodoActivo === p;
            const label = p === 'HOY' ? 'Hoy' : p === '7D' ? '7 Días' : p === 'MES' ? 'Este Mes' : 'Año 2026';
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleCambioPeriodo(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? isLight
                      ? 'bg-white text-[#741C2B] border border-[#CBD5E1] shadow-xs font-black'
                      : 'bg-white/[0.14] text-white border border-white/[0.20] shadow-xs font-black'
                    : isLight
                    ? 'text-[#475569] hover:text-[#0F172A]'
                    : 'text-white/60 hover:text-white font-medium'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Botón Alternar Tema Día / Noche */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a Modo Día (Luminoso)' : 'Cambiar a Modo Noche (Oscuro)'}
            aria-label="Alternar modo día y noche"
            className={`p-2 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center justify-center shadow-xs ${
              isLight
                ? 'border-[#CBD5E1] bg-white text-[#741C2B] hover:bg-[#F1F5F9]'
                : 'border-white/[0.09] bg-white/[0.04] text-[#C49A68] hover:text-[#E5BE90] hover:bg-white/[0.08]'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-[#741C2B]" />}
          </button>
        )}

        {/* Botón Refrescar Datos */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Sincronizar datos"
            aria-label="Sincronizar datos"
            className={`p-2 rounded-xl border transition-all shrink-0 cursor-pointer shadow-xs ${
              isLight
                ? 'border-[#CBD5E1] bg-white text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                : 'border-white/[0.09] bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
