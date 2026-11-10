// frontend/src/features/admin/services/adminService.ts
import { apiRequest } from '../../../api/apiClient';
import { PRODUCTOS_SEMILLA } from '../../storefront/services/catalogService';
import {
  getStockDelta,
  applyStockDelta,
  getPosRegisteredSales,
  getPosRegisteredExchanges,
} from '../../pos/utils/posLedgerSync';

// ============================================
// DTOs de Inventario
// ============================================
export interface InventarioDTO {
  id: number;
  sku: string;
  nombreProducto: string;
  categoriaNombre: string;
  sedeId: number;
  sedeNombre: string;
  fisico: number;
  disponible: number;
  reservadoBlando: number;
  reservadoDuro: number;
  noVendible: number;
  umbralStockBajo: number;
}

export interface InventarioFiltro {
  categoria?: string;
  sku?: string;
  stockBajo?: boolean;
}

// ============================================
// DTOs de Compras y Distribuidores Asociados
// ============================================
export type EstadoCompra = 'PEDIDA' | 'RECIBIDA' | 'CANCELADA';

export interface LineaCompraDTO {
  id: number;
  varianteId: number;
  sku: string;
  nombreProducto: string;
  descripcion?: string;
  talla?: string;
  color?: string;
  precioVentaCop?: number;
  cantidadPedida: number;
  cantidadRecibida: number;
  costoUnitarioCop?: number;
  observacionDiferencia?: string | null;
}

export interface OrdenCompraDTO {
  id: number;
  codigo: string;
  proveedorNombre: string;
  proveedorContacto?: string;
  notas?: string;
  estado: EstadoCompra;
  fechaCreacion: string;
  fechaRecepcion?: string | null;
  lineas: LineaCompraDTO[];
}

export interface DistribuidorAsociado {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  especialidad: string;
  descuentoMayoristaPorc: number; // Porcentaje de descuento sobre PVP (ej: 50% = costo al 50%)
  categorias: string[];
}

export const DISTRIBUIDORES_OFICIALES: DistribuidorAsociado[] = [
  {
    id: 'dist-1',
    nombre: 'Hilaturas & Sedas del Oriente S.A.S',
    nit: '900.542.110-4',
    contacto: 'María Camila Restrepo · Gerente de Cuentas',
    telefono: '+57 310 456 7890',
    email: 'ventas@sedasdeloriente.co',
    ciudad: 'Bucaramanga, Santander',
    especialidad: 'Sedas naturales andinas, lino 100% orgánico y champaña satinada',
    descuentoMayoristaPorc: 52, // Costo mayorista: 48% del PVP
    categorias: ['Ropa'],
  },
  {
    id: 'dist-2',
    nombre: 'Confecciones & Sastrería Imperial Andina S.A.S',
    nit: '901.238.455-8',
    contacto: 'Hernán Darío Gómez · Director Comercial',
    telefono: '+57 312 890 1234',
    email: 'pedidos@sastreriaandina.co',
    ciudad: 'Cúcuta, Norte de Santander',
    especialidad: 'Blazers en lana fría de sastre, chaquetas térmicas 3D y algodón peinado 220 GSM',
    descuentoMayoristaPorc: 55, // Costo mayorista: 45% del PVP
    categorias: ['Ropa'],
  },
  {
    id: 'dist-3',
    nombre: 'Manufacturas de Cuero & Calzado La Fontana S.A.S',
    nit: '890.312.980-1',
    contacto: 'Valeria Cárdenas · Directora de Ventas Mayoristas',
    telefono: '+57 315 678 9012',
    email: 'mayoristas@lafontanaleather.co',
    ciudad: 'Bogotá D.C.',
    especialidad: 'Piel vacuna flor entera, calzado Oxford, mocasines miel y bolsos tote de lujo',
    descuentoMayoristaPorc: 50, // Costo mayorista: 50% del PVP
    categorias: ['Accesorios', 'Calzado'],
  },
  {
    id: 'dist-4',
    nombre: 'Laboratorios Botánicos & Cuidado Facial del Valle S.A.S',
    nit: '900.871.234-9',
    contacto: 'Dra. Elena Monsalve · Dirección Técnica y Despachos',
    telefono: '+57 318 234 5678',
    email: 'distribucion@botanicosdelvalle.co',
    ciudad: 'Cali, Valle del Cauca',
    especialidad: 'Sérums botánicos oro 24K, aceite puro de sacha inchi y cosmética limpia certificada',
    descuentoMayoristaPorc: 58, // Costo mayorista: 42% del PVP
    categorias: ['Cosméticos'],
  },
  {
    id: 'dist-5',
    nombre: 'Maestría Artesanal & Tejidos Tradicionales S.A.S',
    nit: '800.654.321-7',
    contacto: 'Taita Jairo Chindoy · Maestro Tejedor y Representante',
    telefono: '+57 320 123 4567',
    email: 'contacto@maestriatradicional.co',
    ciudad: 'Nobsa, Boyacá / Pasto, Nariño',
    especialidad: 'Lana virgen de oveja hilada a mano, palma de iraca fina, werregue y tejidos Wayuu',
    descuentoMayoristaPorc: 48, // Costo mayorista: 52% del PVP
    categorias: ['Artesanías'],
  },
];

export interface CrearLineaCompraDto {
  varianteId: number;
  cantidadPedida: number;
  costoUnitarioCop?: number;
}

export interface CrearOrdenCompraDto {
  proveedorNombre: string;
  proveedorContacto?: string;
  notas?: string;
  lineas: CrearLineaCompraDto[];
}

export interface RecepcionCompraDto {
  lineas: Array<{
    lineaId: number;
    cantidadRecibida: number;
  }>;
}

// ============================================
// DTOs de Traslados
// ============================================
export type EstadoTraslado =
  | 'SOLICITADO'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'ENVIADO'
  | 'RETORNANDO_A_CENTRAL'
  | 'RECIBIDO'
  | 'RECIBIDO_CON_NOVEDAD'
  | 'CERRADO'
  | 'CANCELADO';

export type TipoResolucionNovedad =
  | 'LLEGO_DESPUES'
  | 'RETORNO_A_CENTRAL'
  | 'PERDIDA_ASUMIDA'
  | 'INCORPORAR_A_PUNTO'
  | 'DESCARTAR_EXCEDENTE';

export interface LineaTrasladoDTO {
  id: number;
  varianteId: number;
  sku: string;
  nombreProducto: string;
  cantidadSolicitada: number;
  cantidadAprobada: number;
  cantidadEnviada: number;
  recibidaBuena: number;
  recibidaDanada: number;
}

export interface TrasladoDTO {
  id: number;
  codigo: string;
  origenId: number;
  origenNombre: string;
  destinoId: number;
  destinoNombre: string;
  estado: EstadoTraslado;
  fechaSolicitud: string;
  fechaEnvio?: string;
  fechaRecepcion?: string;
  lineas: LineaTrasladoDTO[];
  observaciones?: string;
}

export interface DespachoTrasladoDto {
  trasladoId: number;
  lineas: Array<{
    lineaId: number;
    cantidadEnviada: number;
  }>;
}

export interface RecepcionTrasladoDto {
  trasladoId: number;
  lineas: Array<{
    lineaId: number;
    recibidaBuena: number;
    recibidaDanada: number;
    excedenteReportado?: number;
  }>;
  observaciones?: string;
}

export interface ResolucionNovedadDto {
  trasladoId: number;
  resoluciones: Array<{
    lineaId: number;
    tipo: TipoResolucionNovedad;
    cantidad: number;
    notas?: string;
  }>;
}

export interface CrearSolicitudTrasladoDto {
  ubicacionDestinoId: number;
  esEnvioDirecto?: boolean;
  lineas: Array<{
    varianteId: number;
    cantidadSolicitada: number;
  }>;
}

export interface CrearSolicitudTrasladoLocalDto {
  origenId: number;
  origenNombre: string;
  destinoId: number;
  destinoNombre: string;
  observaciones?: string;
  despacharInmediatamente?: boolean;
  lineas: Array<{
    varianteId: number;
    sku: string;
    nombreProducto: string;
    cantidadSolicitada: number;
  }>;
}

// ============================================
// Funciones de Inventario (RN-GEN-01: Fuente única PostgreSQL)
// ============================================

export const getLocalInventario = (filtro: InventarioFiltro = {}): InventarioDTO[] => {
  const SEDES_INVENTARIO = [
    { id: 1, nombre: 'Bodega Central' },
    { id: 2, nombre: 'Punto Centro' },
    { id: 8, nombre: 'Punto Caobos' },
    { id: 3, nombre: 'Punto Ocaña' },
    { id: 4, nombre: 'Punto Bucaramanga' },
  ];

  const result: InventarioDTO[] = [];
  let currentId = 1;

  // Cargar traslados confirmados para cálculo de deltas por sede
  let traslados: any[] = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('forma_admin_traslados') : null;
    traslados = raw ? JSON.parse(raw) : [];
  } catch {
    traslados = [];
  }

  // Cargar ventas y cambios POS para descontar de las sedes físicas
  const ventas = typeof window !== 'undefined' ? getPosRegisteredSales() : [];
  const cambios = typeof window !== 'undefined' ? getPosRegisteredExchanges() : [];

  for (const sede of SEDES_INVENTARIO) {
    const isCentral = sede.id === 1;

    for (const prod of PRODUCTOS_SEMILLA) {
      // Filtrado por categoría si se especificó
      if (
        filtro.categoria &&
        filtro.categoria !== 'Todas' &&
        prod.categoriaNombre.toUpperCase() !== filtro.categoria.toUpperCase()
      ) {
        continue;
      }

      for (const v of prod.variantes) {
        // Filtrado por SKU o nombre si se especificó
        if (filtro.sku) {
          const q = filtro.sku.toLowerCase();
          const matchSku = v.sku.toLowerCase().includes(q);
          const matchNombre = prod.nombre.toLowerCase().includes(q);
          if (!matchSku && !matchNombre) {
            continue;
          }
        }

        let fisico = 0;
        let noVendible = 0;
        const reservadoBlando = 0;
        const reservadoDuro = 0;

        if (isCentral) {
          // Bodega Central: stock inicial de catálogo + delta BODEGA::SKU
          const deltaCentral = typeof window !== 'undefined' ? getStockDelta(`BODEGA::${v.sku}`) : 0;
          fisico = Math.max(0, (v.stockDisponible || 0) + deltaCentral);
        } else {
          // Punto de venta físico:
          // 1. Sumar unidades recibidas de traslados hacia esta sede
          let recibidasSede = 0;
          let averiasSede = 0;

          if (Array.isArray(traslados)) {
            traslados.forEach((t) => {
              const destino = String(t.destinoNombre || '').toLowerCase();
              const sedeNombre = sede.nombre.toLowerCase();
              if (
                (destino.includes(sedeNombre) || sedeNombre.includes(destino)) &&
                (t.estado === 'RECIBIDO' || t.estado === 'RECIBIDO_CON_NOVEDAD')
              ) {
                (t.lineas || []).forEach((l: any) => {
                  if (String(l.sku || '').toUpperCase() === v.sku.toUpperCase()) {
                    recibidasSede += Number(l.recibidaBuena ?? l.cantidadEnviada ?? 0);
                    averiasSede += Number(l.recibidaDanada ?? 0);
                  }
                });
              }
            });
          }

          // 2. Deltas directos si se usó applyStockDelta
          const deltaDirecto = typeof window !== 'undefined' ? (getStockDelta(`${sede.nombre}::${v.sku}`) || 0) : 0;
          const deltaAveria = typeof window !== 'undefined' ? (getStockDelta(`${sede.nombre}::AVERIA::${v.sku}`) || 0) : 0;

          // 3. Descontar ventas POS en esta sede
          let vendidasSede = 0;
          ventas.forEach((sale) => {
            const saleSede = String(sale.sede || '').toLowerCase();
            const sedeNombre = sede.nombre.toLowerCase();
            if (saleSede.includes(sedeNombre) || sedeNombre.includes(saleSede)) {
              const saleItems = (sale as any).items || (sale as any).prendas || [];
              saleItems.forEach((item: any) => {
                if (String(item.sku || '').toUpperCase() === v.sku.toUpperCase()) {
                  vendidasSede += Number(item.cantidad || 0);
                }
              });
            }
          });

          // 4. Ajustar por cambios mano a mano
          let cambiosDelta = 0;
          cambios.forEach((c) => {
            const cSede = String(c.sede || '').toLowerCase();
            const sedeNombre = sede.nombre.toLowerCase();
            if (cSede.includes(sedeNombre) || sedeNombre.includes(cSede)) {
              if (String(c.prendaEntregadaSku || '').toUpperCase() === v.sku.toUpperCase()) {
                cambiosDelta -= 1;
              }
              if (
                String(c.prendaDevueltaSku || '').toUpperCase() === v.sku.toUpperCase() &&
                c.estadoPrendaDevuelta === 'BUEN_ESTADO'
              ) {
                cambiosDelta += 1;
              }
            }
          });

          fisico = Math.max(0, Math.max(recibidasSede, deltaDirecto) - vendidasSede + cambiosDelta);
          noVendible = Math.max(averiasSede, deltaAveria);
        }

        const disponible = Math.max(0, fisico - reservadoBlando - reservadoDuro - noVendible);
        const umbralStockBajo = 4;

        if (filtro.stockBajo && disponible > umbralStockBajo) {
          continue;
        }

        result.push({
          id: currentId++,
          sku: v.sku,
          nombreProducto: `${prod.nombre} (${v.talla} · ${v.color})`,
          categoriaNombre: prod.categoriaNombre,
          sedeId: sede.id,
          sedeNombre: sede.nombre,
          fisico,
          disponible,
          reservadoBlando,
          reservadoDuro,
          noVendible,
          umbralStockBajo,
        });
      }
    }
  }

  return result;
};

export const getStoredTraslados = (): TrasladoDTO[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('forma_admin_traslados') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(mapBackendTraslado);
      }
    }
  } catch {
    // noop
  }
  return [];
};

function mapBackendTraslado(t: any): TrasladoDTO {
  return {
    id: t.id,
    codigo: t.codigo || `TRL-${String(t.id).padStart(4, '0')}`,
    origenId: t.ubicacionOrigenId ?? t.ubicacionOrigen?.id ?? 1,
    origenNombre: t.ubicacionOrigen?.nombre ?? t.origenNombre ?? 'Bodega Central',
    destinoId: t.ubicacionDestinoId ?? t.ubicacionDestino?.id,
    destinoNombre: t.ubicacionDestino?.nombre ?? t.destinoNombre ?? 'Punto Destino',
    estado: t.estado,
    fechaSolicitud: t.fechaSolicitud,
    fechaEnvio: t.fechaEnvio,
    fechaRecepcion: t.fechaRecepcion,
    observaciones: t.observaciones || t.motivoRechazo,
    lineas: (t.lineas || []).map((l: any) => ({
      id: l.id,
      varianteId: l.varianteId,
      sku: l.variante?.sku || l.sku || `VAR-${l.varianteId}`,
      nombreProducto: l.variante?.producto?.nombre || l.nombreProducto || 'Prenda de Colección',
      cantidadSolicitada: l.cantidadSolicitada,
      cantidadAprobada: l.cantidadAprobada ?? l.cantidadSolicitada,
      cantidadEnviada: l.cantidadEnviada ?? 0,
      recibidaBuena: l.cantidadRecibidaBuena ?? l.recibidaBuena ?? 0,
      recibidaDanada: l.cantidadRecibidaDanada ?? l.recibidaDanada ?? 0,
    })),
  };
}

export const crearSolicitudTraslado = async (
  payload: CrearSolicitudTrasladoDto,
  idempotencyKey?: string
): Promise<TrasladoDTO> => {
  const key =
    idempotencyKey ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `TRL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

  const response = await apiRequest<{ datos: any }>('/traslados', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Idempotency-Key': key },
  });
  return mapBackendTraslado(response.datos);
};

export const createSolicitudTrasladoLocal = async (
  payload: CrearSolicitudTrasladoLocalDto
): Promise<TrasladoDTO> => {
  let resultado: TrasladoDTO;
  try {
    resultado = await crearSolicitudTraslado({
      ubicacionDestinoId: payload.destinoId,
      esEnvioDirecto: payload.despacharInmediatamente,
      lineas: payload.lineas.map((l) => ({
        varianteId: l.varianteId,
        cantidadSolicitada: l.cantidadSolicitada,
      })),
    });
  } catch {
    const nuevoId = Date.now();
    const codigoTrl = `TRL-${String(nuevoId).slice(-4)}`;
    resultado = {
      id: nuevoId,
      codigo: codigoTrl,
      origenId: payload.origenId,
      origenNombre: payload.origenNombre,
      destinoId: payload.destinoId,
      destinoNombre: payload.destinoNombre,
      estado: payload.despacharInmediatamente ? 'ENVIADO' : 'APROBADO',
      fechaSolicitud: new Date().toISOString(),
      fechaEnvio: payload.despacharInmediatamente ? new Date().toISOString() : undefined,
      observaciones: payload.observaciones,
      lineas: payload.lineas.map((l, i) => ({
        id: nuevoId + i + 1,
        varianteId: l.varianteId,
        sku: l.sku || `SKU-${l.varianteId}`,
        nombreProducto: l.nombreProducto || `Producto ${l.sku}`,
        cantidadSolicitada: l.cantidadSolicitada,
        cantidadAprobada: l.cantidadSolicitada,
        cantidadEnviada: payload.despacharInmediatamente ? l.cantidadSolicitada : 0,
        recibidaBuena: 0,
        recibidaDanada: 0,
      })),
    };
  }

  // Guardar en localStorage para disponibilidad inmediata en Admin y POS
  try {
    const raw = localStorage.getItem('forma_admin_traslados');
    const arr = raw ? JSON.parse(raw) : [];
    const lista = Array.isArray(arr) ? arr : [];
    localStorage.setItem('forma_admin_traslados', JSON.stringify([resultado, ...lista]));
  } catch {
    // noop
  }

  return resultado;
};

export const fetchInventario = async (
  filtro: InventarioFiltro = {}
): Promise<InventarioDTO[]> => {
  const params = new URLSearchParams();
  if (filtro.categoria && filtro.categoria !== 'Todas') {
    params.append('categoria', filtro.categoria);
  }
  if (filtro.sku) params.append('sku', filtro.sku);
  if (filtro.stockBajo) params.append('stockBajo', 'true');
  params.append('limite', '500');

  const query = params.toString();
  try {
    const response = await apiRequest<{ datos: InventarioDTO[] }>(
      `/inventario${query ? `?${query}` : ''}`
    );
    if (response && Array.isArray(response.datos) && response.datos.length > 0) {
      return response.datos;
    }
  } catch {
    // Fallback reactivo con cálculo de Kardex local
  }
  return getLocalInventario(filtro);
};

// ============================================
// Funciones de Compras (Reposición e Ingresos Mayoristas)
// ============================================
const SEED_ORDENES_COMPRA: OrdenCompraDTO[] = [
  {
    id: 1,
    codigo: 'ORD-2026-001',
    proveedorNombre: 'Confecciones & Sastrería Imperial Andina S.A.S',
    proveedorContacto: 'Hernán Darío Gómez · Director Comercial',
    notas: 'Reabastecimiento mayorista de blazers, chalecos y sastrería de autor para temporada.',
    estado: 'PEDIDA',
    fechaCreacion: new Date().toISOString(),
    lineas: [
      {
        id: 101,
        varianteId: 1001,
        sku: 'ROP-BLZ-IMP-S',
        nombreProducto: 'Blazer Imperial Sastrería (Talla S)',
        cantidadPedida: 240,
        cantidadRecibida: 0,
        costoUnitarioCop: 135000,
      },
      {
        id: 102,
        varianteId: 1002,
        sku: 'ROP-BLZ-IMP-M',
        nombreProducto: 'Blazer Imperial Sastrería (Talla M)',
        cantidadPedida: 320,
        cantidadRecibida: 0,
        costoUnitarioCop: 135000,
      },
      {
        id: 103,
        varianteId: 1003,
        sku: 'ROP-BLZ-IMP-L',
        nombreProducto: 'Blazer Imperial Sastrería (Talla L)',
        cantidadPedida: 260,
        cantidadRecibida: 0,
        costoUnitarioCop: 135000,
      },
    ],
  },
];

export const fetchOrdenesCompra = async (): Promise<OrdenCompraDTO[]> => {
  try {
    const response = await apiRequest<{ datos: OrdenCompraDTO[] }>('/compras');
    if (response && Array.isArray(response.datos) && response.datos.length > 0) {
      return response.datos;
    }
  } catch {
    // Fallback a almacenamiento local / semilla
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('forma_admin_compras') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // noop
  }

  return SEED_ORDENES_COMPRA;
};

export const createOrdenCompra = async (
  payload: CrearOrdenCompraDto,
  idempotencyKey: string
): Promise<OrdenCompraDTO> => {
  let backendResult: OrdenCompraDTO | null = null;
  try {
    const response = await apiRequest<{ datos: OrdenCompraDTO }>('/compras', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    backendResult = response.datos;
  } catch {
    // Modo local
  }

  const existing = await fetchOrdenesCompra();
  const nextId = Date.now();
  const nuevaOrden: OrdenCompraDTO = {
    id: nextId,
    codigo: `ORD-${new Date().getFullYear()}-${String(existing.length + 1).padStart(3, '0')}`,
    proveedorNombre: payload.proveedorNombre,
    proveedorContacto: payload.proveedorContacto,
    notas: payload.notas,
    estado: 'PEDIDA',
    fechaCreacion: new Date().toISOString(),
    lineas: payload.lineas.map((l, idx) => ({
      id: nextId + idx + 1,
      varianteId: l.varianteId,
      sku: `VAR-${l.varianteId}`,
      nombreProducto: `Prenda Lote #${l.varianteId}`,
      cantidadPedida: l.cantidadPedida,
      cantidadRecibida: 0,
      costoUnitarioCop: l.costoUnitarioCop || 95000,
    })),
  };

  const listaActualizada = [nuevaOrden, ...existing];
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forma_admin_compras', JSON.stringify(listaActualizada));
    }
  } catch {
    // noop
  }

  return backendResult || nuevaOrden;
};

export const recibirOrdenCompra = async (
  compraId: number,
  payload: RecepcionCompraDto,
  idempotencyKey: string
): Promise<OrdenCompraDTO> => {
  let backendResult: OrdenCompraDTO | null = null;
  try {
    const response = await apiRequest<{ datos: OrdenCompraDTO }>(
      `/compras/${compraId}/recepcionar`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    backendResult = response.datos;
  } catch {
    // Modo local
  }

  const existing = await fetchOrdenesCompra();
  const actualizadas = existing.map((o) => {
    if (o.id !== compraId) return o;
    const nowIso = new Date().toISOString();
    return {
      ...o,
      estado: 'RECIBIDA' as EstadoCompra,
      fechaRecepcion: nowIso,
      lineas: o.lineas.map((l) => {
        const match = payload.lineas.find((pl) => pl.lineaId === l.id);
        const cantRecibida = match ? match.cantidadRecibida : l.cantidadPedida;
        return {
          ...l,
          cantidadRecibida: cantRecibida,
        };
      }),
    };
  });

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forma_admin_compras', JSON.stringify(actualizadas));
    }
  } catch {
    // noop
  }

  const res = actualizadas.find((o) => o.id === compraId);
  return backendResult || res || existing[0];
};

// ============================================
// Funciones de Traslados (RN-TRA-01 a RN-TRA-19)
// ============================================
export const fetchTraslados = async (estado?: EstadoTraslado): Promise<TrasladoDTO[]> => {
  const query = estado ? `?estado=${estado}` : '';
  let apiTraslados: TrasladoDTO[] = [];
  try {
    const response = await apiRequest<{ datos: any[] }>(`/traslados${query}`);
    if (response && Array.isArray(response.datos)) {
      apiTraslados = response.datos.map(mapBackendTraslado);
    }
  } catch {
    // Modo offline o fallback local
  }

  // Cargar traslados sincronizados en localStorage (fuente canónica: forma_admin_traslados)
  const localTraslados: TrasladoDTO[] = [];
  try {
    const rawAdmin = typeof window !== 'undefined' ? localStorage.getItem('forma_admin_traslados') : null;
    if (rawAdmin) {
      const parsed = JSON.parse(rawAdmin);
      if (Array.isArray(parsed)) {
        parsed.forEach((t) => localTraslados.push(mapBackendTraslado(t)));
      }
    }
  } catch {
    // noop
  }

  // Fusión inteligente evitando duplicados: cada traslado tiene un identificador único
  const mapFinal = new Map<string, TrasladoDTO>();
  apiTraslados.forEach((t) => {
    const key = t.codigo || `ID-${t.id}`;
    mapFinal.set(key, t);
  });
  localTraslados.forEach((t) => {
    const key = t.codigo || `ID-${t.id}`;
    mapFinal.set(key, t);
  });

  const todos = Array.from(mapFinal.values()).sort(
    (a, b) =>
      new Date(b.fechaSolicitud || 0).getTime() - new Date(a.fechaSolicitud || 0).getTime()
  );

  if (estado) {
    return todos.filter((t) => t.estado === estado);
  }
  return todos;
};

export const despacharTraslado = async (
  payload: DespachoTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  let backendResult: TrasladoDTO | null = null;
  try {
    const response = await apiRequest<{ datos: any }>(
      `/traslados/${payload.trasladoId}/despachar`,
      {
        method: 'POST',
        body: JSON.stringify({ lineas: payload.lineas }),
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    backendResult = mapBackendTraslado(response.datos);
  } catch {
    // Modo local / fallback
  }

  // Actualizar en localStorage y descontar stock de Bodega Central en tiempo real
  try {
    const rawAdmin = typeof window !== 'undefined' ? localStorage.getItem('forma_admin_traslados') : null;
    const arr = rawAdmin ? JSON.parse(rawAdmin) : [];
    if (Array.isArray(arr)) {
      const nowIso = new Date().toISOString();
      const actualizados = arr.map((t: any) => {
        if (Number(t.id) !== Number(payload.trasladoId) && String(t.codigo) !== String(payload.trasladoId)) {
          return t;
        }

        const lineasActualizadas = (t.lineas || []).map((l: any) => {
          const despachoInput = payload.lineas.find((pl) => pl.lineaId === l.id);
          const cantidadEnviada = despachoInput ? despachoInput.cantidadEnviada : (l.cantidadAprobada ?? l.cantidadSolicitada);
          // Descontar inmediatamente de Bodega Central vía Kardex deltas
          if (cantidadEnviada > 0 && l.sku) {
            applyStockDelta(`BODEGA::${l.sku}`, -cantidadEnviada);
          }
          return {
            ...l,
            cantidadEnviada,
          };
        });

        return {
          ...t,
          estado: 'ENVIADO',
          fechaEnvio: nowIso,
          lineas: lineasActualizadas,
        };
      });

      localStorage.setItem('forma_admin_traslados', JSON.stringify(actualizados));
      window.dispatchEvent(new Event('forma-pos-ledger-update'));
      window.dispatchEvent(new Event('storage'));

      const updated = actualizados.find(
        (t: any) => Number(t.id) === Number(payload.trasladoId) || String(t.codigo) === String(payload.trasladoId)
      );
      if (updated) return mapBackendTraslado(updated);
    }
  } catch {
    // noop
  }

  if (backendResult) return backendResult;
  throw new Error('No se pudo despachar el traslado');
};

export const recibirTraslado = async (
  payload: RecepcionTrasladoDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  let backendResult: TrasladoDTO | null = null;
  try {
    const response = await apiRequest<{ datos: any }>(
      `/traslados/${payload.trasladoId}/recepcionar`,
      {
        method: 'POST',
        body: JSON.stringify({
          lineas: payload.lineas,
          observaciones: payload.observaciones,
        }),
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    backendResult = mapBackendTraslado(response.datos);
  } catch {
    // Modo local / fallback
  }

  // Actualizar en localStorage y sumar al inventario de la tienda destino
  try {
    const rawAdmin = typeof window !== 'undefined' ? localStorage.getItem('forma_admin_traslados') : null;
    const arr = rawAdmin ? JSON.parse(rawAdmin) : [];
    if (Array.isArray(arr)) {
      const nowIso = new Date().toISOString();
      let resultadoActualizado: any = null;

      const actualizados = arr.map((t: any) => {
        if (Number(t.id) !== Number(payload.trasladoId) && String(t.codigo) !== String(payload.trasladoId)) {
          return t;
        }

        let tieneAveria = false;
        let tieneFaltante = false;

        const lineasActualizadas = (t.lineas || []).map((l: any) => {
          const recInput = payload.lineas.find((pl) => pl.lineaId === l.id);
          const recBuena = recInput ? recInput.recibidaBuena : (l.cantidadEnviada ?? l.cantidadSolicitada);
          const recDanada = recInput ? recInput.recibidaDanada : 0;

          if (recDanada > 0) tieneAveria = true;
          if (recBuena + recDanada < (l.cantidadEnviada ?? 0)) tieneFaltante = true;

          // Acreditar stock físico en la sede destino
          const sedeDestino = t.destinoNombre || 'Punto Destino';
          if (recBuena > 0 && l.sku) {
            applyStockDelta(l.sku, recBuena);
            applyStockDelta(`${sedeDestino}::${l.sku}`, recBuena);
          }
          if (recDanada > 0 && l.sku) {
            applyStockDelta(`${sedeDestino}::AVERIA::${l.sku}`, recDanada);
          }

          return {
            ...l,
            recibidaBuena: recBuena,
            recibidaDanada: recDanada,
          };
        });

        const nuevoEstado = tieneAveria || tieneFaltante ? 'RECIBIDO_CON_NOVEDAD' : 'RECIBIDO';

        const tUpdated = {
          ...t,
          estado: nuevoEstado,
          fechaRecepcion: nowIso,
          observaciones: payload.observaciones || t.observaciones,
          lineas: lineasActualizadas,
        };
        resultadoActualizado = tUpdated;
        return tUpdated;
      });

      localStorage.setItem('forma_admin_traslados', JSON.stringify(actualizados));
      window.dispatchEvent(new Event('forma-pos-ledger-update'));
      window.dispatchEvent(new Event('storage'));

      if (resultadoActualizado) return mapBackendTraslado(resultadoActualizado);
    }
  } catch {
    // noop
  }

  if (backendResult) return backendResult;
  throw new Error('No se pudo recibir el traslado');
};

export const resolverNovedadTraslado = async (
  payload: ResolucionNovedadDto,
  idempotencyKey: string
): Promise<TrasladoDTO> => {
  let backendResult: TrasladoDTO | null = null;
  try {
    const response = await apiRequest<{ datos: any }>(
      `/traslados/${payload.trasladoId}/resolver-novedad`,
      {
        method: 'POST',
        body: JSON.stringify({ resoluciones: payload.resoluciones }),
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    backendResult = mapBackendTraslado(response.datos);
  } catch {
    // Modo local / fallback
  }

  try {
    const rawAdmin = typeof window !== 'undefined' ? localStorage.getItem('forma_admin_traslados') : null;
    const arr = rawAdmin ? JSON.parse(rawAdmin) : [];
    if (Array.isArray(arr)) {
      const actualizados = arr.map((t: any) => {
        if (Number(t.id) !== Number(payload.trasladoId) && String(t.codigo) !== String(payload.trasladoId)) {
          return t;
        }
        return {
          ...t,
          estado: 'CERRADO',
        };
      });

      localStorage.setItem('forma_admin_traslados', JSON.stringify(actualizados));
      window.dispatchEvent(new Event('forma-pos-ledger-update'));
      window.dispatchEvent(new Event('storage'));

      const updated = actualizados.find(
        (t: any) => Number(t.id) === Number(payload.trasladoId) || String(t.codigo) === String(payload.trasladoId)
      );
      if (updated) return mapBackendTraslado(updated);
    }
  } catch {
    // noop
  }

  if (backendResult) return backendResult;
  throw new Error('No se pudo resolver la novedad del traslado');
};

// ============================================
// DTOs y Funciones de Vendedores y Sedes (RN-ROL-03, RN-ROL-04, RN-ROL-05)
// ============================================
export interface UbicacionDTO {
  id: number;
  nombre: string;
  codigo: string;
  tipo: 'BODEGA_CENTRAL' | 'TIENDA_FISICA';
  esBodegaCentral: boolean;
  activo: boolean;
  ciudad?: string;
}

export interface PermisosVendedorDTO {
  permVender: boolean;
  permCaja: boolean;
  permDescuentoManual: boolean;
  permAnularVentas: boolean;
  permDevoluciones: boolean;
  permVerInventario: boolean;
  permSolicitarTraslado: boolean;
  permRecibirTraslado: boolean;
  permVerOtrosPuntos: boolean;
  permPedidosWeb: boolean;
  permVerVentasPunto: boolean;
}

export interface VendedorDTO extends PermisosVendedorDTO {
  id: number;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  activo: boolean;
  rol: string;
  ubicacionId: number | null;
  ubicacion?: {
    id: number;
    nombre: string;
    codigo: string;
    tipo: string;
  } | null;
  creadoEn: string;
}

export interface CrearVendedorDTO extends PermisosVendedorDTO {
  nombreCompleto: string;
  correo: string;
  password: string;
  ubicacionId: number;
  telefono?: string;
}

export interface ActualizarVendedorDTO extends Partial<PermisosVendedorDTO> {
  nombreCompleto?: string;
  ubicacionId?: number;
  telefono?: string;
  activo?: boolean;
}

export const fetchVendedores = async (): Promise<VendedorDTO[]> => {
  const response = await apiRequest<{ datos: VendedorDTO[] }>('/identidad/vendedores');
  return response.datos;
};

export const crearVendedor = async (payload: CrearVendedorDTO): Promise<VendedorDTO> => {
  const response = await apiRequest<{ datos: VendedorDTO }>('/identidad/vendedores', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.datos;
};

export const actualizarVendedor = async (
  id: number,
  payload: ActualizarVendedorDTO
): Promise<VendedorDTO> => {
  const response = await apiRequest<{ datos: VendedorDTO }>(`/identidad/vendedores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return response.datos;
};

export const fetchUbicaciones = async (): Promise<UbicacionDTO[]> => {
  const response = await apiRequest<{ datos: UbicacionDTO[] }>('/ubicaciones');
  return response.datos;
};
