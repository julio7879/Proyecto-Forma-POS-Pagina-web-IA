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
      className={`relative rounded-3xl backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] shadow-[0_12px_30px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col text-white ${className}`}
    >
      {/* Reflejo superior especular */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      {/* Vista Móvil (< md): Tarjetas compactas apiladas sin desbordamiento horizontal */}
      {!isLoading && data.length > 0 && (
        <div className="md:hidden divide-y divide-white/10 relative z-10">
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
                    ? 'bg-[#741C2B]/30 border-l-2 border-[#C49A68]'
                    : 'bg-black/20 hover:bg-white/[0.05]'
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
                          <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 shrink-0">
                            {col.header}
                          </span>
                          <div className="text-right font-medium text-white min-w-0">
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

      {/* Vista Desktop (md+): Tabla compacta con filas de 56px en Frosted Acrylic */}
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead className="bg-white/[0.04] border-b border-white/10 select-none">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={`px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-white/60 ${
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

          <tbody className="divide-y divide-white/[0.07]">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse h-[56px]">
                  {columns.map((_, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className="px-4 py-3">
                      <div className="h-4 bg-white/10 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-[#E5BE90] flex items-center justify-center mb-3 shadow-sm">
                      <PackageOpen className="w-6 h-6 text-[#E5BE90]" />
                    </div>
                    <h4 className="text-[14px] font-black text-white">
                      {emptyTitle}
                    </h4>
                    <p className="text-[13px] text-white/60 mt-1">
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
                        ? 'bg-[#741C2B]/35 border-l-2 border-[#C49A68]'
                        : isClickable
                        ? 'hover:bg-white/[0.06] cursor-pointer'
                        : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-white/90 font-medium ${
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
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.03] flex items-center justify-between text-[12px] text-white/70 relative z-10">
          <div>
            Mostrando <span className="font-bold text-white">{data.length}</span>
            {totalRecords !== undefined && (
              <>
                {' '}
                de <span className="font-bold text-white">{totalRecords}</span> registros
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
                className="p-1.5 rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-[12px] font-semibold text-white">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Página siguiente"
                className="p-1.5 rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
