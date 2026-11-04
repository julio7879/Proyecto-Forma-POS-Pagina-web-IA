import React from 'react';
import { Sparkles, ShieldCheck, Truck, ArrowRight, Layers, MapPin } from 'lucide-react';
import { CategoriaSlug, SedeInfo } from '../types';

interface BentoGridHeroProps {
  sedeActiva: SedeInfo;
  categoriaActiva: CategoriaSlug | 'todas';
  onSeleccionarCategoria: (cat: CategoriaSlug | 'todas') => void;
  onExplorarProducto: (productoId: string) => void;
}

export const BentoGridHero: React.FC<BentoGridHeroProps> = ({
  sedeActiva,
  categoriaActiva,
  onSeleccionarCategoria,
  onExplorarProducto,
}) => {
  return (
    <section className="mb-10" aria-label="Sección Destacada Bento Grid">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[220px]">
        {/* Card 1 (2x2): Hero Card Principal */}
        <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden glass-card group border border-white/40 dark:border-slate-800/80 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=85"
            alt="Chaqueta Denim Artesanal Colección 2026"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          
          <div className="absolute top-5 left-5 flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-indigo-600 dark:text-indigo-400 border border-white/30 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Colección Oficial 2026
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-1">
              Confección Sostenible · Ropa
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 drop-shadow-sm">
              Chaqueta Denim Artesanal
            </h1>
            <p className="text-sm text-slate-200/90 line-clamp-2 max-w-lg mb-4">
              Dril 100% algodón colombiano con bordados ancestrales. Piezas numeradas con corte sastre.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-300">Precio de lanzamiento</span>
                <span className="text-2xl font-bold font-mono text-white">$189.000 COP</span>
              </div>
              <button
                type="button"
                onClick={() => onExplorarProducto('prod-001')}
                className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm transition-all duration-200 shadow-glow-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Ver detalles de la Chaqueta Denim Artesanal"
              >
                <span>Explorar Variante</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2 (1x1): Selector de Categorías Rápidas */}
        <div className="rounded-3xl glass-card p-5 flex flex-col justify-between border border-white/50 dark:border-slate-800/80 hover:shadow-glass-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Categorías
            </span>
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 gap-2 my-2">
            {(
              [
                { slug: 'ropa', label: 'Ropa' },
                { slug: 'accesorios', label: 'Accesorios' },
                { slug: 'cosmeticos', label: 'Cosméticos' },
                { slug: 'artesanias', label: 'Artesanías' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onSeleccionarCategoria(cat.slug)}
                className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg text-left transition-all ${
                  categoriaActiva === cat.slug
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Filtra en 1 clic el catálogo general
          </p>
        </div>

        {/* Card 3 (1x1): Stock y Sede Activa */}
        <div className="rounded-3xl glass-card p-5 flex flex-col justify-between border border-white/50 dark:border-slate-800/80 hover:shadow-glass-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sede Activa
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              En Vivo
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-white font-semibold text-base">
              <MapPin className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              <span>{sedeActiva.nombre}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Entrega local estimada: <strong className="text-slate-700 dark:text-slate-200">{sedeActiva.tiempoEntregaDias}</strong>.
            </p>
          </div>
          <div className="text-[11px] bg-slate-100/90 dark:bg-slate-800/70 p-2 rounded-xl text-slate-600 dark:text-slate-400">
            Respaldo de inventario nacional desde Bodega Central (Cúcuta).
          </div>
        </div>

        {/* Card 4 (2x1): Compromiso y Garantía Legal */}
        <div className="md:col-span-2 rounded-3xl glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/50 dark:border-slate-800/80 hover:shadow-glass-hover">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                5 Días Hábiles de Retracto & 30 Días de Garantía
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Derecho de retracto legal garantizado para compras web. Soporte directo en Medellín, Bogotá y Cúcuta.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 px-3.5 py-2 rounded-xl shrink-0">
            <Truck className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span>Envíos Seguros a Toda Colombia</span>
          </div>
        </div>
      </div>
    </section>
  );
};
