// frontend/src/features/pos/utils/posLedgerSync.ts

export interface PosSaleItem {
  sku: string;
  nombre: string;
  talla?: string;
  color?: string;
  categoria?: string;
  cantidad: number;
  precioUnitarioCop?: number;
  precioUnitarioCOP?: number;
  totalCop: number;
  imagenUrl?: string;
}

export interface PosSaleRecord {
  id: string;
  consecutivo: string;
  fechaHora: string;
  /** ISO UTC; usado para cuadrar la venta con la sesión de caja (RN-GEN-05). */
  fechaIso?: string;
  sesionCajaId?: string;
  fechaCorta?: string;
  vendedor: string;
  sede?: string;
  cliente?: string;
  documentoCliente?: string;
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA';
  medioPago?: 'EFECTIVO' | 'TRANSFERENCIA';
  referenciaPago?: string;
  totalCop: number;
  subtotalCop: number;
  ivaCop?: number;
  iva19Cop?: number;
  montoRecibidoCop?: number;
  efectivoRecibidoCop?: number;
  cambioCop?: number;
  items?: PosSaleItem[];
  prendas?: PosSaleItem[];
}

export interface PosExchangeRecord {
  id: string;
  consecutivoFactura: string;
  fecha: string;
  cliente: string;
  prendaDevuelta: string;
  prendaDevueltaSku: string;
  prendaEntregada: string;
  prendaEntregadaSku: string;
  motivo: string;
  diferenciaCop: number;
  tipoLiquidacion: 'MANO_A_MANO_0' | 'EXCEDENTE_COBRADO' | 'REINTEGRO_A_FAVOR';
  medioPagoExcedente?: string;
  observaciones: string;
  impactoKardex: string;
  fechaIso?: string;
  sede?: string;
  vendedor?: string;
  sesionCajaId?: string;
  estadoPrendaDevuelta?: 'BUEN_ESTADO' | 'CON_IMPERFECTO';
  valorDevueltoCop?: number;
  valorEntregadoCop?: number;
  prendaDevueltaImg?: string;
  prendaEntregadaImg?: string;
}

const STORAGE_KEYS = {
  DELTAS: 'forma_pos_stock_deltas',
  SALES: 'forma_pos_ventas_registradas',
  EXCHANGES: 'forma_pos_cambios_registrados',
};

export const CLEAN_RESET_KEY = 'forma_clean_canonical_4196_v4';

export const ensureCleanZeroStoreStockReset = (): void => {
  try {
    if (typeof window === 'undefined' || Boolean((import.meta as any).env?.VITEST)) {
      return;
    }
    if (localStorage.getItem(CLEAN_RESET_KEY) !== '1') {
      const keysToClear = [
        'forma_caja_sesiones',
        'pos_caja_abierta_terminal',
        'pos_caja_estado',
        'pos_caja_usuario_id',
        'forma_pos_stock_deltas',
        'forma_pos_ventas_registradas',
        'forma_pos_cambios_registrados',
        'forma_pos_recepciones_kardex',
        'forma_pos_solicitudes_traslado',
        'forma_admin_traslados',
        'forma_pedidos_web',
        'forma_pedidos_web_global',
        'forma_admin_compras',
        'forma_admin_ventas',
        'forma_admin_clientes',
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(CLEAN_RESET_KEY, '1');
    }
  } catch {
    // Ignore storage errors
  }
};

ensureCleanZeroStoreStockReset();

export const getAllStockDeltas = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELTAS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getStockDelta = (sku: string): number => {
  const deltas = getAllStockDeltas();
  return deltas[sku.toUpperCase()] || 0;
};

export const applyStockDelta = (sku: string, delta: number): void => {
  const deltas = getAllStockDeltas();
  const key = sku.toUpperCase();
  deltas[key] = (deltas[key] || 0) + delta;
  try {
    localStorage.setItem(STORAGE_KEYS.DELTAS, JSON.stringify(deltas));
    window.dispatchEvent(new Event('forma-pos-ledger-update'));
  } catch {
    // Ignore storage errors
  }
};

export const getBodegaCentralDelta = (sku: string): number => {
  return getStockDelta(`BODEGA::${sku}`);
};

export const applyBodegaCentralDelta = (sku: string, delta: number): void => {
  applyStockDelta(`BODEGA::${sku}`, delta);
};

export const getPosRegisteredSales = (): PosSaleRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const recordPosSale = (sale: PosSaleRecord): void => {
  const current = getPosRegisteredSales();
  current.unshift(sale);
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(current));
    window.dispatchEvent(new Event('forma-pos-ledger-update'));
  } catch {
    // Ignore storage errors
  }
};

export const getPosRegisteredExchanges = (): PosExchangeRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXCHANGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const recordPosExchange = (exchange: PosExchangeRecord): void => {
  const current = getPosRegisteredExchanges();
  current.unshift(exchange);
  try {
    localStorage.setItem(STORAGE_KEYS.EXCHANGES, JSON.stringify(current));
    window.dispatchEvent(new Event('forma-pos-ledger-update'));
  } catch {
    // Ignore storage errors
  }
};

export const getPosShiftFinancialDeltas = (): {
  efectivoExtraCop: number;
  transferenciaExtraCop: number;
} => {
  const sales = getPosRegisteredSales();
  let efectivoExtraCop = 0;
  let transferenciaExtraCop = 0;

  for (const s of sales) {
    const isEfectivo = (s.metodoPago || s.medioPago) === 'EFECTIVO';
    if (isEfectivo) {
      efectivoExtraCop += s.totalCop;
    } else {
      transferenciaExtraCop += s.totalCop;
    }
  }

  // Sumar excedentes cobrados de cambios mano a mano
  const exchanges = getPosRegisteredExchanges();
  for (const ex of exchanges) {
    if (ex.tipoLiquidacion === 'EXCEDENTE_COBRADO' && ex.diferenciaCop > 0) {
      if (ex.medioPagoExcedente === 'TRANSFERENCIA') {
        transferenciaExtraCop += ex.diferenciaCop;
      } else {
        efectivoExtraCop += ex.diferenciaCop;
      }
    }
  }

  return { efectivoExtraCop, transferenciaExtraCop };
};

export const resetPosLedgerSync = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELTAS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.EXCHANGES);
    window.dispatchEvent(new Event('forma-pos-ledger-update'));
  } catch {
    // Ignore
  }
};
