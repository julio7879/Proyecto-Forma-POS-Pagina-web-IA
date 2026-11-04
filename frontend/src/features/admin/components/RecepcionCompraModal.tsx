// frontend/src/features/admin/components/RecepcionCompraModal.tsx
import { useState, useEffect } from 'react';
import { X, Loader2, PackageCheck } from 'lucide-react';
import {
  recibirOrdenCompra,
  OrdenCompraDTO,
  RecepcionCompraDto,
} from '../services/adminService';

interface Props {
  orden: OrdenCompraDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface LineaRecepcion {
  lineaId: number;
  sku: string;
  nombreProducto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
}

export const RecepcionCompraModal = ({ orden, isOpen, onClose, onSuccess }: Props) => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lineas, setLineas] = useState<LineaRecepcion[]>([]);

  // Sincronizar las líneas al abrir el modal
  useEffect(() => {
    if (orden && isOpen) {
      setLineas(
        orden.lineas.map((l) => ({
          lineaId: l.id,
          sku: l.sku,
          nombreProducto: l.nombreProducto,
          cantidadPedida: l.cantidadPedida,
          cantidadRecibida: l.cantidadPedida, // por defecto recibir todo
        }))
      );
      setApiError(null);
    }
  }, [orden, isOpen]);

  if (!isOpen || !orden) return null;

  const handleCantidadChange = (lineaId: number, value: string) => {
    const num = Math.max(0, Math.min(parseInt(value) || 0, 999999));
    setLineas((prev) =>
      prev.map((l) => (l.lineaId === lineaId ? { ...l, cantidadRecibida: num } : l))
    );
  };

  const handleSubmit = async () => {
    setIsPending(true);
    setApiError(null);
    try {
      const payload: RecepcionCompraDto = {
        lineas: lineas.map((l) => ({
          lineaId: l.lineaId,
          cantidadRecibida: l.cantidadRecibida,
        })),
      };
      // Idempotency-Key generada en el cliente (RN-GEN-08)
      const idempotencyKey = crypto.randomUUID();
      await recibirOrdenCompra(orden.id, payload, idempotencyKey);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const totalRecibido = lineas.reduce((acc, l) => acc + l.cantidadRecibida, 0);
  const totalPedido = lineas.reduce((acc, l) => acc + l.cantidadPedida, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recepcion-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 id="modal-recepcion-title" className="text-xl font-black text-slate-900 dark:text-white">
                Recepción de Compra
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Orden {orden.codigo} · Proveedor: {orden.proveedorNombre}
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

        {/* Aviso Legal */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-800 dark:text-indigo-200">
            Al confirmar, las cantidades se sumarán al stock de <strong>Bodega Central</strong>.
            Esta acción es <strong>idempotente</strong> y solo se ejecutará una vez por orden.
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
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                    SKU
                  </th>
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                    Producto
                  </th>
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] text-right">
                    Pedido
                  </th>
                  <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] text-right w-32">
                    Recibido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {lineas.map((l) => (
                  <tr key={l.lineaId} className="bg-white dark:bg-slate-900">
                    <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                      {l.sku}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                      {l.nombreProducto}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                      {l.cantidadPedida}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        max={l.cantidadPedida}
                        value={l.cantidadRecibida}
                        onChange={(e) => handleCantidadChange(l.lineaId, e.target.value)}
                        disabled={isPending}
                        aria-label={`Cantidad recibida de ${l.nombreProducto}`}
                        className="w-full px-2 py-1.5 text-right font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <td
                    colSpan={2}
                    className="px-3 py-2 text-right font-bold text-slate-700 dark:text-slate-300"
                  >
                    Totales:
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    {totalPedido}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-bold ${
                      totalRecibido === totalPedido
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {totalRecibido}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalRecibido !== totalPedido && (
            <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
              ⚠️ Estás registrando una recepción parcial. Verifica con el proveedor.
            </p>
          )}
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
            disabled={isPending || totalRecibido === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-500/25"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Recepción'}
          </button>
        </div>
      </div>
    </div>
  );
};