// frontend/src/features/storefront/components/PredictiveSearch.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles, Tag, ChevronRight, ArrowRight } from 'lucide-react';
import {
  ProductoDTO,
  PRODUCTOS_SEMILLA,
  formatMoneyCOP,
} from '../services/catalogService';

interface PredictiveSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProducto?: (producto: ProductoDTO) => void;
  onSearchSubmit?: (termino: string) => void;
}

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const SUGERENCIAS_POPULARES = [
  'Lino Sartorial',
  'Vestidos de Seda',
  'Mochilas Wayuu',
  'Cuero Genuino',
  'Sérum Botánico',
  'Chaquetas Artesanales',
  'Filigrana Momposina',
];

export const PredictiveSearch: React.FC<PredictiveSearchProps> = ({
  isOpen,
  onClose,
  onSelectProducto,
  onSearchSubmit,
}) => {
  const navigate = useNavigate();
  const [termino, setTermino] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-foco en el input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTermino('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Búsqueda predictiva sobre el catálogo
  const { productosCoincidentes, categoriasCoincidentes } = useMemo(() => {
    const termClean = normalizeText(termino);
    if (!termClean) {
      return { productosCoincidentes: [], categoriasCoincidentes: [] };
    }

    const matches = PRODUCTOS_SEMILLA.filter((p) => {
      const skus = p.variantes.map((v) => v.sku).join(' ');
      const haystack = normalizeText(
        `${p.nombre} ${p.descripcion} ${p.categoriaNombre} ${skus} ${p.slug}`
      );
      return haystack.includes(termClean);
    });

    // Extraer categorías únicas coincidentes
    const catSet = new Set<string>();
    matches.forEach((p) => {
      if (p.categoriaNombre) catSet.add(p.categoriaNombre);
    });

    return {
      productosCoincidentes: matches.slice(0, 6),
      categoriasCoincidentes: Array.from(catSet),
    };
  }, [termino]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!termino.trim()) return;

    onClose();
    if (onSearchSubmit) {
      onSearchSubmit(termino.trim());
    } else {
      navigate(`/?q=${encodeURIComponent(termino.trim())}#catalogo-grid`);
      const el = document.getElementById('catalogo-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (prod: ProductoDTO) => {
    onClose();
    if (onSelectProducto) {
      onSelectProducto(prod);
    } else {
      navigate(`/?producto=${prod.id}#catalogo-grid`);
    }
  };

  const handleSelectCategoria = (cat: string) => {
    onClose();
    navigate(`/?categoria=${encodeURIComponent(cat)}#catalogo-grid`);
    const el = document.getElementById('catalogo-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectSugerencia = (sug: string) => {
    setTermino(sug);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Buscador predictivo de prendas FORMA"
    >
      {/* Backdrop con desenfoque Liquid Glass */}
      <div
        className="fixed inset-0 bg-[#1C1311]/65 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor Flotante del Buscador */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(80,50,42,0.25)] border border-[#E7DED2] overflow-hidden z-10 flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-200">
        {/* Barra de Entrada Superior */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center px-4 sm:px-6 py-4 border-b border-[#50322A]/10 gap-3 bg-[#FAF6EF]/80"
        >
          <Search className="w-5 h-5 text-[#661521] shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Buscar por prenda, seda, lino, calzado, color o referencia..."
            className="w-full bg-transparent text-[#171717] font-sans text-sm sm:text-base font-medium placeholder:text-[#50322A]/40 focus:outline-none"
            aria-label="Buscar en el catálogo"
          />
          {termino && (
            <button
              type="button"
              onClick={() => setTermino('')}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#50322A]/60 hover:text-[#50322A] transition-colors"
              title="Borrar texto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-[#50322A] hover:bg-[#661521] hover:text-white transition-all bg-white border border-[#50322A]/15 shrink-0"
          >
            Esc
          </button>
        </form>

        {/* Cuerpo de Sugerencias y Resultados Predictivos */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Si no hay término, mostrar sugerencias populares y búsquedas recomendadas */}
          {!termino.trim() ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#D19650]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]/70">
                  Búsquedas Frecuentes & Tendencias
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGERENCIAS_POPULARES.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleSelectSugerencia(sug)}
                    className="px-3.5 py-1.5 rounded-full bg-[#FAF6EF] hover:bg-[#661521] text-[#50322A] hover:text-white text-xs font-semibold border border-[#E7DED2] transition-all hover:shadow-xs active:scale-95"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Categorías Rápidas */}
              <div className="mt-6 pt-5 border-t border-[#50322A]/10">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]/70 block mb-3">
                  Explorar por Departamento
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { nombre: 'Ropa de Autor', cat: 'Ropa', count: '14 piezas' },
                    { nombre: 'Calzado Artesanal', cat: 'Calzado', count: '5 modelos' },
                    { nombre: 'Accesorios & Cuero', cat: 'Accesorios', count: '6 referencias' },
                    { nombre: 'Cosméticos Botánicos', cat: 'Cosméticos', count: '5 fórmulas' },
                    { nombre: 'Artesanías de Origen', cat: 'Artesanías', count: '4 creaciones' },
                  ].map((d) => (
                    <button
                      key={d.cat}
                      type="button"
                      onClick={() => handleSelectCategoria(d.cat)}
                      className="p-3 rounded-2xl bg-[#FAF6EF]/70 hover:bg-white border border-[#E7DED2] text-left transition-all hover:shadow-sm group"
                    >
                      <span className="block text-xs font-bold text-[#50322A] group-hover:text-[#661521] transition-colors">
                        {d.nombre}
                      </span>
                      <span className="text-[10px] text-[#50322A]/50 block mt-0.5">
                        {d.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Categorías encontradas */}
              {categoriasCoincidentes.length > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[#50322A]/60 font-medium">Categorías:</span>
                  {categoriasCoincidentes.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategoria(cat)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#661521]/10 hover:bg-[#661521] text-[#661521] hover:text-white text-xs font-bold transition-all"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Lista de Prendas Coincidentes */}
              {productosCoincidentes.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]/70">
                      Prendas Encontradas ({productosCoincidentes.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      className="text-xs font-bold text-[#661521] hover:underline flex items-center gap-1"
                    >
                      <span>Ver todo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-[#50322A]/10">
                    {productosCoincidentes.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="py-2.5 px-3 -mx-3 rounded-2xl hover:bg-[#FAF6EF] cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.imagenesUrls[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'}
                            alt={p.nombre}
                            className="w-12 h-14 object-cover rounded-xl border border-[#E7DED2] shrink-0 bg-stone-100"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-[#171717] group-hover:text-[#661521] transition-colors truncate">
                              {p.nombre}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/5 text-[#50322A]">
                                {p.categoriaNombre}
                              </span>
                              <p className="text-xs text-[#50322A]/60 truncate max-w-[220px] sm:max-w-[340px]">
                                {p.descripcion}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-black text-[#661521]">
                            {formatMoneyCOP(p.variantes[0]?.precioVentaCop || 0)}
                          </span>
                          <span className="text-[10px] text-[#50322A]/60 block mt-0.5 font-medium">
                            COP Oficial
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm font-bold text-[#50322A]">
                    No encontramos prendas que coincidan con &ldquo;{termino}&rdquo;
                  </p>
                  <p className="text-xs text-[#50322A]/60 mt-1 max-w-sm mx-auto">
                    Intenta con otra palabra clave como &ldquo;lino&rdquo;, &ldquo;seda&rdquo;, &ldquo;calzado&rdquo; o &ldquo;mochila&rdquo;.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del Buscador con CTA */}
        {termino.trim() && productosCoincidentes.length > 0 && (
          <div className="p-3 sm:p-4 bg-[#FAF6EF] border-t border-[#50322A]/10 flex items-center justify-between">
            <span className="text-xs text-[#50322A]/70 font-medium">
              Pulsa <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#50322A]/20 text-[10px] font-mono">Enter</kbd> para explorar en el catálogo
            </span>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#661521] hover:bg-[#50322A] text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Ver resultados completos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
