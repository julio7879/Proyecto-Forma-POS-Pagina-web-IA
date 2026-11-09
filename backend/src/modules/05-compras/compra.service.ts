import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import { InventoryLedgerService } from '../04-inventario/InventoryLedgerService.js';
import type { CrearCompraInput, ListarComprasQuery, RecibirCompraInput } from './compra.schema.js';

// Nunca exponer passwordHash/googleId al incluir las relaciones de usuario.
const USUARIO_PUBLICO = {
    id: true,
    nombreCompleto: true,
    correo: true,
} satisfies Prisma.UsuarioSelect;

/**
 * Bloqueo pesimista de la fila de la orden. Serializa recepciones/cancelaciones concurrentes
 * de la MISMA compra aunque lleguen con Idempotency-Keys distintas: la segunda verá el estado
 * ya mutado y será rechazada con 422 (RN-COM-03, CA-08). No hay riesgo de deadlock con el Kardex
 * porque el lock de la orden siempre se adquiere antes que los de SaldoStock (orden por varianteId ASC).
 */
async function bloquearCompra(tx: Prisma.TransactionClient, id: number): Promise<void> {
    await tx.$queryRaw`SELECT id FROM "CompraProveedor" WHERE id = ${id} FOR UPDATE`;
}

export class CompraService {
    static async listar(filtros: ListarComprasQuery) {
        const where: Prisma.CompraProveedorWhereInput = {};

        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        if (filtros.desde || filtros.hasta) {
            where.fechaCreacion = {
                ...(filtros.desde ? { gte: new Date(filtros.desde) } : {}),
                ...(filtros.hasta ? { lte: new Date(filtros.hasta) } : {}),
            };
        }

        const compras = await prisma.compraProveedor.findMany({
            where,
            orderBy: { fechaCreacion: 'desc' },
            include: {
                lineas: {
                    include: {
                        variante: {
                            include: {
                                producto: true,
                            },
                        },
                    },
                    orderBy: { id: 'asc' },
                },
                creadoPor: { select: USUARIO_PUBLICO },
                recibidoPor: { select: USUARIO_PUBLICO },
                _count: { select: { lineas: true } },
            },
        });

        return compras.map((c: any) => ({
            ...c,
            codigo: 'OC-' + String(c.id).padStart(4, '0'),
            lineas: (c.lineas || []).map((l: any) => ({
                id: l.id,
                compraId: l.compraId,
                varianteId: l.varianteId,
                sku: l.variante?.sku || 'VAR-' + l.varianteId,
                nombreProducto: l.variante?.producto?.nombre
                    ? l.variante.producto.nombre + ' (' + l.variante.talla + ' / ' + l.variante.color + ')'
                    : 'Prenda #' + l.varianteId,
                descripcion: l.variante?.producto?.descripcion || '',
                talla: l.variante?.talla || '',
                color: l.variante?.color || '',
                precioVentaCop: l.variante?.precioVentaCop || 0,
                cantidadPedida: l.cantidadPedida,
                cantidadRecibida: l.cantidadRecibida ?? (c.estado === 'RECIBIDA' ? l.cantidadPedida : 0),
                costoUnitarioCop: l.costoUnitarioCop ?? undefined,
                observacionDiferencia: l.observacionDiferencia,
            })),
        }));
    }

    static async obtenerPorId(id: number) {
        const compra = await prisma.compraProveedor.findUnique({
            where: { id },
            include: {
                lineas: {
                    include: {
                        variante: {
                            include: {
                                producto: true,
                            },
                        },
                    },
                    orderBy: { id: 'asc' },
                },
                creadoPor: { select: USUARIO_PUBLICO },
                recibidoPor: { select: USUARIO_PUBLICO },
            },
        });

        if (!compra) {
            throw AppError.notFound('Orden de compra no encontrada');
        }

        return {
            ...compra,
            codigo: 'OC-' + String(compra.id).padStart(4, '0'),
            lineas: (compra.lineas || []).map((l: any) => ({
                id: l.id,
                compraId: l.compraId,
                varianteId: l.varianteId,
                sku: l.variante?.sku || 'VAR-' + l.varianteId,
                nombreProducto: l.variante?.producto?.nombre
                    ? l.variante.producto.nombre + ' (' + l.variante.talla + ' / ' + l.variante.color + ')'
                    : 'Prenda #' + l.varianteId,
                descripcion: l.variante?.producto?.descripcion || '',
                talla: l.variante?.talla || '',
                color: l.variante?.color || '',
                precioVentaCop: l.variante?.precioVentaCop || 0,
                cantidadPedida: l.cantidadPedida,
                cantidadRecibida: l.cantidadRecibida ?? (compra.estado === 'RECIBIDA' ? l.cantidadPedida : 0),
                costoUnitarioCop: l.costoUnitarioCop ?? undefined,
                observacionDiferencia: l.observacionDiferencia,
            })),
        };
    }

    /**
     * RN-COM-02: la orden nace en PEDIDA y NO toca SaldoStock ni Kardex.
     */
    static async crear(data: CrearCompraInput, usuarioId: number) {
        const varianteIds = [...new Set(data.lineas.map((l) => l.varianteId))];
        const existentes = await prisma.variante.findMany({
            where: { id: { in: varianteIds } },
            select: { id: true },
        });
        if (existentes.length !== varianteIds.length) {
            const encontrados = new Set(existentes.map((v) => v.id));
            const faltantes = varianteIds.filter((vid) => !encontrados.has(vid));
            throw AppError.badRequest(`Las siguientes variantes no existen: ${faltantes.join(', ')}`);
        }

        return prisma.$transaction(async (tx) => {
            const compra = await tx.compraProveedor.create({
                data: {
                    proveedorNombre: data.proveedorNombre,
                    proveedorContacto: data.proveedorContacto ?? null,
                    notas: data.notas ?? null,
                    estado: 'PEDIDA',
                    creadoPorId: usuarioId,
                    lineas: {
                        create: data.lineas.map((l) => ({
                            varianteId: l.varianteId,
                            cantidadPedida: l.cantidadPedida,
                            costoUnitarioCop: l.costoUnitarioCop ?? null,
                        })),
                    },
                },
                include: { lineas: true },
            });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'CREAR_COMPRA',
                    entidadTipo: 'CompraProveedor',
                    entidadId: String(compra.id),
                    datosMinimos: {
                        compraId: compra.id,
                        proveedorNombre: compra.proveedorNombre,
                        estado: compra.estado,
                        lineasCount: data.lineas.length,
                    },
                },
            });

            return compra;
        });
    }

    /**
     * RN-COM-05: PEDIDA -> CANCELADA sin efecto en inventario.
     */
    static async cancelar(id: number, usuarioId: number, motivo?: string) {
        return prisma.$transaction(async (tx) => {
            await bloquearCompra(tx, id);

            const compra = await tx.compraProveedor.findUnique({
                where: { id },
                select: { id: true, estado: true },
            });
            if (!compra) {
                throw AppError.notFound('Orden de compra no encontrada');
            }
            if (compra.estado !== 'PEDIDA') {
                throw AppError.unprocessable('Solo se pueden cancelar órdenes en estado PEDIDA');
            }

            const cancelada = await tx.compraProveedor.update({
                where: { id },
                data: { estado: 'CANCELADA', version: { increment: 1 } },
                include: { lineas: true },
            });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'CANCELAR_COMPRA',
                    entidadTipo: 'CompraProveedor',
                    entidadId: String(id),
                    datosMinimos: {
                        compraId: id,
                        estadoAnterior: compra.estado,
                        estadoNuevo: 'CANCELADA',
                        motivo: motivo ?? null,
                    },
                },
            });

            return cancelada;
        });
    }

    /**
     * RN-COM-01, RN-COM-03, RN-GEN-02, RN-GEN-08, RNF-003, CA-08.
     * Recepción única: PEDIDA -> RECIBIDA, ingresando físico a Bodega Central exclusivamente
     * a través de InventoryLedgerService. Todo ocurre en una sola transacción interactiva,
     * incluida la persistencia de la clave de idempotencia (atomicidad stock + respuesta cacheada).
     */
    static async recibir(
        id: number,
        usuarioId: number,
        data?: RecibirCompraInput,
        idempotencyKey?: string
    ) {
        return prisma.$transaction(async (tx) => {
            // RN-COM-01: toda compra ingresa por la Bodega Central
            const central = await tx.ubicacion.findFirst({ where: { tipo: 'CENTRAL' } });
            if (!central) {
                throw new AppError('No existe una Bodega Central configurada en el sistema', 500);
            }

            await bloquearCompra(tx, id);

            const compra = await tx.compraProveedor.findUnique({
                where: { id },
                include: { lineas: true },
            });
            if (!compra) {
                throw AppError.notFound('Orden de compra no encontrada');
            }
            if (compra.estado !== 'PEDIDA') {
                throw AppError.unprocessable(
                    `No se puede recibir una orden en estado ${compra.estado}. Solo órdenes PEDIDAS pueden recibirse.`
                );
            }

            // Cantidades recibidas por línea: explícitas del body o 100% de lo pedido por defecto
            const recibidoPorLinea = new Map<number, { cantidadRecibida: number; observacion: string | null }>();
            if (data?.lineas) {
                const idsDeLaOrden = new Set(compra.lineas.map((l) => l.id));
                for (const l of data.lineas) {
                    if (!idsDeLaOrden.has(l.lineaId)) {
                        throw AppError.badRequest(`La línea ${l.lineaId} no pertenece a la orden de compra #${compra.id}`);
                    }
                    recibidoPorLinea.set(l.lineaId, {
                        cantidadRecibida: l.cantidadRecibida,
                        observacion: l.observacionDiferencia ?? null,
                    });
                }
                // La recepción es única (RN-COM-03): no puede quedar ninguna línea sin declarar.
                if (recibidoPorLinea.size !== compra.lineas.length) {
                    throw AppError.badRequest(
                        'Debe informar la cantidad recibida de todas las líneas de la orden: la recepción es única y no admite complementos.'
                    );
                }
            }

            const lineasARecibir = compra.lineas
                .map((linea) => {
                    const explicita = recibidoPorLinea.get(linea.id);
                    return {
                        linea,
                        cantidadRecibida: explicita ? explicita.cantidadRecibida : linea.cantidadPedida,
                        observacion: explicita ? explicita.observacion : null,
                    };
                })
                // RNF-003 / Invariante 4: orden canónico anti-deadlock por varianteId ASC (desempate por id de línea)
                .sort((a, b) => a.linea.varianteId - b.linea.varianteId || a.linea.id - b.linea.id);

            for (const { linea, cantidadRecibida, observacion } of lineasARecibir) {
                if (cantidadRecibida > 0) {
                    // RN-GEN-02: única vía para mutar SaldoStock
                    await InventoryLedgerService.registrarMovimiento(tx, {
                        tipo: 'COMPRA_RECIBIDA',
                        ubicacionId: central.id,
                        varianteId: linea.varianteId,
                        cantidadConSigno: cantidadRecibida,
                        afectaSaldo: 'FISICO',
                        documentoTipo: 'COMPRA',
                        documentoId: compra.id,
                        usuarioId,
                        motivo: observacion ?? `Recepción OC #${compra.id}`,
                        autoCrearSiNoExiste: true,
                    });
                }

                await tx.lineaCompra.update({
                    where: { id: linea.id },
                    data: { cantidadRecibida, observacionDiferencia: observacion },
                });
            }

            const compraRecibida = await tx.compraProveedor.update({
                where: { id },
                data: {
                    estado: 'RECIBIDA',
                    recibidoPorId: usuarioId,
                    fechaRecepcion: new Date(),
                    version: { increment: 1 },
                },
                include: { lineas: true },
            });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'RECIBIR_COMPRA',
                    entidadTipo: 'CompraProveedor',
                    entidadId: String(compra.id),
                    datosMinimos: {
                        compraId: compra.id,
                        ubicacionId: central.id,
                        lineas: lineasARecibir.map(({ linea, cantidadRecibida }) => ({
                            lineaId: linea.id,
                            varianteId: linea.varianteId,
                            cantidadPedida: linea.cantidadPedida,
                            cantidadRecibida,
                        })),
                    },
                },
            });

            // CA-08 / RN-GEN-08: el snapshot se guarda con la MISMA forma que la respuesta HTTP
            // ({ ok, datos }) porque requireIdempotencyKey devuelve responseBody tal cual en los reintentos.
            if (idempotencyKey) {
                const snapshot = JSON.parse(
                    JSON.stringify({ ok: true, datos: compraRecibida })
                ) as Prisma.InputJsonValue;

                await tx.registroIdempotencia.create({
                    data: {
                        idempotencyKey,
                        usuarioId,
                        endpoint: `/api/compras/${id}/recibir`,
                        statusCode: 200,
                        responseBody: snapshot,
                    },
                });
            }

            return compraRecibida;
        });
    }
}