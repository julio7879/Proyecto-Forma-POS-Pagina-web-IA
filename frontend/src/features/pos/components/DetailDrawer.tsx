import React from 'react';
import { X } from 'lucide-react';

export interface ActivityTimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  user?: string;
  type?: 'success' | 'info' | 'warning' | 'neutral';
}

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  };
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  activityItems?: ActivityTimelineItem[];
  footerActions?: React.ReactNode;
  widthClass?: string;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  tabs = [
    { id: 'detalle', label: 'Detalle' },
    { id: 'actividad', label: 'Actividad' },
  ],
  activeTab = 'detalle',
  onTabChange,
  children,
  activityItems = [],
  footerActions,
  widthClass = 'w-full sm:w-[480px] lg:w-[540px]',
}) => {
  if (!isOpen) return null;

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'danger':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'info':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      default:
        return 'bg-[#F4EFEA] text-[#1C1311] border-[#50322A]/20';
    }
  };

  return (
    <>
      {/* Backdrop para móviles y tabletas */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className={`fixed top-0 bottom-0 right-0 z-50 ${widthClass} bg-white shadow-2xl border-l border-[#D8CFC6] flex flex-col justify-between animate-in slide-in-from-right duration-250 ease-out`}
        role="dialog"
        aria-label={title}
      >
        {/* Cabecera del Drawer */}
        <div className="p-4 sm:p-5 border-b border-[#D8CFC6] bg-[#FAF7F4] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg sm:text-xl font-black text-[#1C1311] tracking-tight truncate">
                  {title}
                </h3>
                {badge && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeClass(
                      badge.variant
                    )}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-[#50322A] font-medium truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors shrink-0 cursor-pointer"
              aria-label="Cerrar panel de detalle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Pestañas (Detalle / Actividad) */}
          {tabs && tabs.length > 1 && (
            <div className="flex items-center gap-1 mt-4 p-1 rounded-xl bg-[#F4EFEA] border border-[#50322A]/15">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                      isActive
                        ? 'bg-white text-[#1C1311] shadow-xs border border-[#50322A]/15 font-extrabold'
                        : 'text-[#50322A] hover:text-[#1C1311]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cuerpo del Drawer con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'actividad' ? (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#50322A]">
                Historial Cronológico de Actividad
              </h4>
              {activityItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#50322A] bg-[#FAF7F4] rounded-xl border border-[#D8CFC6]">
                  No hay registros de actividad previos para este elemento.
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D8CFC6]">
                  {activityItems.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#661521] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#661521]" />
                      </div>

                      <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                          <span>{item.timestamp}</span>
                          {item.user && (
                            <span className="font-semibold text-stone-700">
                              {item.user}
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-[#1C1311]">{item.title}</h5>
                        {item.description && (
                          <p className="text-stone-600 text-[11px] leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            children
          )}
        </div>

        {/* Pie del Drawer con Acciones Fijas */}
        {footerActions && (
          <div className="p-4 border-t border-[#D8CFC6] bg-[#FAF7F4] shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </>
  );
};

export default DetailDrawer;
