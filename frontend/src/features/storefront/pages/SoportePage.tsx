import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Truck,
  ShieldCheck,
  QrCode,
  MapPin,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  PackageCheck,
  Building2,
  Phone,
  ArrowRight,
  RefreshCw,
  FileCheck2,
  MessageCircle,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface CiudadDaneSimulador {
  codigoDane: string;
  municipio: string;
  departamento: string;
  sedeOptimaAsignada: string;
  sedeRespaldo: string;
  tarifaFijaFormateadaCOP: string;
  tiempoEstimado: string;
  tipoCobertura: string;
  explicacionRuta: string;
}

const CIUDADES_SIMULADOR_DANE: CiudadDaneSimulador[] = [
  {
    codigoDane: '54001',
    municipio: 'Cúcuta',
    departamento: 'Norte de Santander',
    sedeOptimaAsignada: '1.ª opción: Punto Centro (54001) · 2.ª opción: Punto Caobos (54001)',
    sedeRespaldo: 'Bodega Central Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$8.000 COP',
    tiempoEstimado: 'Mismo día (3 a 6 horas hábiles)',
    tipoCobertura: 'Cobertura Urbana Directa (Doble Nodo Local)',
    explicacionRuta:
      'Nuestro sistema asigna automáticamente la sede que cuente con el 100% de las prendas de tu compra en una sola tienda para evitar envíos fraccionados.',
  },
  {
    codigoDane: '54498',
    municipio: 'Ocaña',
    departamento: 'Norte de Santander',
    sedeOptimaAsignada: '1.ª opción: Punto Ocaña (54498)',
    sedeRespaldo: 'Punto Centro Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$9.500 COP',
    tiempoEstimado: 'Mismo día o 24 horas hábiles',
    tipoCobertura: 'Cobertura Subregional Directa en Sede Ocaña',
    explicacionRuta:
      'Si Punto Ocaña cuenta con todas las unidades del pedido, despacha localmente en minutos. Si falta una referencia, consolida el pedido completo desde Cúcuta.',
  },
  {
    codigoDane: '68001',
    municipio: 'Bucaramanga',
    departamento: 'Santander',
    sedeOptimaAsignada: '1.ª opción: Punto Bucaramanga (68001)',
    sedeRespaldo: 'Punto Centro Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$10.000 COP',
    tiempoEstimado: '24 horas hábiles (Área Metropolitana)',
    tipoCobertura: 'Hub Logístico Oriente Colombiano',
    explicacionRuta:
      'Atendido prioritariamente por nuestra boutique de Cabecera del Llano con inventario sincronizado en tiempo real.',
  },
  {
    codigoDane: '11001',
    municipio: 'Bogotá D.C.',
    departamento: 'Cundinamarca / Distrito Capital',
    sedeOptimaAsignada: '1.ª opción: Punto Bucaramanga (68001) · 2.ª opción: Punto Centro Cúcuta (54001)',
    sedeRespaldo: 'Punto Centro Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$16.500 COP',
    tiempoEstimado: '24 a 48 horas hábiles vía aérea/troncal',
    tipoCobertura: 'Despacho Nacional Prioritario Unificado',
    explicacionRuta:
      'Por cercanía logística hacia el centro del país, priorizamos el Hub Bucaramanga siempre que posea el stock íntegro de la orden.',
  },
  {
    codigoDane: '05001',
    municipio: 'Medellín',
    departamento: 'Antioquia',
    sedeOptimaAsignada: '1.ª opción: Punto Bucaramanga (68001) · 2.ª opción: Punto Ocaña (54498)',
    sedeRespaldo: 'Bodega Central Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$18.000 COP',
    tiempoEstimado: '2 a 3 días hábiles',
    tipoCobertura: 'Cobertura Nacional Consolidada',
    explicacionRuta:
      'Selecciona la sede con disponibilidad completa más próxima a la Troncal del Magdalena para entregar todo tu pedido en una sola caja sellada.',
  },
  {
    codigoDane: '76001',
    municipio: 'Cali',
    departamento: 'Valle del Cauca',
    sedeOptimaAsignada: '1.ª opción: Punto Bucaramanga (68001) · 2.ª opción: Bodega Central Cúcuta (54001)',
    sedeRespaldo: 'Bodega Central Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$18.000 COP',
    tiempoEstimado: '2 a 4 días hábiles vía troncal occidente',
    tipoCobertura: 'Cobertura Nacional Suroccidente',
    explicacionRuta:
      'Despacho prioritario desde Hub Bucaramanga o consolidación central para entrega en un único envío asegurado.',
  },
  {
    codigoDane: '08001',
    municipio: 'Barranquilla',
    departamento: 'Atlántico',
    sedeOptimaAsignada: '1.ª opción: Punto Ocaña (54498) · 2.ª opción: Punto Bucaramanga (68001)',
    sedeRespaldo: 'Bodega Central Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$18.000 COP',
    tiempoEstimado: '2 a 3 días hábiles vía Troncal del Caribe',
    tipoCobertura: 'Cobertura Caribe Colombiano',
    explicacionRuta:
      'Despacho optimizado desde el nodo norte más cercano con disponibilidad total de inventario.',
  },
  {
    codigoDane: '13001',
    municipio: 'Cartagena',
    departamento: 'Bolívar',
    sedeOptimaAsignada: '1.ª opción: Punto Ocaña (54498) · 2.ª opción: Bodega Central Cúcuta (54001)',
    sedeRespaldo: 'Bodega Central Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$18.000 COP',
    tiempoEstimado: '2 a 3 días hábiles vía Troncal del Caribe',
    tipoCobertura: 'Cobertura Caribe Colombiano',
    explicacionRuta:
      'Despacho directo desde sede Ocaña o Bodega Central asegurando empaque editorial libre de fraccionamientos.',
  },
];

interface PreguntaFrecuente {
  id: string;
  categoria: string;
  pregunta: string;
  respuesta: string;
}

const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    id: 'faq-envios-divididos',
    categoria: 'Tiempos de Envío y Despacho',
    pregunta: '¿Por qué FORMA nunca envía mi pedido fraccionado en varios paquetes?',
    respuesta:
      'Para brindarte una experiencia impecable, nuestro sistema busca automáticamente entre nuestras 4 sedes físicas (Cúcuta Centro, Cúcuta Caobos, Ocaña y Bucaramanga) aquella que tenga el 100% de las prendas de tu carrito. Así recibes una única caja editorial y pagas una sola tarifa de envío.',
  },
  {
    id: 'faq-pagos-qr-contraentrega',
    categoria: 'Pagos QR y Contraentrega',
    pregunta: '¿Cómo funcionan el pago por Código QR Dinámico y el pago Contraentrega?',
    respuesta:
      'Al elegir transferencia con nuestro Código QR Dinámico (Bancolombia, Nequi o Bre-B), el código reconoce automáticamente el valor exacto y la descripción de tu compra para confirmar tu pago al instante. Si te encuentras en Cúcuta, Bucaramanga u Ocaña, también puedes elegir Pago Contraentrega y cancelar al recibir tu paquete.',
  },
  {
    id: 'faq-qr-saldo-favor',
    categoria: 'Cambios de Talla y Saldo a Favor',
    pregunta: '¿Cómo realizo un cambio de talla o prenda en tienda física?',
    respuesta:
      'Cuentas con 30 días de garantía y 5 días hábiles de derecho de retracto en compras web. Al aprobarse un cambio o devolución, emitimos un Bono Digital con Código QR único en pesos colombianos (COP), el cual puedes redimir de inmediato en cualquiera de nuestras 4 tiendas físicas.',
  },
  {
    id: 'faq-excepcion-cosmeticos',
    categoria: 'Higiene en Cosméticos',
    pregunta: '¿Puedo cambiar o devolver un producto de Cosmética Botánica?',
    respuesta:
      'Por protección sanitaria e higiene, los artículos de uso personal, cosméticos, sérums faciales y bálsamos botánicos no admiten cambio ni retracto una vez abierto su sello de seguridad, salvo que presenten un defecto de fabricación comprobado.',
  },
];

export const SoportePage: React.FC = () => {
  const [daneSeleccionado, setDaneSeleccionado] = useState<string>('54001');
  const [faqAbiertaId, setFaqAbiertaId] = useState<string | null>(null);

  const ciudadActualDane =
    CIUDADES_SIMULADOR_DANE.find((c) => c.codigoDane === daneSeleccionado) ||
    CIUDADES_SIMULADOR_DANE[0];

  return (
    <div className="space-y-12 relative py-2">
      <div className="mb-2">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Centro de Soporte & Envíos DANE', isCurrent: true },
          ]}
        />
      </div>
      {/* =====================================================================
          1. ENCABEZADO EDITORIAL DEL CENTRO DE AYUDA & WHATSAPP OFICIAL
          ===================================================================== */}
      <section aria-labelledby="soporte-hero-heading">
        <div className="rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(80,50,42,0.12)] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#661521] text-white text-xs font-bold tracking-[0.18em] uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#D19650]" aria-hidden="true" />
                <span>Centro de Ayuda & Atención al Cliente</span>
              </div>

              <h1
                id="soporte-hero-heading"
                className="text-3xl sm:text-5xl font-serif-editorial font-medium text-[#50322A] leading-tight"
              >
                Soporte Oficial FORMA & WhatsApp Directo
              </h1>

              <p className="text-base sm:text-lg text-[#171717]/85 leading-relaxed">
                Nuestro equipo de asesores de boutique está disponible para acompañarte en tus compras, cambios de talla, asesoría de estilismo y seguimiento de envíos nacionales.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/573223602525?text=Hola%20FORMA%20Boutique%2C%20necesito%20asesor%C3%ADa%20con%20mi%20compra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chatear por WhatsApp Oficial</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <Link
                  to="/mi-cuenta"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#661521] hover:bg-[#50322A] text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md transition-all active:scale-95 border border-[#D19650]/40"
                >
                  <PackageCheck className="w-4 h-4 text-[#D19650]" />
                  <span>Ir a Trazabilidad y Rastreo de Pedidos</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Tarjeta Principal de Contacto Directo por WhatsApp Oficial FORMA */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white/90 backdrop-blur-xl border-2 border-[#D19650]/40 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#50322A]/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#50322A] uppercase tracking-wider">
                        WhatsApp Oficial FORMA
                      </h2>
                      <p className="text-xs text-emerald-700 font-bold">
                        ● En línea · Respuesta prioritaria
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-xs font-bold text-[#661521] bg-[#661521]/10 px-2.5 py-1 rounded-full">
                    +57 322 360 2525
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-[#50322A]">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#D19650] shrink-0" />
                    <span>
                      <strong>Horario de Atención:</strong> Lunes a Sábado 8:00 a.m. – 7:00 p.m. (Hora Colombia)
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#D19650] shrink-0" />
                    <span>
                      <strong>Correo Oficial:</strong> soporte@forma.co
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <PackageCheck className="w-4 h-4 text-[#D19650] shrink-0" />
                    <span>
                      <strong>Rastreo en Vivo:</strong> Consulta los 7 estados y confirma la entrega desde{' '}
                      <Link to="/mi-cuenta" className="text-[#661521] font-extrabold underline">
                        Mi Cuenta
                      </Link>
                    </span>
                  </div>
                </div>

                <a
                  href="https://wa.me/573223602525?text=Hola%20FORMA%20Boutique%2C%20necesito%20asesor%C3%ADa%20personalizada"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Abrir Conversación Directa en WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. SIMULADOR DE COBERTURA Y TARIFAS DE ENVÍO DANE
          ===================================================================== */}
      <section aria-labelledby="simulador-dane-heading" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel Izquierdo: Selector de Municipio DANE */}
          <div className="lg:col-span-7 rounded-[2.25rem] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(80,50,42,0.10)] p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
                Tabulador Oficial · Cero Envíos Fraccionados
              </span>
              <h2
                id="simulador-dane-heading"
                className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]"
              >
                Simulador de Cobertura y Tarifas de Envío DANE
              </h2>
              <p className="text-xs sm:text-sm text-[#171717] mt-1 leading-relaxed">
                Selecciona tu ciudad destino para consultar la tarifa en COP y conocer qué sede física despachará tu orden completa.
              </p>
            </div>

            {/* Botones de Ciudad Destino */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Ciudades destino DANE">
              {CIUDADES_SIMULADOR_DANE.map((ciudad) => {
                const activa = ciudad.codigoDane === ciudadActualDane.codigoDane;
                return (
                  <button
                    key={ciudad.codigoDane}
                    type="button"
                    onClick={() => setDaneSeleccionado(ciudad.codigoDane)}
                    className={`min-h-[48px] px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                      activa
                        ? 'bg-[#661521] text-white shadow-md shadow-[#661521]/25'
                        : 'glass-mirror-pill text-[#50322A] hover:border-[#D19650]'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                    <span>{ciudad.municipio}</span>
                    <span className="font-mono-tabular opacity-85">({ciudad.codigoDane})</span>
                  </button>
                );
              })}
            </div>

            {/* Resultado de la Simulación DANE */}
            <div className="p-6 rounded-3xl bg-white/85 border border-white/95 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#50322A]/15 pb-4">
                <div>
                  <span className="font-mono-tabular text-xs font-bold text-[#661521]">
                    CÓDIGO DANE {ciudadActualDane.codigoDane} · {ciudadActualDane.departamento}
                  </span>
                  <h3 className="text-2xl font-serif-editorial font-bold text-[#50322A]">
                    Destino: {ciudadActualDane.municipio}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#50322A]/80 block">
                    Tarifa Única DANE
                  </span>
                  <span className="text-2xl font-mono-tabular font-bold text-[#661521]">
                    {ciudadActualDane.tarifaFijaFormateadaCOP}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#E7DED2]/70 border border-white space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#50322A] block">
                    1ª Opción (Sede Más Cercana con Stock)
                  </span>
                  <strong className="text-[#50322A] block text-sm">
                    {ciudadActualDane.sedeOptimaAsignada}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#E7DED2]/70 border border-white space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#50322A] block">
                    Tiempo Estimado & Respaldo
                  </span>
                  <strong className="text-[#171717] block text-sm">
                    {ciudadActualDane.tiempoEstimado}
                  </strong>
                  <span className="text-xs text-[#50322A]">
                    Respaldo: {ciudadActualDane.sedeRespaldo}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed bg-white/90 p-4 rounded-2xl border border-[#D19650]/30">
                <strong className="text-[#661521]">Despacho Unificado:</strong>{' '}
                {ciudadActualDane.explicacionRuta}
              </p>
            </div>
          </div>

          {/* Panel Derecho: Beneficios Logísticos de Compra */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(80,50,42,0.08)] p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-[#661521]">
                <Truck className="w-5 h-5 text-[#D19650]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#50322A] font-sans">
                  Envío Completo en un Solo Paquete
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Nunca dividimos tu orden en varios cobros de transporte. Al confirmar tu compra, asignamos la sede física más cercana a tu municipio que cuente con el{' '}
                <strong className="text-[#50322A]">100% de las prendas solicitadas</strong>.
              </p>
            </div>

            <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(80,50,42,0.08)] p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-[#661521]">
                <QrCode className="w-5 h-5 text-[#D19650]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#50322A] font-sans">
                  Pago QR Inteligente y Contraentrega
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                En el checkout puedes escanear nuestro <strong className="text-[#50322A]">Código QR Dinámico</strong> que reconoce automáticamente el valor total y las prendas de tu pedido, o elegir <strong className="text-[#50322A]">Pago Contraentrega</strong> en Cúcuta, Bucaramanga y Ocaña.
              </p>
            </div>

            <div className="rounded-3xl bg-[#50322A] text-[#E7DED2] p-6 space-y-3 border border-[#D19650]/40">
              <div className="flex items-center gap-2 text-[#D19650] text-xs font-bold uppercase tracking-wider">
                <PackageCheck className="w-4 h-4" aria-hidden="true" />
                <span>¿Buscas el estado de tu pedido?</span>
              </div>
              <p className="text-xs sm:text-sm text-[#E7DED2] leading-relaxed">
                El seguimiento en vivo de los 7 estados y la confirmación de entrega se encuentran centralizados en tu panel de cliente.
              </p>
              <Link
                to="/mi-cuenta"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[#D19650] hover:text-white transition-colors"
              >
                <span>Ir a Mi Cuenta y Rastreo de Pedidos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. GARANTÍAS, CAMBIOS Y DERECHO DE RETRACTO (LEY 1480)
          ===================================================================== */}
      <section aria-labelledby="garantias-heading" className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
            Estatuto del Consumidor en Colombia · Ley 1480 de 2011
          </span>
          <h2
            id="garantias-heading"
            className="text-3xl sm:text-4xl font-serif-editorial font-medium text-[#50322A]"
          >
            Garantías, Cambios y Derecho de Retracto
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#661521]/10 border border-[#661521]/20 flex items-center justify-center text-[#661521]">
                <RefreshCw className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#661521] block">
                Compras en Tienda Web
              </span>
              <h3 className="text-lg font-bold text-[#50322A] font-sans">
                5 Días Hábiles de Retracto Web
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Para todas las compras realizadas en nuestra Tienda Web tienes{' '}
                <strong className="text-[#50322A]">5 días hábiles</strong> contados desde la entrega para ejercer el derecho de retracto, conservando etiquetas originales.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#50322A]/15 text-xs font-mono-tabular font-bold text-[#50322A]">
              Horario Oficial de Colombia
            </div>
          </div>

          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D19650]/20 border border-[#D19650]/40 flex items-center justify-center text-[#50322A]">
                <ShieldCheck className="w-6 h-6 text-[#661521]" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#D19650] block">
                Respaldo de Atelier & Artesanía
              </span>
              <h3 className="text-lg font-bold text-[#50322A] font-sans">
                30 Días de Garantía Legal
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Todas nuestras piezas de ropa, calzado, marroquinería y filigrana cuentan con{' '}
                <strong className="text-[#50322A]">30 días calendario de garantía</strong> por defectos de fabricación, costuras o herrajes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#50322A]/15 text-xs font-bold text-[#661521]">
              Cambio directo o Bono QR 100%
            </div>
          </div>

          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#50322A]/10 border border-[#50322A]/20 flex items-center justify-center text-[#50322A]">
                <QrCode className="w-6 h-6 text-[#661521]" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#50322A] block">
                Billetera Omnicanal
              </span>
              <h3 className="text-lg font-bold text-[#50322A] font-sans">
                Código QR de Saldo a Favor
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Para tus cambios en tienda física (Cúcuta Centro, Caobos, Ocaña o Bucaramanga), generamos un{' '}
                <strong className="text-[#50322A]">Bono QR de Saldo a Favor</strong> por el valor exacto pagado en pesos colombianos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#50322A]/15 text-xs font-bold text-[#50322A]">
              Redimible en las 4 Sedes Físicas
            </div>
          </div>

          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between border-[#661521]/30">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#D19650]" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#661521] block">
                Bioseguridad & Uso Personal
              </span>
              <h3 className="text-lg font-bold text-[#661521] font-sans">
                Higiene en Cosmética Botánica
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Por disposición sanitaria y seguridad del consumidor, los productos de uso personal y cosmética botánica{' '}
                <strong className="text-[#661521]">no admiten cambio ni derecho de retracto</strong> una vez abierto su sello de higiene.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#661521]/20 text-xs font-bold text-[#661521]">
              Protección de Bioseguridad al Cliente
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. PREGUNTAS FRECUENTES (ACORDEÓN) & CANALES DE ATENCIÓN POR SEDE
          ===================================================================== */}
      <section aria-labelledby="faq-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Acordeón Interactivo FAQ */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
              Resolución de Dudas Frecuentes
            </span>
            <h2
              id="faq-heading"
              className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]"
            >
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {PREGUNTAS_FRECUENTES.map((item) => {
              const abierta = item.id === faqAbiertaId;
              return (
                <div
                  key={item.id}
                  className="glass-mirror-card rounded-3xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    aria-expanded={abierta}
                    onClick={() => setFaqAbiertaId(abierta ? '' : item.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 min-h-[56px]"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D19650]/25 text-[#50322A]">
                        {item.categoria}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#50322A] font-sans">
                        {item.pregunta}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#661521] shrink-0 transition-transform duration-300 ${
                        abierta ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {abierta && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#171717] leading-relaxed border-t border-[#50322A]/10">
                      {item.respuesta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Directorio de Atención Directa por Sede */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
              Atención Presencial & Telefónica
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]">
              Canales Directos por Sede
            </h2>
          </div>

          <div className="glass-mirror-card rounded-[2rem] p-6 space-y-4 shadow-sm">
            {[
              {
                sede: 'Punto Centro (Cúcuta — DANE 54001)',
                tipo: 'Flagship Store & Cambios QR',
                contacto: '+57 (607) 571 8400 · Av. 5 # 11-42',
              },
              {
                sede: 'Punto Caobos (Cúcuta — DANE 54001)',
                tipo: 'Boutique Exclusiva & Click & Collect',
                contacto: '+57 (607) 572 9120 · Calle 15 # 1E-88',
              },
              {
                sede: 'Punto Ocaña (N. de Santander — DANE 54498)',
                tipo: 'Centro de Experiencia Regional',
                contacto: '+57 (607) 562 4310 · Calle 11 # 12-18',
              },
              {
                sede: 'Punto Bucaramanga (Santander — DANE 68001)',
                tipo: 'Hub de Moda & Despacho Oriente',
                contacto: '+57 (607) 643 7890 · Cra. 35A # 48-62',
              },
            ].map((canal) => (
              <div
                key={canal.sede}
                className="p-4 rounded-2xl bg-white/80 border border-white/95 space-y-1 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-[#50322A] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#661521]" aria-hidden="true" />
                    <span>{canal.sede}</span>
                  </strong>
                </div>
                <p className="text-xs font-bold text-[#D19650]">{canal.tipo}</p>
                <p className="text-xs text-[#171717] flex items-center gap-1.5 pt-0.5">
                  <Phone className="w-4 h-4 text-[#50322A]" aria-hidden="true" />
                  <span>{canal.contacto}</span>
                </p>
              </div>
            ))}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/nosotros"
                className="min-h-[48px] inline-flex items-center gap-2 text-xs font-bold text-[#661521] hover:text-[#50322A] transition-colors"
              >
                <FileCheck2 className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                <span>Ver Sello de Origen y Bodega Central</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                to="/#catalogo-grid"
                onClick={() => {
                  const el = document.getElementById('catalogo-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="min-h-[48px] inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#661521] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A0E17] transition-all shadow-md"
              >
                <span>Volver al Catálogo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SoportePage;
