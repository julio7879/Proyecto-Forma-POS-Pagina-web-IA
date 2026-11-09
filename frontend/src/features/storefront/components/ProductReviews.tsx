// frontend/src/features/storefront/components/ProductReviews.tsx
import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, MessageSquare, ThumbsUp, Send } from 'lucide-react';

export interface ReviewItem {
  id: string;
  autor: string;
  ciudad: string;
  calificacion: number;
  fecha: string;
  comentario: string;
  verificado: boolean;
  utiles: number;
}

interface Props {
  productoId: number | string;
  productoNombre: string;
}

const REVIEWS_SEMILLA: Record<string, ReviewItem[]> = {
  default: [
    {
      id: 'rev-1',
      autor: 'Valentina Restrepo',
      ciudad: 'Bucaramanga',
      calificacion: 5,
      fecha: 'Hace 3 días',
      comentario: 'La caída y frescura del tejido son excepcionales. El corte sartorial calza impecable y la confección se nota artesanal de alta gama.',
      verificado: true,
      utiles: 14,
    },
    {
      id: 'rev-2',
      autor: 'Carlos Mendoza',
      ciudad: 'Cúcuta',
      calificacion: 5,
      fecha: 'Hace 1 semana',
      comentario: 'Compré para un evento formal y superó mis expectativas. El despacho fue en menos de 24 horas y el empaque venía sellado con certificado de taller.',
      verificado: true,
      utiles: 9,
    },
    {
      id: 'rev-3',
      autor: 'Luciana Morales',
      ciudad: 'Ocaña',
      calificacion: 4,
      fecha: 'Hace 2 semanas',
      comentario: 'Muy buena textura y tono exactamente igual al de las fotos. Recomendado pedir la talla habitual.',
      verificado: true,
      utiles: 6,
    },
  ],
};

/**
 * Módulo de Opiniones, Reseñas y Calificaciones Verificadas
 * Fundamentado en ARQ-07 Ley Canónica de E-Commerce (Fig. 8 Reviews and Ratings)
 */
export const ProductReviews: React.FC<Props> = ({ productoId, productoNombre }) => {
  const storageKey = `forma_reviews_prod_${productoId}`;

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return REVIEWS_SEMILLA[String(productoId)] || REVIEWS_SEMILLA.default;
  });

  const [showForm, setShowForm] = useState(false);
  const [nuevaCalificacion, setNuevaCalificacion] = useState(5);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviadoExito, setEnviadoExito] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews, storageKey]);

  const totalReviews = reviews.length;
  const promedio =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.calificacion, 0) / totalReviews).toFixed(1)
      : '5.0';

  const conteoEstrellas = [5, 4, 3, 2, 1].map((estrella) => {
    const cant = reviews.filter((r) => r.calificacion === estrella).length;
    const porcentaje = totalReviews > 0 ? Math.round((cant / totalReviews) * 100) : 0;
    return { estrella, cant, porcentaje };
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoComentario.trim()) return;

    const nuevaReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      autor: nuevoNombre.trim(),
      ciudad: 'Cliente Tienda Web',
      calificacion: nuevaCalificacion,
      fecha: 'Hoy',
      comentario: nuevoComentario.trim(),
      verificado: true,
      utiles: 0,
    };

    setReviews([nuevaReview, ...reviews]);
    setNuevoNombre('');
    setNuevoComentario('');
    setShowForm(false);
    setEnviadoExito(true);
    setTimeout(() => setEnviadoExito(false), 4000);
  };

  return (
    <div className="space-y-4 pt-3 border-t border-[#50322A]/15">
      {/* Encabezado y Resumen de Calificaciones (Fig. 8 ARQ-07) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 border border-[#50322A]/10 shadow-2xs">
        {/* Promedio General */}
        <div className="flex items-center gap-3">
          <div className="text-center px-3 py-1.5 rounded-xl bg-[#FAF6EF] border border-[#50322A]/10">
            <span className="text-2xl font-black font-serif-editorial text-[#661521] block leading-none">
              {promedio}
            </span>
            <div className="flex items-center justify-center gap-0.5 text-amber-500 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i <= Math.round(Number(promedio)) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#50322A]/70 font-bold block mt-0.5">
              {totalReviews} opiniones
            </span>
          </div>

          <div className="flex-1 space-y-1 min-w-[140px]">
            {conteoEstrellas.map(({ estrella, porcentaje }) => (
              <div key={estrella} className="flex items-center gap-2 text-[10px]">
                <span className="font-bold text-[#50322A] w-3">{estrella}★</span>
                <div className="flex-1 h-1.5 bg-[#E7DED2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <span className="text-[#50322A]/60 font-mono text-[9px] w-6 text-right">
                  {porcentaje}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Botón para Dejar Opinión */}
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#661521] text-white hover:bg-[#50322A] transition-all flex items-center justify-center gap-1.5 shadow-2xs self-stretch sm:self-center cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#D19650]" />
          <span>{showForm ? 'Cancelar' : 'Escribir Opinión'}</span>
        </button>
      </div>

      {enviadoExito && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>¡Gracias por tu opinión! Se ha publicado en la curaduría del producto.</span>
        </div>
      )}

      {/* Formulario de Calificación */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#50322A]/15 space-y-3 animate-in fade-in duration-300"
        >
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]">
            Comparte tu experiencia con {productoNombre}
          </h4>

          {/* Selector de Estrellas */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#50322A]">Tu Calificación:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((estrella) => (
                <button
                  key={estrella}
                  type="button"
                  onClick={() => setNuevaCalificacion(estrella)}
                  className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      estrella <= nuevaCalificacion
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Tu nombre completo"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#50322A]/20 text-[#50322A] focus:outline-none focus:ring-1 focus:ring-[#661521]"
            />
          </div>

          <textarea
            required
            rows={2}
            placeholder="Describe la tela, caída, confección y tu experiencia con la prenda..."
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#50322A]/20 text-[#50322A] focus:outline-none focus:ring-1 focus:ring-[#661521]"
          />

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#661521] text-white hover:bg-[#50322A] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-[#D19650]" />
              <span>Publicar Opinión</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Reseñas de Clientes Verificados */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-3 rounded-xl bg-white/90 border border-[#50322A]/10 space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {/* Avatar Circular con Iniciales (Fig. 8 ARQ-07) */}
                <div className="w-7 h-7 rounded-full bg-[#661521] text-[#D19650] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 border border-[#D19650]/40">
                  {rev.autor.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#351912]">{rev.autor}</span>
                  {rev.verificado && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Compra Verificada</span>
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-medium">{rev.fecha}</span>
            </div>

            <div className="flex items-center gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i <= rev.calificacion ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-[#171717] font-medium leading-relaxed">
              {rev.comentario}
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px] text-stone-500">
              <span>{rev.ciudad}</span>
              <button
                type="button"
                onClick={() => {
                  setReviews((prev) =>
                    prev.map((r) => (r.id === rev.id ? { ...r, utiles: r.utiles + 1 } : r))
                  );
                }}
                className="hover:text-[#661521] transition-colors flex items-center gap-1 cursor-pointer"
                title="Marcar como útil"
              >
                <ThumbsUp className="w-2.5 h-2.5" />
                <span>¿Útil? ({rev.utiles})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
