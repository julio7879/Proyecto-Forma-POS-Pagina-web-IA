import React, { useEffect } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Plus, Minus } from 'lucide-react';
import { CartItem } from '../types.js';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateCantidad: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateCantidad,
  onRemoveItem,
  onCheckout,
}) => {
  // Manejo de teclado: tecla Esc para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloqueo del scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Totales en COP Entero (Invariante RN-GEN-04: Cero centavos)
  const totalCOP = items.reduce(
    (acc, item) => acc + item.precioUnitarioCOP * item.cantidad,
    0
  );

  // IVA 19% discriminado (simulado desde el valor total según RN-GEN-01: IVA incluido en precio)
  // Fórmula legal: IVA = Total - Math.round(Total / 1.19)
  const baseGravableCOP = Math.round(totalCOP / 1.19);
  const ivaEstimadoCOP = totalCOP - baseGravableCOP;

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  const totalItems = items.reduce((acc, it) => acc + it.cantidad, 0);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      {/* Backdrop con desenfoque Liquid Glass */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-l border-slate-200/60 dark:border-slate-800/80 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header del Carrito */}
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="cart-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Tu Carrito de Compras
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {totalItems} {totalItems === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Cerrar carrito de compras"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Ítems */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-4 border border-slate-200 dark:border-slate-800">
                  <ShoppingBag className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Tu carrito está vacío
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                  Explora las colecciones y añade prendas exclusivas o artesanías con stock en tiempo real.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all shadow-glow-indigo"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-3.5 flex gap-3.5 border border-slate-200/60 dark:border-slate-800/60"
                >
                  <img
                    src={item.imagenUrl}
                    alt={item.nombre}
                    className="w-18 h-22 w-20 h-24 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.nombre}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          aria-label={`Eliminar ${item.nombre} del carrito`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.talla && `Talla: ${item.talla}`}
                        {item.color && ` · Color: ${item.color}`}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">
                        SKU: {item.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      {/* Control de Cantidad */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => onUpdateCantidad(item.id, -1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          aria-label="Disminuir una unidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold font-mono text-slate-900 dark:text-white">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateCantidad(item.id, 1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          aria-label="Aumentar una unidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal de Línea */}
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {formatCOP(item.precioUnitarioCOP * item.cantidad)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer del Carrito con Resumen Financiero */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Base gravable estimada:</span>
                  <span className="font-mono">{formatCOP(baseGravableCOP)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>IVA (19% discriminado):</span>
                  <span className="font-mono">{formatCOP(ivaEstimadoCOP)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Envío a domicilio:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Calculado en Checkout (Zona DANE)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Total del Pedido:
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {formatCOP(totalCOP)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      COP (Entero sin decimales)
                    </span>
                  </div>
                </div>
              </div>

              {/* Leyenda de Devolución Legal */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/40 dark:border-indigo-800/40 text-[11px] text-indigo-700 dark:text-indigo-300 mb-4">
                <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" aria-hidden="true" />
                <span>
                  <strong>5 días hábiles</strong> para retracto de compras web conforme a la Ley 1480 de 2011.
                </span>
              </div>

              {/* Botón de Checkout */}
              <button
                type="button"
                onClick={onCheckout}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-glow-indigo active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span>Continuar al Pago Seguro</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
