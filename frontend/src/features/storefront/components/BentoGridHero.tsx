import React from 'react';
import { Sparkles, ArrowRight, Award, Leaf } from 'lucide-react';
import { CategoriaSlug, SedeInfo } from '../types';

interface BentoGridHeroProps {
  sedeActiva?: SedeInfo;
  categoriaActiva?: CategoriaSlug | 'todas';
  onSeleccionarCategoria?: (cat: CategoriaSlug | 'todas') => void;
  onExplorarProducto: (productoId: string) => void;
}

export const BentoGridHero: React.FC<BentoGridHeroProps> = ({
  onExplorarProducto,
}) => {
  return (
    <section className="mb-12" aria-label="Sección Destacada Bento Grid">
      {/* Tarjeta Principal Hero Limpia y Elegante */}
      <div className="glass-mirror-card rounded-[2.25rem] p-6 sm:p-10 lg:p-12 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Columna Izquierda: Narrativa Editorial & CTA */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#661521] text-white text-[10px] font-bold tracking-[0.16em] uppercase shadow-sm">
              <Sparkles className="w-3 h-3 text-[#D19650]" aria-hidden="true" />
              <span>Colección Oficial 2026 • Diseño de Autor</span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#661521] mb-1">
                La Poética del Volumen & Seda Ancestral
              </p>
              <h2 className="text-3xl sm:text-5xl font-serif-editorial font-medium text-[#50322A] leading-[1.08] tracking-tight">
                Chaqueta Denim Artesanal
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[#171717]/80 max-w-xl leading-relaxed">
              Sastrería contemporánea esculpida a mano y curaduría multisede (Ropa, Calzado, Cosméticos, Accesorios y Artesanías). Piezas numeradas con despacho nacional desde nuestras boutiques.
            </p>

            {/* Fila de Precio + Botón Dorado (#D19650) + Botón Secundario */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="pr-3 border-r border-[#50322A]/15">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#50322A]/70 block">
                  Precio de Atelier
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-tabular text-[#50322A]">
                  $189.000 COP
                </span>
              </div>

              <button
                type="button"
                onClick={() => onExplorarProducto('prod-001')}
                aria-label="Comprar Ahora"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#D19650] hover:bg-[#BF833E] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#D19650]/30 active:scale-95"
              >
                <span>Comprar Ahora</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href="#catalogo-grid"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full glass-mirror-pill text-[#50322A] hover:text-[#661521] hover:border-[#D19650] text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Ver Catálogo</span>
              </a>
            </div>

            {/* Indicadores Rápidos */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#50322A]/10 max-w-lg">
              <div>
                <span className="text-lg sm:text-xl font-serif-editorial font-bold text-[#50322A] block">
                  100%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#171717]/60">
                  Algodón de Autor
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-serif-editorial font-bold text-[#50322A] block">
                  24-48h
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#171717]/60">
                  Envíos Nacionales
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-serif-editorial font-bold text-[#50322A] block">
                  D.O.
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#171717]/60">
                  Origen Certificado
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Escenario Flotante con Badges Espejo */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[380px] aspect-[4/4.4] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/90 group">
              <img
                src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=85"
                alt="Chaqueta Denim Artesanal Colección 2026"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#50322A]/60 via-transparent to-transparent" />
            </div>

            {/* Badge Flotante Izquierdo */}
            <div className="glass-mirror-pill px-3.5 py-2 rounded-full flex items-center gap-2 absolute top-5 -left-2 sm:left-2 shadow-lg">
              <Leaf className="w-3.5 h-3.5 text-[#D19650]" />
              <span className="text-[11px] font-bold text-[#50322A]">Confección Artesanal</span>
            </div>

            {/* Badge Flotante Derecho */}
            <div className="glass-mirror-pill px-3.5 py-2 rounded-full flex items-center gap-2 absolute bottom-6 -right-2 sm:right-2 shadow-lg">
              <Award className="w-3.5 h-3.5 text-[#661521]" />
              <span className="text-[11px] font-bold text-[#50322A]">Edición Limitada</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
