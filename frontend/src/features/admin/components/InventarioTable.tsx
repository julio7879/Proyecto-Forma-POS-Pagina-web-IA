// frontend/src/features/admin/components/InventarioTable.tsx
import { AlertTriangle } from 'lucide-react';
import { InventarioDTO } from '../services/adminService';

interface Props {
  data: InventarioDTO[];
}

export const InventarioTable = ({ data }: Props) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
      <table className="w-full text-xs">
        <thead className="bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800/60">
          <tr className="text-left">
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              Sede
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              SKU / Producto
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] text-right">
              Físico
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] text-right">
              Disponible
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] text-right">
              Res. Blando
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] text-right">
              Res. Duro
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] text-right">
              No Vendible
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {data.map((item) => {
            const isStockBajo = item.disponible <= item.umbralStockBajo;
            return (
              <tr
                key={item.id}
                className={`transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 ${
                  isStockBajo ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    {item.sedeNombre}
                    {isStockBajo && (
                      <AlertTriangle
                        className="w-3.5 h-3.5 text-amber-500"
                        aria-label="Stock bajo"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {item.sku}
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.nombreProducto}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {item.categoriaNombre}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                  {item.fisico}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-bold ${
                    isStockBajo
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {item.disponible}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                  {item.reservadoBlando}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                  {item.reservadoDuro}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                  {item.noVendible}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};