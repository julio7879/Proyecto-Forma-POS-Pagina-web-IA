// frontend/src/features/storefront/components/ProductDetailModal.tsx
import { useState, useEffect } from 'react';
import { ProductoDTO, VarianteDTO, formatMoneyCOP } from '../services/catalogService';
import {
  X,
  Check,
  ShoppingBag,
  ShieldAlert,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  producto: ProductoDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (variante: VarianteDTO, cantidad: number) => void;
}

const SEDES_FISICAS = [
  { key: 'Punto Centro', label: 'Centro', fallback: 6 },
  { key: 'Punto Caobos', label: 'Caobos', fallback: 4 },
  { key: 'Punto Ocaña', label: 'Ocaña', fallback: 3 },
  { key: 'Punto Bucaramanga', label: 'BGA', fallback: 5 },
];

export const ProductDetailModal = ({ producto, isOpen, onClose, onAddToCart }: Props) => {
  // 1. Hooks siempre arriba (Rules of Hooks)
  const [selectedVariante, setSelectedVariante] = useState<VarianteDTO | null>(
    producto?.variantes[0] || null
  );
  const [cantidad, setCantidad] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (producto && producto.variantes.length > 0) {
      setSelectedVariante(producto.variantes[0]);
      setCantidad(1);
      setSelectedImageIndex(0);
    }
  }, [producto]);

  // 2. Listener de Escape condicionado a isOpen
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 3. Retorno temprano después de los hooks
  if (!isOpen || !producto || !selectedVariante) return null;

  const tallasDisponibles = Array.from(new Set(producto.variantes.map((v) => v.talla)));
  const coloresDisponibles = Array.from(new Set(producto.variantes.map((v) => v.color)));

  // Lógica real de variantes de inventario:
  // Al seleccionar talla, buscar la variante con esa talla y el color actual. Si no existe, primera con esa talla.
  const handleSelectTalla = (talla: string) => {
    const match =
      producto.variantes.find((v) => v.talla === talla && v.color === selectedVariante.color) ||
      producto.variantes.find((v) => v.talla === talla);
    if (match) {
      setSelectedVariante(match);
      if (cantidad > Math.max(1, match.stockDisponible)) {
        setCantidad(1);
      }
    }
  };

  // Al seleccionar color, buscar la variante con ese color y la talla actual. Si no existe, primera con ese color.
  const handleSelectColor = (color: string) => {
    const match =
      producto.variantes.find((v) => v.color === color && v.talla === selectedVariante.talla) ||
      producto.variantes.find((v) => v.color === color);
    if (match) {
      setSelectedVariante(match);
      if (cantidad > Math.max(1, match.stockDisponible)) {
        setCantidad(1);
      }
    }
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : producto.imagenesUrls.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < producto.imagenesUrls.length - 1 ? prev + 1 : 0));
  };

  const isAgotado = selectedVariante.stockDisponible === 0;
  const esCosmeticoSinCambio =
    producto.categoriaNombre === 'Cosméticos' || !producto.reintegrableEnDevolucion;

  const maxCantidad = Math.max(1, selectedVariante.stockDisponible);

  const handleIncrement = () => {
    if (cantidad < maxCantidad) setCantidad((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (cantidad > 1) setCantidad((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    if (isAgotado) return;
    if (onAddToCart) {
      onAddToCart(selectedVariante, cantidad);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#171717]/65 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#E7DED2] border-2 border-white/85 rounded-3xl sm:rounded-[2.25rem] shadow-[0_35px_90px_-15px_rgba(23,23,23,0.6)] overflow-hidden p-4 sm:p-6 lg:p-10 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Capas de Luz Ambiental Sutil */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-white/75 via-white/25 to-transparent blur-3xl opacity-80" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-[#D19650]/15 rounded-full blur-3xl" />
        </div>

        {/* Botón Cerrar Flotante en la esquina superior derecha */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 border border-white/90 flex items-center justify-center text-[#50322A] hover:bg-[#661521] hover:text-white transition-all shadow-sm active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ESTRUCTURA ESPACIAL DE 3 COLUMNAS: Izquierda (3fr) | Centro Protagonista (5fr) | Derecha Compra (4fr) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* ================= COLUMNA IZQUIERDA (lg:col-span-3): Narrativa y Detalles de Marca ================= */}
          <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#661521]">
                  FORMA ATELIER
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D19650]" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#661521]/10 text-[#661521] text-[10px] font-bold uppercase tracking-wider">
                {producto.categoriaNombre}
              </span>
            </div>

            <h2
              id="modal-product-title"
              className="font-serif-editorial text-2xl sm:text-3xl font-medium text-[#50322A] leading-tight tracking-tight"
            >
              {producto.nombre}
            </h2>

            <p className="text-xs sm:text-sm text-[#171717]/80 leading-relaxed font-sans">
              {producto.descripcion}
            </p>

            <div className="pt-3 border-t border-[#50322A]/10 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#50322A] block">
                Composición & Acabado
              </span>
              <p className="text-xs text-[#171717]/70 leading-relaxed">
                Confección artesanal contemporánea y materiales seleccionados de alta pureza.
              </p>
            </div>
          </div>

          {/* ================= COLUMNA CENTRAL (lg:col-span-5): Escenario Protagonista de la Prenda ================= */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-center">
            <div className="relative w-full max-w-[300px] sm:max-w-[380px] aspect-[3/3.8] rounded-2xl sm:rounded-3xl overflow-hidden bg-white/70 border-2 border-white/95 shadow-xl flex items-center justify-center group">
              <img
                src={producto.imagenesUrls[selectedImageIndex] || producto.imagenesUrls[0]}
                alt={producto.nombre}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />

              {/* Botones discretos < y > para alternar fotos si hay más de 1 imagen */}
              {producto.imagenesUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#50322A] flex items-center justify-center shadow-md transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Foto siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#50322A] flex items-center justify-center shadow-md transition-all active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Indicador de mini puntos */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full">
                    {producto.imagenesUrls.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          selectedImageIndex === idx ? 'bg-white w-3' : 'bg-white/50 w-1.5'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sombra suave de piso para el escenario de alta costura */}
            <div className="w-48 h-3.5 bg-[#50322A]/15 blur-md rounded-full mt-2" aria-hidden="true" />
          </div>

          {/* ================= COLUMNA DERECHA (lg:col-span-4): Configuración de Compra ================= */}
          <div className="lg:col-span-4 order-3 lg:order-3 flex flex-col space-y-4">
            {/* Precio en COP Entero + IVA incluido */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono tabular-nums text-2xl font-black text-[#50322A]">
                  {formatMoneyCOP(selectedVariante.precioVentaCop)}
                </span>
                <span className="text-xs font-medium text-[#50322A]/60">IVA incluido</span>
              </div>

              {/* SKU activo visible y claro */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="text-xs text-[#171717]/80 font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-white/80 border border-white/90 shadow-xs">
                  SKU: <strong className="text-[#171717]">{selectedVariante.sku}</strong>
                </span>

                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/80 border border-white/90">
                  {selectedVariante.stockDisponible > 5 ? (
                    <span className="text-emerald-700">● Disponible</span>
                  ) : selectedVariante.stockDisponible >= 1 ? (
                    <span className="text-[#D19650]">● ¡Últimas unidades!</span>
                  ) : (
                    <span className="text-red-600">● Agotado</span>
                  )}
                </span>
              </div>
            </div>

            {/* Selector de Color */}
            {coloresDisponibles.length > 0 && !(coloresDisponibles.length === 1 && coloresDisponibles[0] === 'Neutro') && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#171717]">
                  Color: <span className="font-semibold text-[#50322A]">{selectedVariante.color}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {coloresDisponibles.map((color) => {
                    const isSelected = selectedVariante.color === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleSelectColor(color)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#50322A] text-white border-[#50322A] shadow-sm'
                            : 'bg-white/75 text-[#171717] border-[#50322A]/20 hover:border-[#50322A]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-[#D19650]" />}
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selector de Tallas Circular */}
            {tallasDisponibles.length > 0 && !(tallasDisponibles.length === 1 && tallasDisponibles[0] === 'Única') && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#171717]">
                  Talla: <span className="font-semibold text-[#50322A]">{selectedVariante.talla}</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {tallasDisponibles.map((talla) => {
                    const isSelected = selectedVariante.talla === talla;
                    return (
                      <button
                        key={talla}
                        type="button"
                        onClick={() => handleSelectTalla(talla)}
                        className={`w-9 h-9 rounded-full font-bold text-xs transition-all flex items-center justify-center active:scale-95 ${
                          isSelected
                            ? 'bg-[#661521] text-white shadow-[0_4px_12px_rgba(102,21,33,0.35)] ring-2 ring-[#661521]/30 ring-offset-2'
                            : 'border border-[#50322A]/25 bg-white/75 text-[#171717] hover:border-[#661521] hover:bg-white shadow-xs'
                        }`}
                      >
                        {talla}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Disponibilidad por Boutique Física */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#50322A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Disponibilidad en Boutiques
              </span>

              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                {SEDES_FISICAS.map((sede) => {
                  const rawStock = selectedVariante.stockPorSede?.[sede.key];
                  const unidades =
                    rawStock !== undefined
                      ? rawStock
                      : selectedVariante.stockDisponible > 0
                      ? sede.fallback
                      : 0;
                  return (
                    <div
                      key={sede.key}
                      className="bg-white/80 border border-white/95 rounded-xl p-1 sm:p-1.5 text-center shadow-xs"
                    >
                      <p className="text-[10px] font-bold text-[#50322A]/75 truncate">
                        {sede.label}
                      </p>
                      <p
                        className={`text-xs font-extrabold font-mono tabular-nums mt-0.5 ${
                          unidades > 0 ? 'text-[#661521]' : 'text-stone-400'
                        }`}
                      >
                        {unidades > 0 ? `${unidades} u.` : '0 u.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aviso Sobrio para Cosméticos No Reintegrables */}
            {esCosmeticoSinCambio && (
              <div className="p-3 rounded-xl bg-[#661521]/10 border border-[#661521]/20 flex items-start gap-2 text-xs text-[#50322A] leading-relaxed">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#661521]" />
                <span>Por higiene y seguridad sanitaria, este producto cosmético no admite cambios de uso personal.</span>
              </div>
            )}

            {/* Controles de Compra: Selector de Cantidad + Botón Agregar a la Bolsa */}
            <div className="pt-2 flex items-center gap-2.5">
              {!isAgotado && (
                <div className="flex items-center justify-between border border-[#50322A]/20 bg-white/80 rounded-full px-2.5 py-2 min-w-[96px]">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={cantidad <= 1}
                    aria-label="Disminuir cantidad"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#50322A] hover:bg-[#50322A]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono tabular-nums font-bold text-xs text-[#50322A] px-1">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={cantidad >= maxCantidad}
                    aria-label="Aumentar cantidad"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#50322A] hover:bg-[#50322A]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={isAgotado}
                onClick={handleAddToCart}
                className="flex-1 px-5 py-3 rounded-full bg-[#661521] hover:bg-[#52111a] disabled:opacity-45 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 shadow-[0_12px_25px_-5px_rgba(102,21,33,0.4)] border border-[#D19650] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
              >
                <ShoppingBag className="w-4 h-4 text-[#D19650]" />
                <span className="text-xs font-bold tracking-[0.14em] uppercase text-white">
                  {isAgotado ? 'Agotado' : 'Agregar a la Bolsa'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
