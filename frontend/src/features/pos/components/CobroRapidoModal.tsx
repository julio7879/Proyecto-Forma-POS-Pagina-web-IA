// frontend/src/features/pos/components/CobroRapidoModal.tsx
import { X, Banknote, CreditCard, Loader2 } from 'lucide-react';
import { MetodoPagoPOS } from '../services/posService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalPagarCOP: number;
  metodoPago: MetodoPagoPOS;
  setMetodoPago: (metodo: MetodoPagoPOS) => void;
  efectivoRecibido: number;
  setEfectivoRecibido: (val: number) => void;
  comprobanteBancario: string;
  setComprobanteBancario: (val: string) => void;
  cambioVueltoCOP: number;
  isSubmitting: boolean;
  errorVenta: string | null;
  onConfirmar: () => void;
  formatCOP: (val: number) => string;
}

export const CobroRapidoModal = ({
  isOpen,
  onClose,
  totalPagarCOP,
  metodoPago,
  setMetodoPago,
  efectivoRecibido,
  setEfectivoRecibido,
  comprobanteBancario,
  setComprobanteBancario,
  cambioVueltoCOP,
  isSubmitting,
  errorVenta,
  onConfirmar,
  formatCOP,
}: Props) => {
  if (!isOpen) return null;

  const handleBilletesRapidos = (monto: number) => {
    setEfectivoRecibido(efectivoRecibido + monto);
  };

  const handleTecladoNumerico = (char: string) => {
    if (char === 'CLEAR') {
      setEfectivoRecibido(0);
      return;
    }
    const actualStr = efectivoRecibido === 0 ? '' : efectivoRecibido.toString();
    const nuevoStr = actualStr + char;
    setEfectivoRecibido(parseInt(nuevoStr, 10) || 0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cobro-modal-title"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3
              id="cobro-modal-title"
              className="text-lg font-black text-slate-900 dark:text-white"
            >
              Cobro de Venta Mostrador
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total a liquidar:{' '}
              <strong className="font-mono text-emerald-600 text-sm">
                {formatCOP(totalPagarCOP)}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            aria-label="Cerrar modal de cobro"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorVenta && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
            {errorVenta}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 my-4">
          <button
            type="button"
            onClick={() => setMetodoPago('EFECTIVO')}
            disabled={isSubmitting}
            className={`min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
              metodoPago === 'EFECTIVO'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>💵 EFECTIVO</span>
          </button>

          <button
            type="button"
            onClick={() => setMetodoPago('TRANSFERENCIA')}
            disabled={isSubmitting}
            className={`min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
              metodoPago === 'TRANSFERENCIA'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>💳 TRANSFERENCIA</span>
          </button>
        </div>

        {metodoPago === 'EFECTIVO' ? (
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Billetes Rápidos Sugeridos:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[100000, 50000, 20000, 10000].map((monto) => (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => handleBilletesRapidos(monto)}
                    disabled={isSubmitting}
                    className="min-h-[44px] py-2 px-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    +${monto / 1000}k
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setEfectivoRecibido(totalPagarCOP)}
                  disabled={isSubmitting}
                  className="min-h-[44px] py-2 px-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 font-bold text-xs text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 disabled:opacity-50"
                >
                  Exacto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Monto Recibido en Mano:
                </label>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-right">
                  <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                    {formatCOP(efectivoRecibido)}
                  </span>
                </div>

                <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/40 text-center">
                  <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    CAMBIO / VUELTO A ENTREGAR
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCOP(cambioVueltoCOP)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', '00'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleTecladoNumerico(k)}
                    disabled={isSubmitting}
                    className={`min-h-[44px] rounded-xl font-bold font-mono text-sm transition-all flex items-center justify-center disabled:opacity-50 ${
                      k === 'CLEAR'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-slate-50'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Número de Aprobación / Comprobante Bancario:
              </label>
              <input
                type="text"
                value={comprobanteBancario}
                onChange={(e) => setComprobanteBancario(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ej. NQ-84920492 o TRX-4920"
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 font-mono text-sm focus:outline-none focus:border-indigo-600 disabled:opacity-50"
              />
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs">
              Verifique en la app bancaria la acreditación en la cuenta oficial antes de confirmar.
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-300 disabled:opacity-50"
          >
            Cancelar (Esc)
          </button>
          <button
            type="button"
            disabled={
              isSubmitting ||
              (metodoPago === 'EFECTIVO' && efectivoRecibido < totalPagarCOP) ||
              (metodoPago === 'TRANSFERENCIA' && !comprobanteBancario.trim())
            }
            onClick={onConfirmar}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'CONFIRMAR VENTA E IMPRIMIR (Enter)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};