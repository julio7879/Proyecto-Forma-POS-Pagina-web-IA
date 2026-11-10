// frontend/src/features/admin/components/ReportPreviewModal.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Calendar,
  Store,
  Layers,
  Sparkles,
  CheckCircle2,
  Table as TableIcon,
} from 'lucide-react';
import { ReporteItemCatalogo, construirConfigReporte } from '../services/reportCatalogService';
import { generarLibroExcelEjecutivo, descargarBlobExcel } from '../services/excelEngine';

interface Props {
  isOpen: boolean;
  reporte: ReporteItemCatalogo | null;
  onClose: () => void;
  sedeDefecto?: string;
}

const SEDES_DISPONIBLES = [
  'Todas las Sedes (Consolidado)',
  'Bodega Central',
  'Punto Centro',
  'Punto Caobos',
  'Punto Ocaña',
  'Punto Bucaramanga',
];

export const ReportPreviewModal: React.FC<Props> = ({
  isOpen,
  reporte,
  onClose,
  sedeDefecto = 'Todas las Sedes (Consolidado)',
}) => {
  const [periodo, setPeriodo] = useState<'HOY' | '7DIAS' | 'ESTE_MES' | 'TODO'>('ESTE_MES');
  const [sede, setSede] = useState<string>(sedeDefecto);
  const [modoContenido, setModoContenido] = useState<'completo' | 'solo_resumen' | 'solo_detalle'>('completo');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exito, setExito] = useState<boolean>(false);

  // Configuración y datos en vivo calculados para el preview
  const config = useMemo(() => {
    if (!reporte) return null;
    return construirConfigReporte(reporte.id, periodo, sede, modoContenido);
  }, [reporte, periodo, sede, modoContenido]);

  if (!isOpen || !reporte || !config) return null;

  const handleDescargarExcel = async () => {
    try {
      setIsExporting(true);
      const blob = await generarLibroExcelEjecutivo(config);
      const nombreArchivo = `FORMA_${reporte.codigo}_${periodo}_${sede.replace(/\s+/g, '_')}`;
      descargarBlobExcel(blob, nombreArchivo);
      setExito(true);
      setTimeout(() => {
        setExito(false);
      }, 3500);
    } catch (err) {
      console.error('Error generando Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const previewFilas = config.detalleFilas.slice(0, 10);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl overflow-hidden flex flex-col animate-scale-up text-[#0F172A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Modal */}
        <div className="px-6 py-4.5 bg-[#F8FAFC] border-b border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#27845C]/10 border border-[#27845C]/20 flex items-center justify-center text-[#27845C]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#741C2B] uppercase tracking-wider bg-[#741C2B]/10 px-2 py-0.5 rounded-md border border-[#741C2B]/30">
                  {reporte.codigo}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white border border-[#CBD5E1] text-[10px] font-black text-[#475569]">
                  {reporte.areaTrabajo}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A] font-display mt-0.5">
                {reporte.titulo}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#475569] hover:text-[#0F172A] hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal: Filtros y Previsualización */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Descripción */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#475569] leading-relaxed font-bold">
            {reporte.descripcion}
          </div>

          {/* Barra de Configuración de Exportación */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-[#0F172A] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#741C2B]" />
              <span>Configuración del Libro Excel</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Filtro Periodo */}
              <div>
                <label className="block text-[11px] font-black text-[#475569] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#741C2B]" />
                  <span>Periodo de Consulta</span>
                </label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#CBD5E1] text-xs font-black text-[#0F172A] focus:outline-none focus:border-[#741C2B] shadow-2xs cursor-pointer"
                >
                  <option value="HOY">Hoy (Fecha Oficial)</option>
                  <option value="7DIAS">Últimos 7 Días</option>
                  <option value="ESTE_MES">Este Mes (En curso)</option>
                  <option value="TODO">Todo el Historial</option>
                </select>
              </div>

              {/* Filtro Sede */}
              <div>
                <label className="block text-[11px] font-black text-[#475569] mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-[#741C2B]" />
                  <span>Sede / Sucursal</span>
                </label>
                <select
                  value={sede}
                  onChange={(e) => setSede(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#CBD5E1] text-xs font-black text-[#0F172A] focus:outline-none focus:border-[#741C2B] shadow-2xs cursor-pointer"
                >
                  {SEDES_DISPONIBLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contenido del Libro */}
              <div>
                <label className="block text-[11px] font-black text-[#475569] mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#741C2B]" />
                  <span>Contenido del Libro</span>
                </label>
                <select
                  value={modoContenido}
                  onChange={(e) => setModoContenido(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#CBD5E1] text-xs font-black text-[#0F172A] focus:outline-none focus:border-[#741C2B] shadow-2xs cursor-pointer"
                >
                  <option value="completo">Libro Completo (Resumen + Detalle)</option>
                  <option value="solo_resumen">Solo Resumen Ejecutivo</option>
                  <option value="solo_detalle">Solo Detalle Operativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tarjetas KPI de Previsualización */}
          {config.kpis && config.kpis.length > 0 && (
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-[#475569] mb-2">
                Resumen de Indicadores Clave
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {config.kpis.map((k, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs text-center"
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#475569] truncate">
                      {k.etiqueta}
                    </div>
                    <div className="text-base font-black font-mono-tabular text-[#0F172A] mt-1">
                      {k.valor}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Muestra de Datos Tabulares */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-[#741C2B]" />
                <span>Previsualización de Datos ({config.detalleFilas.length} registros totales)</span>
              </div>
              <span className="text-[10px] font-bold text-[#475569]">
                Mostrando primeras {previewFilas.length} filas
              </span>
            </div>

            <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#741C2B] text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-3.5 py-2.5 font-black text-[11px] whitespace-nowrap w-10 text-center text-white">
                        #
                      </th>
                      {config.detalleColumnas.map((col, idx) => (
                        <th
                          key={idx}
                          className="px-3.5 py-2.5 font-black text-[11px] whitespace-nowrap text-white"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewFilas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={config.detalleColumnas.length + 1}
                          className="px-4 py-8 text-center text-xs font-bold text-[#475569]"
                        >
                          No hay transacciones ni registros para los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      previewFilas.map((fila, rIdx) => (
                        <tr
                          key={rIdx}
                          className={`h-9 ${rIdx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'} hover:bg-slate-100 transition-colors`}
                        >
                          <td className="px-3.5 py-1.5 text-[11px] font-mono text-[#0F172A] text-center font-black">
                            {rIdx + 1}
                          </td>
                          {config.detalleColumnas.map((col, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-3.5 py-1.5 text-xs text-[#0F172A] whitespace-nowrap font-bold"
                            >
                              {col.tipo === 'moneda' && typeof fila[col.key] === 'number'
                                ? `$ ${Number(fila[col.key]).toLocaleString('es-CO')}`
                                : String(fila[col.key] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del Modal con Botones */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#CBD5E1] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-bold text-[#475569]">
            {exito && (
              <span className="text-[#27845C] font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                ¡Libro Excel generado y descargado exitosamente!
              </span>
            )}
            {!exito && <span>Formato oficial FORMA · Estilo Ejecutivo Multisede</span>}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-100 text-xs font-black text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDescargarExcel}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#27845C] hover:bg-[#1E6747] text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{isExporting ? 'Generando Libro Excel...' : 'Descargar Libro Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;
