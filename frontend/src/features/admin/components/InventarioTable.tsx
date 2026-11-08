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
      return <ArrowUpDown className="w-3 h-3 text-[#77736E]/50 group-hover:text-[#741C2B] transition-colors" />;
    }
    return direccionOrden === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#741C2B] font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#741C2B] font-bold" />
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E7E0D8] shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[#F5F3EF] border-b border-[#E7E0D8] select-none">
            <tr>
              <th
                onClick={() => onToggleSort?.('sede')}
                className={`px-4 py-3.5 font-extrabold text-[#77736E] uppercase tracking-wider text-[11px] ${
                  onToggleSort ? 'cursor-pointer hover:text-[#741C2B] group' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Sede</span>
                  {renderSortIcon('sede')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('producto')}
                className={`px-4 py-3.5 font-extrabold text-[#77736E] uppercase tracking-wider text-[11px] ${
                  onToggleSort ? 'cursor-pointer hover:text-[#741C2B] group' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>SKU / Producto</span>
                  {renderSortIcon('producto')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('fisico')}
                className={`px-4 py-3.5 font-extrabold text-[#77736E] uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#741C2B] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Físico</span>
                  {renderSortIcon('fisico')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('disponible')}
                className={`px-4 py-3.5 font-extrabold text-[#77736E] uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#741C2B] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Disponible</span>
                  {renderSortIcon('disponible')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('reservadoBlando')}
                className={`px-4 py-3.5 font-extrabold text-[#77736E] uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#741C2B] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Res. Blando</span>
                  {renderSortIcon('reservadoBlando')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('reservadoDuro')}
                className={`px-4 py-3.5 font-extrabold text-[#77736E] uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#741C2B] group' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Res. Duro</span>
                  {renderSortIcon('reservadoDuro')}
                </div>
              </th>
              <th
                onClick={() => onToggleSort?.('noVendible')}
                className={`px-4 py-3.5 font-extrabold text-[#77736E] uppercase tracking-wider text-[11px] text-right ${
                  onToggleSort ? 'cursor-pointer hover:text-[#741C2B] group' : ''
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
          <tbody className="divide-y divide-[#E7E0D8]">
            {data.map((item) => {
              const isStockBajo = item.disponible <= item.umbralStockBajo;
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectRow?.(item)}
                  className={`h-[54px] transition-colors hover:bg-[#F5F3EF]/70 ${
                    onSelectRow ? 'cursor-pointer' : ''
                  } ${isStockBajo ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-3 font-bold text-[#292827]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F5F3EF] border border-[#E7E0D8] text-[11px] font-bold text-[#292827]">
                        {item.sedeNombre}
                      </span>
                      {isStockBajo && (
                        <AlertTriangle
                          className="w-4 h-4 text-[#B77925] shrink-0"
                          aria-label="Stock bajo"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono tabular-nums text-xs font-bold text-[#741C2B]">
                      {item.sku}
                    </div>
                    <div className="font-bold text-xs text-[#292827] mt-0.5 truncate max-w-[280px]">
                      {item.nombreProducto}
                    </div>
                    <div className="text-[11px] font-medium text-[#77736E]">
                      {item.categoriaNombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#292827]">
                    {item.fisico}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <span
                      className={`inline-flex items-center justify-end px-2.5 py-1 rounded-lg text-xs font-black ${
                        isStockBajo
                          ? 'bg-[#C44848]/10 text-[#C44848] border border-[#C44848]/30'
                          : 'bg-[#27845C]/10 text-[#27845C] border border-[#27845C]/30'
                      }`}
                    >
                      {item.disponible}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-[#77736E]">
                    {item.reservadoBlando}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-[#77736E]">
                    {item.reservadoDuro}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-[#77736E]">
                    {item.noVendible}
                  </td>
                  <td className="px-2 py-3 text-center text-[#77736E]">
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-[#E7E0D8] bg-[#F5F3EF]/40 text-xs text-[#77736E] flex justify-between items-center">
        <span>Mostrando <strong className="text-[#292827]">{data.length}</strong> variantes en inventario</span>
        <span className="text-[11px]">Haga clic en cualquier fila para ver el desglose en el panel lateral</span>
      </div>
    </div>
  );
};
