// frontend/src/features/storefront/components/ProductDetailModal.tsx
import { useState, useEffect } from 'react';
import { ProductoDTO, VarianteDTO, formatMoneyCOP } from '../services/catalogService';
import { X, Check, ShoppingBag, ShieldAlert } from 'lucide-react';

interface Props {
  producto: ProductoDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (variante: VarianteDTO, cantidad: number) => void;
}

export const ProductDetailModal = ({ producto, isOpen, onClose, onAddToCart }: Props) => {
  if (!isOpen || !producto) return null;

  // Estado de variante seleccionada (por defecto la primera)
  const [selectedVariante, setSelectedVariante] = useState<VarianteDTO>(producto.variantes[0]);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (producto.variantes.length > 0) {
      setSelectedVariante(producto.variantes[0]);
      setCantidad(1);
    }
  }, [producto]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Opciones únicas de tallas y colores disponibles
  const tallasDisponibles = Array.from(new Set(producto.variantes.map((v) => v.talla)));
  const coloresDisponibles = Array.from(new Set(producto.variantes.map((v) => v.color)));

  const handleSelectTalla = (talla: string) => {
    // Buscar una variante que coincida con la talla y el color actual, o la primera con esa talla
    const match =
      producto.variantes.find((v) => v.talla === talla && v.color === selectedVariante.color) ||
      producto.variantes.find((v) => v.talla === talla);
    if (match) setSelectedVariante(match);
  };

  const handleSelectColor = (color: string) => {
    const match =
      producto.variantes.find((v) => v.color === color && v.talla === selectedVariante.talla) ||
      producto.variantes.find((v) => v.color === color);
    if (match) setSelectedVariante(match);
  };

  const isAgotado = selectedVariante.stockDisponible === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Imagen del modal */}
        <div className="md:w-1/2 relative bg-slate-100 dark:bg-slate-800 h-64 md:h-auto">
          <img
            src={producto.imagenesUrls[0]}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="md:hidden absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 text-white backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido e interacciones */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {producto.categoriaNombre}
              </span>
              <button
                onClick={onClose}
                aria-label="Cerrar modal"
                className="hidden md:block p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 id="modal-product-title" className="text-xl font-black text-slate-900 dark:text-white mb-1">
              {producto.nombre}
            </h2>

            {/* SKU oficial y precio en COP */}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {formatMoneyCOP(selectedVariante.precioVentaCop)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                SKU: <strong className="text-slate-700 dark:text-slate-300">{selectedVariante.sku}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {producto.descripcion}
            </p>

            {/* Aviso de Cosméticos No Reintegrables (RN-CAT-02 / CA-31) */}
            {!producto.reintegrableEnDevolucion && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/50 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-200 leading-tight">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>⚠️ Producto de uso personal sin cambio por higiene (Ley 1480 / RN-CAT-02).</span>
              </div>
            )}

            {/* Selector de Tallas */}
            {tallasDisponibles.length > 0 && tallasDisponibles[0] !== 'Única' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Talla / Presentación:
                </label>
                <div className="flex flex-wrap gap-2">
                  {tallasDisponibles.map((talla) => {
                    const isSelected = selectedVariante.talla === talla;
                    return (
                      <button
                        key={talla}
                        type="button"
                        onClick={() => handleSelectTalla(talla)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                        }`}
                      >
                        {talla}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selector de Colores */}
            {coloresDisponibles.length > 0 && coloresDisponibles[0] !== 'Neutro' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Color / Tono:
                </label>
                <div className="flex flex-wrap gap-2">
                  {coloresDisponibles.map((color) => {
                    const isSelected = selectedVariante.color === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleSelectColor(color)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Semáforo de stock de la variante */}
            <div className="mb-4 text-xs font-medium">
              Disponibilidad:{' '}
              {selectedVariante.stockDisponible > 5 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  En Stock ({selectedVariante.stockDisponible} unidades)
                </span>
              ) : selectedVariante.stockDisponible >= 1 ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  ¡Últimas {selectedVariante.stockDisponible} unidades!
                </span>
              ) : (
                <span className="text-red-500 font-bold">Agotado temporalmente</span>
              )}
            </div>
          </div>

          {/* Botón de Agregar a la bolsa */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={isAgotado}
              onClick={() => {
                if (onAddToCart) onAddToCart(selectedVariante, cantidad);
                onClose();
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              {isAgotado ? 'Variante Agotada' : 'Agregar a la Bolsa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};