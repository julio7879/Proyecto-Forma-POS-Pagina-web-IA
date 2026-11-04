import type { Prisma, TipoUbicacion } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/domain/AppError.js';
import type { CrearUbicacionInput, ActualizarUbicacionInput } from './ubicacion.schema.js';

// Estados terminales de un traslado. RECHAZADO también es terminal (nunca movió stock).
// RECIBIDO_CON_NOVEDAD NO es terminal: sigue abierto hasta resolverse y pasar a CERRADO.
const TRASLADO_ESTADOS_FINALES = ['RECIBIDO', 'CANCELADO', 'CERRADO', 'RECHAZADO'] as const;
const PEDIDO_WEB_ESTADOS_FINALES = ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'] as const;

export class UbicacionService {
    static async listar(filtros?: { activa?: boolean | undefined; tipo?: TipoUbicacion | undefined }) {
        return prisma.ubicacion.findMany({
            where: {
                ...(filtros?.activa !== undefined && { activa: filtros.activa }),
                ...(filtros?.tipo !== undefined && { tipo: filtros.tipo }),
            },
            orderBy: [{ prioridadDespacho: 'asc' }, { nombre: 'asc' }],
        });
    }

    static async obtenerPorId(id: number) {
        const ubicacion = await prisma.ubicacion.findUnique({ where: { id } });
        if (!ubicacion) throw AppError.notFound('Ubicación no encontrada');
        return ubicacion;
    }

    static async crear(data: CrearUbicacionInput, usuarioId: number) {
        return prisma.$transaction(async (tx) => {
            // RN-UBI-01: Bodega Central única
            if (data.tipo === 'CENTRAL') {
                const central = await tx.ubicacion.findFirst({ where: { tipo: 'CENTRAL' } });
                if (central) throw AppError.conflict('Ya existe una Bodega Central en el sistema');
            }

            const duplicada = await tx.ubicacion.findFirst({ where: { nombre: data.nombre } });
            if (duplicada) throw AppError.conflict('Ya existe una ubicación con ese nombre');

            const municipio = await tx.municipioDane.findUnique({ where: { codigoDane: data.municipioDaneId } });
            if (!municipio) throw AppError.badRequest('El código DANE de municipio no existe');

            // La Bodega Central no despacha web ni opera cajas
            const creada = await tx.ubicacion.create({
                data: data.tipo === 'CENTRAL' ? { ...data, despachaWeb: false } : data,
            });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'CREAR_UBICACION',
                    entidadTipo: 'Ubicacion',
                    entidadId: String(creada.id),
                    datosMinimos: { nombre: creada.nombre, tipo: creada.tipo },
                },
            });

            return creada;
        });
    }

    static async actualizar(id: number, data: ActualizarUbicacionInput, usuarioId: number) {
        return prisma.$transaction(async (tx) => {
            const existente = await tx.ubicacion.findUnique({ where: { id } });
            if (!existente) throw AppError.notFound('Ubicación no encontrada');

            if (data.tipo === 'CENTRAL' && existente.tipo !== 'CENTRAL') {
                const central = await tx.ubicacion.findFirst({ where: { tipo: 'CENTRAL', NOT: { id } } });
                if (central) throw AppError.conflict('Ya existe una Bodega Central en el sistema');
            }

            if (data.nombre !== undefined && data.nombre !== existente.nombre) {
                const duplicada = await tx.ubicacion.findFirst({
                    where: { nombre: data.nombre, NOT: { id } },
                });
                if (duplicada) throw AppError.conflict('Ya existe una ubicación con ese nombre');
            }

            if (data.municipioDaneId !== undefined) {
                const municipio = await tx.municipioDane.findUnique({ where: { codigoDane: data.municipioDaneId } });
                if (!municipio) throw AppError.badRequest('El código DANE de municipio no existe');
            }

            // exactOptionalPropertyTypes: Prisma no admite claves con valor undefined
            const cambios = Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== undefined),
            ) as Prisma.UbicacionUncheckedUpdateInput;

            const actualizada = await tx.ubicacion.update({ where: { id }, data: cambios });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'ACTUALIZAR_UBICACION',
                    entidadTipo: 'Ubicacion',
                    entidadId: String(id),
                    datosMinimos: { campos: Object.keys(cambios) },
                },
            });

            return actualizada;
        });
    }

    /** RN-UBI-05 / MOD-02: desactivación segura (5 condiciones, atómica). */
    static async desactivar(id: number, usuarioId: number, motivo?: string) {
        return prisma.$transaction(async (tx) => {
            const ubicacion = await tx.ubicacion.findUnique({ where: { id } });
            if (!ubicacion) throw AppError.notFound('Ubicación no encontrada');

            // Condición 1: nunca la Central
            if (ubicacion.tipo === 'CENTRAL') {
                throw AppError.unprocessable('La Bodega Central no puede desactivarse (RN-UBI-01)');
            }

            // Condición 2: stock cero (físico y no vendible)
            const stock = await tx.saldoStock.aggregate({
                where: { ubicacionId: id },
                _sum: { fisico: true, noVendible: true },
            });
            if ((stock._sum.fisico ?? 0) > 0 || (stock._sum.noVendible ?? 0) > 0) {
                throw AppError.unprocessable(
                    'No se puede desactivar: la ubicación aún tiene stock físico o no vendible',
                );
            }

            // Condición 3: cero traslados abiertos (origen o destino)
            const traslados = await tx.traslado.count({
                where: {
                    OR: [{ ubicacionOrigenId: id }, { ubicacionDestinoId: id }],
                    estado: { notIn: [...TRASLADO_ESTADOS_FINALES] },
                },
            });
            if (traslados > 0) {
                throw AppError.unprocessable('No se puede desactivar: hay traslados pendientes');
            }

            // Condición 4: cero pedidos web pendientes
            const pedidos = await tx.pedidoWeb.count({
                where: {
                    ubicacionAsignadaId: id,
                    estadoPedido: { notIn: [...PEDIDO_WEB_ESTADOS_FINALES] },
                },
            });
            if (pedidos > 0) {
                throw AppError.unprocessable('No se puede desactivar: hay pedidos web en curso');
            }

            // Condición 5: cero cajas abiertas
            const cajas = await tx.sesionCaja.count({
                where: { ubicacionId: id, estado: 'ABIERTA' },
            });
            if (cajas > 0) {
                throw AppError.unprocessable('No se puede desactivar: hay sesiones de caja abiertas');
            }

            const actualizada = await tx.ubicacion.update({
                where: { id },
                data: { activa: false, despachaWeb: false },
            });

            await tx.registroAuditoria.create({
                data: {
                    usuarioId,
                    accion: 'DESACTIVAR_UBICACION',
                    entidadTipo: 'Ubicacion',
                    entidadId: String(id),
                    datosMinimos: {
                        motivo: motivo ?? 'Desactivación administrativa',
                        fecha: new Date().toISOString(),
                    },
                },
            });

            return actualizada;
        });
    }
}