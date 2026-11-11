import { apiRequest } from '../../../api/apiClient';
import { getPortalAuth } from '../../../shared/auth/portalAuthStorage';

export interface UbicacionBackend {
  id: number;
  nombre: string;
}

export interface SesionCajaBackend {
  id: number;
  estado: 'ABIERTA' | 'CERRADA';
  fechaNegocioColombia?: string;
  esVigente?: boolean;
  ubicacionId?: number;
}

export interface VentaPOSBackend {
  id: number;
  numeroComprobante: number;
  totalNetoProductosCop: number;
  descuentoTotalCop?: number;
}

export interface LineaVentaBackend {
  varianteId: number;
  cantidad: number;
}

export interface PagoVentaBackend {
  metodo: 'EFECTIVO' | 'TRANSFERENCIA';
  montoCop: number;
  montoRecibidoEfectivoCop?: number;
  referenciaTransferencia?: string;
}

const normalizar = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

let cacheUbicaciones: UbicacionBackend[] | null = null;

export async function obtenerUbicaciones(): Promise<UbicacionBackend[]> {
  if (cacheUbicaciones) return cacheUbicaciones;
  const res = await apiRequest<{ datos: UbicacionBackend[] }>('/ubicaciones');
  cacheUbicaciones = Array.isArray(res.datos) ? res.datos : [];
  return cacheUbicaciones;
}

/**
 * Resuelve la sede del POS contra el backend.
 * Prioriza el nombre de la sede visible; si no hay match, usa la ubicación del usuario.
 */
export async function resolverUbicacionId(sedeNombre: string): Promise<number> {
  const auth = getPortalAuth('pos');
  const usuarioUbicacionId = auth.usuario?.ubicacionId;
  const objetivo = normalizar(sedeNombre);

  try {
    const ubicaciones = await obtenerUbicaciones();
    const encontrada = ubicaciones.find((u) => {
      const nombre = normalizar(u.nombre);
      return nombre === objetivo || objetivo.includes(nombre) || nombre.includes(objetivo);
    });
    if (encontrada) return encontrada.id;
  } catch {
    // Si el catálogo de sedes falla, se intenta la ubicación del usuario.
  }

  if (usuarioUbicacionId) return usuarioUbicacionId;
  throw new Error(`No se pudo resolver la sede "${sedeNombre}" contra el backend.`);
}

export async function obtenerSesionActiva(
  ubicacionId: number
): Promise<SesionCajaBackend | null> {
  const res = await apiRequest<{ datos: SesionCajaBackend | null }>(
    `/caja/sesion-activa?ubicacionId=${ubicacionId}`
  );
  return res.datos ?? null;
}

export async function abrirSesionBackend(
  ubicacionId: number,
  baseContadaCop: number,
  observacionApertura?: string
): Promise<SesionCajaBackend> {
  const body: Record<string, unknown> = {
    ubicacionId,
    baseContadaCop: Math.max(0, Math.trunc(baseContadaCop)),
  };
  if (observacionApertura?.trim()) body.observacionApertura = observacionApertura.trim();

  const res = await apiRequest<{ datos: SesionCajaBackend }>('/caja/apertura', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.datos;
}

export async function cerrarSesionBackend(
  sesionCajaId: number,
  efectivoContadoCierreCop: number,
  observacionCierre?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    sesionCajaId,
    efectivoContadoCierreCop: Math.max(0, Math.trunc(efectivoContadoCierreCop)),
  };
  if (observacionCierre?.trim()) body.observacionCierre = observacionCierre.trim();

  await apiRequest('/caja/cierre', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Garantiza una sesión de caja backend vigente.
 * Si la sesión abierta es de un día anterior, la cierra y abre una nueva.
 */
export async function asegurarSesionCaja(
  ubicacionId: number,
  baseContadaCop: number,
  observacionApertura?: string
): Promise<SesionCajaBackend> {
  let sesion = await obtenerSesionActiva(ubicacionId);

  if (sesion && sesion.esVigente === false) {
    await cerrarSesionBackend(
      sesion.id,
      0,
      'Cierre automático: sesión de caja de un día anterior'
    );
    sesion = null;
  }

  if (!sesion) {
    sesion = await abrirSesionBackend(ubicacionId, baseContadaCop, observacionApertura);
  }

  return sesion;
}

export async function registrarVentaBackend(input: {
  ubicacionId: number;
  lineas: LineaVentaBackend[];
  pagos: PagoVentaBackend[];
}): Promise<VentaPOSBackend> {
  const res = await apiRequest<{ datos: VentaPOSBackend }>('/ventas-pos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.datos;
}
