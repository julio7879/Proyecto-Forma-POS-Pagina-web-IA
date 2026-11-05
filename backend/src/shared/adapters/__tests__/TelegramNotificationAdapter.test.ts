import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID_OPERACIONES;
    delete process.env.TELEGRAM_CHAT_ID_INVENTARIO;
    delete process.env.TELEGRAM_CHAT_ID_ECOMMERCE;
});

import { TelegramNotificationAdapter } from '../TelegramNotificationAdapter.js';
import type { NotificacionPayload } from '../../ports/NotificacionPort.js';

const TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';
const CHATS = { operaciones: '-100111', inventario: '-100222', ecommerce: '-100333' };
// 2026-11-05 00:51 UTC = 04/11/2026 7:51 p. m. en Bogotá
const AHORA = new Date('2026-11-05T00:51:00Z');

const crear = (config: ConstructorParameters<typeof TelegramNotificationAdapter>[0] = {}) =>
    new TelegramNotificationAdapter({
        botToken: TOKEN,
        chatIds: CHATS,
        now: () => AHORA,
        ...config,
    });

const payloadBase = (tipo: NotificacionPayload['tipo']): NotificacionPayload => ({
    tipo,
    asunto: 'Asunto de prueba',
    cuerpo: 'Cuerpo de prueba',
});

const respuestaOk = () => ({ ok: true, status: 200 }) as Response;
const respuestaError = (status: number) => ({ ok: false, status }) as Response;

const bodyEnviado = (fetchMock: ReturnType<typeof vi.fn>, llamada = 0) =>
    JSON.parse((fetchMock.mock.calls[llamada]![1] as RequestInit).body as string) as {
        chat_id: string;
        text: string;
        parse_mode: string;
    };

describe('TelegramNotificationAdapter', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;
    const fetchOriginal = globalThis.fetch;

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue(respuestaOk());
        globalThis.fetch = fetchMock as unknown as typeof fetch;
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        globalThis.fetch = fetchOriginal;
        vi.restoreAllMocks();
    });

    describe('envío exitoso', () => {
        it('invoca la URL oficial con chat_id y texto HTML formateado y retorna true', async () => {
            const ok = await crear().enviarNotificacion({
                ...payloadBase('ALERTA_DESCUADRE_CAJA'),
                asunto: 'Descuadre <crítico> & urgente',
            });

            expect(ok).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, init] = fetchMock.mock.calls[0]!;
            expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
            expect((init as RequestInit).method).toBe('POST');

            const body = bodyEnviado(fetchMock);
            expect(body.chat_id).toBe('-100111');
            expect(body.parse_mode).toBe('HTML');
            expect(body.text).toContain('🚨 <b>Descuadre &lt;crítico&gt; &amp; urgente</b>');
            expect(body.text).toContain('Cuerpo de prueba');
            expect(body.text).toContain('04/11/2026');
            expect(body.text).toMatch(/7:51\s?p\.\s?m\./);
            expect(warnSpy).not.toHaveBeenCalled();
        });
    });

    describe('modo degradado (fire-and-forget)', () => {
        it('sin TELEGRAM_BOT_TOKEN no llama a fetch, loguea warning y retorna false', async () => {
            const adapter = crear({ botToken: '' });
            await expect(adapter.enviarNotificacion(payloadBase('NUEVO_PEDIDO_WEB'))).resolves.toBe(false);
            expect(fetchMock).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledWith(
                '[TelegramAdapter] Notificación omitida: falta token o chat_id',
                expect.anything(),
            );
        });

        it('sin chat_id del canal y sin destinatario retorna false sin lanzar error', async () => {
            const adapter = crear({ chatIds: { operaciones: '', inventario: '   ', ecommerce: '' } });
            for (const tipo of ['ALERTA_DESCUADRE_CAJA', 'ALERTA_STOCK_BAJO', 'NUEVO_PEDIDO_WEB'] as const) {
                await expect(adapter.enviarNotificacion(payloadBase(tipo))).resolves.toBe(false);
            }
            expect(fetchMock).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledTimes(3);
        });

        it('tipos sin canal (RECUPERACION_CLAVE) sin destinatario no se publican en grupos', async () => {
            await expect(crear().enviarNotificacion(payloadBase('RECUPERACION_CLAVE'))).resolves.toBe(false);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it.each([400, 401, 429, 500])('error HTTP %i de Telegram retorna false sin propagar', async (status) => {
            fetchMock.mockResolvedValueOnce(respuestaError(status));
            await expect(crear().enviarNotificacion(payloadBase('INCIDENCIA_PEDIDO'))).resolves.toBe(false);
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[TelegramAdapter]'),
                expect.objectContaining({ status }),
            );
        });

        it('fallo de red (TypeError) retorna false sin interrumpir el flujo', async () => {
            fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
            await expect(crear().enviarNotificacion(payloadBase('NUEVO_PEDIDO_WEB'))).resolves.toBe(false);
            expect(warnSpy).toHaveBeenCalledTimes(1);
        });

        it('timeout (AbortError) retorna false y aborta la petición con AbortController', async () => {
            fetchMock.mockImplementationOnce(
                (_url: string, init: RequestInit) =>
                    new Promise((_resolve, reject) => {
                        init.signal!.addEventListener('abort', () =>
                            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
                        );
                    }),
            );
            const ok = await crear({ timeoutMs: 20 }).enviarNotificacion(payloadBase('NUEVO_PEDIDO_WEB'));
            expect(ok).toBe(false);
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[TelegramAdapter]'),
                expect.objectContaining({ error: 'AbortError' }),
            );
        });

        it('no filtra el token del bot en los logs de error', async () => {
            fetchMock.mockRejectedValueOnce(new Error(`request to .../bot${TOKEN}/sendMessage failed`));
            await crear().enviarNotificacion(payloadBase('NUEVO_PEDIDO_WEB'));
            expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(TOKEN);
        });
    });

    describe('ruteo automático de canal', () => {
        it.each([
            ['ALERTA_DESCUADRE_CAJA', '-100111'],
            ['APERTURA_CIERRE_CAJA', '-100111'],
            ['INCIDENCIA_PEDIDO', '-100222'],
            ['ALERTA_STOCK_BAJO', '-100222'],
            ['NUEVO_PEDIDO_WEB', '-100333'],
            ['RESERVA_VENCIDA_LIBERADA', '-100333'],
        ] as const)('%s se envía al chat %s', async (tipo, chatEsperado) => {
            await expect(crear().enviarNotificacion(payloadBase(tipo))).resolves.toBe(true);
            expect(bodyEnviado(fetchMock).chat_id).toBe(chatEsperado);
        });

        it('el destinatario explícito tiene prioridad sobre el mapeo por canal', async () => {
            await crear().enviarNotificacion({ ...payloadBase('ALERTA_DESCUADRE_CAJA'), destinatario: '987654' });
            expect(bodyEnviado(fetchMock).chat_id).toBe('987654');
        });
    });

    describe('privacidad (Ley 1581)', () => {
        it('enmascara JWT, hashes y números largos y omite claves sensibles de datosExtra', async () => {
            await crear().enviarNotificacion({
                ...payloadBase('INCIDENCIA_PEDIDO'),
                cuerpo:
                    'jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.firma hash $2b$10$abcdefghijklmnopqrstuv cc 1234567890 pedido PW-20261104-0001',
                datosExtra: { password: 'secreta', cedula: '1234567890', sede: 'Centro', unitario: 5 },
            });
            const { text } = bodyEnviado(fetchMock);
            expect(text).not.toContain('eyJhbGci');
            expect(text).not.toContain('$2b$');
            expect(text).not.toContain('1234567890');
            expect(text).toContain('***7890');
            expect(text).toContain('PW-20261104-0001');
            expect(text).not.toContain('secreta');
            expect(text).toContain('sede: Centro');
            expect(text).toContain('unitario: 5');
        });
    });

    describe('métodos de conveniencia', () => {
        it('notificarDescuadreCaja: 🚨, canal Operaciones y monto entero en COP', async () => {
            const ok = await crear().notificarDescuadreCaja({
                ubicacionNombre: 'Sede Centro',
                cajeroNombre: 'Ana Pérez',
                tipoDescuadre: 'FALTANTE',
                montoCop: 1500000,
                observacion: 'Billete falso <revisar>',
            });
            expect(ok).toBe(true);
            const { chat_id, text } = bodyEnviado(fetchMock);
            expect(chat_id).toBe('-100111');
            expect(text).toContain('🚨 <b>Descuadre de caja (FALTANTE)</b>');
            expect(text).toContain('Monto: $1.500.000 COP');
            expect(text).toContain('Sede: Sede Centro');
            expect(text).toContain('Billete falso &lt;revisar&gt;');
        });

        it('notificarIncidenciaDespacho: 🚨, canal Inventario y mención a custodia central', async () => {
            await crear().notificarIncidenciaDespacho({
                pedidoCodigo: 'PW-0001',
                tiendaOrigenNombre: 'Sede Norte',
                motivo: 'Producto dañado',
                pasoACustodiaCentral: true,
            });
            const { chat_id, text } = bodyEnviado(fetchMock);
            expect(chat_id).toBe('-100222');
            expect(text).toContain('🚨 <b>No puedo despachar</b>');
            expect(text).toContain('Pedido: PW-0001');
            expect(text).toContain('Bodega Central');
        });

        it('notificarIncidenciaDespacho sin custodia no menciona Bodega Central', async () => {
            await crear().notificarIncidenciaDespacho({
                pedidoCodigo: 'PW-0002',
                tiendaOrigenNombre: 'Sede Norte',
                motivo: 'Sin stock',
                pasoACustodiaCentral: false,
            });
            expect(bodyEnviado(fetchMock).text).not.toContain('Bodega Central');
        });

        it('notificarNuevoPedidoWeb: 🛒, canal E-Commerce y total entero en COP', async () => {
            await crear().notificarNuevoPedidoWeb({
                pedidoCodigo: 'PW-0003',
                totalCop: 89900,
                ciudadDestino: 'Medellín',
                tiendaAsignadaNombre: 'Sede Sur',
            });
            const { chat_id, text } = bodyEnviado(fetchMock);
            expect(chat_id).toBe('-100333');
            expect(text).toContain('🛒 <b>Nuevo pedido web</b>');
            expect(text).toContain('Total: $89.900 COP');
            expect(text).toContain('Ciudad destino: Medellín');
            expect(text).toContain('Tienda asignada: Sede Sur');
        });

        it('notificarReservaVencida: 🛒, canal E-Commerce con unidades y minutos', async () => {
            await crear().notificarReservaVencida({
                pedidoCodigo: 'PW-0004',
                unidadesLiberadas: 3,
                minutosExpirados: 1440,
            });
            const { chat_id, text } = bodyEnviado(fetchMock);
            expect(chat_id).toBe('-100333');
            expect(text).toContain('🛒 <b>Reserva vencida y liberada</b>');
            expect(text).toContain('Unidades liberadas: 3');
            expect(text).toContain('Minutos de expiración: 1440');
        });

        it('los métodos de ayuda nunca lanzan aunque Telegram falle', async () => {
            fetchMock.mockRejectedValue(new TypeError('fetch failed'));
            const adapter = crear();
            await expect(
                adapter.notificarReservaVencida({ pedidoCodigo: 'X', unidadesLiberadas: 1, minutosExpirados: 1 }),
            ).resolves.toBe(false);
        });
    });
});