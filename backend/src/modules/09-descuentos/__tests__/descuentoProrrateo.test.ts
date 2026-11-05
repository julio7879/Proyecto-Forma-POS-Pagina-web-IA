import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// env.ts valida variables al importarse: se fijan antes de cargar la app
vi.hoisted(() => {
    process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

// Prisma 100% mockeado: tx === prisma para simular $transaction interactiva
const prismaMock = vi.hoisted(() => ({
    usuario: { findUnique: vi.fn() },
    promocion: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    registroAuditoria: { create: vi.fn() },
    $transaction: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({ prisma: prismaMock, default: prismaMock }));

import request from 'supertest';
import { app } from '../../../app.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';
import { DiscountProrationEngine } from '../domain/DiscountProrationEngine.js';
import { DescuentoService } from '../descuento.service.js';

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
    // Vendedor con permiso y tope del 10%
    2: { id: 2, correo: 'vend@forma.com', rol: 'VENDEDOR', ubicacionId: 3, activo: true, topeDescuentoPorc: 10, ...permisosOff, permDescuentoManual: true },
    // Vendedor sin permiso de descuento manual
    3: { id: 3, correo: 'sinperm@forma.com', rol: 'VENDEDOR', ubicacionId: 3, activo: true, topeDescuentoPorc: 10, ...permisosOff },
};

const bearer = (userId: number, correo: string, rol: 'ADMIN' | 'VENDEDOR') =>
    `Bearer ${generateToken({ userId, correo, rol })}`;
const ADMIN = bearer(1, 'admin@forma.com', 'ADMIN');
const VENDEDOR = bearer(2, 'vend@forma.com', 'VENDEDOR');
const VENDEDOR_SIN_PERMISO = bearer(3, 'sinperm@forma.com', 'VENDEDOR');

const tresPrendas = [
    { id: 1, productoId: 100, categoriaId: 10, cantidad: 1, precioUnitarioBaseCop: 10000 },
    { id: 2, productoId: 101, categoriaId: 10, cantidad: 1, precioUnitarioBaseCop: 10000 },
    { id: 3, productoId: 102, categoriaId: 10, cantidad: 1, precioUnitarioBaseCop: 10000 },
];

const promoBase = {
    id: 7,
    codigo: 'PROMO10',
    nombre: 'Promo de prueba',
    tipo: 'VALOR_FIJO',
    valor: 1000,
    alcance: 'TODA_LA_COMPRA',
    idsCategoriasElegibles: [] as number[],
    idsProductosElegibles: [] as number[],
    canalPermitido: 'AMBOS',
    minimoCompraCop: 0,
    fechaInicio: new Date('2020-01-01T00:00:00Z'),
    fechaFin: new Date('2099-12-31T23:59:59Z'),
    activa: true,
    tieneUsos: false,
};

function promo(overrides: Record<string, unknown> = {}) {
    prismaMock.promocion.findUnique.mockResolvedValue({ ...promoBase, ...overrides });
}

describe('Módulo 09: Descuentos (/api/descuentos) RN-DES-01..14, CA-19..25', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        UserPermissionCache.clear();
        prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
        prismaMock.usuario.findUnique.mockImplementation(
            async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null,
        );
        prismaMock.registroAuditoria.create.mockResolvedValue({});
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Prorrateo canónico (RN-DES-09, CA-20/21)', () => {
        it('1. $1.000 COP entre 3 prendas de $10.000 COP reparte 333, 333 y 334 (residuo a la última)', () => {
            const r = DiscountProrationEngine.calcular(
                tresPrendas.map((l) => ({ id: l.id, cantidad: l.cantidad, precioUnitarioBaseCop: l.precioUnitarioBaseCop, esElegible: true })),
                { tipo: 'VALOR_FIJO', valor: 1000, esAdmin: true },
            );
            expect(r.lineas.map((l) => l.descuentoProrrateadoCop)).toEqual([333, 333, 334]);
            expect(r.descuentoTotalAplicadoCop).toBe(1000);
            expect(r.totalNetoPagarCop).toBe(29000);
        });

        it('2. SUM(descuentoLinea) === D exacto con subtotales desiguales y sin negativos', () => {
            const lineas = [
                { id: 'a', cantidad: 3, precioUnitarioBaseCop: 3333, esElegible: true },
                { id: 'b', cantidad: 1, precioUnitarioBaseCop: 7777, esElegible: true },
                { id: 'c', cantidad: 7, precioUnitarioBaseCop: 1234, esElegible: true },
            ];
            for (const D of [1, 2, 999, 12345, 26516, 26517]) {
                const r = DiscountProrationEngine.calcular(lineas, { tipo: 'VALOR_FIJO', valor: D, esAdmin: true });
                const suma = r.lineas.reduce((acc, l) => acc + l.descuentoProrrateadoCop, 0);
                expect(suma).toBe(Math.min(D, r.subtotalElegibleCop));
                expect(r.lineas.every((l) => l.precioNetoTotalCop >= 0)).toBe(true);
            }
        });
    });

    describe('Validación de cupón (RF-DES-02)', () => {
        it('3. Cupón inexistente → 404', async () => {
            prismaMock.promocion.findUnique.mockResolvedValue(null);
            const res = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'NOEXISTE', canal: 'POS', lineas: tresPrendas });
            expect(res.status).toBe(404);
            expect(res.body.error.message).toBe('Cupón de descuento no válido o inexistente');
        });

        it('4. Cupón inactivo → 400', async () => {
            promo({ activa: false });
            const res = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'PROMO10', canal: 'POS', lineas: tresPrendas });
            expect(res.status).toBe(400);
            expect(res.body.error.message).toBe('El cupón se encuentra inactivo');
        });

        it('5. Cupón vencido por fecha → 400 (no vigente)', async () => {
            promo({ fechaFin: new Date('2024-01-31T23:59:59-05:00') });
            const res = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'PROMO10', canal: 'POS', lineas: tresPrendas });
            expect(res.status).toBe(400);
            expect(res.body.error.message).toBe('El cupón no se encuentra vigente');
        });

        it('6. Vigencia: aún no inicia → 400; el instante exacto de fechaFin es válido y 1 ms después no', async () => {
            const fechaFin = new Date('2026-12-31T23:59:59.999-05:00'); // fin del día en Bogotá
            const input = { codigo: 'PROMO10', canal: 'POS' as const, lineas: tresPrendas };

            promo({ fechaInicio: new Date('2099-01-01T00:00:00Z') });
            await expect(DescuentoService.validarYAplicarCupon(input)).rejects.toMatchObject({ statusCode: 400 });

            vi.useFakeTimers({ toFake: ['Date'] });
            promo({ fechaFin });
            vi.setSystemTime(fechaFin);
            await expect(DescuentoService.validarYAplicarCupon(input)).resolves.toMatchObject({ descuentoTotalAplicadoCop: 1000 });
            vi.setSystemTime(new Date(fechaFin.getTime() + 1));
            await expect(DescuentoService.validarYAplicarCupon(input)).rejects.toMatchObject({ statusCode: 400 });
        });

        it('7. Monto mínimo de compra no alcanzado → 400', async () => {
            promo({ minimoCompraCop: 50000 });
            const res = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'PROMO10', canal: 'POS', lineas: tresPrendas });
            expect(res.status).toBe(400);
            expect(res.body.error.message).toContain('no alcanza el monto mínimo de compra');
        });

        it('8. Cupón solo WEB intentado en POS → 400; en WEB sí aplica', async () => {
            promo({ canalPermitido: 'WEB' });
            const pos = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'PROMO10', canal: 'POS', lineas: tresPrendas });
            expect(pos.status).toBe(400);
            expect(pos.body.error.message).toBe('Cupón no aplicable para este canal de venta');

            const web = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'PROMO10', canal: 'WEB', lineas: tresPrendas });
            expect(web.status).toBe(200);
        });

        it('9. El código es case-insensitive y con trim (se consulta en mayúsculas)', async () => {
            promo();
            const res = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: '  promo10 ', canal: 'POS', lineas: tresPrendas });
            expect(res.status).toBe(200);
            expect(prismaMock.promocion.findUnique).toHaveBeenCalledWith({ where: { codigo: 'PROMO10' } });
        });

        it('10. Elegibilidad por categoría: solo descuenta la categoría configurada', async () => {
            promo({ tipo: 'PORCENTAJE', valor: 10, alcance: 'CATEGORIAS', idsCategoriasElegibles: [10] });
            const lineas = [
                { id: 'camisa', productoId: 1, categoriaId: 10, cantidad: 1, precioUnitarioBaseCop: 50000 },
                { id: 'jean', productoId: 2, categoriaId: 20, cantidad: 1, precioUnitarioBaseCop: 80000 },
                { id: 'sin-categoria', productoId: 3, cantidad: 1, precioUnitarioBaseCop: 20000 },
            ];
            const res = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'PROMO10', canal: 'POS', lineas });
            expect(res.status).toBe(200);
            const d = res.body.datos;
            expect(d.subtotalElegibleCop).toBe(50000);
            expect(d.descuentoTotalAplicadoCop).toBe(5000);
            expect(d.lineas[0]).toMatchObject({ descuentoProrrateadoCop: 5000, precioNetoTotalCop: 45000 });
            expect(d.lineas[1]).toMatchObject({ descuentoProrrateadoCop: 0, precioNetoTotalCop: 80000 });
            expect(d.lineas[2]).toMatchObject({ descuentoProrrateadoCop: 0, precioNetoTotalCop: 20000 });
            expect(d.totalFinalPagarCop).toBe(145000);
        });

        it('11. Elegibilidad por producto y carrito sin líneas elegibles → 400', async () => {
            promo({ alcance: 'PRODUCTOS', idsProductosElegibles: [999] });
            const res = await request(app).post('/api/descuentos/validar-cupon').send({ codigo: 'PROMO10', canal: 'POS', lineas: tresPrendas });
            expect(res.status).toBe(400);
            expect(res.body.error.message).toBe('Ningún producto del carrito aplica para este cupón');
        });
    });

    describe('Flete blindado y truncado (RN-DES-07, CA-25)', () => {
        it('12. El flete web no se reduce y se suma íntegro al total a pagar', async () => {
            promo({ tipo: 'PORCENTAJE', valor: 50 });
            const res = await request(app)
                .post('/api/descuentos/validar-cupon')
                .send({ codigo: 'PROMO10', canal: 'WEB', costoEnvioCop: 12000, lineas: tresPrendas });
            expect(res.status).toBe(200);
            const d = res.body.datos;
            expect(d.descuentoTotalAplicadoCop).toBe(15000);
            expect(d.totalNetoPagarCop).toBe(15000);
            expect(d.costoEnvioCop).toBe(12000);
            expect(d.totalFinalPagarCop).toBe(27000);
        });

        it('13. Valor fijo mayor al subtotal elegible trunca a $0 sin negativos ni tocar el flete', async () => {
            promo({ tipo: 'VALOR_FIJO', valor: 500000 });
            const res = await request(app)
                .post('/api/descuentos/validar-cupon')
                .send({ codigo: 'PROMO10', canal: 'WEB', costoEnvioCop: 8000, lineas: tresPrendas });
            expect(res.status).toBe(200);
            const d = res.body.datos;
            expect(d.descuentoTotalAplicadoCop).toBe(30000);
            expect(d.totalNetoPagarCop).toBe(0);
            expect(d.lineas.every((l: { precioNetoTotalCop: number }) => l.precioNetoTotalCop === 0)).toBe(true);
            expect(d.totalFinalPagarCop).toBe(8000);
        });

        it('14. /calcular sin descuento: totalFinal = subtotal + flete', async () => {
            const res = await request(app).post('/api/descuentos/calcular').send({ canal: 'WEB', costoEnvioCop: 16000, lineas: tresPrendas });
            expect(res.status).toBe(200);
            expect(res.body.datos).toMatchObject({ descuentoTotalAplicadoCop: 0, totalFinalPagarCop: 46000 });
        });

        it('15. /calcular con cupón delega al flujo de cupón (flete incluido)', async () => {
            promo();
            const res = await request(app)
                .post('/api/descuentos/calcular')
                .send({ canal: 'WEB', codigoCupon: 'promo10', costoEnvioCop: 8000, lineas: tresPrendas });
            expect(res.status).toBe(200);
            expect(res.body.datos.lineas.map((l: { descuentoProrrateadoCop: number }) => l.descuentoProrrateadoCop)).toEqual([333, 333, 334]);
            expect(res.body.datos.totalFinalPagarCop).toBe(37000);
        });
    });

    describe('No acumulación y descuento manual (RN-DES-04/05, CA-22/23)', () => {
        it('16. Cupón + descuento manual simultáneos → 400 (con y sin sesión)', async () => {
            const body = {
                canal: 'POS',
                codigoCupon: 'PROMO10',
                descuentoManual: { tipo: 'PORCENTAJE', valor: 5, motivo: 'Cliente frecuente' },
                lineas: tresPrendas,
            };
            const conAdmin = await request(app).post('/api/descuentos/calcular').set('Authorization', ADMIN).send(body);
            expect(conAdmin.status).toBe(400);
            const anonimo = await request(app).post('/api/descuentos/calcular').send(body);
            expect(anonimo.status).toBe(400);
            expect(prismaMock.promocion.findUnique).not.toHaveBeenCalled();
        });

        it('17. Descuento manual que excede el topeDescuentoPorc del vendedor → 400; el ADMIN sí puede', async () => {
            const body = {
                canal: 'POS',
                descuentoManual: { tipo: 'PORCENTAJE', valor: 25, motivo: 'Producto con defecto' },
                lineas: tresPrendas,
            };
            const vend = await request(app).post('/api/descuentos/calcular').set('Authorization', VENDEDOR).send(body);
            expect(vend.status).toBe(400);
            expect(vend.body.error.message).toContain('supera el tope máximo');

            const admin = await request(app).post('/api/descuentos/calcular').set('Authorization', ADMIN).send(body);
            expect(admin.status).toBe(200);
            expect(admin.body.datos.descuentoTotalAplicadoCop).toBe(7500);
        });

        it('18. Vendedor dentro de su tope aplica el descuento manual', async () => {
            const res = await request(app)
                .post('/api/descuentos/calcular')
                .set('Authorization', VENDEDOR)
                .send({ canal: 'POS', descuentoManual: { tipo: 'PORCENTAJE', valor: 10, motivo: 'Fidelidad' }, lineas: tresPrendas });
            expect(res.status).toBe(200);
            expect(res.body.datos.descuentoTotalAplicadoCop).toBe(3000);
            expect(res.body.datos.descuentoManual.motivo).toBe('Fidelidad');
        });

        it('19. Valor fijo manual de vendedor se limita por su tope sobre el subtotal; ADMIN sin tope', async () => {
            const body = { canal: 'POS', descuentoManual: { tipo: 'VALOR_FIJO', valor: 5000, motivo: 'Ajuste comercial' }, lineas: tresPrendas };
            const vend = await request(app).post('/api/descuentos/calcular').set('Authorization', VENDEDOR).send(body); // tope 10% de 30000 = 3000
            expect(vend.status).toBe(400);
            const admin = await request(app).post('/api/descuentos/calcular').set('Authorization', ADMIN).send(body);
            expect(admin.status).toBe(200);
            expect(admin.body.datos.descuentoTotalAplicadoCop).toBe(5000);
        });

        it('20. Vendedor sin permDescuentoManual → 403; sin sesión → 401; canal WEB → 400; motivo obligatorio → 400', async () => {
            const manual = { tipo: 'PORCENTAJE', valor: 5, motivo: 'Motivo válido' };

            const sinPermiso = await request(app).post('/api/descuentos/calcular').set('Authorization', VENDEDOR_SIN_PERMISO)
                .send({ canal: 'POS', descuentoManual: manual, lineas: tresPrendas });
            expect(sinPermiso.status).toBe(403);

            const anonimo = await request(app).post('/api/descuentos/calcular').send({ canal: 'POS', descuentoManual: manual, lineas: tresPrendas });
            expect(anonimo.status).toBe(401);

            const web = await request(app).post('/api/descuentos/calcular').set('Authorization', ADMIN)
                .send({ canal: 'WEB', descuentoManual: manual, lineas: tresPrendas });
            expect(web.status).toBe(400);
            expect(web.body.error.message).toBe('Los descuentos manuales solo están permitidos en mostrador POS.');

            const sinMotivo = await request(app).post('/api/descuentos/calcular').set('Authorization', ADMIN)
                .send({ canal: 'POS', descuentoManual: { tipo: 'PORCENTAJE', valor: 5, motivo: '' }, lineas: tresPrendas });
            expect(sinMotivo.status).toBe(400);
        });

        it('21. Montos no enteros se rechazan (RN-GEN-04)', async () => {
            const res = await request(app).post('/api/descuentos/calcular').send({
                canal: 'WEB',
                lineas: [{ id: 1, cantidad: 1, precioUnitarioBaseCop: 1000.5 }],
            });
            expect(res.status).toBe(400);
        });
    });

    describe('Administración de promociones y borrado lógico (RN-GEN-07, CA-24)', () => {
        const nueva = {
            codigo: ' verano25 ',
            nombre: 'Verano 2025',
            tipo: 'PORCENTAJE',
            valor: 15,
            alcance: 'TODA_LA_COMPRA',
            canalPermitido: 'AMBOS',
            fechaInicio: '2026-01-01T00:00:00-05:00',
            fechaFin: '2026-12-31T23:59:59-05:00',
        };

        it('22. POST crea la promoción (código normalizado) y registra auditoría', async () => {
            prismaMock.promocion.findUnique.mockResolvedValue(null);
            prismaMock.promocion.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 9, ...data }));
            const res = await request(app).post('/api/descuentos/promociones').set('Authorization', ADMIN).send(nueva);
            expect(res.status).toBe(201);
            expect(res.body.datos.codigo).toBe('VERANO25');
            expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ usuarioId: 1, accion: 'CREAR_PROMOCION', entidadTipo: 'Promocion' }) }),
            );
        });

        it('23. POST rechaza código duplicado (409), % > 100, fechas invertidas y rol no ADMIN', async () => {
            prismaMock.promocion.findUnique.mockResolvedValue(promoBase);
            expect((await request(app).post('/api/descuentos/promociones').set('Authorization', ADMIN).send(nueva)).status).toBe(409);
            expect(prismaMock.promocion.create).not.toHaveBeenCalled();

            expect((await request(app).post('/api/descuentos/promociones').set('Authorization', ADMIN).send({ ...nueva, valor: 150 })).status).toBe(400);
            expect((await request(app).post('/api/descuentos/promociones').set('Authorization', ADMIN)
                .send({ ...nueva, fechaInicio: nueva.fechaFin, fechaFin: nueva.fechaInicio })).status).toBe(400);
            expect((await request(app).post('/api/descuentos/promociones').set('Authorization', VENDEDOR).send(nueva)).status).toBe(403);
        });

        it('24. GET lista con filtros (solo ADMIN)', async () => {
            prismaMock.promocion.findMany.mockResolvedValue([promoBase]);
            const res = await request(app).get('/api/descuentos/promociones?activa=true&canal=WEB').set('Authorization', ADMIN);
            expect(res.status).toBe(200);
            expect(prismaMock.promocion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { activa: true, canalPermitido: 'WEB' } }),
            );
            expect((await request(app).get('/api/descuentos/promociones').set('Authorization', VENDEDOR)).status).toBe(403);
            expect((await request(app).get('/api/descuentos/promociones')).status).toBe(401);
        });

        it('25. PATCH desactivar pone activa=false y audita; 404 si no existe', async () => {
            prismaMock.promocion.findUnique.mockResolvedValue(promoBase);
            prismaMock.promocion.update.mockResolvedValue({ ...promoBase, activa: false });
            const res = await request(app).patch('/api/descuentos/promociones/7/desactivar').set('Authorization', ADMIN);
            expect(res.status).toBe(200);
            expect(res.body.datos.activa).toBe(false);
            expect(prismaMock.promocion.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { activa: false } });
            expect(prismaMock.registroAuditoria.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ accion: 'DESACTIVAR_PROMOCION', entidadId: '7' }) }),
            );

            prismaMock.promocion.findUnique.mockResolvedValue(null);
            expect((await request(app).patch('/api/descuentos/promociones/99/desactivar').set('Authorization', ADMIN)).status).toBe(404);
        });

        it('26. DELETE /promociones/:id responde 400 y nunca borra físicamente (aun con tieneUsos)', async () => {
            prismaMock.promocion.findUnique.mockResolvedValue({ ...promoBase, tieneUsos: true });
            const res = await request(app).delete('/api/descuentos/promociones/7').set('Authorization', ADMIN);
            expect(res.status).toBe(400);
            expect(res.body.error.message).toContain('RN-GEN-04'.replace('04', '07'));
            expect(prismaMock.promocion.delete).not.toHaveBeenCalled();
            expect((await request(app).delete('/api/descuentos/promociones/7').set('Authorization', VENDEDOR)).status).toBe(403);
        });
    });
});