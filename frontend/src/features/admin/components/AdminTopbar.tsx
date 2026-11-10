// frontend/src/features/admin/components/AdminTopbar.tsx
import React, { useState, useEffect } from 'react';
import { Menu, MapPin, RefreshCw, ChevronDown } from 'lucide-react';
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

  return (
    <header className="h-[68px] bg-white/95 border-b border-[#E2E8F0] text-[#0F172A] shadow-xs px-4 sm:px-7 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0 relative backdrop-blur-2xl">
      {/* Bisel superior interno especular suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/15 to-transparent pointer-events-none" />

      {/* Izquierda: Botón Hamburguesa Móvil + Breadcrumb Fiel al Mockup */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-xl border border-slate-300 bg-slate-100 text-[#0F172A] hover:bg-slate-200 transition-all shrink-0 cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#64748B] uppercase">
            <span>ADMIN</span>
            <span>/</span>
            <span className="text-[#741C2B] font-black tracking-wide truncate">
              {breadcrumb.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Centro / Derecha: Selector de Sede Global y Píldoras Temporales Fieles al Mockup */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Selector de Sede Global Elegante */}
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-[#741C2B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={sedeSeleccionada}
            onChange={(e) => onSedeChange(e.target.value as SedeAdminFiltro)}
            aria-label="Filtrar por sede"
            className="pl-8 pr-8 py-2 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#741C2B]/60 focus:border-[#741C2B] text-xs font-bold transition-all cursor-pointer backdrop-blur-md appearance-none shadow-xs"
          >
            {SEDES_ADMIN_OPTIONS.map((sede) => (
              <option
                key={sede}
                value={sede}
                className="bg-white text-[#0F172A]"
              >
                {SEDES_LABELS[sede]}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Píldoras de Filtro Temporal: [Hoy] [7 Días] [Este Mes] [Año 2026] */}
        <div className="hidden sm:flex items-center rounded-xl p-1 border bg-[#F1F5F9] border-[#CBD5E1] backdrop-blur-md shadow-2xs">
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
                    ? 'bg-white text-[#741C2B] border border-[#CBD5E1] shadow-xs font-black'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Botón Refrescar Datos */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Sincronizar datos"
            aria-label="Sincronizar datos"
            className="p-2 rounded-xl border border-[#CBD5E1] bg-white text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};

export default AdminTopbar;
