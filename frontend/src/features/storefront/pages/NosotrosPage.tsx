import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  MapPin,
  Award,
  Leaf,
  Compass,
  Clock,
  Phone,
  ArrowRight,
  CheckCircle2,
  Building2,
  Layers,
  HeartHandshake,
  QrCode,
  Truck,
} from 'lucide-react';

interface ComunidadArtesana {
  id: string;
  region: string;
  comunidad: string;
  oficio: string;
  materialTrazable: string;
  impacto: string;
  tiempoElaboracion: string;
  imagenUrl: string;
}

interface SedeOmnicanal {
  id: string;
  nombre: string;
  subtitulo: string;
  ciudad: string;
  departamento: string;
  codigoDane: string;
  direccion: string;
  horario: string;
  telefono: string;
  rolLogistico: string;
  servicios: string[];
  esBodegaCentral?: boolean;
  destacadoColor: string;
}

const COMUNIDADES_ARTESANAS: ComunidadArtesana[] = [
  {
    id: 'wayuu-guajira',
    region: 'Alta y Media Guajira',
    comunidad: 'Maestras Tejedoras Wayuu',
    oficio: 'Tejeduría ancestral en una sola aguja (Técnica Susu & Kaanas)',
    materialTrazable: 'Algodón mercerizado de hebra larga y tintes minerales del desierto',
    impacto: '+42 familias artesanas con pago directo sin intermediarios (Comercio Justo)',
    tiempoElaboracion: '18 a 25 días por pieza numerada',
    imagenUrl:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'filigrana-mompox',
    region: 'Santa Cruz de Mompox, Bolívar',
    comunidad: 'Orfebres Tradicionales del Río Magdalena',
    oficio: 'Filigrana momposina en hilos de plata ley 950 y baño de oro 24K',
    materialTrazable: 'Plata reciclada de pureza certificada libre de mercurio y níquel',
    impacto: '14 talleres familiares patrimoniales vinculados al catálogo FORMA',
    tiempoElaboracion: '8 a 14 días de estirado, torsión y soldadura manual',
    imagenUrl:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'cuero-velez',
    region: 'Vélez, Santander',
    comunidad: 'Talabarteros y Marroquineros Veleños',
    oficio: 'Marroquinería de autor con curtido vegetal y costura a dos agujas',
    materialTrazable: 'Cueros bovinos de pastoreo responsable con taninos de corteza de roble',
    impacto: 'Cero vertimientos de cromo hexavalente y aprovechamiento del 96% del corte',
    tiempoElaboracion: '10 a 16 días de curado, desbaste y bruñido con cera de abejas',
    imagenUrl:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'tejidos-santanderes',
    region: 'Santander & Norte de Santander',
    comunidad: 'Telares de Barichara, Pamplona y Cúcuta',
    oficio: 'Sastrería en lino orgánico, lienzo de algodón en telar horizontal y fique suavizado',
    materialTrazable: 'Algodón orgánico nacional e infusiones botánicas de cúrcuma, café y añil',
    impacto: 'Rescate del oficio textil andino-fronterizo y confección ética en atelier propio',
    tiempoElaboracion: '7 a 12 días desde el urdido hasta el control de calidad en Cúcuta',
    imagenUrl:
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=85',
  },
];

const SEDES_RED_OMNICANAL: SedeOmnicanal[] = [
  {
    id: 'punto-centro-cucuta',
    nombre: 'Punto Centro',
    subtitulo: 'Flagship Store & Atelier Urbano',
    ciudad: 'Cúcuta',
    departamento: 'Norte de Santander',
    codigoDane: '54001',
    direccion: 'Av. 5 # 11-42, Centro Histórico · Cúcuta',
    horario: 'Lun – Sáb: 9:00 a.m. – 7:30 p.m. · Dom: 10:00 a.m. – 3:00 p.m.',
    telefono: '+57 (607) 571 8400 · Ext. 101',
    rolLogistico: 'Despacho urbano exprés en Cúcuta y atención de alto tráfico POS',
    servicios: [
      'Sastrería a medida y ajustes de ruedo en 24h',
      'Redención inmediata de QR de Saldo a Favor (Cambios)',
      'Despacho de pedidos web locales DANE 54001',
      'Prioridad de venta presencial sobre reserva blanda (RN-VTA-03)',
    ],
    destacadoColor: '#661521',
  },
  {
    id: 'punto-caobos-cucuta',
    nombre: 'Punto Caobos',
    subtitulo: 'Boutique Exclusiva & Showroom Privado',
    ciudad: 'Cúcuta',
    departamento: 'Norte de Santander',
    codigoDane: '54001',
    direccion: 'Calle 15 # 1E-88, Barrio Los Caobos · Cúcuta',
    horario: 'Lun – Sáb: 10:00 a.m. – 8:00 p.m. · Festivos: 11:00 a.m. – 5:00 p.m.',
    telefono: '+57 (607) 572 9120 · Ext. 102',
    rolLogistico: 'Curaduría de ediciones limitadas, ritual de cosmética botánica y respaldo DANE 54001',
    servicios: [
      'Asesoría de estilismo personalizado (Personal Shopper)',
      'Cabina de prueba sensorial de Cosmética Botánica',
      'Retiro en tienda (Click & Collect) en menos de 2 horas',
      'Nodo secundario de reasignación automática web en Cúcuta',
    ],
    destacadoColor: '#D19650',
  },
  {
    id: 'punto-ocana',
    nombre: 'Punto Ocaña',
    subtitulo: 'Centro de Experiencia Regional',
    ciudad: 'Ocaña',
    departamento: 'Norte de Santander',
    codigoDane: '54498',
    direccion: 'Calle 11 # 12-18, Parque Principal 29 de Mayo · Ocaña',
    horario: 'Lun – Sáb: 9:00 a.m. – 7:00 p.m.',
    telefono: '+57 (607) 562 4310 · Ext. 201',
    rolLogistico: 'Cobertura subregional Provincia de Ocaña, Sur del Cesar y Magdalena Medio',
    servicios: [
      'Exhibición completa de las 4 líneas (Ropa, Accesorios, Cosméticos, Artesanías)',
      'Cambios presenciales con emisión y lectura de Bono QR',
      'Despacho directo DANE 54498 sin costos de reexpedición',
      'Sincronización Kardex en tiempo real con Bodega Central',
    ],
    destacadoColor: '#50322A',
  },
  {
    id: 'punto-bucaramanga',
    nombre: 'Punto Bucaramanga',
    subtitulo: 'Hub de Moda & Despacho Oriente',
    ciudad: 'Bucaramanga',
    departamento: 'Santander',
    codigoDane: '68001',
    direccion: 'Carrera 35A # 48-62, Cabecera del Llano · Bucaramanga',
    horario: 'Lun – Sáb: 9:30 a.m. – 8:00 p.m. · Dom: 10:30 a.m. – 4:00 p.m.',
    telefono: '+57 (607) 643 7890 · Ext. 301',
    rolLogistico: 'Hub logístico del Área Metropolitana de Bucaramanga, Santander y centro del país',
    servicios: [
      'Vitrina especializada en Marroquinería de Vélez y Seda Andina',
      'Centro de alistamiento rápido para pedidos web DANE 68001',
      'Atención de garantías y devoluciones omnicanal Ley 1480',
      'Intercambio de stock inter-sede con trazabilidad en 2 pasos',
    ],
    destacadoColor: '#661521',
  },
];

export const NosotrosPage: React.FC = () => {
  const [comunidadActivaId, setComunidadActivaId] = useState<string>(COMUNIDADES_ARTESANAS[0].id);
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState<string>(SEDES_RED_OMNICANAL[0].id);

  const comunidadActiva =
    COMUNIDADES_ARTESANAS.find((c) => c.id === comunidadActivaId) || COMUNIDADES_ARTESANAS[0];
  const sedeSeleccionada =
    SEDES_RED_OMNICANAL.find((s) => s.id === sedeSeleccionadaId) || SEDES_RED_OMNICANAL[0];

  return (
    <div className="space-y-16 relative">
      {/* Burbujas decorativas 3D en segundo plano */}
      <div
        className="mirror-bubble-3d w-44 h-44 absolute -top-8 -left-10 opacity-60 animate-float-3d hidden lg:block"
        aria-hidden="true"
      />
      <div
        className="mirror-bubble-3d w-32 h-32 absolute top-96 -right-6 opacity-50 animate-float-3d hidden lg:block"
        aria-hidden="true"
      />

      {/* =====================================================================
          1. HERO EDITORIAL: "EL ADN DE FORMA."
          ===================================================================== */}
      <section aria-labelledby="hero-adn-heading" className="relative">
        <div className="glass-mirror-card rounded-[2.5rem] p-6 sm:p-10 lg:p-14 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Narrativa del Manifiesto */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#661521] text-white text-[11px] font-bold tracking-[0.18em] uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#D19650]" aria-hidden="true" />
                <span>Manifiesto Editorial • Casa Fundada en Cúcuta</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D19650]">
                  Lujo Silencioso · Comercio Justo · Tecnología Omnicanal
                </p>
                <h1
                  id="hero-adn-heading"
                  className="text-4xl sm:text-5xl lg:text-6xl font-serif-editorial font-medium text-[#50322A] leading-[1.06] tracking-tight"
                >
                  El ADN de FORMA<span className="text-[#D19650]">.</span>
                </h1>
              </div>

              <p className="text-sm sm:text-base text-[#171717]/85 leading-relaxed max-w-2xl">
                Nacimos en la frontera nororiental colombiana con una convicción innegociable: demostrar que la{' '}
                <strong className="text-[#50322A]">sastrería contemporánea de autor</strong>, la{' '}
                <strong className="text-[#50322A]">cosmética botánica bio-activa</strong> y la{' '}
                <strong className="text-[#50322A]">artesanía ancestral de nuestras regiones</strong>{' '}
                pueden dialogar en un mismo espacio de diseño con trazabilidad exacta al centavo y al segundo.
              </p>

              <blockquote className="p-5 rounded-3xl bg-white/65 border-l-4 border-[#661521] text-xs sm:text-sm text-[#50322A] italic leading-relaxed shadow-sm">
                “En FORMA no coleccionamos temporadas efímeras; custodiamos piezas con denominación de origen. Cada hilo tejido en La Guajira, cada filigrana fundida en Mompox y cada lino cortado en nuestros talleres de Santander lleva grabado el nombre del maestro artesano y el sello inmutable de nuestra Bodega Central.”
              </blockquote>

              {/* 3 Pilares del Manifiesto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="glass-mirror-pill rounded-2xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#661521] block mb-1">
                    Pilar 01 · Moda
                  </span>
                  <h2 className="text-sm font-bold text-[#50322A] font-sans">
                    Sastrería Contemporánea
                  </h2>
                  <p className="text-xs text-[#171717]/75 mt-1 leading-relaxed">
                    Cortes arquitectónicos en lino orgánico, denim crudo y seda fría pensados para el trópico y la ciudad.
                  </p>
                </div>

                <div className="glass-mirror-pill rounded-2xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D19650] block mb-1">
                    Pilar 02 · Botánica
                  </span>
                  <h2 className="text-sm font-bold text-[#50322A] font-sans">
                    Cosmética Bio-Andina
                  </h2>
                  <p className="text-xs text-[#171717]/75 mt-1 leading-relaxed">
                    Elixires faciales y corporales prensados en frío con kahai, rosa mosqueta y extractos de páramo.
                  </p>
                </div>

                <div className="glass-mirror-pill rounded-2xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#50322A] block mb-1">
                    Pilar 03 · Raíz
                  </span>
                  <h2 className="text-sm font-bold text-[#50322A] font-sans">
                    Artesanía Ancestral
                  </h2>
                  <p className="text-xs text-[#171717]/75 mt-1 leading-relaxed">
                    Alianza directa con cabildos y talleres patrimoniales de La Guajira, Mompox, Vélez y los Santanderes.
                  </p>
                </div>
              </div>
            </div>

            {/* Composición Visual Editorial Derecha */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[420px]">
                <div className="aspect-[4/4.8] rounded-[2.25rem] overflow-hidden border-2 border-white/95 shadow-2xl relative">
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85"
                    alt="Atelier y curaduría de prendas artesanales en FORMA"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#50322A]/85 via-[#50322A]/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                    <span className="inline-block px-3 py-0.5 rounded-full bg-[#D19650] text-[#171717] text-[10px] font-bold uppercase tracking-widest">
                      Curaduría 2026
                    </span>
                    <p className="font-serif-editorial text-2xl font-medium leading-snug">
                      133 Piezas de Autor & Edición Numerada
                    </p>
                    <p className="text-xs text-[#E7DED2]/85">
                      Sincronizadas en vivo entre nuestra Tienda Web y 4 puntos físicos mediante Kardex único.
                    </p>
                  </div>
                </div>

                {/* Insignia Flotante Superior */}
                <div className="glass-mirror-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 absolute -top-4 -left-3 shadow-xl">
                  <Award className="w-4 h-4 text-[#661521]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#50322A]">
                    100% Hecho en Colombia
                  </span>
                </div>

                {/* Insignia Flotante Inferior */}
                <div className="glass-mirror-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 absolute -bottom-4 -right-3 shadow-xl">
                  <Leaf className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#50322A]">
                    Trazabilidad de Origen
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. SECCIÓN: "SELLO DE ORIGEN CERTIFICADO" & COMERCIO JUSTO
          ===================================================================== */}
      <section aria-labelledby="sello-origen-heading" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#661521] mb-2">
              <ShieldCheck className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
              <span>Autenticación en Bodega Central Cúcuta</span>
            </div>
            <h2
              id="sello-origen-heading"
              className="text-3xl sm:text-4xl font-serif-editorial font-medium text-[#50322A]"
            >
              Sello de Origen Certificado
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#171717]/75 max-w-md leading-relaxed">
            Ningún artículo ingresa a nuestras vitrinas físicas ni al catálogo web sin pasar antes por el protocolo de inspección de 4 etapas en nuestra{' '}
            <strong className="text-[#50322A]">Bodega Central de Cúcuta</strong>.
          </p>
        </div>

        {/* Protocolo de Autenticación en 4 Etapas (Bodega Central Cúcuta) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              paso: '01',
              titulo: 'Acopio & Pacto de Comercio Justo',
              descripcion:
                'Recibimos las piezas directamente de las asociaciones artesanas en La Guajira, Mompox, Vélez y Santander sin intermediarios especulativos.',
            },
            {
              paso: '02',
              titulo: 'Auditoría de Materiales en Cúcuta',
              descripcion:
                'En la Bodega Central verificamos pureza de fibras (algodón, lino, plata 950, cuero vegetal) y registro sanitario INVIMA en cosmética botánica.',
            },
            {
              paso: '03',
              titulo: 'Sellado SKU & Registro en Kardex',
              descripcion:
                'Cada variante recibe su etiqueta única y se registra mediante compra auditada en nuestro Libro Mayor de Inventario (Kardex inmutable).',
            },
            {
              paso: '04',
              titulo: 'Irrigación a las 4 Sedes Físicas',
              descripcion:
                'Mediante traslados asegurados de 2 pasos (ENVIADO → RECIBIDO), distribuimos el stock hacia Punto Centro, Caobos, Ocaña y Bucaramanga.',
            },
          ].map((etapa) => (
            <div
              key={etapa.paso}
              className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between hover:border-[#D19650]/70 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono-tabular text-xs font-bold px-3 py-1 rounded-full bg-[#50322A] text-[#E7DED2]">
                    ETAPA {etapa.paso}
                  </span>
                  <HeartHandshake className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-[#50322A] mb-2 font-sans">
                  {etapa.titulo}
                </h3>
                <p className="text-xs text-[#171717]/80 leading-relaxed">
                  {etapa.descripcion}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#50322A]/10 flex items-center gap-1.5 text-[11px] font-bold text-[#661521]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D19650]" aria-hidden="true" />
                <span>Trazabilidad 100% Verificada</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selector Interactivo de Comunidades Artesanas & Regiones de Origen */}
        <div className="glass-mirror-card rounded-[2.25rem] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#50322A]/10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#661521] block mb-1">
                Mapa de Saberes Ancestrales
              </span>
              <h3 className="text-2xl font-serif-editorial font-medium text-[#50322A]">
                Comunidades Artesanas & Territorios Aliados
              </h3>
            </div>

            {/* Botones de filtro por región */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Regiones artesanas">
              {COMUNIDADES_ARTESANAS.map((item) => {
                const activo = item.id === comunidadActiva.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setComunidadActivaId(item.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      activo
                        ? 'bg-[#661521] text-white shadow-md shadow-[#661521]/25'
                        : 'glass-mirror-pill text-[#50322A] hover:border-[#D19650]'
                    }`}
                  >
                    {item.region.split(',')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle de la Comunidad Seleccionada */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
            <div className="lg:col-span-5">
              <div className="aspect-[16/11] rounded-3xl overflow-hidden border border-white/90 shadow-lg relative">
                <img
                  src={comunidadActiva.imagenUrl}
                  alt={`${comunidadActiva.comunidad} - ${comunidadActiva.region}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 glass-mirror-pill px-3 py-1 rounded-full text-[11px] font-bold text-[#50322A]">
                  {comunidadActiva.region}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D19650]/20 text-[#50322A] text-xs font-bold">
                <Compass className="w-3.5 h-3.5 text-[#661521]" aria-hidden="true" />
                <span>{comunidadActiva.comunidad}</span>
              </div>

              <h4 className="text-xl sm:text-2xl font-serif-editorial font-medium text-[#50322A]">
                {comunidadActiva.oficio}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-white/65 border border-white/90">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#661521] block mb-1">
                    Materia Prima Trazable
                  </span>
                  <p className="text-xs font-medium text-[#171717]">
                    {comunidadActiva.materialTrazable}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/65 border border-white/90">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D19650] block mb-1">
                    Impacto Social Directo
                  </span>
                  <p className="text-xs font-medium text-[#171717]">
                    {comunidadActiva.impacto}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/65 border border-white/90">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#50322A] block mb-1">
                    Tiempo de Dedicación
                  </span>
                  <p className="text-xs font-medium text-[#171717]">
                    {comunidadActiva.tiempoElaboracion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SECCIÓN: "NUESTRA RED OMNICANAL (4 SEDES FÍSICAS + BODEGA CENTRAL)"
          ===================================================================== */}
      <section aria-labelledby="red-omnicanal-heading" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#661521] mb-2">
              <Building2 className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
              <span>Arquitectura Multisede en Tiempo Real</span>
            </div>
            <h2
              id="red-omnicanal-heading"
              className="text-3xl sm:text-4xl font-serif-editorial font-medium text-[#50322A]"
            >
              Nuestra Red Omnicanal (4 Sedes Físicas + Bodega Central)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#171717]/75 max-w-md leading-relaxed">
            Selecciona cualquiera de nuestras 4 boutiques físicas para explorar sus servicios exclusivos, cobertura DANE y sincronización con la Bodega Central.
          </p>
        </div>

        {/* Tarjetas Espejo Interactivas de las 4 Sedes Físicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {SEDES_RED_OMNICANAL.map((sede) => {
            const esActiva = sede.id === sedeSeleccionada.id;
            return (
              <button
                key={sede.id}
                type="button"
                onClick={() => setSedeSeleccionadaId(sede.id)}
                className={`text-left glass-mirror-card rounded-[2rem] p-6 transition-all duration-300 flex flex-col justify-between ${
                  esActiva
                    ? 'ring-2 ring-[#661521] -translate-y-1.5 shadow-2xl'
                    : 'hover:-translate-y-1 hover:border-[#D19650]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#50322A] text-[#E7DED2] font-mono-tabular text-[11px] font-bold">
                      DANE {sede.codigoDane}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        esActiva
                          ? 'bg-[#661521] text-white'
                          : 'bg-[#D19650]/20 text-[#50322A]'
                      }`}
                    >
                      {esActiva ? 'Seleccionada' : 'Ver Sede'}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#661521] mb-1">
                    {sede.ciudad} ({sede.departamento})
                  </p>
                  <h3 className="text-xl font-serif-editorial font-bold text-[#50322A] mb-1">
                    {sede.nombre}
                  </h3>
                  <p className="text-xs font-bold text-[#D19650] mb-3">
                    {sede.subtitulo}
                  </p>
                  <p className="text-xs text-[#171717]/75 leading-relaxed mb-4">
                    {sede.rolLogistico}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#50322A]/10 space-y-1.5 text-[11px] text-[#50322A]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#661521] shrink-0" aria-hidden="true" />
                    <span className="truncate">{sede.direccion}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#171717]/70">
                    <Clock className="w-3.5 h-3.5 text-[#D19650] shrink-0" aria-hidden="true" />
                    <span className="truncate">{sede.horario.split('·')[0]}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Detallado de la Sede Activa + Tarjeta de Bodega Central Cúcuta */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Detalle de la Sede Seleccionada */}
          <div className="lg:col-span-7 glass-mirror-card rounded-[2.25rem] p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#50322A]/10 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#661521] block">
                  Ficha Técnica de Punto Físico · Código DANE {sedeSeleccionada.codigoDane}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]">
                  {sedeSeleccionada.nombre} — {sedeSeleccionada.subtitulo}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>POS & Kardex En Línea</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/65 border border-white/90 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#50322A]/70 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#661521]" aria-hidden="true" />
                  Ubicación Física
                </span>
                <p className="font-bold text-[#171717]">{sedeSeleccionada.direccion}</p>
                <p className="text-[#171717]/70">
                  {sedeSeleccionada.ciudad}, {sedeSeleccionada.departamento}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/65 border border-white/90 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#50322A]/70 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#D19650]" aria-hidden="true" />
                  Contacto & Horario Oficial (America/Bogota)
                </span>
                <p className="font-bold text-[#171717]">{sedeSeleccionada.telefono}</p>
                <p className="text-[#171717]/70">{sedeSeleccionada.horario}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#50322A] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#661521]" aria-hidden="true" />
                <span>Servicios Omnicanal Disponibles en {sedeSeleccionada.nombre}</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sedeSeleccionada.servicios.map((servicio) => (
                  <li
                    key={servicio}
                    className="flex items-start gap-2 text-xs text-[#171717]/85 bg-white/55 p-3 rounded-2xl border border-white/80"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-[#661521] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{servicio}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tarjeta Especial: Bodega Central Cúcuta (Nodo Maestro) */}
          <div className="lg:col-span-5 rounded-[2.25rem] bg-[#50322A] text-[#E7DED2] p-6 sm:p-8 flex flex-col justify-between shadow-2xl border border-[#D19650]/35 relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D19650] text-[#171717] text-[10px] font-bold uppercase tracking-widest">
                <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Nodo Maestro · DANE 54001</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif-editorial font-medium text-white">
                Bodega Central Cúcuta
              </h3>

              <p className="text-xs sm:text-sm text-[#E7DED2]/85 leading-relaxed">
                Nuestro centro neurálgico de recepción de compras, control de calidad artesanal y custodia de inventario. No atiende público general en mostrador, garantizando un pulmón de seguridad para abastecer los 4 puntos físicos y proteger los pedidos web.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs">
                  <strong className="text-[#D19650] block mb-0.5">
                    Recepción Exclusiva de Compras (RN-COM-02)
                  </strong>
                  <span>
                    Toda orden de compra a proveedores y talleres artesanos ingresa y se audita primero en la Bodega Central antes de irrigarse a las tiendas.
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs">
                  <strong className="text-[#D19650] block mb-0.5">
                    Custodia de Pedidos Web Reasignados (RN-VTA-03)
                  </strong>
                  <span>
                    Si una venta presencial en tienda física reclama la última unidad con reserva blanda y ninguna otra sede tiene stock, el pedido web pasa a custodia prioritaria en Bodega Central.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/15 flex items-center justify-between text-xs text-[#E7DED2]/80 relative z-10">
              <span className="font-mono-tabular">Zona Industrial · Cúcuta (54001)</span>
              <span className="text-[#D19650] font-bold">Kardex Unificado v2.4</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. CTA FINAL: EXPLORAR CATÁLOGO O IR A SOPORTE
          ===================================================================== */}
      <section aria-label="Explorar Catálogo o Centro de Soporte">
        <div className="glass-mirror-card rounded-[2.5rem] p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D19650]/20 text-[#50322A] text-xs font-bold uppercase tracking-widest">
            <QrCode className="w-4 h-4 text-[#661521]" aria-hidden="true" />
            <span>Experiencia Omnicanal Completa</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif-editorial font-medium text-[#50322A]">
            Descubre la Colección 2026 o Consulta tu Envío DANE
          </h2>

          <p className="text-sm sm:text-base text-[#171717]/80 max-w-2xl mx-auto leading-relaxed">
            Explora nuestras 133 piezas de sastrería, accesorios, cosmética botánica y artesanías con stock en tiempo real, o visita nuestro Centro de Soporte para rastrear tu pedido web y simular tarifas DANE.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-[#661521] hover:bg-[#4A0E17] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#661521]/25"
            >
              <span>Explorar el Catálogo Oficial</span>
              <ArrowRight className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
            </Link>

            <Link
              to="/soporte"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-[#D19650] hover:bg-[#BF833E] text-[#171717] font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D19650]/25"
            >
              <span>Ir al Centro de Soporte & Envíos</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NosotrosPage;
