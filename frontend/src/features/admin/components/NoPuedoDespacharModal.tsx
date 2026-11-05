// frontend/src/features/admin/components/NoPuedoDespacharModal.tsx
import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertTriangle,
  PackageX,
  CheckCircle2,
  Send,
} from 'lucide-react';
import {
  reportarNoPuedoDespachar,
  NoPuedoDespacharWebDto,
  PedidoWebDTO,
  ResultadoNoPuedoDespachar,
} from '../services/adminService';

interface Props {
  pedido: PedidoWebDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (resultado: ResultadoNoPuedoDespachar) => void;
}

export const NoPuedoDespacharModal = ({ pedido, isOpen, onClose, onSuccess }: Props) => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState<Set<number>>(
    new Set()
  );
  const [motivo, setMotivo] = useState('');
  const [resultado, setResultado] = useState<ResultadoNoPuedoDespachar | null>(null);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setVariantesSeleccionadas(new Set());
      setMotivo('');
      setApiError(null);
      setResultado(null);
    }
  }, [isOpen]);

  if (!isOpen || !pedido) return null;

  const toggleVariante = (varianteId: number) => {
    setVariantesSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(varianteId)) {
        next.delete(varianteId);
      } else {
        next.add(varianteId);
      }
      return next;
    });
  };

  const formularioValido =
    variantesSeleccionadas.size > 0 && motivo.trim().length >= 5;

  const handleSubmit = async () => {
    if (!formularioValido) return;

    setIsPending(true);
    setApiError(null);

    try {
      const payload: NoPuedoDespacharWebDto = {
        varianteIdsAfectadas: Array.from(variantesSeleccionadas),
        motivo: motivo.trim(),
      };
      const idempotencyKey = crypto.randomUUID();
      const res = await reportarNoPuedoDespachar(pedido.id, payload, idempotencyKey);
      setResultado(res);
      onSuccess?.(res);
    } catch (error: any) {
      setApiError(error.message || 'Error al reportar la novedad.');
    } finally {
      setIsPending(false);
    }
  };

  // Pantalla de resultado exitoso con banner de reasignación (CA-43 / CA-62)
  if (resultado) {
    const { reasignado, enCustodiaCentral, mensaje, pedido: pedidoActualizado } = resultado;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-no-puedo-despachar-result-title"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                enCustodiaCentral
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {enCustodiaCentral ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>

            <h2
              id="modal-no-puedo-despachar-result-title"
              className="text-lg font-black text-slate-900 dark:text-white mb-2"
            >
              {enCustodiaCentral
                ? 'Pedido en Custodia Central'
                : reasignado
                ? 'Pedido Reasignado'
                : 'Novedad Registrada'}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{mensaje}</p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-left space-y-1 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Referencia:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {pedidoActualizado.referenciaLegible}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sede asignada:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pedidoActualizado.ubicacionAsignadaNombre ?? `#${pedidoActualizado.ubicacionAsignadaId}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Incidencia de stock:</span>
                <span
                  className={`font-semibold ${
                    pedidoActualizado.tieneIncidenciaStock
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {pedidoActualizado.tieneIncidenciaStock ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reserva activa:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pedidoActualizado.tieneReservaActiva ? 'Sí (blanda)' : 'No'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de reporte
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-no-puedo-despachar-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-950/40">
              <PackageX className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2
                id="modal-no-puedo-despachar-title"
                className="text-xl font-black text-slate-900 dark:text-white"
              >
                No puedo despachar
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {pedido.referenciaLegible} · Sede:{' '}
                {pedido.ubicacionAsignadaNombre ?? `#${pedido.ubicacionAsignadaId}`}
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

        {/* Aviso de impacto (CA-43 / CA-62) */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Al reportar esta novedad, los SKU seleccionados entrarán en{' '}
              <strong>cuarentena</strong> en esta sede, se liberará la reserva blanda y el
              pedido se <strong>reasignará automáticamente</strong> a otra sede candidata o
              quedará en <strong>custodia en Bodega Central</strong> con alerta al
              administrador.
            </span>
          </div>
        </div>

        {/* Selección de variantes afectadas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {apiError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-800 dark:text-red-200">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Variantes afectadas * ({variantesSeleccionadas.size} seleccionada(s))
            </label>
            <div className="space-y-2">
              {pedido.lineas.map((linea) => {
                const seleccionada = variantesSeleccionadas.has(linea.varianteId);
                return (
                  <label
                    key={linea.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      seleccionada
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionada}
                      onChange={() => toggleVariante(linea.varianteId)}
                      disabled={isPending}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {linea.nombreProducto}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{linea.sku}</span>
                        {linea.talla && <span>· Talla: {linea.talla}</span>}
                        {linea.color && <span>· Color: {linea.color}</span>}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      ×{linea.cantidad}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="motivo-novedad"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            >
              Motivo detallado de la novedad *
            </label>
            <textarea
              id="motivo-novedad"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={isPending}
              rows={3}
              maxLength={500}
              placeholder="Ej. Prenda manchada con tinta en el perchero, empaque roto por humedad, artículo extraviado..."
              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50 resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Mínimo 5 caracteres ({motivo.trim().length}/500).
            </p>
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
            disabled={isPending || !formularioValido}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-amber-500/25"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Reportar Novedad
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};