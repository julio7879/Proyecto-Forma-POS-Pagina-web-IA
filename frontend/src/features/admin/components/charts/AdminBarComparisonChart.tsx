// frontend/src/features/admin/components/charts/AdminBarComparisonChart.tsx
import React, { useState } from 'react';
import { SedeAdminFiltro } from '../../../../layouts/AdminLayout';
import { KpiSedeData } from '../../pages/AdminDashboardPage';

interface AdminBarComparisonChartProps {
  datosSedes: KpiSedeData[];
  sedeActiva: SedeAdminFiltro;
  onSelectSede: (sede: SedeAdminFiltro) => void;
}

export const AdminBarComparisonChart: React.FC<AdminBarComparisonChartProps> = ({
  datosSedes,
  sedeActiva,
  onSelectSede,
}) => {
  const [hoveredSede, setHoveredSede] = useState<string | null>(null);

  // Escala Y reactiva según datos reales
  const maxVenta = Math.max(...datosSedes.map((d) => d.ventasNetasCop), 0);
  const yAxisTicks = maxVenta > 0
    ? [`$${Math.round(maxVenta / 1000000)}M`, `$${Math.round((maxVenta * 0.75) / 1000000)}M`, `$${Math.round((maxVenta * 0.5) / 1000000)}M`, `$${Math.round((maxVenta * 0.25) / 1000000)}M`, '0']
    : ['$5M', '$4M', '$3M', '$1M', '0'];

  const sedesList = [
    { key: 'Bodega Central', label: 'Bodega Central' },
    { key: 'Punto Bucaramanga', label: 'Bucaramanga' },
    { key: 'Punto Centro', label: 'Centro (Cúcuta)' },
    { key: 'Punto Caobos', label: 'Caobos (Cúcuta)' },
    { key: 'Punto Ocaña', label: 'Ocaña' },
  ];

  return (
    <div className="relative rounded-3xl p-5 sm:p-6 overflow-hidden bg-white dark:bg-[#151210] border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-[#741C2B]/30 group text-[#0F172A] dark:text-white h-full flex flex-col justify-between">
      {/* Bisel superior suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/20 to-transparent pointer-events-none" />

      {/* Cabecera en Español: "Comparativa por Sucursales" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white tracking-wide font-sans">
            Comparativa por Sucursales
          </h3>
          <span className="text-[11px] text-[#475569] dark:text-slate-400 block font-bold">
            Rendimiento Comercial por Sede (Venta Mostrador vs Pedidos Web)
          </span>
        </div>

        {/* Leyenda de las barras con tonos de alto contraste */}
        <div className="flex items-center gap-3 text-xs font-black text-[#334155] dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-[#8B2635] to-[#741C2B]" />
            <span>Ventas Mostrador</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-[#C49A68] to-[#A67E48]" />
            <span>Pedidos Web / Stock</span>
          </div>
        </div>
      </div>

      {/* Área del Histograma de Barras */}
      <div className="flex items-end gap-3 sm:gap-4 min-h-[200px] pt-4 pb-2">
        {/* Eje Y */}
        <div className="flex flex-col justify-between h-44 text-[10px] sm:text-[11px] font-mono font-black text-[#475569] dark:text-slate-400 select-none pr-1 sm:pr-2">
          {yAxisTicks.map((tick, index) => (
            <span key={`${tick}-${index}`}>{tick}</span>
          ))}
        </div>

        {/* Contenedor de las Columnas por Sede */}
        <div className="flex-1 grid grid-cols-5 gap-2 sm:gap-4 h-44 border-b border-slate-300 dark:border-white/15 pb-2 relative">
          {/* Líneas horizontales de guía */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full border-b border-slate-200 dark:border-white/10 border-dashed" />
            ))}
          </div>

          {sedesList.map((s) => {
            const isSelected = sedeActiva === s.key;
            const isHovered = hoveredSede === s.key;
            const realData = datosSedes.find((d) => d.sedeKey === s.key);
            const ventas = realData?.ventasNetasCop || 0;
            const unidades = realData?.unidadesInventario || 0;

            // Altura proporcional: si maxVenta es 0, las barras están a nivel base (cero real)
            const wineHeight = maxVenta > 0 ? Math.max(4, Math.round((ventas / maxVenta) * 90)) : 4;
            const goldHeight = unidades > 0 ? Math.min(85, Math.max(6, Math.round((unidades / 400) * 80))) : 4;

            return (
              <div
                key={s.key}
                data-testid={`tarjeta-sede-${s.key}`}
                onClick={() => onSelectSede(s.key as SedeAdminFiltro)}
                onMouseEnter={() => setHoveredSede(s.key)}
                onMouseLeave={() => setHoveredSede(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSede(s.key as SedeAdminFiltro);
                  }
                }}
                className={`relative flex flex-col items-center justify-end h-full cursor-pointer transition-all duration-300 rounded-2xl p-1.5 sm:p-2 z-10 ${
                  isSelected
                    ? 'bg-[#741C2B]/10 dark:bg-[#741C2B]/20 ring-2 ring-[#741C2B] shadow-sm'
                    : isHovered
                    ? 'bg-slate-100 dark:bg-white/10'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {/* Par de Barras Estilizadas con tonos suaves */}
                <div className="flex items-end gap-1 sm:gap-2 w-full justify-center h-32 mb-2">
                  {/* Barra Vino: Ventas Mostrador */}
                  <div
                    style={{ height: `${wineHeight}%` }}
                    className="w-3 sm:w-6 rounded-t-lg sm:rounded-t-xl bg-gradient-to-t from-[#741C2B] to-[#8B2635] border-t border-[#8B2635] shadow-md transition-all duration-500 hover:brightness-110 relative group/bar"
                  >
                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#0F172A] border border-slate-700 text-white text-[9px] font-mono whitespace-nowrap pointer-events-none transition-opacity z-20">
                      {realData?.ventasNetasTexto || '$0 COP'}
                    </div>
                  </div>

                  {/* Barra Oro: Pedidos Web / Stock */}
                  <div
                    style={{ height: `${goldHeight}%` }}
                    className="w-3 sm:w-6 rounded-t-lg sm:rounded-t-xl bg-gradient-to-t from-[#A67E48] to-[#C49A68] border-t border-[#C49A68] shadow-md transition-all duration-500 hover:brightness-110 relative group/bar"
                  >
                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#0F172A] border border-slate-700 text-white text-[9px] font-mono whitespace-nowrap pointer-events-none transition-opacity z-20">
                      {realData?.unidadesInventarioTexto || '0 Unidades'}
                    </div>
                  </div>
                </div>

                {/* Etiqueta de la Sede en el Eje X */}
                <span className={`text-[10px] sm:text-[11px] tracking-tight text-center truncate w-full ${
                  isSelected ? 'text-[#741C2B] dark:text-[#C49A68] font-black' : 'text-[#0F172A] dark:text-slate-200 font-bold'
                }`}>
                  {s.label}
                </span>

                {/* Valor numérico en negrita */}
                <span className="text-[10px] font-mono tabular-nums text-[#475569] font-black mt-0.5">
                  {ventas > 0 ? `$${Math.round(ventas / 1000)}k` : '0 und'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
