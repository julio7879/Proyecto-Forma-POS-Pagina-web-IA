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
      className={`rounded-[14px] bg-[#FFFFFF] border border-[#E7E0D8] shadow-2xs overflow-hidden flex flex-col ${className}`}
    >
      {/* Vista Móvil (< md): Tarjetas compactas apiladas sin desbordamiento horizontal */}
      {!isLoading && data.length > 0 && (
        <div className="md:hidden divide-y divide-[#E7E0D8]">
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
                    ? 'bg-[#741C2B]/5'
                    : 'bg-[#FFFFFF] hover:bg-[#F5F3EF]/70'
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
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#77736E] shrink-0">
                            {col.header}
                          </span>
                          <div className="text-right font-medium text-[#292827] min-w-0">
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

      {/* Vista Desktop (md+): Tabla compacta con filas de 56px (escala 52-60px) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead className="bg-[#F5F3EF] border-b border-[#E7E0D8]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={`px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#77736E] ${
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

          <tbody className="divide-y divide-[#E7E0D8]">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse h-[56px]">
                  {columns.map((_, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className="px-4 py-3">
                      <div className="h-4 bg-[#E7E0D8]/60 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
                    <div className="w-12 h-12 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] text-[#741C2B] flex items-center justify-center mb-3 shadow-2xs">
                      <PackageOpen className="w-6 h-6 text-[#C49A68]" />
                    </div>
                    <h4 className="text-[14px] font-black text-[#292827]">
                      {emptyTitle}
                    </h4>
                    <p className="text-[13px] text-[#77736E] mt-1">
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
                        ? 'bg-[#741C2B]/5'
                        : isClickable
                        ? 'hover:bg-[#F5F3EF]/80 cursor-pointer active:bg-[#F5F3EF]'
                        : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-[#292827] font-medium ${
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
        <div className="px-4 py-3 border-t border-[#E7E0D8] bg-[#F5F3EF]/60 flex items-center justify-between text-[12px] text-[#77736E]">
          <div>
            Mostrando <span className="font-bold text-[#292827]">{data.length}</span>
            {totalRecords !== undefined && (
              <>
                {' '}
                de <span className="font-bold text-[#292827]">{totalRecords}</span> registros
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
                className="p-1.5 rounded-lg border border-[#E7E0D8] bg-[#FFFFFF] text-[#292827] hover:bg-[#F5F3EF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-[12px] font-semibold text-[#292827]">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Página siguiente"
                className="p-1.5 rounded-lg border border-[#E7E0D8] bg-[#FFFFFF] text-[#292827] hover:bg-[#F5F3EF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
