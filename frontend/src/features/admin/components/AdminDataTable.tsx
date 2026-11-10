import React from 'react';
import { PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hideOnMobileCard?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  onSelectRow?: (row: T) => void;
  selectedRowKey?: string | number | null;
  emptyTitle?: string;
  emptySubtitle?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalRecords?: number;
  renderMobileCard?: (row: T) => React.ReactNode;
  className?: string;
}

export function AdminDataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  onSelectRow,
  selectedRowKey,
  emptyTitle = 'No hay registros disponibles',
  emptySubtitle = 'No se encontraron datos con los filtros seleccionados.',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalRecords,
  renderMobileCard,
  className = '',
}: AdminDataTableProps<T>) {
  return (
    <div
      className={`relative rounded-3xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col text-[#0F172A] ${className}`}
    >
      {/* Reflejo superior suave */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#741C2B]/15 to-transparent pointer-events-none" />

      {/* Vista Móvil (< md): Tarjetas compactas apiladas sin desbordamiento horizontal */}
      {!isLoading && data.length > 0 && (
        <div className="md:hidden divide-y divide-slate-100 relative z-10">
          {data.map((row) => {
            const key = keyExtractor(row);
            const isSelected = selectedRowKey !== undefined && selectedRowKey === key;
            return (
              <div
                key={`mob-${key}`}
                onClick={() => onSelectRow?.(row)}
                role={onSelectRow ? 'button' : undefined}
                tabIndex={onSelectRow ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onSelectRow && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectRow(row);
                  }
                }}
                className={`p-4 space-y-2.5 transition-colors ${
                  isSelected
                    ? 'bg-[#741C2B]/10 border-l-4 border-l-[#741C2B]'
                    : 'bg-white hover:bg-slate-50'
                } ${onSelectRow ? 'cursor-pointer' : ''}`}
              >
                {renderMobileCard ? (
                  renderMobileCard(row)
                ) : (
                  <div className="space-y-2">
                    {columns
                      .filter((c) => !c.hideOnMobileCard && c.header)
                      .map((col) => (
                        <div
                          key={`mob-col-${col.key}`}
                          className="flex items-start justify-between gap-3 text-[13px]"
                        >
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#475569] shrink-0">
                            {col.header}
                          </span>
                          <div className="text-right font-bold text-[#0F172A] min-w-0">
                            {col.render ? col.render(row) : (row as any)[col.key]}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Desktop (md+): Tabla ejecutiva nítida con contraste de alto impacto */}
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead className="bg-[#F8FAFC] border-b-2 border-slate-200 select-none">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={`px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-[#475569] ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse h-[56px]">
                  {columns.map((_, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#741C2B]/10 border border-[#741C2B]/20 text-[#741C2B] flex items-center justify-center mb-3 shadow-2xs">
                      <PackageOpen className="w-6 h-6 text-[#741C2B]" />
                    </div>
                    <h4 className="text-[14px] font-black text-[#0F172A]">
                      {emptyTitle}
                    </h4>
                    <p className="text-[13px] text-[#475569] font-medium mt-1">
                      {emptySubtitle}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = keyExtractor(row);
                const isClickable = Boolean(onSelectRow);
                const isSelected = selectedRowKey !== undefined && selectedRowKey === key;

                return (
                  <tr
                    key={key}
                    onClick={() => onSelectRow?.(row)}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onSelectRow?.(row);
                      }
                    }}
                    className={`h-[56px] transition-colors ${
                      isSelected
                        ? 'bg-[#741C2B]/10 border-l-4 border-l-[#741C2B]'
                        : isClickable
                        ? 'hover:bg-slate-50 cursor-pointer'
                        : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-[#0F172A] font-medium ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie con conteo y paginación */}
      {!isLoading && data.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-[#F8FAFC] flex items-center justify-between text-[12px] text-[#475569] relative z-10">
          <div>
            Mostrando <span className="font-black text-[#0F172A]">{data.length}</span>
            {totalRecords !== undefined && (
              <>
                {' '}
                de <span className="font-black text-[#0F172A]">{totalRecords}</span> registros
              </>
            )}
          </div>

          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Página anterior"
                className="p-1.5 rounded-lg border border-slate-300 bg-white text-[#0F172A] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-[12px] font-black text-[#0F172A]">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Página siguiente"
                className="p-1.5 rounded-lg border border-slate-300 bg-white text-[#0F172A] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const DataTable = AdminDataTable;
export default AdminDataTable;
