import { env } from '../../config/env.js';
import type { NotificacionPayload, NotificacionPort } from '../ports/NotificacionPort.js';
import { escapeHtml, formatearCop, renderLayout } from './templates/emailLayout.js';
import {
    renderOrderConfirmationHtml,
    type DatosConfirmacionPedidoEmail,
} from './templates/orderConfirmationTemplate.js';
import {
    renderOrderDispatchedHtml,
    type DatosDespachoEmail,
} from './templates/orderDispatchedTemplate.js';

/**
 * Adaptador de correo transaccional (SP4-04, Issue #77).
 *
 * - Fire-and-forget seguro: ningún método lanza ni rechaza; ante cualquier fallo
 *   (SMTP, red, autenticación, timeout, plantilla) loguea `console.warn('[EmailAdapter] ...')`
 *   y retorna `false`, sin afectar transacciones de negocio.
 * - Modo mock in-memory: si NODE_ENV === 'test' o no hay SMTP_HOST/SMTP_USER, los correos
 *   se guardan en memoria (`getEnviados()` / `limpiarEnviados()`) y se retorna `true`.
 * - nodemailer se carga de forma perezosa solo cuando hay SMTP real.
 */

const TAG = '[EmailAdapter]';
const TIMEOUT_MS_DEFAULT = 10_000;
const EMAIL_REGEX = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

export interface CorreoEnviado {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/** Contrato mínimo del transportador (compatible con nodemailer.Transporter). */
export interface EmailTransport {
    sendMail(mensaje: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text?: string;
    }): Promise<unknown>;
}

export interface EmailAdapterConfig {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
    secure?: boolean;
    nodeEnv?: string;
    timeoutMs?: number;
    /** Transportador inyectado (pruebas / desacople de nodemailer). Si se pasa, se usa como SMTP real. */
    transport?: EmailTransport;
}

/**
 * Configuración SMTP ya resuelta (parámetros inyectados + defaults de env).
 * Tipo interno aparte de EmailAdapterConfig: con `exactOptionalPropertyTypes` una propiedad
 * opcional (`host?: string`) no admite `undefined` explícito, y aquí "no configurado" es `undefined`.
 */
interface SmtpResuelto {
    host: string | undefined;
    port: number;
    user: string | undefined;
    pass: string | undefined;
    secure: boolean;
}

const sinSaltos = (valor: string): string => valor.replace(/[\r\n]+/g, ' ').trim();

const dominioDe = (correo: string): string => correo.split('@')[1] ?? '(sin-dominio)';

export class EmailNotificationAdapter implements NotificacionPort {
    private readonly from: string;
    private readonly timeoutMs: number;
    private readonly modoMock: boolean;
    private readonly config: SmtpResuelto;
    private transport: EmailTransport | undefined;
    private readonly enviados: CorreoEnviado[] = [];
    private avisoMockEmitido = false;

    constructor(config: EmailAdapterConfig = {}) {
        const nodeEnv = config.nodeEnv ?? env.NODE_ENV;
        this.config = {
            host: (config.host ?? env.SMTP_HOST)?.trim() || undefined,
            port: config.port ?? env.SMTP_PORT,
            user: (config.user ?? env.SMTP_USER)?.trim() || undefined,
            pass: config.pass ?? env.SMTP_PASS,
            secure: config.secure ?? env.SMTP_SECURE,
        };
        this.from = config.from ?? env.SMTP_FROM;
        this.timeoutMs = config.timeoutMs ?? TIMEOUT_MS_DEFAULT;
        this.transport = config.transport;
        this.modoMock = !config.transport && (nodeEnv === 'test' || !this.config.host || !this.config.user);
    }

    // ---------------------------------------------------------------------------
    // API pública
    // ---------------------------------------------------------------------------

    async enviarNotificacion(payload: NotificacionPayload): Promise<boolean> {
        try {
            const html = renderLayout({
                titulo: payload.asunto,
                preheader: payload.asunto,
                contenido: `<h1 style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:22px;color:#F8FAFC;">${escapeHtml(payload.asunto)}</h1>
<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#94A3B8;white-space:pre-line;">${escapeHtml(payload.cuerpo)}</p>`,
            });
            return await this.despachar(payload.destinatario, payload.asunto, html, payload.cuerpo, payload.tipo);
        } catch (error) {
            this.logFallo('Error inesperado al notificar', payload?.tipo, error);
            return false;
        }
    }

    async enviarConfirmacionPedidoWeb(datos: DatosConfirmacionPedidoEmail): Promise<boolean> {
        try {
            const html = renderOrderConfirmationHtml(datos);
            const text = [
                `Gracias por tu compra, ${datos.clienteNombre}.`,
                `Pedido ${datos.referenciaPedido} - ${datos.fechaPedidoBogota}`,
                `Total a pagar: ${formatearCop(datos.totalCop)}`,
                datos.metodoPago === 'TRANSFERENCIA'
                    ? 'Tienes 24 horas para realizar la transferencia y adjuntar tu comprobante.'
                    : 'Pago contra entrega: entrega el valor total en efectivo exacto al transportador.',
            ].join('\n');
            return await this.despachar(
                datos.clienteEmail,
                `Confirmación de tu pedido ${datos.referenciaPedido} - Forma`,
                html,
                text,
                'CONFIRMACION_PEDIDO',
            );
        } catch (error) {
            this.logFallo('Error inesperado al enviar confirmación de pedido', 'CONFIRMACION_PEDIDO', error);
            return false;
        }
    }

    async enviarNotificacionDespacho(datos: DatosDespachoEmail): Promise<boolean> {
        try {
            const html = renderOrderDispatchedHtml(datos);
            const text = [
                `¡Tu pedido ${datos.referenciaPedido} va en camino!`,
                `Transportadora: ${datos.transportadora}`,
                `Guía: ${datos.guiaTransportadora}`,
                datos.enlaceRastreo ? `Rastreo: ${datos.enlaceRastreo}` : '',
            ]
                .filter(Boolean)
                .join('\n');
            return await this.despachar(
                datos.clienteEmail,
                `Tu pedido ${datos.referenciaPedido} va en camino - Forma`,
                html,
                text,
                'PEDIDO_ENVIADO',
            );
        } catch (error) {
            this.logFallo('Error inesperado al enviar notificación de despacho', 'PEDIDO_ENVIADO', error);
            return false;
        }
    }

    /** Correos registrados en modo mock/in-memory (copia defensiva). */
    getEnviados(): CorreoEnviado[] {
        return this.enviados.map((c) => ({ ...c }));
    }

    limpiarEnviados(): void {
        this.enviados.length = 0;
    }

    // ---------------------------------------------------------------------------
    // Internos
    // ---------------------------------------------------------------------------

    private async despachar(
        destinatario: string | undefined,
        asunto: string,
        html: string,
        text: string | undefined,
        tipo: string,
    ): Promise<boolean> {
        const to = destinatario?.trim();
        if (!to || !EMAIL_REGEX.test(to)) {
            console.warn(`${TAG} Notificación omitida: destinatario de correo ausente o inválido`, { tipo });
            return false;
        }
        const subject = sinSaltos(asunto); // evita inyección de cabeceras

        if (this.modoMock) {
            if (!this.avisoMockEmitido && env.NODE_ENV !== 'test') {
                this.avisoMockEmitido = true;
                console.warn(`${TAG} SMTP no configurado: los correos se guardan solo en memoria (modo mock)`);
            }
            this.enviados.push({ to, subject, html, ...(text !== undefined ? { text } : {}) });
            return true;
        }

        try {
            const transport = await this.obtenerTransport();
            await this.conTimeout(
                transport.sendMail({ from: this.from, to, subject, html, ...(text !== undefined ? { text } : {}) }),
            );
            return true;
        } catch (error) {
            this.logFallo('Fallo al enviar correo por SMTP', tipo, error, to);
            return false;
        }
    }

    private async obtenerTransport(): Promise<EmailTransport> {
        if (this.transport) return this.transport;
        const modulo = await import('nodemailer');
        // nodemailer es CommonJS: según el loader, createTransport viene en `default` o en el namespace.
        const lib = (modulo as unknown as { default?: typeof modulo }).default ?? modulo;
        this.transport = lib.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: this.config.user ? { user: this.config.user, pass: this.config.pass ?? '' } : undefined,
            connectionTimeout: this.timeoutMs,
            greetingTimeout: this.timeoutMs,
            socketTimeout: this.timeoutMs,
        }) as unknown as EmailTransport;
        return this.transport;
    }

    private conTimeout<T>(promesa: Promise<T>): Promise<T> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const limite = new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => reject(Object.assign(new Error(`Timeout SMTP tras ${this.timeoutMs} ms`), { name: 'TimeoutError' })),
                this.timeoutMs,
            );
        });
        return Promise.race([promesa, limite]).finally(() => clearTimeout(timer));
    }

    private logFallo(mensaje: string, tipo: string | undefined, error: unknown, to?: string): void {
        const nombre = error instanceof Error ? error.name : 'Error';
        let detalle = error instanceof Error ? error.message : String(error);
        // Nunca exponer credenciales SMTP en logs.
        for (const secreto of [this.config.pass, this.config.user]) {
            if (secreto) detalle = detalle.split(secreto).join('[OCULTO]');
        }
        console.warn(`${TAG} ${mensaje}`, {
            tipo,
            error: nombre,
            detalle,
            ...(to ? { dominioDestino: dominioDe(to) } : {}),
        });
    }
}

export const emailNotificationAdapter = new EmailNotificationAdapter();
export default emailNotificationAdapter;