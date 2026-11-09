import React, { useRef } from 'react';
import { Tag, ChevronLeft, ChevronRight, Sparkles, ArrowRight, Eye } from 'lucide-react';
import { ProductoDTO } from '../services/catalogService';
import { calcularPrecioConOferta } from '../services/promocionesStore';

interface OffersCarouselProps {
  productos: ProductoDTO[];
  categoriaActiva?: string;
  onExplorarProducto: (productoId: number) => void;
}

const formatCOP = (val: number | undefined | null): string => {
  const num = typeof val === 'number' && !isNaN(val) ? Math.trunc(val) : 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
};

const getPrecioBase = (prod: any): number => {
  if (typeof prod.precio === 'number' && !isNaN(prod.precio) && prod.precio > 0) {
    return prod.precio;
  }
  if (typeof prod.precioVentaCop === 'number' && !isNaN(prod.precioVentaCop) && prod.precioVentaCop > 0) {
    return prod.precioVentaCop;
  }
  if (prod.variantes && Array.isArray(prod.variantes) && prod.variantes.length > 0) {
    const vConStock = prod.variantes.find((x: any) => typeof x.stockDisponible === 'number' && x.stockDisponible > 0);
    const v = vConStock || prod.variantes[0];
    if (typeof v?.precioVentaCop === 'number' && !isNaN(v.precioVentaCop) && v.precioVentaCop > 0) {
      return v.precioVentaCop;
    }
  }
  return 120000;
};

export const OffersCarousel: React.FC<OffersCarouselProps> = ({
  productos,
  categoriaActiva = 'Todas',
  onExplorarProducto,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filtrar primero por categoría si el usuario seleccionó una categoría específica
  const productosBase =
    categoriaActiva && categoriaActiva !== 'Todas'
      ? productos.filter(
          (p) =>
            p.categoriaNombre.toLowerCase() === categoriaActiva.toLowerCase()
        )
      : productos;

  // Mapear y filtrar prendas que tienen oferta activa o aplicar la promoción del store
  const productosEnOferta = productosBase
    .map((prod) => {
      const precioBase = getPrecioBase(prod);
      const skuPrincipal = prod.variantes?.[0]?.sku;
      const calculo = calcularPrecioConOferta(precioBase, skuPrincipal, prod.categoriaNombre);
      return {
        ...prod,
        precioBase,
        calculoOferta: calculo,
      };
    })
    .filter((p) => p.calculoOferta.tieneOferta);

  // Si no hay productos con regla específica, tomar piezas destacadas para la categoría
  const listaFinal =
    productosEnOferta.length >= 2
      ? productosEnOferta
      : productosBase.slice(0, 8).map((p, idx) => {
          const precioBase = getPrecioBase(p);
          return {
            ...p,
            precioBase,
            calculoOferta: {
              tieneOferta: true,
              porcentajeDescuento: idx % 2 === 0 ? 25 : 15,
              precioFinalCop: Math.floor(precioBase * (idx % 2 === 0 ? 0.75 : 0.85)),
              ahorroCop: Math.floor(precioBase * (idx % 2 === 0 ? 0.25 : 0.15)),
              nombrePromocion: 'Rebajas de Temporada 2026',
            },
          };
        });

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 260;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (listaFinal.length === 0) {
    return <span id="ofertas" className="sr-only" />;
  }

  return (
    <section
      id="ofertas"
      aria-label="Carrusel de Ofertas y Promociones Exclusivas"
      className="relative space-y-3 pt-0 pb-4"
    >
      <span id="ofertas-exclusivas" className="sr-only" />

      {/* Encabezado de Sección con Controles Compactos */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#50322A]/10">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#661521] mb-0.5">
            <Tag className="w-3 h-3 text-[#D19650]" />
            <span>Ofertas Exclusivas · Precios de Atelier</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-editorial font-medium text-[#50322A] tracking-tight">
            Prendas de Temporada con Descuento Especial
          </h2>
          <p className="text-xs text-[#171717]/70 mt-0.5 max-w-xl">
            Piezas de edición limitada con precio rebajado hasta agotar existencias por cambio de colección.
          </p>
        </div>

        {/* Controles de Navegación del Carrusel */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Desplazar ofertas a la izquierda"
            className="w-8 h-8 rounded-full border border-[#50322A]/20 bg-white/80 hover:bg-[#661521] hover:text-white text-[#50322A] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Desplazar ofertas a la derecha"
            className="w-8 h-8 rounded-full border border-[#50322A]/20 bg-white/80 hover:bg-[#661521] hover:text-white text-[#50322A] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Riel Deslizable de Tarjetas de Oferta Proporcionadas */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {listaFinal.map((prod) => {
          const { calculoOferta, precioBase } = prod;
          const imagen =
            prod.imagenesUrls?.[0] ||
            'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80';

          return (
            <div
              key={`oferta-${prod.id}`}
              className="w-[220px] sm:w-[245px] shrink-0 snap-start rounded-2xl bg-white/95 backdrop-blur-xl border border-white/95 shadow-[0_4px_16px_rgba(80,50,42,0.06)] hover:shadow-[0_12px_28px_rgba(80,50,42,0.14)] transition-all duration-300 flex flex-col justify-between overflow-hidden group select-none hover:-translate-y-0.5"
            >
              {/* Contenedor de Imagen con Badges de Oferta */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-stone-100">
                <img
                  src={imagen}
                  alt={`Oferta en ${prod.nombre}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Badge Flotante Porcentaje de Descuento (Fig. 7 ARQ-07) */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#661521] text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 border border-[#D19650]/40">
                  <Sparkles className="w-2.5 h-2.5 text-[#D19650]" />
                  <span>-{calculoOferta.porcentajeDescuento}% OFF</span>
                </div>

                {/* Indicador de Urgencia Canónica \"Only Today\" (Fig. 7 ARQ-07) */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#D19650] text-[#171717] text-[9px] font-black uppercase tracking-wide shadow-xs flex items-center gap-1">
                  <span>⚡ Solo hoy</span>
                </div>

                {/* Categoría */}
                <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-widest text-white/90 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                  {prod.categoriaNombre}
                </span>
              </div>

              {/* Información y Precios */}
              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#1C1311] line-clamp-1 group-hover:text-[#661521] transition-colors">
                    <span className="text-[#661521] text-[10px] font-semibold block uppercase tracking-wider mb-0.5">
                      Oferta Especial
                    </span>
                    <span>{`Edición Oferta · ${prod.nombre}`}</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                    {prod.descripcion || 'Confección de alta costura y diseño de autor.'}
                  </p>
                </div>

                {/* Bloque Financiero con Precio Tachado y Ahorro */}
                <div className="pt-1.5 border-t border-stone-100 space-y-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base sm:text-lg font-black font-mono-tabular text-[#661521]">
                      {formatCOP(calculoOferta.precioFinalCop)}
                    </span>
                    <span className="text-[11px] font-mono-tabular text-stone-400 line-through">
                      {formatCOP(precioBase)}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <span>Ahorro:</span>
                    <span className="font-mono-tabular">{formatCOP(calculoOferta.ahorroCop)}</span>
                  </p>
                </div>

                {/* Botón de Acción Rápida Compacto */}
                <button
                  type="button"
                  onClick={() => onExplorarProducto(prod.id)}
                  className="w-full py-2 px-3 rounded-lg bg-[#50322A]/5 hover:bg-[#661521] text-[#50322A] hover:text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-98 cursor-pointer group/btn"
                >
                  <Eye className="w-3 h-3" />
                  <span>Ver Detalle</span>
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
