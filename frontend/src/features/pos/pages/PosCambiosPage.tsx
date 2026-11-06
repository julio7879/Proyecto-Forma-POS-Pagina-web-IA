import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Banknote,
  Printer,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import {
  applyStockDelta,
  recordPosExchange,
} from '../utils/posLedgerSync';

interface PrendaComprada {
  id: string;
  nombre: string;
  sku: string;
  talla: string;
  color: string;
  categoria: string;
  imagenUrl: string;
  cantidadComprada: number;
  precioNetoPagadoCop: number;
}

interface FacturaVentaPOS {
  consecutivo: string;
  fechaBogota: string;
  clienteNombre: string;
  clienteDocumento: string;
  sede: string;
  prendas: PrendaComprada[];
}

interface PrendaInventarioDisponible {
  sku: string;
  nombre: string;
  talla: string;
  color: string;
  precioVentaCop: number;
  stockDisponible: number;
  imagenUrl: string;
}

interface RegistroCambioRealizado {
  id: string;
  consecutivoFactura: string;
  fecha: string;
  cliente: string;
  prendaDevuelta: string;
  prendaEntregada: string;
  motivo: string;
  diferenciaCop: number;
  tipoLiquidacion: 'MANO_A_MANO_0' | 'EXCEDENTE_COBRADO' | 'REINTEGRO_A_FAVOR';
  medioPagoExcedente?: string;
  observaciones: string;
}

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

const FACTURAS_REGISTRADAS: Record<string, FacturaVentaPOS> = {
  'MED-0041': {
    consecutivo: '#MED-0041',
    fechaBogota: 'Hace 3 días · 02:20 p. m.',
    clienteNombre: 'Valentina Restrepo',
    clienteDocumento: 'CC 1.090.482.910',
    sede: 'Punto Centro — Cúcuta',
    prendas: [
      {
        id: 'lin-41-1',
        nombre: 'Chaqueta Denim Artesanal',
        sku: 'ROP-DNM-001-M',
        talla: 'M',
        color: 'Azul Índigo',
        categoria: 'Ropa',
        imagenUrl:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
        cantidadComprada: 1,
        precioNetoPagadoCop: 189000,
      },
      {
        id: 'lin-41-2',
        nombre: 'Camiseta Básica Algodón Pima',
        sku: 'ROP-CAM-002-S',
        talla: 'S',
        color: 'Blanco Hueso',
        categoria: 'Ropa',
        imagenUrl:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        cantidadComprada: 1,
        precioNetoPagadoCop: 59900,
      },
    ],
  },
  'MED-0042': {
    consecutivo: '#MED-0042',
    fechaBogota: 'Hoy · 10:15 a. m.',
    clienteNombre: 'Andrés Felipe Calderón',
    clienteDocumento: 'CC 88.241.503',
    sede: 'Punto Centro — Cúcuta',
    prendas: [
      {
        id: 'lin-42-1',
        nombre: 'Bolso Cuero Graso Unisex',
        sku: 'ACC-BOL-003-UNI',
        talla: 'Única',
        color: 'Miel Natural',
        categoria: 'Accesorios',
        imagenUrl:
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
        cantidadComprada: 1,
        precioNetoPagadoCop: 249000,
      },
      {
        id: 'lin-42-2',
        nombre: 'Crema Hidratante Botánica 100ml',
        sku: 'COS-CRM-004-100ML',
        talla: '100ml',
        color: 'Natural',
        categoria: 'Cosméticos',
        imagenUrl:
          'https://images.unsplash.com/photo-1608248597359-5633454b5683?auto=format&fit=crop&w=600&q=80',
        cantidadComprada: 1,
        precioNetoPagadoCop: 45000,
      },
    ],
  },
  'MED-0040': {
    consecutivo: '#MED-0040',
    fechaBogota: 'Ayer · 01:20 p. m.',
    clienteNombre: 'Julián Camilo Peña',
    clienteDocumento: 'CC 1.094.221.098',
    sede: 'Punto Centro — Cúcuta',
    prendas: [
      {
        id: 'lin-40-1',
        nombre: 'Botines Chelsea Cuero Vélez',
        sku: 'CAL-BOT-006-39',
        talla: '39',
        color: 'Tabaco Envejecido',
        categoria: 'Calzado',
        imagenUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        cantidadComprada: 1,
        precioNetoPagadoCop: 265000,
      },
    ],
  },
};

const INVENTARIO_TIENDA_DISPONIBLE: PrendaInventarioDisponible[] = [
  {
    sku: 'ROP-DNM-001-L',
    nombre: 'Chaqueta Denim Artesanal',
    talla: 'L',
    color: 'Azul Índigo',
    precioVentaCop: 189000,
    stockDisponible: 5,
    imagenUrl:
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'ROP-DNM-001-S',
    nombre: 'Chaqueta Denim Artesanal',
    talla: 'S',
    color: 'Azul Índigo',
    precioVentaCop: 189000,
    stockDisponible: 4,
    imagenUrl:
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'ROP-DNM-001-M-NEG',
    nombre: 'Chaqueta Denim Artesanal',
    talla: 'M',
    color: 'Negro Carbón',
    precioVentaCop: 189000,
    stockDisponible: 3,
    imagenUrl:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'ROP-CAM-002-M',
    nombre: 'Camiseta Básica Algodón Pima',
    talla: 'M',
    color: 'Blanco Hueso',
    precioVentaCop: 59900,
    stockDisponible: 12,
    imagenUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'ROP-CAM-002-L',
    nombre: 'Camiseta Básica Algodón Pima',
    talla: 'L',
    color: 'Negro',
    precioVentaCop: 59900,
    stockDisponible: 8,
    imagenUrl:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'ACC-BOL-003-UNI',
    nombre: 'Bolso Cuero Graso Unisex',
    talla: 'Única',
    color: 'Miel Natural',
    precioVentaCop: 249000,
    stockDisponible: 6,
    imagenUrl:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'CAL-BOT-006-40',
    nombre: 'Botines Chelsea Cuero Vélez',
    talla: '40',
    color: 'Tabaco Envejecido',
    precioVentaCop: 265000,
    stockDisponible: 4,
    imagenUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'ART-MOC-005-STD',
    nombre: 'Mochila Tejeduría Ancestral',
    talla: 'Estándar',
    color: 'Tierra / Crudo',
    precioVentaCop: 135000,
    stockDisponible: 5,
    imagenUrl:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
  },
];

export const PosCambiosPage: React.FC = () => {
  // Paso 1: Búsqueda de factura
  const [busquedaFactura, setBusquedaFactura] = useState<string>('MED-0041');
  const [facturaSeleccionadaKey, setFacturaSeleccionadaKey] = useState<string>('MED-0041');

  // Paso 2: Prenda a devolver y motivo
  const [prendaDevolver, setPrendaDevolver] = useState<PrendaComprada | null>(
    FACTURAS_REGISTRADAS['MED-0041'].prendas[0]
  );
  const [motivoCambio, setMotivoCambio] = useState<string>('Cambio de talla');
  const [estadoPrendaDevuelta, setEstadoPrendaDevuelta] = useState<'BUEN_ESTADO' | 'CON_IMPERFECTO'>(
    'BUEN_ESTADO'
  );

  // Paso 3: Nueva prenda seleccionada del inventario local
  const [nuevaPrenda, setNuevaPrenda] = useState<PrendaInventarioDisponible | null>(
    INVENTARIO_TIENDA_DISPONIBLE[0] // Chaqueta Denim Talla L ($189.000) -> Diferencia $0
  );
  const [busquedaInventario, setBusquedaInventario] = useState<string>('');

  // Paso 4: Liquidación y confirmación
  const [medioCobroExcedente, setMedioCobroExcedente] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [observacionCambio, setObservacionCambio] = useState<string>(
    'Cliente solicita cambio por talla L para mejor horma.'
  );

  // Historial de cambios realizados hoy
  const [cambiosRealizados, setCambiosRealizados] = useState<RegistroCambioRealizado[]>([]);
  const [modalExito, setModalExito] = useState<RegistroCambioRealizado | null>(null);

  const facturaActual =
    FACTURAS_REGISTRADAS[facturaSeleccionadaKey] || FACTURAS_REGISTRADAS['MED-0041'];

  // Cargar factura por consecutivo
  const handleBuscarFactura = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = busquedaFactura.replace('#', '').trim().toUpperCase();
    if (FACTURAS_REGISTRADAS[clean]) {
      setFacturaSeleccionadaKey(clean);
      setPrendaDevolver(FACTURAS_REGISTRADAS[clean].prendas[0] || null);
    } else {
      setFacturaSeleccionadaKey('MED-0041');
      setPrendaDevolver(FACTURAS_REGISTRADAS['MED-0041'].prendas[0] || null);
    }
  };

  const handleSeleccionarFacturaRapida = (key: string) => {
    setBusquedaFactura(key);
    setFacturaSeleccionadaKey(key);
    const fact = FACTURAS_REGISTRADAS[key];
    if (fact && fact.prendas.length > 0) {
      setPrendaDevolver(fact.prendas[0]);
    } else {
      setPrendaDevolver(null);
    }
  };

  // Filtrado de prendas disponibles en inventario de tienda
  const prendasInventarioFiltradas = useMemo(() => {
    const q = busquedaInventario.trim().toLowerCase();
    if (!q) return INVENTARIO_TIENDA_DISPONIBLE;
    return INVENTARIO_TIENDA_DISPONIBLE.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.talla.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q)
    );
  }, [busquedaInventario]);

  // Liquidación automática en COP enteros
  const valorPrendaDevueltaCop = prendaDevolver ? prendaDevolver.precioNetoPagadoCop : 0;
  const valorNuevaPrendaCop = nuevaPrenda ? nuevaPrenda.precioVentaCop : 0;
  const diferenciaCop = valorNuevaPrendaCop - valorPrendaDevueltaCop;

  // Clasificación de la liquidación
  const esManoAManoCero = diferenciaCop === 0;
  const esExcedenteCliente = diferenciaCop > 0;
  const esReintegroCliente = diferenciaCop < 0;

  // Validación sanitaria RN-CAT-02: Cosméticos solo se cambian por imperfecto
  const esCosmeticoBloqueado =
    prendaDevolver?.categoria === 'Cosméticos' &&
    motivoCambio !== 'Prenda con imperfecto';

  // Confirmar y registrar el cambio
  const handleConfirmarCambio = () => {
    if (!prendaDevolver || !nuevaPrenda || esCosmeticoBloqueado) return;

    // 1. Impacto real en stock: prenda entregada -1
    applyStockDelta(nuevaPrenda.sku, -1);

    // 2. Impacto real en stock devuelto: si está buena y no es cosmético, reingresa a vendible +1
    let impactoKardex = `Entregada: -1 ud (${nuevaPrenda.sku})`;
    if (estadoPrendaDevuelta === 'BUEN_ESTADO' && prendaDevolver.categoria !== 'Cosméticos') {
      applyStockDelta(prendaDevolver.sku, 1);
      impactoKardex += ` | Devuelta: +1 ud Reingreso Vendible (${prendaDevolver.sku})`;
    } else {
      impactoKardex += ` | Devuelta: Apartada a Averías No Vendible (${prendaDevolver.sku})`;
    }

    const nuevoCambio: RegistroCambioRealizado = {
      id: `CAM-${Date.now().toString().slice(-4)}`,
      consecutivoFactura: facturaActual.consecutivo,
      fecha: 'Hoy · Recién procesado',
      cliente: facturaActual.clienteNombre,
      prendaDevuelta: `${prendaDevolver.nombre} (Talla ${prendaDevolver.talla}, ${prendaDevolver.color})`,
      prendaEntregada: `${nuevaPrenda.nombre} (Talla ${nuevaPrenda.talla}, ${nuevaPrenda.color})`,
      motivo: motivoCambio,
      diferenciaCop: Math.abs(diferenciaCop),
      tipoLiquidacion: esManoAManoCero
        ? 'MANO_A_MANO_0'
        : esExcedenteCliente
        ? 'EXCEDENTE_COBRADO'
        : 'REINTEGRO_A_FAVOR',
      medioPagoExcedente: esExcedenteCliente ? medioCobroExcedente : undefined,
      observaciones: observacionCambio || 'Cambio registrado en mostrador.',
    };

    recordPosExchange({
      id: nuevoCambio.id,
      consecutivoFactura: facturaActual.consecutivo,
      fecha: nuevoCambio.fecha,
      cliente: facturaActual.clienteNombre,
      prendaDevuelta: nuevoCambio.prendaDevuelta,
      prendaDevueltaSku: prendaDevolver.sku,
      prendaEntregada: nuevoCambio.prendaEntregada,
      prendaEntregadaSku: nuevaPrenda.sku,
      motivo: motivoCambio,
      diferenciaCop: nuevoCambio.diferenciaCop,
      tipoLiquidacion: nuevoCambio.tipoLiquidacion,
      medioPagoExcedente: nuevoCambio.medioPagoExcedente,
      observaciones: nuevoCambio.observaciones,
      impactoKardex,
    });

    setCambiosRealizados((prev) => [nuevoCambio, ...prev]);
    setModalExito(nuevoCambio);
  };

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-2.5 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA EDITORIAL: CAMBIO MANO A MANO EN TIENDA FÍSICA
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EFEAE4]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              <RotateCcw className="w-6 h-6 text-[#D19650]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-xs font-black uppercase">
                  Mostrador POS
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-xs font-extrabold">
                  Cambio Mano a Mano
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-1">
                Registro de Cambios de Prendas
              </h1>
            </div>
          </div>

          <div className="text-xs text-stone-600 bg-[#FAF7F4] px-3.5 py-2 rounded-xl border border-[#E5DDD3]">
            Sede: <strong>Punto Centro (Cúcuta)</strong>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 mt-2">
          Realiza cambios directos de talla o color por <strong>$0 COP</strong>, o calcula automáticamente el excedente a pagar si el cliente elige una prenda de mayor valor.
        </p>
      </header>

      {/* =========================================================================
          FLUJO DE 3 PASOS EN GRID
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =======================================================================
            PASO 1 Y PASO 2 (5 COLUMNAS): FACTURA Y PRENDA A DEVOLVER
        ======================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* PASO 1: Búsqueda de Factura Original */}
          <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Buscar Factura de Venta Original
                </h2>
              </div>
            </div>

            <form onSubmit={handleBuscarFactura} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaFactura}
                    onChange={(e) => setBusquedaFactura(e.target.value)}
                    placeholder="Ej. MED-0041, MED-0042..."
                    className="w-full min-h-[46px] pl-9 pr-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] font-mono text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[46px] px-4 rounded-xl bg-[#1C1311] text-[#D19650] font-bold text-xs hover:bg-stone-800"
                >
                  Buscar
                </button>
              </div>

              {/* Botones de selección rápida */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-stone-500">Facturas recientes:</span>
                {Object.keys(FACTURAS_REGISTRADAS).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleSeleccionarFacturaRapida(k)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all ${
                      facturaSeleccionadaKey === k
                        ? 'bg-[#661521] text-white border-[#661521]'
                        : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6] hover:bg-stone-200'
                    }`}
                  >
                    #{k}
                  </button>
                ))}
              </div>
            </form>

            {/* Datos de la factura activa */}
            <div className="bg-[#FAF7F4] p-3 rounded-xl border border-[#E5DDD3] text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-mono font-black text-sm text-[#1C1311]">
                  Factura {facturaActual.consecutivo}
                </span>
                <span className="text-stone-500">{facturaActual.fechaBogota}</span>
              </div>
              <p className="font-bold text-stone-800">
                Cliente: {facturaActual.clienteNombre} ({facturaActual.clienteDocumento})
              </p>
            </div>
          </section>

          {/* PASO 2: Selección de Prenda a Devolver */}
          <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Prenda que Devuelve el Cliente
                </h2>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              Selecciona la prenda comprada que el cliente entrega en mostrador:
            </p>

            <div className="space-y-2">
              {facturaActual.prendas.map((prenda) => {
                const isSelected = prendaDevolver?.id === prenda.id;
                return (
                  <div
                    key={prenda.id}
                    onClick={() => setPrendaDevolver(prenda)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#661521]/10 border-[#661521] shadow-sm'
                        : 'bg-[#FAF7F4] border-[#E5DDD3] hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prenda.imagenUrl}
                        alt={prenda.nombre}
                        className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#1C1311] truncate">
                          {prenda.nombre}
                        </h3>
                        <p className="font-mono text-xs text-stone-600">
                          Talla: {prenda.talla} · Color: {prenda.color} · SKU: {prenda.sku}
                        </p>
                        <span className="font-mono text-xs font-black text-[#059669]">
                          Valor Pagado: {formatCOP(prenda.precioNetoPagadoCop)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#661521] border-[#661521] text-white'
                            : 'border-stone-400'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Motivo del Cambio */}
            <div className="pt-2 border-t border-[#EFEAE4] space-y-2">
              <label className="block text-xs font-bold uppercase text-stone-600">
                Motivo del Cambio:
              </label>
              <select
                value={motivoCambio}
                onChange={(e) => setMotivoCambio(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
              >
                <option value="Cambio de talla">Cambio de talla (Misma prenda otra talla)</option>
                <option value="Cambio de color">Cambio de color (Misma prenda otro tono)</option>
                <option value="Prenda con imperfecto">Prenda con imperfecto / avería de fábrica</option>
                <option value="Cambio por otro modelo">Cambio por otro modelo de prenda</option>
              </select>

              {/* Destino de la Prenda Devuelta */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEstadoPrendaDevuelta('BUEN_ESTADO')}
                  className={`p-2.5 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                    estadoPrendaDevuelta === 'BUEN_ESTADO'
                      ? 'bg-emerald-50 text-[#059669] border-[#059669]'
                      : 'bg-white text-stone-600 border-[#D8CFC6]'
                  }`}
                >
                  <span className="block font-black">Prenda en Buen Estado</span>
                  <span className="block text-[10px] text-stone-500">Reingresa a venta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEstadoPrendaDevuelta('CON_IMPERFECTO')}
                  className={`p-2.5 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                    estadoPrendaDevuelta === 'CON_IMPERFECTO'
                      ? 'bg-red-50 text-[#661521] border-[#661521]'
                      : 'bg-white text-stone-600 border-[#D8CFC6]'
                  }`}
                >
                  <span className="block font-black">Con Imperfecto</span>
                  <span className="block text-[10px] text-stone-500">Apartar a averías</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* =======================================================================
            PASO 3 Y PASO 4 (7 COLUMNAS): NUEVA PRENDA Y LIQUIDACIÓN
        ======================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* PASO 3: Selección de Nueva Prenda del Inventario */}
          <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Nueva Prenda a Entregar al Cliente
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-semibold">
                Inventario disponible en Punto Centro
              </span>
            </div>

            {/* Buscador de inventario */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={busquedaInventario}
                onChange={(e) => setBusquedaInventario(e.target.value)}
                placeholder="Buscar prenda del inventario (talla, color, nombre, SKU)..."
                className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-semibold text-[#1C1311] placeholder:text-stone-400 focus:outline-none focus:border-[#661521]"
              />
            </div>

            {/* Grilla de prendas disponibles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
              {prendasInventarioFiltradas.map((item) => {
                const isSelected = nuevaPrenda?.sku === item.sku;
                return (
                  <div
                    key={item.sku}
                    onClick={() => setNuevaPrenda(item)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#1C1311] text-white border-[#D19650] shadow-md'
                        : 'bg-[#FAF7F4] text-[#1C1311] border-[#E5DDD3] hover:border-stone-400'
                    }`}
                  >
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs font-black truncate ${
                          isSelected ? 'text-white' : 'text-[#1C1311]'
                        }`}
                      >
                        {item.nombre}
                      </h4>
                      <p
                        className={`text-[11px] font-mono mt-0.5 ${
                          isSelected ? 'text-[#E7DED2]' : 'text-stone-600'
                        }`}
                      >
                        Talla: <strong>{item.talla}</strong> · Color: {item.color}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`font-mono text-xs font-black ${
                            isSelected ? 'text-[#D19650]' : 'text-[#059669]'
                          }`}
                        >
                          {formatCOP(item.precioVentaCop)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-[#661521] text-white' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          Stock: {item.stockDisponible}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* PASO 4: Liquidación Automática Mano a Mano */}
          <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                  4
                </span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Liquidación Automática del Cambio
                </h2>
              </div>
              <Sparkles className="w-4 h-4 text-[#D19650]" />
            </div>

            {/* Comparativa Prenda Devuelta vs Prenda Entregada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF7F4] p-3.5 rounded-xl border border-[#E5DDD3] text-xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-stone-500 block">
                  Valor Prenda Devuelta (Factura)
                </span>
                <p className="font-mono text-base font-black text-[#1C1311] mt-0.5">
                  {formatCOP(valorPrendaDevueltaCop)} COP
                </p>
                <p className="text-[11px] text-stone-600 truncate">
                  {prendaDevolver ? `${prendaDevolver.nombre} (${prendaDevolver.talla})` : 'Sin seleccionar'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase text-stone-500 block">
                  Valor Nueva Prenda
                </span>
                <p className="font-mono text-base font-black text-[#1C1311] mt-0.5">
                  {formatCOP(valorNuevaPrendaCop)} COP
                </p>
                <p className="text-[11px] text-stone-600 truncate">
                  {nuevaPrenda ? `${nuevaPrenda.nombre} (${nuevaPrenda.talla})` : 'Sin seleccionar'}
                </p>
              </div>
            </div>

            {/* Caja de Resultado de la Liquidación */}
            <div
              className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                esManoAManoCero
                  ? 'bg-emerald-50 border-[#059669] text-[#059669]'
                  : esExcedenteCliente
                  ? 'bg-amber-50 border-[#D19650] text-amber-950'
                  : 'bg-sky-50 border-sky-400 text-sky-950'
              }`}
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  {esManoAManoCero && 'Caso A: Cambio Mano a Mano Exacto'}
                  {esExcedenteCliente && 'Caso B: Prenda de Mayor Valor'}
                  {esReintegroCliente && 'Caso C: Prenda de Menor Valor'}
                </span>
                <p className="text-xs font-medium mt-0.5">
                  {esManoAManoCero && 'Misma prenda o mismo valor. Diferencia: $0 COP.'}
                  {esExcedenteCliente &&
                    'El cliente debe cancelar el excedente para completar el cambio.'}
                  {esReintegroCliente &&
                    'Saldo a favor a reintegrar al cliente en mostrador.'}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs uppercase font-extrabold block">
                  {esManoAManoCero
                    ? 'Total a Pagar'
                    : esExcedenteCliente
                    ? 'Excedente a Cobrar'
                    : 'Diferencia a Reintegrar'}
                </span>
                <span className="font-mono text-2xl font-black tabular-nums">
                  {formatCOP(Math.abs(diferenciaCop))} COP
                </span>
              </div>
            </div>

            {/* Medio de cobro si hay excedente */}
            {esExcedenteCliente && (
              <div className="bg-[#FAF7F4] p-3 rounded-xl border border-[#D8CFC6] space-y-2">
                <label className="block text-xs font-bold uppercase text-stone-700">
                  Medio de Cobro del Excedente ({formatCOP(diferenciaCop)}):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMedioCobroExcedente('EFECTIVO')}
                    className={`min-h-[44px] px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                      medioCobroExcedente === 'EFECTIVO'
                        ? 'bg-[#059669] text-white border-[#059669]'
                        : 'bg-white text-stone-700 border-[#D8CFC6]'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Efectivo en Caja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMedioCobroExcedente('TRANSFERENCIA')}
                    className={`min-h-[44px] px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                      medioCobroExcedente === 'TRANSFERENCIA'
                        ? 'bg-[#661521] text-white border-[#661521]'
                        : 'bg-white text-stone-700 border-[#D8CFC6]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Transferencia QR</span>
                  </button>
                </div>
              </div>
            )}

            {/* Campo de Observaciones */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Observación del Cambio:
              </label>
              <input
                type="text"
                value={observacionCambio}
                onChange={(e) => setObservacionCambio(e.target.value)}
                placeholder="Ej. Cambio de talla solicitado por el cliente..."
                className="w-full min-h-[46px] px-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
              />
            </div>

            {/* Alerta Sanitaria RN-CAT-02 si el cosmético no tiene imperfecto */}
            {esCosmeticoBloqueado && (
              <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black uppercase text-amber-950">Restricción Sanitaria (RN-CAT-02):</span>
                  <span>Por razones de higiene y salubridad pública, los cosméticos de uso personal no admiten cambio por talla, tono o gusto personal. Únicamente procede cambio por avería o imperfecto de fábrica.</span>
                </div>
              </div>
            )}

            {/* Botón Confirmar Cambio */}
            <button
              type="button"
              disabled={!prendaDevolver || !nuevaPrenda || esCosmeticoBloqueado}
              onClick={handleConfirmarCambio}
              className="w-full min-h-[58px] px-6 rounded-2xl bg-[#661521] hover:bg-[#52101a] active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-40"
            >
              <FileCheck2 className="w-5 h-5 text-[#D19650]" />
              <span>Confirmar y Registrar Cambio Mano a Mano</span>
            </button>
          </section>
        </div>
      </div>

      {/* =========================================================================
          HISTORIAL DE CAMBIOS REALIZADOS HOY
      ========================================================================= */}
      {cambiosRealizados.length > 0 && (
        <section className="mt-6 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5">
          <h3 className="text-base font-black text-[#1C1311] mb-3">
            Cambios Registrados en Este Turno ({cambiosRealizados.length})
          </h3>

          <div className="space-y-2.5">
            {cambiosRealizados.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#1C1311]">
                      {c.consecutivoFactura}
                    </span>
                    <span className="text-stone-500">· {c.cliente}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#059669] font-bold text-[10px]">
                      {c.tipoLiquidacion === 'MANO_A_MANO_0'
                        ? 'MANO A MANO $0'
                        : c.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                        ? `EXCEDENTE +${formatCOP(c.diferenciaCop)}`
                        : `REINTEGRO -${formatCOP(c.diferenciaCop)}`}
                    </span>
                  </div>
                  <p className="text-stone-700 mt-1">
                    Devuelve: <strong>{c.prendaDevuelta}</strong> → Lleva:{' '}
                    <strong>{c.prendaEntregada}</strong>
                  </p>
                  <p className="text-stone-500 text-[11px] mt-0.5">Motivo: {c.motivo}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-black text-[#1C1311]">
                    {c.tipoLiquidacion === 'MANO_A_MANO_0' ? '$0 COP' : `${formatCOP(c.diferenciaCop)} COP`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          MODAL DE ÉXITO TRAS REGISTRAR CAMBIO
      ========================================================================= */}
      {modalExito && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#D19650] shadow-2xl w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1 pb-3 border-b border-[#EFEAE4]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#059669] mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#1C1311]">
                ¡Cambio Mano a Mano Registrado con Éxito!
              </h3>
              <p className="text-xs text-stone-600">
                Factura Origen: <strong className="font-mono text-[#661521]">{modalExito.consecutivoFactura}</strong>
              </p>
            </div>

            {/* Resumen del Cambio */}
            <div className="bg-[#FAF7F4] p-4 rounded-2xl border border-[#E5DDD3] space-y-2.5 text-xs">
              <div>
                <span className="text-stone-500 block uppercase text-[10px] font-bold">Cliente</span>
                <span className="font-black text-sm text-[#1C1311]">{modalExito.cliente}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5DDD3]">
                <div>
                  <span className="text-stone-500 block text-[10px] font-bold uppercase">Prenda Recibida</span>
                  <span className="font-bold text-[#661521]">{modalExito.prendaDevuelta}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] font-bold uppercase">Prenda Entregada</span>
                  <span className="font-bold text-[#059669]">{modalExito.prendaEntregada}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5DDD3] flex justify-between items-center">
                <span className="font-bold text-stone-700">Liquidación:</span>
                <span className="font-mono font-black text-base text-[#1C1311]">
                  {modalExito.tipoLiquidacion === 'MANO_A_MANO_0'
                    ? '$0 COP (Cambio Directo)'
                    : modalExito.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                    ? `Excedente Cobrado: ${formatCOP(modalExito.diferenciaCop)}`
                    : `Reintegro al Cliente: ${formatCOP(modalExito.diferenciaCop)}`}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-[48px] px-4 rounded-xl bg-[#1C1311] text-[#D19650] font-black text-xs flex items-center justify-center gap-2 hover:bg-stone-800"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante de Cambio</span>
              </button>

              <button
                type="button"
                onClick={() => setModalExito(null)}
                className="min-h-[48px] px-5 rounded-xl bg-[#661521] text-white font-black text-xs hover:bg-[#52101a]"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosCambiosPage;
