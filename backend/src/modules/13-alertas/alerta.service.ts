import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { ColombiaTime } from '../../shared/domain/ColombiaTime.js';
import type { UserAuthSnapshot } from '../../shared/middlewares/authPermission.js';
import type { ListarAlertasQuery, SeveridadAlerta, TipoAlerta } from './alerta.schema.js';

/** Una atención registrada deja de ocultar la alerta pasadas estas horas (si la condición persiste, reaparece). */
export const VIGENCIA_ATENCION_HORAS = 24;
/** Ventana para considerar "reciente" un cierre de caja con descuadre (RN-CAJ-12). */
export const VENTANA_DESCUADRE_HORAS = 48;

const HORA_MS = 60 * 60 * 1000;
const ESTADOS_PEDIDO_TERMINALES = ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'] as const;
const RANGO_SEVERIDAD: Record<SeveridadAlerta, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
/** RN-ROL-04: el vendedor solo ve alertas operativas locales (cajas y stock bajo de su sede). */
const TIPOS_VISIBLES_VENDEDOR: readonly TipoAlerta[] = ['CAJA_IRREGULAR', 'STOCK_BAJO'];

export interface AlertaOperativa {
    id: string;
    tipo: TipoAlerta;
    subtipo?: string;
    severidad: SeveridadAlerta;
    ubicacionId: number | null;
    ubicacionNombre: string | null;
    titulo: string;
    descripcion: string;
    datos: Record<string, unknown>;
    fechaGeneracion: Date;
    atendida: boolean;
    fechaAtencion?: Date;
    atendidaPor?: number;
}

export interface ConsolidadoAlertas {
    /** Alertas que cumplen tipo/severidad/sede, atendidas o no. */
    totalAlertas: number;
    totalPendientes: number;
    /** Lista resultante (si soloPendientes=true, solo las pendientes). */
    alertas: AlertaOperativa[];
}

interface AtencionRegistrada {
    fechaAtencion: Date;
    usuarioId: number;
}

/** Ejecuta la consulta solo si aplica; conserva el tipo exacto del resultado de Prisma. */
async function siCumple<T>(cond: boolean, consulta: () => Promise<T[]>): Promise<T[]> {
    return cond ? consulta() : [];
}

function leerAtencion(datosMinimos: unknown): AtencionRegistrada | null {
    if (typeof datosMinimos !== 'object' || datosMinimos === null) return null;
    const d = datosMinimos as Record<string, unknown>;
    const fecha = typeof d.fechaAtencion === 'string' ? new Date(d.fechaAtencion) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return null;
    return { fechaAtencion: fecha, usuarioId: typeof d.usuarioId === 'number' ? d.usuarioId : 0 };
}

export class AlertaService {
    /**
     * RF-REP-02: consolida las 4 familias de alertas con control territorial por rol (RN-ROL-03, RN-ROL-04).
     */
    static async listarAlertas(filtros: ListarAlertasQuery, usuarioAuth: UserAuthSnapshot): Promise<ConsolidadoAlertas> {
        const esAdmin = usuarioAuth.rol === 'ADMIN';
        let ubicacionFiltro: number | undefined;
        if (esAdmin) {
            ubicacionFiltro = filtros.ubicacionId;
        } else if (usuarioAuth.rol === 'VENDEDOR') {
            if (usuarioAuth.ubicacionId === null) throw AppError.forbidden('Su usuario no tiene una sede asignada');
            ubicacionFiltro = usuarioAuth.ubicacionId; // forzado: se ignora ?ubicacionId (RN-ROL-04)
        } else {
            throw AppError.forbidden('Su rol no tiene acceso al Centro de Alertas');
        }

        const consultar = (t: TipoAlerta): boolean =>
            (filtros.tipo === undefined || filtros.tipo === t) && (esAdmin || TIPOS_VISIBLES_VENDEDOR.includes(t));

        const ahora = new Date();
        const hoyColombia = ColombiaTime.toFechaNegocioColombia(ahora); // RN-GEN-05
        const desdeDescuadre = new Date(ahora.getTime() - VENTANA_DESCUADRE_HORAS * HORA_MS);
        const porSede = ubicacionFiltro !== undefined ? { ubicacionId: ubicacionFiltro } : {};

        const [saldosBloqueados, pedidos, sesiones, saldosBajos] = await Promise.all([
            siCumple(consultar('SKU_CUARENTENA_WEB'), () =>
                prisma.saldoStock.findMany({ where: { bloqueadoDespachoWeb: true, ...porSede } }),
            ),
            siCumple(consultar('PEDIDO_CUSTODIA_CENTRAL'), () =>
                prisma.pedidoWeb.findMany({
                    where: {
                        tieneIncidenciaStock: true,
                        estadoPedido: { notIn: [...ESTADOS_PEDIDO_TERMINALES] },
                        ...(ubicacionFiltro !== undefined && { ubicacionAsignadaId: ubicacionFiltro }),
                    },
                    include: { cliente: { select: { nombreCompleto: true } } },
                }),
            ),
            siCumple(consultar('CAJA_IRREGULAR'), () =>
                prisma.sesionCaja.findMany({
                    where: {
                        ...porSede,
                        OR: [
                            { estado: 'ABIERTA', fechaNegocioColombia: { lt: hoyColombia } },
                            { estado: 'CERRADA', fechaCierre: { gte: desdeDescuadre }, diferenciaCierreCop: { not: 0 } },
                        ],
                    },
                }),
            ),
            siCumple(consultar('STOCK_BAJO'), () =>
                prisma.saldoStock.findMany({ where: { fisico: { gte: 0, lte: filtros.umbralStock }, ...porSede } }),
            ),
        ]);

        // Datos de apoyo (nombres de sede, variante y cajero) en consultas planas
        const varianteIds = [...new Set([...saldosBloqueados, ...saldosBajos].map((s) => s.varianteId))];
        const usuarioIds = [
            ...new Set(
                sesiones.flatMap((s) => [s.abiertaPorId, s.cerradaPorId].filter((id): id is number => typeof id === 'number')),
            ),
        ];
        const [ubicaciones, variantes, usuarios] = await Promise.all([
            prisma.ubicacion.findMany({ select: { id: true, nombre: true } }),
            siCumple(varianteIds.length > 0, () =>
                prisma.variante.findMany({
                    where: { id: { in: varianteIds } },
                    include: { producto: { select: { nombre: true } } },
                }),
            ),
            siCumple(usuarioIds.length > 0, () =>
                prisma.usuario.findMany({ where: { id: { in: usuarioIds } }, select: { id: true, nombreCompleto: true } }),
            ),
        ]);
        const nombreSede = new Map<number, string>(ubicaciones.map((u) => [u.id, u.nombre]));
        const varianteMap = new Map(variantes.map((v) => [v.id, v]));
        const usuarioMap = new Map<number, string>(usuarios.map((u) => [u.id, u.nombreCompleto]));
        const sede = (id: number | null) => ({
            ubicacionId: id,
            ubicacionNombre: id !== null ? (nombreSede.get(id) ?? null) : null,
        });
        const datosVariante = (varianteId: number) => {
            const v = varianteMap.get(varianteId);
            return { varianteId, sku: v?.sku ?? null, producto: v?.producto.nombre ?? null, talla: v?.talla ?? null, color: v?.color ?? null };
        };

        const alertas: Omit<AlertaOperativa, 'atendida' | 'fechaAtencion' | 'atendidaPor'>[] = [];

        // Tipo 1: SKU en cuarentena de despacho web (CA-43)
        for (const s of saldosBloqueados) {
            if (!s.bloqueadoDespachoWeb) continue;
            const v = datosVariante(s.varianteId);
            alertas.push({
                id: `CUARENTENA_WEB:${s.id}`,
                tipo: 'SKU_CUARENTENA_WEB',
                severidad: 'CRITICA',
                ...sede(s.ubicacionId),
                titulo: `SKU en cuarentena de despacho web: ${v.sku ?? `variante ${s.varianteId}`}`,
                descripcion: `La tienda reportó "No puedo despachar" y el SKU quedó congelado para la web. ${s.motivoBloqueoWeb ?? ''}`.trim(),
                datos: { saldoStockId: s.id, ...v, fisico: s.fisico, motivoBloqueoWeb: s.motivoBloqueoWeb ?? null },
                fechaGeneracion: ahora,
            });
        }

        // Tipo 2: pedidos web en custodia central con incidencia (CA-62)
        for (const p of pedidos) {
            if (!p.tieneIncidenciaStock) continue;
            if ((ESTADOS_PEDIDO_TERMINALES as readonly string[]).includes(p.estadoPedido)) continue;
            alertas.push({
                id: `CUSTODIA_CENTRAL:${p.id}`,
                tipo: 'PEDIDO_CUSTODIA_CENTRAL',
                severidad: 'CRITICA',
                ...sede(p.ubicacionAsignadaId ?? null),
                titulo: `Pedido ${p.referenciaLegible} en custodia central con incidencia de stock`,
                descripcion: 'Ninguna sede física tuvo stock para despachar; el pedido quedó en custodia de Bodega Central.',
                datos: {
                    pedidoId: p.id,
                    referenciaLegible: p.referenciaLegible,
                    cliente: p.cliente?.nombreCompleto ?? null,
                    totalNetoProductosCop: p.totalNetoProductosCop,
                    totalAPagarCop: p.totalAPagarCop,
                    fechaPedido: p.fechaCreacion,
                    estadoPedido: p.estadoPedido,
                },
                fechaGeneracion: p.fechaCreacion,
            });
        }

        // Tipo 3: sesiones de caja irregulares (RN-CAJ-11, RN-CAJ-12, CA-56)
        for (const c of sesiones) {
            const abiertaVencida = c.estado === 'ABIERTA' && c.fechaNegocioColombia < hoyColombia;
            const descuadre =
                c.estado === 'CERRADA' &&
                c.diferenciaCierreCop !== null &&
                c.diferenciaCierreCop !== 0 &&
                c.fechaCierre !== null &&
                c.fechaCierre >= desdeDescuadre;
            if (!abiertaVencida && !descuadre) continue;

            const cajeroId = abiertaVencida ? c.abiertaPorId : (c.cerradaPorId ?? c.abiertaPorId);
            const diferencia = c.diferenciaCierreCop ?? 0;
            alertas.push({
                id: `CAJA_IRREGULAR:${c.id}`,
                tipo: 'CAJA_IRREGULAR',
                subtipo: abiertaVencida ? 'CAJA_VENCIDA_SIN_CIERRE' : 'CAJA_DESCUADRE',
                severidad: 'ALTA',
                ...sede(c.ubicacionId),
                titulo: abiertaVencida
                    ? `Caja #${c.id} sin arqueo de cierre del ${c.fechaNegocioColombia}`
                    : `Caja #${c.id} cerrada con ${diferencia > 0 ? 'sobrante' : 'faltante'} de $${Math.abs(diferencia)} COP`,
                descripcion: abiertaVencida
                    ? 'La sesión cruzó el cierre del día en Colombia sin arqueo; solo se permite su cierre (RN-CAJ-11).'
                    : 'El efectivo contado no coincide con el esperado (RN-CAJ-12).',
                datos: {
                    sesionId: c.id,
                    fechaNegocioColombia: c.fechaNegocioColombia,
                    estado: c.estado,
                    cajeroId,
                    cajero: cajeroId !== null ? (usuarioMap.get(cajeroId) ?? null) : null,
                    diferenciaCierreCop: abiertaVencida ? null : diferencia,
                    tipoDiferencia: abiertaVencida ? null : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE',
                    observacion: c.observacionCierre ?? c.observacionApertura ?? null,
                },
                fechaGeneracion: abiertaVencida ? c.fechaApertura : (c.fechaCierre ?? ahora),
            });
        }

        // Tipo 4: stock bajo por sede
        for (const s of saldosBajos) {
            if (s.fisico < 0 || s.fisico > filtros.umbralStock) continue;
            const v = datosVariante(s.varianteId);
            alertas.push({
                id: `STOCK_BAJO:${s.id}`,
                tipo: 'STOCK_BAJO',
                severidad: 'MEDIA',
                ...sede(s.ubicacionId),
                titulo: `Stock bajo: ${v.sku ?? `variante ${s.varianteId}`}`,
                descripcion: `Quedan ${s.fisico} unidad(es) físicas (umbral ${filtros.umbralStock}).`,
                datos: { saldoStockId: s.id, ...v, fisico: s.fisico, umbralStock: filtros.umbralStock },
                fechaGeneracion: ahora,
            });
        }

        // Defensa en profundidad del control territorial: nunca devolver otra sede aunque la consulta la traiga
        const visibles = alertas.filter(
            (a) => (ubicacionFiltro === undefined || a.ubicacionId === ubicacionFiltro) && (esAdmin || TIPOS_VISIBLES_VENDEDOR.includes(a.tipo)),
        );

        // Atenciones previas (RegistroAuditoria append-only)
        const atenciones = new Map<string, AtencionRegistrada>();
        if (visibles.length > 0) {
            const registros = await prisma.registroAuditoria.findMany({
                where: {
                    accion: 'ATENDER_ALERTA',
                    entidadTipo: 'AlertaOperativa',
                    entidadId: { in: visibles.map((a) => a.id) },
                },
                orderBy: { id: 'desc' }, // la más reciente primero
                select: { entidadId: true, datosMinimos: true },
            });
            for (const r of registros) {
                if (r.entidadId === null || atenciones.has(r.entidadId)) continue;
                const atencion = leerAtencion(r.datosMinimos);
                if (atencion) atenciones.set(r.entidadId, atencion);
            }
        }

        const limiteVigencia = ahora.getTime() - VIGENCIA_ATENCION_HORAS * HORA_MS;
        const consolidadas: AlertaOperativa[] = visibles
            .map((a): AlertaOperativa => {
                const at = atenciones.get(a.id);
                const vigente = at !== undefined && at.fechaAtencion.getTime() >= limiteVigencia;
                return vigente
                    ? { ...a, atendida: true, fechaAtencion: at.fechaAtencion, atendidaPor: at.usuarioId }
                    : { ...a, atendida: false };
            })
            .filter((a) => filtros.severidad === undefined || a.severidad === filtros.severidad)
            .sort(
                (x, y) =>
                    RANGO_SEVERIDAD[x.severidad] - RANGO_SEVERIDAD[y.severidad] ||
                    y.fechaGeneracion.getTime() - x.fechaGeneracion.getTime() ||
                    x.id.localeCompare(y.id),
            );

        return {
            totalAlertas: consolidadas.length,
            totalPendientes: consolidadas.filter((a) => !a.atendida).length,
            alertas: filtros.soloPendientes ? consolidadas.filter((a) => !a.atendida) : consolidadas,
        };
    }

    /**
     * Marca la alerta como atendida con trazabilidad append-only en RegistroAuditoria.
     * El vendedor solo puede atender alertas operativas de su propia sede (RN-ROL-04).
     */
    static async atenderAlerta(id: string, usuarioAuth: UserAuthSnapshot, notas?: string) {
        const partes = /^([A-Z_]+):(\d+)$/.exec(id);
        if (!partes) throw AppError.badRequest('Identificador de alerta inválido');
        const prefijo = partes[1];
        const origenId = Number(partes[2]);

        const esAdmin = usuarioAuth.rol === 'ADMIN';
        if (!esAdmin && usuarioAuth.rol !== 'VENDEDOR') throw AppError.forbidden('Su rol no puede atender alertas');
        if (!esAdmin && (prefijo === 'CUARENTENA_WEB' || prefijo === 'CUSTODIA_CENTRAL')) {
            throw AppError.forbidden('No tiene acceso a este tipo de alerta (RN-ROL-04)');
        }

        let ubicacionOrigen: number | null | undefined;
        if (prefijo === 'CUARENTENA_WEB' || prefijo === 'STOCK_BAJO') {
            ubicacionOrigen = (await prisma.saldoStock.findUnique({ where: { id: origenId }, select: { ubicacionId: true } }))?.ubicacionId;
        } else if (prefijo === 'CUSTODIA_CENTRAL') {
            const p = await prisma.pedidoWeb.findUnique({ where: { id: origenId }, select: { ubicacionAsignadaId: true } });
            ubicacionOrigen = p === null ? undefined : p.ubicacionAsignadaId;
        } else if (prefijo === 'CAJA_IRREGULAR') {
            ubicacionOrigen = (await prisma.sesionCaja.findUnique({ where: { id: origenId }, select: { ubicacionId: true } }))?.ubicacionId;
        } else {
            throw AppError.badRequest('Tipo de alerta desconocido');
        }

        // Inexistente o de otra sede → 404 (no revela existencia fuera del territorio)
        if (ubicacionOrigen === undefined || (!esAdmin && ubicacionOrigen !== usuarioAuth.ubicacionId)) {
            throw AppError.notFound('Alerta no encontrada');
        }

        const fechaAtencion = new Date();
        await prisma.registroAuditoria.create({
            data: {
                usuarioId: usuarioAuth.id,
                accion: 'ATENDER_ALERTA',
                entidadTipo: 'AlertaOperativa',
                entidadId: id,
                datosMinimos: { usuarioId: usuarioAuth.id, notas: notas ?? null, fechaAtencion: fechaAtencion.toISOString() },
            },
        });

        return { mensaje: 'Alerta marcada como atendida exitosamente', id, fechaAtencion };
    }
}