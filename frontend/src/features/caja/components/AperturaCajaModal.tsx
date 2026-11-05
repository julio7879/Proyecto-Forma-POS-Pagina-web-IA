// frontend/src/features/caja/components/AperturaCajaModal.tsx
// Reglas: RN-GEN-04 (COP entero), RN-GEN-08 (Idempotency-Key), CA-12, CA-56
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Lock, AlertTriangle, Loader2, Banknote } from 'lucide-react';
import { abrirSesion, AbrirSesionDto } from '../services/cajaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ubicacionId: number;
  onSuccess?: () => void;
}

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);

export const AperturaCajaModal = ({ isOpen, onClose, ubicacionId, onSuccess }: Props) => {
  const queryClient = useQueryClient();
  const [baseContadaCop, setBaseContadaCop] = useState<number>(0);
  const [observacion, setObservacion] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorSesionVencida, setErrorSesionVencida] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: AbrirSesionDto) => {
      const idempotencyKey = crypto.randomUUID();
      return abrirSesion(payload, idempotencyKey);
    },
    onSuccess: () => {
      // Invalidar caché de sesión activa para que se actualice
      queryClient.invalidateQueries({ queryKey: ['caja', 'sesionActiva'] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      // Manejo de errores específicos
      if (error.status === 423) {
        setErrorSesionVencida(true);
        setErrorMsg(
          'Hay una sesión de caja abierta de un día anterior (CA-56). Debes cerrarla antes de abrir una nueva.'
        );
      } else if (error.status === 409) {
        setErrorMsg('Ya existe una sesión de caja abierta en este punto hoy.');
      } else if (error.status === 422) {
        setErrorMsg('El monto debe ser un entero positivo en COP (RN-GEN-04).');
      } else {
        setErrorMsg(error.message || 'Error al abrir la caja');
      }
    },
  });

  const handleClose = () => {
    setBaseContadaCop(0);
    setObservacion('');
    setErrorMsg(null);
    setErrorSesionVencida(false);
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorSesionVencida(false);

    // Validación cliente-side
    if (!Number.isInteger(baseContadaCop) || baseContadaCop < 0) {
      setErrorMsg('La base contada debe ser un entero positivo en COP.');
      return;
    }

    mutation.mutate({
      ubicacionId,
      baseContadaCop,
      observacion: observacion.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  const submitDisabled = mutation.isPending || baseContadaCop < 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apertura-caja-title"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Encabezado */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 id="apertura-caja-title" className="text-lg font-black text-white font-display">
                Apertura de Caja
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cuenta el efectivo inicial antes de abrir la sesión
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-full hover:bg-white/10 text-slate-400"
            disabled={mutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                errorSesionVencida
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-200 border border-red-500/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Base Contada */}
          <div>
            <label
              htmlFor="base-contada"
              className="block text-xs font-semibold text-slate-300 mb-2"
            >
              Base contada inicial (COP entero) *
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="base-contada"
                type="number"
                min="0"
                step="1"
                value={baseContadaCop}
                onChange={(e) => setBaseContadaCop(parseInt(e.target.value) || 0)}
                disabled={mutation.isPending}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                placeholder="0"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Valor sugerido por sistema: {formatCOP(200000)}. Ingresa el conteo físico real.
            </p>
          </div>

          {/* Observación */}
          <div>
            <label
              htmlFor="observacion"
              className="block text-xs font-semibold text-slate-300 mb-2"
            >
              Observación (opcional)
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={mutation.isPending}
              rows={2}
              maxLength={200}
              placeholder="Motivo si la base difiere del valor configurado..."
              className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-xs text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full min-h-[52px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Abriendo caja...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Abrir caja
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};