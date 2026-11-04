import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

// 1. Variables de entorno requeridas antes de cargar la app
vi.hoisted(() => {
    process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

// 2. Mock completo de Prisma Client (nada toca una BD real)
const prismaMock = vi.hoisted(() => ({
    usuario: { findUnique: vi.fn() },
    ubicacion: { findFirst: vi.fn() },
    variante: { findMany: vi.fn() },
    compraProveedor: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    lineaCompra: { update: vi.fn() },
    // Si el módulo mutara stock por fuera del Kardex, estos mocks lo delatarían (RN-GEN-02)
    saldoStock: { update: vi.fn(), upsert: vi.fn() },
    movimientoInventario: { create: vi.fn() },
    registroAuditoria: { create: vi.fn() },
    registroIdempotencia: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({
    prisma: prismaMock,
    default: prismaMock,
}));

import request from 'supertest';
import { app } from '../../../app.js';
import { InventoryLedgerService } from '../../04-inventario/InventoryLedgerService.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';

const permisosBase = {
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
    1: { id: 1, correo: 'admin@forma.com', rol: 'ADMIN', ubicacionId: 1, activo: true, topeDescuentoPorc: 100, ...permisosBase },
    2: { id: 2, correo: 'vendedor@forma.com', rol: 'VENDEDOR', ubicacionId: 2, activo: true, topeDescuentoPorc: 10, ...permisosBase },
};

// Token firmado con env.JWT_SECRET (vía generateToken)
const TOKEN_ADMIN = `Bearer ${generateToken({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' })}`;
const TOKEN_VENDEDOR = `Bearer ${generateToken({ userId: 2, correo: 'vendedor@forma.com', rol: 'VENDEDOR' })}`;

const central = { id: 1, nombre: 'Bodega Central', tipo: 'CENTRAL', activa: true };

// Líneas deliberadamente DESORDENADAS por varianteId para verificar RNF-003
const lineasPedida = [
    { id: 71, compraId: 7, varianteId: 30, cantidadPedida: 5, cantidadRecibida: null, costoUnitarioCop: 12000, observacionDiferencia: null },
    { id: 72, compraId: 7, varianteId: 10, cantidadPedida: 20, cantidadRecibida: null, costoUnitarioCop: null, observacionDiferencia: null },
];

const compraPedida = (estado: 'PEDIDA' | 'RECIBIDA' | 'CANCELADA' = 'PEDIDA') => ({
    id: 7,
    proveedorNombre: 'Textiles del Norte SAS',
    proveedorContacto: null,
    estado,
    notas: null,
    creadoPorId: 1,
    recibidoPorId: null,
    fechaCreacion: new Date('2026-11-01T15:00:00.000Z'),
    fechaRecepcion: null,
    version: 1,
    lineas: lineasPedida,
});

const compraRecibida = () => ({
    ...compraPedida('RECIBIDA'),
    recibidoPorId: 1,
    fechaRecepcion: new Date('2026-11-04T15:00:00.000Z'),
    version: 2,
    lineas: lineasPedida.map((l) => ({ ...l, cantidadRecibida: l.cantidadPedida })),
});

describe('Módulo 05: Compras a Proveedor en Bodega Central (SP2-02, RF-COM-01/02, CA-08)', () => {
    let ledgerSpy: MockInstance<typeof InventoryLedgerService.registrarMovimiento>;

    // requireIdempotencyKey TAMBIÉN persiste la respuesta tras responder (fuera de la transacción).
    // Para probar el guardado atómico del servicio (CA-08) se distingue cuál create ocurrió dentro de $transaction.
    let enTransaccion = false;
    let llamadasIdempotencia: Array<{ data: Record<string, unknown>; enTransaccion: boolean }> = [];
    const idempotenciaDentroDeTx = () => llamadasIdempotencia.filter((c) => c.enTransaccion);

    beforeEach(() => {
        vi.clearAllMocks();
        UserPermissionCache.clear();

        ledgerSpy = vi
            .spyOn(InventoryLedgerService, 'registrarMovimiento')
            .mockResolvedValue({ id: 1n, saldoResultante: 25, disponibleResultante: 25 });

        // Transacción interactiva simulada: el callback recibe el mismo mock como `tx`
        enTransaccion = false;
        llamadasIdempotencia = [];
        prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            enTransaccion = true;
            try {
                return await cb(prismaMock);
            } finally {
                enTransaccion = false;
            }
        });
        prismaMock.$queryRaw.mockResolvedValue([]);
        prismaMock.usuario.findUnique.mockImplementation(
            async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null
        );
        prismaMock.ubicacion.findFirst.mockResolvedValue(central);
        prismaMock.variante.findMany.mockResolvedValue([{ id: 10 }, { id: 30 }]);
        prismaMock.registroAuditoria.create.mockResolvedValue({ id: 1n });
        prismaMock.registroIdempotencia.findUnique.mockResolvedValue(null);
        prismaMock.registroIdempotencia.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
            llamadasIdempotencia.push({ data, enTransaccion });
            return {};
        });
        prismaMock.lineaCompra.update.mockResolvedValue({});
    });

    afterEach(() => {
        ledgerSpy.mockRestore();
    });

    const expectInventarioIntacto = () => {
        expect(ledgerSpy).not.toHaveBeenCalled();
        expect(prismaMock.saldoStock.update).not.toHaveBeenCalled();
        expect(prismaMock.saldoStock.upsert).not.toHaveBeenCalled();
        expect(prismaMock.movimientoInventario.create).not.toHaveBeenCalled();
    };

    describe('POST /api/compras (RF-COM-01, RN-COM-02)', () => {
        it('crea una orden en estado PEDIDA con sus líneas (201) y NO invoca el Kardex', async () => {
            prismaMock.compraProveedor.create.mockResolvedValue(compraPedida());

            const res = await request(app)
                .post('/api/compras')
                .set('Authorization', TOKEN_ADMIN)
                .send({
                    proveedorNombre: '  Textiles del Norte SAS ',
                    lineas: [
                        { varianteId: 30, cantidadPedida: 5, costoUnitarioCop: 12000 },
                        { varianteId: 10, cantidadPedida: 20 },
                    ],
                });

            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
            expect(res.body.datos.estado).toBe('PEDIDA');
            expect(res.body.datos.lineas).toHaveLength(2);

            const args = prismaMock.compraProveedor.create.mock.calls[0]![0];
            expect(args.data.estado).toBe('PEDIDA');
            expect(args.data.creadoPorId).toBe(1);
            expect(args.data.proveedorNombre).toBe('Textiles del Norte SAS'); // trim aplicado por Zod
            expect(args.data.lineas.create).toHaveLength(2);
            expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ accion: 'CREAR_COMPRA' }) })
            );
            expectInventarioIntacto();
        });

        it('rechaza (400) variantes inexistentes sin crear la orden', async () => {
            prismaMock.variante.findMany.mockResolvedValue([{ id: 10 }]); // falta la 30

            const res = await request(app)
                .post('/api/compras')
                .set('Authorization', TOKEN_ADMIN)
                .send({
                    proveedorNombre: 'Textiles del Norte SAS',
                    lineas: [
                        { varianteId: 10, cantidadPedida: 1 },
                        { varianteId: 30, cantidadPedida: 1 },
                    ],
                });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toMatch(/30/);
            expect(prismaMock.compraProveedor.create).not.toHaveBeenCalled();
        });

        it('rechaza (400) costo unitario decimal o negativo (RN-GEN-04) y órdenes sin líneas', async () => {
            const base = { proveedorNombre: 'Textiles del Norte SAS' };

            const decimal = await request(app)
                .post('/api/compras')
                .set('Authorization', TOKEN_ADMIN)
                .send({ ...base, lineas: [{ varianteId: 10, cantidadPedida: 1, costoUnitarioCop: 99.5 }] });
            const negativo = await request(app)
                .post('/api/compras')
                .set('Authorization', TOKEN_ADMIN)
                .send({ ...base, lineas: [{ varianteId: 10, cantidadPedida: 1, costoUnitarioCop: -1 }] });
            const sinLineas = await request(app).post('/api/compras').set('Authorization', TOKEN_ADMIN).send({ ...base, lineas: [] });

            expect(decimal.status).toBe(400);
            expect(negativo.status).toBe(400);
            expect(sinLineas.status).toBe(400);
            expect(prismaMock.compraProveedor.create).not.toHaveBeenCalled();
        });

        it('niega acceso (403) a un VENDEDOR: compras es exclusivo de ADMIN', async () => {
            const res = await request(app)
                .post('/api/compras')
                .set('Authorization', TOKEN_VENDEDOR)
                .send({ proveedorNombre: 'Textiles del Norte SAS', lineas: [{ varianteId: 10, cantidadPedida: 1 }] });

            expect(res.status).toBe(403);
            expect(prismaMock.compraProveedor.create).not.toHaveBeenCalled();
        });
    });

    describe('Consultas (GET)', () => {
        it('lista órdenes ordenadas por fechaCreacion desc con filtro de estado', async () => {
            prismaMock.compraProveedor.findMany.mockResolvedValue([compraPedida()]);

            const res = await request(app).get('/api/compras?estado=PEDIDA').set('Authorization', TOKEN_ADMIN);

            expect(res.status).toBe(200);
            expect(res.body.datos).toHaveLength(1);
            const args = prismaMock.compraProveedor.findMany.mock.calls[0]![0];
            expect(args.orderBy).toEqual({ fechaCreacion: 'desc' });
            expect(args.where.estado).toBe('PEDIDA');
        });

        it('obtiene una orden por id (200) y responde 404 si no existe', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValueOnce(compraPedida());
            const ok = await request(app).get('/api/compras/7').set('Authorization', TOKEN_ADMIN);
            expect(ok.status).toBe(200);
            expect(ok.body.datos.id).toBe(7);

            prismaMock.compraProveedor.findUnique.mockResolvedValueOnce(null);
            const noExiste = await request(app).get('/api/compras/999').set('Authorization', TOKEN_ADMIN);
            expect(noExiste.status).toBe(404);
            expect(noExiste.body.error.message).toBe('Orden de compra no encontrada');
        });
    });

    describe('PATCH /api/compras/:id/cancelar (RN-COM-05)', () => {
        it('cambia PEDIDA a CANCELADA (200) sin alterar inventario', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue({ id: 7, estado: 'PEDIDA' });
            prismaMock.compraProveedor.update.mockResolvedValue({ ...compraPedida('CANCELADA'), version: 2 });

            const res = await request(app)
                .patch('/api/compras/7/cancelar')
                .set('Authorization', TOKEN_ADMIN)
                .send({ motivo: 'Proveedor sin existencias' });

            expect(res.status).toBe(200);
            expect(res.body.datos.estado).toBe('CANCELADA');
            expect(prismaMock.compraProveedor.update.mock.calls[0]![0].data.estado).toBe('CANCELADA');
            expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        accion: 'CANCELAR_COMPRA',
                        datosMinimos: expect.objectContaining({ motivo: 'Proveedor sin existencias' }),
                    }),
                })
            );
            expectInventarioIntacto();
        });

        it.each(['CANCELADA', 'RECIBIDA'] as const)('responde 422 al cancelar una orden ya %s', async (estado) => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue({ id: 7, estado });

            const res = await request(app).patch('/api/compras/7/cancelar').set('Authorization', TOKEN_ADMIN).send({});

            expect(res.status).toBe(422);
            expect(res.body.error.message).toBe('Solo se pueden cancelar órdenes en estado PEDIDA');
            expect(prismaMock.compraProveedor.update).not.toHaveBeenCalled();
            expectInventarioIntacto();
        });

        it('responde 404 al cancelar una orden inexistente', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(null);
            const res = await request(app).patch('/api/compras/999/cancelar').set('Authorization', TOKEN_ADMIN).send({});
            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/compras/:id/recibir (RN-COM-03, RN-GEN-08, CA-08, RNF-003)', () => {
        it('rechaza (400) si falta el encabezado Idempotency-Key', async () => {
            const res = await request(app).post('/api/compras/7/recibir').set('Authorization', TOKEN_ADMIN).send({});

            expect(res.status).toBe(400);
            expect(res.body.error.message).toMatch(/Idempotency-Key es obligatorio/i);
            expect(prismaMock.$transaction).not.toHaveBeenCalled();
            expectInventarioIntacto();
        });

        it('transiciona PEDIDA a RECIBIDA, ingresa físico a Central vía Kardex en orden varianteId ASC (200)', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(compraPedida());
            prismaMock.compraProveedor.update.mockResolvedValue(compraRecibida());

            const res = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-001')
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.datos.estado).toBe('RECIBIDA');

            // RNF-003: aunque la orden guarda [30, 10], el Kardex se invoca [10, 30]
            expect(ledgerSpy).toHaveBeenCalledTimes(2);
            expect(ledgerSpy.mock.calls.map((c) => c[1].varianteId)).toEqual([10, 30]);

            // Sin body => 100% de lo pedido, ingresando exclusivamente a la Central (RN-COM-01)
            expect(ledgerSpy.mock.calls[0]![1]).toEqual({
                tipo: 'COMPRA_RECIBIDA',
                ubicacionId: 1,
                varianteId: 10,
                cantidadConSigno: 20,
                afectaSaldo: 'FISICO',
                documentoTipo: 'COMPRA',
                documentoId: 7,
                usuarioId: 1,
                motivo: 'Recepción OC #7',
                autoCrearSiNoExiste: true,
            });
            expect(ledgerSpy.mock.calls[1]![1]).toMatchObject({ varianteId: 30, cantidadConSigno: 5, ubicacionId: 1 });
            // Toda mutación va dentro de la misma transacción interactiva
            expect(ledgerSpy.mock.calls[0]![0]).toBe(prismaMock);

            expect(prismaMock.lineaCompra.update).toHaveBeenCalledTimes(2);
            const updateArgs = prismaMock.compraProveedor.update.mock.calls[0]![0];
            expect(updateArgs.data).toMatchObject({ estado: 'RECIBIDA', recibidoPorId: 1 });
            expect(updateArgs.data.fechaRecepcion).toBeInstanceOf(Date);

            expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ accion: 'RECIBIR_COMPRA', entidadId: '7' }) })
            );
            // CA-08: la clave se persiste ATÓMICAMENTE dentro de la misma transacción que el Kardex
            const dentroTx = idempotenciaDentroDeTx();
            expect(dentroTx).toHaveLength(1);
            expect(dentroTx[0]!.data).toMatchObject({
                idempotencyKey: 'recibir-oc7-001',
                usuarioId: 1,
                endpoint: '/api/compras/7/recibir',
                statusCode: 200,
                responseBody: { ok: true, datos: expect.objectContaining({ id: 7, estado: 'RECIBIDA' }) },
            });
        });

        it('reintento con la MISMA Idempotency-Key devuelve el snapshot almacenado sin volver a invocar el Kardex (CA-08)', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(compraPedida());
            prismaMock.compraProveedor.update.mockResolvedValue(compraRecibida());

            const primera = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-retry')
                .send({});
            expect(primera.status).toBe(200);
            expect(ledgerSpy).toHaveBeenCalledTimes(2);

            // Lo que la transacción persistió es lo que el middleware servirá en el reintento
            const guardado = idempotenciaDentroDeTx()[0]!.data;
            expect(guardado).toBeDefined();
            prismaMock.registroIdempotencia.findUnique.mockResolvedValue({
                idempotencyKey: 'recibir-oc7-retry',
                usuarioId: 1,
                statusCode: guardado.statusCode,
                responseBody: guardado.responseBody,
            });
            ledgerSpy.mockClear();
            prismaMock.$transaction.mockClear();

            const reintento = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-retry')
                .send({});

            expect(reintento.status).toBe(200);
            expect(reintento.body).toEqual(primera.body); // misma forma { ok, datos } y mismo contenido
            expect(ledgerSpy).not.toHaveBeenCalled();
            expect(prismaMock.$transaction).not.toHaveBeenCalled();
        });

        it('responde 422 al recibir una orden ya RECIBIDA (sin duplicar Kardex ni guardar idempotencia)', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(compraRecibida());

            const res = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-otra-llave')
                .send({});

            expect(res.status).toBe(422);
            expect(res.body.error.message).toMatch(/RECIBIDA/);
            expect(prismaMock.compraProveedor.update).not.toHaveBeenCalled();
            expect(llamadasIdempotencia).toHaveLength(0);
            expectInventarioIntacto();
        });

        it('responde 422 al recibir una orden CANCELADA', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(compraPedida('CANCELADA'));

            const res = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-cancelada')
                .send({});

            expect(res.status).toBe(422);
            expectInventarioIntacto();
        });

        it('respeta cantidades explícitas: ingresa solo las > 0 y registra diferencias en la línea', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(compraPedida());
            prismaMock.compraProveedor.update.mockResolvedValue(compraRecibida());

            const res = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-parcial')
                .send({
                    lineas: [
                        { lineaId: 71, cantidadRecibida: 0, observacionDiferencia: 'No llegó en el camión' },
                        { lineaId: 72, cantidadRecibida: 18, observacionDiferencia: 'Faltaron 2 unidades' },
                    ],
                });

            expect(res.status).toBe(200);
            // La línea con 0 unidades NO genera movimiento de Kardex (el ledger prohíbe cantidades 0)
            expect(ledgerSpy).toHaveBeenCalledTimes(1);
            expect(ledgerSpy.mock.calls[0]![1]).toMatchObject({
                varianteId: 10,
                cantidadConSigno: 18,
                motivo: 'Faltaron 2 unidades',
            });
            // Pero sí se deja constancia en ambas líneas
            expect(prismaMock.lineaCompra.update).toHaveBeenCalledWith({
                where: { id: 71 },
                data: { cantidadRecibida: 0, observacionDiferencia: 'No llegó en el camión' },
            });
            expect(prismaMock.lineaCompra.update).toHaveBeenCalledWith({
                where: { id: 72 },
                data: { cantidadRecibida: 18, observacionDiferencia: 'Faltaron 2 unidades' },
            });
        });

        it('rechaza (400) una línea que no pertenece a la orden o un body que omite líneas', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(compraPedida());

            const ajena = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-ajena')
                .send({ lineas: [{ lineaId: 999, cantidadRecibida: 1 }, { lineaId: 72, cantidadRecibida: 1 }] });
            const incompleta = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-incompleta')
                .send({ lineas: [{ lineaId: 71, cantidadRecibida: 5 }] });
            const duplicada = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-duplicada')
                .send({ lineas: [{ lineaId: 71, cantidadRecibida: 1 }, { lineaId: 71, cantidadRecibida: 2 }] });

            expect(ajena.status).toBe(400);
            expect(incompleta.status).toBe(400);
            expect(duplicada.status).toBe(400);
            expectInventarioIntacto();
        });

        it('responde 500 si no existe una Bodega Central configurada (RN-COM-01)', async () => {
            prismaMock.ubicacion.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/compras/7/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc7-sin-central')
                .send({});

            expect(res.status).toBe(500);
            expect(res.body.error.message).toBe('No existe una Bodega Central configurada en el sistema');
            expectInventarioIntacto();
        });

        it('responde 404 al recibir una orden inexistente', async () => {
            prismaMock.compraProveedor.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/compras/999/recibir')
                .set('Authorization', TOKEN_ADMIN)
                .set('Idempotency-Key', 'recibir-oc999')
                .send({});

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/compras/:id (RN-GEN-07)', () => {
        it('responde 400 protegiendo el histórico: las compras no se borran, se cancelan', async () => {
            const res = await request(app).delete('/api/compras/7').set('Authorization', TOKEN_ADMIN);

            expect(res.status).toBe(400);
            expect(res.body.error.message).toMatch(/RN-GEN-07/);
            expect(res.body.error.message).toMatch(/cancélela/);
            expect(prismaMock.compraProveedor.update).not.toHaveBeenCalled();
        });
    });
});