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
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-[#741C2B] transition-colors" />;
    }
    return direccionOrden === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#741C2B] font-black" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#741C2B] font-black" />
    );
  };

  return (
    <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden text-[#0F172A]">
      {/* Reflejo superior suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/15 to-transparent pointer-events-none" />

      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[#F8FAFC] border-b-2 border-slate-200 select-none">
            <tr>
              <th
                onClick={() => onToggleSort?.('sede')}
                className={`px-4 py-3.5 font-black text-[#475569] uppercase tracking-wider text-[11px] ${
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
                className={`px-4 py-3.5 font-black text-[#475569] uppercase tracking-wider text-[11px] ${
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
                className={`px-4 py-3.5 font-black text-[#475569] uppercase tracking-wider text-[11px] text-right ${
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
                className={`px-4 py-3.5 font-black text-[#475569] uppercase tracking-wider text-[11px] text-right ${
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
                className={`px-4 py-3.5 font-black text-[#475569] uppercase tracking-wider text-[11px] text-right ${
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
                className={`px-4 py-3.5 font-black text-[#475569] uppercase tracking-wider text-[11px] text-right ${
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
                className={`px-4 py-3.5 font-black text-[#475569] uppercase tracking-wider text-[11px] text-right ${
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
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const isStockBajo = item.disponible <= item.umbralStockBajo;
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectRow?.(item)}
                  className={`h-[54px] transition-colors hover:bg-slate-50 ${
                    onSelectRow ? 'cursor-pointer' : ''
                  } ${isStockBajo ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-3 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-[#0F172A]">
                        {item.sedeNombre}
                      </span>
                      {isStockBajo && (
                        <AlertTriangle
                          className="w-4 h-4 text-amber-600 shrink-0"
                          aria-label="Stock bajo"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono tabular-nums text-xs font-black text-[#741C2B]">
                      {item.sku}
                    </div>
                    <div className="font-black text-xs text-[#0F172A] mt-0.5 truncate max-w-[280px]">
                      {item.nombreProducto}
                    </div>
                    <div className="text-[11px] font-medium text-[#64748B]">
                      {item.categoriaNombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-black text-[#0F172A]">
                    {item.fisico}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <span
                      className={`inline-flex items-center justify-end px-2.5 py-1 rounded-lg text-xs font-black ${
                        isStockBajo
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {item.disponible}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#475569]">
                    {item.reservadoBlando}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#475569]">
                    {item.reservadoDuro}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#475569]">
                    {item.noVendible}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
