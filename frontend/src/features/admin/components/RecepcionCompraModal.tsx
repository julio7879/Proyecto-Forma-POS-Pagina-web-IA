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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#1A060B]/95 border border-white/[0.18] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-white backdrop-blur-2xl"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-white/[0.12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 id="modal-recepcion-title" className="text-xl font-black text-white">
                Recepción de Compra
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Orden <span className="font-mono text-[#E5BE90]">{orden.codigo}</span> · Proveedor: {orden.proveedorNombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso Legal */}
        <div className="px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-[#C49A68]/10 border border-[#C49A68]/30 text-xs text-[#E5BE90]">
            Al confirmar, las cantidades se sumarán al inventario de <strong>Bodega Central</strong>.
            Esta acción es <strong>idempotente</strong> y auditable vía Kardex.
          </div>
        </div>

        {/* Tabla de líneas */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {apiError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
              {apiError}
            </div>
          )}

          <div className="rounded-2xl overflow-hidden border border-white/[0.12] bg-white/[0.03]">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.06] border-b border-white/[0.10]">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-white/70 uppercase text-[10px] tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 font-semibold text-white/70 uppercase text-[10px] tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 font-semibold text-white/70 uppercase text-[10px] tracking-wider text-right">
                    Pedido
                  </th>
                  <th className="px-4 py-3 font-semibold text-white/70 uppercase text-[10px] tracking-wider text-right w-36">
                    Recibido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08]">
                {lineas.map((l) => (
                  <tr key={l.lineaId} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3 font-mono text-[#E5BE90]">
                      {l.sku}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {l.nombreProducto}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white/80">
                      {l.cantidadPedida}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max={l.cantidadPedida}
                        value={l.cantidadRecibida}
                        onChange={(e) => handleCantidadChange(l.lineaId, e.target.value)}
                        disabled={isPending}
                        aria-label={`Cantidad recibida de ${l.nombreProducto}`}
                        className="w-full px-3 py-1.5 text-right font-mono font-bold rounded-xl bg-black/40 border border-white/[0.20] text-white focus:border-[#C49A68] focus:ring-1 focus:ring-[#C49A68] outline-none disabled:opacity-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/[0.06] border-t border-white/[0.12]">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right font-bold text-white/90"
                  >
                    Totales:
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    {totalPedido}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold ${
                      totalRecibido === totalPedido
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {totalRecibido}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalRecibido !== totalPedido && (
            <p className="mt-3 text-[11px] text-amber-300 flex items-center gap-1.5">
              <span>⚠️</span> Estás registrando una recepción parcial. Verifica con el albarán del proveedor.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.12] flex justify-end gap-3 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-white/[0.07] border border-white/[0.14] text-white/80 hover:bg-white/[0.15] hover:text-white transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || totalRecibido === 0}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Recepción'}
          </button>
        </div>
      </div>
    </div>
  );
};
