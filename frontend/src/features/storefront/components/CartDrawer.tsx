import React, { useEffect, useContext } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react';
import { useNavigate, UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateCantidad: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout?: () => void;
}

// Hook de navegación seguro para funcionar tanto en React Router como en tests unitarios aislados
const useSafeNavigate = () => {
  const context = useContext(NavigationContext);
  if (!context || !context.navigator) {
    return (to: string) => {
      if (typeof window !== 'undefined') {
        window.location.href = to;
      }
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useNavigate();
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateCantidad,
  onRemoveItem,
  onCheckout,
}) => {
  const navigate = useSafeNavigate();

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

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  const totalItems = items.reduce((acc, it) => acc + it.cantidad, 0);

  const handleContinuarAlPago = () => {
    onClose();
    if (typeof onCheckout === 'function') {
      onCheckout();
    }
    navigate('/checkout');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      {/* Backdrop con desenfoque cálido */}
      <div
        className="fixed inset-0 bg-[#171717]/65 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        {/* Panel Slide-Over con ancho restringido max-w-md / sm:max-w-lg y overflow-x-hidden estricto */}
        <aside className="w-screen max-w-md sm:max-w-lg glass-mirror-drawer flex flex-col justify-between relative overflow-x-hidden overflow-y-hidden shadow-2xl animate-in slide-in-from-right duration-300 bg-white/95 backdrop-blur-xl border-l border-[#50322A]/15">
          {/* Header de la Bolsa */}
          <div className="relative z-10 px-5 py-4 sm:px-6 sm:py-5 border-b border-[#50322A]/15 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-[#661521] text-white shadow-md shrink-0">
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 id="cart-title" className="font-display text-lg sm:text-xl font-bold text-[#351912] truncate">
                    Tu Carrito de Compras
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#661521] text-white text-xs font-bold font-mono-tabular shrink-0">
                    {totalItems}
                  </span>
                </div>
                <p className="text-xs text-[#50322A]/80 font-medium truncate mt-0.5">
                  {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'} · Despacho oficial FORMA
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full glass-mirror-pill text-[#50322A] hover:bg-[#661521] hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#661521] shrink-0"
              aria-label="Cerrar carrito de compras"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Ítems sin scroll horizontal */}
          <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl glass-mirror-card flex items-center justify-center text-[#50322A] mb-4 bg-[#E7DED2]/50">
                  <ShoppingBag className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#351912] mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-xs sm:text-sm text-[#171717]/80 max-w-xs mb-6 leading-relaxed">
                  Explora las colecciones y añade prendas exclusivas de autor, cosmética y artesanías con disponibilidad en tiempo real en nuestras 4 boutiques.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#D19650] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b87f3d] transition-all shadow-md active:scale-95"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="w-full min-w-0 glass-mirror-card rounded-2xl p-3.5 flex gap-3 transition-all hover:bg-white bg-white/60 border border-[#50322A]/10 shadow-xs"
                  >
                    {/* Foto estricta w-16 h-20 */}
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      className="w-16 h-20 rounded-xl object-cover shrink-0 bg-[#E7DED2] border border-[#50322A]/10 shadow-xs"
                    />

                    {/* Contenido sin desbordamiento */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-serif-editorial text-sm font-bold text-[#351912] truncate">
                            {item.nombre}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-[#171717]/40 hover:text-[#661521] transition-colors p-1 shrink-0"
                            aria-label={`Eliminar ${item.nombre} del carrito`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Metadatos: Talla, Color, SKU */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {item.talla && (
                            <span className="px-2 py-0.5 rounded-md bg-[#661521] text-white text-[10px] font-bold">
                              Talla {item.talla}
                            </span>
                          )}
                          {item.color && (
                            <span className="px-2 py-0.5 rounded-md bg-white text-[#351912] text-[10px] font-bold border border-[#50322A]/20 truncate max-w-[120px]">
                              {item.color}
                            </span>
                          )}
                          <span className="font-mono-tabular text-[10px] text-[#171717]/60 truncate">
                            SKU: {item.sku}
                          </span>
                        </div>
                      </div>

                      {/* Steppers y Precio */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#50322A]/10">
                        <div className="flex items-center border border-[#50322A]/20 rounded-full overflow-hidden bg-white shadow-xs">
                          <button
                            type="button"
                            onClick={() => onUpdateCantidad(item.id, -1)}
                            className="p-1.5 hover:bg-[#E7DED2] text-[#50322A] transition-colors"
                            aria-label="Disminuir una unidad"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold font-mono-tabular text-[#171717]">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCantidad(item.id, 1)}
                            className="p-1.5 hover:bg-[#E7DED2] text-[#50322A] transition-colors"
                            aria-label="Aumentar una unidad"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-sm font-black font-mono-tabular text-[#351912]">
                          {formatCOP(item.precioUnitarioCOP * item.cantidad)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer de la Bolsa con Totales y CTA */}
          {items.length > 0 && (
            <div className="relative z-10 p-5 sm:p-6 border-t border-[#50322A]/15 bg-white/90 backdrop-blur-xl shrink-0 space-y-3.5">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-[#351912]">
                  Total:
                </span>
                <span className="text-2xl font-black font-mono-tabular text-[#351912]">
                  {formatCOP(totalCOP)}
                </span>
              </div>

              {/* Leyenda de Devolución Legal (Ley 1480) requerida para tests y transparencia */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#661521]/5 border border-[#661521]/15 text-xs text-[#661521]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#661521]" aria-hidden="true" />
                <span>
                  <strong>5 días hábiles</strong> para retracto de compras web conforme a la Ley 1480 de 2011.
                </span>
              </div>

              {/* Botón de Checkout "Continuar al Pago Seguro" */}
              <button
                type="button"
                onClick={handleContinuarAlPago}
                className="w-full py-3.5 px-5 rounded-full bg-[#D19650] hover:bg-[#b87f3d] active:scale-[0.99] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-between transition-all duration-200 shadow-lg shadow-[#D19650]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#661521]"
              >
                <span>Continuar al Pago Seguro</span>
                <span className="w-7 h-7 rounded-full bg-[#50322A] text-white flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </button>

              {/* Enlace para ver la Bolsa Completa */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/bolsa');
                }}
                className="w-full py-2.5 px-4 rounded-full bg-white/90 hover:bg-[#E7DED2]/60 text-[#50322A] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-[#50322A]/20 transition-all shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#D19650]" />
                <span>Ver Bolsa Completa en Pantalla</span>
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
