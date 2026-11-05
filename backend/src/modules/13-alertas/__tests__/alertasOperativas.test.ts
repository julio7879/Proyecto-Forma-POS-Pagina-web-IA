import { beforeEach, describe, expect, it, vi } from 'vitest';

// env.ts valida variables al importarse: se fijan antes de cargar la app
vi.hoisted(() => {
    process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
});

const prismaMock = vi.hoisted(() => ({
    usuario: { findUnique: vi.fn(), findMany: vi.fn() },
    ubicacion: { findMany: vi.fn() },
    variante: { findMany: vi.fn() },
    saldoStock: { findMany: vi.fn(), findUnique: vi.fn() },
    pedidoWeb: { findMany: vi.fn(), findUnique: vi.fn() },
    sesionCaja: { findMany: vi.fn(), findUnique: vi.fn() },
    registroAuditoria: { create: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
}));

vi.mock('../../../config/database.js', () => ({ prisma: prismaMock, default: prismaMock }));

import request from 'supertest';
import { app } from '../../../app.js';
import { ColombiaTime } from '../../../shared/domain/ColombiaTime.js';
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
    2: { id: 2, correo: 'vend@forma.com', rol: 'VENDEDOR', ubicacionId: 2, activo: true, topeDescuentoPorc: 10, ...permisosOff },
    3: { id: 3, correo: 'cli@correo.com', rol: 'CLIENTE', ubicacionId: null, activo: true, topeDescuentoPorc: 0, ...permisosOff },
    4: { id: 4, correo: 'sinsede@forma.com', rol: 'VENDEDOR', ubicacionId: null, activo: true, topeDescuentoPorc: 0, ...permisosOff },
};

const token = (userId: number, correo: string, rol: 'ADMIN' | 'VENDEDOR' | 'CLIENTE') =>
    `Bearer ${generateToken({ userId, correo, rol })}`;
const ADMIN = token(1, 'admin@forma.com', 'ADMIN');
const VENDEDOR = token(2, 'vend@forma.com', 'VENDEDOR'); // sede 2
const CLIENTE = token(3, 'cli@correo.com', 'CLIENTE');
const VENDEDOR_SIN_SEDE = token(4, 'sinsede@forma.com', 'VENDEDOR');

const HORA = 60 * 60 * 1000;
const ahora = () => Date.now();
const hoyBogota = ColombiaTime.toFechaNegocioColombia();

// ---- Datos simulados: sede 1 = Centro, sede 2 = Ocaña, sede 4 = Bodega Central ----
const ubicaciones = [
    { id: 1, nombre: 'Sede Centro' },
    { id: 2, nombre: 'Sede Ocaña' },
    { id: 4, nombre: 'Bodega Central' },
];
const variantes = [
    { id: 100, sku: 'CAM-001-M-AZU', talla: 'M', color: 'Azul', producto: { nombre: 'Camisa Oxford' } },
    { id: 101, sku: 'JEA-002-32-NEG', talla: '32', color: 'Negro', producto: { nombre: 'Jean Slim' } },
    { id: 102, sku: 'VES-003-S-ROJ', talla: 'S', color: 'Rojo', producto: { nombre: 'Vestido Floral' } },
];
const saldosBloqueados = [
    { id: 11, ubicacionId: 2, varianteId: 100, fisico: 4, bloqueadoDespachoWeb: true, motivoBloqueoWeb: 'No puedo despachar: prenda no ubicada' },
    { id: 12, ubicacionId: 1, varianteId: 101, fisico: 6, bloqueadoDespachoWeb: true, motivoBloqueoWeb: 'No puedo despachar: prenda dañada' },
];
const saldosBajos = [
    { id: 21, ubicacionId: 2, varianteId: 100, fisico: 2, bloqueadoDespachoWeb: false, motivoBloqueoWeb: null },
    { id: 22, ubicacionId: 1, varianteId: 101, fisico: 0, bloqueadoDespachoWeb: false, motivoBloqueoWeb: null },
    { id: 23, ubicacionId: 2, varianteId: 102, fisico: 3, bloqueadoDespachoWeb: false, motivoBloqueoWeb: null },
];
const pedidos = [
    {
        id: 142,
        referenciaLegible: 'PED-2026-000142',
        ubicacionAsignadaId: 4,
        estadoPedido: 'RECIBIDO',
        tieneIncidenciaStock: true,
        totalNetoProductosCop: 150000,
        totalAPagarCop: 158000,
        fechaCreacion: new Date(ahora() - 3 * HORA),
        cliente: { nombreCompleto: 'Ana Pérez' },
    },
];
const sesionBase = {
    abiertaPorId: 2,
    cerradaPorId: null,
    fechaApertura: new Date(ahora() - 30 * HORA),
    fechaCierre: null,
    diferenciaCierreCop: null,
    observacionApertura: null,
    observacionCierre: null,
};
const sesiones = [
    { ...sesionBase, id: 31, ubicacionId: 2, estado: 'ABIERTA', fechaNegocioColombia: '2020-01-15' }, // vencida sin cierre
    { ...sesionBase, id: 32, ubicacionId: 1, estado: 'CERRADA', fechaNegocioColombia: hoyBogota, cerradaPorId: 1, fechaCierre: new Date(ahora() - 2 * HORA), diferenciaCierreCop: -5000, observacionCierre: 'Faltante billete de 5.000' }, // faltante
    { ...sesionBase, id: 33, ubicacionId: 2, estado: 'ABIERTA', fechaNegocioColombia: hoyBogota }, // del día: NO alerta
    { ...sesionBase, id: 34, ubicacionId: 2, estado: 'CERRADA', fechaNegocioColombia: hoyBogota, cerradaPorId: 2, fechaCierre: new Date(ahora() - HORA), diferenciaCierreCop: 0 }, // cuadrada: NO alerta
    { ...sesionBase, id: 35, ubicacionId: 2, estado: 'CERRADA', fechaNegocioColombia: '2020-01-10', cerradaPorId: 2, fechaCierre: new Date(ahora() - 120 * HORA), diferenciaCierreCop: 3000 }, // descuadre antiguo: NO alerta
];

// Los mocks devuelven datos de TODAS las sedes aunque el where filtre: así se prueba también la defensa en profundidad
function configurarMocks() {
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));
    prismaMock.usuario.findUnique.mockImplementation(
        async ({ where }: { where: { id: number } }) => usuarios[where.id] ?? null,
    );
    prismaMock.usuario.findMany.mockResolvedValue([
        { id: 1, nombreCompleto: 'Admin General' },
        { id: 2, nombreCompleto: 'Carlos Vendedor' },
    ]);
    prismaMock.ubicacion.findMany.mockResolvedValue(ubicaciones);
    prismaMock.variante.findMany.mockResolvedValue(variantes);
    prismaMock.saldoStock.findMany.mockImplementation(async ({ where }: { where: { bloqueadoDespachoWeb?: boolean; fisico?: unknown } }) =>
        where.bloqueadoDespachoWeb === true ? saldosBloqueados : saldosBajos,
    );
    prismaMock.pedidoWeb.findMany.mockResolvedValue(pedidos);
    prismaMock.sesionCaja.findMany.mockResolvedValue(sesiones);
    prismaMock.registroAuditoria.findMany.mockResolvedValue([]);
    prismaMock.registroAuditoria.create.mockResolvedValue({ id: 1n });
    prismaMock.saldoStock.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) =>
        [...saldosBloqueados, ...saldosBajos].find((s) => s.id === where.id) ?? null,
    );
    prismaMock.pedidoWeb.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) =>
        pedidos.find((p) => p.id === where.id) ?? null,
    );
    prismaMock.sesionCaja.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) =>
        sesiones.find((s) => s.id === where.id) ?? null,
    );
}

const ids = (res: { body: { datos: { alertas: { id: string }[] } } }) => res.body.datos.alertas.map((a) => a.id);

describe('Módulo 13: Centro de Alertas Operativas (/api/alertas) RF-REP-02, CA-44..46, RN-ROL-04', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        UserPermissionCache.clear();
        configurarMocks();
    });

    it('1. ADMIN recibe las 4 categorías consolidadas de todas las sedes, ordenadas por severidad', async () => {
        const res = await request(app).get('/api/alertas').set('Authorization', ADMIN);
        expect(res.status).toBe(200);
        const { totalAlertas, totalPendientes, alertas } = res.body.datos;
        expect(totalAlertas).toBe(8);
        expect(totalPendientes).toBe(8);
        expect(new Set(alertas.map((a: { tipo: string }) => a.tipo))).toEqual(
            new Set(['SKU_CUARENTENA_WEB', 'PEDIDO_CUSTODIA_CENTRAL', 'CAJA_IRREGULAR', 'STOCK_BAJO']),
        );
        expect(new Set(alertas.map((a: { ubicacionId: number }) => a.ubicacionId))).toEqual(new Set([1, 2, 4]));
        // CRITICA (3) -> ALTA (2) -> MEDIA (3)
        expect(alertas.map((a: { severidad: string }) => a.severidad)).toEqual([
            'CRITICA', 'CRITICA', 'CRITICA', 'ALTA', 'ALTA', 'MEDIA', 'MEDIA', 'MEDIA',
        ]);
        expect(prismaMock.saldoStock.findMany).toHaveBeenCalledTimes(2);
        expect(prismaMock.pedidoWeb.findMany).toHaveBeenCalledTimes(1);
    });

    it('2. VENDEDOR (sede 2) queda acotado a su sede: solo cajas y stock bajo locales (RN-ROL-04)', async () => {
        // Intenta escapar de su territorio con ?ubicacionId=1: debe ignorarse
        const res = await request(app).get('/api/alertas?ubicacionId=1').set('Authorization', VENDEDOR);
        expect(res.status).toBe(200);
        expect(ids(res).sort()).toEqual(['CAJA_IRREGULAR:31', 'STOCK_BAJO:21', 'STOCK_BAJO:23']);
        expect(res.body.datos.alertas.every((a: { ubicacionId: number }) => a.ubicacionId === 2)).toBe(true);
        // No se consultan custodias web ni cuarentenas; las consultas de caja/stock se acotan a la sede 2
        expect(prismaMock.pedidoWeb.findMany).not.toHaveBeenCalled();
        expect(prismaMock.saldoStock.findMany).toHaveBeenCalledTimes(1);
        expect(prismaMock.saldoStock.findMany.mock.calls[0]![0].where).toMatchObject({ ubicacionId: 2 });
        expect(prismaMock.sesionCaja.findMany.mock.calls[0]![0].where).toMatchObject({ ubicacionId: 2 });
    });

    it('3. Detecta CAJA_VENCIDA_SIN_CIERRE con fecha previa al día actual de Bogotá (y no la caja del día)', async () => {
        const res = await request(app).get('/api/alertas?tipo=CAJA_IRREGULAR').set('Authorization', ADMIN);
        const vencida = res.body.datos.alertas.find((a: { id: string }) => a.id === 'CAJA_IRREGULAR:31');
        expect(vencida).toMatchObject({
            subtipo: 'CAJA_VENCIDA_SIN_CIERRE',
            severidad: 'ALTA',
            ubicacionNombre: 'Sede Ocaña',
            datos: { fechaNegocioColombia: '2020-01-15', estado: 'ABIERTA', cajero: 'Carlos Vendedor' },
        });
        expect(ids(res)).not.toContain('CAJA_IRREGULAR:33'); // abierta pero del día vigente
    });

    it('4. Detecta CAJA_DESCUADRE reciente con FALTANTE/SOBRANTE y excluye cuadradas o antiguas', async () => {
        const res = await request(app).get('/api/alertas?tipo=CAJA_IRREGULAR').set('Authorization', ADMIN);
        const descuadre = res.body.datos.alertas.find((a: { id: string }) => a.id === 'CAJA_IRREGULAR:32');
        expect(descuadre).toMatchObject({
            subtipo: 'CAJA_DESCUADRE',
            datos: { diferenciaCierreCop: -5000, tipoDiferencia: 'FALTANTE', observacion: 'Faltante billete de 5.000' },
        });
        expect(ids(res)).not.toContain('CAJA_IRREGULAR:34'); // diferencia 0
        expect(ids(res)).not.toContain('CAJA_IRREGULAR:35'); // fuera de la ventana de 48 h
    });

    it('5. Detecta SKU_CUARENTENA_WEB (bloqueadoDespachoWeb) con datos de sede y variante', async () => {
        const res = await request(app).get('/api/alertas?tipo=SKU_CUARENTENA_WEB').set('Authorization', ADMIN);
        expect(ids(res).sort()).toEqual(['CUARENTENA_WEB:11', 'CUARENTENA_WEB:12']);
        expect(res.body.datos.alertas.find((a: { id: string }) => a.id === 'CUARENTENA_WEB:11')).toMatchObject({
            severidad: 'CRITICA',
            ubicacionNombre: 'Sede Ocaña',
            datos: { sku: 'CAM-001-M-AZU', producto: 'Camisa Oxford', talla: 'M', color: 'Azul', fisico: 4, motivoBloqueoWeb: 'No puedo despachar: prenda no ubicada' },
        });
        expect(prismaMock.saldoStock.findMany.mock.calls[0]![0].where).toMatchObject({ bloqueadoDespachoWeb: true });
    });

    it('6. Detecta PEDIDO_CUSTODIA_CENTRAL con incidencia y excluye estados terminales en la consulta', async () => {
        const res = await request(app).get('/api/alertas?tipo=PEDIDO_CUSTODIA_CENTRAL').set('Authorization', ADMIN);
        expect(res.body.datos.alertas).toHaveLength(1);
        expect(res.body.datos.alertas[0]).toMatchObject({
            id: 'CUSTODIA_CENTRAL:142',
            severidad: 'CRITICA',
            ubicacionNombre: 'Bodega Central',
            datos: { referenciaLegible: 'PED-2026-000142', cliente: 'Ana Pérez', totalNetoProductosCop: 150000 },
        });
        const where = prismaMock.pedidoWeb.findMany.mock.calls[0]![0].where;
        expect(where.tieneIncidenciaStock).toBe(true);
        expect(where.estadoPedido.notIn).toEqual(expect.arrayContaining(['ENTREGADO', 'CANCELADO']));
    });

    it('7. Detecta STOCK_BAJO con fisico <= umbral (default 3) y respeta ?umbralStock', async () => {
        const def = await request(app).get('/api/alertas?tipo=STOCK_BAJO').set('Authorization', ADMIN);
        expect(prismaMock.saldoStock.findMany.mock.calls[0]![0].where.fisico).toEqual({ gte: 0, lte: 3 });
        expect(ids(def).sort()).toEqual(['STOCK_BAJO:21', 'STOCK_BAJO:22', 'STOCK_BAJO:23']);
        expect(def.body.datos.alertas[0].datos).toMatchObject({ umbralStock: 3 });

        prismaMock.saldoStock.findMany.mockClear();
        const estricto = await request(app).get('/api/alertas?tipo=STOCK_BAJO&umbralStock=2').set('Authorization', ADMIN);
        expect(prismaMock.saldoStock.findMany.mock.calls[0]![0].where.fisico).toEqual({ gte: 0, lte: 2 });
        expect(ids(estricto).sort()).toEqual(['STOCK_BAJO:21', 'STOCK_BAJO:22']); // fisico 3 queda fuera
    });

    it('8. Filtros del ADMIN: severidad y ubicacionId', async () => {
        const sev = await request(app).get('/api/alertas?severidad=MEDIA').set('Authorization', ADMIN);
        expect(sev.body.datos.alertas.every((a: { tipo: string }) => a.tipo === 'STOCK_BAJO')).toBe(true);

        const sede = await request(app).get('/api/alertas?ubicacionId=1').set('Authorization', ADMIN);
        expect(sede.body.datos.alertas.every((a: { ubicacionId: number }) => a.ubicacionId === 1)).toBe(true);
        expect(sede.body.datos.alertas.length).toBeGreaterThan(0);
    });

    it('9. PATCH /:id/atender registra auditoría append-only y responde 200', async () => {
        const res = await request(app)
            .patch('/api/alertas/STOCK_BAJO:21/atender')
            .set('Authorization', ADMIN)
            .send({ notas: '  Reposición solicitada a Bodega Central  ' });
        expect(res.status).toBe(200);
        expect(res.body.datos).toMatchObject({ mensaje: 'Alerta marcada como atendida exitosamente', id: 'STOCK_BAJO:21' });
        expect(prismaMock.registroAuditoria.create).toHaveBeenCalledTimes(1);
        const { data } = prismaMock.registroAuditoria.create.mock.calls[0]![0];
        expect(data).toMatchObject({
            usuarioId: 1,
            accion: 'ATENDER_ALERTA',
            entidadTipo: 'AlertaOperativa',
            entidadId: 'STOCK_BAJO:21',
            datosMinimos: { usuarioId: 1, notas: 'Reposición solicitada a Bodega Central' },
        });
        expect(Number.isNaN(Date.parse(data.datosMinimos.fechaAtencion))).toBe(false);
    });

    it('10. soloPendientes=true (default) excluye las alertas ya atendidas; =false las incluye marcadas', async () => {
        prismaMock.registroAuditoria.findMany.mockResolvedValue([
            { entidadId: 'STOCK_BAJO:21', datosMinimos: { usuarioId: 1, notas: null, fechaAtencion: new Date(ahora() - HORA).toISOString() } },
        ]);

        const pendientes = await request(app).get('/api/alertas?tipo=STOCK_BAJO&soloPendientes=true').set('Authorization', ADMIN);
        expect(ids(pendientes)).not.toContain('STOCK_BAJO:21');
        expect(pendientes.body.datos).toMatchObject({ totalAlertas: 3, totalPendientes: 2 });
        expect(pendientes.body.datos.alertas).toHaveLength(2);

        const porDefecto = await request(app).get('/api/alertas?tipo=STOCK_BAJO').set('Authorization', ADMIN);
        expect(ids(porDefecto)).not.toContain('STOCK_BAJO:21');

        const todas = await request(app).get('/api/alertas?tipo=STOCK_BAJO&soloPendientes=false').set('Authorization', ADMIN);
        const atendida = todas.body.datos.alertas.find((a: { id: string }) => a.id === 'STOCK_BAJO:21');
        expect(atendida).toMatchObject({ atendida: true, atendidaPor: 1 });
        expect(atendida.fechaAtencion).toBeDefined();
    });

    it('11. Una atención antigua (> 24 h) ya no oculta la alerta que persiste', async () => {
        prismaMock.registroAuditoria.findMany.mockResolvedValue([
            { entidadId: 'STOCK_BAJO:21', datosMinimos: { usuarioId: 1, notas: null, fechaAtencion: new Date(ahora() - 48 * HORA).toISOString() } },
        ]);
        const res = await request(app).get('/api/alertas?tipo=STOCK_BAJO').set('Authorization', ADMIN);
        expect(ids(res)).toContain('STOCK_BAJO:21');
    });

    it('12. Sin JWT → 401; rol CLIENTE → 403; vendedor sin sede asignada → 403', async () => {
        expect((await request(app).get('/api/alertas')).status).toBe(401);
        expect((await request(app).patch('/api/alertas/STOCK_BAJO:21/atender').send({})).status).toBe(401);
        expect((await request(app).get('/api/alertas').set('Authorization', CLIENTE)).status).toBe(403);
        expect((await request(app).get('/api/alertas').set('Authorization', VENDEDOR_SIN_SEDE)).status).toBe(403);
    });

    it('13. Vendedor solo atiende alertas locales: propia sede 200; otra sede 404; custodia/cuarentena 403', async () => {
        const propia = await request(app).patch('/api/alertas/STOCK_BAJO:21/atender').set('Authorization', VENDEDOR).send({});
        expect(propia.status).toBe(200);
        expect(prismaMock.registroAuditoria.create).toHaveBeenCalledTimes(1);

        const caja = await request(app).patch('/api/alertas/CAJA_IRREGULAR:31/atender').set('Authorization', VENDEDOR).send({});
        expect(caja.status).toBe(200);

        prismaMock.registroAuditoria.create.mockClear();
        const otraSede = await request(app).patch('/api/alertas/STOCK_BAJO:22/atender').set('Authorization', VENDEDOR).send({});
        expect(otraSede.status).toBe(404);
        const custodia = await request(app).patch('/api/alertas/CUSTODIA_CENTRAL:142/atender').set('Authorization', VENDEDOR).send({});
        expect(custodia.status).toBe(403);
        const cuarentena = await request(app).patch('/api/alertas/CUARENTENA_WEB:11/atender').set('Authorization', VENDEDOR).send({});
        expect(cuarentena.status).toBe(403);
        expect(prismaMock.registroAuditoria.create).not.toHaveBeenCalled();
    });

    it('14. Atender: id con formato inválido → 400; alerta inexistente → 404; notas > 500 → 400', async () => {
        expect((await request(app).patch('/api/alertas/HOLA:1/atender').set('Authorization', ADMIN).send({})).status).toBe(400);
        expect((await request(app).patch('/api/alertas/STOCK_BAJO:99999/atender').set('Authorization', ADMIN).send({})).status).toBe(404);
        expect(
            (await request(app).patch('/api/alertas/STOCK_BAJO:21/atender').set('Authorization', ADMIN).send({ notas: 'x'.repeat(501) })).status,
        ).toBe(400);
        expect(prismaMock.registroAuditoria.create).not.toHaveBeenCalled();
    });
});