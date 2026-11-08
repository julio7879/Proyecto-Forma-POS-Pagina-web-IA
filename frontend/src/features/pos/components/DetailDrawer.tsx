import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ActivityTimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  user?: string;
  type?: 'success' | 'info' | 'warning' | 'neutral' | 'error';
  badge?: string;
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
    { id: 'detalle', label: 'Información' },
    { id: 'actividad', label: 'Historial' },
  ],
  activeTab = 'detalle',
  onTabChange,
  children,
  activityItems = [],
  footerActions,
  widthClass = 'w-full md:w-[540px]',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-[#27845C]/10 text-[#27845C] border-[#27845C]/30';
      case 'warning':
        return 'bg-[#B77925]/10 text-[#B77925] border-[#B77925]/30';
      case 'danger':
        return 'bg-[#C44848]/10 text-[#C44848] border-[#C44848]/30';
      case 'info':
        return 'bg-[#C49A68]/15 text-[#741C2B] border-[#C49A68]/40';
      default:
        return 'bg-[#F5F3EF] text-[#292827] border-[#E7E0D8]';
    }
  };

  const isTimelineTab = activeTab === 'actividad' || activeTab === 'historial';

  return (
    <>
      {/* Backdrop con Liquid Glass moderado */}
      <div
        className="fixed inset-0 bg-[#292827]/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container: Pantalla completa en móvil (< md), panel lateral en desktop */}
      <div
        className={`fixed top-0 bottom-0 right-0 z-50 ${widthClass} bg-[#FFFFFF] shadow-2xl border-l border-[#E7E0D8] flex flex-col justify-between animate-in slide-in-from-right duration-200 ease-out`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Cabecera del Drawer con vidrio translúcido moderado */}
        <div className="p-4 sm:p-5 border-b border-[#E7E0D8] bg-white/90 backdrop-blur-md shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-[18px] sm:text-[20px] font-black text-[#292827] tracking-tight truncate">
                  {title}
                </h3>
                {badge && (
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${getBadgeClass(
                      badge.variant
                    )}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[13px] text-[#77736E] font-medium truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-[12px] text-[#77736E] hover:text-[#292827] hover:bg-[#F5F3EF] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#741C2B]"
              aria-label="Cerrar panel de detalle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Pestañas (Información / Productos / Historial / Comprobantes) */}
          {tabs && tabs.length > 1 && (
            <div
              role="tablist"
              className="flex items-center gap-1 mt-4 p-1 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] overflow-x-auto"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex-1 py-1.5 px-2.5 rounded-[10px] text-[12px] font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#FFFFFF] text-[#741C2B] shadow-2xs border border-[#E7E0D8] font-extrabold'
                        : 'text-[#77736E] hover:text-[#292827]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cuerpo del Drawer en superficie sólida #FFFFFF */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FFFFFF]">
          {isTimelineTab ? (
            <div className="space-y-4">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                Historial Cronológico de Actividad
              </h4>
              {activityItems.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-[#77736E] bg-[#F5F3EF] rounded-[12px] border border-[#E7E0D8]">
                  No hay registros de actividad previos para este elemento.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E7E0D8]">
                  {activityItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-[#FFFFFF] border-2 border-[#741C2B] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#741C2B]" />
                      </div>

                      <div className="p-3.5 rounded-[12px] bg-[#F5F3EF]/70 border border-[#E7E0D8] text-[13px] space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#77736E] font-medium">
                          <span className="font-mono">{item.timestamp}</span>
                          {item.user && (
                            <span className="font-bold text-[#292827]">
                              {item.user}
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-[#292827]">{item.title}</h5>
                        {item.description && (
                          <p className="text-[#77736E] text-[12px] leading-relaxed">
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
          <div className="p-4 border-t border-[#E7E0D8] bg-[#F5F3EF]/80 shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </>
  );
};

export default DetailDrawer;
