import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Send,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';

interface SolicitudTrasladoItem {
  id: string;
  codigo: string;
  fecha: string;
  productoNombre: string;
  sku: string;
  talla: string;
  cantidad: number;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'EN_CAMINO';
}

interface LineaRecepcionTraslado {
  id: string;
  sku: string;
  nombre: string;
  talla: string;
  color: string;
  imagenUrl: string;
  cantidadEnviada: number;
  recibidasBuenas: number;
  recibidasDanadas: number;
}

interface DespachoEntranteItem {
  id: string;
  codigo: string;
  origen: string;
  destino: string;
  fechaDespacho: string;
  estado: 'EN_TRANSITO' | 'RECIBIDO' | 'RECIBIDO_CON_NOVEDAD';
  observaciones: string;
  lineas: LineaRecepcionTraslado[];
}

const PRODUCTOS_CATALOGO_SOLICITUD = [
  {
    nombre: 'Chaqueta Denim Artesanal',
    skuBase: 'ROP-DNM-001',
    tallas: ['S', 'M', 'L', 'XL'],
  },
  {
    nombre: 'Camiseta Básica Algodón Pima',
    skuBase: 'ROP-CAM-002',
    tallas: ['S', 'M', 'L', 'XL'],
  },
  {
    nombre: 'Bolso Cuero Graso Unisex',
    skuBase: 'ACC-BOL-003',
    tallas: ['Única'],
  },
  {
    nombre: 'Botines Chelsea Cuero Vélez',
    skuBase: 'CAL-BOT-006',
    tallas: ['38', '39', '40', '41', '42'],
  },
  {
    nombre: 'Mochila Tejeduría Ancestral',
    skuBase: 'ART-MOC-005',
    tallas: ['Estándar'],
  },
];

export const PosTrasladosPage: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<'SOLICITUD' | 'RECEPCION'>('SOLICITUD');

  // =========================================================================
  // ESTADO PESTAÑA 1: SOLICITUD DE TRASLADO A BODEGA CENTRAL
  // =========================================================================
  const [productoSeleccionadoIdx, setProductoSeleccionadoIdx] = useState<number>(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState<string>('M');
  const [cantidadSolicitada, setCantidadSolicitada] = useState<number>(5);
  const [motivoSolicitud, setMotivoSolicitud] = useState<string>(
    'Reposición por inventario bajo en mostrador'
  );
  const [mensajeSolicitudExito, setMensajeSolicitudExito] = useState<string | null>(null);

  const [solicitudes, setSolicitudes] = useState<SolicitudTrasladoItem[]>([
    {
      id: 'sol-01',
      codigo: 'SOL-2026-042',
      fecha: 'Hoy · 08:30 a. m.',
      productoNombre: 'Camiseta Básica Algodón Pima',
      sku: 'ROP-CAM-002-M',
      talla: 'M',
      cantidad: 10,
      motivo: 'Alta rotación de tallas intermedias',
      estado: 'EN_CAMINO',
    },
    {
      id: 'sol-02',
      codigo: 'SOL-2026-039',
      fecha: 'Ayer · 03:15 p. m.',
      productoNombre: 'Botines Chelsea Cuero Vélez',
      sku: 'CAL-BOT-006-40',
      talla: '40',
      cantidad: 4,
      motivo: 'Apartado por cliente en tienda física',
      estado: 'APROBADA',
    },
    {
      id: 'sol-03',
      codigo: 'SOL-2026-035',
      fecha: 'Hace 3 días · 11:00 a. m.',
      productoNombre: 'Chaqueta Denim Artesanal',
      sku: 'ROP-DNM-001-L',
      talla: 'L',
      cantidad: 6,
      motivo: 'Reposición de fin de semana',
      estado: 'PENDIENTE',
    },
  ]);

  const handleCrearSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = PRODUCTOS_CATALOGO_SOLICITUD[productoSeleccionadoIdx];
    const nuevaSol: SolicitudTrasladoItem = {
      id: `sol-${Date.now()}`,
      codigo: `SOL-2026-0${solicitudes.length + 43}`,
      fecha: 'Hoy · Recién enviada',
      productoNombre: prod.nombre,
      sku: `${prod.skuBase}-${tallaSeleccionada}`,
      talla: tallaSeleccionada,
      cantidad: Math.max(1, cantidadSolicitada),
      motivo: motivoSolicitud.trim() || 'Reposición regular de tienda',
      estado: 'PENDIENTE',
    };

    setSolicitudes((prev) => [nuevaSol, ...prev]);
    setMensajeSolicitudExito(
      `Solicitud ${nuevaSol.codigo} enviada con éxito a Bodega Central.`
    );
    setTimeout(() => setMensajeSolicitudExito(null), 4000);
  };

  // =========================================================================
  // ESTADO PESTAÑA 2: RECEPCIÓN DE TRASLADOS ENTRANTES
  // =========================================================================
  const [despachosEntrantes, setDespachosEntrantes] = useState<DespachoEntranteItem[]>([
    {
      id: 'tra-089',
      codigo: 'TRA-2026-089',
      origen: 'Bodega Central (Cúcuta)',
      destino: 'Punto Centro — Cúcuta',
      fechaDespacho: 'Hoy · 07:30 a. m.',
      estado: 'EN_TRANSITO',
      observaciones: '',
      lineas: [
        {
          id: 'l-089-1',
          sku: 'ROP-DNM-001-M',
          nombre: 'Chaqueta Denim Artesanal',
          talla: 'M',
          color: 'Azul Índigo',
          imagenUrl:
            'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
          cantidadEnviada: 10,
          recibidasBuenas: 10,
          recibidasDanadas: 0,
        },
        {
          id: 'l-089-2',
          sku: 'ROP-CAM-002-S',
          nombre: 'Camiseta Básica Algodón Pima',
          talla: 'S',
          color: 'Blanco Hueso',
          imagenUrl:
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
          cantidadEnviada: 12,
          recibidasBuenas: 12,
          recibidasDanadas: 0,
        },
      ],
    },
    {
      id: 'tra-092',
      codigo: 'TRA-2026-092',
      origen: 'Bodega Central (Cúcuta)',
      destino: 'Punto Centro — Cúcuta',
      fechaDespacho: 'Ayer · 05:10 p. m.',
      estado: 'EN_TRANSITO',
      observaciones: '1 unidad llegó con costura averiada en el transporte.',
      lineas: [
        {
          id: 'l-092-1',
          sku: 'ACC-BOL-003-UNI',
          nombre: 'Bolso Cuero Graso Unisex',
          talla: 'Única',
          color: 'Miel Natural',
          imagenUrl:
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
          cantidadEnviada: 6,
          recibidasBuenas: 5,
          recibidasDanadas: 1,
        },
      ],
    },
  ]);

  const [errorRecepcion, setErrorRecepcion] = useState<string | null>(null);

  // Steppers de conteo físico (Buenas y Dañadas)
  const handleAjustarConteo = (
    trasladoId: string,
    lineaId: string,
    campo: 'recibidasBuenas' | 'recibidasDanadas',
    delta: number
  ) => {
    setErrorRecepcion(null);
    setDespachosEntrantes((prev) =>
      prev.map((tra) => {
        if (tra.id !== trasladoId || tra.estado !== 'EN_TRANSITO') return tra;
        return {
          ...tra,
          lineas: tra.lineas.map((lin) => {
            if (lin.id !== lineaId) return lin;
            const nuevo = Math.max(0, lin[campo] + delta);
            const otro =
              campo === 'recibidasBuenas' ? lin.recibidasDanadas : lin.recibidasBuenas;
            if (nuevo + otro > lin.cantidadEnviada) {
              setErrorRecepcion(
                `La suma de prendas en buen estado (${
                  campo === 'recibidasBuenas' ? nuevo : lin.recibidasBuenas
                }) y dañadas (${
                  campo === 'recibidasDanadas' ? nuevo : lin.recibidasDanadas
                }) no puede superar el total enviado (${lin.cantidadEnviada}).`
              );
              return lin;
            }
            return { ...lin, [campo]: nuevo };
          }),
        };
      })
    );
  };

  const handleUpdateObservacionRecepcion = (trasladoId: string, texto: string) => {
    setDespachosEntrantes((prev) =>
      prev.map((tra) => (tra.id === trasladoId ? { ...tra, observaciones: texto } : tra))
    );
  };

  // Confirmar recepción de mercancía
  const handleConfirmarRecepcion = (trasladoId: string) => {
    setErrorRecepcion(null);
    const target = despachosEntrantes.find((t) => t.id === trasladoId);
    if (!target) return;

    const tieneDanadas = target.lineas.some((l) => l.recibidasDanadas > 0);
    const tieneFaltantes = target.lineas.some(
      (l) => l.recibidasBuenas + l.recibidasDanadas < l.cantidadEnviada
    );

    if ((tieneDanadas || tieneFaltantes) && !target.observaciones.trim()) {
      setErrorRecepcion(
        `El envío ${target.codigo} presenta novedades (dañadas o faltantes). Ingresa una breve observación explicando la novedad.`
      );
      return;
    }

    const nuevoEstado = tieneDanadas || tieneFaltantes ? 'RECIBIDO_CON_NOVEDAD' : 'RECIBIDO';
    setDespachosEntrantes((prev) =>
      prev.map((tra) => (tra.id === trasladoId ? { ...tra, estado: nuevoEstado } : tra))
    );
  };

  const productoActual = PRODUCTOS_CATALOGO_SOLICITUD[productoSeleccionadoIdx];

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-3 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA Y PESTAÑAS LIMPIAS DE TRASLADOS
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EFEAE4]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              <ArrowLeftRight className="w-6 h-6 text-[#D19650]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-xs font-black uppercase">
                  Inventario Sede
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-xs font-extrabold">
                  Gestión de Traslados
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-1">
                Traslados de Mercancía con Bodega Central
              </h1>
            </div>
          </div>

          <div className="text-xs text-stone-600 bg-[#FAF7F4] px-3.5 py-2 rounded-xl border border-[#E5DDD3]">
            Sede: <strong>Punto Centro (Cúcuta)</strong>
          </div>
        </div>

        {/* 2 Pestañas Limpias */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setTabActiva('SOLICITUD')}
            className={`min-h-[46px] px-5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border transition-all ${
              tabActiva === 'SOLICITUD'
                ? 'bg-[#661521] text-white border-[#661521] shadow-sm'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <Send className="w-4 h-4 text-[#D19650]" />
            <span>Pestaña 1: Solicitud de Traslado a Bodega Central</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('RECEPCION')}
            className={`min-h-[46px] px-5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border transition-all ${
              tabActiva === 'RECEPCION'
                ? 'bg-[#661521] text-white border-[#661521] shadow-sm'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-[#D19650]" />
            <span>
              Pestaña 2: Recepción de Traslados Entrantes ({despachosEntrantes.length})
            </span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          PESTAÑA 1: SOLICITUD DE TRASLADO A BODEGA CENTRAL
      ========================================================================= */}
      {tabActiva === 'SOLICITUD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Formulario de Solicitud (5 Columnas) */}
          <section className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
            <div className="pb-2 border-b border-[#EFEAE4]">
              <span className="text-xs font-bold uppercase text-stone-500">Nuevo Pedido</span>
              <h2 className="text-base font-black text-[#1C1311]">
                Solicitar Mercancía a Bodega Central
              </h2>
            </div>

            <form onSubmit={handleCrearSolicitud} className="space-y-3.5">
              {/* Selección de Producto */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Producto a Solicitar:
                </label>
                <select
                  value={productoSeleccionadoIdx}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setProductoSeleccionadoIdx(idx);
                    setTallaSeleccionada(PRODUCTOS_CATALOGO_SOLICITUD[idx].tallas[0] || 'M');
                  }}
                  className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                >
                  {PRODUCTOS_CATALOGO_SOLICITUD.map((p, idx) => (
                    <option key={p.skuBase} value={idx}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Talla y Cantidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                    Talla Necesaria:
                  </label>
                  <select
                    value={tallaSeleccionada}
                    onChange={(e) => setTallaSeleccionada(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                  >
                    {productoActual.tallas.map((t) => (
                      <option key={t} value={t}>
                        Talla {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                    Cantidad (Unidades):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={cantidadSolicitada}
                    onChange={(e) => setCantidadSolicitada(parseInt(e.target.value, 10) || 1)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] font-mono text-base font-black text-[#1C1311] focus:outline-none focus:border-[#661521]"
                  />
                </div>
              </div>

              {/* Motivo de la Solicitud */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Motivo de la Solicitud:
                </label>
                <input
                  type="text"
                  value={motivoSolicitud}
                  onChange={(e) => setMotivoSolicitud(e.target.value)}
                  placeholder="Ej. Stock agotado en mostrador, pedido de cliente..."
                  className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[54px] px-5 rounded-2xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Send className="w-4 h-4 text-[#D19650]" />
                <span>Enviar Solicitud a Bodega Central</span>
              </button>

              {mensajeSolicitudExito && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{mensajeSolicitudExito}</span>
                </div>
              )}
            </form>
          </section>

          {/* Historial de Solicitudes Realizadas (7 Columnas) */}
          <section className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
              <div>
                <span className="text-xs font-bold uppercase text-stone-500">Trazabilidad</span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Historial de Solicitudes Enviadas ({solicitudes.length})
                </h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#1C1311]">
                        #{sol.codigo}
                      </span>
                      <span className="text-stone-500">· {sol.fecha}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          sol.estado === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : sol.estado === 'APROBADA'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            : 'bg-emerald-100 text-[#059669] border border-emerald-300'
                        }`}
                      >
                        {sol.estado === 'PENDIENTE' && 'Pendiente de Aprobación'}
                        {sol.estado === 'APROBADA' && 'Aprobada por Central'}
                        {sol.estado === 'EN_CAMINO' && 'En Camino hacia Tienda'}
                      </span>
                    </div>

                    <p className="font-black text-sm text-[#1C1311] mt-1">
                      {sol.productoNombre} (Talla {sol.talla})
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      Cantidad: <strong>{sol.cantidad} unidades</strong> · Motivo: {sol.motivo}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-stone-500 block">
                      SKU: {sol.sku}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 2: RECEPCIÓN DE TRASLADOS ENTRANTES
      ========================================================================= */}
      {tabActiva === 'RECEPCION' && (
        <div className="space-y-4">
          {errorRecepcion && (
            <div className="p-4 rounded-xl bg-red-50 border-2 border-[#661521] text-[#661521] text-xs font-bold flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorRecepcion}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorRecepcion(null)}
                className="px-2.5 py-1 rounded bg-[#661521] text-white text-xs font-bold"
              >
                Entendido
              </button>
            </div>
          )}

          <div className="space-y-4">
            {despachosEntrantes.map((despacho) => {
              const totalEnviado = despacho.lineas.reduce((acc, l) => acc + l.cantidadEnviada, 0);
              const totalBuenas = despacho.lineas.reduce((acc, l) => acc + l.recibidasBuenas, 0);
              const totalDanadas = despacho.lineas.reduce((acc, l) => acc + l.recibidasDanadas, 0);
              const totalFaltantes = Math.max(0, totalEnviado - (totalBuenas + totalDanadas));

              return (
                <article
                  key={despacho.id}
                  className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4"
                >
                  {/* Cabecera del Despacho */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-xl bg-[#1C1311] text-[#D19650] font-mono text-sm font-black">
                        #{despacho.codigo}
                      </span>
                      <span className="text-xs font-semibold text-stone-600">
                        {despacho.origen} → <strong className="text-[#1C1311]">{despacho.destino}</strong>
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        ({despacho.fechaDespacho})
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        despacho.estado === 'EN_TRANSITO'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : despacho.estado === 'RECIBIDO'
                          ? 'bg-emerald-100 text-[#059669] border border-emerald-300'
                          : 'bg-red-100 text-[#661521] border border-red-300'
                      }`}
                    >
                      {despacho.estado === 'EN_TRANSITO' && 'En Tránsito (Pendiente por Recibir)'}
                      {despacho.estado === 'RECIBIDO' && 'Mercancía Recibida Completa'}
                      {despacho.estado === 'RECIBIDO_CON_NOVEDAD' && 'Recibido con Novedades'}
                    </span>
                  </div>

                  {/* Líneas de Prendas en el Envío */}
                  <div className="space-y-3">
                    {despacho.lineas.map((linea) => {
                      const faltantes = Math.max(
                        0,
                        linea.cantidadEnviada - (linea.recibidasBuenas + linea.recibidasDanadas)
                      );

                      return (
                        <div
                          key={linea.id}
                          className="p-3.5 bg-[#FAF7F4] rounded-2xl border border-[#E5DDD3] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={linea.imagenUrl}
                                alt={linea.nombre}
                                className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-[#1C1311] truncate">
                                  {linea.nombre}
                                </h4>
                                <p className="font-mono text-xs text-stone-600">
                                  SKU: {linea.sku} · Talla: {linea.talla} · Color: {linea.color}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-bold uppercase text-stone-500 block">
                                Cantidad Enviada
                              </span>
                              <span className="font-mono text-base font-black text-[#1C1311]">
                                {linea.cantidadEnviada} unidades
                              </span>
                            </div>
                          </div>

                          {/* Conteo Físico Táctil */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E5DDD3]">
                            {/* Unidades en Buen Estado */}
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                              <div>
                                <span className="text-[11px] font-extrabold uppercase text-[#059669] block">
                                  En Buen Estado
                                </span>
                                <span className="text-[10px] text-stone-500">Ingresan a venta</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={
                                    despacho.estado !== 'EN_TRANSITO' || linea.recibidasBuenas <= 0
                                  }
                                  onClick={() =>
                                    handleAjustarConteo(despacho.id, linea.id, 'recibidasBuenas', -1)
                                  }
                                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center font-black disabled:opacity-40"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center font-mono text-sm font-black text-[#059669]">
                                  {linea.recibidasBuenas}
                                </span>
                                <button
                                  type="button"
                                  disabled={despacho.estado !== 'EN_TRANSITO'}
                                  onClick={() =>
                                    handleAjustarConteo(despacho.id, linea.id, 'recibidasBuenas', 1)
                                  }
                                  className="w-8 h-8 rounded-lg bg-[#059669] text-white flex items-center justify-center font-black disabled:opacity-40"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Unidades Dañadas */}
                            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                              <div>
                                <span className="text-[11px] font-extrabold uppercase text-[#661521] block">
                                  Unidades Dañadas
                                </span>
                                <span className="text-[10px] text-stone-500">Apartar a averías</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={
                                    despacho.estado !== 'EN_TRANSITO' || linea.recibidasDanadas <= 0
                                  }
                                  onClick={() =>
                                    handleAjustarConteo(
                                      despacho.id,
                                      linea.id,
                                      'recibidasDanadas',
                                      -1
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center font-black disabled:opacity-40"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center font-mono text-sm font-black text-[#661521]">
                                  {linea.recibidasDanadas}
                                </span>
                                <button
                                  type="button"
                                  disabled={despacho.estado !== 'EN_TRANSITO'}
                                  onClick={() =>
                                    handleAjustarConteo(
                                      despacho.id,
                                      linea.id,
                                      'recibidasDanadas',
                                      1
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg bg-[#661521] text-white flex items-center justify-center font-black disabled:opacity-40"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Faltantes Calculados Automáticamente */}
                            <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-between">
                              <div>
                                <span className="text-[11px] font-extrabold uppercase text-stone-700 block">
                                  Faltantes (Auto)
                                </span>
                                <span className="text-[10px] text-stone-500">No llegaron</span>
                              </div>
                              <span
                                className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg ${
                                  faltantes > 0
                                    ? 'bg-amber-200 text-amber-950'
                                    : 'bg-white text-stone-600'
                                }`}
                              >
                                {faltantes} und
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Observación de Recepción */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                      Observaciones de Recepción:
                    </label>
                    <input
                      type="text"
                      disabled={despacho.estado !== 'EN_TRANSITO'}
                      value={despacho.observaciones}
                      onChange={(e) =>
                        handleUpdateObservacionRecepcion(despacho.id, e.target.value)
                      }
                      placeholder="Escribe si hubo empaques rotos, prendas manchadas o cualquier novedad..."
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521] disabled:opacity-60"
                    />
                  </div>

                  {/* Botón de Confirmación */}
                  {despacho.estado === 'EN_TRANSITO' ? (
                    <button
                      type="button"
                      onClick={() => handleConfirmarRecepcion(despacho.id)}
                      className="w-full min-h-[56px] px-6 rounded-2xl bg-[#059669] hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <PackageCheck className="w-5 h-5" />
                      <span>
                        Confirmar Recepción de Mercancía ({totalBuenas} en buen estado
                        {totalDanadas > 0 ? `, ${totalDanadas} dañadas` : ''}
                        {totalFaltantes > 0 ? `, ${totalFaltantes} faltantes` : ''})
                      </span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Mercancía recibida e incorporada al inventario de la tienda.</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PosTrasladosPage;
