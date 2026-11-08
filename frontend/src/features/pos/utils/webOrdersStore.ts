// frontend/src/features/pos/utils/webOrdersStore.ts
// Almacén persistente (localStorage) de Pedidos Web compartido por Tienda Web, POS y Admin.
// Fase MVP sin backend: será reemplazado por la API de `11-pedidos-web` (mismo contrato).
// Reglas: RN-WEB-05 (sede asignada), RN-WEB-15 (reserva dura), CA-40 (contraentrega no suma
// a ventas hasta PAGADO por Admin), CA-64 (NO_ENTREGADO = retorno logístico sin afectar ventas).

import { applyStockDelta } from './posLedgerSync';

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

const KEY_GLOBAL = 'forma_pedidos_web_global';
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

const normalizarSede = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[—–-].*$/, '')
    .trim()
    .toLowerCase();

/** Compara sedes tolerando variantes ('Punto Centro (Cúcuta)' vs 'Punto Centro — Cúcuta'). */
export const mismaSede = (a?: string, b?: string): boolean =>
  Boolean(a && b && normalizarSede(a) === normalizarSede(b));

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
    // Purga proactiva de pedidos de prueba huérfanos de $540.000
    const filtrados = Array.isArray(arr)
      ? arr.filter((p) => p && p.totalCOP !== 540000 && p.subtotalCOP !== 540000)
      : [];
    if (Array.isArray(arr) && arr.length !== filtrados.length) {
      localStorage.setItem(KEY_GLOBAL, JSON.stringify(filtrados));
    }
    return filtrados;
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
export const getWebOrdersBySede = (sede: string): PedidoWebRecord[] =>
  getWebOrders().filter((p) => {
    if (p.estado === 'RECIBIDO' || p.estado === 'CONFIRMADO') {
      return true;
    }
    return mismaSede(p.sedeAsignada, sede);
  });

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
    actual.productos.forEach((p) => applyStockDelta(p.sku, -p.cantidad));
  }
  if (nuevoEstado === 'ENTREGADO') {
    // Cuando el pedido es entregado, el dinero de contraentrega o transferencia verificada ingresa formalmente al sistema
    cambios.estadoCobro = 'PAGADO';
  }
  if (nuevoEstado === 'NO_ENTREGADO') {
    if (actual.estado === 'DESPACHADO' || actual.estado === 'EN_ENTREGA') {
      actual.productos.forEach((p) => applyStockDelta(p.sku, p.cantidad));
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

  return updateWebOrder(codigo, cambios, nuevoEvento(titulos[nuevoEstado], usuario, nota, nuevoEstado));
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
