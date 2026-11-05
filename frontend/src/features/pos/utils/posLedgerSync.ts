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
}

const STORAGE_KEYS = {
  DELTAS: 'forma_pos_stock_deltas',
  SALES: 'forma_pos_ventas_registradas',
  EXCHANGES: 'forma_pos_cambios_registrados',
};

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
