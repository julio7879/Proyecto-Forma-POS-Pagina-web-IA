// frontend/src/features/storefront/components/ProductCard.tsx
import { ProductoDTO, formatMoneyCOP } from '../services/catalogService';
import { Eye, ShieldAlert } from 'lucide-react';

interface Props {
  producto: ProductoDTO;
  onOpenDetail: (producto: ProductoDTO) => void;
}

export const ProductCard = ({ producto, onOpenDetail }: Props) => {
  // Calculamos el stock consolidado del producto sumando sus variantes
  const stockConsolidado = producto.variantes.reduce((acc, v) => acc + v.stockDisponible, 0);

  // Semáforo de disponibilidad web (RN-WEB-02 / CA-35)
  const getSemaforoBadge = () => {
    if (stockConsolidado > 5) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Disponible
        </span>
      );
    }
    if (stockConsolidado >= 1) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          ¡Últimas unidades! ({stockConsolidado})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300/40">
        Agotado
      </span>
    );
  };

  // Precio base mostrado (primer variante)
  const precioPrincipal = producto.variantes[0]?.precioVentaCop || 0;

  return (
    <div className="group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-4 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
      <div>
        {/* Imagen del producto con badges */}
        <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
          <img
            src={producto.imagenesUrls[0] || 'https://via.placeholder.com/400?text=Forma'}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-md">
              {producto.categoriaNombre}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5">
            {getSemaforoBadge()}
          </div>
        </div>

        {/* Título y descripción */}
        <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mb-1">
          {producto.nombre}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          {producto.descripcion}
        </p>

        {/* Advertencia de Cosméticos No Reintegrables (RN-CAT-02 / CA-31) */}
        {!producto.reintegrableEnDevolucion && (
          <div className="mb-3 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1.5 text-[10px] text-amber-800 dark:text-amber-300 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">Uso personal (sin cambio por higiene)</span>
          </div>
        )}
      </div>

      {/* Precio y Botón de acción */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Desde
          </span>
          <span className="text-base font-black text-slate-900 dark:text-white">
            {formatMoneyCOP(precioPrincipal)}
          </span>
        </div>

        <button
          onClick={() => onOpenDetail(producto)}
          aria-label={`Ver variantes de ${producto.nombre}`}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver detalles
        </button>
      </div>
    </div>
  );
};