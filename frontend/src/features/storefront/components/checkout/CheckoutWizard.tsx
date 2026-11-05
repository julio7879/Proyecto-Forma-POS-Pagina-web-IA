// frontend/src/features/storefront/components/checkout/CheckoutWizard.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Banknote,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  fetchDepartamentos,
  submitCheckout,
  DepartamentoDaneDTO,
  MunicipioDaneDTO,
  MedioPagoWeb,
} from '../../services/pedidosWebService';

interface CheckoutState {
  paso: 1 | 2 | 3;
  municipioSeleccionado: MunicipioDaneDTO | null;
  direccion: string;
  medioPago: MedioPagoWeb;
  comprobante: string | null;
}

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);

// ============================================
// PASO 1: Destino de Envío
// ============================================
interface Step1Props {
  departamentos: DepartamentoDaneDTO[];
  loading: boolean;
  error: string | null;
  municipioSeleccionado: MunicipioDaneDTO | null;
  onSelectMunicipio: (mun: MunicipioDaneDTO) => void;
  onNext: () => void;
  onRetry: () => void;
}

const Step1Destino = ({
  departamentos,
  loading,
  error,
  municipioSeleccionado,
  onSelectMunicipio,
  onNext,
  onRetry,
}: Step1Props) => {
  const [departamentoId, setDepartamentoId] = useState<number | ''>('');

  const municipiosDisponibles = useMemo(() => {
    if (!departamentoId) return [];
    return departamentos.find((d) => d.departamentoId === departamentoId)?.municipios || [];
  }, [departamentoId, departamentos]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
        <p className="mb-3">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 font-bold text-xs hover:bg-red-300 dark:hover:bg-red-700 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="departamento"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Departamento
        </label>
        <select
          id="departamento"
          value={departamentoId}
          onChange={(e) => setDepartamentoId(e.target.value ? Number(e.target.value) : '')}
          className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Selecciona un departamento</option>
          {departamentos.map((d) => (
            <option key={d.departamentoId} value={d.departamentoId}>
              {d.departamentoNombre}
            </option>
          ))}
        </select>
      </div>

      {departamentoId && (
        <div>
          <label
            htmlFor="municipio"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Municipio DANE
          </label>
          <select
            id="municipio"
            value={municipioSeleccionado?.municipioId || ''}
            onChange={(e) => {
              const mun = municipiosDisponibles.find(
                (m) => m.municipioId === Number(e.target.value)
              );
              if (mun) onSelectMunicipio(mun);
            }}
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Selecciona un municipio</option>
            {municipiosDisponibles.map((m) => (
              <option key={m.municipioId} value={m.municipioId}>
                {m.municipioNombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {municipioSeleccionado && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-indigo-800 dark:text-indigo-300">
              Zona {municipioSeleccionado.zona}
            </span>
            <span className="text-indigo-700 dark:text-indigo-400">
              {municipioSeleccionado.diasEstimados} días hábiles
            </span>
          </div>
          <div className="font-mono text-sm font-bold text-indigo-900 dark:text-indigo-200">
            Flete: {formatCOP(municipioSeleccionado.tarifaFleteCop)}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!municipioSeleccionado}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
      >
        Continuar al pago
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================
// PASO 2: Medio de Pago
// ============================================
interface Step2Props {
  medioPago: MedioPagoWeb;
  onSelectMedio: (medio: MedioPagoWeb) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2Pago = ({ medioPago, onSelectMedio, onNext, onBack }: Step2Props) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSelectMedio('TRANSFERENCIA')}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            medioPago === 'TRANSFERENCIA'
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Transferencia bancaria
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Reserva temporal por 24 horas
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectMedio('CONTRAENTREGA')}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            medioPago === 'CONTRAENTREGA'
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Pago contraentrega
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Paga en efectivo al recibir tu pedido
              </div>
            </div>
          </div>
        </button>
      </div>

      {medioPago === 'TRANSFERENCIA' && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-800 dark:text-blue-300">
          <strong className="block mb-1">Instrucciones de pago:</strong>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Banco: Bancolombia</li>
            <li>Cuenta de ahorros: 123-456789-01</li>
            <li>Titular: Forma Store S.A.S</li>
            <li>NIT: 900.123.456-7</li>
          </ul>
          <p className="mt-2 font-semibold">
            Envía el comprobante con tu número de pedido por WhatsApp.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
        >
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// PASO 3: Confirmación
// ============================================
interface Step3Props {
  municipio: MunicipioDaneDTO;
  direccion: string;
  medioPago: MedioPagoWeb;
  isSubmitting: boolean;
  errorVenta: string | null;
  onDireccionChange: (dir: string) => void;
  onConfirmar: () => void;
  onBack: () => void;
}

const Step3Confirmacion = ({
  municipio,
  direccion,
  medioPago,
  isSubmitting,
  errorVenta,
  onDireccionChange,
  onConfirmar,
  onBack,
}: Step3Props) => {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="direccion"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Dirección de entrega
        </label>
        <input
          id="direccion"
          type="text"
          value={direccion}
          onChange={(e) => onDireccionChange(e.target.value)}
          placeholder="Ej. Calle 10 #25-30, Apto 201"
          disabled={isSubmitting}
          className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
        />
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold">
            {municipio.municipioNombre}, {municipio.departamentoNombre}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Package className="w-4 h-4 text-indigo-600" />
          <span>
            Zona {municipio.zona} · {municipio.diasEstimados} días hábiles
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          {medioPago === 'TRANSFERENCIA' ? (
            <CreditCard className="w-4 h-4 text-indigo-600" />
          ) : (
            <Banknote className="w-4 h-4 text-emerald-600" />
          )}
          <span>
            {medioPago === 'TRANSFERENCIA' ? 'Transferencia bancaria' : 'Pago contraentrega'}
          </span>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
          <div className="flex justify-between font-mono font-bold text-slate-900 dark:text-white text-sm">
            <span>Flete:</span>
            <span>{formatCOP(municipio.tarifaFleteCop)}</span>
          </div>
        </div>
      </div>

      {errorVenta && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
          {errorVenta}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" />
          Atrás
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={isSubmitting || direccion.trim().length < 5}
          className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirmar pedido
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const CheckoutWizard = () => {
  const navigate = useNavigate();

  const [departamentos, setDepartamentos] = useState<DepartamentoDaneDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<CheckoutState>({
    paso: 1,
    municipioSeleccionado: null,
    direccion: '',
    medioPago: 'TRANSFERENCIA',
    comprobante: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorVenta, setErrorVenta] = useState<string | null>(null);

  // Extraer como función para reutilizar en el retry
  const cargarDepartamentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDepartamentos();
      setDepartamentos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los municipios disponibles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDepartamentos();
  }, []);

  const handleConfirmar = async () => {
    if (!state.municipioSeleccionado) return;
    setIsSubmitting(true);
    setErrorVenta(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await submitCheckout(
        {
          direccion: state.direccion.trim(),
          municipioId: state.municipioSeleccionado.municipioId,
          medioPago: state.medioPago,
          lineas: [], // TODO: conectar con CartDrawer del Storefront (Sprint 5)
        },
        idempotencyKey
      );

      setState((prev) => ({ ...prev, comprobante: response.comprobante }));
      navigate('/mis-pedidos');
    } catch (err: any) {
      setErrorVenta(err.message || 'Error al procesar el checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  state.paso === n
                    ? 'bg-indigo-600 text-white'
                    : state.paso > n
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {state.paso > n ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              {n < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    state.paso > n ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-indigo-600 mb-4 flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver al catálogo
          </button>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1 font-display">
            {state.paso === 1 && 'Destino de envío'}
            {state.paso === 2 && 'Medio de pago'}
            {state.paso === 3 && 'Confirma tu pedido'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {state.paso === 1 && 'Selecciona dónde quieres recibir tu pedido.'}
            {state.paso === 2 && 'Elige cómo prefieres pagar.'}
            {state.paso === 3 && 'Verifica los datos y confirma tu compra.'}
          </p>

          {state.paso === 1 && (
            <Step1Destino
              departamentos={departamentos}
              loading={loading}
              error={error}
              municipioSeleccionado={state.municipioSeleccionado}
              onSelectMunicipio={(mun) =>
                setState((prev) => ({ ...prev, municipioSeleccionado: mun }))
              }
              onNext={() => setState((prev) => ({ ...prev, paso: 2 }))}
              onRetry={cargarDepartamentos}
            />
          )}

          {state.paso === 2 && (
            <Step2Pago
              medioPago={state.medioPago}
              onSelectMedio={(medio) => setState((prev) => ({ ...prev, medioPago: medio }))}
              onNext={() => setState((prev) => ({ ...prev, paso: 3 }))}
              onBack={() => setState((prev) => ({ ...prev, paso: 1 }))}
            />
          )}

          {state.paso === 3 && state.municipioSeleccionado && (
            <Step3Confirmacion
              municipio={state.municipioSeleccionado}
              direccion={state.direccion}
              medioPago={state.medioPago}
              isSubmitting={isSubmitting}
              errorVenta={errorVenta}
              onDireccionChange={(dir) => setState((prev) => ({ ...prev, direccion: dir }))}
              onConfirmar={handleConfirmar}
              onBack={() => setState((prev) => ({ ...prev, paso: 2 }))}
            />
          )}
        </div>
      </div>
    </div>
  );
};