// frontend/src/features/admin/components/InventarioTable.tsx
import React from 'react';
import { AlertTriangle, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { InventarioDTO } from '../services/adminService';

export type CampoOrdenInventario =
  | 'sede'
  | 'producto'
  | 'fisico'
  | 'disponible'
  | 'reservadoBlando'
  | 'reservadoDuro'
  | 'noVendible';

interface Props {
  data: InventarioDTO[];
  onSelectRow?: (item: InventarioDTO) => void;
  campoOrden?: CampoOrdenInventario;
  direccionOrden?: 'asc' | 'desc';
  onToggleSort?: (campo: CampoOrdenInventario) => void;
}

export const InventarioTable: React.FC<Props> = ({
  data,
  onSelectRow,
  campoOrden,
  direccionOrden,
  onToggleSort,
}) => {
  const renderSortIcon = (campo: CampoOrdenInventario) => {
    if (!onToggleSort) return null;
    if (campoOrden !== campo) {
      return <ArrowUpDown className="w-3 h-3 text-white/40 group-hover:text-[#E5BE90] transition-colors" />;
    }
    return direccionOrden === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#E5BE90] font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#E5BE90] font-bold" />
    );
  };

  return (
    <div className="relative rounded-3xl backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] shadow-[0_12px_30px_rgba(0,0,0,0.3)] overflow-hidden text-white">
      {/* Reflejo superior especular */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-white/[0.04] border-b border-white/10 select-none">
            <tr>
              <th
                onClick={() => onToggleSort?.('sede')}
                className={`px-4 py-3.5 font-extrabold text-white/60 uppercase tracking-wider text-[11px] ${
                  onToggleSort ? 'cursor-pointer hover:text-[#E5BE90] group' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Sede</span>
                  {renderSortIcon('sede')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('producto')}
                className={`px-4 py-3.5 font-extrabold text-white/60 uppercase tracking-wider text-[11px] ${
                  onToggleSort ? 'cursor-pointer hover:text-[#E5BE90] group' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>SKU / Producto</span>
                  {renderSortIcon('producto')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('fisico')}
                className={`px-4 py-3.5 font-extrabold text-white/60 uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#E5BE90] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Físico</span>
                  {renderSortIcon('fisico')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('disponible')}
                className={`px-4 py-3.5 font-extrabold text-white/60 uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#E5BE90] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Disponible</span>
                  {renderSortIcon('disponible')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('reservadoBlando')}
                className={`px-4 py-3.5 font-extrabold text-white/60 uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#E5BE90] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Res. Blando</span>
                  {renderSortIcon('reservadoBlando')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('reservadoDuro')}
                className={`px-4 py-3.5 font-extrabold text-white/60 uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#E5BE90] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Res. Duro</span>
                  {renderSortIcon('reservadoDuro')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('noVendible')}
                className={`px-4 py-3.5 font-extrabold text-white/60 uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#E5BE90] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>No Vendible</span>
                  {renderSortIcon('noVendible')}
                </div>
              </th>
              <th className="w-10 px-2 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.07]">
            {data.map((item) => {
              const isStockBajo = item.disponible <= item.umbralStockBajo;
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectRow?.(item)}
                  className={`h-[54px] transition-colors hover:bg-white/[0.06] ${
                    onSelectRow ? 'cursor-pointer' : ''
                  } ${isStockBajo ? 'bg-[#741C2B]/15' : ''}`}
                >
                  <td className="px-4 py-3 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-bold text-white">
                        {item.sedeNombre}
                      </span>
                      {isStockBajo && (
                        <AlertTriangle
                          className="w-4 h-4 text-[#F59E0B] shrink-0"
                          aria-label="Stock bajo"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono tabular-nums text-xs font-bold text-[#E5BE90]">
                      {item.sku}
                    </div>
                    <div className="font-bold text-xs text-white mt-0.5 truncate max-w-[280px]">
                      {item.nombreProducto}
                    </div>
                    <div className="text-[11px] font-medium text-white/60">
                      {item.categoriaNombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-white">
                    {item.fisico}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <span
                      className={`inline-flex items-center justify-end px-2.5 py-1 rounded-lg text-xs font-black ${
                        isStockBajo
                          ? 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/40'
                          : 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40'
                      }`}
                    >
                      {item.disponible}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-white/70">
                    {item.reservadoBlando}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-white/70">
                    {item.reservadoDuro}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-white/70">
                    {item.noVendible}
                  </td>
                  <td className="px-2 py-3 text-center text-white/50">
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-white/10 bg-white/[0.03] text-xs text-white/70 flex justify-between items-center relative z-10">
        <span>Mostrando <strong className="text-white">{data.length}</strong> variantes en inventario</span>
        <span className="text-[11px] text-white/50">Haga clic en cualquier fila para ver el desglose en el panel lateral</span>
      </div>
    </div>
  );
};
