import React from 'react';
import { Menu, MapPin, RefreshCw } from 'lucide-react';
import {
  SedeAdminFiltro,
  SEDES_ADMIN_OPTIONS,
  SEDES_LABELS,
} from '../../../layouts/AdminLayout';

interface AdminTopbarProps {
  onToggleMobile: () => void;
  sedeSeleccionada: SedeAdminFiltro;
  onSedeChange: (sede: SedeAdminFiltro) => void;
  breadcrumb?: string;
  onRefresh?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onToggleMobile,
  sedeSeleccionada,
  onSedeChange,
  breadcrumb = 'Dashboard',
  onRefresh,
}) => {
  return (
    <header className="h-[60px] bg-white/90 backdrop-blur-md border-b border-[#E7E0D8] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shrink-0">
      {/* Izquierda: Botón Hamburguesa Móvil + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-xl border border-[#E7E0D8] bg-[#F5F3EF] text-[#292827] hover:text-[#741C2B] transition-colors shrink-0"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#77736E]">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#741C2B] truncate">{breadcrumb}</span>
          </div>
        </div>
      </div>

      {/* Centro / Derecha: Selector de Sede Global y Acciones */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Selector de Sede Global */}
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-[#741C2B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={sedeSeleccionada}
            onChange={(e) => onSedeChange(e.target.value as SedeAdminFiltro)}
            aria-label="Filtrar por sede"
            className="pl-8 pr-7 py-1.5 rounded-xl border border-[#E7E0D8] bg-[#F5F3EF] hover:bg-[#F5F3EF]/80 text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] transition-colors cursor-pointer"
          >
            {SEDES_ADMIN_OPTIONS.map((sede) => (
              <option key={sede} value={sede} className="bg-white text-[#292827]">
                {SEDES_LABELS[sede]}
              </option>
            ))}
          </select>
        </div>

        {/* Botón Refrescar Datos */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Sincronizar datos"
            aria-label="Sincronizar datos"
            className="p-2 rounded-xl border border-[#E7E0D8] bg-white text-[#77736E] hover:text-[#741C2B] hover:bg-[#F5F3EF] transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
