// frontend/src/features/storefront/components/ProductDetailModal.tsx
import React, { useState } from 'react';
import {
  ProductoDTO,
  VarianteDTO,
  formatMoneyCOP,
} from '../services/catalogService';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductReviews } from './ProductReviews';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  ZoomIn,
} from 'lucide-react';

interface Props {
  producto: ProductoDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (variante: VarianteDTO, cantidad: number) => void;
}

const SEDES_FISICAS = [
  { key: 'Punto Centro', label: 'Centro', fallback: 4 },
  { key: 'Punto Caobos', label: 'Caobos', fallback: 3 },
  { key: 'Punto Ocaña', label: 'Ocaña', fallback: 2 },
  { key: 'Punto Bucaramanga', label: 'B/manga', fallback: 3 },
];

export const ProductDetailModal: React.FC<Props> = ({
  producto,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !producto) return null;

  // Encontrar la primera variante con stock disponible, o la primera de la lista
  const defaultVariante =
    producto.variantes.find((v) => v.stockDisponible > 0) || producto.variantes[0];

  const [selectedVariante, setSelectedVariante] = useState<VarianteDTO>(defaultVariante);
  const [cantidad, setCantidad] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [avisoVariante, setAvisoVariante] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detalle' | 'resenas'>('detalle');
  const [isZoomed, setIsZoomed] = useState(false);

  // Extraer tallas y colores únicos
  const tallasDisponibles = Array.from(new Set(producto.variantes.map((v) => v.talla)));
  const coloresDisponibles = Array.from(new Set(producto.variantes.map((v) => v.color)));

  const handleSelectTalla = (talla: string) => {
    const exactMatch = producto.variantes.find(
      (v) => v.talla === talla && v.color === selectedVariante.color
    );
    if (exactMatch) {
      setSelectedVariante(exactMatch);
      setAvisoVariante(null);
      if (cantidad > Math.max(1, exactMatch.stockDisponible)) {
        setCantidad(1);
      }
    } else {
      const fallback = producto.variantes.find((v) => v.talla === talla);
      if (fallback) {
        setSelectedVariante(fallback);
        setAvisoVariante(`Talla ${talla} disponible únicamente en color ${fallback.color}.`);
        if (cantidad > Math.max(1, fallback.stockDisponible)) {
          setCantidad(1);
        }
      }
    }
  };

  const handleSelectColor = (color: string) => {
    const exactMatch = producto.variantes.find(
      (v) => v.color === color && v.talla === selectedVariante.talla
    );
    if (exactMatch) {
      setSelectedVariante(exactMatch);
      setAvisoVariante(null);
      if (cantidad > Math.max(1, exactMatch.stockDisponible)) {
        setCantidad(1);
      }
    } else {
      const fallback = producto.variantes.find((v) => v.color === color);
      if (fallback) {
        setSelectedVariante(fallback);
        setAvisoVariante(`Color ${color} disponible únicamente en talla ${fallback.talla}.`);
        if (cantidad > Math.max(1, fallback.stockDisponible)) {
          setCantidad(1);
        }
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#171717]/65 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#E7DED2] border-2 border-white/85 rounded-3xl shadow-[0_25px_70px_-15px_rgba(23,23,23,0.5)] overflow-hidden p-4 sm:p-6 my-auto max-h-[88vh] overflow-y-auto"
      >
        {/* Capas de Luz Ambiental Sutil */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-b from-white/75 via-white/25 to-transparent blur-3xl opacity-80" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-[#D19650]/15 rounded-full blur-3xl" />
        </div>

        {/* Botón Cerrar Flotante en la esquina superior derecha */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 border border-white/90 flex items-center justify-center text-[#50322A] hover:bg-[#661521] hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ESTRUCTURA ESPACIAL COMPACTA DE 2 COLUMNAS (5fr Escenario | 7fr Configuración de Compra) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* ================= COLUMNA IZQUIERDA (lg:col-span-5): Galería Multi-Ángulo y Zoom (Fig. 6 ARQ-07) ================= */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-3">
            {/* Escenario de Imagen Principal */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/3.6] rounded-2xl overflow-hidden bg-white/80 border-2 border-white/95 shadow-lg flex items-center justify-center group cursor-zoom-in">
              <img
                src={producto.imagenesUrls[selectedImageIndex] || producto.imagenesUrls[0]}
                alt={producto.nombre}
                onClick={() => setIsZoomed(!isZoomed)}
                className={`w-full h-full object-cover object-center transition-all duration-300 ${
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'group-hover:scale-105'
                }`}
              />

              {/* Botón Lupa de Zoom Espacial (Fig. 6 ARQ-07) */}
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                title={isZoomed ? 'Alejar zoom' : 'Ampliar detalle (Zoom)'}
                className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-white/80 hover:bg-white text-[#50322A] shadow-xs transition-transform active:scale-90 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#661521]" />
              </button>

              {/* Badge Canónico de Vista Multi-Ángulo y 360° (Fig. 6 ARQ-07) */}
              <div className="absolute top-2.5 right-2.5 pointer-events-none">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-white/95 text-[#661521] border border-[#D19650]/40 shadow-xs backdrop-blur-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D19650] animate-pulse" />
                  360° Multi-Ángulo
                </span>
              </div>

              {/* Botones discretos < y > para alternar fotos si hay más de 1 imagen */}
              {producto.imagenesUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Foto anterior"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#50322A] flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Foto siguiente"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-[#50322A] flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Indicador de mini puntos */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    {producto.imagenesUrls.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          selectedImageIndex === idx ? 'bg-white w-2.5' : 'bg-white/50 w-1'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Miniaturas de Ángulos Fotográficos (Fig. 6 ARQ-07) */}
            {producto.imagenesUrls.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                {producto.imagenesUrls.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={`w-12 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-[#661521] shadow-xs scale-105'
                        : 'border-white/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Ángulo ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Sombra suave de piso para el escenario */}
            <div className="w-40 h-2 bg-[#50322A]/15 blur-md rounded-full" aria-hidden="true" />
          </div>

          {/* ================= COLUMNA DERECHA (lg:col-span-7): Información, Variantes & Reseñas ================= */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Migas de Pan (Breadcrumbs GPS de Compra - Fig. 1 ARQ-07) */}
            <Breadcrumbs
              items={[
                { label: 'Inicio', href: '/' },
                { label: producto.categoriaNombre, isCurrent: true },
              ]}
              className="self-start py-1 px-3 text-[11px] bg-white/70"
            />

            {/* Cabecera de Categoría y Marca */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#661521]">
                  FORMA ATELIER
                </span>
                <span className="w-1 h-1 rounded-full bg-[#D19650]" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#661521]/10 text-[#661521] text-[9px] font-bold uppercase tracking-wider">
                  {producto.categoriaNombre}
                </span>
              </div>

              {/* Botón rápido a Reseñas */}
              <button
                type="button"
                onClick={() => setActiveTab('resenas')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D19650] bg-white/80 px-2 py-0.5 rounded-full border border-white hover:text-[#661521] transition-colors cursor-pointer"
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>4.9 (18 opiniones)</span>
              </button>
            </div>

            {/* Título de la Prenda */}
            <h2
              id="modal-product-title"
              className="font-serif-editorial text-xl sm:text-2xl font-medium text-[#50322A] leading-tight tracking-tight"
            >
              {producto.nombre}
            </h2>

            {/* Fila Financiera y SKU */}
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-[#50322A]/10">
              <div className="flex items-baseline gap-2">
                <span className="font-mono tabular-nums text-xl sm:text-2xl font-black text-[#50322A]">
                  {formatMoneyCOP(selectedVariante.precioVentaCop)}
                </span>
                <span className="text-[11px] font-medium text-[#50322A]/60">IVA incluido</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#171717]/80 font-mono tabular-nums px-2 py-0.5 rounded-full bg-white/80 border border-white/90 shadow-2xs">
                  SKU: <strong className="text-[#171717]">{selectedVariante.sku}</strong>
                </span>

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-white/90">
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

            {/* PESTAÑAS DE CONTENIDO: Detalle & Variantes vs. Reseñas Verificadas (Fig. 8 ARQ-07) */}
            <div className="flex items-center gap-2 border-b border-[#50322A]/15 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('detalle')}
                className={`px-3 py-1 rounded-t-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'detalle'
                    ? 'text-[#661521] border-b-2 border-[#661521] bg-white/50'
                    : 'text-[#50322A]/70 hover:text-[#661521]'
                }`}
              >
                Detalle & Variantes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resenas')}
                className={`px-3 py-1 rounded-t-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'resenas'
                    ? 'text-[#661521] border-b-2 border-[#661521] bg-white/50'
                    : 'text-[#50322A]/70 hover:text-[#661521]'
                }`}
              >
                <span>Opiniones & Reseñas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-[#50322A] font-bold">
                  ★ 4.9
                </span>
              </button>
            </div>

            {/* CONTENIDO DE PESTAÑA: DETALLE & VARIANTES */}
            {activeTab === 'detalle' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Descripción Resumida */}
                <p className="text-xs text-[#171717]/80 leading-relaxed font-sans line-clamp-2">
                  {producto.descripcion}
                </p>

                {/* Selector de Color */}
                {coloresDisponibles.length > 0 &&
                  !(coloresDisponibles.length === 1 && coloresDisponibles[0] === 'Neutro') && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#171717]">
                        Color:{' '}
                        <span className="font-semibold text-[#50322A]">{selectedVariante.color}</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {coloresDisponibles.map((color) => {
                          const isSelected = selectedVariante.color === color;
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleSelectColor(color)}
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#50322A] text-white border-[#50322A] shadow-2xs'
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

                {/* Selector de Tallas */}
                {tallasDisponibles.length > 0 &&
                  !(tallasDisponibles.length === 1 && tallasDisponibles[0] === 'Única') && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#171717]">
                        Talla:{' '}
                        <span className="font-semibold text-[#50322A]">{selectedVariante.talla}</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tallasDisponibles.map((talla) => {
                          const isSelected = selectedVariante.talla === talla;
                          return (
                            <button
                              key={talla}
                              type="button"
                              onClick={() => handleSelectTalla(talla)}
                              className={`min-w-[36px] min-h-[36px] px-2 rounded-full font-bold text-xs transition-all flex items-center justify-center active:scale-95 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#661521] text-white shadow-sm ring-2 ring-[#661521]/30 ring-offset-1'
                                  : 'border border-[#50322A]/25 bg-white/75 text-[#171717] hover:border-[#661521] hover:bg-white shadow-2xs'
                              }`}
                            >
                              {talla}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Mensaje informativo de combinación de variantes */}
                {avisoVariante && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 flex items-center gap-1.5 animate-in fade-in">
                    <span>ℹ️</span>
                    <span>{avisoVariante}</span>
                  </div>
                )}

                {/* Disponibilidad por Boutique Física Compacta */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#50322A] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Disponibilidad en Boutiques
                  </span>

                  <div className="grid grid-cols-4 gap-1">
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
                          className="bg-white/80 border border-white/95 rounded-lg p-1 text-center shadow-2xs"
                        >
                          <p className="text-[9px] font-bold text-[#50322A]/75 truncate">
                            {sede.label}
                          </p>
                          <p
                            className={`text-[9px] font-extrabold mt-0.2 ${
                              unidades > 0 ? 'text-[#661521]' : 'text-stone-400'
                            }`}
                          >
                            {unidades > 5 ? '● Disp.' : unidades > 0 ? '● Últimas' : '● Agotado'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Aviso Sobrio para Cosméticos No Reintegrables */}
                {esCosmeticoSinCambio && (
                  <div className="p-2.5 rounded-lg bg-[#661521]/10 border border-[#661521]/20 flex items-start gap-1.5 text-[11px] text-[#50322A] leading-tight">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#661521]" />
                    <div className="space-y-0.5">
                      <span>
                        Por higiene y seguridad sanitaria, este producto cosmético no admite cambios de uso
                        personal.
                      </span>
                      <span className="block text-[10px] font-bold text-[#661521]">
                        Uso personal (sin cambio por higiene).
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTENIDO DE PESTAÑA: RESEÑAS VERIFICADAS (Fig. 8 ARQ-07) */}
            {activeTab === 'resenas' && (
              <div className="animate-in fade-in duration-200">
                <ProductReviews
                  productoId={producto.id}
                  productoNombre={producto.nombre}
                />
              </div>
            )}

            {/* Controles de Compra: Selector de Cantidad + Botón Agregar a la Bolsa (Siempre accesibles) */}
            <div className="pt-2 flex items-center gap-2 border-t border-[#50322A]/15 mt-2">
              {!isAgotado && (
                <div className="flex items-center justify-between border border-[#50322A]/20 bg-white/80 rounded-full px-2 py-1.5 min-w-[88px]">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={cantidad <= 1}
                    aria-label="Disminuir cantidad"
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[#50322A] hover:bg-[#50322A]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxCantidad}
                    value={cantidad}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setCantidad(Math.max(1, Math.min(maxCantidad, val)));
                    }}
                    aria-label="Cantidad de prendas"
                    className="w-8 text-center font-mono tabular-nums font-bold text-xs text-[#50322A] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#D19650] rounded"
                  />
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={cantidad >= maxCantidad}
                    aria-label="Aumentar cantidad"
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[#50322A] hover:bg-[#50322A]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={isAgotado}
                onClick={handleAddToCart}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#661521] hover:bg-[#52111a] disabled:opacity-45 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(102,21,33,0.35)] border border-[#D19650] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#D19650]" />
                <span className="text-xs font-bold tracking-[0.12em] uppercase text-white">
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
