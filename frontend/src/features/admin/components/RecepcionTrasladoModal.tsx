// frontend/src/features/admin/components/RecepcionTrasladoModal.tsx
import { useState, useEffect } from 'react';
import { X, Loader2, PackageCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  recibirTraslado,
  TrasladoDTO,
  RecepcionTrasladoDto,
} from '../services/adminService';

interface Props {
  traslado: TrasladoDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface LineaRecepcion {
  lineaId: number;
  sku: string;
  nombreProducto: string;
  cantidadEnviada: number;
  recibidaBuena: number;
  recibidaDanada: number;
  excedenteReportado: number; // NUEVO (RN-TRA-09)
}

export const RecepcionTrasladoModal = ({ traslado, isOpen, onClose, onSuccess }: Props) => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [lineas, setLineas] = useState<LineaRecepcion[]>([]);

  useEffect(() => {
    if (traslado && isOpen) {
      setLineas(
        traslado.lineas.map((l) => ({
          lineaId: l.id,
          sku: l.sku,
          nombreProducto: l.nombreProducto,
          cantidadEnviada: l.cantidadEnviada,
          recibidaBuena: l.cantidadEnviada,
          recibidaDanada: 0,
          excedenteReportado: 0,
        }))
      );
      setObservaciones('');
      setApiError(null);
    }
  }, [traslado, isOpen]);

  const totalEnviado = lineas.reduce((acc, l) => acc + l.cantidadEnviada, 0);
  const totalBuenas = lineas.reduce((acc, l) => acc + l.recibidaBuena, 0);
  const totalDanadas = lineas.reduce((acc, l) => acc + l.recibidaDanada, 0);
  const totalExcedente = lineas.reduce((acc, l) => acc + l.excedenteReportado, 0);
  const totalRecibido = totalBuenas + totalDanadas;
  const hayFaltante = totalRecibido < totalEnviado;
  const hayDanadas = totalDanadas > 0;
  const hayExcedente = totalExcedente > 0;
  const hayNovedad = hayFaltante || hayDanadas || hayExcedente;
  const requiereObservacion = hayNovedad;

  // Permitir que la suma buena+dañada <= enviada
  const lineaInvalida = lineas.some(
    (l) => l.recibidaBuena + l.recibidaDanada > l.cantidadEnviada
  );

  if (!isOpen || !traslado) return null;

  const handleCantidadChange = (
    lineaId: number,
    campo: 'recibidaBuena' | 'recibidaDanada' | 'excedenteReportado',
    value: string
  ) => {
    const num = Math.max(0, Math.min(parseInt(value) || 0, 999999));
    setLineas((prev) =>
      prev.map((l) => {
        if (l.lineaId !== lineaId) return l;
        const nueva = { ...l, [campo]: num };
        // Ajuste automático si la suma buena+dañada excede enviada
        if (
          (campo === 'recibidaBuena' || campo === 'recibidaDanada') &&
          nueva.recibidaBuena + nueva.recibidaDanada > nueva.cantidadEnviada
        ) {
          if (campo === 'recibidaBuena') {
            nueva.recibidaDanada = Math.max(0, nueva.cantidadEnviada - num);
          } else {
            nueva.recibidaBuena = Math.max(0, nueva.cantidadEnviada - num);
          }
        }
        return nueva;
      })
    );
  };

  const handleSubmit = async () => {
    if (requiereObservacion && !observaciones.trim()) {
      setApiError('Debe ingresar observaciones cuando hay faltantes, dañadas o excedentes.');
      return;
    }
    if (lineaInvalida) {
      setApiError('La suma de buenas y dañadas no puede superar lo enviado en ninguna línea.');
      return;
    }
    setIsPending(true);
    setApiError(null);
    try {
      const payload: RecepcionTrasladoDto = {
        trasladoId: traslado.id,
        lineas: lineas.map((l) => ({
          lineaId: l.lineaId,
          recibidaBuena: l.recibidaBuena,
          recibidaDanada: l.recibidaDanada,
          // Solo enviar excedente si > 0
          ...(l.excedenteReportado > 0
            ? { excedenteReportado: l.excedenteReportado }
            : {}),
        })),
        observaciones: observaciones.trim() || undefined,
      };
      const idempotencyKey = crypto.randomUUID();
      await recibirTraslado(payload, idempotencyKey);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recepcion-traslado-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2
                id="modal-recepcion-traslado-title"
                className="text-xl font-black text-slate-900 dark:text-white font-display"
              >
                Recepción de Traslado
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
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-800 dark:text-indigo-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Las unidades <strong>buenas</strong> suman al stock vendible del punto.
              Las <strong>dañadas</strong> van a no vendible. Los <strong>excedentes</strong> abren
              novedad para resolución (RN-TRA-08 / RN-TRA-09).
            </span>
          </div>
        </div>

        {/* Tabla de líneas */}
        <div className="flex-1 overflow-y-auto p-6">
          {apiError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-800 dark:text-red-200">
              {apiError}
            </div>
          )}

          <div className="rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr className="text-left">
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">SKU</th>
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">Producto</th>
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] text-right">Enviado</th>
                  <th className="px-3 py-2 font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[10px] text-right w-20">Buenas</th>
                  <th className="px-3 py-2 font-bold text-red-700 dark:text-red-400 uppercase text-[10px] text-right w-20">Dañadas</th>
                  <th className="px-3 py-2 font-bold text-amber-700 dark:text-amber-400 uppercase text-[10px] text-right w-20">Excedente</th>
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {lineas.map((l) => {
                  const totalLinea = l.recibidaBuena + l.recibidaDanada;
                  const lineaOk = totalLinea === l.cantidadEnviada && l.excedenteReportado === 0;
                  return (
                    <tr key={l.lineaId} className="bg-white dark:bg-slate-900">
                      <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">{l.sku}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{l.nombreProducto}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">{l.cantidadEnviada}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          max={l.cantidadEnviada}
                          value={l.recibidaBuena}
                          onChange={(e) => handleCantidadChange(l.lineaId, 'recibidaBuena', e.target.value)}
                          disabled={isPending}
                          aria-label={`Unidades buenas de ${l.nombreProducto}`}
                          className="w-full px-2 py-1 text-right font-mono font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          max={l.cantidadEnviada}
                          value={l.recibidaDanada}
                          onChange={(e) => handleCantidadChange(l.lineaId, 'recibidaDanada', e.target.value)}
                          disabled={isPending}
                          aria-label={`Unidades dañadas de ${l.nombreProducto}`}
                          className="w-full px-2 py-1 text-right font-mono font-bold rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 disabled:opacity-50 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={l.excedenteReportado}
                          onChange={(e) => handleCantidadChange(l.lineaId, 'excedenteReportado', e.target.value)}
                          disabled={isPending}
                          aria-label={`Excedente reportado de ${l.nombreProducto}`}
                          className="w-full px-2 py-1 text-right font-mono font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 disabled:opacity-50 focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${lineaOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {lineaOk && <CheckCircle2 className="w-3.5 h-3.5 inline mr-0.5" />}
                        {totalLinea + l.excedenteReportado}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-right font-bold text-slate-700 dark:text-slate-300">Totales:</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">{totalEnviado}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{totalBuenas}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-red-600 dark:text-red-400">{totalDanadas}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400">{totalExcedente}</td>
                  <td className={`px-3 py-2 text-right font-mono font-bold ${totalRecibido === totalEnviado && totalExcedente === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {totalRecibido + totalExcedente}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {lineaInvalida && (
            <p className="mt-2 text-[11px] text-red-600 dark:text-red-400 font-semibold">
              ⚠️ La suma de buenas y dañadas no puede superar lo enviado en ninguna línea.
            </p>
          )}

          {hayNovedad && !lineaInvalida && (
            <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
              {hayFaltante && '⚠️ Detectado faltante. '}
              {hayDanadas && '⚠️ Detectadas unidades dañadas. '}
              {hayExcedente && '⚠️ Detectado excedente. '}
              Este traslado pasará a <strong>RECIBIDO_CON_NOVEDAD</strong>.
            </p>
          )}

          {/* Observaciones */}
          <div className="mt-4">
            <label
              htmlFor="observaciones"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Observaciones {requiereObservacion && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={isPending}
              rows={2}
              placeholder={
                requiereObservacion
                  ? 'Explica la novedad: faltante, daño, excedente...'
                  : 'Observaciones (opcional)'
              }
              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
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
            disabled={isPending || lineaInvalida || (totalRecibido === 0 && totalExcedente === 0)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-500/25"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Recepción'}
          </button>
        </div>
      </div>
    </div>
  );
};