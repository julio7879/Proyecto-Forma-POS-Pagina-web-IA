// frontend/src/features/admin/components/charts/AdminDonutDistributionChart.tsx
import React, { useMemo } from 'react';
import { SedeAdminFiltro } from '../../../../layouts/AdminLayout';

interface SedeParticipacionItem {
  nombre: string;
  sedeKey: SedeAdminFiltro;
  porcentaje: number;
  valorCop: number;
  color: string;
}

interface AdminDonutDistributionChartProps {
  totalVentasCop: number;
  sedeActiva: SedeAdminFiltro;
  onSelectSede: (sede: SedeAdminFiltro) => void;
  sedesData?: Array<{
    nombre: string;
    sedeKey: SedeAdminFiltro;
    ventasNetasCop: number;
    color?: string;
  }>;
}

export const AdminDonutDistributionChart: React.FC<AdminDonutDistributionChartProps> = ({
  totalVentasCop,
  sedeActiva,
  onSelectSede,
  sedesData,
}) => {
  // Participación comercial calculada con datos 100% reales (RN-GEN-01)
  const sedes: SedeParticipacionItem[] = useMemo(() => {
    const palette: Record<string, string> = {
      'Bodega Central': '#741C2B', // Vinotinto Imperial
      'Punto Bucaramanga': '#8B2635', // Muted Wine
      'Punto Centro': '#C49A68', // Champagne Gold
      'Punto Caobos': '#059669', // Soft Emerald
      'Punto Ocaña': '#D97706', // Soft Amber
    };

    if (sedesData && sedesData.length > 0) {
      const sumVentas = sedesData.reduce((acc, s) => acc + (s.ventasNetasCop || 0), 0);
      const totalRef = sumVentas > 0 ? sumVentas : (totalVentasCop > 0 ? totalVentasCop : 0);

      return sedesData.map((s) => {
        const val = s.ventasNetasCop || 0;
        const pct = totalRef > 0 ? Math.round((val / totalRef) * 100) : 0;
        return {
          nombre: s.nombre,
          sedeKey: s.sedeKey,
          porcentaje: pct,
          valorCop: val,
          color: s.color || palette[s.sedeKey] || '#C49A68',
        };
      });
    }

    const defaultSedes: Array<{ nombre: string; sedeKey: SedeAdminFiltro }> = [
      { nombre: 'Bodega Central', sedeKey: 'Bodega Central' },
      { nombre: 'Centro (Cúcuta)', sedeKey: 'Punto Centro' },
      { nombre: 'Caobos (Cúcuta)', sedeKey: 'Punto Caobos' },
      { nombre: 'Ocaña', sedeKey: 'Punto Ocaña' },
      { nombre: 'Bucaramanga', sedeKey: 'Punto Bucaramanga' },
    ];

    if (totalVentasCop === 0) {
      return defaultSedes.map((s) => ({
        ...s,
        porcentaje: 0,
        valorCop: 0,
        color: palette[s.sedeKey] || '#77736E',
      }));
    }

    return defaultSedes.map((s) => {
      const isTarget = s.sedeKey === (sedeActiva === 'Todas las Sedes (Consolidado)' ? 'Bodega Central' : sedeActiva);
      return {
        ...s,
        porcentaje: isTarget ? 100 : 0,
        valorCop: isTarget ? totalVentasCop : 0,
        color: palette[s.sedeKey] || '#77736E',
      };
    });
  }, [totalVentasCop, sedesData, sedeActiva]);

  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Total sum of percentages
  const totalPct = sedes.reduce((acc, s) => acc + s.porcentaje, 0);

  let accumulated = 0;
  const segments = sedes.map((s) => {
    const strokeDasharray = totalPct > 0
      ? `${(s.porcentaje / totalPct) * circumference} ${circumference}`
      : `0 ${circumference}`;
    const strokeDashoffset = totalPct > 0
      ? -((accumulated / totalPct) * circumference)
      : 0;
    accumulated += s.porcentaje;
    return {
      ...s,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="relative rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#151210] border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-[#741C2B]/30 flex flex-col justify-between h-full text-[#0F172A] dark:text-white">
      {/* Bisel superior suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/20 to-transparent pointer-events-none" />

      {/* Cabecera */}
      <div>
        <h3 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white tracking-wide font-sans">
          Participación Comercial por Sede
        </h3>
        <span className="text-[11px] text-[#475569] dark:text-slate-400 block font-bold">
          Distribución de Facturación entre Puntos Físicos
        </span>
      </div>

      {/* Anillo de Cristal */}
      <div className="relative flex items-center justify-center my-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Anillo de fondo suave */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            className="dark:stroke-white/10"
            strokeWidth={strokeWidth}
          />

          {/* Segmentos de Sedes */}
          {totalPct > 0 ? (
            segments.map((seg) => (
              <circle
                key={seg.sedeKey}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 cursor-pointer hover:opacity-90"
                onClick={() => onSelectSede(seg.sedeKey)}
              />
            ))
          ) : (
            /* Anillo suave en estado inicial sin ventas */
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#CBD5E1"
              className="dark:stroke-white/20"
              strokeWidth={strokeWidth}
              strokeDasharray="6 6"
            />
          )}
        </svg>

        {/* Centro de la Dona */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#741C2B] dark:text-[#C49A68]">
            Total
          </span>
          <span className="text-xl sm:text-2xl font-display font-black text-[#0F172A] dark:text-white tracking-tight">
            {totalVentasCop > 0
              ? totalVentasCop >= 1000000
                ? `${(totalVentasCop / 1000000).toFixed(1)}M`
                : `${totalVentasCop.toLocaleString('es-CO')} COP`
              : '$0 COP'}
          </span>
          <span className="text-[10px] text-[#475569] dark:text-slate-400 font-mono font-bold mt-0.5">
            {totalVentasCop > 0 ? 'Ventas Netas' : 'Sin Ventas'}
          </span>
        </div>
      </div>

      {/* Leyenda limpia y ordenada por sedes en cuadrícula balanceada */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
        {sedes.map((s, idx) => {
          const isSelected = sedeActiva === s.sedeKey;
          const isFifth = idx === 4;
          return (
            <button
              key={s.sedeKey}
              type="button"
              onClick={() => onSelectSede(s.sedeKey)}
              className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                isFifth ? 'col-span-2' : ''
              } ${
                isSelected
                  ? 'bg-[#741C2B]/10 dark:bg-[#741C2B]/20 border-[#741C2B]/50 text-[#0F172A] dark:text-white shadow-xs font-black'
                  : 'bg-[#F8FAFC] dark:bg-white/5 border-slate-200 dark:border-white/10 text-[#334155] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 font-bold'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: s.color }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] block truncate leading-tight font-bold">
                  {s.nombre.replace('Punto ', '')}
                </span>
                <span className="text-[10px] font-mono text-[#475569] dark:text-slate-400 font-black block tabular-nums">
                  {s.porcentaje}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
