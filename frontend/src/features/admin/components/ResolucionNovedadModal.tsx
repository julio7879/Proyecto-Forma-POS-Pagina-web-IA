// frontend/src/features/admin/components/ResolucionNovedadModal.tsx
import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  resolverNovedadTraslado,
  TrasladoDTO,
  ResolucionNovedadDto,
  TipoResolucionNovedad,
} from '../services/adminService';

interface Props {
  traslado: TrasladoDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface LineaResolucion {
  lineaId: number;
  sku: string;
  nombreProducto: string;
  cantidadPendiente: number;
  tipo: TipoResolucionNovedad | '';
  cantidad: number;
  notas: string;
}

const OPCIONES_RESOLUCION: { value: TipoResolucionNovedad; label: string }[] = [
  { value: 'LLEGO_DESPUES', label: 'Llegó después (reingresa al punto)' },
  { value: 'RETORNO_A_CENTRAL', label: 'Retornó a Central (reingresa a Central)' },
  { value: 'PERDIDA_ASUMIDA', label: 'Pérdida / Merma (baja)' },
  { value: 'INCORPORAR_A_PUNTO', label: 'Incorporar excedente al punto' },
  { value: 'DESCARTAR_EXCEDENTE', label: 'Descartar excedente' },
];

export const ResolucionNovedadModal = ({ traslado, isOpen, onClose, onSuccess }: Props) => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lineas, setLineas] = useState<LineaResolucion[]>([]);

  useEffect(() => {
    if (traslado && isOpen) {
      setLineas(
        traslado.lineas.map((l) => {
          const cantidadPendiente = Math.max(
            0,
            l.cantidadEnviada - (l.recibidaBuena + l.recibidaDanada)
          );
          return {
            lineaId: l.id,
            sku: l.sku,
            nombreProducto: l.nombreProducto,
            cantidadPendiente,
            tipo: cantidadPendiente > 0 ? 'LLEGO_DESPUES' : '',
            cantidad: cantidadPendiente,
            notas: '',
          };
        })
      );
      setApiError(null);
    }
  }, [traslado, isOpen]);

  if (!isOpen || !traslado) return null;

  const handleChange = (
    lineaId: number,
    campo: 'tipo' | 'cantidad' | 'notas',
    value: any
  ) => {
    setLineas((prev) =>
      prev.map((l) => (l.lineaId === lineaId ? { ...l, [campo]: value } : l))
    );
  };

  const handleSubmit = async () => {
    // Punto 4: validación estricta de cantidad <= pendiente
    const lineasConExceso = lineas.filter(
      (l) => l.cantidadPendiente > 0 && l.cantidad > l.cantidadPendiente
    );
    if (lineasConExceso.length > 0) {
      setApiError(
        'La cantidad a resolver no puede superar la cantidad pendiente en ninguna línea.'
      );
      return;
    }

    const lineasInvalidas = lineas.filter(
      (l) => l.cantidadPendiente > 0 && (!l.tipo || l.cantidad <= 0)
    );
    if (lineasInvalidas.length > 0) {
      setApiError('Todas las líneas pendientes deben tener tipo y cantidad válida.');
      return;
    }

    setIsPending(true);
    setApiError(null);
    try {
      const payload: ResolucionNovedadDto = {
        trasladoId: traslado.id,
        resoluciones: lineas
          .filter((l) => l.cantidadPendiente > 0 && l.tipo && l.cantidad > 0)
          .map((l) => ({
            lineaId: l.lineaId,
            tipo: l.tipo as TipoResolucionNovedad,
            cantidad: l.cantidad,
            notas: l.notas.trim() || undefined,
          })),
      };

      const idempotencyKey = crypto.randomUUID();
      await resolverNovedadTraslado(payload, idempotencyKey);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const totalesPendientes = lineas.reduce((acc, l) => acc + l.cantidadPendiente, 0);
  const resueltas = lineas.filter(
    (l) => l.cantidadPendiente > 0 && l.tipo && l.cantidad > 0 && l.cantidad <= l.cantidadPendiente
  ).length;
  const totalLineasPendientes = lineas.filter((l) => l.cantidadPendiente > 0).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-resolucion-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-950/40">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2
                id="modal-resolucion-title"
                className="text-xl font-black text-slate-900 dark:text-white font-display"
              >
                Resolver Novedad de Traslado
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {traslado.codigo} · {traslado.origenNombre} → {traslado.destinoNombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Este traslado tiene <strong>{totalesPendientes} unidades pendientes</strong> por
              resolver. Debes clasificar cada línea para cerrar el traslado (RN-TRA-10).
            </span>
          </div>
        </div>

        {/* Tabla de resoluciones */}
        <div className="flex-1 overflow-y-auto p-6">
          {apiError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-800 dark:text-red-200">
              {apiError}
            </div>
          )}

          <div className="space-y-3">
            {lineas.map((l) => {
              const tienePendiente = l.cantidadPendiente > 0;
              const excedeCantidad = tienePendiente && l.cantidad > l.cantidadPendiente;
              return (
                <div
                  key={l.lineaId}
                  className={`p-3 rounded-xl border ${
                    tienePendiente
                      ? excedeCantidad
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-300/60 dark:border-red-800/40'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {l.sku}
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {l.nombreProducto}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        Pendiente
                      </div>
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {l.cantidadPendiente}
                      </div>
                    </div>
                  </div>

                  {tienePendiente && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-2">
                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Tipo de resolución
                        </label>
                        <select
                          value={l.tipo}
                          onChange={(e) => handleChange(l.lineaId, 'tipo', e.target.value)}
                          disabled={isPending}
                          aria-label={`Tipo de resolución para ${l.nombreProducto}`}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
                        >
                          <option value="">Seleccione...</option>
                          {OPCIONES_RESOLUCION.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={l.cantidadPendiente}
                          value={l.cantidad}
                          onChange={(e) =>
                            handleChange(l.lineaId, 'cantidad', parseInt(e.target.value) || 0)
                          }
                          disabled={isPending}
                          aria-label={`Cantidad a resolver de ${l.nombreProducto}`}
                          className={`w-full p-2 rounded-lg border text-xs text-right font-mono disabled:opacity-50 ${
                            excedeCantidad
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800/60 text-red-800 dark:text-red-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60'
                          }`}
                        />
                        {excedeCantidad && (
                          <p className="text-[10px] text-red-500 mt-1">
                            Máx: {l.cantidadPendiente}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Notas (opcional)
                        </label>
                        <input
                          type="text"
                          value={l.notas}
                          onChange={(e) => handleChange(l.lineaId, 'notas', e.target.value)}
                          disabled={isPending}
                          placeholder="Observación..."
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            {resueltas} de {totalLineasPendientes} líneas pendientes listas
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || resueltas !== totalLineasPendientes}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-amber-500/25"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirmar Resolución'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};