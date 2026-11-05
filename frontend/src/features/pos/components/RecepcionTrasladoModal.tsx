import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  PackageCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  RecepcionTrasladoModalProps,
  RecepcionTrasladoPayloadDTO,
} from '../types/traslados.types';

export const RecepcionTrasladoModal: React.FC<RecepcionTrasladoModalProps> = ({
  isOpen,
  onClose,
  traslado,
  onSubmit,
  isSubmitting,
}) => {
  // Estado local del conteo físico indexado por lineaId (number)
  const [conteoLineas, setConteoLineas] = useState<
    Record<
      number,
      { recibidaBuena: number; recibidaDanada: number; excedenteReportado: number }
    >
  >({});
  const [observaciones, setObservaciones] = useState('');

  // Inicializa las líneas: recibidaBuena = cantidadEnviada para máxima agilidad en tienda
  useEffect(() => {
    if (isOpen && traslado) {
      const inicial: Record<
        number,
        { recibidaBuena: number; recibidaDanada: number; excedenteReportado: number }
      > = {};

      traslado.lineas.forEach((linea) => {
        inicial[linea.id] = {
          recibidaBuena: linea.cantidadEnviada,
          recibidaDanada: 0,
          excedenteReportado: 0,
        };
      });

      setConteoLineas(inicial);
      setObservaciones('');
    }
  }, [isOpen, traslado]);

  if (!isOpen || !traslado) return null;

  // Actualizador seguro de valores numéricos enteros >= 0 y con tope anti-desbordamiento (máx 99.999)
  const handleInputChange = (
    lineaId: number,
    campo: 'recibidaBuena' | 'recibidaDanada' | 'excedenteReportado',
    rawValor: string
  ) => {
    const valorNum = parseInt(rawValor, 10);
    const valorLimpio = isNaN(valorNum) || valorNum < 0 ? 0 : Math.min(valorNum, 99999);

    setConteoLineas((prev) => ({
      ...prev,
      [lineaId]: {
        ...(prev[lineaId] || { recibidaBuena: 0, recibidaDanada: 0, excedenteReportado: 0 }),
        [campo]: valorLimpio,
      },
    }));
  };

  // Cálculos por línea y validación CA-07
  const lineasProcesadas = traslado.lineas.map((linea) => {
    const conteo = conteoLineas[linea.id] || {
      recibidaBuena: linea.cantidadEnviada,
      recibidaDanada: 0,
      excedenteReportado: 0,
    };

    const sumaEntrantes = conteo.recibidaBuena + conteo.recibidaDanada;
    const faltante = Math.max(0, linea.cantidadEnviada - sumaEntrantes);
    // CA-07: recibidaBuena + recibidaDanada no pueden superar cantidadEnviada
    const esInvalida = sumaEntrantes > linea.cantidadEnviada;

    return {
      lineaId: linea.id,
      sku: linea.sku,
      productoNombre: linea.productoNombre,
      talla: linea.talla,
      color: linea.color,
      cantidadEnviada: linea.cantidadEnviada,
      recibidaBuena: conteo.recibidaBuena,
      recibidaDanada: conteo.recibidaDanada,
      excedenteReportado: conteo.excedenteReportado,
      faltante,
      esInvalida,
    };
  });

  const hayLineasInvalidas = lineasProcesadas.some((l) => l.esInvalida);
  const hayNovedades = lineasProcesadas.some(
    (l) => l.faltante > 0 || l.recibidaDanada > 0 || l.excedenteReportado > 0
  );

  // Cumplimiento estricto de RN-TRA-09: Observación mandatoria de mín 3 caracteres si hay novedades
  const observacionInvalida = hayNovedades && observaciones.trim().length < 3;
  const puedeEnviar = !hayLineasInvalidas && !observacionInvalida && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar) return;

    // DTO limpio y estricto hacia el backend (recibirTrasladoSchema)
    const payload: RecepcionTrasladoPayloadDTO = {
      trasladoId: traslado.id,
      version: traslado.version,
      lineas: lineasProcesadas.map((l) => ({
        lineaId: l.lineaId,
        cantidadRecibidaBuena: l.recibidaBuena,
        cantidadRecibidaDanada: l.recibidaDanada,
        excedenteReportado: l.excedenteReportado > 0 ? l.excedenteReportado : 0,
      })),
      observacion: observaciones.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-traslado-titulo"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="modal-traslado-titulo"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Recepción de Mercancía en Tienda
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Guía: {traslado.numeroGuia} · Origen: {traslado.sedeOrigen} ➔ Destino: {traslado.sedeDestino}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Badge Previsualizador de Estado (CA-57, CA-58) */}
          <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Dictamen de Entrada:
            </span>

            {hayNovedades ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                Se generará Acta de Novedad (RECIBIDO_CON_NOVEDAD)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recepción Conforme (RECIBIDO)
              </span>
            )}
          </div>

          {/* Tabla de Conteo Físico */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Detalle de Prendas Enviadas y Conteo Físico
            </h3>

            <div className="space-y-3">
              {lineasProcesadas.map((linea) => (
                <div
                  key={linea.lineaId}
                  className={`p-4 rounded-2xl border transition-all ${
                    linea.esInvalida
                      ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {linea.productoNombre}
                      </span>
                      <div className="text-xs text-slate-500 font-mono">
                        SKU: {linea.sku} · Talla: {linea.talla} · Color: {linea.color}
                      </div>
                    </div>
                    <div className="text-right sm:text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                        Enviadas: {linea.cantidadEnviada}
                      </span>
                    </div>
                  </div>

                  {/* Inputs de Conteo con altura táctil min-h-[48px] (CA-53) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label
                        htmlFor={`buena-${linea.lineaId}`}
                        className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1"
                      >
                        Recibida Buena:
                      </label>
                      <input
                        id={`buena-${linea.lineaId}`}
                        type="number"
                        min="0"
                        max="99999"
                        value={linea.recibidaBuena}
                        onChange={(e) =>
                          handleInputChange(linea.lineaId, 'recibidaBuena', e.target.value)
                        }
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-white text-center focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`danada-${linea.lineaId}`}
                        className="block text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1"
                      >
                        Recibida Dañada:
                      </label>
                      <input
                        id={`danada-${linea.lineaId}`}
                        type="number"
                        min="0"
                        max="99999"
                        value={linea.recibidaDanada}
                        onChange={(e) =>
                          handleInputChange(linea.lineaId, 'recibidaDanada', e.target.value)
                        }
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/40 font-mono tabular-nums text-sm font-bold text-rose-700 dark:text-rose-300 text-center focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`excedente-${linea.lineaId}`}
                        className="block text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-1"
                      >
                        Sobrante / Excedente:
                      </label>
                      <input
                        id={`excedente-${linea.lineaId}`}
                        type="number"
                        min="0"
                        max="99999"
                        value={linea.excedenteReportado}
                        onChange={(e) =>
                          handleInputChange(linea.lineaId, 'excedenteReportado', e.target.value)
                        }
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/40 font-mono tabular-nums text-sm font-bold text-blue-700 dark:text-blue-300 text-center focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Faltante Calculado:
                      </label>
                      <div
                        className={`w-full min-h-[48px] px-3 py-2 rounded-xl border font-mono tabular-nums text-sm font-bold flex items-center justify-center ${
                          linea.faltante > 0
                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {linea.faltante}
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Error CA-07 */}
                  {linea.esInvalida && (
                    <div className="mt-2.5 p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Las unidades buenas y dañadas no pueden superar las unidades enviadas</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones (RN-TRA-09: Mandatoria ante novedades) */}
          <div className="space-y-1.5">
            <label
              htmlFor="observaciones-traslado"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Observación de Recepción:{' '}
              {hayNovedades ? (
                <span className="text-amber-700 dark:text-amber-400 font-bold">
                  (Obligatoria ante novedades, mín. 3 caracteres — RN-TRA-09) *
                </span>
              ) : (
                <span className="text-slate-500 font-normal">(Opcional)</span>
              )}
            </label>
            <textarea
              id="observaciones-traslado"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={isSubmitting}
              placeholder={
                hayNovedades
                  ? 'Describe detalladamente el motivo de la avería, faltante o excedente (mín. 3 caracteres)...'
                  : 'Opcional: detalles adicionales de la entrega o transportadora...'
              }
              className={`w-full p-3 rounded-2xl border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                observacionInvalida
                  ? 'border-amber-500 focus:border-amber-600 ring-1 ring-amber-500/30'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
              }`}
            />
            {observacionInvalida && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>La observación es obligatoria ante novedades para generar el acta (mín. 3 caracteres).</span>
              </p>
            )}
          </div>

          {/* Pie de Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!puedeEnviar}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando Recepción...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Confirmar Recepción</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
