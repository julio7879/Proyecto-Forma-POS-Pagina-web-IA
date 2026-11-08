// frontend/src/features/pos/utils/cajaStore.ts
// Sesiones de caja por sede persistidas en localStorage (MVP sin backend).
// Reglas: RN-CAJ (una sesión ABIERTA por sede, base inicial declarada, arqueo ciego al cierre),
// RN-GEN-04 (COP enteros), RN-GEN-03 (los movimientos no se borran: se anulan con contramovimiento).

import {
  getPosRegisteredSales,
  getPosRegisteredExchanges,
  ensureCleanZeroStoreStockReset,
} from './posLedgerSync';
import { mismaSede } from './webOrdersStore';

ensureCleanZeroStoreStockReset();

export type TipoMovimientoCaja = 'RETIRO_CAJA_FUERTE' | 'GASTO_MENOR' | 'INGRESO_REINTEGRO';

export interface MovimientoCaja {
  id: string;
  fechaIso: string;
  tipo: TipoMovimientoCaja;
  montoCop: number;
  motivo: string;
  usuario: string;
  comprobanteRef: string;
  anulado?: boolean;
  fechaAnulacionIso?: string;
  motivoAnulacion?: string;
}

export interface SesionCaja {
  id: string;
  sede: string;
  turnoNumero: number;
  estado: 'ABIERTA' | 'CERRADA';
  vendedor: string;
  aperturaIso: string;
  baseInicialCop: number;
  observacionApertura?: string;
  movimientos: MovimientoCaja[];
  cierreIso?: string;
  efectivoContadoCop?: number;
  efectivoEsperadoCop?: number;
  diferenciaCop?: number;
  observacionCierre?: string;
  conteoDenominaciones?: Record<string, number>;
}

export interface ResumenSesionCaja {
  ventasEfectivoCop: number;
  efectivoRecibidoBrutoCop: number;
  vueltosEntregadosCop: number;
  ventasTransferenciaCop: number;
  excedentesCambiosEfectivoCop: number;
  excedentesCambiosTransferenciaCop: number;
  reintegrosCambiosEfectivoCop: number;
  retirosCop: number;
  ingresosCop: number;
  numeroVentas: number;
  efectivoEsperadoCop: number;
}

export const CAJA_EVENT = 'forma-caja-update';
const KEY_SESIONES = 'forma_caja_sesiones';

const emitir = () => {
  try {
    window.dispatchEvent(new Event(CAJA_EVENT));
  } catch {
    /* noop */
  }
};

export const getSesionesCaja = (): SesionCaja[] => {
  try {
    const raw = localStorage.getItem(KEY_SESIONES);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const guardar = (lista: SesionCaja[]) => {
  try {
    localStorage.setItem(KEY_SESIONES, JSON.stringify(lista));
  } catch {
    /* noop */
  }
  emitir();
};

export const getSesionesPorSede = (sede: string): SesionCaja[] =>
  getSesionesCaja()
    .filter((s) => mismaSede(s.sede, sede))
    .sort((a, b) => b.aperturaIso.localeCompare(a.aperturaIso));

export const getSesionAbierta = (sede: string): SesionCaja | undefined =>
  getSesionesPorSede(sede).find((s) => s.estado === 'ABIERTA');

export const abrirSesionCaja = (
  sede: string,
  vendedor: string,
  baseInicialCop: number,
  observacion?: string
): SesionCaja => {
  const existente = getSesionAbierta(sede);
  if (existente) return existente;
  const previas = getSesionesPorSede(sede);
  const maxTurno = previas.reduce((max, p) => Math.max(max, p.turnoNumero || 0), 0);
  const nextTurno = maxTurno + 1;
  const sesion: SesionCaja = {
    id: `CAJ-${Date.now()}-${nextTurno}`,
    sede,
    turnoNumero: nextTurno,
    estado: 'ABIERTA',
    vendedor,
    aperturaIso: new Date().toISOString(),
    baseInicialCop: Math.max(0, Math.trunc(baseInicialCop)),
    observacionApertura: observacion,
    movimientos: [],
  };
  guardar([sesion, ...getSesionesCaja()]);
  return sesion;
};

const actualizarSesion = (id: string, fn: (s: SesionCaja) => SesionCaja) => {
  let res: SesionCaja | undefined;
  const lista = getSesionesCaja().map((s) => {
    if (s.id !== id) return s;
    res = fn(s);
    return res;
  });
  if (res) guardar(lista);
  return res;
};

export const registrarMovimientoCaja = (
  sesionId: string,
  mov: Omit<MovimientoCaja, 'id' | 'fechaIso' | 'comprobanteRef'>
) =>
  actualizarSesion(sesionId, (s) => ({
    ...s,
    movimientos: [
      ...s.movimientos,
      {
        ...mov,
        montoCop: Math.max(0, Math.trunc(mov.montoCop)),
        id: `MOV-${Date.now()}-${s.movimientos.length + 1}`,
        fechaIso: new Date().toISOString(),
        comprobanteRef: `${mov.tipo === 'INGRESO_REINTEGRO' ? 'ING' : 'RET'}-${String(
          s.movimientos.length + 1
        ).padStart(3, '0')}`,
      },
    ],
  }));

/** Anulación (no borrado): el movimiento queda en bitácora marcado como anulado. */
export const anularMovimientoCaja = (sesionId: string, movId: string, motivo: string) =>
  actualizarSesion(sesionId, (s) => ({
    ...s,
    movimientos: s.movimientos.map((m) =>
      m.id === movId
        ? { ...m, anulado: true, fechaAnulacionIso: new Date().toISOString(), motivoAnulacion: motivo }
        : m
    ),
  }));

/** Totales de la sesión calculados desde las ventas/cambios reales registrados en esa sede y ventana. */
export const resumenSesion = (s: SesionCaja): ResumenSesionCaja => {
  const desde = s.aperturaIso;
  const hasta = s.cierreIso || '9999';
  const enVentana = (iso?: string) => Boolean(iso && iso >= desde && iso <= hasta);

  let ventasEfectivoCop = 0;
  let efectivoRecibidoBrutoCop = 0;
  let vueltosEntregadosCop = 0;
  let ventasTransferenciaCop = 0;
  let numeroVentas = 0;
  getPosRegisteredSales().forEach((v) => {
    if (!mismaSede(v.sede, s.sede)) return;
    if (v.sesionCajaId) {
      if (v.sesionCajaId !== s.id) return;
    } else if (!enVentana(v.fechaIso)) {
      return;
    }
    numeroVentas++;
    if ((v.medioPago || v.metodoPago) === 'EFECTIVO') {
      ventasEfectivoCop += v.totalCop;
      const recibido = v.montoRecibidoCop ?? v.efectivoRecibidoCop ?? v.totalCop;
      const cambio = v.cambioCop ?? Math.max(0, recibido - v.totalCop);
      efectivoRecibidoBrutoCop += recibido;
      vueltosEntregadosCop += cambio;
    } else {
      ventasTransferenciaCop += v.totalCop;
    }
  });

  let excedentesCambiosEfectivoCop = 0;
  let excedentesCambiosTransferenciaCop = 0;
  let reintegrosCambiosEfectivoCop = 0;
  getPosRegisteredExchanges().forEach((c) => {
    if (!mismaSede(c.sede, s.sede)) return;
    if (c.sesionCajaId) {
      if (c.sesionCajaId !== s.id) return;
    } else if (!enVentana(c.fechaIso)) {
      return;
    }
    if (c.tipoLiquidacion === 'EXCEDENTE_COBRADO') {
      if (c.medioPagoExcedente === 'TRANSFERENCIA') excedentesCambiosTransferenciaCop += c.diferenciaCop;
      else excedentesCambiosEfectivoCop += c.diferenciaCop;
    } else if (c.tipoLiquidacion === 'REINTEGRO_A_FAVOR' && c.diferenciaCop !== 0) {
      reintegrosCambiosEfectivoCop += Math.abs(c.diferenciaCop);
    }
  });

  const activos = s.movimientos.filter((m) => !m.anulado);
  const retirosCop = activos
    .filter((m) => m.tipo !== 'INGRESO_REINTEGRO')
    .reduce((a, m) => a + m.montoCop, 0);
  const ingresosCop = activos
    .filter((m) => m.tipo === 'INGRESO_REINTEGRO')
    .reduce((a, m) => a + m.montoCop, 0);

  return {
    ventasEfectivoCop,
    efectivoRecibidoBrutoCop,
    vueltosEntregadosCop,
    ventasTransferenciaCop,
    excedentesCambiosEfectivoCop,
    excedentesCambiosTransferenciaCop,
    reintegrosCambiosEfectivoCop,
    retirosCop,
    ingresosCop,
    numeroVentas,
    efectivoEsperadoCop:
      s.baseInicialCop +
      ventasEfectivoCop +
      excedentesCambiosEfectivoCop +
      ingresosCop -
      retirosCop -
      reintegrosCambiosEfectivoCop,
  };
};

export const cerrarSesionCaja = (
  sesionId: string,
  efectivoContadoCop: number,
  observacion?: string,
  conteoDenominaciones?: Record<string, number>
) => {
  const s = getSesionesCaja().find((x) => x.id === sesionId);
  if (!s) return undefined;
  const cierreIso = new Date().toISOString();
  const esperado = resumenSesion({ ...s, cierreIso }).efectivoEsperadoCop;
  const contado = Math.max(0, Math.trunc(efectivoContadoCop));
  return actualizarSesion(sesionId, (x) => ({
    ...x,
    estado: 'CERRADA',
    cierreIso,
    efectivoContadoCop: contado,
    efectivoEsperadoCop: esperado,
    diferenciaCop: contado - esperado,
    observacionCierre: observacion,
    conteoDenominaciones,
  }));
};

export const resetCaja = () => {
  try {
    localStorage.removeItem(KEY_SESIONES);
  } catch {
    /* noop */
  }
  emitir();
};
