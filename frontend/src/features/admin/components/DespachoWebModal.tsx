// frontend/src/features/admin/components/DespachoWebModal.tsx
import { useState, useEffect } from 'react';
import { X, Loader2, Truck, AlertTriangle } from 'lucide-react';
import {
  despacharPedidoWeb,
  DespachoWebDto,
  PedidoWebDTO,
} from '../services/adminService';

const TRANSPORTADORAS_SUGERIDAS = [
  'Servientrega',
  'Interrapidísimo',
  'Envia',
  'Coordinadora',
  'TCC',
  'Otra',
];

interface Props {
  pedido: PedidoWebDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DespachoWebModal = ({ pedido, isOpen, onClose, onSuccess }: Props) => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [transportadora, setTransportadora] = useState('');
  const [numeroGuia, setNumeroGuia] = useState('');
  const [backendPendiente, setBackendPendiente] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTransportadora('');
      setNumeroGuia('');
      setApiError(null);
      setBackendPendiente(false);
    }
  }, [isOpen]);

  if (!isOpen || !pedido) return null;

  const formularioValido =
    transportadora.trim().length > 0 && numeroGuia.trim().length >= 3;

  const handleSubmit = async () => {
    if (!formularioValido) return;

    setIsPending(true);
    setApiError(null);
    setBackendPendiente(false);

    try {
      const payload: DespachoWebDto = {
        transportadora: transportadora.trim(),
        numeroGuia: numeroGuia.trim(),
      };
      const idempotencyKey = crypto.randomUUID();
      await despacharPedidoWeb(pedido.id, payload, idempotencyKey);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      // Detección de endpoint pendiente en backend (404/405)
      if (error.status === 404 || error.status === 405) {
        setBackendPendiente(true);
        setApiError(
          'El endpoint de despacho aún no está habilitado en el backend. El equipo de backend debe implementar POST /api/pedidos-web/:id/despachar.'
        );
      } else {
        setApiError(error.message || 'Error al despachar el pedido.');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-despacho-web-title"
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
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-950/40">
              <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2
                id="modal-despacho-web-title"
                className="text-xl font-black text-slate-900 dark:text-white"
              >
                Despachar Pedido Web
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {pedido.referenciaLegible} · Destino: {pedido.municipioDestinoNombre ?? pedido.municipioDestinoId}
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
              Al confirmar, el pedido pasará a <strong>ENVIADO</strong> y se descontará el
              stock físico de la sede (<code className="font-mono">DESPACHO_WEB</code>).
              Esta acción es <strong>idempotente</strong>.
            </span>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {apiError && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                backendPendiente
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200'
              }`}
            >
              {apiError}
            </div>
          )}

          <div>
            <label
              htmlFor="transportadora"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Empresa transportadora *
            </label>
            <select
              id="transportadora"
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              disabled={isPending}
              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
            >
              <option value="">Seleccione una transportadora...</option>
              {TRANSPORTADORAS_SUGERIDAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {transportadora === 'Otra' && (
            <div>
              <label
                htmlFor="transportadora-otra"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Nombre de la transportadora *
              </label>
              <input
                id="transportadora-otra"
                type="text"
                value={transportadora === 'Otra' ? '' : transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                disabled={isPending}
                placeholder="Ej. Mi Transportadora S.A.S"
                className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="numero-guia"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Número de guía de envío *
            </label>
            <input
              id="numero-guia"
              type="text"
              value={numeroGuia}
              onChange={(e) => setNumeroGuia(e.target.value)}
              disabled={isPending}
              placeholder="Ej. 123456789012"
              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-mono disabled:opacity-50"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Mínimo 3 caracteres alfanuméricos.
            </p>
          </div>

          {/* Resumen del pedido */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Destinatario:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {pedido.destinatarioNombre}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Teléfono:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {pedido.destinatarioTelefono}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dirección:</span>
              <span className="text-right text-slate-800 dark:text-slate-200 max-w-[60%] truncate">
                {pedido.direccionEntrega}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Municipio DANE:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {pedido.municipioDestinoId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Líneas:</span>
              <span className="text-slate-800 dark:text-slate-200">
                {pedido.lineas.length} artículo(s)
              </span>
            </div>
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
            disabled={isPending || !formularioValido || backendPendiente}
            title={
              backendPendiente
                ? 'Función pendiente de habilitación por el equipo backend'
                : undefined
            }
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-indigo-500/25"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Confirmar Despacho
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};