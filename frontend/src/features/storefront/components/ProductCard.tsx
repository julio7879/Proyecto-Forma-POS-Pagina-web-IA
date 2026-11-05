// frontend/src/features/storefront/components/ProductCard.tsx
import { ProductoDTO, VarianteDTO, formatMoneyCOP } from '../services/catalogService';
import { ShoppingBag, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  producto: ProductoDTO;
  onOpenDetail: (producto: ProductoDTO) => void;
  onQuickAdd?: (producto: ProductoDTO, variante: VarianteDTO) => void;
}

export const ProductCard = ({ producto, onOpenDetail, onQuickAdd }: Props) => {
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

  return (
    <div
      onClick={() => onOpenDetail(producto)}
      className="product-card-3d-shell p-5 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Escenario 3D Pop-Out (Sobresale por encima del borde superior de la tarjeta de cristal) */}
        <div className="product-popout-stage relative w-[88%] mx-auto h-52 overflow-hidden bg-[#E7DED2]">
          <img
            src={producto.imagenesUrls[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'}
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
              Vista 3D & Tallas
            </span>
          </div>
        </div>

        {/* Categoría en Vinotinto (#661521) */}
        <div className="mt-4 mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#661521]">
            {producto.categoriaNombre} • CURADURÍA FORMA
          </span>
          <span className="text-xs font-bold text-[#351912] bg-white/70 px-2 py-0.5 rounded-full border border-white/80">
            {producto.variantes.length} {producto.variantes.length === 1 ? 'opción' : 'opciones'}
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
                onQuickAdd(producto, variantePrincipal);
              }}
              title="Agregar directo a la bolsa"
              className="px-3 py-2 rounded-xl text-xs font-bold glass-mirror-pill text-[#50322A] hover:text-[#661521] hover:border-[#D19650] transition-all"
            >
              + Bolsa
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
            className="w-11 h-11 rounded-xl bg-[#D19650] hover:bg-[#661521] active:scale-95 text-white transition-all shadow-md shadow-[#D19650]/30 flex items-center justify-center"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
