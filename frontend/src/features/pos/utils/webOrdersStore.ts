// frontend/src/features/pos/utils/webOrdersStore.ts
// Almacén persistente (localStorage) de Pedidos Web compartido por Tienda Web, POS y Admin.
// Fase MVP sin backend: será reemplazado por la API de `11-pedidos-web` (mismo contrato).
// Reglas: RN-WEB-05 (sede asignada), RN-WEB-15 (reserva dura), CA-40 (contraentrega no suma
// a ventas hasta PAGADO por Admin), CA-64 (NO_ENTREGADO = retorno logístico sin afectar ventas).

import {
  applyStockDelta,
  getBodegaCentralDelta,
  applyBodegaCentralDelta,
  getAllStockDeltas,
} from './posLedgerSync';
import { PRODUCTOS_SEMILLA } from '../../storefront/services/catalogService';
import { apiRequest } from '../../../api/apiClient';

const KEY_GLOBAL = 'forma_pedidos_web_global';

export type EstadoPedidoWeb =
  | 'RECIBIDO'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO_DESPACHO'
  | 'DESPACHADO'
  | 'EN_ENTREGA'
  | 'ENTREGADO'
  | 'NO_ENTREGADO'
  | 'CANCELADO';

export type MetodoPagoWeb = 'TRANSFERENCIA' | 'CONTRAENTREGA';

/**
 * Estado del dinero del pedido:
 * - PENDIENTE_VERIFICACION: transferencia reportada por el cliente, Admin debe validar el comprobante.
 * - PENDIENTE_RECAUDO: contraentrega; la transportadora cobra al entregar y luego remite el dinero.
 * - PAGADO: Admin confirmó el dinero en cuenta FORMA (venta reconocida, imputada a la sede que despachó).
 * - ANULADO: pedido cancelado o no entregado; no hay dinero que cobrar.
 */
export type EstadoCobroWeb = 'PENDIENTE_VERIFICACION' | 'PENDIENTE_RECAUDO' | 'PAGADO' | 'ANULADO';

export interface ProductoPedidoWeb {
  id: string;
  nombre: string;
  sku: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitarioCOP: number;
  imagenUrl?: string;
}

export interface EventoPedidoWeb {
  id: string;
  fechaIso: string;
  titulo: string;
  descripcion?: string;
  usuario: string;
  estado?: EstadoPedidoWeb;
}

export interface PedidoWebRecord {
  codigo: string;
  fechaCreacionIso: string;
  cliente: string;
  emailCliente: string;
  telefono?: string;
  documento?: string;
  ciudadDestino: string;
  codigoDaneDestino: string;
  direccionEntrega: string;
  sedeAsignada: string; // Debe coincidir con SEDES_POS (ej. 'Punto Centro (Cúcuta)')
  metodoPago: MetodoPagoWeb;
  metodoPagoTexto: string;
  referenciaPago?: string;
  subtotalCOP: number;
  ivaCOP: number;
  fleteCOP: number;
  totalCOP: number;
  estado: EstadoPedidoWeb;
  estadoCobro: EstadoCobroWeb;
  guiaTransportadora?: string;
  transportadora?: string;
  observaciones?: string;
  productos: ProductoPedidoWeb[];
  historial: EventoPedidoWeb[];
}

export const WEB_ORDERS_EVENT = 'forma-web-orders-update';

/** Orden lógico para línea de tiempo del cliente (MiCuenta / Rastreo). */
export const FLUJO_ESTADOS_WEB: EstadoPedidoWeb[] = [
  'RECIBIDO',
  'CONFIRMADO',
  'EN_PREPARACION',
  'LISTO_DESPACHO',
  'DESPACHADO',
  'EN_ENTREGA',
  'ENTREGADO',
];

export const normalizarSede = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[—–-].*$/, '')
    .trim()
    .toLowerCase();

/** Compara sedes tolerando variantes ('Punto Centro (Cúcuta)' vs 'Punto Centro — Cúcuta'). */
export const mismaSede = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  const na = normalizarSede(a);
  const nb = normalizarSede(b);
  if (na === nb) return true;
  if ((na.includes('bodega') || na.includes('central')) && (nb.includes('bodega') || nb.includes('central'))) return true;
  if (na.includes('centro') && nb.includes('centro')) return true;
  if (na.includes('caobos') && nb.includes('caobos')) return true;
  if ((na.includes('ocana') || na.includes('ocaña')) && (nb.includes('ocana') || nb.includes('ocaña'))) return true;
  if (na.includes('bucaramanga') && nb.includes('bucaramanga')) return true;
  return false;
};

/**
 * Retorna el stock físico real disponible de un SKU en una sede específica.
 * Normaliza sedes: 'Bodega Central' / 'Centro de Producción', 'Punto Centro (Cúcuta)' -> 'Punto Centro', etc.
 */
export const obtenerStockSede = (sku: string, sede: string): number => {
  if (!sku) return 0;
  const sNorm = normalizarSede(sede || '');
  const skuUpper = sku.trim().toUpperCase();

  // 1. Centro de Producción / Bodega Central:
  if (
    sNorm.includes('bodega') ||
    sNorm.includes('central') ||
    sNorm.includes('produccion') ||
    sNorm.includes('admin')
  ) {
    let base = 0;
    for (const p of PRODUCTOS_SEMILLA) {
      const v = p.variantes?.find((x) => x.sku.toUpperCase() === skuUpper);
      if (v) {
        base = v.stockPorSede?.['Bodega Central'] ?? v.stockDisponible ?? 0;
        break;
      }
    }
    const delta = getBodegaCentralDelta(skuUpper);
    return Math.max(0, base + delta);
  }

  // 2. Puntos de venta físicos (Punto Centro, Punto Caobos, Punto Ocaña, Punto Bucaramanga):
  let claveSede = 'Punto Centro';
  if (sNorm.includes('caobos')) claveSede = 'Punto Caobos';
  else if (sNorm.includes('ocana') || sNorm.includes('ocaña')) claveSede = 'Punto Ocaña';
  else if (sNorm.includes('bucaramanga')) claveSede = 'Punto Bucaramanga';
  else if (sNorm.includes('centro')) claveSede = 'Punto Centro';

  let baseTienda = 0;
  for (const p of PRODUCTOS_SEMILLA) {
    const v = p.variantes?.find((x) => x.sku.toUpperCase() === skuUpper);
    if (v) {
      baseTienda = v.stockPorSede?.[claveSede] ?? 0;
      break;
    }
  }

  // Delta específico de sede si existe, o delta general de la terminal si es Punto Centro
  const deltas = getAllStockDeltas();
  const deltaEspecifico =
    deltas[`${claveSede.toUpperCase()}::${skuUpper}`] !== undefined
      ? deltas[`${claveSede.toUpperCase()}::${skuUpper}`]
      : deltas[`${claveSede}::${skuUpper}`];

  const deltaSede =
    deltaEspecifico !== undefined
      ? deltaEspecifico
      : claveSede === 'Punto Centro'
      ? deltas[skuUpper] || 0
      : 0;

  return Math.max(0, baseTienda + deltaSede);
};

/**
 * Valida si una sede cuenta con stock suficiente de todos los productos de un pedido.
 */
export const sedeTieneStockParaPedido = (
  sede: string,
  productos?: { sku: string; cantidad: number }[]
): boolean => {
  if (!productos || productos.length === 0) return true;
  return productos.every((item) => {
    const stock = obtenerStockSede(item.sku, sede);
    return stock >= (item.cantidad || 1);
  });
};

/**
 * Retorna la lista de sedes que cuentan con stock suficiente para surtir el pedido.
 */
export const obtenerSedesConStockParaPedido = (
  productos: { sku: string; cantidad: number }[]
): string[] => {
  const todasLasSedes = [
    'Punto Centro (Cúcuta)',
    'Punto Caobos (Cúcuta)',
    'Punto Bucaramanga',
    'Punto Ocaña',
    'Bodega Central',
  ];
  return todasLasSedes.filter((s) => sedeTieneStockParaPedido(s, productos));
};

const emitir = () => {
  try {
    window.dispatchEvent(new Event(WEB_ORDERS_EVENT));
  } catch {
    /* noop */
  }
};

export const getWebOrders = (): PedidoWebRecord[] => {
  try {
    const raw = localStorage.getItem(KEY_GLOBAL);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

/**
 * Elimina un pedido web permanentemente del almacén y de los espejos de cliente.
 */
export const eliminarPedidoWeb = (codigo: string): boolean => {
  const lista = getWebOrders();
  const objetivo = lista.find((p) => p.codigo === codigo);
  if (!objetivo) return false;

  const nuevaLista = lista.filter((p) => p.codigo !== codigo);
  guardar(nuevaLista);

  // Limpiar también del espejo del cliente
  if (objetivo.emailCliente) {
    try {
      const key = `forma_pedidos_${objetivo.emailCliente.toLowerCase()}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const clienteLista = JSON.parse(raw);
        if (Array.isArray(clienteLista)) {
          const nuevaClienteLista = clienteLista.filter((x) => x?.codigo !== codigo);
          localStorage.setItem(key, JSON.stringify(nuevaClienteLista));
        }
      }
    } catch {
      /* noop */
    }
  }

  emitir();
  return true;
};

/**
 * Purga de pedidos de prueba por monto exacto.
 */
export const purgarPedidosPorMonto = (montoCop: number = 540000): number => {
  const lista = getWebOrders();
  const aConservar = lista.filter((p) => p.totalCOP !== montoCop && p.subtotalCOP !== montoCop);
  const eliminados = lista.length - aConservar.length;
  if (eliminados > 0) {
    guardar(aConservar);
  }
  return eliminados;
};

const guardar = (lista: PedidoWebRecord[]) => {
  try {
    localStorage.setItem(KEY_GLOBAL, JSON.stringify(lista));
  } catch {
    /* noop */
  }
  lista.forEach(espejarEnCuentaCliente);
  emitir();
};

/**
 * Bandeja compartida con bloqueo al primer clic:
 * - Mientras el pedido está en 'RECIBIDO' o 'CONFIRMADO', es visible en la bandeja compartida
 *   de las sedes con stock disponible (o hasta que la primera sede inicie el alistamiento).
 * - Apenas una sede inicia 'EN_PREPARACION', el pedido queda bloqueado exclusivamente para
 *   esa `sedeAsignada` y desaparece del listado de las demás sedes.
 */
export const getWebOrdersBySede = (sede: string): PedidoWebRecord[] => {
  const sNorm = normalizarSede(sede || '');
  const esCentral =
    sNorm.includes('bodega') ||
    sNorm.includes('central') ||
    sNorm.includes('produccion') ||
    sNorm.includes('admin');

  return getWebOrders().filter((p) => {
    // Si el pedido ya fue tomado o está en curso:
    if (p.estado !== 'RECIBIDO' && p.estado !== 'CONFIRMADO') {
      return mismaSede(p.sedeAsignada, sede);
    }

    // Si el pedido está pendiente por alistar (RECIBIDO o CONFIRMADO):
    // 1. Centro de Producción (Bodega Central / Admin):
    // Siempre tiene visibilidad de la bandeja global de pedidos pendientes por alistar.
    if (esCentral) {
      return true;
    }

    // 2. Punto de Venta Físico:
    // Solo le aparece si la sede TIENE STOCK disponible de todas las prendas del pedido.
    // Si la sede no cuenta con stock suficiente, no le aparece en su bandeja de alistamiento.
    return sedeTieneStockParaPedido(sede, p.productos);
  });
};

export const getWebOrdersByEmail = (email: string): PedidoWebRecord[] => {
  const e = email.trim().toLowerCase();
  return getWebOrders().filter((p) => p.emailCliente.toLowerCase() === e);
};

export const getWebOrder = (codigo: string): PedidoWebRecord | undefined =>
  getWebOrders().find((p) => p.codigo === codigo);

export const nuevoEvento = (
  titulo: string,
  usuario: string,
  descripcion?: string,
  estado?: EstadoPedidoWeb
): EventoPedidoWeb => ({
  id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  fechaIso: new Date().toISOString(),
  titulo,
  descripcion,
  usuario,
  estado,
});

/** Crea el pedido (desde Checkout). Estado de cobro inicial según método de pago. */
export const createWebOrder = (
  pedido: Omit<PedidoWebRecord, 'estado' | 'estadoCobro' | 'historial'> &
    Partial<Pick<PedidoWebRecord, 'estado' | 'estadoCobro' | 'historial'>>
): PedidoWebRecord => {
  const registro: PedidoWebRecord = {
    ...pedido,
    estado: pedido.estado ?? 'RECIBIDO',
    estadoCobro:
      pedido.estadoCobro ??
      (pedido.metodoPago === 'CONTRAENTREGA' ? 'PENDIENTE_RECAUDO' : 'PENDIENTE_VERIFICACION'),
    historial: pedido.historial ?? [
      nuevoEvento(
        'Pedido recibido en Tienda Web',
        pedido.cliente,
        `${pedido.metodoPagoTexto} · Asignado a ${pedido.sedeAsignada}`,
        'RECIBIDO'
      ),
    ],
  };
  const lista = getWebOrders().filter((p) => p.codigo !== registro.codigo);
  guardar([registro, ...lista]);
  return registro;
};

/** Actualiza el pedido y agrega un evento al historial (inmutable: nunca se borra). */
export const updateWebOrder = (
  codigo: string,
  cambios: Partial<Omit<PedidoWebRecord, 'codigo' | 'historial'>>,
  evento?: EventoPedidoWeb
): PedidoWebRecord | undefined => {
  let actualizado: PedidoWebRecord | undefined;
  const lista = getWebOrders().map((p) => {
    if (p.codigo !== codigo) return p;
    actualizado = {
      ...p,
      ...cambios,
      historial: evento ? [...p.historial, evento] : p.historial,
    };
    return actualizado;
  });
  if (actualizado) guardar(lista);
  return actualizado;
};

/**
 * Transición de estado con efectos de inventario:
 * - DESPACHADO: sale la mercancía de la sede (-cantidad en stock físico de la sede).
 * - NO_ENTREGADO desde DESPACHADO: retorno logístico (+cantidad), cobro ANULADO (CA-64).
 * - CANCELADO: cobro ANULADO.
 * - ENTREGADO en contraentrega: sigue PENDIENTE_RECAUDO hasta que Admin marque PAGADO (CA-40).
 */
export const transicionarPedidoWeb = (
  codigo: string,
  nuevoEstado: EstadoPedidoWeb,
  usuario: string,
  extra: Partial<
    Pick<PedidoWebRecord, 'guiaTransportadora' | 'transportadora' | 'observaciones' | 'sedeAsignada' | 'estadoCobro'>
  > = {},
  nota?: string
): PedidoWebRecord | undefined => {
  const actual = getWebOrder(codigo);
  if (!actual) return undefined;

  const cambios: Partial<PedidoWebRecord> = { ...extra, estado: nuevoEstado };

  if (
    nuevoEstado === 'DESPACHADO' &&
    actual.estado !== 'DESPACHADO' &&
    actual.estado !== 'EN_ENTREGA' &&
    actual.estado !== 'ENTREGADO'
  ) {
    const sNorm = normalizarSede(actual.sedeAsignada || '');
    const esBodegaCentral =
      sNorm.includes('bodega') ||
      sNorm.includes('central') ||
      sNorm.includes('produccion');

    if (esBodegaCentral) {
      actual.productos.forEach((p) => applyBodegaCentralDelta(p.sku, -p.cantidad));
    } else {
      actual.productos.forEach((p) => applyStockDelta(p.sku, -p.cantidad));
    }
  }
  if (nuevoEstado === 'ENTREGADO') {
    // Cuando el pedido es entregado, el dinero de contraentrega o transferencia verificada ingresa formalmente al sistema
    cambios.estadoCobro = 'PAGADO';
  }
  if (nuevoEstado === 'NO_ENTREGADO') {
    if (actual.estado === 'DESPACHADO' || actual.estado === 'EN_ENTREGA') {
      const sNorm = normalizarSede(actual.sedeAsignada || '');
      const esBodegaCentral =
        sNorm.includes('bodega') ||
        sNorm.includes('central') ||
        sNorm.includes('produccion');

      if (esBodegaCentral) {
        actual.productos.forEach((p) => applyBodegaCentralDelta(p.sku, p.cantidad));
      } else {
        actual.productos.forEach((p) => applyStockDelta(p.sku, p.cantidad));
      }
    }
    cambios.estadoCobro = 'ANULADO';
  }
  if (nuevoEstado === 'CANCELADO') {
    cambios.estadoCobro = 'ANULADO';
  }

  const titulos: Record<EstadoPedidoWeb, string> = {
    RECIBIDO: 'Pedido recibido',
    CONFIRMADO: 'Pedido confirmado',
    EN_PREPARACION: 'Alistamiento iniciado y bloqueado por sede',
    LISTO_DESPACHO: 'Empacado y listo para despacho',
    DESPACHADO: 'Entregado a transportadora',
    EN_ENTREGA: 'En ruta de entrega al domicilio',
    ENTREGADO: 'Entregado y confirmado por el cliente',
    NO_ENTREGADO: 'No entregado · retorno logístico',
    CANCELADO: 'Pedido cancelado',
  };

  const actualizado = updateWebOrder(codigo, cambios, nuevoEvento(titulos[nuevoEstado], usuario, nota, nuevoEstado));

  // Sincronización atómica con el motor PostgreSQL (PATCH /api/pedidos-web/:id/estado)
  if (typeof window !== 'undefined' && actualizado) {
    const estadoBackendMap: Record<EstadoPedidoWeb, string> = {
      RECIBIDO: 'CONFIRMADO',
      CONFIRMADO: 'CONFIRMADO',
      EN_PREPARACION: 'EN_PREPARACION',
      LISTO_DESPACHO: 'EN_PREPARACION',
      DESPACHADO: 'ENVIADO',
      EN_ENTREGA: 'ENVIADO',
      ENTREGADO: 'ENTREGADO',
      NO_ENTREGADO: 'CANCELADO',
      CANCELADO: 'CANCELADO',
    };
    const nuevoBackendEstado = estadoBackendMap[nuevoEstado];
    if (nuevoBackendEstado) {
      apiRequest(`/pedidos-web/${actualizado.codigo}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({
          nuevoEstado: nuevoBackendEstado,
          transportadora: extra.transportadora || actualizado.transportadora,
          numeroGuia: extra.guiaTransportadora || actualizado.guiaTransportadora,
          observacion: nota || titulos[nuevoEstado],
        }),
      }).catch((err) => console.warn('Aviso sincronización backend estado pedido:', err));
    }
  }

  // Notificación asíncrona por correo al cliente sobre el cambio de estado de su pedido
  if (actualizado?.emailCliente) {
    try {
      apiRequest('/notificaciones/estado-pedido', {
        method: 'POST',
        body: JSON.stringify({
          codigo: actualizado.codigo,
          clienteNombre: actualizado.cliente,
          clienteEmail: actualizado.emailCliente,
          nuevoEstado,
          nuevoEstadoTexto: titulos[nuevoEstado] || nuevoEstado,
          descripcionEstado: nota || `Tu pedido #${actualizado.codigo} ha avanzado a estado ${titulos[nuevoEstado] || nuevoEstado}.`,
          sedeAsignada: actualizado.sedeAsignada,
          guiaTransportadora: extra.guiaTransportadora || actualizado.guiaTransportadora,
          transportadora: extra.transportadora || actualizado.transportadora,
        }),
      }).catch((err) => console.warn('Aviso: envío de correo cambio de estado:', err));
    } catch {
      // Ignorar fallback
    }
  }

  return actualizado;
};

/**
 * Permite que la primera sede en hacer clic en "Iniciar Alistamiento" tome y bloquee el pedido.
 * Si otra sede ya lo tomó antes, devuelve ok: false para evitar doble despacho.
 */
export const tomarPedidoWebEnSede = (
  codigo: string,
  sede: string,
  usuario: string
): { ok: boolean; pedido?: PedidoWebRecord; error?: string } => {
  const actual = getWebOrder(codigo);
  if (!actual) {
    return { ok: false, error: 'El pedido no existe.' };
  }
  if (actual.estado !== 'RECIBIDO' && actual.estado !== 'CONFIRMADO') {
    if (!mismaSede(actual.sedeAsignada, sede)) {
      return {
        ok: false,
        error: `Este pedido ya fue tomado para alistamiento por ${actual.sedeAsignada}.`,
      };
    }
  }

  // Guardrail estricto de inventario: solo puede tomar el pedido si la sede cuenta con stock físico real
  if (!sedeTieneStockParaPedido(sede, actual.productos)) {
    const prendasSinStock = actual.productos
      .filter((p) => obtenerStockSede(p.sku, sede) < p.cantidad)
      .map((p) => `${p.nombre} (${p.sku}) [Stock en sede: ${obtenerStockSede(p.sku, sede)} uds]`)
      .join(', ');
    return {
      ok: false,
      error: `No es posible tomar este pedido en ${sede}: no cuenta con stock disponible en inventario (${prendasSinStock}).`,
    };
  }

  const actualizado = transicionarPedidoWeb(
    codigo,
    'EN_PREPARACION',
    usuario,
    {
      sedeAsignada: sede,
      observaciones: actual.observaciones || `Alistamiento tomado por ${sede}`,
    },
    `Pedido tomado y bloqueado para despacho exclusivo desde ${sede}.`
  );
  return { ok: true, pedido: actualizado };
};

/**
 * Confirmación desde la Tienda Web por parte del cliente:
 * Avanza a EN_ENTREGA o a ENTREGADO (liquidando el pago contraentrega para que ingrese al sistema).
 */
export const confirmarEntregaClienteWeb = (
  codigo: string,
  paso: 'EN_ENTREGA' | 'ENTREGADO',
  clienteNombre?: string
): PedidoWebRecord | undefined => {
  const actual = getWebOrder(codigo);
  if (!actual) return undefined;
  const actor = clienteNombre || actual.cliente || 'Cliente Tienda Web';
  if (paso === 'EN_ENTREGA') {
    return transicionarPedidoWeb(
      codigo,
      'EN_ENTREGA',
      actor,
      {},
      'Cliente notificó recepción en curso / En ruta de entrega final.'
    );
  }
  return transicionarPedidoWeb(
    codigo,
    'ENTREGADO',
    actor,
    { estadoCobro: 'PAGADO' },
    actual.metodoPago === 'CONTRAENTREGA'
      ? 'Entrega confirmada por el cliente. Pago contraentrega recaudado e ingresado al sistema.'
      : 'Entrega a conformidad confirmada por el cliente en plataforma web.'
  );
};

/** Solo Admin: confirma que el dinero llegó a la cuenta de FORMA (CA-40). */
export const registrarPagoWeb = (codigo: string, usuario: string, referencia?: string) =>
  updateWebOrder(
    codigo,
    { estadoCobro: 'PAGADO', ...(referencia ? { referenciaPago: referencia } : {}) },
    nuevoEvento('Pago confirmado por Administración', usuario, referencia ? `Ref: ${referencia}` : undefined)
  );

/**
 * Espejo hacia la clave por cliente `forma_pedidos_${email}` que leen MiCuenta y Soporte,
 * para que el cliente vea el estado real que avanza el POS.
 */
const espejarEnCuentaCliente = (p: PedidoWebRecord) => {
  if (!p.emailCliente) return;
  const key = `forma_pedidos_${p.emailCliente.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    const lista: any[] = raw ? JSON.parse(raw) : [];
    const idx = FLUJO_ESTADOS_WEB.indexOf(p.estado);
    const fmt = (iso: string) =>
      new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    const timelineFechas: Record<string, string> = {};
    p.historial.forEach((ev) => {
      if (ev.estado) timelineFechas[ev.estado] = fmt(ev.fechaIso);
    });
    const espejo = {
      codigo: p.codigo,
      cliente: p.cliente,
      emailCliente: p.emailCliente,
      ciudadDestino: p.ciudadDestino,
      codigoDaneDestino: p.codigoDaneDestino,
      sedeAsignada: p.sedeAsignada,
      direccionEntrega: p.direccionEntrega,
      estadoActual: p.estado,
      indiceEstado: idx >= 0 ? idx : 0,
      estadoCobro: p.estadoCobro,
      guiaTransportadora: p.guiaTransportadora || '',
      transportadora: p.transportadora || '',
      metodoPago: p.metodoPagoTexto,
      fechaCreacionBogota: fmt(p.fechaCreacionIso),
      fechaActualizacionBogota: fmt(p.historial[p.historial.length - 1]?.fechaIso || p.fechaCreacionIso),
      totalCOP: p.totalCOP,
      totalFormateadoCOP: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(p.totalCOP),
      productos: p.productos.map((x) => ({ ...x, sedeDespacho: p.sedeAsignada })),
      timelineFechas,
    };
    const i = lista.findIndex((x) => x?.codigo === p.codigo);
    if (i >= 0) lista[i] = { ...lista[i], ...espejo };
    else lista.unshift(espejo);
    localStorage.setItem(key, JSON.stringify(lista));
  } catch {
    /* noop */
  }
};

export const resetWebOrders = () => {
  try {
    localStorage.removeItem(KEY_GLOBAL);
  } catch {
    /* noop */
  }
  emitir();
};

/**
 * Sincroniza pedidos web desde el backend PostgreSQL (/api/pedidos-web)
 * hacia el almacén local compartido (KEY_GLOBAL).
 */
export const syncWebOrdersFromApi = async (): Promise<PedidoWebRecord[]> => {
  try {
    const resp = await apiRequest<{ ok: boolean; datos: any[] }>('/pedidos-web');
    if (!resp || !Array.isArray(resp.datos)) {
      return getWebOrders();
    }

    const pedidosApi: PedidoWebRecord[] = resp.datos.map((d: any) => {
      const lineas: ProductoPedidoWeb[] = Array.isArray(d.lineas)
        ? d.lineas.map((l: any) => ({
            id: l.id || l.varianteId || 1,
            sku: l.variante?.sku || l.sku || 'SKU-WEB',
            nombre: l.variante?.producto?.nombre || l.nombre || 'Prenda FORMA',
            talla: l.variante?.talla || l.talla || 'Única',
            color: l.variante?.color || l.color || 'Estándar',
            cantidad: Number(l.cantidad) || 1,
            precioUnitarioCOP: Number(l.precioUnitario) || 0,
            imagenUrl: l.variante?.producto?.imagenUrl || '/products/blazer-imperial-vinotinto.png',
            sedeDespacho: d.ubicacionAsignada?.nombre || 'Bodega Central',
          }))
        : [];

      return {
        codigo: d.codigo,
        fechaCreacionIso: d.fechaCreacion ? new Date(d.fechaCreacion).toISOString() : new Date().toISOString(),
        cliente: d.cliente?.nombreCompleto || 'Cliente Web',
        emailCliente: d.cliente?.correo || 'cliente@forma.com',
        telefono: d.cliente?.telefono || '',
        documento: d.cliente?.numeroDocumento || '',
        ciudadDestino: d.municipioDestino?.nombre
          ? `${d.municipioDestino.nombre} (${d.municipioDestino.departamento || 'Colombia'})`
          : 'Colombia',
        codigoDaneDestino: d.municipioDestino?.codigoDane || '54001',
        direccionEntrega: d.direccionEntrega || 'Dirección no especificada',
        sedeAsignada: d.ubicacionAsignada?.nombre || 'Bodega Central',
        metodoPago: d.metodoPago || 'TRANSFERENCIA',
        metodoPagoTexto: d.metodoPago === 'CONTRAENTREGA' ? 'Pago Contra Entrega' : 'Transferencia Bancaria QR',
        subtotalCOP: Number(d.subtotal) || 0,
        ivaCOP: Number(d.iva) || 0,
        fleteCOP: Number(d.flete) || 0,
        totalCOP: Number(d.total) || 0,
        estado: (d.estadoPedido as EstadoPedidoWeb) || 'RECIBIDO',
        estadoCobro: d.estadoPago === 'PAGADO' ? 'PAGADO' : 'PENDIENTE_VERIFICACION',
        guiaTransportadora: d.guiaTransporte || undefined,
        transportadora: d.transportadora || undefined,
        observaciones: d.observaciones || undefined,
        productos: lineas,
        historial: [
          nuevoEvento(
            'Pedido registrado en sistema',
            d.cliente?.nombreCompleto || 'Sistema Web',
            `Estado: ${d.estadoPedido}`,
            (d.estadoPedido as EstadoPedidoWeb) || 'RECIBIDO'
          ),
        ],
      };
    });

    const existentes = getWebOrders();
    const mapa = new Map<string, PedidoWebRecord>();
    existentes.forEach((p) => mapa.set(p.codigo, p));
    pedidosApi.forEach((p) => {
      const prev = mapa.get(p.codigo);
      if (prev && prev.historial && prev.historial.length > p.historial.length) {
        mapa.set(p.codigo, { ...p, historial: prev.historial });
      } else {
        mapa.set(p.codigo, p);
      }
    });

    const listaFinal = Array.from(mapa.values()).sort(
      (a, b) => new Date(b.fechaCreacionIso).getTime() - new Date(a.fechaCreacionIso).getTime()
    );

    guardar(listaFinal);
    return listaFinal;
  } catch (err) {
    console.warn('No se pudo sincronizar pedidos web desde API:', err);
    return getWebOrders();
  }
};
