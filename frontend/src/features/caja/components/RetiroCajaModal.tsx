// frontend/src/features/caja/components/RetiroCajaModal.tsx
// Reglas: RN-GEN-04 (COP entero), RN-GEN-08 (Idempotency-Key), CA-15, RN-CAJ-07
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowDownCircle, AlertTriangle, Loader2, Banknote } from 'lucide-react';
import {
  registrarRetiro,
  SesionCajaDTO,
  RegistrarRetiroDto,
} from '../services/cajaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sesion: SesionCajaDTO; // Debe venir de fetchSesionActiva ya cargada
  onSuccess?: () => void;
}

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);

export const RetiroCajaModal = ({ isOpen, onClose, sesion, onSuccess }: Props) => {
  const queryClient = useQueryClient();
  const [montoCop, setMontoCop] = useState<number>(0);
  const [motivoRetiro, setMotivoRetiro] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: RegistrarRetiroDto) => {
      const idempotencyKey = crypto.randomUUID();
      return registrarRetiro(payload, idempotencyKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja', 'sesionActiva'] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      if (error.status === 409) {
        setErrorMsg('La sesión de caja fue cerrada mientras registrabas el retiro.');
      } else if (error.status === 422) {
        setErrorMsg('El monto debe ser un entero positivo en COP.');
      } else if (error.status === 423) {
        setErrorMsg('La sesión de caja está vencida (día anterior). Debes cerrarla.');
      } else {
        setErrorMsg(error.message || 'Error al registrar el retiro');
      }
    },
  });

  const handleClose = () => {
    setMontoCop(0);
    setMotivoRetiro('');
    setErrorMsg(null);
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones cliente-side
    if (!Number.isInteger(montoCop) || montoCop <= 0) {
      setErrorMsg('El monto a retirar debe ser un entero mayor a 0.');
      return;
    }
    if (montoCop > sesion.efectivoEsperadoCop) {
      setErrorMsg(
        `El monto a retirar (${formatCOP(montoCop)}) supera el efectivo disponible (${formatCOP(
          sesion.efectivoEsperadoCop
        )}).`
      );
      return;
    }
    if (!motivoRetiro.trim()) {
      setErrorMsg('Debes especificar el motivo del retiro.');
      return;
    }

    mutation.mutate({
      sesionCajaId: sesion.id,
      montoCop,
      motivoRetiro: motivoRetiro.trim(),
    });
  };

  if (!isOpen) return null;

  const submitDisabled =
    mutation.isPending ||
    montoCop <= 0 ||
    montoCop > sesion.efectivoEsperadoCop ||
    !motivoRetiro.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="retiro-caja-title"
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
            <div className="p-2 rounded-full bg-amber-500/20">
              <ArrowDownCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 id="retiro-caja-title" className="text-lg font-black text-white font-display">
                Retiro a Sobre de Seguridad
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Extrae efectivo de la caja al sobre de seguridad
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

        {/* Info de efectivo disponible (calculado en backend, RN-GEN-01) */}
        <div className="px-5 pt-4">
          <div className="p-3 rounded-xl bg-slate-800 border border-white/10 text-xs flex items-center justify-between">
            <span className="text-slate-400">Efectivo disponible en caja:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatCOP(sesion.efectivoEsperadoCop)}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Monto */}
          <div>
            <label
              htmlFor="monto-retiro"
              className="block text-xs font-semibold text-slate-300 mb-2"
            >
              Monto a retirar (COP entero) *
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="monto-retiro"
                type="number"
                min="1"
                step="1"
                max={sesion.efectivoEsperadoCop}
                value={montoCop}
                onChange={(e) => setMontoCop(parseInt(e.target.value) || 0)}
                disabled={mutation.isPending}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                placeholder="0"
              />
            </div>
            {montoCop > sesion.efectivoEsperadoCop && (
              <p className="mt-1 text-[10px] text-red-400">
                El monto supera el efectivo disponible.
              </p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label
              htmlFor="motivo-retiro"
              className="block text-xs font-semibold text-slate-300 mb-2"
            >
              Motivo del retiro *
            </label>
            <input
              id="motivo-retiro"
              type="text"
              value={motivoRetiro}
              onChange={(e) => setMotivoRetiro(e.target.value)}
              disabled={mutation.isPending}
              maxLength={100}
              placeholder="Ej. Retiro de seguridad por exceso de efectivo"
              className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              {motivoRetiro.length}/100 caracteres
            </p>
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full min-h-[52px] py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-600/30 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando retiro...
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-4 h-4" />
                Registrar retiro
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};