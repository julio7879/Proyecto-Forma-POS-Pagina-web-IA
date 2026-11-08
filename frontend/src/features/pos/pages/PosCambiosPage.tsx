import React, { useState, useMemo, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  CreditCard,
  Banknote,
  Printer,
  FileCheck2,
  AlertCircle,
  Eye,
  ShieldAlert,
  History,
  ArrowRight,
  Package,
  MapPin,
} from 'lucide-react';
import {
  applyStockDelta,
  getStockDelta,
  recordPosExchange,
  getPosRegisteredExchanges,
  getPosRegisteredSales,
  type PosSaleRecord,
} from '../utils/posLedgerSync';
import { CATALOGO_INICIAL_POS } from '../PosTerminalPage';
import { getSesionAbierta } from '../utils/cajaStore';
import { DetailDrawer, type ActivityTimelineItem } from '../components/DetailDrawer';

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
  consecutivoLimpio: string;
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
  categoria: string;
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
  prendaDevueltaSku?: string;
  prendaEntregada: string;
  prendaEntregadaSku?: string;
  motivo: string;
  diferenciaCop: number;
  tipoLiquidacion: 'MANO_A_MANO_0' | 'EXCEDENTE_COBRADO' | 'REINTEGRO_A_FAVOR';
  medioPagoExcedente?: string;
  observaciones: string;
  impactoKardex?: string;
  prendaDevueltaImg?: string;
  prendaEntregadaImg?: string;
  estadoPrendaDevuelta?: 'BUEN_ESTADO' | 'CON_IMPERFECTO';
  valorDevueltoCop?: number;
  valorEntregadoCop?: number;
}

type SubcategoriaCambios = 'NUEVO_CAMBIO' | 'DEVOLUCION_IMPERFECTO' | 'HISTORIAL';
type FiltroHistorial = 'TODOS' | 'MANO_A_MANO_0' | 'CON_EXCEDENTE' | 'POR_IMPERFECTO';

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

const buildInventarioReal = (): PrendaInventarioDisponible[] => {
  return CATALOGO_INICIAL_POS.map((v) => ({
    sku: v.sku,
    nombre: v.nombre,
    talla: v.talla,
    color: v.color,
    categoria: v.categoria,
    precioVentaCop: v.precioUnitarioCOP,
    stockDisponible: Math.max(0, v.stockSede + getStockDelta(v.sku)),
    imagenUrl: v.imagenUrl,
  }));
};

const mapSaleToFactura = (s: PosSaleRecord, sedeFallback: string): FacturaVentaPOS => {
  const cleanKey = s.consecutivo.replace('#', '').trim().toUpperCase();
  const rawItems = s.prendas || s.items || [];
  const prendas: PrendaComprada[] = rawItems.map((it, idx) => {
    const refCatalogo = CATALOGO_INICIAL_POS.find(
      (c) => c.sku.toUpperCase() === (it.sku || '').toUpperCase()
    );
    const unitCop =
      it.precioUnitarioCop ??
      it.precioUnitarioCOP ??
      (it.cantidad > 0 ? Math.floor(it.totalCop / it.cantidad) : it.totalCop) ??
      refCatalogo?.precioUnitarioCOP ??
      0;

    return {
      id: `sale-item-${cleanKey}-${idx}`,
      nombre: it.nombre || refCatalogo?.nombre || 'Prenda FORMA',
      sku: it.sku || refCatalogo?.sku || 'SKU-POS',
      talla: it.talla || refCatalogo?.talla || 'Única',
      color: it.color || refCatalogo?.color || 'Estándar',
      categoria: it.categoria || refCatalogo?.categoria || 'Ropa',
      imagenUrl:
        it.imagenUrl ||
        refCatalogo?.imagenUrl ||
        '/products/blazer-imperial-vinotinto.png',
      cantidadComprada: Math.max(1, it.cantidad || 1),
      precioNetoPagadoCop: Math.trunc(unitCop),
    };
  });

  return {
    consecutivo: s.consecutivo.startsWith('#') ? s.consecutivo : `#${s.consecutivo}`,
    consecutivoLimpio: cleanKey,
    fechaBogota: s.fechaHora || 'Hoy · Turno Actual',
    clienteNombre: s.cliente || 'Consumidor Final',
    clienteDocumento: s.documentoCliente || 'CC Consumidor Final',
    sede: s.sede || sedeFallback,
    prendas,
  };
};

export const PosCambiosPage: React.FC = () => {
  const sedeActiva = localStorage.getItem('forma_pos_sede') || 'Punto Centro (Cúcuta)';

  // Subcategorías Superiores
  const [subcategoriaActiva, setSubcategoriaActiva] =
    useState<SubcategoriaCambios>('NUEVO_CAMBIO');
  const [pasoWizardActivo, setPasoWizardActivo] = useState<1 | 2 | 3>(1);

  // 1. Inventario reactivo real de la sede (CATALOGO_INICIAL_POS + getStockDelta)
  const [inventarioTienda, setInventarioTienda] = useState<PrendaInventarioDisponible[]>(() =>
    buildInventarioReal()
  );

  // 2. Ventas reales registradas en POS (100% getPosRegisteredSales)
  const [ventasRegistradas, setVentasRegistradas] = useState<PosSaleRecord[]>(() =>
    getPosRegisteredSales()
  );

  // 3. Historial real de cambios (100% getPosRegisteredExchanges)
  const [cambiosRealizados, setCambiosRealizados] = useState<RegistroCambioRealizado[]>(() =>
    getPosRegisteredExchanges() as RegistroCambioRealizado[]
  );

  // Sincronización reactiva con posLedgerSync y localStorage
  useEffect(() => {
    const syncAll = () => {
      setInventarioTienda(buildInventarioReal());
      setVentasRegistradas(getPosRegisteredSales());
      setCambiosRealizados(getPosRegisteredExchanges() as RegistroCambioRealizado[]);
    };
    window.addEventListener('forma-pos-ledger-update', syncAll);
    window.addEventListener('storage', syncAll);
    return () => {
      window.removeEventListener('forma-pos-ledger-update', syncAll);
      window.removeEventListener('storage', syncAll);
    };
  }, []);

  // Construir diccionario y lista de facturas reales priorizando la sede activa
  const { facturasDisponibles, facturasOrdenadas } = useMemo(() => {
    const dict: Record<string, FacturaVentaPOS> = {};
    const lista: FacturaVentaPOS[] = [];

    const normSede = (str?: string) =>
      (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const sedeNorm = normSede(sedeActiva);

    const ordenadas = [...ventasRegistradas].sort((a, b) => {
      const aMatch = normSede(a.sede).includes(sedeNorm) || sedeNorm.includes(normSede(a.sede));
      const bMatch = normSede(b.sede).includes(sedeNorm) || sedeNorm.includes(normSede(b.sede));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    ordenadas.forEach((s) => {
      const f = mapSaleToFactura(s, sedeActiva);
      if (!dict[f.consecutivoLimpio]) {
        dict[f.consecutivoLimpio] = f;
        lista.push(f);
      }
    });

    return { facturasDisponibles: dict, facturasOrdenadas: lista };
  }, [ventasRegistradas, sedeActiva]);

  // Paso 1: Búsqueda y selección de factura real
  const [busquedaFactura, setBusquedaFactura] = useState<string>(
    () => facturasOrdenadas[0]?.consecutivoLimpio || ''
  );
  const [facturaSeleccionadaKey, setFacturaSeleccionadaKey] = useState<string>(
    () => facturasOrdenadas[0]?.consecutivoLimpio || ''
  );
  const [mensajeBusquedaFactura, setMensajeBusquedaFactura] = useState<string | null>(null);

  const facturaActual: FacturaVentaPOS | null = useMemo(() => {
    if (facturaSeleccionadaKey && facturasDisponibles[facturaSeleccionadaKey]) {
      return facturasDisponibles[facturaSeleccionadaKey];
    }
    return facturasOrdenadas[0] || null;
  }, [facturaSeleccionadaKey, facturasDisponibles, facturasOrdenadas]);

  // Prenda a devolver y motivo
  const [prendaDevolverId, setPrendaDevolverId] = useState<string | null>(null);
  const prendaDevolver: PrendaComprada | null = useMemo(() => {
    if (!facturaActual || facturaActual.prendas.length === 0) return null;
    if (prendaDevolverId) {
      const found = facturaActual.prendas.find((p) => p.id === prendaDevolverId);
      if (found) return found;
    }
    return facturaActual.prendas[0];
  }, [facturaActual, prendaDevolverId]);

  const [motivoCambio, setMotivoCambio] = useState<string>('Cambio de talla');
  const [estadoPrendaDevuelta, setEstadoPrendaDevuelta] = useState<'BUEN_ESTADO' | 'CON_IMPERFECTO'>(
    'BUEN_ESTADO'
  );

  // Paso 2: Nueva prenda seleccionada del inventario real
  const [nuevaPrendaSku, setNuevaPrendaSku] = useState<string>(() => inventarioTienda[0]?.sku || '');
  const nuevaPrenda: PrendaInventarioDisponible | null = useMemo(() => {
    if (nuevaPrendaSku) {
      const found = inventarioTienda.find((p) => p.sku === nuevaPrendaSku);
      if (found) return found;
    }
    return inventarioTienda.find((p) => p.stockDisponible > 0) || inventarioTienda[0] || null;
  }, [inventarioTienda, nuevaPrendaSku]);

  const [busquedaInventario, setBusquedaInventario] = useState<string>('');

  // Paso 3: Liquidación y confirmación
  const [medioCobroExcedente, setMedioCobroExcedente] = useState<'EFECTIVO' | 'TRANSFERENCIA'>(
    'EFECTIVO'
  );
  const [observacionCambio, setObservacionCambio] = useState<string>('');
  const [modalExito, setModalExito] = useState<RegistroCambioRealizado | null>(null);

  // Filtros y búsqueda de Subcategoría 3 (Historial)
  const [busquedaHistorial, setBusquedaHistorial] = useState<string>('');
  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorial>('TODOS');
  const [cambioSeleccionadoDrawer, setCambioSeleccionadoDrawer] =
    useState<RegistroCambioRealizado | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'actividad'>('detalle');

  // Cambiar de subcategoría ajustando automáticamente estado si es Devolución por Imperfecto
  const handleCambiarSubcategoria = (sub: SubcategoriaCambios) => {
    setSubcategoriaActiva(sub);
    if (sub === 'DEVOLUCION_IMPERFECTO') {
      setMotivoCambio('Prenda con imperfecto');
      setEstadoPrendaDevuelta('CON_IMPERFECTO');
    } else if (sub === 'NUEVO_CAMBIO' && motivoCambio === 'Prenda con imperfecto') {
      setMotivoCambio('Cambio de talla');
      setEstadoPrendaDevuelta('BUEN_ESTADO');
    }
  };

  // Cargar factura por consecutivo
  const handleBuscarFactura = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeBusquedaFactura(null);
    const clean = busquedaFactura.replace('#', '').trim().toUpperCase();
    if (!clean) return;

    if (facturasDisponibles[clean]) {
      setFacturaSeleccionadaKey(clean);
      setPrendaDevolverId(facturasDisponibles[clean].prendas[0]?.id || null);
      setPasoWizardActivo(1);
    } else {
      const parcial = facturasOrdenadas.find(
        (f) =>
          f.consecutivoLimpio.includes(clean) ||
          f.clienteNombre.toUpperCase().includes(clean) ||
          f.clienteDocumento.toUpperCase().includes(clean)
      );
      if (parcial) {
        setFacturaSeleccionadaKey(parcial.consecutivoLimpio);
        setPrendaDevolverId(parcial.prendas[0]?.id || null);
        setPasoWizardActivo(1);
      } else {
        setMensajeBusquedaFactura(
          `No se encontró la factura "${busquedaFactura}" dentro de las ventas registradas en el sistema.`
        );
      }
    }
  };

  const handleSeleccionarFacturaRapida = (key: string) => {
    setMensajeBusquedaFactura(null);
    setBusquedaFactura(key);
    setFacturaSeleccionadaKey(key);
    const fact = facturasDisponibles[key];
    if (fact && fact.prendas.length > 0) {
      setPrendaDevolverId(fact.prendas[0].id);
    }
  };

  // Filtrado reactivo de prendas disponibles en inventario de tienda
  const prendasInventarioFiltradas = useMemo(() => {
    const q = busquedaInventario.trim().toLowerCase();
    if (!q) return inventarioTienda;
    return inventarioTienda.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.talla.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
    );
  }, [busquedaInventario, inventarioTienda]);

  // Liquidación automática en COP enteros
  const valorPrendaDevueltaCop = prendaDevolver ? prendaDevolver.precioNetoPagadoCop : 0;
  const valorNuevaPrendaCop = nuevaPrenda ? nuevaPrenda.precioVentaCop : 0;
  const diferenciaCop = valorNuevaPrendaCop - valorPrendaDevueltaCop;

  const esManoAManoCero = diferenciaCop === 0;
  const esExcedenteCliente = diferenciaCop > 0;
  const esReintegroCliente = diferenciaCop < 0;

  // Restricción Sanitaria en Cosméticos (sin código técnico)
  const esCosmeticoBloqueado =
    prendaDevolver?.categoria === 'Cosméticos' && motivoCambio !== 'Prenda con imperfecto';

  // Destino Kardex de la prenda devuelta
  const vaParaAverias =
    estadoPrendaDevuelta === 'CON_IMPERFECTO' ||
    motivoCambio === 'Prenda con imperfecto' ||
    prendaDevolver?.categoria === 'Cosméticos';

  // Confirmar y registrar el cambio con impacto exacto en Kardex
  const handleConfirmarCambio = () => {
    if (!facturaActual || !prendaDevolver || !nuevaPrenda || esCosmeticoBloqueado) return;
    if (nuevaPrenda.stockDisponible <= 0) return;

    // 1. Impacto real en Kardex: Prenda Nueva Entregada (-1 ud Stock Vendible)
    applyStockDelta(nuevaPrenda.sku, -1);

    // 2. Impacto real en Kardex: Prenda Devuelta
    const estadoFinalDevuelta: 'BUEN_ESTADO' | 'CON_IMPERFECTO' = vaParaAverias
      ? 'CON_IMPERFECTO'
      : 'BUEN_ESTADO';

    let impactoKardex = `Entregada: -1 ud Stock Vendible (${nuevaPrenda.sku})`;
    if (estadoFinalDevuelta === 'BUEN_ESTADO') {
      applyStockDelta(prendaDevolver.sku, 1);
      impactoKardex += ` | Devuelta: +1 ud Reingreso Vendible (${prendaDevolver.sku})`;
    } else {
      impactoKardex += ` | Devuelta: +1 ud Stock Averías / No Vendible (0 en vendible) (${prendaDevolver.sku})`;
    }

    setInventarioTienda(buildInventarioReal());

    const fechaActualStr = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());

    const nuevoCambio: RegistroCambioRealizado = {
      id: `CAM-${Date.now().toString().slice(-4)}`,
      consecutivoFactura: facturaActual.consecutivo,
      fecha: `Hoy · ${fechaActualStr}`,
      cliente: facturaActual.clienteNombre,
      prendaDevuelta: `${prendaDevolver.nombre} (Talla ${prendaDevolver.talla}, ${prendaDevolver.color})`,
      prendaDevueltaSku: prendaDevolver.sku,
      prendaEntregada: `${nuevaPrenda.nombre} (Talla ${nuevaPrenda.talla}, ${nuevaPrenda.color})`,
      prendaEntregadaSku: nuevaPrenda.sku,
      motivo: motivoCambio,
      diferenciaCop: Math.abs(diferenciaCop),
      tipoLiquidacion: esManoAManoCero
        ? 'MANO_A_MANO_0'
        : esExcedenteCliente
        ? 'EXCEDENTE_COBRADO'
        : 'REINTEGRO_A_FAVOR',
      medioPagoExcedente: esExcedenteCliente ? medioCobroExcedente : undefined,
      observaciones:
        observacionCambio.trim() ||
        (estadoFinalDevuelta === 'CON_IMPERFECTO'
          ? 'Cambio por imperfecto de fábrica; prenda devuelta registrada en averías no vendibles.'
          : 'Cambio mano a mano registrado en mostrador.'),
      impactoKardex,
      prendaDevueltaImg: prendaDevolver.imagenUrl,
      prendaEntregadaImg: nuevaPrenda.imagenUrl,
      estadoPrendaDevuelta: estadoFinalDevuelta,
      valorDevueltoCop: prendaDevolver.precioNetoPagadoCop,
      valorEntregadoCop: nuevaPrenda.precioVentaCop,
    };

    const usuarioActivo = (() => {
      try {
        const u = localStorage.getItem('usuario');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    })();
    const vendedorNombre =
      usuarioActivo?.nombreCompleto || usuarioActivo?.nombre || 'Vendedor en Turno';

    recordPosExchange({
      id: nuevoCambio.id,
      consecutivoFactura: facturaActual.consecutivo,
      fecha: nuevoCambio.fecha,
      fechaIso: new Date().toISOString(),
      sesionCajaId: getSesionAbierta(sedeActiva)?.id,
      sede: sedeActiva,
      vendedor: vendedorNombre,
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
      estadoPrendaDevuelta: estadoFinalDevuelta,
      valorDevueltoCop: prendaDevolver.precioNetoPagadoCop,
      valorEntregadoCop: nuevaPrenda.precioVentaCop,
      prendaDevueltaImg: prendaDevolver.imagenUrl,
      prendaEntregadaImg: nuevaPrenda.imagenUrl,
    });

    setCambiosRealizados(getPosRegisteredExchanges() as RegistroCambioRealizado[]);
    setModalExito(nuevoCambio);
  };

  // Filtrado de historial
  const historialFiltrado = useMemo(() => {
    const q = busquedaHistorial.trim().toLowerCase();
    return cambiosRealizados.filter((c) => {
      if (filtroHistorial === 'MANO_A_MANO_0' && c.tipoLiquidacion !== 'MANO_A_MANO_0') {
        return false;
      }
      if (filtroHistorial === 'CON_EXCEDENTE' && c.tipoLiquidacion !== 'EXCEDENTE_COBRADO') {
        return false;
      }
      if (
        filtroHistorial === 'POR_IMPERFECTO' &&
        c.estadoPrendaDevuelta !== 'CON_IMPERFECTO' &&
        c.motivo !== 'Prenda con imperfecto'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.consecutivoFactura.toLowerCase().includes(q) ||
        c.cliente.toLowerCase().includes(q) ||
        c.prendaDevuelta.toLowerCase().includes(q) ||
        c.prendaEntregada.toLowerCase().includes(q) ||
        (c.prendaDevueltaSku || '').toLowerCase().includes(q) ||
        (c.prendaEntregadaSku || '').toLowerCase().includes(q)
      );
    });
  }, [cambiosRealizados, busquedaHistorial, filtroHistorial]);

  // Autosuma del historial
  const resumenHistorial = useMemo(() => {
    let manoAManoCount = 0;
    let totalExcedentesCop = 0;
    let totalAveriasCount = 0;
    for (const c of historialFiltrado) {
      if (c.tipoLiquidacion === 'MANO_A_MANO_0') manoAManoCount += 1;
      if (c.tipoLiquidacion === 'EXCEDENTE_COBRADO') totalExcedentesCop += c.diferenciaCop;
      if (c.estadoPrendaDevuelta === 'CON_IMPERFECTO' || c.motivo === 'Prenda con imperfecto') {
        totalAveriasCount += 1;
      }
    }
    return {
      totalRegistros: historialFiltrado.length,
      manoAManoCount,
      totalExcedentesCop,
      totalAveriasCount,
    };
  }, [historialFiltrado]);

  // Timeline de actividad para el DetailDrawer
  const timelineActividadDrawer = useMemo<ActivityTimelineItem[]>(() => {
    if (!cambioSeleccionadoDrawer) return [];
    return [
      {
        id: 'act-1',
        timestamp: 'Venta Registrada',
        title: `Factura Origen ${cambioSeleccionadoDrawer.consecutivoFactura}`,
        description: `Venta registrada a nombre de ${cambioSeleccionadoDrawer.cliente}.`,
        user: 'Terminal Mostrador',
        type: 'neutral',
      },
      {
        id: 'act-2',
        timestamp: 'Recepción en Tienda',
        title: 'Solicitud de Cambio Presentada',
        description: `Cliente presenta la prenda por motivo: ${cambioSeleccionadoDrawer.motivo}.`,
        user: 'Cajero en Turno',
        type: 'info',
      },
      {
        id: 'act-3',
        timestamp: 'Control de Calidad y Kardex',
        title: `Prenda Verificada: ${
          cambioSeleccionadoDrawer.estadoPrendaDevuelta === 'CON_IMPERFECTO'
            ? 'Con Imperfecto · Enviada a Averías No Vendibles'
            : 'En Buen Estado · Reingreso a Stock Vendible'
        }`,
        description: 'Inspección física y validación sanitaria completadas en mostrador.',
        user: 'Control de Calidad POS',
        type:
          cambioSeleccionadoDrawer.estadoPrendaDevuelta === 'CON_IMPERFECTO' ? 'warning' : 'success',
      },
      {
        id: 'act-4',
        timestamp: cambioSeleccionadoDrawer.fecha,
        title: `Liquidación Procesada: ${
          cambioSeleccionadoDrawer.tipoLiquidacion === 'MANO_A_MANO_0'
            ? '$0 COP (Cambio Mano a Mano)'
            : cambioSeleccionadoDrawer.tipoLiquidacion === 'EXCEDENTE_COBRADO'
            ? `Excedente Cobrado: +${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP (${
                cambioSeleccionadoDrawer.medioPagoExcedente || 'Efectivo'
              })`
            : `Saldo a Favor / Reintegro: -${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP`
        }`,
        description: `${cambioSeleccionadoDrawer.impactoKardex || 'Kardex actualizado'}.`,
        user: 'Caja Principal',
        type: 'success',
      },
    ];
  }, [cambioSeleccionadoDrawer]);

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-2.5 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA Y 3 SUBCATEGORÍAS SUPERIORES
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EFEAE4]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              <RotateCcw className="w-5 h-5 text-[#D19650]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-[10px] font-black uppercase">
                  Mostrador POS
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-xs font-extrabold">
                  Cambio Mano a Mano
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[#1C1311] tracking-tight mt-0.5">
                Registro de Cambios de Prendas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-700 bg-[#FAF7F4] px-3.5 py-2 rounded-xl border border-[#E5DDD3]">
            <MapPin className="w-4 h-4 text-[#661521]" />
            <span>
              Sede: <strong>{sedeActiva}</strong>
            </span>
          </div>
        </div>

        {/* 3 Subcategorías (Pestañas Superiores) */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          <button
            type="button"
            onClick={() => handleCambiarSubcategoria('NUEVO_CAMBIO')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
              subcategoriaActiva === 'NUEVO_CAMBIO'
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-[#D19650]" />
            <span>1. Nuevo Cambio Mano a Mano</span>
          </button>

          <button
            type="button"
            onClick={() => handleCambiarSubcategoria('DEVOLUCION_IMPERFECTO')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
              subcategoriaActiva === 'DEVOLUCION_IMPERFECTO'
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#D19650]" />
            <span>2. Devolución por Imperfecto / Garantía</span>
          </button>

          <button
            type="button"
            onClick={() => handleCambiarSubcategoria('HISTORIAL')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
              subcategoriaActiva === 'HISTORIAL'
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <History className="w-4 h-4 text-[#D19650]" />
            <span>3. Historial de Cambios y Devoluciones ({cambiosRealizados.length})</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          SUBCATEGORÍAS 1 Y 2: WIZARD DE 3 PASOS / DEVOLUCIÓN POR IMPERFECTO
      ========================================================================= */}
      {(subcategoriaActiva === 'NUEVO_CAMBIO' ||
        subcategoriaActiva === 'DEVOLUCION_IMPERFECTO') && (
        <div className="space-y-4">
          {/* Banner de modo Imperfecto / Garantía cuando está en la Subcategoría 2 */}
          {subcategoriaActiva === 'DEVOLUCION_IMPERFECTO' && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#661521] shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase block text-[#661521]">
                    Modo Garantía / Devolución por Imperfecto de Fábrica Activo
                  </span>
                  <span className="text-stone-700 font-medium">
                    Toda prenda recibida bajo esta modalidad queda marcada como{' '}
                    <strong>Con Imperfecto</strong> e ingresa exclusivamente a{' '}
                    <strong>Stock Averías / No Vendible (0 en vendible)</strong> para no contaminar
                    el inventario de mostrador.
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#661521] text-white font-mono text-[10px] font-black uppercase shrink-0">
                Averías / No Vendible
              </span>
            </div>
          )}

          {/* Stepper Horizontal Limpio de 3 Pasos */}
          <div className="bg-white rounded-2xl border border-[#D8CFC6] p-3 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                step: 1 as const,
                title: 'Paso 1: Buscar Factura de Venta Real',
                sub: facturaActual
                  ? `${facturaActual.consecutivo} · ${facturaActual.clienteNombre}`
                  : 'Selecciona o busca consecutivo',
              },
              {
                step: 2 as const,
                title: 'Paso 2: Seleccionar Nueva Prenda de Reemplazo',
                sub: nuevaPrenda
                  ? `${nuevaPrenda.nombre} (${nuevaPrenda.talla})`
                  : 'Catálogo real de sede',
              },
              {
                step: 3 as const,
                title: 'Paso 3: Liquidación Automática y Confirmación',
                sub: esManoAManoCero
                  ? '$0 COP (Cambio Mano a Mano)'
                  : esExcedenteCliente
                  ? `Excedente +${formatCOP(diferenciaCop)}`
                  : `Saldo a favor -${formatCOP(Math.abs(diferenciaCop))}`,
              },
            ].map((item) => {
              const active = pasoWizardActivo === item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setPasoWizardActivo(item.step)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    active
                      ? 'bg-[#FAF7F4] border-[#661521] ring-1 ring-[#661521]/20'
                      : 'bg-white border-[#EFEAE4] hover:bg-[#FAF7F4]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                      active ? 'bg-[#661521] text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.step}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-[#1C1311] truncate">
                      {item.title}
                    </span>
                    <span className="block text-[11px] text-stone-500 truncate">{item.sub}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Grilla Limpia de 3 Columnas (1 por Paso del Wizard) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* ===================================================================
                PASO 1: BUSCAR FACTURA DE VENTA REAL Y PRENDA DEVUELTA (4 COLS)
            =================================================================== */}
            <section
              onClick={() => setPasoWizardActivo(1)}
              className="lg:col-span-4 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-[#1C1311]">
                    Buscar Factura de Venta Real
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
                      placeholder="Buscar consecutivo (ej. #MED-0042)..."
                      className="w-full min-h-[42px] pl-9 pr-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 min-h-[42px] rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] font-black text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Buscar
                  </button>
                </div>

                {/* Píldoras con las últimas ventas reales registradas en el punto */}
                {facturasOrdenadas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-stone-500">
                      Ventas registradas:
                    </span>
                    {facturasOrdenadas.slice(0, 6).map((f) => (
                      <button
                        key={f.consecutivoLimpio}
                        type="button"
                        onClick={() => handleSeleccionarFacturaRapida(f.consecutivoLimpio)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          facturaActual?.consecutivoLimpio === f.consecutivoLimpio
                            ? 'bg-[#661521] text-white shadow-2xs'
                            : 'bg-[#FAF7F4] text-stone-700 hover:bg-stone-200 border border-stone-300'
                        }`}
                      >
                        {f.consecutivo}
                      </button>
                    ))}
                  </div>
                )}
              </form>

              {mensajeBusquedaFactura && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                  {mensajeBusquedaFactura}
                </div>
              )}

              {!facturaActual ? (
                <div className="p-6 rounded-2xl bg-[#FAF7F4] border border-dashed border-[#D8CFC6] text-center space-y-2">
                  <Package className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-black text-[#1C1311]">
                    No hay facturas de venta registradas aún en este turno
                  </p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Las facturas buscables provienen 100% de las ventas reales registradas en la
                    Terminal POS. Realiza una venta en mostrador para habilitar cambios sobre esa
                    factura.
                  </p>
                </div>
              ) : (
                <>
                  {/* Ficha de la Factura Seleccionada */}
                  <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-[#1C1311]">
                        {facturaActual.consecutivo}
                      </span>
                      <span className="text-stone-500 font-medium">{facturaActual.fechaBogota}</span>
                    </div>
                    <p className="font-bold text-[#1C1311]">
                      Cliente: <span className="font-normal">{facturaActual.clienteNombre}</span> (
                      {facturaActual.clienteDocumento})
                    </p>
                    <p className="text-stone-500 text-[11px]">{facturaActual.sede}</p>
                  </div>

                  {/* Prendas compradas en la factura */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-bold uppercase text-stone-600">
                      Selecciona la prenda que devuelve el cliente:
                    </span>
                    {facturaActual.prendas.map((prenda) => {
                      const isSelected = prendaDevolver?.id === prenda.id;
                      return (
                        <div
                          key={prenda.id}
                          onClick={() => setPrendaDevolverId(prenda.id)}
                          className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-[#661521]/10 border-[#661521] shadow-2xs'
                              : 'bg-[#FAF7F4] border-[#E5DDD3] hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={prenda.imagenUrl}
                              alt={prenda.nombre}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                            />
                            <div className="min-w-0">
                              <h3 className="text-xs font-black text-[#1C1311] truncate">
                                {prenda.nombre}
                              </h3>
                              <p className="font-mono text-[11px] text-stone-600 truncate">
                                Talla: {prenda.talla} · {prenda.color} · {prenda.sku}
                              </p>
                              <span className="font-mono text-xs font-black text-[#059669]">
                                Pagado: {formatCOP(prenda.precioNetoPagadoCop)}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#661521] border-[#661521] text-white'
                                : 'border-stone-400'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Motivo del Cambio y Estado Físico */}
                  <div className="pt-2 border-t border-[#EFEAE4] space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                        Motivo del Cambio:
                      </label>
                      <select
                        value={motivoCambio}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMotivoCambio(val);
                          if (val === 'Prenda con imperfecto') {
                            setEstadoPrendaDevuelta('CON_IMPERFECTO');
                          }
                        }}
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                      >
                        <option value="Cambio de talla">Cambio de talla</option>
                        <option value="Cambio de color">Cambio de color</option>
                        <option value="Prenda con imperfecto">Prenda con imperfecto</option>
                        <option value="Cambio por otro modelo">Cambio por otro modelo</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={subcategoriaActiva === 'DEVOLUCION_IMPERFECTO'}
                        onClick={() => setEstadoPrendaDevuelta('BUEN_ESTADO')}
                        className={`p-2 rounded-xl text-xs font-bold border-2 transition-all text-left cursor-pointer disabled:opacity-50 ${
                          !vaParaAverias
                            ? 'bg-emerald-50 text-[#059669] border-[#059669]'
                            : 'bg-white text-stone-600 border-[#D8CFC6]'
                        }`}
                      >
                        <span className="block font-black">Buen Estado</span>
                        <span className="block text-[10px] text-stone-500">
                          +1 ud Stock Vendible
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEstadoPrendaDevuelta('CON_IMPERFECTO')}
                        className={`p-2 rounded-xl text-xs font-bold border-2 transition-all text-left cursor-pointer ${
                          vaParaAverias
                            ? 'bg-red-50 text-[#661521] border-[#661521]'
                            : 'bg-white text-stone-600 border-[#D8CFC6]'
                        }`}
                      >
                        <span className="block font-black">Con Imperfecto</span>
                        <span className="block text-[10px] text-stone-500">
                          +1 ud Stock Averías
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* ===================================================================
                PASO 2: SELECCIONAR NUEVA PRENDA DE REEMPLAZO (4 COLS)
            =================================================================== */}
            <section
              onClick={() => setPasoWizardActivo(2)}
              className="lg:col-span-4 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-[#1C1311]">
                    Seleccionar Nueva Prenda de Reemplazo
                  </h2>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaInventario}
                  onChange={(e) => setBusquedaInventario(e.target.value)}
                  placeholder="Buscar por nombre, SKU, talla o color..."
                  className="w-full min-h-[42px] pl-9 pr-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                />
              </div>

              <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
                {prendasInventarioFiltradas.map((item) => {
                  const isSelected = nuevaPrenda?.sku === item.sku;
                  const sinStock = item.stockDisponible <= 0;

                  return (
                    <div
                      key={item.sku}
                      onClick={() => {
                        if (!sinStock) {
                          setNuevaPrendaSku(item.sku);
                          setPasoWizardActivo(3);
                        }
                      }}
                      className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-between gap-2.5 ${
                        sinStock
                          ? 'opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#661521]/10 border-[#661521] shadow-2xs cursor-pointer'
                          : 'bg-[#FAF7F4] border-[#E5DDD3] hover:border-stone-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.imagenUrl}
                          alt={item.nombre}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-[#1C1311] truncate">
                            {item.nombre}
                          </h4>
                          <p className="font-mono text-[11px] text-stone-600 truncate">
                            Talla: {item.talla} · {item.color} · {item.sku}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs font-black text-[#661521]">
                              {formatCOP(item.precioVentaCop)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                item.stockDisponible > 3
                                  ? 'bg-emerald-100 text-[#059669]'
                                  : item.stockDisponible > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Stock: {item.stockDisponible} uds
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#661521] border-[#661521] text-white'
                            : 'border-stone-400'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ===================================================================
                PASO 3: LIQUIDACIÓN AUTOMÁTICA Y CONFIRMACIÓN (4 COLS)
            =================================================================== */}
            <section
              onClick={() => setPasoWizardActivo(3)}
              className="lg:col-span-4 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-[#1C1311]">
                    Liquidación Automática y Confirmación
                  </h2>
                </div>
              </div>

              {/* Comparativa Lado a Lado: Prenda Devuelta vs Prenda Nueva */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#661521] block">
                    Prenda Devuelta
                  </span>
                  {prendaDevolver ? (
                    <>
                      <p className="font-bold text-[#1C1311] truncate">{prendaDevolver.nombre}</p>
                      <p className="font-mono text-[10px] text-stone-600">
                        {prendaDevolver.sku} · Talla {prendaDevolver.talla}
                      </p>
                      <p className="font-mono font-black text-[#661521]">
                        {formatCOP(valorPrendaDevueltaCop)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-stone-400">Sin factura seleccionada</p>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#059669] block">
                    Prenda Nueva
                  </span>
                  {nuevaPrenda ? (
                    <>
                      <p className="font-bold text-[#1C1311] truncate">{nuevaPrenda.nombre}</p>
                      <p className="font-mono text-[10px] text-stone-600">
                        {nuevaPrenda.sku} · Talla {nuevaPrenda.talla}
                      </p>
                      <p className="font-mono font-black text-[#059669]">
                        {formatCOP(valorNuevaPrendaCop)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-stone-400">Selecciona prenda</p>
                  )}
                </div>
              </div>

              {/* Resultado de la Liquidación */}
              <div className="p-3 rounded-2xl bg-[#FAF7F4] border border-[#E5DDD3]">
                {esManoAManoCero && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-[#059669] text-[#059669] flex items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-xs block">
                        Caso A: Cambio Mano a Mano Exacto
                      </span>
                      <span className="text-[11px] text-stone-600">
                        $0 COP (Cambio Mano a Mano)
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black text-[#059669]">$0 COP</span>
                  </div>
                )}

                {esExcedenteCliente && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-[#D19650] text-[#1C1311] flex items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-xs block text-[#661521]">
                        Excedente a Pagar por el Cliente
                      </span>
                      <span className="text-[11px] text-stone-600">
                        Prenda de mayor valor:
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black text-[#661521]">
                      +{formatCOP(diferenciaCop)}
                    </span>
                  </div>
                )}

                {esReintegroCliente && (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-400 text-[#1C1311] flex items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-xs block text-blue-900">
                        Saldo a Favor / Reintegro al Cliente
                      </span>
                      <span className="text-[11px] text-stone-600">
                        Diferencia a favor del cliente:
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black text-blue-900">
                      -{formatCOP(Math.abs(diferenciaCop))}
                    </span>
                  </div>
                )}
              </div>

              {/* Medio de pago si hay excedente */}
              {esExcedenteCliente && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase text-stone-600">
                    Medio de Cobro del Excedente:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMedioCobroExcedente('EFECTIVO')}
                      className={`min-h-[40px] px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        medioCobroExcedente === 'EFECTIVO'
                          ? 'bg-[#661521] text-white border-[#661521]'
                          : 'bg-white text-stone-700 border-[#D8CFC6]'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMedioCobroExcedente('TRANSFERENCIA')}
                      className={`min-h-[40px] px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        medioCobroExcedente === 'TRANSFERENCIA'
                          ? 'bg-[#661521] text-white border-[#661521]'
                          : 'bg-white text-stone-700 border-[#D8CFC6]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Transferencia</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Resumen de Impacto Exacto en Kardex */}
              <div className="p-3 rounded-xl bg-stone-900 text-stone-100 space-y-1.5 text-[11px] font-mono">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#D19650]">
                  Impacto Exacto en Kardex
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-300">Prenda Nueva Entregada:</span>
                  <span className="font-bold text-rose-300">
                    -1 ud Stock Vendible ({nuevaPrenda?.sku || '—'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-300">Prenda Devuelta:</span>
                  {vaParaAverias ? (
                    <span className="font-bold text-amber-300">
                      +1 ud Stock Averías / No Vendible (0 en vendible)
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-300">
                      +1 ud Reingreso a Stock Vendible ({prendaDevolver?.sku || '—'})
                    </span>
                  )}
                </div>
              </div>

              {/* Observación */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                  Observaciones del Cambio:
                </label>
                <input
                  type="text"
                  value={observacionCambio}
                  onChange={(e) => setObservacionCambio(e.target.value)}
                  placeholder="Ej. Cambio de talla o detalle del imperfecto..."
                  className="w-full min-h-[40px] px-3 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
                />
              </div>

              {/* Alerta de Restricción Sanitaria en Cosméticos (sin código técnico) */}
              {esCosmeticoBloqueado && (
                <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Restricción Sanitaria: Los productos cosméticos de uso personal no admiten
                    cambios por talla, color o gusto. Solo procede por defecto de fábrica.
                  </span>
                </div>
              )}

              {/* Botón de Confirmación */}
              <button
                type="button"
                disabled={
                  !facturaActual ||
                  !prendaDevolver ||
                  !nuevaPrenda ||
                  nuevaPrenda.stockDisponible <= 0 ||
                  esCosmeticoBloqueado
                }
                onClick={handleConfirmarCambio}
                className="w-full min-h-[52px] px-4 rounded-2xl bg-[#661521] hover:bg-[#52101a] active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 text-[#D19650]" />
                <span>Confirmar y Registrar Cambio Mano a Mano</span>
              </button>
            </section>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBCATEGORÍA 3: HISTORIAL DE CAMBIOS Y DEVOLUCIONES
      ========================================================================= */}
      {subcategoriaActiva === 'HISTORIAL' && (
        <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
            <div>
              <h2 className="text-base font-black text-[#1C1311]">
                Historial de Cambios y Devoluciones ({historialFiltrado.length})
              </h2>
              <p className="text-xs text-stone-500">
                Haz clic en cualquier registro para inspeccionar su trazabilidad y comprobante
                térmico en el panel lateral.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'TODOS' as const, label: 'Todos' },
                { id: 'MANO_A_MANO_0' as const, label: 'Mano a Mano $0' },
                { id: 'CON_EXCEDENTE' as const, label: 'Con Excedente' },
                { id: 'POR_IMPERFECTO' as const, label: 'Por Imperfecto' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroHistorial(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    filtroHistorial === f.id
                      ? 'bg-[#661521] text-white border-[#661521]'
                      : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6] hover:bg-stone-200/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buscador del Historial */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              placeholder="Buscar por código de cambio, factura (#MED-...), cliente o SKU..."
              className="w-full min-h-[42px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-semibold text-[#1C1311] focus:outline-none focus:border-[#661521]"
            />
          </div>

          {historialFiltrado.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#FAF7F4] border border-dashed border-[#D8CFC6] text-center space-y-2">
              <History className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-black text-[#1C1311]">
                No hay cambios ni devoluciones registrados en este turno
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Los cambios mano a mano y devoluciones por garantía procesados en mostrador
                aparecerán automáticamente aquí con su impacto en Kardex.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {historialFiltrado.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setCambioSeleccionadoDrawer(c);
                    setDrawerTab('detalle');
                  }}
                  className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] hover:border-[#661521] hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#1C1311] group-hover:text-[#661521]">
                        #{c.id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-mono text-[10px] font-bold">
                        {c.consecutivoFactura}
                      </span>
                      <span className="text-stone-600 font-bold">· {c.cliente}</span>
                      <span className="text-stone-400 font-mono text-[11px]">({c.fecha})</span>
                      <span
                        className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          c.tipoLiquidacion === 'MANO_A_MANO_0'
                            ? 'bg-emerald-100 text-[#059669]'
                            : c.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                            ? 'bg-amber-100 text-[#B45309]'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.tipoLiquidacion === 'MANO_A_MANO_0'
                          ? 'MANO A MANO $0'
                          : c.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                          ? `EXCEDENTE +${formatCOP(c.diferenciaCop)}`
                          : `SALDO A FAVOR -${formatCOP(c.diferenciaCop)}`}
                      </span>
                      {c.estadoPrendaDevuelta === 'CON_IMPERFECTO' && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-[#661521] font-black text-[10px]">
                          AVERÍA / NO VENDIBLE
                        </span>
                      )}
                    </div>
                    <p className="text-stone-700 mt-1 truncate">
                      Devuelve: <strong>{c.prendaDevuelta}</strong>{' '}
                      <ArrowRight className="inline w-3 h-3 mx-1" /> Lleva:{' '}
                      <strong>{c.prendaEntregada}</strong>
                    </p>
                    <p className="text-stone-500 text-[11px] mt-0.5 truncate">
                      Motivo: <span className="font-medium text-stone-700">{c.motivo}</span>
                      {c.impactoKardex && ` · ${c.impactoKardex}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="font-mono text-sm font-black text-[#1C1311] block">
                        {c.tipoLiquidacion === 'MANO_A_MANO_0'
                          ? '$0 COP'
                          : `${formatCOP(c.diferenciaCop)} COP`}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        {c.tipoLiquidacion === 'EXCEDENTE_COBRADO' && c.medioPagoExcedente
                          ? `Vía ${c.medioPagoExcedente}`
                          : 'Liquidado'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-lg bg-stone-100 group-hover:bg-[#661521] text-stone-600 group-hover:text-white transition-all"
                      title="Ver detalle del cambio"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Barra Inferior de Autosuma */}
          <div className="pt-3 border-t border-[#EFEAE4] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
              <span className="text-[10px] font-bold uppercase text-stone-500 block">
                Total Operaciones
              </span>
              <span className="font-mono text-sm font-black text-[#1C1311]">
                {resumenHistorial.totalRegistros} registros
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-[#059669] block">
                Cambios Mano a Mano $0
              </span>
              <span className="font-mono text-sm font-black text-[#059669]">
                {resumenHistorial.manoAManoCount} operaciones
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-900 block">
                Total Excedentes Cobrados
              </span>
              <span className="font-mono text-sm font-black text-[#661521]">
                {formatCOP(resumenHistorial.totalExcedentesCop)} COP
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
              <span className="text-[10px] font-bold uppercase text-[#661521] block">
                Enviados a Averías
              </span>
              <span className="font-mono text-sm font-black text-[#661521]">
                {resumenHistorial.totalAveriasCount} uds no vendibles
              </span>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          DRAWER LATERAL MASTER-DETAIL: DETALLE Y ACTIVIDAD DEL CAMBIO
      ========================================================================= */}
      {cambioSeleccionadoDrawer && (
        <DetailDrawer
          isOpen={Boolean(cambioSeleccionadoDrawer)}
          onClose={() => setCambioSeleccionadoDrawer(null)}
          title="Detalle del Cambio de Mercancía"
          subtitle={`Registro #${cambioSeleccionadoDrawer.id} · Factura ${cambioSeleccionadoDrawer.consecutivoFactura}`}
          badge={{
            label:
              cambioSeleccionadoDrawer.tipoLiquidacion === 'MANO_A_MANO_0'
                ? 'Mano a Mano $0 COP'
                : cambioSeleccionadoDrawer.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                ? `Excedente +${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP`
                : `Saldo a Favor -${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP`,
            variant:
              cambioSeleccionadoDrawer.tipoLiquidacion === 'MANO_A_MANO_0'
                ? 'success'
                : cambioSeleccionadoDrawer.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                ? 'warning'
                : 'info',
          }}
          tabs={[
            { id: 'detalle', label: 'Detalle' },
            { id: 'actividad', label: 'Actividad' },
          ]}
          activeTab={drawerTab}
          onTabChange={(tab) => setDrawerTab(tab as 'detalle' | 'actividad')}
          activityItems={timelineActividadDrawer}
          footerActions={
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Reimprimir Comprobante de Cambio (80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => setCambioSeleccionadoDrawer(null)}
                className="min-h-[46px] px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                  Factura de Venta Origen
                </span>
                <span className="font-mono text-sm font-black text-[#661521]">
                  {cambioSeleccionadoDrawer.consecutivoFactura}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5DDD3] text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Cliente
                  </span>
                  <span className="font-bold text-[#1C1311] block">
                    {cambioSeleccionadoDrawer.cliente}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Fecha y Hora
                  </span>
                  <span className="font-bold text-stone-700 block">
                    {cambioSeleccionadoDrawer.fecha}
                  </span>
                </div>
              </div>

              <div className="text-xs pt-1 text-stone-600">
                Sede: <strong>{sedeActiva}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-600">
                Prendas Vinculadas al Cambio
              </h4>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 border-2 border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#661521]">
                    Prenda Devuelta por el Cliente
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#661521] border border-rose-300">
                    {cambioSeleccionadoDrawer.estadoPrendaDevuelta === 'CON_IMPERFECTO'
                      ? 'Stock Averías / No Vendible'
                      : 'Reingreso a Stock Vendible'}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="font-black text-sm text-[#1C1311]">
                    {cambioSeleccionadoDrawer.prendaDevuelta}
                  </p>
                  {cambioSeleccionadoDrawer.prendaDevueltaSku && (
                    <p className="font-mono text-xs text-stone-600">
                      SKU: {cambioSeleccionadoDrawer.prendaDevueltaSku}
                    </p>
                  )}
                  {cambioSeleccionadoDrawer.valorDevueltoCop !== undefined && (
                    <p className="font-mono text-xs font-bold text-[#661521]">
                      Valor reconocido: {formatCOP(cambioSeleccionadoDrawer.valorDevueltoCop)}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-rose-200/80 text-[11px] text-stone-700">
                  Motivo: <strong>{cambioSeleccionadoDrawer.motivo}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#059669]">
                    Nueva Prenda Entregada al Cliente
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#059669] border border-emerald-300">
                    -1 ud Stock Vendible
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="font-black text-sm text-[#1C1311]">
                    {cambioSeleccionadoDrawer.prendaEntregada}
                  </p>
                  {cambioSeleccionadoDrawer.prendaEntregadaSku && (
                    <p className="font-mono text-xs text-stone-600">
                      SKU: {cambioSeleccionadoDrawer.prendaEntregadaSku}
                    </p>
                  )}
                  {cambioSeleccionadoDrawer.valorEntregadoCop !== undefined && (
                    <p className="font-mono text-xs font-bold text-[#059669]">
                      Precio de venta: {formatCOP(cambioSeleccionadoDrawer.valorEntregadoCop)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-2">
              <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">
                Liquidación y Kardex
              </span>

              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-stone-700">Diferencia Neta Liquidada:</span>
                <span className="font-mono font-black text-base text-[#661521]">
                  {cambioSeleccionadoDrawer.tipoLiquidacion === 'MANO_A_MANO_0'
                    ? '$0 COP'
                    : `${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP`}
                </span>
              </div>

              {cambioSeleccionadoDrawer.impactoKardex && (
                <div className="text-[11px] font-mono text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="block font-bold text-stone-500 text-[10px] uppercase">
                    Impacto Kardex:
                  </span>
                  {cambioSeleccionadoDrawer.impactoKardex}
                </div>
              )}
            </div>
          </div>
        </DetailDrawer>
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
                Factura Origen:{' '}
                <strong className="font-mono text-[#661521]">
                  {modalExito.consecutivoFactura}
                </strong>
              </p>
            </div>

            <div className="bg-[#FAF7F4] p-4 rounded-2xl border border-[#E5DDD3] space-y-2.5 text-xs">
              <div>
                <span className="text-stone-500 block uppercase text-[10px] font-bold">
                  Cliente
                </span>
                <span className="font-black text-sm text-[#1C1311]">{modalExito.cliente}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5DDD3]">
                <div>
                  <span className="text-stone-500 block text-[10px] font-bold uppercase">
                    Prenda Recibida
                  </span>
                  <span className="font-bold text-[#661521]">{modalExito.prendaDevuelta}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] font-bold uppercase">
                    Prenda Entregada
                  </span>
                  <span className="font-bold text-[#059669]">{modalExito.prendaEntregada}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5DDD3] flex justify-between items-center">
                <span className="font-bold text-stone-700">Liquidación:</span>
                <span className="font-mono font-black text-base text-[#1C1311]">
                  {modalExito.tipoLiquidacion === 'MANO_A_MANO_0'
                    ? '$0 COP (Cambio Mano a Mano)'
                    : modalExito.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                    ? `Excedente Cobrado: ${formatCOP(modalExito.diferenciaCop)}`
                    : `Reintegro al Cliente: ${formatCOP(modalExito.diferenciaCop)}`}
                </span>
              </div>

              {modalExito.impactoKardex && (
                <div className="pt-2 border-t border-[#E5DDD3] text-[10px] font-mono text-stone-600">
                  <span className="font-bold text-stone-800">Kardex:</span>{' '}
                  {modalExito.impactoKardex}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-[48px] px-4 rounded-xl bg-[#1C1311] text-[#D19650] font-black text-xs flex items-center justify-center gap-2 hover:bg-stone-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante de Cambio</span>
              </button>

              <button
                type="button"
                onClick={() => setModalExito(null)}
                className="min-h-[48px] px-5 rounded-xl bg-[#661521] text-white font-black text-xs hover:bg-[#52101a] cursor-pointer"
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
