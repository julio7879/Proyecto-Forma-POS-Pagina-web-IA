// frontend/src/features/storefront/components/ProductCard.tsx
import { ProductoDTO, VarianteDTO, formatMoneyCOP } from '../services/catalogService';
import { ShoppingBag, ShieldAlert, Sparkles, Star } from 'lucide-react';

interface Props {
  producto: ProductoDTO;
  onOpenDetail: (producto: ProductoDTO) => void;
  onQuickAdd?: (producto: ProductoDTO, variante: VarianteDTO) => void;
  viewMode?: 'grid' | 'list';
}

/**
 * Tarjeta de Producto Dual: Vista Cuadrícula (Grid) y Vista Lista Detallada (List)
 * Fundamentada en ARQ-07 Ley Canónica de E-Commerce (Fig. 12 Selector Grid vs List View)
 */
export const ProductCard = ({
  producto,
  onOpenDetail,
  onQuickAdd,
  viewMode = 'grid',
}: Props) => {
  const stockConsolidado = producto.variantes.reduce((acc, v) => acc + v.stockDisponible, 0);

  // Semáforo de disponibilidad web sin cifras exactas (RN-WEB-02 / CA-35)
  const getSemaforoBadge = () => {
    if (stockConsolidado > 5) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-emerald-800 border border-white shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Disponible
        </span>
      );
    }
    if (stockConsolidado >= 1) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/95 text-[#50322A] border border-[#D19650] shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D19650]" />
          ¡Últimas unidades!
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200/90 text-stone-600 border border-stone-300">
        Agotado
      </span>
    );
  };

  const variantePrincipal =
    producto.variantes.find((v) => v.stockDisponible > 0) || producto.variantes[0];
  const precioPrincipal = variantePrincipal?.precioVentaCop || 0;

  // Deduplicar tallas y colores para badges informativos en modo lista
  const tallasDisponibles = Array.from(
    new Set(producto.variantes.map((v) => v.talla).filter(Boolean))
  );
  const coloresDisponibles = Array.from(
    new Set(producto.variantes.map((v) => v.color).filter(Boolean))
  );

  // =========================================================================
  // MODO LISTA DETALLADA (Fig. 12 ARQ-07: Horizontal Card con información técnica ampliada)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpenDetail(producto)}
        className="group relative flex flex-col md:flex-row items-stretch gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-2xl border border-[#50322A]/15 hover:border-[#D19650] transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
      >
        {/* Imagen a la izquierda */}
        <div className="relative w-full md:w-56 h-48 md:h-auto shrink-0 overflow-hidden rounded-xl bg-[#E7DED2]">
          <img
            src={
              producto.imagenesUrls[0] ||
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'
            }
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2.5 left-2.5">{getSemaforoBadge()}</div>
        </div>

        {/* Información central técnica y descriptiva */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#661521]">
                {producto.categoriaNombre} • CURADURÍA FORMA
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D19650] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>5.0 (Artesanal)</span>
              </span>
            </div>

            <h3 className="font-serif-editorial font-bold text-xl sm:text-2xl text-[#351912] group-hover:text-[#661521] transition-colors mb-2">
              {producto.nombre}
            </h3>

            <p className="text-sm text-[#171717] font-medium leading-relaxed mb-3 line-clamp-2 sm:line-clamp-3">
              {producto.descripcion}
            </p>

            {/* Badges de Tallas y Colores */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {tallasDisponibles.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-[#50322A]/70 uppercase tracking-wider">
                    Tallas:
                  </span>
                  <div className="flex items-center gap-1">
                    {tallasDisponibles.map((talla) => (
                      <span
                        key={talla}
                        className="px-2 py-0.5 rounded-md bg-[#FAF6EF] text-[#50322A] text-[11px] font-bold border border-[#50322A]/15 font-mono"
                      >
                        {talla}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {coloresDisponibles.length > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-[11px] font-bold text-[#50322A]/70 uppercase tracking-wider">
                    Colores:
                  </span>
                  <div className="flex items-center gap-1">
                    {coloresDisponibles.slice(0, 3).map((color) => (
                      <span
                        key={color}
                        className="px-2 py-0.5 rounded-md bg-stone-100 text-[#50322A] text-[11px] font-medium border border-stone-200"
                      >
                        {color}
                      </span>
                    ))}
                    {coloresDisponibles.length > 3 && (
                      <span className="text-[10px] text-stone-500">
                        +{coloresDisponibles.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Advertencia de Cosméticos No Reintegrables */}
            {!producto.reintegrableEnDevolucion && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#D19650]/20 border border-[#D19650]/60 text-xs text-[#351912] font-bold">
                <ShieldAlert className="w-4 h-4 text-[#661521] shrink-0" />
                <span>Uso personal (sin cambio por higiene)</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha de Precio y Acciones */}
        <div className="md:w-56 shrink-0 flex flex-col justify-between items-start md:items-end pt-3 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-l border-[#50322A]/10">
          <div className="text-left md:text-right w-full">
            <span className="text-xs text-[#50322A] uppercase tracking-wider block font-bold mb-0.5">
              Precio COP
            </span>
            <span className="text-2xl font-black font-mono-tabular text-[#171717] block">
              {formatMoneyCOP(precioPrincipal)}
            </span>
            <span className="text-[11px] text-[#50322A]/70 block mt-0.5">
              IVA 19% Incluido · Despacho nacional
            </span>
          </div>

          <div className="flex items-center gap-2 mt-4 w-full md:w-auto justify-end">
            {onQuickAdd && variantePrincipal && stockConsolidado > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (producto.variantes.length > 1) {
                    onOpenDetail(producto);
                  } else {
                    onQuickAdd(producto, variantePrincipal);
                  }
                }}
                title={
                  producto.variantes.length > 1
                    ? 'Seleccionar talla y características'
                    : 'Agregar directo a la bolsa'
                }
                className="flex-1 md:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold glass-mirror-pill text-[#50322A] hover:text-[#661521] hover:border-[#D19650] transition-all flex items-center justify-center cursor-pointer"
              >
                {producto.variantes.length > 1 ? 'Elegir Talla' : '+ Bolsa'}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(producto);
              }}
              aria-label={`Ver variantes de ${producto.nombre}`}
              title={`Ver variantes y detalle 3D de ${producto.nombre}`}
              className="w-11 h-11 rounded-xl bg-[#D19650] hover:bg-[#661521] active:scale-95 text-white transition-all shadow-md shadow-[#D19650]/30 flex items-center justify-center cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO CUADRÍCULA (Grid View 3D Pop-Out tradicional de FORMA)
  // =========================================================================
  return (
    <div
      onClick={() => onOpenDetail(producto)}
      className="product-card-3d-shell p-5 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Escenario 3D Pop-Out (Sobresale por encima del borde superior de la tarjeta de cristal) */}
        <div className="product-popout-stage relative w-[88%] mx-auto h-52 overflow-hidden bg-[#E7DED2]">
          <img
            src={
              producto.imagenesUrls[0] ||
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'
            }
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#50322A]/35 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

          {/* Badge de Disponibilidad en esquina superior */}
          <div className="absolute top-2.5 right-2.5">{getSemaforoBadge()}</div>

          {/* Indicador 3D Showcase al pasar el cursor */}
          <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-[#661521] backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-[#D19650]" />
              Ver Variantes & Tallas
            </span>
          </div>
        </div>

        {/* Categoría en Vinotinto (#661521) */}
        <div className="mt-4 mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#661521]">
            {producto.categoriaNombre} • CURADURÍA FORMA
          </span>
          <span className="text-xs font-bold text-[#351912] bg-white/70 px-2 py-0.5 rounded-full border border-white/80">
            {producto.variantes.length}{' '}
            {producto.variantes.length === 1 ? 'opción' : 'opciones'}
          </span>
        </div>

        {/* Título en Café Profundo (#351912) y descripción en Negro Puro (#171717) para Máxima Legibilidad */}
        <h3 className="font-serif-editorial font-bold text-xl text-[#351912] group-hover:text-[#661521] transition-colors line-clamp-1 mb-1.5">
          {producto.nombre}
        </h3>
        <p className="text-sm text-[#171717] font-medium line-clamp-2 mb-3 leading-relaxed">
          {producto.descripcion}
        </p>

        {/* Advertencia de Cosméticos No Reintegrables (RN-CAT-02 / CA-31) */}
        {!producto.reintegrableEnDevolucion && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-[#D19650]/20 border border-[#D19650]/60 flex items-center gap-2 text-xs text-[#351912] font-bold">
            <ShieldAlert className="w-4 h-4 text-[#661521] flex-shrink-0" />
            <span className="line-clamp-1">Uso personal (sin cambio por higiene)</span>
          </div>
        )}
      </div>

      {/* Pie de Tarjeta: Precio COP a la izquierda + Botón Cuadrado Redondeado Dorado (#D19650) a la derecha */}
      <div className="pt-3 border-t border-[#50322A]/15 flex items-center justify-between mt-2">
        <div>
          <span className="text-xs text-[#50322A] uppercase tracking-wider block font-bold">
            Precio COP
          </span>
          <span className="text-lg font-black font-mono-tabular text-[#171717]">
            {formatMoneyCOP(precioPrincipal)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onQuickAdd && variantePrincipal && stockConsolidado > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (producto.variantes.length > 1) {
                  onOpenDetail(producto);
                } else {
                  onQuickAdd(producto, variantePrincipal);
                }
              }}
              title={
                producto.variantes.length > 1
                  ? 'Seleccionar talla y características'
                  : 'Agregar directo a la bolsa'
              }
              className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold glass-mirror-pill text-[#50322A] hover:text-[#661521] hover:border-[#D19650] transition-all flex items-center justify-center cursor-pointer"
            >
              {producto.variantes.length > 1 ? 'Elegir Talla' : '+ Bolsa'}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(producto);
            }}
            aria-label={`Ver variantes de ${producto.nombre}`}
            title={`Ver variantes y detalle 3D de ${producto.nombre}`}
            className="w-11 h-11 rounded-xl bg-[#D19650] hover:bg-[#661521] active:scale-95 text-white transition-all shadow-md shadow-[#D19650]/30 flex items-center justify-center cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
