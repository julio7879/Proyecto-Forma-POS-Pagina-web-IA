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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#0F172A]"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <PackageCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 id="modal-recepcion-title" className="text-xl font-black text-[#0F172A]">
                Recepción de Compra
              </h2>
              <p className="text-xs text-[#475569] font-medium mt-1">
                Orden <span className="font-mono font-black text-[#741C2B]">{orden.codigo}</span> · Proveedor: <strong className="text-[#0F172A]">{orden.proveedorNombre}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso Legal */}
        <div className="px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
            Al confirmar, las cantidades se sumarán al inventario de <strong>Bodega Central</strong>.
            Esta acción es <strong>idempotente</strong> y auditable vía Kardex.
          </div>
        </div>

        {/* Tabla de líneas */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          {apiError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800">
              {apiError}
            </div>
          )}

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-4 py-3 font-black text-[#475569] uppercase text-[10px] tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 font-black text-[#475569] uppercase text-[10px] tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 font-black text-[#475569] uppercase text-[10px] tracking-wider text-right">
                    Pedido
                  </th>
                  <th className="px-4 py-3 font-black text-[#475569] uppercase text-[10px] tracking-wider text-right w-36">
                    Recibido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineas.map((l) => (
                  <tr key={l.lineaId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-black text-[#741C2B]">
                      {l.sku}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0F172A]">
                      {l.nombreProducto}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#475569]">
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
                        className="w-full px-3 py-1.5 text-right font-mono font-black rounded-xl bg-white border border-slate-300 text-[#0F172A] focus:border-[#741C2B] focus:ring-1 focus:ring-[#741C2B]/20 outline-none disabled:opacity-50 shadow-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#F8FAFC] border-t border-slate-200">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right font-black text-[#0F172A]"
                  >
                    Totales:
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-[#0F172A]">
                    {totalPedido}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-black ${
                      totalRecibido === totalPedido
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {totalRecibido}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalRecibido !== totalPedido && (
            <p className="mt-3 text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
              <span>⚠️</span> Estás registrando una recepción parcial. Verifica con el albarán del proveedor.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0F172A] hover:bg-slate-100 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || totalRecibido === 0}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Recepción'}
          </button>
        </div>
      </div>
    </div>
  );
};
