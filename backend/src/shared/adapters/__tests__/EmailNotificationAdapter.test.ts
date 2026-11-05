import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_con_al_menos_32_caracteres_ok';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
});

import { EmailNotificationAdapter } from '../EmailNotificationAdapter.js';
import type { EmailTransport } from '../EmailNotificationAdapter.js';
import {
    renderOrderConfirmationHtml,
    type DatosConfirmacionPedidoEmail,
} from '../templates/orderConfirmationTemplate.js';
import {
    renderOrderDispatchedHtml,
    type DatosDespachoEmail,
} from '../templates/orderDispatchedTemplate.js';
import { formatearCop, formatearFechaBogota } from '../templates/emailLayout.js';

// Con `exactOptionalPropertyTypes`, Partial<T> no admite `undefined` explícito: este tipo sí
// (permite escribir `{ enlaceRastreo: undefined }` para simular un dato ausente).
type Sobrescribir<T> = { [K in keyof T]?: T[K] | undefined };

const confirmacionBase = (
    sobrescribir: Sobrescribir<DatosConfirmacionPedidoEmail> = {},
): DatosConfirmacionPedidoEmail => ({
    referenciaPedido: 'PED-2026-000142',
    fechaPedidoBogota: '04/11/2026 07:51 p. m.',
    clienteNombre: 'María Gómez',
    clienteEmail: 'maria@example.com',
    clienteTelefono: '3001234567',
    departamentoDane: 'Antioquia',
    municipioDane: 'Medellín',
    direccionEntrega: 'Calle 10 # 20-30, Apto 401',
    items: [
        {
            sku: 'CAM-001-M-AZ',
            nombre: 'Camisa Lino',
            talla: 'M',
            color: 'Azul',
            cantidad: 2,
            precioUnitarioCop: 60000,
            subtotalCop: 120000,
        },
        {
            sku: 'PAN-002-32-NE',
            nombre: 'Pantalón Chino',
            talla: '32',
            color: 'Negro',
            cantidad: 1,
            precioUnitarioCop: 189900,
            subtotalCop: 189900,
        },
    ],
    subtotalCop: 309900,
    descuentoCop: 10000,
    costoEnvioCop: 12500,
    totalCop: 312400,
    metodoPago: 'TRANSFERENCIA',
    instruccionesTransferencia: {
        banco: 'Bancolombia',
        tipoCuenta: 'Cuenta Corriente',
        numeroCuenta: '123-456789-00',
        titular: 'Forma Moda S.A.S.',
        nit: '900.123.456-7',
        enlaceComprobante: 'https://tiendaforma.com/pedidos/PED-2026-000142/comprobante',
    },
    ...sobrescribir,
} as DatosConfirmacionPedidoEmail);

const despachoBase = (sobrescribir: Sobrescribir<DatosDespachoEmail> = {}): DatosDespachoEmail => ({
    referenciaPedido: 'PED-2026-000142',
    clienteNombre: 'María Gómez',
    clienteEmail: 'maria@example.com',
    transportadora: 'Coordinadora',
    guiaTransportadora: 'GUIA-998877',
    enlaceRastreo: 'https://www.coordinadora.com/rastreo?guia=GUIA-998877',
    municipioDane: 'Medellín',
    departamentoDane: 'Antioquia',
    direccionEntrega: 'Calle 10 # 20-30, Apto 401',
    ...sobrescribir,
} as DatosDespachoEmail);

describe('Plantilla: confirmación de pedido', () => {
    it('TRANSFERENCIA: incluye referencia, tabla de productos, precios COP, aviso de 24 horas y datos bancarios', () => {
        const html = renderOrderConfirmationHtml(confirmacionBase());

        expect(html).toContain('FORMA');
        expect(html).toContain('PED-2026-000142');
        expect(html).toContain('04/11/2026 07:51 p. m.');
        // Tabla de productos
        expect(html).toContain('Producto / Variante');
        expect(html).toContain('Camisa Lino');
        expect(html).toContain('SKU CAM-001-M-AZ');
        expect(html).toContain('Talla M');
        expect(html).toContain('Color Azul');
        expect(html).toContain('$60.000 COP');
        expect(html).toContain('$120.000 COP');
        // Destino DANE
        expect(html).toContain('Medellín, Antioquia');
        expect(html).toContain('Calle 10 # 20-30, Apto 401');
        // Desglose financiero
        expect(html).toContain('$309.900 COP');
        expect(html).toContain('-$10.000 COP');
        expect(html).toContain('$12.500 COP');
        expect(html).toContain('$312.400 COP');
        // Aviso TTL + banco + CTA
        expect(html).toContain('⏳');
        expect(html).toContain('24 horas');
        expect(html).toContain('Bancolombia');
        expect(html).toContain('123-456789-00');
        expect(html).toContain('900.123.456-7');
        expect(html).toContain('Reportar comprobante de pago');
        expect(html).toContain('https://tiendaforma.com/pedidos/PED-2026-000142/comprobante');
        // Responsivo y Obsidian Navy
        expect(html).toContain('max-width:600px');
        expect(html).toContain('#0F172A');
        expect(html).toContain('#38BDF8');
        expect(html).toContain('Ley 1581');
    });

    it('CONTRAENTREGA: NO incluye datos bancarios y muestra la indicación de efectivo exacto', () => {
        const html = renderOrderConfirmationHtml(
            confirmacionBase({ metodoPago: 'CONTRAENTREGA', instruccionesTransferencia: undefined }),
        );

        expect(html).toContain('💵');
        expect(html).toContain('efectivo exacto');
        expect(html).not.toContain('Bancolombia');
        expect(html).not.toContain('Datos para tu transferencia');
        expect(html).not.toContain('Reportar comprobante');
        expect(html).not.toContain('⏳');
    });

    it('CONTRAENTREGA no filtra datos bancarios aunque se envíen en los datos', () => {
        const html = renderOrderConfirmationHtml(confirmacionBase({ metodoPago: 'CONTRAENTREGA' }));
        expect(html).not.toContain('123-456789-00');
    });

    it('omite la fila de descuento cuando no aplica', () => {
        const html = renderOrderConfirmationHtml(confirmacionBase({ descuentoCop: 0 }));
        expect(html).not.toContain('Descuento aplicado');
    });

    it('enmascara el teléfono del cliente (Ley 1581)', () => {
        const html = renderOrderConfirmationHtml(confirmacionBase());
        expect(html).not.toContain('3001234567');
        expect(html).toContain('4567');
    });

    it('sanitiza HTML malicioso en nombres, variantes y dirección (XSS)', () => {
        const html = renderOrderConfirmationHtml(
            confirmacionBase({
                clienteNombre: '<script>alert(1)</script>',
                direccionEntrega: '"><img src=x onerror=alert(2)>',
                items: [
                    {
                        sku: 'X-1',
                        nombre: '<b onmouseover="hack()">Camisa</b>',
                        talla: '<i>M</i>',
                        cantidad: 1,
                        precioUnitarioCop: 1000,
                        subtotalCop: 1000,
                    },
                ],
            }),
        );

        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).not.toContain('<img src=x');
        expect(html).not.toContain('<b onmouseover');
        expect(html).not.toContain('<i>M</i>');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).toContain('&lt;b onmouseover=&quot;hack()&quot;&gt;Camisa&lt;/b&gt;');
    });

    it('descarta enlaces con esquemas peligrosos (javascript:)', () => {
        const html = renderOrderConfirmationHtml(
            confirmacionBase({
                instruccionesTransferencia: {
                    ...confirmacionBase().instruccionesTransferencia!,
                    enlaceComprobante: 'javascript:alert(1)',
                },
            }),
        );
        expect(html).not.toContain('javascript:');
        expect(html).not.toContain('Reportar comprobante de pago');
    });
});

describe('Plantilla: despacho (PEDIDO_ENVIADO)', () => {
    it('incluye transportadora, guía, botón de rastreo y dirección confirmada', () => {
        const html = renderOrderDispatchedHtml(despachoBase());

        expect(html).toContain('📦 ¡Tu pedido va en camino!');
        expect(html).toContain('PED-2026-000142');
        expect(html).toContain('Coordinadora');
        expect(html).toContain('GUIA-998877');
        expect(html).toContain('Rastrear mi paquete');
        expect(html).toContain('href="https://www.coordinadora.com/rastreo?guia=GUIA-998877"');
        expect(html).toContain('Medellín, Antioquia');
        expect(html).toContain('Calle 10 # 20-30, Apto 401');
    });

    it('sin enlace de rastreo no muestra el botón', () => {
        const html = renderOrderDispatchedHtml(despachoBase({ enlaceRastreo: undefined }));
        expect(html).not.toContain('Rastrear mi paquete');
        expect(html).toContain('GUIA-998877');
    });

    it('escapa HTML en transportadora y guía', () => {
        const html = renderOrderDispatchedHtml(
            despachoBase({ transportadora: '<script>x</script>', guiaTransportadora: '"><b>' }),
        );
        expect(html).not.toContain('<script>x</script>');
        expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    });
});

describe('Formato de dinero y fecha (RN-GEN-04, RN-GEN-05)', () => {
    it.each([
        [0, '$0 COP'],
        [999, '$999 COP'],
        [1500, '$1.500 COP'],
        [120000, '$120.000 COP'],
        [1234567, '$1.234.567 COP'],
        [89900.6, '$89.901 COP'], // sin decimales
    ])('formatearCop(%s) = %s', (monto, esperado) => {
        expect(formatearCop(monto)).toBe(esperado);
    });

    it('formatearCop nunca imprime decimales ni valores no finitos', () => {
        expect(formatearCop(1000.4)).toBe('$1.000 COP');
        expect(formatearCop(Number.NaN)).toBe('$0 COP');
    });

    it('formatearFechaBogota usa la zona America/Bogota', () => {
        // 2026-11-05 00:51 UTC = 04/11/2026 7:51 p. m. en Bogotá
        const f = formatearFechaBogota(new Date('2026-11-05T00:51:00Z'));
        expect(f).toContain('04/11/2026');
        expect(f).toMatch(/7:51 p\. m\./);
    });
});

describe('EmailNotificationAdapter', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('modo mock in-memory', () => {
        it('registra la confirmación en getEnviados() con destinatario, asunto y HTML, y retorna true', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'test' });

            await expect(adapter.enviarConfirmacionPedidoWeb(confirmacionBase())).resolves.toBe(true);

            const enviados = adapter.getEnviados();
            expect(enviados).toHaveLength(1);
            expect(enviados[0]!.to).toBe('maria@example.com');
            expect(enviados[0]!.subject).toContain('PED-2026-000142');
            expect(enviados[0]!.html).toContain('Camisa Lino');
            expect(enviados[0]!.html).toContain('$312.400 COP');
            expect(enviados[0]!.text).toContain('Total a pagar: $312.400 COP');
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it('registra el aviso de despacho con guía y transportadora', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'test' });
            await expect(adapter.enviarNotificacionDespacho(despachoBase())).resolves.toBe(true);
            const [correo] = adapter.getEnviados();
            expect(correo!.subject).toContain('va en camino');
            expect(correo!.html).toContain('GUIA-998877');
            expect(correo!.html).toContain('Coordinadora');
        });

        it('enviarNotificacion genérico requiere correo y se registra en memoria', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'test' });
            const ok = await adapter.enviarNotificacion({
                tipo: 'PEDIDO_ENVIADO',
                destinatario: 'cliente@example.com',
                asunto: 'Hola <mundo>',
                cuerpo: 'Línea 1\nLínea 2 <b>x</b>',
            });
            expect(ok).toBe(true);
            const [correo] = adapter.getEnviados();
            expect(correo!.html).toContain('Hola &lt;mundo&gt;');
            expect(correo!.html).not.toContain('<b>x</b>');
        });

        it('sin SMTP configurado (fuera de test) opera en mock sin lanzar', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'production', host: '', user: '' });
            await expect(adapter.enviarNotificacionDespacho(despachoBase())).resolves.toBe(true);
            expect(adapter.getEnviados()).toHaveLength(1);
        });

        it('limpiarEnviados() vacía el buzón y getEnviados() devuelve copias', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'test' });
            await adapter.enviarNotificacionDespacho(despachoBase());
            adapter.getEnviados()[0]!.to = 'alterado@example.com';
            expect(adapter.getEnviados()[0]!.to).toBe('maria@example.com');
            adapter.limpiarEnviados();
            expect(adapter.getEnviados()).toEqual([]);
        });

        it('destinatario ausente o inválido: retorna false con warning y sin lanzar', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'test' });
            await expect(
                adapter.enviarConfirmacionPedidoWeb(confirmacionBase({ clienteEmail: 'no-es-correo' })),
            ).resolves.toBe(false);
            await expect(
                adapter.enviarNotificacion({ tipo: 'PEDIDO_ENVIADO', asunto: 'a', cuerpo: 'b' }),
            ).resolves.toBe(false);
            expect(adapter.getEnviados()).toHaveLength(0);
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[EmailAdapter]'), expect.anything());
        });

        it('elimina saltos de línea del asunto (anti inyección de cabeceras)', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'test' });
            await adapter.enviarNotificacion({
                tipo: 'PEDIDO_ENVIADO',
                destinatario: 'a@example.com',
                asunto: 'Asunto\r\nBcc: espia@evil.com',
                cuerpo: 'x',
            });
            expect(adapter.getEnviados()[0]!.subject).not.toMatch(/[\r\n]/);
        });
    });

    describe('modo SMTP y resiliencia', () => {
        const smtp = (sendMail: EmailTransport['sendMail']) =>
            new EmailNotificationAdapter({
                nodeEnv: 'production',
                host: 'smtp.example.com',
                user: 'usuario_smtp',
                pass: 'clave_super_secreta',
                from: 'Forma Moda <pedidos@tiendaforma.com>',
                transport: { sendMail },
            });

        it('con transportador SMTP envía el mensaje con from/to/subject/html y retorna true', async () => {
            const sendMail = vi.fn().mockResolvedValue({ messageId: 'abc' });
            const ok = await smtp(sendMail).enviarConfirmacionPedidoWeb(confirmacionBase());

            expect(ok).toBe(true);
            expect(sendMail).toHaveBeenCalledTimes(1);
            const mensaje = sendMail.mock.calls[0]![0] as Record<string, string>;
            expect(mensaje.from).toBe('Forma Moda <pedidos@tiendaforma.com>');
            expect(mensaje.to).toBe('maria@example.com');
            expect(mensaje.subject).toContain('PED-2026-000142');
            expect(mensaje.html).toContain('Bancolombia');
        });

        it('si el transportador SMTP rechaza, retorna false con warning estructurado y sin lanzar', async () => {
            const sendMail = vi.fn().mockRejectedValue(new Error('Invalid login: 535 Authentication failed'));
            const adapter = smtp(sendMail);

            await expect(adapter.enviarConfirmacionPedidoWeb(confirmacionBase())).resolves.toBe(false);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[EmailAdapter]'),
                expect.objectContaining({ tipo: 'CONFIRMACION_PEDIDO', dominioDestino: 'example.com' }),
            );
            expect(adapter.getEnviados()).toHaveLength(0);
        });

        it('error de red (ECONNREFUSED) en despacho retorna false sin propagar', async () => {
            const sendMail = vi.fn().mockRejectedValue(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }));
            await expect(smtp(sendMail).enviarNotificacionDespacho(despachoBase())).resolves.toBe(false);
            expect(warnSpy).toHaveBeenCalledTimes(1);
        });

        it('timeout SMTP retorna false', async () => {
            const sendMail = vi.fn().mockImplementation(() => new Promise(() => undefined));
            const adapter = new EmailNotificationAdapter({
                nodeEnv: 'production',
                host: 'smtp.example.com',
                user: 'u',
                timeoutMs: 20,
                transport: { sendMail },
            });
            await expect(adapter.enviarNotificacionDespacho(despachoBase())).resolves.toBe(false);
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[EmailAdapter]'),
                expect.objectContaining({ error: 'TimeoutError' }),
            );
        });

        it('no filtra credenciales SMTP en los logs ni el HTML del correo', async () => {
            const sendMail = vi
                .fn()
                .mockRejectedValue(new Error('auth failed for usuario_smtp with clave_super_secreta'));
            await smtp(sendMail).enviarNotificacionDespacho(despachoBase());
            const logs = JSON.stringify(warnSpy.mock.calls);
            expect(logs).not.toContain('clave_super_secreta');
            expect(logs).not.toContain('usuario_smtp');
            expect(logs).not.toContain('maria@example.com'); // solo se loguea el dominio
        });

        it('una plantilla que lanza (datos corruptos) retorna false sin propagar', async () => {
            const adapter = new EmailNotificationAdapter({ nodeEnv: 'test' });
            const corrupto = { ...confirmacionBase(), items: undefined } as unknown as DatosConfirmacionPedidoEmail;
            await expect(adapter.enviarConfirmacionPedidoWeb(corrupto)).resolves.toBe(false);
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[EmailAdapter]'), expect.anything());
        });
    });
});