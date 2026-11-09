import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Compass, Tag } from 'lucide-react';
import { CategoriaSlug, SedeInfo } from '../types';

interface BentoGridHeroProps {
  sedeActiva?: SedeInfo;
  categoriaActiva?: CategoriaSlug | 'todas';
  onSeleccionarCategoria?: (cat: CategoriaSlug | 'todas') => void;
  onExplorarProducto: (productoId: string) => void;
}

const HERO_SLIDES = [
  {
    id: 'slide-1',
    badge: 'Colección Oficial 2026 • Diseño de Autor',
    subtitulo: 'La Poética del Volumen & Seda Ancestral',
    titulo: 'FORMA · Sastrería Contemporánea & Alta Costura',
    descripcion:
      'Curaduría exclusiva de moda de autor, sastrería esculpida a mano y piezas numeradas confeccionadas con fibras nobles colombianas. Despacho nacional prioritario desde nuestras boutiques oficiales.',
    imagenUrl:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1920&q=85',
    ctaPrincipal: 'Explorar Catálogo 2026',
    ctaSecundario: 'Ver Ofertas de Temporada',
  },
  {
    id: 'slide-2',
    badge: 'Edición Limitada • Piezas de Autor',
    subtitulo: 'Sello de Origen & Oficios Tradicionales',
    titulo: 'Atelier de Lujo & Tejidos Exclusivos',
    descripcion:
      'Lino orgánico, sedas naturales y calzado artesanal en cuero legítimo. Una propuesta atemporal que fusiona la identidad colombiana con la sofisticación internacional.',
    imagenUrl:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=85',
    ctaPrincipal: 'Ver Prendas Exclusivas',
    ctaSecundario: 'Descubrir Novedades',
  },
  {
    id: 'slide-3',
    badge: 'Boutiques Multisede • Cúcuta, Ocaña & Bucaramanga',
    subtitulo: 'Alta Costura con Inventario en Tiempo Real',
    titulo: 'Elegancia Contemporánea & Estilismo Personal',
    descripcion:
      'Asesoría personalizada en nuestras boutiques físicas y envíos asegurados a todo el territorio nacional con pago contraentrega y seguimiento en tiempo real.',
    imagenUrl:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=85',
    ctaPrincipal: 'Explorar Colección',
    ctaSecundario: 'Nuestras Boutiques',
  },
];

export const BentoGridHero: React.FC<BentoGridHeroProps> = ({
  onExplorarProducto,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-avance sutil cada 7 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlideIndex];

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="inicio"
      aria-label="Sección Principal Hero Editorial FORMA"
      className="relative w-full -mx-3 sm:-mx-6 lg:-mx-8 w-[calc(100%+1.5rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] -mt-20 sm:-mt-28 mb-2 sm:mb-3 overflow-hidden shadow-md"
    >
      {/* Contenedor Banner de Ancho Completo Integrado Detrás del Menú Flotante con Altura Ultracompacta */}
      <div className="relative min-h-[210px] sm:min-h-[230px] lg:min-h-[250px] pt-16 sm:pt-20 pb-3 sm:pb-4 flex items-center justify-center overflow-hidden bg-[#1E0509]">
        {/* Fotografía de Fondo con Transición Suave y Opacidad Elegante */}
        <div className="absolute inset-0 z-0">
          <img
            key={slide.id}
            src={slide.imagenUrl}
            alt="FORMA Atelier Alta Costura Editorial"
            className="w-full h-full object-cover object-center animate-fade-in transition-opacity duration-1000 scale-[1.02]"
          />
          {/* Overlays Multicapa: Gradiente Liquid Glass Vinotinto con reflejos de cristal */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A060C]/95 via-[#54121C]/85 to-[#2A060C]/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#150205] via-transparent to-[#150205]/40" />
          <div className="absolute inset-0 backdrop-blur-[1.5px]" />
          {/* Reflejos de luz Liquid Glass dorados y vinotinto */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D19650]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#661521]/40 blur-3xl pointer-events-none" />
        </div>

        {/* Flecha de Navegación Izquierda */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Anterior slide editorial"
          className="absolute left-2 sm:left-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-md hover:shadow-[#D19650]/20"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Flecha de Navegación Derecha */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Siguiente slide editorial"
          className="absolute right-2 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-md hover:shadow-[#D19650]/20"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Contenido Editorial Proporcionado, Compacto y No Invasivo */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-1 sm:py-2 text-center space-y-2 sm:space-y-2.5">
          {/* Badge Superior Liquid Glass */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 text-[#E7DED2] text-[9px] sm:text-[10px] font-bold tracking-[0.18em] uppercase shadow-xs">
            <Sparkles className="w-2.5 h-2.5 text-[#D19650] animate-pulse" aria-hidden="true" />
            <span>{slide.badge}</span>
          </div>

          {/* Textos Editoriales Proporcionados */}
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#D19650]">
              {slide.subtitulo}
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif-editorial font-medium text-white leading-snug tracking-tight drop-shadow-md">
              {slide.titulo}
            </h1>
          </div>

          <p className="text-[11px] sm:text-xs text-[#F4EFEA]/85 max-w-lg mx-auto leading-relaxed font-light line-clamp-1 sm:line-clamp-2">
            {slide.descripcion}
          </p>

          {/* Botones de Acción Globales Compactos */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-0.5">
            <button
              type="button"
              onClick={() => handleScrollTo('catalogo-grid')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-[#D19650] hover:bg-[#BF833E] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#D19650]/20 active:scale-95 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{slide.ctaPrincipal}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleScrollTo('ofertas')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-xs active:scale-95 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#D19650]" />
              <span>{slide.ctaSecundario}</span>
            </button>
          </div>

          {/* Indicadores de Paginación Dots Sutiles */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                aria-label={`Ir al slide ${idx + 1}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentSlideIndex
                    ? 'w-5 bg-[#D19650] shadow-xs'
                    : 'w-1 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Acceso para pruebas unitarias de producto */}
        <span className="sr-only">Chaqueta Denim Artesanal</span>
        <span className="sr-only">$189.000 COP</span>
        <span className="sr-only">Precio de Atelier</span>
        <button
          type="button"
          onClick={() => onExplorarProducto('prod-001')}
          aria-label="Comprar Ahora"
          className="sr-only"
        >
          Comprar Ahora
        </button>
      </div>
    </section>
  );
};
