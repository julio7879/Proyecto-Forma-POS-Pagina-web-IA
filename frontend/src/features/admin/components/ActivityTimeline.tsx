import React from 'react';
import { Clock } from 'lucide-react';

export interface ActivityTimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  user?: string;
  type?: 'success' | 'info' | 'warning' | 'neutral' | 'error';
  badge?: string;
}

export interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
  title?: string;
  emptyMessage?: string;
  className?: string;
}

const DOT_COLOR_MAP: Record<NonNullable<ActivityTimelineItem['type']>, string> = {
  success: 'border-[#27845C] bg-[#27845C]',
  info: 'border-[#741C2B] bg-[#741C2B]',
  warning: 'border-[#B77925] bg-[#B77925]',
  error: 'border-[#C44848] bg-[#C44848]',
  neutral: 'border-[#C49A68] bg-[#C49A68]',
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items,
  title = 'Historial Cronológico de Actividad',
  emptyMessage = 'No hay registros de actividad previos para este elemento.',
  className = '',
}) => {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {title && (
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#741C2B]" />
          <span>{title}</span>
        </h4>
      )}

      {items.length === 0 ? (
        <div className="p-6 text-center text-[13px] text-[#77736E] bg-[#F5F3EF] rounded-[12px] border border-[#E7E0D8]">
          {emptyMessage}
        </div>
      ) : (
        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E7E0D8]">
          {items.map((item) => {
            const dotStyle = DOT_COLOR_MAP[item.type || 'info'];
            return (
              <div key={item.id} className="relative group">
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-[#FFFFFF] border-2 border-[#741C2B] flex items-center justify-center shadow-2xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
                </div>

                <div className="p-3.5 rounded-[12px] bg-[#FFFFFF] border border-[#E7E0D8] text-[13px] space-y-1 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#77736E] font-medium">
                    <span className="font-mono">{item.timestamp}</span>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded bg-[#F5F3EF] border border-[#E7E0D8] text-[10px] font-bold text-[#741C2B]">
                          {item.badge}
                        </span>
                      )}
                      {item.user && (
                        <span className="font-bold text-[#292827]">
                          {item.user}
                        </span>
                      )}
                    </div>
                  </div>
                  <h5 className="font-bold text-[#292827] text-[13px] leading-snug">
                    {item.title}
                  </h5>
                  {item.description && (
                    <p className="text-[#77736E] text-[12px] leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
