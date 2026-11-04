/**
 * Pruebas QA complementarias (Issue #35 / PR #31, SP1-03).
 * Cubren casos del checklist que la suite original no verifica y
 * DOCUMENTAN huecos de RN-UBI-01 (ver docs/qa/SP1-03/README.md).
 * Mismo arnés que ubicaciones.test.ts: Prisma 100% mockeado.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
    usuario: { findUnique: vi.fn() },
    ubicacion: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    municipioDane: { findUnique: vi.fn() },
    saldoStock: { aggregate: vi.fn() },
    traslado: { count: vi.fn() },
    pedidoWeb: { count: vi.fn() },
    sesionCaja: { count: vi.fn() },
    registroAuditoria: { create: vi.fn() },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({ prisma: prismaMock, default: prismaMock }));

import request from 'supertest';
import { app } from '../../../app.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';

const permisosOff = {
    permVender: false,
    permCaja: false,
    permDescuentoManual: false,
    permAnularVentas: false,
    permDevoluciones: false,
    permVerInventario: false,
    permSolicitarTraslado: false,
    permRecibirTraslado: false,
    permVerOtrosPuntos: false,
    permPedidosWeb: false,
    permVerVentasPunto: false,
};

const usuarios: Record<number, unknown> = {
    1: { id: 1, correo: 'admin@forma.com', rol: 'ADMIN', ubicacionId: null, activo: true, topeDescuentoPorc: 100, ...permisosOff },
    2: { id: 2, correo: 'vend@forma.com', rol: 'VENDEDOR', ubicacionId: 3, activo: true, topeDescuentoPorc: 0, ...permisosOff },
};

const ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const VENDEDOR = `Bearer ${generateToken({ userId: 2, correo: 'vend@forma.com', rol: 'VENDEDOR' })}`;

const sedeBase = { id: 5, nombre: 'Sede Centro', tipo: 'PUNTO_VENTA', activa: true, despachaWeb: true };
const central = {
    id: 1,
    nombre: 'Bodega Central',
    tipo: 'CENTRAL',
    activa: true,
    despachaWeb: true,
    prioridadDespacho: 40,
    baseCajaCop: 0,
};

describe('QA SP1-03 - Módulo 02 Ubicaciones (casos complementarios)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        UserPermissionCache.clear();
        prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
        prismaMock.usuario.findUnique.mockImplementation(
            async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null,
        );
        prismaMock.ubicacion.findUnique.mockResolvedValue(sedeBase);
        prismaMock.ubicacion.findFirst.mockResolvedValue(null);
        prismaMock.municipioDane.findUnique.mockResolvedValue({ codigoDane: '54001' });
        prismaMock.saldoStock.aggregate.mockResolvedValue({ _sum: { fisico: 0, noVendible: 0 } });
        prismaMock.traslado.count.mockResolvedValue(0);
        prismaMock.pedidoWeb.count.mockResolvedValue(0);
        prismaMock.sesionCaja.count.mockResolvedValue(0);
        prismaMock.ubicacion.update.mockResolvedValue({ ...sedeBase, activa: false, despachaWeb: false });
        prismaMock.registroAuditoria.create.mockResolvedValue({});
        prismaMock.$executeRaw.mockResolvedValue(1);
    });

    it('QA-1. desactivar rechaza stock NO VENDIBLE > 0 aunque físico sea 0 (422)', async () => {
        prismaMock.saldoStock.aggregate.mockResolvedValue({ _sum: { fisico: 0, noVendible: 2 } });
        const res = await request(app).patch('/api/ubicaciones/5/desactivar').set('Authorization', ADMIN).send({});
        expect(res.status).toBe(422);
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('QA-2. traslados "abiertos" incluyen EN_TRANSITO y RECIBIDO_CON_NOVEDAD (solo excluye estados finales)', async () => {
        await request(app).patch('/api/ubicaciones/5/desactivar').set('Authorization', ADMIN).send({});
        const where = prismaMock.traslado.count.mock.calls[0]![0].where;
        expect(where.estado.notIn).toEqual(['RECIBIDO', 'CANCELADO', 'CERRADO', 'RECHAZADO']);
        expect(where.estado.notIn).not.toContain('EN_TRANSITO');
        expect(where.estado.notIn).not.toContain('RECIBIDO_CON_NOVEDAD');
    });

    it('QA-3. desactivación exitosa: activa=false, despachaWeb=false y RegistroAuditoria DESACTIVAR_UBICACION con motivo', async () => {
        const res = await request(app)
            .patch('/api/ubicaciones/5/desactivar')
            .set('Authorization', ADMIN)
            .send({ motivo: 'Cierre de local QA' });
        expect(res.status).toBe(200);
        expect(prismaMock.ubicacion.update).toHaveBeenCalledWith({
            where: { id: 5 },
            data: { activa: false, despachaWeb: false },
        });
        expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                usuarioId: 1,
                accion: 'DESACTIVAR_UBICACION',
                entidadId: '5',
                datosMinimos: expect.objectContaining({ motivo: 'Cierre de local QA' }),
            }),
        });
    });

    it('QA-4. desactivar exige ADMIN: VENDEDOR → 403, sin token → 401', async () => {
        const v = await request(app).patch('/api/ubicaciones/5/desactivar').set('Authorization', VENDEDOR).send({});
        const s = await request(app).patch('/api/ubicaciones/5/desactivar').send({});
        expect(v.status).toBe(403);
        expect(s.status).toBe(401);
    });

    it('QA-5. desactivar sede inexistente → 404', async () => {
        prismaMock.ubicacion.findUnique.mockResolvedValue(null);
        const res = await request(app).patch('/api/ubicaciones/999/desactivar').set('Authorization', ADMIN).send({});
        expect(res.status).toBe(404);
    });

    it('QA-6. DELETE responde 400 y orienta a la desactivación segura (RN-GEN-07)', async () => {
        const res = await request(app).delete('/api/ubicaciones/5').set('Authorization', ADMIN);
        expect(res.status).toBe(400);
        expect(res.body.error.message).toMatch(/borrado físico/i);
        expect(res.body.error.message).toMatch(/desactivaci[oó]n/i);
    });

    it('QA-7. PUT rechaza baseCajaCop con decimales (400, RN-GEN-04)', async () => {
        const res = await request(app).put('/api/ubicaciones/5').set('Authorization', ADMIN).send({ baseCajaCop: 200000.5 });
        expect(res.status).toBe(400);
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('QA-8. PUT rechaza municipioDaneId no numérico (400)', async () => {
        const res = await request(app).put('/api/ubicaciones/5').set('Authorization', ADMIN).send({ municipioDaneId: 'ABCDE' });
        expect(res.status).toBe(400);
    });

    it('QA-9. PUT rechaza baseCajaCop negativa (400)', async () => {
        const res = await request(app).put('/api/ubicaciones/5').set('Authorization', ADMIN).send({ baseCajaCop: -1 });
        expect(res.status).toBe(400);
    });

    it('[HALLAZGO] QA-10. PUT sobre la Central ACEPTA despachaWeb=false y baseCajaCop>0 (rompe RN-UBI-01/03)', async () => {
        prismaMock.ubicacion.findUnique.mockResolvedValue(central);
        prismaMock.ubicacion.update.mockResolvedValue({ ...central, despachaWeb: false, baseCajaCop: 500000 });
        const res = await request(app)
            .put('/api/ubicaciones/1')
            .set('Authorization', ADMIN)
            .send({ despachaWeb: false, baseCajaCop: 500000 });
        // Comportamiento actual (defecto): 200. Lo esperado sería 422.
        expect(res.status).toBe(200);
        expect(prismaMock.ubicacion.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { despachaWeb: false, baseCajaCop: 500000 },
        });
    });

    it('[HALLAZGO] QA-11. POST Central con prioridadDespacho explícita distinta de 100 NO se fuerza a 40', async () => {
        prismaMock.ubicacion.create.mockImplementation(async ({ data }: { data: unknown }) => ({ id: 1, ...(data as object) }));
        const res = await request(app)
            .post('/api/ubicaciones')
            .set('Authorization', ADMIN)
            .send({
                nombre: 'Bodega Central Cúcuta',
                tipo: 'CENTRAL',
                municipioDaneId: '54001',
                direccion: 'Zona Industrial Lote 4',
                prioridadDespacho: 5,
            });
        expect(res.status).toBe(201);
        expect(prismaMock.ubicacion.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ prioridadDespacho: 5, baseCajaCop: 0, despachaWeb: true }),
        });
    });

    it('[HALLAZGO] QA-12. PUT puede volver despachaWeb=true en una sede DESACTIVADA', async () => {
        const inactiva = { ...sedeBase, activa: false, despachaWeb: false };
        prismaMock.ubicacion.findUnique.mockResolvedValue(inactiva);
        prismaMock.ubicacion.update.mockResolvedValue({ ...inactiva, despachaWeb: true });
        const res = await request(app).put('/api/ubicaciones/5').set('Authorization', ADMIN).send({ despachaWeb: true });
        // Comportamiento actual: 200 → una sede inactiva quedaría elegible para despacho web.
        expect(res.status).toBe(200);
    });
});
