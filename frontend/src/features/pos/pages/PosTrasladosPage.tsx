import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Send,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Boxes,
  Search,
  History,
  MapPin,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  FileText,
  Truck,
} from 'lucide-react';
import { CATALOGO_INICIAL_POS, CATEGORIAS_POS, type CategoriaPOS } from '../PosTerminalPage';
import {
  applyStockDelta,
  getStockDelta,
  getPosRegisteredSales,
  getPosRegisteredExchanges,
} from '../utils/posLedgerSync';
import { DetailDrawer } from '../components/DetailDrawer';
import { mismaSede } from '../utils/webOrdersStore';

export type SubcategoriaInventarioSede = 'EXISTENCIAS' | 'SOLICITUD' | 'RECEPCION' | 'KARDEX';

export interface DesgloseTallaSolicitud {
  sku: string;
  talla: string;
  color?: string;
  cantidad: number;
}

export interface ProductoAgrupadoSolicitud {
  nombre: string;
  categoria: string;
  imagenUrl: string;
  variantes: Array<{
    sku: string;
    talla: string;
    color: string;
    stockSede: number;
    precioUnitarioCOP: number;
  }>;
}

export interface SolicitudTrasladoItem {
  id: string;
  codigo: string;
  fecha: string;
  fechaIso: string;
  sedeDestino: string;
  productoNombre: string;
  sku: string;
  talla: string;
  color: string;
  cantidad: number;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'EN_CAMINO' | 'RECIBIDA';
  desgloseTallas?: DesgloseTallaSolicitud[];
}

export interface LineaRecepcionTraslado {
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

export interface DespachoEntranteItem {
  id: string;
  adminTrasladoId?: number;
  codigo: string;
  origen: string;
  destino: string;
  fechaDespacho: string;
  estado: 'PENDIENTE_DESPACHO' | 'EN_TRANSITO' | 'RECIBIDO' | 'RECIBIDO_CON_NOVEDAD';
  observaciones: string;
  lineas: LineaRecepcionTraslado[];
}

export interface RecepcionKardexRecord {
  id: string;
  codigoDespacho: string;
  fecha: string;
  fechaIso: string;
  sede: string;
  sku: string;
  nombreProducto: string;
  talla: string;
  recibidasBuenas: number;
  recibidasDanadas: number;
  faltantes: number;
}

export interface MovimientoKardexSede {
  id: string;
  fecha: string;
  fechaIso: string;
  tipo: 'VENTA_POS' | 'CAMBIO_SALIDA' | 'CAMBIO_REINGRESO' | 'CAMBIO_AVERIA' | 'RECEPCION_TRASLADO';
  referencia: string;
  sku: string;
  nombreProducto: string;
  deltaVendible: number;
  detalle: string;
}

const STORAGE_KEYS_TRASLADOS = {
  SOLICITUDES_POS: 'forma_pos_solicitudes_traslado',
  ADMIN_TRASLADOS: 'forma_admin_traslados',
  RECEPCIONES_KARDEX: 'forma_pos_recepciones_kardex',
};

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

const formatFechaBogota = (iso?: string): string => {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(iso ? new Date(iso) : new Date());
  } catch {
    return 'Hoy · Turno Actual';
  }
};

const loadSolicitudesGuardadas = (): SolicitudTrasladoItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_TRASLADOS.SOLICITUDES_POS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSolicitudesGuardadas = (lista: SolicitudTrasladoItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS_TRASLADOS.SOLICITUDES_POS, JSON.stringify(lista));
  } catch {
    /* noop */
  }
};

const loadRecepcionesKardex = (): RecepcionKardexRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_TRASLADOS.RECEPCIONES_KARDEX);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRecepcionesKardex = (lista: RecepcionKardexRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS_TRASLADOS.RECEPCIONES_KARDEX, JSON.stringify(lista));
  } catch {
    /* noop */
  }
};

const loadDespachosFromAdminStorage = (sedeActiva: string): DespachoEntranteItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_TRASLADOS.ADMIN_TRASLADOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((t: any) => {
        if (!t.destinoNombre) return true;
        return mismaSede(t.destinoNombre, sedeActiva);
      })
      .map((t: any, idx: number) => {
        const estadoRaw = String(t.estado || 'PENDIENTE').toUpperCase();
        let estadoMapped: 'PENDIENTE_DESPACHO' | 'EN_TRANSITO' | 'RECIBIDO' | 'RECIBIDO_CON_NOVEDAD';
        if (estadoRaw === 'RECIBIDO') {
          estadoMapped = 'RECIBIDO';
        } else if (estadoRaw === 'RECIBIDO_CON_NOVEDAD') {
          estadoMapped = 'RECIBIDO_CON_NOVEDAD';
        } else if (estadoRaw === 'ENVIADO' || estadoRaw === 'EN_TRANSITO') {
          estadoMapped = 'EN_TRANSITO';
        } else {
          estadoMapped = 'PENDIENTE_DESPACHO';
        }

        const lineas: LineaRecepcionTraslado[] = Array.isArray(t.lineas)
          ? t.lineas.map((l: any, lIdx: number) => {
              const refCat = CATALOGO_INICIAL_POS.find(
                (c) => c.sku.toUpperCase() === String(l.sku || '').toUpperCase()
              );
              const cantEnv =
                Number(l.cantidadEnviada) ||
                Number(l.cantidadAprobada) ||
                Number(l.cantidadSolicitada) ||
                1;
              const recBuena =
                estadoMapped === 'EN_TRANSITO'
                  ? cantEnv
                  : Number(l.recibidaBuena ?? cantEnv);
              const recDanada =
                estadoMapped === 'EN_TRANSITO' ? 0 : Number(l.recibidaDanada ?? 0);

              return {
                id: String(l.id || `lin-${idx}-${lIdx}`),
                sku: String(l.sku || refCat?.sku || 'SKU-POS'),
                nombre: String(l.nombreProducto || l.nombre || refCat?.nombre || 'Prenda FORMA'),
                talla: refCat?.talla || 'Única',
                color: refCat?.color || 'Estándar',
                imagenUrl: refCat?.imagenUrl || '/products/blazer-imperial-vinotinto.png',
                cantidadEnviada: cantEnv,
                recibidasBuenas: recBuena,
                recibidasDanadas: recDanada,
              };
            })
          : [];

        return {
          id: String(t.id || `adm-tra-${idx}`),
          adminTrasladoId: Number(t.id) || undefined,
          codigo: String(t.codigo || `TRL-00${idx + 1}`),
          origen: String(t.origenNombre || 'Bodega Central'),
          destino: String(t.destinoNombre || sedeActiva),
          fechaDespacho: t.fechaEnvio
            ? formatFechaBogota(t.fechaEnvio)
            : t.fechaSolicitud
            ? formatFechaBogota(t.fechaSolicitud)
            : 'Hoy · Turno Actual',
          estado: estadoMapped,
          observaciones: String(t.observaciones || ''),
          lineas,
        };
      });
  } catch {
    return [];
  }
};

export const PosTrasladosPage: React.FC = () => {
  const sedeActiva = localStorage.getItem('forma_pos_sede') || 'Punto Centro (Cúcuta)';

  // 4 Subcategorías Superiores
  const [subcategoriaActiva, setSubcategoriaActiva] =
    useState<SubcategoriaInventarioSede>('EXISTENCIAS');

  // =========================================================================
  // ESTADO SUBCATEGORÍA 1: EXISTENCIAS EN TIENDA
  // =========================================================================
  const [busquedaExistencias, setBusquedaExistencias] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaPOS>('Todas');
  const [semaforoFiltro, setSemaforoFiltro] = useState<
    'TODOS' | 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO'
  >('TODOS');
  const [tickLedger, setTickLedger] = useState<number>(0);

  useEffect(() => {
    const refresh = () => {
      setTickLedger((n) => n + 1);
      setDespachosEntrantes(loadDespachosFromAdminStorage(sedeActiva));
      setSolicitudes(loadSolicitudesGuardadas());
      setRecepcionesKardex(loadRecepcionesKardex());
    };
    window.addEventListener('forma-pos-ledger-update', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('forma-pos-ledger-update', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [sedeActiva]);

  const inventarioSede = useMemo(() => {
    void tickLedger;
    return CATALOGO_INICIAL_POS.map((item) => {
      const stockActual = Math.max(0, item.stockSede + getStockDelta(item.sku));
      const estadoSemaforo: 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO' =
        stockActual === 0 ? 'AGOTADO' : stockActual <= 3 ? 'STOCK_BAJO' : 'DISPONIBLE';
      return {
        ...item,
        stockActual,
        estadoSemaforo,
      };
    });
  }, [tickLedger]);

  const existenciasFiltradas = useMemo(() => {
    const q = busquedaExistencias.trim().toLowerCase();
    return inventarioSede.filter((item) => {
      if (categoriaFiltro !== 'Todas' && item.categoria !== categoriaFiltro) return false;
      if (semaforoFiltro !== 'TODOS' && item.estadoSemaforo !== semaforoFiltro) return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.talla.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q)
      );
    });
  }, [inventarioSede, busquedaExistencias, categoriaFiltro, semaforoFiltro]);

  const resumenExistencias = useMemo(() => {
    let totalUnidades = 0;
    let disponibles = 0;
    let stockBajo = 0;
    let agotados = 0;
    for (const item of inventarioSede) {
      totalUnidades += item.stockActual;
      if (item.estadoSemaforo === 'DISPONIBLE') disponibles += 1;
      else if (item.estadoSemaforo === 'STOCK_BAJO') stockBajo += 1;
      else agotados += 1;
    }
    return {
      totalReferencias: inventarioSede.length,
      totalUnidades,
      disponibles,
      stockBajo,
      agotados,
    };
  }, [inventarioSede]);

  // =========================================================================
  // ESTADO SUBCATEGORÍA 2: SOLICITAR MERCANCÍA A CENTRAL (MULTI-TALLA REAL)
  // =========================================================================
  const productosAgrupadosSolicitud = useMemo<ProductoAgrupadoSolicitud[]>(() => {
    const map = new Map<string, ProductoAgrupadoSolicitud>();
    for (const v of CATALOGO_INICIAL_POS) {
      if (!map.has(v.nombre)) {
        map.set(v.nombre, {
          nombre: v.nombre,
          categoria: v.categoria,
          imagenUrl: v.imagenUrl,
          variantes: [],
        });
      }
      const prod = map.get(v.nombre)!;
      if (!prod.variantes.some((existente) => existente.sku === v.sku)) {
        prod.variantes.push({
          sku: v.sku,
          talla: v.talla,
          color: v.color,
          stockSede: v.stockSede,
          precioUnitarioCOP: v.precioUnitarioCOP,
        });
      }
    }
    return Array.from(map.values());
  }, []);

  const [productoSeleccionadoNombre, setProductoSeleccionadoNombre] = useState<string>(
    () => productosAgrupadosSolicitud[0]?.nombre || CATALOGO_INICIAL_POS[0]?.nombre || ''
  );

  const productoSeleccionado = useMemo(() => {
    return (
      productosAgrupadosSolicitud.find((p) => p.nombre === productoSeleccionadoNombre) ||
      productosAgrupadosSolicitud[0]
    );
  }, [productosAgrupadosSolicitud, productoSeleccionadoNombre]);

  // Cantidades pedidas para cada SKU del producto actual
  const [cantidadesPorSku, setCantidadesPorSku] = useState<Record<string, number>>({});

  const [, setSkuSeleccionadoSolicitud] = useState<string>(
    () => CATALOGO_INICIAL_POS[0]?.sku || ''
  );


  const [, setTallaSolicitud] = useState<string>(
    () => CATALOGO_INICIAL_POS[0]?.talla || 'M'
  );
  const [cantidadSolicitada] = useState<number>(5);
  const [motivoSolicitud, setMotivoSolicitud] = useState<string>(
    'Reposición por inventario bajo en mostrador'
  );
  const [mensajeSolicitudExito, setMensajeSolicitudExito] = useState<string | null>(null);

  const [solicitudes, setSolicitudes] = useState<SolicitudTrasladoItem[]>(() =>
    loadSolicitudesGuardadas()
  );

  // Variantes con cantidad > 0 del producto actual
  const variantesConCantidad = useMemo(() => {
    if (!productoSeleccionado) return [];
    return productoSeleccionado.variantes
      .map((v) => ({
        ...v,
        cantidad: cantidadesPorSku[v.sku] ?? 0,
      }))
      .filter((v) => v.cantidad > 0);
  }, [productoSeleccionado, cantidadesPorSku]);

  const totalUnidadesSolicitadas = useMemo(() => {
    return variantesConCantidad.reduce((sum, v) => sum + v.cantidad, 0);
  }, [variantesConCantidad]);

  // =========================================================================
  // ESTADO SUBCATEGORÍA 3: RECEPCIÓN DE DESPACHOS (CONECTADO A ADMIN STORAGE)
  // =========================================================================
  const [despachosEntrantes, setDespachosEntrantes] = useState<DespachoEntranteItem[]>(() =>
    loadDespachosFromAdminStorage(sedeActiva)
  );
  const despachosPendientes = useMemo(() => {
    return despachosEntrantes.filter((d) => d.estado === 'EN_TRANSITO');
  }, [despachosEntrantes]);
  const despachosRecibidos = useMemo(() => {
    return despachosEntrantes.filter(
      (d) => d.estado === 'RECIBIDO' || d.estado === 'RECIBIDO_CON_NOVEDAD'
    );
  }, [despachosEntrantes]);
  const [tabRecepcion, setTabRecepcion] = useState<'TRANSITO' | 'RECIBIDOS'>('TRANSITO');
  const [despachoParaRecepcionModal, setDespachoParaRecepcionModal] =
    useState<DespachoEntranteItem | null>(null);
  const [despachoDetalleDrawer, setDespachoDetalleDrawer] =
    useState<DespachoEntranteItem | null>(null);
  const [errorRecepcion, setErrorRecepcion] = useState<string | null>(null);
  const [mensajeRecepcionExito, setMensajeRecepcionExito] = useState<string | null>(null);

  // =========================================================================
  // ESTADO SUBCATEGORÍA 4: MOVIMIENTOS DE INVENTARIO (KARDEX SEDE)
  // =========================================================================
  const [recepcionesKardex, setRecepcionesKardex] = useState<RecepcionKardexRecord[]>(() =>
    loadRecepcionesKardex()
  );
  const [filtroKardex, setFiltroKardex] = useState<
    'TODOS' | 'VENTA_POS' | 'CAMBIOS' | 'RECEPCION_TRASLADO'
  >('TODOS');
  const [busquedaKardex, setBusquedaKardex] = useState<string>('');

  // Sincronización reactiva de las solicitudes con forma_admin_traslados
  const solicitudesSincronizadas = useMemo(() => {
    try {
      const rawAdmin = localStorage.getItem(STORAGE_KEYS_TRASLADOS.ADMIN_TRASLADOS);
      const adminList = rawAdmin ? JSON.parse(rawAdmin) : [];
      if (!Array.isArray(adminList)) return solicitudes;

      return solicitudes.map((sol) => {
        const matchAdmin = adminList.find(
          (a: any) =>
            String(a.codigo || '').toUpperCase() === String(sol.codigo || '').toUpperCase() ||
            Number(a.id) === Number(sol.id.replace('sol-', ''))
        );
        if (!matchAdmin) return sol;
        const admEstado = String(matchAdmin.estado || '').toUpperCase();
        if (admEstado === 'RECIBIDO' || admEstado === 'RECIBIDO_CON_NOVEDAD') {
          return { ...sol, estado: 'RECIBIDA' as const };
        }
        if (admEstado === 'ENVIADO' || admEstado === 'EN_TRANSITO') {
          return { ...sol, estado: 'EN_CAMINO' as const };
        }
        return { ...sol, estado: 'APROBADA' as const };
      });
    } catch {
      return solicitudes;
    }
  }, [solicitudes, tickLedger]);

  // Registro seleccionado para el DetailDrawer en Subcategoría 4
  const [selectedKardexMovimiento, setSelectedKardexMovimiento] =
    useState<MovimientoKardexSede | null>(null);
  const [drawerTabKardex, setDrawerTabKardex] = useState<
    'detalle' | 'prendas' | 'observaciones'
  >('detalle');

  // Crear solicitud de mercancía a Bodega Central y sincronizar con forma_admin_traslados
  const handleCrearSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) return;

    // Si tiene cantidades en la matriz multi-talla, las procesa; de lo contrario usa fallback
    const itemsSolicitados =
      variantesConCantidad.length > 0
        ? variantesConCantidad
        : productoSeleccionado.variantes.slice(0, 1).map((v) => ({
            ...v,
            cantidad: Math.max(1, cantidadSolicitada),
          }));

    const totalUnidades = itemsSolicitados.reduce((acc, it) => acc + it.cantidad, 0);
    if (totalUnidades <= 0) {
      alert('Por favor asigna al menos 1 unidad en alguna talla para enviar la solicitud.');
      return;
    }

    const nowIso = new Date().toISOString();
    const rawAdmin = localStorage.getItem(STORAGE_KEYS_TRASLADOS.ADMIN_TRASLADOS);
    const actualesAdmin = rawAdmin ? JSON.parse(rawAdmin) : [];
    const arrAdmin = Array.isArray(actualesAdmin) ? actualesAdmin : [];

    const nextNum = arrAdmin.length + 1;
    const codigoCanonica = `TRL-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
    const nuevoTrasladoId = Date.now();

    const desgloseTallas: DesgloseTallaSolicitud[] = itemsSolicitados.map((it) => ({
      sku: it.sku,
      talla: it.talla,
      color: it.color,
      cantidad: it.cantidad,
    }));

    const tallasResumenTexto = desgloseTallas
      .map((t) => `${t.talla} (${t.cantidad})`)
      .join(', ');

    const primeraVar = itemsSolicitados[0];

    const nuevaSol: SolicitudTrasladoItem = {
      id: `sol-${nuevoTrasladoId}`,
      codigo: codigoCanonica,
      fecha: `Hoy · ${formatFechaBogota(nowIso)}`,
      fechaIso: nowIso,
      sedeDestino: sedeActiva,
      productoNombre: productoSeleccionado.nombre,
      sku: itemsSolicitados.length === 1 ? primeraVar.sku : `MULTI-${itemsSolicitados.length}TALLAS`,
      talla: tallasResumenTexto,
      color: itemsSolicitados.length === 1 ? primeraVar.color : 'Variados',
      cantidad: totalUnidades,
      motivo: motivoSolicitud.trim() || 'Reposición regular de tienda',
      estado: 'APROBADA',
      desgloseTallas,
    };

    const nuevasSolicitudes = [nuevaSol, ...solicitudes];
    setSolicitudes(nuevasSolicitudes);
    saveSolicitudesGuardadas(nuevasSolicitudes);

    // Sincronizar en forma_admin_traslados como una única entidad canónica TRL
    try {
      const lineasTraslado = itemsSolicitados.map((it, idx) => ({
        id: nuevoTrasladoId + idx + 1,
        varianteId: idx + 1,
        sku: it.sku,
        nombreProducto: `${productoSeleccionado.nombre} (Talla ${it.talla})`,
        cantidadSolicitada: it.cantidad,
        cantidadAprobada: it.cantidad,
        cantidadEnviada: 0,
        recibidaBuena: 0,
        recibidaDanada: 0,
      }));

      const nuevoAdminTraslado = {
        id: nuevoTrasladoId,
        codigo: codigoCanonica,
        origenId: 1,
        origenNombre: 'Bodega Central',
        destinoId: 2,
        destinoNombre: sedeActiva,
        estado: 'APROBADO',
        fechaSolicitud: nowIso,
        observaciones: nuevaSol.motivo,
        lineas: lineasTraslado,
      };

      const nuevosAdmin = [nuevoAdminTraslado, ...arrAdmin];
      localStorage.setItem(STORAGE_KEYS_TRASLADOS.ADMIN_TRASLADOS, JSON.stringify(nuevosAdmin));
      window.dispatchEvent(new Event('forma-pos-ledger-update'));
      window.dispatchEvent(new Event('storage'));
      setDespachosEntrantes(loadDespachosFromAdminStorage(sedeActiva));
    } catch {
      /* noop */
    }

    setMensajeSolicitudExito(
      `Solicitud ${nuevaSol.codigo} enviada a Bodega Central: ${totalUnidades} unidades de ${productoSeleccionado.nombre} en ${itemsSolicitados.length} tallas (${tallasResumenTexto}).`
    );

    // Limpiar formulario para el siguiente pedido
    const resetObj: Record<string, number> = {};
    productoSeleccionado.variantes.forEach((v) => {
      resetObj[v.sku] = 0;
    });
    setCantidadesPorSku((prev) => ({ ...prev, ...resetObj }));

    setTimeout(() => setMensajeSolicitudExito(null), 6000);
  };

  // Ajustar conteo de unidades buenas y con avería dentro del Modal de Recepción
  const handleAjustarConteoEnModal = (
    lineaId: string,
    campo: 'recibidasBuenas' | 'recibidasDanadas',
    delta: number
  ) => {
    setErrorRecepcion(null);
    setDespachoParaRecepcionModal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lineas: prev.lineas.map((lin) => {
          if (lin.id !== lineaId) return lin;
          const nuevo = Math.max(0, lin[campo] + delta);
          const otro =
            campo === 'recibidasBuenas' ? lin.recibidasDanadas : lin.recibidasBuenas;
          if (nuevo + otro > lin.cantidadEnviada) {
            setErrorRecepcion(
              `La suma de buenas (${campo === 'recibidasBuenas' ? nuevo : lin.recibidasBuenas}) y averías (${
                campo === 'recibidasDanadas' ? nuevo : lin.recibidasDanadas
              }) no puede superar la cantidad enviada (${lin.cantidadEnviada}).`
            );
            return lin;
          }
          return { ...lin, [campo]: nuevo };
        }),
      };
    });
  };

  const handleUpdateObservacionModal = (texto: string) => {
    setDespachoParaRecepcionModal((prev) => (prev ? { ...prev, observaciones: texto } : null));
  };

  // Confirmar recepción de mercancía sumando las unidades buenas al stock físico de la sede
  const handleConfirmarRecepcion = (trasladoId: string) => {
    setErrorRecepcion(null);
    setMensajeRecepcionExito(null);

    const target =
      despachoParaRecepcionModal && (despachoParaRecepcionModal.id === trasladoId || despachoParaRecepcionModal.codigo === trasladoId)
        ? despachoParaRecepcionModal
        : despachosEntrantes.find((t) => t.id === trasladoId || t.codigo === trasladoId);

    if (!target || target.estado !== 'EN_TRANSITO') return;

    const tieneDanadas = target.lineas.some((l) => l.recibidasDanadas > 0);
    const tieneFaltantes = target.lineas.some(
      (l) => l.recibidasBuenas + l.recibidasDanadas < l.cantidadEnviada
    );

    if ((tieneDanadas || tieneFaltantes) && !target.observaciones.trim()) {
      setErrorRecepcion(
        `El despacho ${target.codigo} presenta novedades (averías o faltantes). Registra la observación antes de confirmar.`
      );
      return;
    }

    const nuevoEstado: 'RECIBIDO' | 'RECIBIDO_CON_NOVEDAD' =
      tieneDanadas || tieneFaltantes ? 'RECIBIDO_CON_NOVEDAD' : 'RECIBIDO';

    // 1. Impacto real en el inventario del punto de venta: sumar recibidasBuenas con applyStockDelta
    const nowIso = new Date().toISOString();
    const fechaBogota = formatFechaBogota(nowIso);
    const nuevasRecepcionesKardex: RecepcionKardexRecord[] = [];
    let totalBuenasSumadas = 0;

    target.lineas.forEach((linea) => {
      if (linea.recibidasBuenas > 0) {
        applyStockDelta(linea.sku, +linea.recibidasBuenas);
        applyStockDelta(`${sedeActiva}::${linea.sku}`, +linea.recibidasBuenas);
        totalBuenasSumadas += linea.recibidasBuenas;
      }
      if (linea.recibidasDanadas > 0) {
        applyStockDelta(`${sedeActiva}::AVERIA::${linea.sku}`, +linea.recibidasDanadas);
      }
      // NOTA CANÓNICA: NO se descuenta Bodega Central aquí porque ya fue descontada al momento del despacho en Admin.
      const faltantes = Math.max(
        0,
        linea.cantidadEnviada - (linea.recibidasBuenas + linea.recibidasDanadas)
      );
      nuevasRecepcionesKardex.push({
        id: `rec-kdx-${Date.now()}-${linea.sku}`,
        codigoDespacho: target.codigo,
        fecha: `Hoy · ${fechaBogota}`,
        fechaIso: nowIso,
        sede: sedeActiva,
        sku: linea.sku,
        nombreProducto: linea.nombre,
        talla: linea.talla,
        recibidasBuenas: linea.recibidasBuenas,
        recibidasDanadas: linea.recibidasDanadas,
        faltantes,
      });
    });

    const kardexActualizado = [...nuevasRecepcionesKardex, ...recepcionesKardex];
    setRecepcionesKardex(kardexActualizado);
    saveRecepcionesKardex(kardexActualizado);

    // 2. Actualizar estado en forma_admin_traslados
    try {
      const rawAdmin = localStorage.getItem(STORAGE_KEYS_TRASLADOS.ADMIN_TRASLADOS);
      const actualesAdmin = rawAdmin ? JSON.parse(rawAdmin) : [];
      if (Array.isArray(actualesAdmin)) {
        const actualizados = actualesAdmin.map((t: any) => {
          if (String(t.id) !== String(target.id) && String(t.codigo) !== String(target.codigo)) {
            return t;
          }
          return {
            ...t,
            estado: nuevoEstado,
            fechaRecepcion: nowIso,
            observaciones: target.observaciones,
            lineas: Array.isArray(t.lineas)
              ? t.lineas.map((l: any) => {
                  const matchLin = target.lineas.find(
                    (tl) => tl.sku.toUpperCase() === String(l.sku || '').toUpperCase()
                  );
                  if (!matchLin) return l;
                  return {
                    ...l,
                    recibidaBuena: matchLin.recibidasBuenas,
                    recibidaDanada: matchLin.recibidasDanadas,
                  };
                })
              : [],
          };
        });
        localStorage.setItem(STORAGE_KEYS_TRASLADOS.ADMIN_TRASLADOS, JSON.stringify(actualizados));
        window.dispatchEvent(new Event('forma-pos-ledger-update'));
        window.dispatchEvent(new Event('storage'));
      }
    } catch {
      /* noop */
    }

    setDespachoParaRecepcionModal(null);
    setDespachosEntrantes(loadDespachosFromAdminStorage(sedeActiva));
    setTickLedger((n) => n + 1);
    setMensajeRecepcionExito(
      `Recepción confirmada para ${target.codigo}: +${totalBuenasSumadas} unidades incorporadas al inventario disponible de ${sedeActiva}.`
    );
  };

  // =========================================================================
  // BITÁCORA UNIFICADA DE MOVIMIENTOS DE INVENTARIO (KARDEX SEDE)
  // =========================================================================
  const movimientosKardex = useMemo<MovimientoKardexSede[]>(() => {
    void tickLedger;
    const lista: MovimientoKardexSede[] = [];

    // 1. Recepciones de traslado (+)
    recepcionesKardex.forEach((r) => {
      lista.push({
        id: r.id,
        fecha: r.fecha,
        fechaIso: r.fechaIso,
        tipo: 'RECEPCION_TRASLADO',
        referencia: `#${r.codigoDespacho}`,
        sku: r.sku,
        nombreProducto: `${r.nombreProducto} (Talla ${r.talla})`,
        deltaVendible: +r.recibidasBuenas,
        detalle: `Entrada por recepción desde Bodega Central (+${r.recibidasBuenas} buenas${
          r.recibidasDanadas > 0 ? `, ${r.recibidasDanadas} con avería` : ''
        }${r.faltantes > 0 ? `, ${r.faltantes} faltantes` : ''})`,
      });
    });

    // 2. Cambios registrados (-1 entregada, +1 reingreso o 0 avería)
    const cambios = getPosRegisteredExchanges();
    cambios.forEach((c) => {
      const iso = c.fechaIso || new Date().toISOString();
      if (c.prendaEntregadaSku) {
        lista.push({
          id: `kdx-cam-out-${c.id}`,
          fecha: c.fecha,
          fechaIso: iso,
          tipo: 'CAMBIO_SALIDA',
          referencia: `#${c.id} (${c.consecutivoFactura})`,
          sku: c.prendaEntregadaSku,
          nombreProducto: c.prendaEntregada,
          deltaVendible: -1,
          detalle: `Prenda entregada en cambio (${c.motivo})`,
        });
      }
      if (c.prendaDevueltaSku) {
        const esAveria =
          c.estadoPrendaDevuelta === 'CON_IMPERFECTO' || c.motivo === 'Prenda con imperfecto';
        lista.push({
          id: `kdx-cam-in-${c.id}`,
          fecha: c.fecha,
          fechaIso: iso,
          tipo: esAveria ? 'CAMBIO_AVERIA' : 'CAMBIO_REINGRESO',
          referencia: `#${c.id} (${c.consecutivoFactura})`,
          sku: c.prendaDevueltaSku,
          nombreProducto: c.prendaDevuelta,
          deltaVendible: esAveria ? 0 : +1,
          detalle: esAveria
            ? 'Prenda devuelta con imperfecto → Stock Averías / No Vendible (0 en vendible)'
            : 'Prenda devuelta en buen estado → Reingreso a Stock Vendible (+1 ud)',
        });
      }
    });

    // 3. Ventas POS (-)
    const ventas = getPosRegisteredSales();
    ventas.forEach((v) => {
      const iso = v.fechaIso || new Date().toISOString();
      const items = v.prendas || v.items || [];
      items.forEach((it, idx) => {
        const cant = Math.max(1, it.cantidad || 1);
        lista.push({
          id: `kdx-vta-${v.consecutivo}-${idx}`,
          fecha: v.fechaHora || 'Hoy · Turno Actual',
          fechaIso: iso,
          tipo: 'VENTA_POS',
          referencia: v.consecutivo.startsWith('#') ? v.consecutivo : `#${v.consecutivo}`,
          sku: it.sku,
          nombreProducto: `${it.nombre}${it.talla ? ` (Talla ${it.talla})` : ''}`,
          deltaVendible: -cant,
          detalle: `Salida por venta en mostrador POS a ${v.cliente || 'Consumidor Final'}`,
        });
      });
    });

    return lista;
  }, [recepcionesKardex, tickLedger]);

  const movimientosKardexFiltrados = useMemo(() => {
    const q = busquedaKardex.trim().toLowerCase();
    return movimientosKardex.filter((m) => {
      if (filtroKardex === 'VENTA_POS' && m.tipo !== 'VENTA_POS') return false;
      if (
        filtroKardex === 'CAMBIOS' &&
        m.tipo !== 'CAMBIO_SALIDA' &&
        m.tipo !== 'CAMBIO_REINGRESO' &&
        m.tipo !== 'CAMBIO_AVERIA'
      ) {
        return false;
      }
      if (filtroKardex === 'RECEPCION_TRASLADO' && m.tipo !== 'RECEPCION_TRASLADO') return false;
      if (!q) return true;
      return (
        m.sku.toLowerCase().includes(q) ||
        m.nombreProducto.toLowerCase().includes(q) ||
        m.referencia.toLowerCase().includes(q) ||
        m.detalle.toLowerCase().includes(q)
      );
    });
  }, [movimientosKardex, filtroKardex, busquedaKardex]);

  const despachosPendientesCount = despachosEntrantes.filter(
    (d) => d.estado === 'EN_TRANSITO'
  ).length;

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-2.5 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA Y 4 SUBCATEGORÍAS DE INVENTARIO EN SEDE
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EFEAE4]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              <ArrowLeftRight className="w-5 h-5 text-[#D19650]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-[10px] font-black uppercase">
                  Inventario Sede
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-xs font-extrabold">
                  {resumenExistencias.totalUnidades} Unidades en Tienda
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[#1C1311] tracking-tight mt-0.5">
                Inventario del Punto y Traslados con Bodega Central
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

        {/* 4 Subcategorías (Pestañas Superiores Limpias) */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          <button
            type="button"
            onClick={() => setSubcategoriaActiva('EXISTENCIAS')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
              subcategoriaActiva === 'EXISTENCIAS'
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <Boxes className="w-4 h-4 text-[#D19650]" />
            <span>1. Existencias en Tienda ({resumenExistencias.totalReferencias})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubcategoriaActiva('SOLICITUD')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
              subcategoriaActiva === 'SOLICITUD'
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <Send className="w-4 h-4 text-[#D19650]" />
            <span>2. Solicitar Mercancía a Central ({solicitudes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubcategoriaActiva('RECEPCION')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
              subcategoriaActiva === 'RECEPCION'
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-[#D19650]" />
            <span>
              3. Recepción de Despachos ({despachosPendientesCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubcategoriaActiva('KARDEX')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
              subcategoriaActiva === 'KARDEX'
                ? 'bg-[#661521] text-white border-[#661521] shadow-xs'
                : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
            }`}
          >
            <History className="w-4 h-4 text-[#D19650]" />
            <span>4. Movimientos de Inventario (Kardex Sede)</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          SUBCATEGORÍA 1: EXISTENCIAS EN TIENDA
      ========================================================================= */}
      {subcategoriaActiva === 'EXISTENCIAS' && (
        <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
          {/* Buscador, Filtro por Categoría y Semáforos */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={busquedaExistencias}
                onChange={(e) => setBusquedaExistencias(e.target.value)}
                placeholder="Buscar prenda por nombre, SKU, talla o color..."
                className="w-full min-h-[42px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'TODOS' as const, label: 'Todos los Estados' },
                { id: 'DISPONIBLE' as const, label: `Disponible (${resumenExistencias.disponibles})` },
                { id: 'STOCK_BAJO' as const, label: `Stock Bajo (${resumenExistencias.stockBajo})` },
                { id: 'AGOTADO' as const, label: `Agotado (${resumenExistencias.agotados})` },
              ].map((sem) => (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => setSemaforoFiltro(sem.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    semaforoFiltro === sem.id
                      ? 'bg-[#1C1311] text-[#D19650] border-[#1C1311]'
                      : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6] hover:bg-stone-200/60'
                  }`}
                >
                  {sem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Píldoras de Categoría */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#EFEAE4]">
            <span className="text-[11px] font-bold text-stone-500 mr-1">Categoría:</span>
            {CATEGORIAS_POS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  categoriaFiltro === cat
                    ? 'bg-[#661521] text-white border-[#661521]'
                    : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6] hover:bg-stone-200/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tabla Limpia de Existencias en Tienda */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5DDD3] text-[10px] font-black uppercase text-stone-500 bg-[#FAF7F4]">
                  <th className="py-2.5 px-3 rounded-tl-xl">Prenda / Variante</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Talla · Color</th>
                  <th className="py-2.5 px-3 text-right">Precio Venta</th>
                  <th className="py-2.5 px-3 text-center">Stock Físico</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right rounded-tr-xl">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE4]">
                {existenciasFiltradas.map((item) => (
                  <tr key={item.sku} className="hover:bg-[#FAF7F4] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.imagenUrl}
                          alt={item.nombre}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0 bg-white"
                        />
                        <span className="font-black text-[#1C1311]">{item.nombre}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-700">{item.sku}</td>
                    <td className="py-2.5 px-3 text-stone-600 font-semibold">{item.categoria}</td>
                    <td className="py-2.5 px-3 text-stone-700">
                      Talla <strong>{item.talla}</strong> · {item.color}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-[#1C1311]">
                      {formatCOP(item.precioUnitarioCOP)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-sm font-black text-[#1C1311]">
                      {item.stockActual} uds
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.estadoSemaforo === 'DISPONIBLE' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-[#059669] border border-emerald-300">
                          Disponible
                        </span>
                      )}
                      {item.estadoSemaforo === 'STOCK_BAJO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                          Stock Bajo
                        </span>
                      )}
                      {item.estadoSemaforo === 'AGOTADO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-[#661521] border border-rose-300">
                          Agotado
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSkuSeleccionadoSolicitud(item.sku);
                          setTallaSolicitud(item.talla);
                          setSubcategoriaActiva('SOLICITUD');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F4] hover:bg-[#661521] text-[#661521] hover:text-white border border-[#661521]/30 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Solicitar a Central
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================================================
          SUBCATEGORÍA 2: SOLICITAR MERCANCÍA A CENTRAL
      ========================================================================= */}
      {subcategoriaActiva === 'SOLICITUD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Formulario de Solicitud (5 Columnas) */}
          <section className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
            <div className="pb-2 border-b border-[#EFEAE4]">
              <span className="text-xs font-bold uppercase text-stone-500">
                Pedido Interno a Bodega Central
              </span>
              <h2 className="text-base font-black text-[#1C1311]">
                Solicitar Mercancía a Bodega Central
              </h2>
            </div>

            <form onSubmit={handleCrearSolicitud} className="space-y-4">
              {/* Producto a Solicitar */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Producto a Solicitar:
                </label>
                <select
                  value={productoSeleccionadoNombre}
                  onChange={(e) => {
                    const nom = e.target.value;
                    setProductoSeleccionadoNombre(nom);
                    const prod = productosAgrupadosSolicitud.find((p) => p.nombre === nom);
                    if (prod && prod.variantes.length > 0) {
                      setSkuSeleccionadoSolicitud(prod.variantes[0].sku);
                      setTallaSolicitud(prod.variantes[0].talla);
                    }
                  }}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-bold text-[#1C1311] focus:outline-none focus:border-[#661521]"
                >
                  {productosAgrupadosSolicitud.map((p) => (
                    <option key={p.nombre} value={p.nombre}>
                      {p.nombre} ({p.categoria} · {p.variantes.length} {p.variantes.length === 1 ? 'talla' : 'tallas'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Matriz Multi-Talla de Cantidades */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-stone-700">
                    Tallas y Cantidades a Pedir:
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const upd: Record<string, number> = {};
                        productoSeleccionado?.variantes.forEach((v) => (upd[v.sku] = 5));
                        setCantidadesPorSku((prev) => ({ ...prev, ...upd }));
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#FAF7F4] hover:bg-stone-200 border border-[#D8CFC6] font-bold text-[#661521] cursor-pointer"
                    >
                      5 c/u
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const upd: Record<string, number> = {};
                        productoSeleccionado?.variantes.forEach((v) => (upd[v.sku] = 10));
                        setCantidadesPorSku((prev) => ({ ...prev, ...upd }));
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#FAF7F4] hover:bg-stone-200 border border-[#D8CFC6] font-bold text-[#661521] cursor-pointer"
                    >
                      10 c/u
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const upd: Record<string, number> = {};
                        productoSeleccionado?.variantes.forEach((v) => (upd[v.sku] = 0));
                        setCantidadesPorSku((prev) => ({ ...prev, ...upd }));
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {productoSeleccionado?.variantes.map((v) => {
                    const cant = cantidadesPorSku[v.sku] ?? 0;
                    return (
                      <div
                        key={v.sku}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          cant > 0
                            ? 'bg-[#661521]/5 border-[#661521]/40 shadow-2xs'
                            : 'bg-[#FAF7F4] border-[#E5DDD3]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-[#1C1311]">
                              Talla {v.talla}
                            </span>
                            <span className="text-[11px] text-stone-500 truncate">
                              · {v.color}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-stone-400 mt-0.5 truncate">
                            {v.sku} · Stock en tienda: {v.stockSede} uds
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const actual = cantidadesPorSku[v.sku] ?? 0;
                              setCantidadesPorSku((prev) => ({
                                ...prev,
                                [v.sku]: Math.max(0, actual - 1),
                              }));
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-[#D8CFC6] flex items-center justify-center text-stone-700 hover:bg-stone-200 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={cant}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0);
                              setCantidadesPorSku((prev) => ({
                                ...prev,
                                [v.sku]: val,
                              }));
                            }}
                            className="w-12 h-7 rounded-lg bg-white border border-[#D8CFC6] font-mono text-center text-xs font-black text-[#1C1311] focus:outline-none focus:border-[#661521]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const actual = cantidadesPorSku[v.sku] ?? 0;
                              setCantidadesPorSku((prev) => ({
                                ...prev,
                                [v.sku]: Math.min(200, actual + 1),
                              }));
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-[#D8CFC6] flex items-center justify-center text-stone-700 hover:bg-stone-200 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const actual = cantidadesPorSku[v.sku] ?? 0;
                              setCantidadesPorSku((prev) => ({
                                ...prev,
                                [v.sku]: Math.min(200, actual + 5),
                              }));
                            }}
                            className="px-1.5 py-1 rounded bg-stone-200/80 hover:bg-stone-300 text-[10px] font-bold text-stone-800 cursor-pointer ml-0.5"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen del Lote */}
                <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-semibold">Total a pedir:</span>
                  <span className="font-mono font-black text-sm text-[#661521]">
                    {totalUnidadesSolicitadas} unidades
                    {variantesConCantidad.length > 0 && (
                      <span className="font-normal text-xs text-stone-500 ml-1">
                        ({variantesConCantidad.length} {variantesConCantidad.length === 1 ? 'talla' : 'tallas'})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Motivo de la Solicitud:
                </label>
                <input
                  type="text"
                  value={motivoSolicitud}
                  onChange={(e) => setMotivoSolicitud(e.target.value)}
                  placeholder="Ej. Reposición por stock agotado en mostrador..."
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
                />
              </div>

              <button
                type="submit"
                disabled={totalUnidadesSolicitadas === 0}
                className="w-full min-h-[52px] px-5 rounded-2xl bg-[#661521] hover:bg-[#52101a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#D19650]" />
                <span>
                  Enviar Solicitud a Bodega Central ({totalUnidadesSolicitadas} uds)
                </span>
              </button>

              {mensajeSolicitudExito && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{mensajeSolicitudExito}</span>
                </div>
              )}
            </form>
          </section>

          {/* Listado de Solicitudes Enviadas en el Turno (7 Columnas) */}
          <section className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE4]">
              <div>
                <span className="text-xs font-bold uppercase text-stone-500">
                  Trazabilidad del Turno
                </span>
                <h2 className="text-base font-black text-[#1C1311]">
                  Solicitudes Enviadas a Bodega Central ({solicitudesSincronizadas.length})
                </h2>
              </div>
              {solicitudesSincronizadas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSubcategoriaActiva('RECEPCION')}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F4] hover:bg-stone-200 border border-[#D8CFC6] text-xs font-bold text-[#661521] cursor-pointer"
                >
                  Ir a Recepción de Despachos →
                </button>
              )}
            </div>

            {solicitudesSincronizadas.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#FAF7F4] border border-dashed border-[#D8CFC6] text-center space-y-2">
                <Send className="w-9 h-9 text-stone-300 mx-auto" />
                <p className="text-sm font-black text-[#1C1311]">
                  Aún no se han enviado solicitudes de mercancía en este turno
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Completa el formulario de la izquierda y pulsa &ldquo;Enviar Solicitud a Bodega
                  Central&rdquo; para solicitar reabastecimiento hacia {sedeActiva}.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {solicitudesSincronizadas.map((sol) => (
                  <div
                    key={sol.id}
                    className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#1C1311]">
                          #{sol.codigo}
                        </span>
                        <span className="text-stone-500">· {sol.fecha}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-[#059669] border border-emerald-300">
                          Enviada a Bodega Central
                        </span>
                      </div>

                      <p className="font-black text-sm text-[#1C1311] mt-1">
                        {sol.productoNombre}
                        {!sol.desgloseTallas?.length && sol.talla ? ` (Talla ${sol.talla})` : ''}
                      </p>

                      {sol.desgloseTallas && sol.desgloseTallas.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {sol.desgloseTallas.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200/80 border border-stone-300/70 text-[11px] font-medium text-stone-800"
                            >
                              <span className="font-bold text-stone-600">Talla {item.talla}:</span>
                              <span className="font-mono font-black text-[#661521]">{item.cantidad} uds</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-stone-600 mt-1">
                        Total Solicitado: <strong>{sol.cantidad} unidades</strong> · Motivo: {sol.motivo}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className="font-mono text-xs font-bold text-stone-500 block">
                        {sol.desgloseTallas && sol.desgloseTallas.length > 1
                          ? `${sol.desgloseTallas.length} SKUs (${sol.cantidad} uds)`
                          : `SKU: ${sol.sku}`}
                      </span>
                      {sol.estado === 'RECIBIDA' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-[#059669] font-black text-[11px] border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Recibida en Tienda</span>
                        </span>
                      ) : sol.estado === 'EN_CAMINO' ? (
                        <button
                          type="button"
                          onClick={() => setSubcategoriaActiva('RECEPCION')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#661521] hover:bg-stone-800 text-white font-bold text-[11px] cursor-pointer transition-colors"
                        >
                          <Truck className="w-3 h-3" />
                          <span>En Tránsito · Recibir →</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-bold text-[11px] border border-amber-200">
                          ⏳ Pendiente Despacho en Central
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* =========================================================================
          SUBCATEGORÍA 3: RECEPCIÓN DE DESPACHOS (TABLA COMPACTA + MODAL DEDICADO)
      ========================================================================= */}
      {subcategoriaActiva === 'RECEPCION' && (
        <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
            <div>
              <h2 className="text-base font-black text-[#1C1311]">
                Control y Recepción de Despachos Entrantes
              </h2>
              <p className="text-xs text-stone-500">
                Verifica físicamente los traslados enviados desde Bodega Central hacia {sedeActiva} antes de ingresarlos al inventario.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTabRecepcion('TRANSITO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tabRecepcion === 'TRANSITO'
                    ? 'bg-[#661521] text-white shadow-sm'
                    : 'bg-[#FAF7F4] text-stone-600 hover:bg-stone-200 border border-[#D8CFC6]'
                }`}
              >
                1. Despachos en Tránsito ({despachosPendientes.length})
              </button>
              <button
                type="button"
                onClick={() => setTabRecepcion('RECIBIDOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tabRecepcion === 'RECIBIDOS'
                    ? 'bg-[#661521] text-white shadow-sm'
                    : 'bg-[#FAF7F4] text-stone-600 hover:bg-stone-200 border border-[#D8CFC6]'
                }`}
              >
                2. Historial de Despachos Recibidos ({despachosRecibidos.length})
              </button>
            </div>
          </div>

          {errorRecepcion && (
            <div className="p-3.5 rounded-xl bg-red-50 border-2 border-[#661521] text-[#661521] text-xs font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorRecepcion}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorRecepcion(null)}
                className="px-2.5 py-1 rounded bg-[#661521] text-white text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          )}

          {mensajeRecepcionExito && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-[#059669] text-[#059669] text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mensajeRecepcionExito}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMensajeRecepcionExito(null);
                    setSubcategoriaActiva('KARDEX');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#661521] text-white text-xs font-bold cursor-pointer hover:bg-stone-800 transition-colors"
                >
                  Ver en Kardex / Historial →
                </button>
                <button
                  type="button"
                  onClick={() => setMensajeRecepcionExito(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#059669] text-white text-xs font-bold cursor-pointer hover:bg-emerald-700 transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </div>
          )}

          {tabRecepcion === 'TRANSITO' && (
            <>
              {despachosPendientes.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#FAF7F4] border border-dashed border-[#D8CFC6] text-center space-y-2">
                  <PackageCheck className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-sm font-black text-[#1C1311]">
                    No hay despachos en tránsito pendientes por recibir en {sedeActiva}
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Cuando Bodega Central despache un traslado hacia este punto de venta, aparecerá
                    automáticamente aquí en estado &ldquo;En Tránsito&rdquo;. Podrás pulsar &ldquo;Confirmar Recepción de Mercancía&rdquo; para abrir el modal de conteo físico y verificar las unidades.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E5DDD3] text-[10px] font-black uppercase text-stone-500 bg-[#FAF7F4]">
                        <th className="py-2.5 px-3 rounded-tl-xl">Guía / Código</th>
                        <th className="py-2.5 px-3">Ruta Logística</th>
                        <th className="py-2.5 px-3">Fecha de Envío</th>
                        <th className="py-2.5 px-3">Prendas y Unidades</th>
                        <th className="py-2.5 px-3 text-center">Estado Logístico</th>
                        <th className="py-2.5 px-3 text-right rounded-tr-xl">Acción Operativa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEAE4]">
                      {despachosPendientes.map((despacho) => {
                        const totalUds = despacho.lineas.reduce(
                          (acc, l) => acc + l.cantidadEnviada,
                          0
                        );
                        return (
                          <tr
                            key={despacho.id}
                            onClick={() => {
                              setErrorRecepcion(null);
                              setDespachoParaRecepcionModal(
                                JSON.parse(JSON.stringify(despacho))
                              );
                            }}
                            className="hover:bg-[#FAF7F4] cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3 font-mono font-black text-sm text-[#1C1311]">
                              #{despacho.codigo}
                            </td>
                            <td className="py-3 px-3 text-stone-700">
                              <span className="font-semibold">{despacho.origen}</span> →{' '}
                              <strong className="text-[#1C1311]">{despacho.destino}</strong>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                              {despacho.fechaDespacho}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-black text-[#1C1311] block">
                                {totalUds} unidades
                              </span>
                              <span className="text-[11px] text-stone-500">
                                {despacho.lineas.length}{' '}
                                {despacho.lineas.length === 1 ? 'referencia' : 'referencias'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                <Truck className="w-3 h-3" />
                                <span>En Tránsito</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setErrorRecepcion(null);
                                  setDespachoParaRecepcionModal(
                                    JSON.parse(JSON.stringify(despacho))
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs shadow-sm cursor-pointer transition-all"
                              >
                                <PackageCheck className="w-4 h-4" />
                                <span>Confirmar Recepción de Mercancía</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tabRecepcion === 'RECIBIDOS' && (
            <>
              {despachosRecibidos.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#FAF7F4] border border-dashed border-[#D8CFC6] text-center space-y-2">
                  <PackageCheck className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-sm font-black text-[#1C1311]">
                    Aún no se registran despachos recibidos en esta sede
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Cuando confirmes la recepción de un despacho en tránsito, quedará archivado aquí con el detalle de unidades incorporadas y bitácora.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E5DDD3] text-[10px] font-black uppercase text-stone-500 bg-[#FAF7F4]">
                        <th className="py-2.5 px-3 rounded-tl-xl">Guía / Código</th>
                        <th className="py-2.5 px-3">Ruta Logística</th>
                        <th className="py-2.5 px-3">Fecha de Envío</th>
                        <th className="py-2.5 px-3">Prendas Recibidas</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3 text-right rounded-tr-xl">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEAE4]">
                      {despachosRecibidos.map((despacho) => {
                        const totalBuenas = despacho.lineas.reduce(
                          (acc, l) => acc + l.recibidasBuenas,
                          0
                        );
                        const totalDanadas = despacho.lineas.reduce(
                          (acc, l) => acc + l.recibidasDanadas,
                          0
                        );
                        return (
                          <tr
                            key={despacho.id}
                            onClick={() => setDespachoDetalleDrawer(despacho)}
                            className="hover:bg-[#FAF7F4] cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3 font-mono font-black text-sm text-[#1C1311]">
                              #{despacho.codigo}
                            </td>
                            <td className="py-3 px-3 text-stone-700">
                              <span className="font-semibold">{despacho.origen}</span> →{' '}
                              <strong className="text-[#1C1311]">{despacho.destino}</strong>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                              {despacho.fechaDespacho}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-black text-[#059669] block">
                                +{totalBuenas} uds ingresadas
                              </span>
                              {totalDanadas > 0 && (
                                <span className="text-[11px] text-[#661521] font-semibold">
                                  {totalDanadas} uds avería
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  despacho.estado === 'RECIBIDO'
                                    ? 'bg-emerald-100 text-[#059669] border border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>
                                  {despacho.estado === 'RECIBIDO'
                                    ? 'Recibido Completo'
                                    : 'Recibido con Novedad'}
                                </span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDespachoDetalleDrawer(despacho);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F4] hover:bg-stone-200 border border-[#D8CFC6] text-[11px] font-bold text-[#661521] cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Detalle</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Modal Dedicado de Recepción y Conteo Físico de Mercancía */}
      {despachoParaRecepcionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#292827]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-[#E7E0D8] shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE4]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#1C1311] text-[#D19650] font-mono text-xs font-black">
                    #{despachoParaRecepcionModal.codigo}
                  </span>
                  <span className="text-xs font-black text-stone-500 uppercase">
                    Recepción y Conteo Físico
                  </span>
                </div>
                <h3 className="text-base font-black text-[#1C1311] mt-0.5">
                  Verificación de Mercancía Entrante en {sedeActiva}
                </h3>
                <p className="text-xs text-stone-500">
                  {despachoParaRecepcionModal.origen} → {despachoParaRecepcionModal.destino} · Despachado:{' '}
                  {despachoParaRecepcionModal.fechaDespacho}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorRecepcion(null);
                  setDespachoParaRecepcionModal(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer transition-colors font-black"
              >
                ✕
              </button>
            </div>

            {/* Error si aplica */}
            {errorRecepcion && (
              <div className="p-3 rounded-xl bg-red-50 border border-[#661521] text-[#661521] text-xs font-bold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorRecepcion}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorRecepcion(null)}
                  className="px-2 py-0.5 rounded bg-[#661521] text-white text-[11px] font-bold cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            )}

            {/* Instrucción clara */}
            <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] text-xs text-stone-600 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#059669] shrink-0" />
              <span>
                Cuenta físicamente cada prenda. Ajusta las unidades en buen estado y registra averías si las prendas llegaron con defectos de fábrica o transporte.
              </span>
            </div>

            {/* Tabla de Conteo */}
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5DDD3] text-[10px] font-black uppercase text-stone-500 bg-[#FAF7F4] sticky top-0 z-10">
                    <th className="py-2 px-3">Prenda / Referencia</th>
                    <th className="py-2 px-3 text-center">Enviadas</th>
                    <th className="py-2 px-3 text-center">En Buen Estado</th>
                    <th className="py-2 px-3 text-center">Con Avería</th>
                    <th className="py-2 px-3 text-center">Faltantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE4]">
                  {despachoParaRecepcionModal.lineas.map((linea) => {
                    const faltantes = Math.max(
                      0,
                      linea.cantidadEnviada - (linea.recibidasBuenas + linea.recibidasDanadas)
                    );
                    return (
                      <tr key={linea.id} className="bg-white">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={linea.imagenUrl}
                              alt={linea.nombre}
                              className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                            <div>
                              <p className="font-black text-[#1C1311]">{linea.nombre}</p>
                              <p className="font-mono text-[11px] text-stone-500">
                                SKU: {linea.sku} · Talla {linea.talla} · {linea.color}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-[#1C1311]">
                          {linea.cantidadEnviada} uds
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={linea.recibidasBuenas <= 0}
                              onClick={() =>
                                handleAjustarConteoEnModal(linea.id, 'recibidasBuenas', -1)
                              }
                              className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center font-black disabled:opacity-40 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-mono text-sm font-black text-[#059669]">
                              {linea.recibidasBuenas}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleAjustarConteoEnModal(linea.id, 'recibidasBuenas', 1)
                              }
                              className="w-7 h-7 rounded-lg bg-[#059669] text-white flex items-center justify-center font-black disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={linea.recibidasDanadas <= 0}
                              onClick={() =>
                                handleAjustarConteoEnModal(linea.id, 'recibidasDanadas', -1)
                              }
                              className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center font-black disabled:opacity-40 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-mono text-sm font-black text-[#661521]">
                              {linea.recibidasDanadas}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleAjustarConteoEnModal(linea.id, 'recibidasDanadas', 1)
                              }
                              className="w-7 h-7 rounded-lg bg-[#661521] text-white flex items-center justify-center font-black disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                              faltantes > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {faltantes} uds
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Observaciones de Recepción */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Observaciones de Recepción:
              </label>
              <input
                type="text"
                value={despachoParaRecepcionModal.observaciones}
                onChange={(e) => handleUpdateObservacionModal(e.target.value)}
                placeholder="Describe cualquier avería, faltante o novedad logística observada..."
                className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
              />
            </div>

            {/* Footer con Resumen y Botón de Confirmación */}
            {(() => {
              const totalEnv = despachoParaRecepcionModal.lineas.reduce(
                (a, b) => a + b.cantidadEnviada,
                0
              );
              const totalB = despachoParaRecepcionModal.lineas.reduce(
                (a, b) => a + b.recibidasBuenas,
                0
              );
              const totalD = despachoParaRecepcionModal.lineas.reduce(
                (a, b) => a + b.recibidasDanadas,
                0
              );
              const totalF = Math.max(0, totalEnv - (totalB + totalD));

              return (
                <div className="pt-3 border-t border-[#EFEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-stone-600 space-x-2">
                    <span>Enviadas: <strong>{totalEnv}</strong></span>
                    <span>·</span>
                    <span className="text-[#059669]">Buenas: <strong>+{totalB}</strong></span>
                    <span>·</span>
                    <span className="text-[#661521]">Averías: <strong>{totalD}</strong></span>
                    <span>·</span>
                    <span>Faltantes: <strong>{totalF}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorRecepcion(null);
                        setDespachoParaRecepcionModal(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#FAF7F4] hover:bg-stone-200 border border-[#D8CFC6] text-xs font-bold text-stone-700 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmarRecepcion(despachoParaRecepcionModal.id)}
                      className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Confirmar Recepción de Mercancía (+{totalB} uds al stock)</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* DetailDrawer para Inspección de Despacho Recibido */}
      {despachoDetalleDrawer && (
        <DetailDrawer
          isOpen={Boolean(despachoDetalleDrawer)}
          onClose={() => setDespachoDetalleDrawer(null)}
          title={`Despacho ${despachoDetalleDrawer.codigo}`}
          subtitle={`${despachoDetalleDrawer.origen} → ${despachoDetalleDrawer.destino} · ${despachoDetalleDrawer.fechaDespacho}`}
          badge={{
            label:
              despachoDetalleDrawer.estado === 'RECIBIDO'
                ? 'Recibido Completo'
                : 'Recibido con Novedades',
            variant:
              despachoDetalleDrawer.estado === 'RECIBIDO' ? 'success' : 'warning',
          }}
          tabs={[
            { id: 'detalle', label: 'Información Logística' },
            { id: 'prendas', label: 'Prendas Recibidas' },
            { id: 'observaciones', label: 'Observaciones y Bitácora' },
          ]}
          activeTab={drawerTabKardex}
          onTabChange={(tabId) =>
            setDrawerTabKardex(tabId as 'detalle' | 'prendas' | 'observaciones')
          }
        >
          {drawerTabKardex === 'detalle' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Código Guía:</span>
                  <span className="font-mono font-bold text-[#1C1311]">
                    #{despachoDetalleDrawer.codigo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Origen:</span>
                  <span className="font-semibold text-stone-800">
                    {despachoDetalleDrawer.origen}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Destino:</span>
                  <span className="font-bold text-[#1C1311]">
                    {despachoDetalleDrawer.destino}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Fecha Despacho:</span>
                  <span className="font-mono text-stone-700">
                    {despachoDetalleDrawer.fechaDespacho}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Estado:</span>
                  <span className="font-bold text-[#059669]">
                    {despachoDetalleDrawer.estado}
                  </span>
                </div>
              </div>
            </div>
          )}
          {drawerTabKardex === 'prendas' && (
            <div className="space-y-3 text-xs">
              {despachoDetalleDrawer.lineas.map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={l.imagenUrl}
                      alt={l.nombre}
                      className="w-9 h-9 rounded-lg object-cover border border-stone-200"
                    />
                    <div>
                      <p className="font-black text-[#1C1311]">{l.nombre}</p>
                      <p className="font-mono text-[11px] text-stone-500">
                        SKU: {l.sku} · Talla {l.talla}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[#059669] font-bold block">
                      +{l.recibidasBuenas} buenas
                    </span>
                    {l.recibidasDanadas > 0 && (
                      <span className="text-[#661521] text-[11px] block">
                        {l.recibidasDanadas} averías
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {drawerTabKardex === 'observaciones' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
                <span className="block font-bold text-stone-500 mb-1 uppercase text-[10px]">
                  Observación de Entrada:
                </span>
                <p className="text-stone-800">
                  {despachoDetalleDrawer.observaciones ||
                    'Sin observaciones registradas. Mercancía verificada y conforme.'}
                </p>
              </div>
            </div>
          )}
        </DetailDrawer>
      )}

      {/* =========================================================================
          SUBCATEGORÍA 4: MOVIMIENTOS DE INVENTARIO (KARDEX SEDE)
      ========================================================================= */}
      {subcategoriaActiva === 'KARDEX' && (
        <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
            <div>
              <h2 className="text-base font-black text-[#1C1311]">
                Bitácora de Movimientos de Inventario — Kardex Sede ({movimientosKardexFiltrados.length})
              </h2>
              <p className="text-xs text-stone-500">
                Trazabilidad unificada de ventas POS (-), cambios entregados (-), reingresos en
                buen estado (+) y recepciones de traslado (+).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'TODOS' as const, label: 'Todos los Movimientos' },
                { id: 'VENTA_POS' as const, label: 'Ventas POS (-)' },
                { id: 'CAMBIOS' as const, label: 'Cambios y Devoluciones' },
                { id: 'RECEPCION_TRASLADO' as const, label: 'Recepciones de Traslado (+)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroKardex(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    filtroKardex === f.id
                      ? 'bg-[#661521] text-white border-[#661521]'
                      : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6] hover:bg-stone-200/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={busquedaKardex}
              onChange={(e) => setBusquedaKardex(e.target.value)}
              placeholder="Buscar movimiento por SKU, prenda o documento (#MED-..., #CAM-..., #TRL-...)..."
              className="w-full min-h-[42px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-semibold text-[#1C1311] focus:outline-none focus:border-[#661521]"
            />
          </div>

          {movimientosKardexFiltrados.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#FAF7F4] border border-dashed border-[#D8CFC6] text-center space-y-2">
              <History className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-black text-[#1C1311]">
                No se han registrado movimientos de Kardex aún en este turno
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Cada venta cobrada en mostrador, cambio mano a mano o recepción de despacho desde
                Bodega Central quedará asentada automáticamente en esta bitácora.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5DDD3] text-[10px] font-black uppercase text-stone-500 bg-[#FAF7F4]">
                    <th className="py-2.5 px-3 rounded-tl-xl">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Tipo de Movimiento</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3">SKU / Prenda</th>
                    <th className="py-2.5 px-3 text-center">Impacto Stock Vendible</th>
                    <th className="py-2.5 px-3">Detalle Operativo</th>
                    <th className="py-2.5 px-3 text-right rounded-tr-xl">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE4]">
                  {movimientosKardexFiltrados.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedKardexMovimiento(m)}
                      className="hover:bg-[#FAF7F4] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                        {m.fecha}
                      </td>
                      <td className="py-2.5 px-3">
                        {m.tipo === 'VENTA_POS' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-[#661521] font-black text-[10px]">
                            <ArrowUpRight className="w-3 h-3" /> VENTA POS
                          </span>
                        )}
                        {m.tipo === 'CAMBIO_SALIDA' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[10px]">
                            <ArrowUpRight className="w-3 h-3" /> CAMBIO ENTREGADO
                          </span>
                        )}
                        {m.tipo === 'CAMBIO_REINGRESO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-[#059669] font-black text-[10px]">
                            <ArrowDownLeft className="w-3 h-3" /> REINGRESO CAMBIO
                          </span>
                        )}
                        {m.tipo === 'CAMBIO_AVERIA' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-black text-[10px]">
                            AVERÍA NO VENDIBLE
                          </span>
                        )}
                        {m.tipo === 'RECEPCION_TRASLADO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-[#059669] font-black text-[10px]">
                            <ArrowDownLeft className="w-3 h-3" /> RECEPCIÓN TRASLADO
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1C1311]">
                        {m.referencia}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-[#661521] block">{m.sku}</span>
                        <span className="text-stone-700 font-medium">{m.nombreProducto}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-sm font-black">
                        {m.deltaVendible > 0 ? (
                          <span className="text-[#059669]">+{m.deltaVendible} uds</span>
                        ) : m.deltaVendible < 0 ? (
                          <span className="text-[#661521]">{m.deltaVendible} uds</span>
                        ) : (
                          <span className="text-stone-500">0 vendible (Avería)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">{m.detalle}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKardexMovimiento(m);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F4] hover:bg-stone-200 border border-[#D8CFC6] text-[11px] font-bold text-[#661521] cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* DetailDrawer para Inspección de Movimiento Kardex */}
      {selectedKardexMovimiento && (
        <DetailDrawer
          isOpen={Boolean(selectedKardexMovimiento)}
          onClose={() => setSelectedKardexMovimiento(null)}
          title={`Movimiento Kardex ${selectedKardexMovimiento.referencia}`}
          subtitle={`${selectedKardexMovimiento.fecha} · Sede: ${sedeActiva}`}
          badge={{
            label:
              selectedKardexMovimiento.tipo === 'RECEPCION_TRASLADO'
                ? 'Recepción Traslado'
                : selectedKardexMovimiento.tipo === 'VENTA_POS'
                ? 'Venta POS Mostrador'
                : selectedKardexMovimiento.tipo === 'CAMBIO_SALIDA'
                ? 'Cambio Entregado'
                : selectedKardexMovimiento.tipo === 'CAMBIO_REINGRESO'
                ? 'Reingreso Buen Estado'
                : 'Avería No Vendible',
            variant:
              selectedKardexMovimiento.tipo === 'RECEPCION_TRASLADO' ||
              selectedKardexMovimiento.tipo === 'CAMBIO_REINGRESO'
                ? 'success'
                : selectedKardexMovimiento.tipo === 'VENTA_POS'
                ? 'danger'
                : selectedKardexMovimiento.tipo === 'CAMBIO_SALIDA'
                ? 'warning'
                : 'neutral',
          }}
          tabs={[
            { id: 'detalle', label: 'Información y Cuadre' },
            { id: 'prendas', label: 'Prendas y Unidades' },
            { id: 'observaciones', label: 'Observaciones y Bitácora' },
          ]}
          activeTab={drawerTabKardex}
          onTabChange={(tabId) =>
            setDrawerTabKardex(tabId as 'detalle' | 'prendas' | 'observaciones')
          }
        >
          {drawerTabKardex === 'detalle' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500 font-semibold">Documento / Consecutivo:</span>
                  <span className="font-mono font-black text-[#1C1311]">
                    {selectedKardexMovimiento.referencia}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500 font-semibold">Fecha y Hora (Colombia):</span>
                  <span className="font-mono text-stone-700">
                    {formatFechaBogota(selectedKardexMovimiento.fechaIso)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500 font-semibold">Punto de Venta / Sede:</span>
                  <span className="font-bold text-[#1C1311]">{sedeActiva}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500 font-semibold">Tipo de Operación:</span>
                  <span className="font-bold text-[#661521]">
                    {selectedKardexMovimiento.tipo.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-[#EFEAE4]">
                  <span className="text-stone-500 font-semibold">Impacto en Stock Vendible:</span>
                  <span className="font-mono font-black text-sm">
                    {selectedKardexMovimiento.deltaVendible > 0 ? (
                      <span className="text-[#059669]">+{selectedKardexMovimiento.deltaVendible} unidades</span>
                    ) : selectedKardexMovimiento.deltaVendible < 0 ? (
                      <span className="text-[#661521]">{selectedKardexMovimiento.deltaVendible} unidades</span>
                    ) : (
                      <span className="text-stone-600">0 unidades (Avería aislada)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {drawerTabKardex === 'prendas' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white border border-[#E5DDD3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-[#1C1311]">
                    {selectedKardexMovimiento.nombreProducto}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#661521]">
                    {selectedKardexMovimiento.sku}
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  {selectedKardexMovimiento.detalle}
                </p>
                <div className="pt-2 border-t border-[#EFEAE4] flex items-center justify-between text-xs">
                  <span className="text-stone-500">Unidades Afectadas:</span>
                  <span className="font-mono font-black text-stone-900">
                    {Math.abs(selectedKardexMovimiento.deltaVendible)} uds
                  </span>
                </div>
              </div>
            </div>
          )}

          {drawerTabKardex === 'observaciones' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3] space-y-2">
                <p className="font-bold text-[#1C1311] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#661521]" />
                  <span>Bitácora Operativa de Inventario</span>
                </p>
                <p className="text-stone-700 leading-relaxed">
                  {selectedKardexMovimiento.detalle}
                </p>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[#059669] font-medium text-[11px] mt-2">
                  ✓ Registro inmutable de Kardex auditado según regla RN-GEN-02.
                </div>
              </div>
            </div>
          )}
        </DetailDrawer>
      )}
    </div>
  );
};

export default PosTrasladosPage;
