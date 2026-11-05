import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  CobroRapidoModalProps,
  MetodoPagoCobro,
  CobroPayloadDTO,
} from '../types/cobro.types';
import { TecladoNumericoPOS } from './TecladoNumericoPOS';

const formatCOP = (valor: number): string => {
  return `$${(valor || 0).toLocaleString('es-CO')}`;
};

export const CobroRapidoModal: React.FC<CobroRapidoModalProps> = ({
  isOpen,
  onClose,
  totalVentaCop,
  onConfirmarCobro,
  isSubmitting,
}) => {
  const [metodoPago, setMetodoPago] = useState<MetodoPagoCobro>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  const [referenciaTransferencia, setReferenciaTransferencia] = useState('');

  // Inicializa el modal al abrirse
  useEffect(() => {
    if (isOpen) {
      setMetodoPago('EFECTIVO');
      setMontoRecibido(0);
      setReferenciaTransferencia('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cambioCop = Math.max(0, montoRecibido - totalVentaCop);
  const faltaCop = Math.max(0, totalVentaCop - montoRecibido);
  const esEfectivoSuficiente = montoRecibido >= totalVentaCop;

  // Validación de habilitación del botón de confirmar (CA-52)

const esTotalValido = totalVentaCop > 0;
const puedeConfirmar =
  esTotalValido &&
  !isSubmitting &&
  (metodoPago === 'EFECTIVO'
    ? esEfectivoSuficiente
    : referenciaTransferencia.trim().length > 0);

  const handleConfirmar = async () => {
    if (!puedeConfirmar) return;

    const payload: CobroPayloadDTO = {
      metodoPago,
      montoRecibidoCop: metodoPago === 'EFECTIVO' ? montoRecibido : totalVentaCop,
      cambioCop: metodoPago === 'EFECTIVO' ? cambioCop : 0,
      referenciaTransferencia:
        metodoPago === 'TRANSFERENCIA' ? referenciaTransferencia.trim() : undefined,
    };

    await onConfirmarCobro(payload);
  };

  // Atajos de teclado: Enter confirma si es válido, Escape cierra

useEffect(() => {
  if (!isOpen) return;

  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && puedeConfirmar) {
      e.preventDefault();
      handleConfirmar();
    } else if (e.key === 'Escape' && !isSubmitting) {
      e.preventDefault();
      onClose();
    }
  };

  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, [isOpen, puedeConfirmar, isSubmitting, onClose, handleConfirmar]);

  const BILLETES_SUGERIDOS = [100000, 50000, 20000, 10000];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cobro-titulo"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="modal-cobro-titulo" className="text-lg font-bold text-slate-900 dark:text-white">
              Cobro de Venta POS
            </h2>
            <p className="text-xs text-slate-500">Selecciona el método de pago y calcula el cambio</p>
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

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Total Prominente */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white text-center shadow-inner">
            <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              TOTAL A COBRAR
            </span>
            <span className="text-3xl sm:text-4xl font-mono font-black text-emerald-400">
              {formatCOP(totalVentaCop)} COP
            </span>
          </div>

          {/* Selector de Método de Pago */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMetodoPago('EFECTIVO')}
              disabled={isSubmitting}
              className={`min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                metodoPago === 'EFECTIVO'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>EFECTIVO</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPago('TRANSFERENCIA')}
              disabled={isSubmitting}
              className={`min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                metodoPago === 'TRANSFERENCIA'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>TRANSFERENCIA</span>
            </button>
          </div>

          {metodoPago === 'EFECTIVO' ? (
            <div className="space-y-4">
              {/* Botonera de Billetes Rápidos */}
              <div>
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Billetes Rápidos:
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {BILLETES_SUGERIDOS.map((monto) => (
                    <button
                      key={monto}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setMontoRecibido(monto)}
                      className="min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      {formatCOP(monto)}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setMontoRecibido(totalVentaCop)}
                    className="min-h-[48px] rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200 transition-colors shadow-sm"
                  >
                    Exacto
                  </button>
                </div>
              </div>

              {/* Panel de Monto Recibido, Cambio y Teclado Táctil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monto Recibido:
                    </label>
                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-right">
                      <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                        {formatCOP(montoRecibido)}
                      </span>
                    </div>
                  </div>

                  {/* Caja Dinámica de Cambio / Falta (CA-51 y CA-52) */}
                  {esEfectivoSuficiente ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/40 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Cambio a entregar</span>
                      </div>
                      <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCOP(cambioCop)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500/40 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-1">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Falta</span>
                      </div>
                      <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                        {formatCOP(faltaCop)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Teclado Numérico */}
                <div>
                  <TecladoNumericoPOS
                    valorActual={montoRecibido}
                    onValorChange={setMontoRecibido}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Flujo Transferencia */
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <label htmlFor="ref-transferencia" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Número de comprobante / Referencia bancaria:
              </label>
              <input
                id="ref-transferencia"
                type="text"
                value={referenciaTransferencia}
                onChange={(e) => setReferenciaTransferencia(e.target.value)}
                placeholder="Ej: NEQUI-847291, Daviplata, Bancolombia..."
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500">
                Ingresa el código alfanumérico visible en el comprobante del cliente.
              </p>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acción de Confirmar */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!puedeConfirmar}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando Venta...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Cobro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};