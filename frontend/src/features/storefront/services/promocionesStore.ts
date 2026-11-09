// frontend/src/features/storefront/services/promocionesStore.ts
// Motor y almacén persistente de promociones y ofertas para Tienda Web y POS.
// Reglas: RN-GEN-04 (Dinero entero COP con Math.floor), RN-DES-02 (PORCENTAJE / VALOR_FIJO).

export interface PromocionWeb {
  id: string;
  nombre: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number; // Porcentaje entero (ej. 20 para 20%) o COP entero
  categoria: string; // 'Todas' o 'Ropa', 'Calzado', 'Accesorios', 'Cosméticos', 'Artesanías'
  skusElegibles?: string[];
  activa: boolean;
  fechaCreacionIso: string;
  descripcion?: string;
}

const STORAGE_KEY = 'forma_admin_promociones';
export const PROMOCIONES_EVENT = 'forma-promociones-update';

const PROMOCIONES_SEMILLA: PromocionWeb[] = [
  {
    id: 'PROM-TEMPORADA-20',
    nombre: 'Rebajas de Temporada 2026',
    tipo: 'PORCENTAJE',
    valor: 20,
    categoria: 'Ropa',
    activa: true,
    fechaCreacionIso: new Date().toISOString(),
    descripcion: '20% de descuento en prendas seleccionadas de sastrería y autor.',
  },
  {
    id: 'PROM-BLAZER-30',
    nombre: 'Especial Sastrería Vinotinto',
    tipo: 'PORCENTAJE',
    valor: 30,
    categoria: 'Todas',
    skusElegibles: ['ROP-BLZ-010-M', 'ROP-BLZ-010-S', 'ROP-BLZ-010-L'],
    activa: true,
    fechaCreacionIso: new Date().toISOString(),
    descripcion: '30% exclusivo en Blazers de colección imperial.',
  },
  {
    id: 'PROM-CALZADO-15',
    nombre: 'Lujo en Cuero Artesanal',
    tipo: 'PORCENTAJE',
    valor: 15,
    categoria: 'Calzado',
    activa: true,
    fechaCreacionIso: new Date().toISOString(),
    descripcion: '15% de descuento en mocasines y calzado confeccionado a mano.',
  },
];

export const getPromociones = (): PromocionWeb[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PROMOCIONES_SEMILLA));
      return PROMOCIONES_SEMILLA;
    }
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : PROMOCIONES_SEMILLA;
  } catch {
    return PROMOCIONES_SEMILLA;
  }
};

export const guardarPromocion = (promo: Omit<PromocionWeb, 'id' | 'fechaCreacionIso'> & { id?: string }): PromocionWeb => {
  const actuales = getPromociones();
  const id = promo.id || `PROM-${Date.now().toString().slice(-6)}`;
  const nueva: PromocionWeb = {
    ...promo,
    id,
    fechaCreacionIso: new Date().toISOString(),
  };

  const index = actuales.findIndex((p) => p.id === id);
  let actualizadas: PromocionWeb[];
  if (index >= 0) {
    actualizadas = [...actuales];
    actualizadas[index] = nueva;
  } else {
    actualizadas = [nueva, ...actuales];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas));
    window.dispatchEvent(new Event(PROMOCIONES_EVENT));
  } catch {
    /* noop */
  }
  return nueva;
};

export const togglePromocion = (id: string): boolean => {
  const actuales = getPromociones();
  const index = actuales.findIndex((p) => p.id === id);
  if (index < 0) return false;

  actuales[index].activa = !actuales[index].activa;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actuales));
    window.dispatchEvent(new Event(PROMOCIONES_EVENT));
  } catch {
    /* noop */
  }
  return true;
};

export const eliminarPromocion = (id: string): boolean => {
  const actuales = getPromociones();
  const filtradas = actuales.filter((p) => p.id !== id);
  if (filtradas.length === actuales.length) return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtradas));
    window.dispatchEvent(new Event(PROMOCIONES_EVENT));
  } catch {
    /* noop */
  }
  return true;
};

export interface CalculoOferta {
  tieneOferta: boolean;
  porcentajeDescuento: number;
  precioFinalCop: number;
  ahorroCop: number;
  nombrePromocion?: string;
}

/**
 * Calcula el mejor descuento aplicable a un producto respetando no-acumulación (RN-DES-04)
 * y enteros COP (RN-GEN-04).
 */
export const calcularPrecioConOferta = (
  precioOriginalCop: number,
  sku?: string,
  categoria?: string
): CalculoOferta => {
  const promociones = getPromociones().filter((p) => p.activa);
  let mejorDescuentoCop = 0;
  let porcentajeFinal = 0;
  let promoElegida: PromocionWeb | undefined;

  for (const promo of promociones) {
    const tieneRestriccionSku = Boolean(promo.skusElegibles && promo.skusElegibles.length > 0);
    const aplicaSku = tieneRestriccionSku && sku
      ? promo.skusElegibles!.some((s) => s.toUpperCase() === sku.toUpperCase())
      : false;

    if (tieneRestriccionSku && !aplicaSku) {
      continue;
    }

    const aplicaCategoria =
      promo.categoria === 'Todas' ||
      (categoria && promo.categoria.toLowerCase() === categoria.toLowerCase());

    if (!tieneRestriccionSku && !aplicaCategoria) continue;

    let descuentoEstaPromoCop = 0;
    let porcentajeEstaPromo = 0;

    if (promo.tipo === 'PORCENTAJE') {
      porcentajeEstaPromo = Math.min(100, Math.max(1, promo.valor));
      descuentoEstaPromoCop = Math.floor((precioOriginalCop * porcentajeEstaPromo) / 100);
    } else {
      descuentoEstaPromoCop = Math.min(precioOriginalCop, promo.valor);
      porcentajeEstaPromo = Math.round((descuentoEstaPromoCop / precioOriginalCop) * 100);
    }

    if (descuentoEstaPromoCop > mejorDescuentoCop) {
      mejorDescuentoCop = descuentoEstaPromoCop;
      porcentajeFinal = porcentajeEstaPromo;
      promoElegida = promo;
    }
  }

  if (mejorDescuentoCop > 0 && promoElegida) {
    return {
      tieneOferta: true,
      porcentajeDescuento: porcentajeFinal,
      precioFinalCop: Math.max(0, precioOriginalCop - mejorDescuentoCop),
      ahorroCop: mejorDescuentoCop,
      nombrePromocion: promoElegida.nombre,
    };
  }

  return {
    tieneOferta: false,
    porcentajeDescuento: 0,
    precioFinalCop: precioOriginalCop,
    ahorroCop: 0,
  };
};
