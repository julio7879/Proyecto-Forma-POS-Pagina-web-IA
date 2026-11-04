import React, { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Producto, SedeId, CartItem } from '../types.js';

interface ProductCardProps {
  producto: Producto;
  sedeActiva: SedeId;
  onAddToCart: (item: CartItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  sedeActiva,
  onAddToCart,
}) => {
  // Selección inicial de la primera variante disponible o la primera variante
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(
    producto.variantes[0]
  );
  const [agregadoAnimacion, setAgregadoAnimacion] = useState(false);

  // Calcular stock para la sede activa
  const stockSede = varianteSeleccionada.stockPorSede[sedeActiva] ?? 0;
  const stockCentral = varianteSeleccionada.stockPorSede['CUCUTA_CENTRAL'] ?? 0;

  // Formato monetario entero COP (Invariante RN-GEN-04: Sin centavos)
  const precioFormateadoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(producto.precioCOP);

  const handleAgregar = () => {
    if (stockSede <= 0 && stockCentral <= 0) return;

    onAddToCart({
      id: varianteSeleccionada.id,
      productoId: producto.id,
      nombre: producto.nombre,
      sku: varianteSeleccionada.sku,
      talla: varianteSeleccionada.talla,
      color: varianteSeleccionada.color,
      precioUnitarioCOP: producto.precioCOP,
      cantidad: 1,
      imagenUrl: producto.imagenUrl,
      sedeDespacho: stockSede > 0 ? sedeActiva : 'CUCUTA_CENTRAL',
    });

    setAgregadoAnimacion(true);
    setTimeout(() => setAgregadoAnimacion(false), 1200);
  };

  // Badge de disponibilidad según stock de sede
  const renderStockBadge = () => {
    if (stockSede >= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Disponible en sede
        </span>
      );
    }
    if (stockSede > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          ¡Últimas {stockSede} unidades!
        </span>
      );
    }
    if (stockCentral > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Desde Bodega Central
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Agotado
      </span>
    );
  };

  const estaAgotado = stockSede <= 0 && stockCentral <= 0;

  return (
    <article 
      className="glass-card rounded-2xl p-4 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative border border-slate-200/60 dark:border-slate-800/70"
      aria-label={`Producto: ${producto.nombre}`}
    >
      <div>
        {/* Imagen del Producto */}
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {renderStockBadge()}
            {producto.categoria === 'cosmeticos' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/70 backdrop-blur-md shadow-sm">
                Uso personal - sin cambio
              </span>
            )}
          </div>
        </div>

        {/* Metadatos y Títulos */}
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {producto.categoriaLabel}
          </span>
          <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">
            {varianteSeleccionada.sku}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
          {producto.nombre}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          {producto.descripcion}
        </p>

        {/* Selector de Variantes (Tallas o Tipos) */}
        {producto.variantes.length > 1 && (
          <div className="mb-4">
            <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Variante ({varianteSeleccionada.color ?? 'Talla'}):
            </span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Variantes disponibles">
              {producto.variantes.map((v) => {
                const esActiva = v.id === varianteSeleccionada.id;
                const hayStock = (v.stockPorSede[sedeActiva] ?? 0) > 0 || (v.stockPorSede['CUCUTA_CENTRAL'] ?? 0) > 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVarianteSeleccionada(v)}
                    disabled={!hayStock}
                    aria-checked={esActiva}
                    role="radio"
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      esActiva
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-600'
                        : hayStock
                        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 line-through cursor-not-allowed opacity-50'
                    }`}
                  >
                    {v.talla ?? v.sku}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Precio y Botón de Acción */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {precioFormateadoCOP}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
              IVA 19% incluido
            </span>
          </div>
          {varianteSeleccionada.color && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {varianteSeleccionada.color}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAgregar}
          disabled={estaAgotado}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            estaAgotado
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              : agregadoAnimacion
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-glow-indigo active:scale-[0.98]'
          }`}
          aria-label={`Añadir ${producto.nombre} talla ${varianteSeleccionada.talla ?? 'única'} al carrito`}
        >
          {agregadoAnimacion ? (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>¡Añadido!</span>
            </>
          ) : estaAgotado ? (
            <span>Agotado Temporalmente</span>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>Añadir al Carrito</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
