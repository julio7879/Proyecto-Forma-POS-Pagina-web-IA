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
} from 'lucide-react';
import {
  applyStockDelta,
  getStockDelta,
  recordPosExchange,
  getPosRegisteredExchanges,
  getPosRegisteredSales,
} from '../utils/posLedgerSync';
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

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

const FACTURAS_REGISTRADAS_BASE: Record<string, FacturaVentaPOS> = {
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

const INVENTARIO_TIENDA_BASE: PrendaInventarioDisponible[] = [
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

const SEED_HISTORIAL_CAMBIOS: RegistroCambioRealizado[] = [
  {
    id: 'CAM-2026-0040',
    consecutivoFactura: '#MED-0039',
    fecha: 'Ayer · 04:15 p. m.',
    cliente: 'Mariana Duarte',
    prendaDevuelta: 'Camiseta Básica Algodón Pima (Talla S, Blanco Hueso)',
    prendaDevueltaSku: 'ROP-CAM-002-S',
    prendaEntregada: 'Camiseta Básica Algodón Pima (Talla M, Blanco Hueso)',
    prendaEntregadaSku: 'ROP-CAM-002-M',
    motivo: 'Cambio de talla',
    diferenciaCop: 0,
    tipoLiquidacion: 'MANO_A_MANO_0',
    observaciones: 'Cliente solicitó cambio de talla S a M. Prenda recibida en perfecto estado con marquillas.',
    impactoKardex: 'Entregada: -1 ud (ROP-CAM-002-M) | Devuelta: +1 ud Reingreso Vendible (ROP-CAM-002-S)',
    estadoPrendaDevuelta: 'BUEN_ESTADO',
    valorDevueltoCop: 59900,
    valorEntregadoCop: 59900,
    prendaDevueltaImg: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    prendaEntregadaImg: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'CAM-2026-0038',
    consecutivoFactura: '#MED-0035',
    fecha: 'Hace 2 días · 11:20 a. m.',
    cliente: 'Sebastián Gómez',
    prendaDevuelta: 'Camiseta Básica Algodón Pima (Talla M, Blanco Hueso)',
    prendaDevueltaSku: 'ROP-CAM-002-M',
    prendaEntregada: 'Chaqueta Denim Artesanal (Talla M, Azul Índigo)',
    prendaEntregadaSku: 'ROP-DNM-001-M',
    motivo: 'Cambio por otro modelo',
    diferenciaCop: 129100,
    tipoLiquidacion: 'EXCEDENTE_COBRADO',
    medioPagoExcedente: 'EFECTIVO',
    observaciones: 'Cliente entrega camiseta básica y abona el excedente en efectivo para llevar chaqueta denim.',
    impactoKardex: 'Entregada: -1 ud (ROP-DNM-001-M) | Devuelta: +1 ud Reingreso Vendible (ROP-CAM-002-M)',
    estadoPrendaDevuelta: 'BUEN_ESTADO',
    valorDevueltoCop: 59900,
    valorEntregadoCop: 189000,
    prendaDevueltaImg: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    prendaEntregadaImg: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
  },
];

export const PosCambiosPage: React.FC = () => {
  // 1. Inventario reactivo de tienda sincronizado con Kardex
  const [inventarioTienda, setInventarioTienda] = useState<PrendaInventarioDisponible[]>(() => {
    return INVENTARIO_TIENDA_BASE.map((p) => ({
      ...p,
      stockDisponible: Math.max(0, p.stockDisponible + getStockDelta(p.sku)),
    }));
  });

  // Re-sincronizar inventario ante mutaciones de Kardex en otras vistas/pestañas
  useEffect(() => {
    const syncStock = () => {
      setInventarioTienda(
        INVENTARIO_TIENDA_BASE.map((p) => ({
          ...p,
          stockDisponible: Math.max(0, p.stockDisponible + getStockDelta(p.sku)),
        }))
      );
    };
    window.addEventListener('forma-pos-ledger-update', syncStock);
    window.addEventListener('storage', syncStock);
    return () => {
      window.removeEventListener('forma-pos-ledger-update', syncStock);
      window.removeEventListener('storage', syncStock);
    };
  }, []);

  // 2. Facturas registradas (combinando base + ventas reales cobradas en POS)
  const facturasDisponibles = useMemo(() => {
    const dict = { ...FACTURAS_REGISTRADAS_BASE };
    const sales = getPosRegisteredSales();
    sales.forEach((s) => {
      const cleanKey = s.consecutivo.replace('#', '').trim().toUpperCase();
      if (!dict[cleanKey]) {
        dict[cleanKey] = {
          consecutivo: s.consecutivo.startsWith('#') ? s.consecutivo : `#${s.consecutivo}`,
          fechaBogota: s.fechaHora || 'Hoy · Turno Actual',
          clienteNombre: s.cliente || 'Consumidor Final',
          clienteDocumento: s.documentoCliente || 'CC Consumidor Final',
          sede: s.sede || 'Punto Centro — Cúcuta',
          prendas: (s.prendas || s.items || []).map((it, idx) => ({
            id: `sale-item-${s.consecutivo}-${idx}`,
            nombre: it.nombre,
            sku: it.sku,
            talla: it.talla || 'M',
            color: it.color || 'Estándar',
            categoria: it.categoria || 'Ropa',
            imagenUrl:
              it.imagenUrl ||
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
            cantidadComprada: it.cantidad,
            precioNetoPagadoCop: it.precioUnitarioCop || it.precioUnitarioCOP || it.totalCop,
          })),
        };
      }
    });
    return dict;
  }, []);

  // Paso 1: Búsqueda de factura
  const [busquedaFactura, setBusquedaFactura] = useState<string>('MED-0041');
  const [facturaSeleccionadaKey, setFacturaSeleccionadaKey] = useState<string>('MED-0041');

  const facturaActual =
    facturasDisponibles[facturaSeleccionadaKey] || facturasDisponibles['MED-0041'];

  // Paso 2: Prenda a devolver y motivo
  const [prendaDevolver, setPrendaDevolver] = useState<PrendaComprada | null>(
    facturaActual.prendas[0] || null
  );
  const [motivoCambio, setMotivoCambio] = useState<string>('Cambio de talla');
  const [estadoPrendaDevuelta, setEstadoPrendaDevuelta] = useState<'BUEN_ESTADO' | 'CON_IMPERFECTO'>(
    'BUEN_ESTADO'
  );

  // Paso 3: Nueva prenda seleccionada del inventario local
  const [nuevaPrenda, setNuevaPrenda] = useState<PrendaInventarioDisponible | null>(
    inventarioTienda[0] || null
  );
  const [busquedaInventario, setBusquedaInventario] = useState<string>('');

  // Paso 4: Liquidación y confirmación
  const [medioCobroExcedente, setMedioCobroExcedente] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [observacionCambio, setObservacionCambio] = useState<string>(
    'Cliente solicita cambio por talla L para mejor horma.'
  );

  // Historial persistente de cambios
  const [cambiosRealizados, setCambiosRealizados] = useState<RegistroCambioRealizado[]>(() => {
    const guardados = getPosRegisteredExchanges();
    if (guardados && guardados.length > 0) {
      return guardados as RegistroCambioRealizado[];
    }
    return SEED_HISTORIAL_CAMBIOS;
  });

  const [modalExito, setModalExito] = useState<RegistroCambioRealizado | null>(null);

  // Drawer de Detalle y Actividad de un Cambio
  const [cambioSeleccionadoDrawer, setCambioSeleccionadoDrawer] = useState<RegistroCambioRealizado | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'actividad'>('detalle');

  // Cargar factura por consecutivo
  const handleBuscarFactura = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = busquedaFactura.replace('#', '').trim().toUpperCase();
    if (facturasDisponibles[clean]) {
      setFacturaSeleccionadaKey(clean);
      setPrendaDevolver(facturasDisponibles[clean].prendas[0] || null);
    } else {
      setFacturaSeleccionadaKey('MED-0041');
      setPrendaDevolver(facturasDisponibles['MED-0041'].prendas[0] || null);
    }
  };

  const handleSeleccionarFacturaRapida = (key: string) => {
    setBusquedaFactura(key);
    setFacturaSeleccionadaKey(key);
    const fact = facturasDisponibles[key];
    if (fact && fact.prendas.length > 0) {
      setPrendaDevolver(fact.prendas[0]);
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
        p.color.toLowerCase().includes(q)
    );
  }, [busquedaInventario, inventarioTienda]);

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

  // Confirmar y registrar el cambio con descuento efectivo de inventario
  const handleConfirmarCambio = () => {
    if (!prendaDevolver || !nuevaPrenda || esCosmeticoBloqueado) return;

    // 1. Impacto real en Kardex: Prenda entregada -1 ud
    applyStockDelta(nuevaPrenda.sku, -1);

    // 2. Impacto real en Kardex devuelto: Reingreso vendible +1 ud (si está en buen estado y no es cosmético)
    let impactoKardex = `Entregada: -1 ud (${nuevaPrenda.sku})`;
    if (estadoPrendaDevuelta === 'BUEN_ESTADO' && prendaDevolver.categoria !== 'Cosméticos') {
      applyStockDelta(prendaDevolver.sku, 1);
      impactoKardex += ` | Devuelta: +1 ud Reingreso Vendible (${prendaDevolver.sku})`;
    } else {
      impactoKardex += ` | Devuelta: Apartada a Averías No Vendible (${prendaDevolver.sku})`;
    }

    // 3. Descuento reactivo inmediato en el estado local de inventario
    setInventarioTienda((prev) =>
      prev.map((p) => {
        if (p.sku === nuevaPrenda.sku) {
          return { ...p, stockDisponible: Math.max(0, p.stockDisponible - 1) };
        }
        if (
          estadoPrendaDevuelta === 'BUEN_ESTADO' &&
          prendaDevolver.categoria !== 'Cosméticos' &&
          p.sku === prendaDevolver.sku
        ) {
          return { ...p, stockDisponible: p.stockDisponible + 1 };
        }
        return p;
      })
    );

    // 4. Actualizar la prenda actualmente seleccionada
    setNuevaPrenda((prev) =>
      prev ? { ...prev, stockDisponible: Math.max(0, prev.stockDisponible - 1) } : null
    );

    const nuevoCambio: RegistroCambioRealizado = {
      id: `CAM-${Date.now().toString().slice(-4)}`,
      consecutivoFactura: facturaActual.consecutivo,
      fecha: 'Hoy · Recién procesado',
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
      observaciones: observacionCambio || 'Cambio registrado en mostrador.',
      impactoKardex,
      prendaDevueltaImg: prendaDevolver.imagenUrl,
      prendaEntregadaImg: nuevaPrenda.imagenUrl,
      estadoPrendaDevuelta,
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
    const sedeActiva = localStorage.getItem('forma_pos_sede') || 'Punto Centro (Cúcuta)';
    const vendedorNombre = usuarioActivo?.nombreCompleto || usuarioActivo?.nombre || 'Vendedor en Turno';

    recordPosExchange({
      id: nuevoCambio.id,
      consecutivoFactura: facturaActual.consecutivo,
      fecha: nuevoCambio.fecha,
      fechaIso: new Date().toISOString(),
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
      estadoPrendaDevuelta,
      valorDevueltoCop: prendaDevolver.precioNetoPagadoCop,
      valorEntregadoCop: nuevaPrenda.precioVentaCop,
      prendaDevueltaImg: prendaDevolver.imagenUrl,
      prendaEntregadaImg: nuevaPrenda.imagenUrl,
    });

    setCambiosRealizados((prev) => [nuevoCambio, ...prev]);
    setModalExito(nuevoCambio);
  };

  // Generar timeline de actividad para el DetailDrawer
  const timelineActividadDrawer = useMemo<ActivityTimelineItem[]>(() => {
    if (!cambioSeleccionadoDrawer) return [];
    return [
      {
        id: 'act-1',
        timestamp: 'Fecha de Emisión Original',
        title: `Factura Emitida ${cambioSeleccionadoDrawer.consecutivoFactura}`,
        description: `Venta registrada originalmente a nombre de ${cambioSeleccionadoDrawer.cliente}.`,
        user: 'Terminal Mostrador',
        type: 'neutral',
      },
      {
        id: 'act-2',
        timestamp: 'Hoy · Mostrador',
        title: 'Solicitud de Cambio Mano a Mano Presentada',
        description: `Cliente presenta la prenda por motivo: ${cambioSeleccionadoDrawer.motivo}.`,
        user: 'Cajero en Turno',
        type: 'info',
      },
      {
        id: 'act-3',
        timestamp: 'Inspección de Prenda',
        title: `Prenda Verificada: ${
          cambioSeleccionadoDrawer.estadoPrendaDevuelta === 'CON_IMPERFECTO'
            ? 'Con Imperfecto / Apartada a Averías'
            : 'En Buen Estado (Aprobada para reingreso)'
        }`,
        description: 'Inspección física y validación de restricción sanitaria RN-CAT-02 completadas.',
        user: 'Control de Calidad POS',
        type:
          cambioSeleccionadoDrawer.estadoPrendaDevuelta === 'CON_IMPERFECTO' ? 'warning' : 'success',
      },
      {
        id: 'act-4',
        timestamp: cambioSeleccionadoDrawer.fecha,
        title: `Liquidación Procesada: ${
          cambioSeleccionadoDrawer.tipoLiquidacion === 'MANO_A_MANO_0'
            ? '$0 COP (Cambio Exacto)'
            : cambioSeleccionadoDrawer.tipoLiquidacion === 'EXCEDENTE_COBRADO'
            ? `Excedente Cobrado: +${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP (${
                cambioSeleccionadoDrawer.medioPagoExcedente || 'Efectivo'
              })`
            : `Reintegro al Cliente: -${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP`
        }`,
        description: `Impacto en inventario: ${cambioSeleccionadoDrawer.impactoKardex || 'Kardex actualizado'}.`,
        user: 'Caja Principal',
        type: 'success',
      },
    ];
  }, [cambioSeleccionadoDrawer]);

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
          FLUJO DE 4 PASOS EN GRID
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
                    className="w-full min-h-[46px] pl-9 pr-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 min-h-[46px] rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] font-black text-xs transition-colors shrink-0"
                >
                  Buscar
                </button>
              </div>

              {/* Botones Rápidos de Facturas de Prueba */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-stone-500">Recientes:</span>
                {['MED-0041', 'MED-0042', 'MED-0040'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSeleccionarFacturaRapida(key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                      facturaSeleccionadaKey === key
                        ? 'bg-[#661521] text-white shadow-xs'
                        : 'bg-[#FAF7F4] text-stone-600 hover:bg-stone-200 border border-stone-300'
                    }`}
                  >
                    #{key}
                  </button>
                ))}
              </div>
            </form>

            {/* Ficha de la Factura Activa */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-1.5 text-xs">
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
          </section>

          {/* PASO 2: Selección de Prenda que Devuelve el Cliente */}
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
                  <span className="block text-[10px] text-stone-500">Reingresa a venta (+1 ud)</span>
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
                  <span className="block font-black">Prenda con Defecto</span>
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
          {/* PASO 3: Selección de Nueva Prenda en Tienda */}
          <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Seleccionar Nueva Prenda en Tienda
                </h2>
              </div>
            </div>

            {/* Buscador de Prendas en Inventario */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaInventario}
                onChange={(e) => setBusquedaInventario(e.target.value)}
                placeholder="Buscar prenda por nombre, talla, color o SKU..."
                className="w-full min-h-[46px] pl-9 pr-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
              />
            </div>

            {/* Grilla / Lista de Prendas Disponibles con Stock en Vivo */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {prendasInventarioFiltradas.map((item) => {
                const isSelected = nuevaPrenda?.sku === item.sku;
                const sinStock = item.stockDisponible <= 0;

                return (
                  <div
                    key={item.sku}
                    onClick={() => {
                      if (!sinStock) setNuevaPrenda(item);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                      sinStock
                        ? 'opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#661521]/10 border-[#661521] shadow-sm cursor-pointer'
                        : 'bg-[#FAF7F4] border-[#E5DDD3] hover:border-stone-400 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imagenUrl}
                        alt={item.nombre}
                        className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-[#1C1311] truncate">
                          {item.nombre}
                        </h4>
                        <p className="font-mono text-xs text-stone-600">
                          Talla: {item.talla} · Color: {item.color} · SKU: {item.sku}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs font-black text-[#661521]">
                            {formatCOP(item.precioVentaCop)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              item.stockDisponible > 2
                                ? 'bg-emerald-100 text-[#059669]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Stock: {item.stockDisponible} uds
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-auto ${
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
          </section>

          {/* PASO 4: Liquidación Automática y Confirmación */}
          <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#661521] text-white text-xs font-black flex items-center justify-center">
                  4
                </span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Liquidación Automática en Mostrador
                </h2>
              </div>
            </div>

            {/* Comparativa Financiera */}
            <div className="p-4 rounded-2xl bg-[#FAF7F4] border-2 border-[#E5DDD3] space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5DDD3]">
                <span className="text-stone-600">Valor Prenda Devuelta:</span>
                <span className="font-mono font-bold text-stone-800">
                  {formatCOP(valorPrendaDevueltaCop)} COP
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5DDD3]">
                <span className="text-stone-600">Valor Nueva Prenda:</span>
                <span className="font-mono font-bold text-stone-800">
                  {formatCOP(valorNuevaPrendaCop)} COP
                </span>
              </div>

              {/* Resultado de la Liquidación */}
              <div className="pt-1">
                {esManoAManoCero && (
                  <div className="p-3 rounded-xl bg-emerald-50 border-2 border-[#059669] text-[#059669] flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm block">
                        Caso A: Cambio Mano a Mano Exacto
                      </span>
                      <span className="text-xs text-stone-600">
                        Mismo valor o cambio de talla/color directo.
                      </span>
                    </div>
                    <span className="font-mono text-xl font-black text-[#059669]">$0 COP</span>
                  </div>
                )}

                {esExcedenteCliente && (
                  <div className="p-3 rounded-xl bg-amber-50 border-2 border-[#D19650] text-[#1C1311] flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm block text-[#661521]">
                        Caso B: Prenda de Mayor Valor
                      </span>
                      <span className="text-xs text-stone-600">Excedente a pagar por el cliente:</span>
                    </div>
                    <span className="font-mono text-xl font-black text-[#661521]">
                      +{formatCOP(diferenciaCop)} COP
                    </span>
                  </div>
                )}

                {esReintegroCliente && (
                  <div className="p-3 rounded-xl bg-blue-50 border-2 border-blue-400 text-[#1C1311] flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm block text-blue-900">
                        Caso C: Prenda de Menor Valor
                      </span>
                      <span className="text-xs text-stone-600">Diferencia a favor del cliente:</span>
                    </div>
                    <span className="font-mono text-xl font-black text-blue-900">
                      -{formatCOP(Math.abs(diferenciaCop))} COP
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Si hay excedente por cobrar: Selector de medio de pago */}
            {esExcedenteCliente && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Medio de Cobro del Excedente:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMedioCobroExcedente('EFECTIVO')}
                    className={`min-h-[44px] px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                      medioCobroExcedente === 'EFECTIVO'
                        ? 'bg-[#661521] text-white border-[#661521]'
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
          HISTORIAL DE CAMBIOS REALIZADOS (MASTER-DETAIL INTERACTIVO)
      ========================================================================= */}
      {cambiosRealizados.length > 0 && (
        <section className="mt-6 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#EFEAE4]">
            <div>
              <h3 className="text-base font-black text-[#1C1311]">
                Historial de Cambios Registrados ({cambiosRealizados.length})
              </h3>
              <p className="text-xs text-stone-500">
                Haz clic sobre cualquier cambio para consultar el desglose completo, motivo, Kardex y comprobante térmico.
              </p>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#661521] bg-[#661521]/10 px-3 py-1 rounded-full self-start sm:self-auto">
              Trazabilidad en Vivo
            </span>
          </div>

          <div className="space-y-2.5">
            {cambiosRealizados.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setCambioSeleccionadoDrawer(c);
                  setDrawerTab('detalle');
                }}
                className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] hover:border-[#661521] hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-all shadow-xs group"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#1C1311] group-hover:text-[#661521] transition-colors">
                      #{c.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-mono text-[10px] font-bold">
                      {c.consecutivoFactura}
                    </span>
                    <span className="text-stone-500">· {c.cliente}</span>
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
                        : `REINTEGRO -${formatCOP(c.diferenciaCop)}`}
                    </span>
                  </div>
                  <p className="text-stone-700 mt-1 truncate">
                    Devuelve: <strong>{c.prendaDevuelta}</strong> → Lleva:{' '}
                    <strong>{c.prendaEntregada}</strong>
                  </p>
                  <p className="text-stone-500 text-[11px] mt-0.5 truncate">
                    Motivo: <span className="font-medium text-stone-700">{c.motivo}</span>
                    {c.observaciones && ` · "${c.observaciones}"`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-[#1C1311] block">
                      {c.tipoLiquidacion === 'MANO_A_MANO_0' ? '$0 COP' : `${formatCOP(c.diferenciaCop)} COP`}
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
                : `Reintegro -${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP`,
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
                className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Reimprimir Comprobante de Cambio (80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => setCambioSeleccionadoDrawer(null)}
                className="min-h-[46px] px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          }
        >
          {/* Contenido Pestaña DETALLE */}
          <div className="space-y-4">
            {/* Tarjeta 1: Información de Factura y Cliente */}
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
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Cliente</span>
                  <span className="font-bold text-[#1C1311] block">{cambioSeleccionadoDrawer.cliente}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Fecha y Hora</span>
                  <span className="font-bold text-stone-700 block">{cambioSeleccionadoDrawer.fecha}</span>
                </div>
              </div>

              <div className="text-xs pt-1 text-stone-600">
                Sede: <strong>Punto Centro (Cúcuta)</strong> · Operador Mostrador
              </div>
            </div>

            {/* Tarjeta 2: Comparativa de Prendas (Devuelta vs Entregada) */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-600">
                Prendas Vinculadas al Cambio
              </h4>

              {/* Prenda Devuelta */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border-2 border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#661521]">
                    Prenda Devuelta por el Cliente
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#661521] border border-rose-300">
                    {cambioSeleccionadoDrawer.estadoPrendaDevuelta === 'CON_IMPERFECTO'
                      ? 'Con Avería / Averiada'
                      : 'Buen Estado / Reingreso'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {cambioSeleccionadoDrawer.prendaDevueltaImg && (
                    <img
                      src={cambioSeleccionadoDrawer.prendaDevueltaImg}
                      alt="Prenda devuelta"
                      className="w-14 h-14 rounded-xl object-cover border border-rose-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm text-[#1C1311] truncate">
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
                </div>

                <div className="pt-2 border-t border-rose-200/80 text-[11px] text-stone-700">
                  Motivo: <strong>{cambioSeleccionadoDrawer.motivo}</strong>
                </div>
              </div>

              {/* Prenda Entregada */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#059669]">
                    Nueva Prenda Entregada al Cliente
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#059669] border border-emerald-300">
                    Despachada de Stock Local (-1 ud)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {cambioSeleccionadoDrawer.prendaEntregadaImg && (
                    <img
                      src={cambioSeleccionadoDrawer.prendaEntregadaImg}
                      alt="Prenda entregada"
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm text-[#1C1311] truncate">
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
            </div>

            {/* Tarjeta 3: Liquidación Financiera */}
            <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-2.5">
              <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">
                Liquidación Contable de Mostrador
              </span>

              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#E5DDD3]">
                <span className="text-stone-600">Tipo de Liquidación:</span>
                <span className="font-bold text-[#1C1311]">
                  {cambioSeleccionadoDrawer.tipoLiquidacion === 'MANO_A_MANO_0'
                    ? 'Mano a Mano Directo'
                    : cambioSeleccionadoDrawer.tipoLiquidacion === 'EXCEDENTE_COBRADO'
                    ? 'Excedente a Favor de Tienda'
                    : 'Reintegro / Saldo a Favor'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-stone-700">Diferencia Neta Liquidada:</span>
                <span className="font-mono font-black text-base text-[#661521]">
                  {cambioSeleccionadoDrawer.tipoLiquidacion === 'MANO_A_MANO_0'
                    ? '$0 COP'
                    : `${formatCOP(cambioSeleccionadoDrawer.diferenciaCop)} COP`}
                </span>
              </div>

              {cambioSeleccionadoDrawer.medioPagoExcedente && (
                <div className="text-xs text-stone-600 pt-1">
                  Medio de Cobro del Excedente: <strong>{cambioSeleccionadoDrawer.medioPagoExcedente}</strong>
                </div>
              )}

              {cambioSeleccionadoDrawer.impactoKardex && (
                <div className="text-[11px] font-mono text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 mt-2">
                  <span className="block font-bold text-stone-500 text-[10px] uppercase">Impacto Kardex:</span>
                  {cambioSeleccionadoDrawer.impactoKardex}
                </div>
              )}
            </div>

            {/* Tarjeta 4: Observaciones */}
            {cambioSeleccionadoDrawer.observaciones && (
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-xs">
                <span className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                  Observaciones Registradas por el Cajero
                </span>
                <p className="text-stone-700 italic">"{cambioSeleccionadoDrawer.observaciones}"</p>
              </div>
            )}
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

              {modalExito.impactoKardex && (
                <div className="pt-2 border-t border-[#E5DDD3] text-[10px] font-mono text-stone-600">
                  <span className="font-bold text-stone-800">Kardex:</span> {modalExito.impactoKardex}
                </div>
              )}
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
