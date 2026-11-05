// frontend/src/features/caja/components/ArqueoCiegoModal.tsx
// Reglas: RN-GEN-04 (COP entero), RN-GEN-08 (Idempotency-Key), CA-55 (arqueo ciego)
// IMPORTANTE: Nunca mostrar efectivoEsperadoCop antes del conteo físico.
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Lock,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Banknote,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  cerrarSesionCiego,
  CerrarSesionCiegoDto,
  CierreSesionResultadoDto,
  SesionCajaDTO,
} from '../services/cajaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sesion: SesionCajaDTO;
  onSuccess?: () => void;
}

type ModoConteo = 'billetes' | 'directo';

interface BilletesState {
  b100: number;
  b50: number;
  b20: number;
  b10: number;
  b5: number;
  b2: number;
}

const BILLETES_CONFIG = [
  { key: 'b100' as const, valor: 100000, label: '$100.000' },
  { key: 'b50' as const, valor: 50000, label: '$50.000' },
  { key: 'b20' as const, valor: 20000, label: '$20.000' },
  { key: 'b10' as const, valor: 10000, label: '$10.000' },
  { key: 'b5' as const, valor: 5000, label: '$5.000' },
  { key: 'b2' as const, valor: 2000, label: '$2.000' },
];

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);

export const ArqueoCiegoModal = ({ isOpen, onClose, sesion, onSuccess }: Props) => {
  const queryClient = useQueryClient();
  const [modo, setModo] = useState<ModoConteo>('billetes');
  const [billetes, setBilletes] = useState<BilletesState>({
    b100: 0,
    b50: 0,
    b20: 0,
    b10: 0,
    b5: 0,
    b2: 0,
  });
  const [montoDirecto, setMontoDirecto] = useState<number>(0);
  const [observacion, setObservacion] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CierreSesionResultadoDto | null>(null);

  // Cálculo del total CONTADO (no del saldo teórico). Es legítimo sumar billetes.
  const totalContado = useMemo(() => {
    if (modo === 'directo') return montoDirecto;
    return BILLETES_CONFIG.reduce((acc, b) => acc + billetes[b.key] * b.valor, 0);
  }, [modo, montoDirecto, billetes]);

  const mutation = useMutation({
    mutationFn: (payload: CerrarSesionCiegoDto) => {
      const idempotencyKey = crypto.randomUUID();
      return cerrarSesionCiego(payload, idempotencyKey);
    },
    onSuccess: (data) => {
      setResultado(data);
      queryClient.invalidateQueries({ queryKey: ['caja', 'sesionActiva'] });
    },
    onError: (error: any) => {
      if (error.status === 409) {
        setErrorMsg('La sesión de caja ya estaba cerrada.');
      } else if (error.status === 422) {
        setErrorMsg('El monto contado debe ser un entero positivo en COP.');
      } else if (error.status === 423) {
        setErrorMsg('La sesión de caja está vencida (día anterior). Contacta al administrador.');
      } else {
        setErrorMsg(error.message || 'Error al cerrar la caja');
      }
    },
  });

  const handleClose = () => {
    setModo('billetes');
    setBilletes({ b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, b2: 0 });
    setMontoDirecto(0);
    setObservacion('');
    setErrorMsg(null);
    setResultado(null);
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones
    if (!Number.isInteger(totalContado) || totalContado <= 0) {
      setErrorMsg('Debes ingresar el conteo físico del efectivo (mayor a 0).');
      return;
    }

    mutation.mutate({
      sesionCajaId: sesion.id,
      montoContadoCop: totalContado,
      observacion: observacion.trim() || undefined,
    });
  };

  const handleBilleteChange = (key: keyof BilletesState, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setBilletes((prev) => ({ ...prev, [key]: num }));
  };

  if (!isOpen) return null;

  // ============================================
  // PANTALLA DE RESULTADO (post-envío)
  // Aquí SÍ se muestra el resultado del backend.
  // ============================================
  if (resultado) {
    const esSobrante = resultado.diferenciaEfectivoCop > 0;
    const esCuadrado = resultado.diferenciaEfectivoCop === 0;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="arqueo-resultado-title"
        onClick={handleClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                esCuadrado
                  ? 'bg-emerald-500/20'
                  : esSobrante
                    ? 'bg-blue-500/20'
                    : 'bg-red-500/20'
              }`}
            >
              <CheckCircle2
                className={`w-10 h-10 ${
                  esCuadrado
                    ? 'text-emerald-400'
                    : esSobrante
                      ? 'text-blue-400'
                      : 'text-red-400'
                }`}
              />
            </div>
            <h2
              id="arqueo-resultado-title"
              className="text-xl font-black text-white font-display mb-2"
            >
              Caja Cerrada
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              El arqueo ciego fue procesado correctamente
            </p>

            <div className="space-y-2 text-sm bg-slate-800/50 rounded-xl p-4 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Efectivo contado:</span>
                <span className="font-mono font-bold text-white">
                  {formatCOP(resultado.efectivoContadoCop)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Efectivo esperado:</span>
                <span className="font-mono font-bold text-white">
                  {formatCOP(resultado.efectivoEsperadoCop)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-slate-400">Diferencia:</span>
                <span
                  className={`font-mono font-bold ${
                    esCuadrado
                      ? 'text-emerald-400'
                      : esSobrante
                        ? 'text-blue-400'
                        : 'text-red-400'
                  }`}
                >
                  {resultado.diferenciaEfectivoCop >= 0 ? '+' : ''}
                  {formatCOP(resultado.diferenciaEfectivoCop)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-slate-400">A entregar (a Central):</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCOP(resultado.efectivoAEntregarCop)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onSuccess?.();
                handleClose();
              }}
              className="w-full mt-6 min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // FORMULARIO DE CONTEO CIEGO (sin mostrar saldo teórico)
  // ============================================
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="arqueo-ciego-title"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-indigo-500/20">
              <EyeOff className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 id="arqueo-ciego-title" className="text-lg font-black text-white font-display">
                Cierre con Arqueo Ciego
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cuenta el efectivo físico de la gaveta sin ver el saldo del sistema
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Aviso de invariante CA-55 */}
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Arqueo Ciego (CA-55):</strong> Cuenta físicamente los billetes y digitа el
              total. El sistema revelará la diferencia solo después de tu conteo.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Toggle de modo */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-800 border border-white/10">
            <button
              type="button"
              onClick={() => setModo('billetes')}
              disabled={mutation.isPending}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                modo === 'billetes'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              Por billetes
            </button>
            <button
              type="button"
              onClick={() => setModo('directo')}
              disabled={mutation.isPending}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                modo === 'directo'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Total directo
            </button>
          </div>

          {/* Conteo por billetes */}
          {modo === 'billetes' && (
            <div className="space-y-2">
              {BILLETES_CONFIG.map(({ key, valor, label }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-2 rounded-xl bg-slate-800 border border-white/10"
                >
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{label}</div>
                    <div className="text-[10px] text-slate-500">
                      Subtotal: {formatCOP(billetes[key] * valor)}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={billetes[key] || ''}
                    onChange={(e) => handleBilleteChange(key, e.target.value)}
                    disabled={mutation.isPending}
                    aria-label={`Cantidad de billetes de ${label}`}
                    className="w-20 px-2 py-2 text-center rounded-lg bg-slate-900 border border-white/10 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Conteo directo */}
          {modo === 'directo' && (
            <div>
              <label
                htmlFor="monto-directo"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                Total contado en gaveta (COP entero) *
              </label>
              <input
                id="monto-directo"
                type="number"
                min="1"
                step="1"
                value={montoDirecto || ''}
                onChange={(e) => setMontoDirecto(parseInt(e.target.value) || 0)}
                disabled={mutation.isPending}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="0"
              />
            </div>
          )}

          {/* Total contado (solo conteo, NO saldo del sistema) */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Total contado:</span>
            <span className="text-lg font-mono font-black text-emerald-400">
              {formatCOP(totalContado)}
            </span>
          </div>

          {/* Observación opcional */}
          <div>
            <label
              htmlFor="observacion-arqueo"
              className="block text-xs font-semibold text-slate-300 mb-2"
            >
              Observación (opcional)
            </label>
            <textarea
              id="observacion-arqueo"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={mutation.isPending}
              rows={2}
              maxLength={200}
              placeholder="Novedades o aclaraciones del cierre..."
              className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-xs text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={mutation.isPending || totalContado <= 0}
            className="w-full min-h-[52px] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando arqueo ciego...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Confirmar arqueo ciego
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};