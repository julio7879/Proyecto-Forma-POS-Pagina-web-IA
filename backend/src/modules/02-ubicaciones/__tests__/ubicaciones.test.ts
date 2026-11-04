import { beforeEach, describe, expect, it, vi } from 'vitest';

// env.ts valida variables al importarse: se fijan antes de cargar la app
vi.hoisted(() => {
    process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

// Prisma 100% mockeado: tx === prisma para simular $transaction interactiva
const prismaMock = vi.hoisted(() => {
    const m = {
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
    };
    return m;
});

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

const payloadValido = {
    nombre: 'Sede Norte',
    tipo: 'PUNTO_VENTA',
    municipioDaneId: '54001',
    direccion: 'Calle 10 # 5-20',
};

describe('Módulo 02: Ubicaciones (/api/ubicaciones) RN-UBI-01..06', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        UserPermissionCache.clear();

        prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
        prismaMock.usuario.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null);

        // Estado por defecto: sede limpia, apta para desactivarse
        prismaMock.ubicacion.findUnique.mockResolvedValue(sedeBase);
        prismaMock.saldoStock.aggregate.mockResolvedValue({ _sum: { fisico: 0, noVendible: 0 } });
        prismaMock.traslado.count.mockResolvedValue(0);
        prismaMock.pedidoWeb.count.mockResolvedValue(0);
        prismaMock.sesionCaja.count.mockResolvedValue(0);
        prismaMock.ubicacion.update.mockResolvedValue({ ...sedeBase, activa: false, despachaWeb: false });
        prismaMock.registroAuditoria.create.mockResolvedValue({});
        prismaMock.$executeRaw.mockResolvedValue(1);
    });

    it('1. POST crea una sede válida con rol ADMIN (201)', async () => {
        prismaMock.ubicacion.findFirst.mockResolvedValue(null);
        prismaMock.municipioDane.findUnique.mockResolvedValue({ codigoDane: '54001' });
        prismaMock.ubicacion.create.mockResolvedValue({ id: 10, ...payloadValido, baseCajaCop: 200000 });

        const res = await request(app).post('/api/ubicaciones').set('Authorization', ADMIN).send(payloadValido);

        expect(res.status).toBe(201);
        expect(res.body.ok).toBe(true);
        expect(prismaMock.ubicacion.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ baseCajaCop: 200000, prioridadDespacho: 100, despachaWeb: true }),
        });
        expect(prismaMock.registroAuditoria.create).toHaveBeenCalledTimes(1);
    });

    it('2. POST sin token responde 401 y con VENDEDOR 403', async () => {
        const sinToken = await request(app).post('/api/ubicaciones').send(payloadValido);
        const vendedor = await request(app).post('/api/ubicaciones').set('Authorization', VENDEDOR).send(payloadValido);

        expect(sinToken.status).toBe(401);
        expect(vendedor.status).toBe(403);
        expect(prismaMock.ubicacion.create).not.toHaveBeenCalled();
    });

    it('3. POST rechaza una segunda Bodega Central (409)', async () => {
        prismaMock.ubicacion.findFirst.mockResolvedValueOnce({ id: 1, tipo: 'CENTRAL' });

        const res = await request(app)
            .post('/api/ubicaciones')
            .set('Authorization', ADMIN)
            .send({ ...payloadValido, nombre: 'Otra Central', tipo: 'CENTRAL' });

        expect(res.status).toBe(409);
        expect(prismaMock.ubicacion.create).not.toHaveBeenCalled();
    });

    it('4. PATCH desactivar sobre Bodega Central responde 422', async () => {
        prismaMock.ubicacion.findUnique.mockResolvedValue({ ...sedeBase, id: 1, tipo: 'CENTRAL' });

        const res = await request(app).patch('/api/ubicaciones/1/desactivar').set('Authorization', ADMIN).send({});

        expect(res.status).toBe(422);
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('5. PATCH desactivar rechaza sede con stock físico > 0 (422)', async () => {
        prismaMock.saldoStock.aggregate.mockResolvedValue({ _sum: { fisico: 7, noVendible: 0 } });

        const res = await request(app).patch('/api/ubicaciones/5/desactivar').set('Authorization', ADMIN).send({});

        expect(res.status).toBe(422);
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('6. PATCH desactivar rechaza sede con sesión de caja abierta (422)', async () => {
        prismaMock.sesionCaja.count.mockResolvedValue(1);

        const res = await request(app).patch('/api/ubicaciones/5/desactivar').set('Authorization', ADMIN).send({});

        expect(res.status).toBe(422);
        expect(prismaMock.sesionCaja.count).toHaveBeenCalledWith({ where: { ubicacionId: 5, estado: 'ABIERTA' } });
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('7. PATCH desactivar rechaza sede con traslados pendientes (422)', async () => {
        prismaMock.traslado.count.mockResolvedValue(2);

        const res = await request(app).patch('/api/ubicaciones/5/desactivar').set('Authorization', ADMIN).send({});

        expect(res.status).toBe(422);
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('8. PATCH desactivar rechaza sede con pedidos web en curso (422)', async () => {
        prismaMock.pedidoWeb.count.mockResolvedValue(3);

        const res = await request(app).patch('/api/ubicaciones/5/desactivar').set('Authorization', ADMIN).send({});

        expect(res.status).toBe(422);
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('9. PATCH desactivar funciona si se cumplen las 5 condiciones (200)', async () => {
        const res = await request(app)
            .patch('/api/ubicaciones/5/desactivar')
            .set('Authorization', ADMIN)
            .send({ motivo: 'Cierre definitivo de sede' });

        expect(res.status).toBe(200);
        expect(res.body.datos.activa).toBe(false);
        expect(prismaMock.ubicacion.update).toHaveBeenCalledWith({
            where: { id: 5 },
            data: { activa: false, despachaWeb: false },
        });
        expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                usuarioId: 1,
                accion: 'DESACTIVAR_UBICACION',
                entidadTipo: 'Ubicacion',
                entidadId: '5',
            }),
        });
    });

    it('10. DELETE responde 400 por política de no borrado físico', async () => {
        const res = await request(app).delete('/api/ubicaciones/5').set('Authorization', ADMIN);

        expect(res.status).toBe(400);
        expect(res.body.error.message).toMatch(/borrado físico/i);
    });

    it('11. POST rechaza baseCajaCop con decimales (400, RN-GEN-04)', async () => {
        const res = await request(app)
            .post('/api/ubicaciones')
            .set('Authorization', ADMIN)
            .send({ ...payloadValido, baseCajaCop: 200000.5 });

        expect(res.status).toBe(400);
        expect(prismaMock.ubicacion.create).not.toHaveBeenCalled();
    });

    it('12. GET lista ubicaciones con usuario autenticado (200) y exige token', async () => {
        prismaMock.ubicacion.findMany.mockResolvedValue([sedeBase]);

        const ok = await request(app).get('/api/ubicaciones?activa=true').set('Authorization', VENDEDOR);
        const sinToken = await request(app).get('/api/ubicaciones');

        expect(ok.status).toBe(200);
        expect(prismaMock.ubicacion.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { activa: true } }),
        );
        expect(sinToken.status).toBe(401);
    });

    it('13. POST Bodega Central se crea con baseCajaCop: 0, despachaWeb: true y prioridadDespacho: 40 (RN-UBI-01, RN-UBI-03)', async () => {
        prismaMock.ubicacion.findFirst.mockResolvedValue(null);
        prismaMock.municipioDane.findUnique.mockResolvedValue({ codigoDane: '54001' });
        prismaMock.ubicacion.create.mockResolvedValue({
            id: 1,
            nombre: 'Bodega Central Cúcuta',
            tipo: 'CENTRAL',
            municipioDaneId: '54001',
            direccion: 'Zona Industrial Lote 4',
            despachaWeb: true,
            prioridadDespacho: 40,
            baseCajaCop: 0,
        });

        const res = await request(app)
            .post('/api/ubicaciones')
            .set('Authorization', ADMIN)
            .send({
                nombre: 'Bodega Central Cúcuta',
                tipo: 'CENTRAL',
                municipioDaneId: '54001',
                direccion: 'Zona Industrial Lote 4',
            });

        expect(res.status).toBe(201);
        expect(prismaMock.ubicacion.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                baseCajaCop: 0,
                despachaWeb: true,
                prioridadDespacho: 40,
            }),
        });
    });

    it('14. PUT /api/ubicaciones/:id no inyecta defaults no enviados (Zod Partial Fix)', async () => {
        prismaMock.ubicacion.findUnique.mockResolvedValue({
            id: 5,
            nombre: 'Sede Antigua',
            tipo: 'PUNTO_VENTA',
            prioridadDespacho: 20,
            baseCajaCop: 350000,
            despachaWeb: false,
        });
        prismaMock.ubicacion.findFirst.mockResolvedValue(null);
        prismaMock.ubicacion.update.mockResolvedValue({
            id: 5,
            nombre: 'Sede Renombrada',
            tipo: 'PUNTO_VENTA',
            prioridadDespacho: 20,
            baseCajaCop: 350000,
            despachaWeb: false,
        });

        const res = await request(app)
            .put('/api/ubicaciones/5')
            .set('Authorization', ADMIN)
            .send({ nombre: 'Sede Renombrada' });

        expect(res.status).toBe(200);
        // Debe actualizar SOLO el nombre, sin sobreescribir prioridadDespacho ni baseCajaCop
        expect(prismaMock.ubicacion.update).toHaveBeenCalledWith({
            where: { id: 5 },
            data: { nombre: 'Sede Renombrada' },
        });
    });

    it('15. PUT /api/ubicaciones/:id rechaza degradar Bodega Central a PUNTO_VENTA (422, RN-UBI-01)', async () => {
        prismaMock.ubicacion.findUnique.mockResolvedValue({
            id: 1,
            nombre: 'Bodega Central',
            tipo: 'CENTRAL',
        });

        const res = await request(app)
            .put('/api/ubicaciones/1')
            .set('Authorization', ADMIN)
            .send({ tipo: 'PUNTO_VENTA' });

        expect(res.status).toBe(422);
        expect(prismaMock.ubicacion.update).not.toHaveBeenCalled();
    });

    it('16. POST rechaza código DANE no numérico con 400', async () => {
        const res = await request(app)
            .post('/api/ubicaciones')
            .set('Authorization', ADMIN)
            .send({ ...payloadValido, municipioDaneId: 'ABCDE' });

        expect(res.status).toBe(400);
        expect(prismaMock.ubicacion.create).not.toHaveBeenCalled();
    });
});
