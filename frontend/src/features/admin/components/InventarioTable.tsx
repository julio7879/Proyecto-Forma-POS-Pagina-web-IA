// frontend/src/features/admin/components/InventarioTable.tsx
import { AlertTriangle } from 'lucide-react';
import { InventarioDTO } from '../services/adminService';

interface Props {
  data: InventarioDTO[];
}

export const InventarioTable = ({ data }: Props) => {
  return (
    <div className="glass-mirror-card overflow-x-auto rounded-3xl">
      <table className="w-full text-sm">
        <thead className="bg-[#E7DED2]/85 border-b border-[#50322A]/20">
          <tr className="text-left">
            <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
              Sede
            </th>
            <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs">
              SKU / Producto
            </th>
            <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs text-right">
              Físico
            </th>
            <th className="px-5 py-4 font-extrabold text-[#351912] uppercase tracking-wider text-xs text-right">
              Disponible
            </th>
            <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs text-right">
              Res. Blando
            </th>
            <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs text-right">
              Res. Duro
            </th>
            <th className="px-5 py-4 font-extrabold text-[#50322A] uppercase tracking-wider text-xs text-right">
              No Vendible
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#50322A]/10">
          {data.map((item) => {
            const isStockBajo = item.disponible <= item.umbralStockBajo;
            return (
              <tr
                key={item.id}
                className={`transition-colors hover:bg-white/75 ${
                  isStockBajo ? 'bg-[#D19650]/15' : ''
                }`}
              >
                <td className="px-5 py-4 font-bold text-[#171717]">
                  <div className="flex items-center gap-2">
                    <span className="glass-mirror-pill px-3 py-1 rounded-xl text-xs font-extrabold text-[#351912] border border-[#D19650]/35">
                      {item.sedeNombre}
                    </span>
                    {isStockBajo && (
                      <AlertTriangle
                        className="w-4 h-4 text-[#661521] shrink-0"
                        aria-label="Stock bajo"
                      />
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-mono tabular-nums text-xs font-bold text-[#661521]">
                    {item.sku}
                  </div>
                  <div className="font-bold text-sm text-[#171717] mt-0.5">
                    {item.nombreProducto}
                  </div>
                  <div className="text-xs font-semibold text-[#50322A]">
                    {item.categoriaNombre}
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-mono tabular-nums font-bold text-[#171717]">
                  {item.fisico}
                </td>
                <td className="px-5 py-4 text-right font-mono tabular-nums">
                  <span
                    className={`inline-flex items-center justify-end px-2.5 py-1 rounded-lg text-sm font-black ${
                      isStockBajo
                        ? 'bg-[#661521] text-white border border-[#D19650]/50'
                        : 'bg-[#D19650]/20 text-[#171717] border border-[#D19650]/45'
                    }`}
                  >
                    {item.disponible}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-mono tabular-nums font-semibold text-[#50322A]">
                  {item.reservadoBlando}
                </td>
                <td className="px-5 py-4 text-right font-mono tabular-nums font-semibold text-[#50322A]">
                  {item.reservadoDuro}
                </td>
                <td className="px-5 py-4 text-right font-mono tabular-nums font-semibold text-[#50322A]">
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
