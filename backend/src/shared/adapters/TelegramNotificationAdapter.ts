import { env } from '../../config/env.js';
import type {
    NotificacionPayload,
    NotificacionPort,
    TipoNotificacion,
} from '../ports/NotificacionPort.js';

/**
 * Adaptador de notificaciones por Telegram (SP4-05, Issue #74).
 *
 * Garantías:
 *  - Fire-and-forget seguro: `enviarNotificacion` NUNCA lanza ni rechaza. Ante token/chat_id
 *    ausentes, error HTTP (400/401/429/500...), timeout o fallo de red, loguea un warning
 *    estructurado y retorna `false`, de modo que no afecta ninguna `$transaction` de negocio.
 *  - Ruteo multicanal por tipo de alerta cuando no hay `destinatario` explícito.
 *  - Privacidad (Ley 1581): todo texto dinámico se escapa para HTML y se enmascaran
 *    JWT, hashes bcrypt y números largos (documentos/cuentas); las claves sensibles de
 *    `datosExtra` jamás se incluyen en el mensaje.
 */

const TAG = '[TelegramAdapter]';
const TELEGRAM_API_BASE = 'https://api.telegram.org';
const TIMEOUT_MS_DEFAULT = 5000;
const TELEGRAM_MAX_LENGTH = 4096;
const TIMEZONE = 'America/Bogota';

export type CanalTelegram = 'OPERACIONES' | 'INVENTARIO' | 'ECOMMERCE';

export interface TelegramAdapterConfig {
    botToken?: string;
    chatIds?: Partial<Record<'operaciones' | 'inventario' | 'ecommerce', string>>;
    timeoutMs?: number;
    /** Reloj inyectable (pruebas). */
    now?: () => Date;
}

const CANAL_POR_TIPO: Partial<Record<TipoNotificacion, CanalTelegram>> = {
    ALERTA_DESCUADRE_CAJA: 'OPERACIONES',
    APERTURA_CIERRE_CAJA: 'OPERACIONES',
    INCIDENCIA_PEDIDO: 'INVENTARIO',
    ALERTA_STOCK_BAJO: 'INVENTARIO',
    NUEVO_PEDIDO_WEB: 'ECOMMERCE',
    RESERVA_VENCIDA_LIBERADA: 'ECOMMERCE',
};

const EMOJI_POR_TIPO: Record<TipoNotificacion, string> = {
    ALERTA_DESCUADRE_CAJA: '🚨',
    INCIDENCIA_PEDIDO: '🚨',
    APERTURA_CIERRE_CAJA: '💰',
    ALERTA_STOCK_BAJO: '📦',
    NUEVO_PEDIDO_WEB: '🛒',
    RESERVA_VENCIDA_LIBERADA: '🛒',
    CONFIRMACION_PEDIDO: '🛒',
    PEDIDO_ENVIADO: '📦',
    RECUPERACION_CLAVE: '🔔',
};

/** Claves de `datosExtra` que nunca deben viajar a Telegram. */
const CLAVE_SENSIBLE =
    /pass|clave|contrase|hash|token|jwt|secret|authorization|cookie|cedula|c[eé]dula|documento|identificacion|identificaci[oó]n|cuenta|tarjeta|card|cvv|iban|bancari/i;

const esClaveSensible = (clave: string): boolean => CLAVE_SENSIBLE.test(clave) || /^nit$/i.test(clave);

const escapeHtml = (valor: string): string =>
    valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Enmascara secretos y datos personales/bancarios que se cuelen en texto libre. */
export const sanitizarTexto = (valor: string): string =>
    valor
        // JWT (header.payload.signature en base64url)
        .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]*/g, '[JWT-OCULTO]')
        // Hashes bcrypt / argon2
        .replace(/\$(?:2[abxy]|argon2\w*)\$[^\s]+/g, '[HASH-OCULTO]')
        // Números largos aislados (documentos, cuentas, tarjetas): se conservan solo los 4 últimos
        .replace(/(?<![\w-])\d{7,}(?![\w-])/g, (m) => `***${m.slice(-4)}`);

const formatearCop = (monto: number): string => {
    const entero = Number.isFinite(monto) ? Math.round(Math.abs(monto)) : 0;
    return `$${String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;
};

const formatearFechaColombia = (fecha: Date): string =>
    `${new Intl.DateTimeFormat('es-CO', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(fecha)} (hora Colombia)`;

const limpiar = (valor: string | undefined): string | undefined => {
    const v = valor?.trim();
    return v ? v : undefined;
};

export class TelegramNotificationAdapter implements NotificacionPort {
    private readonly botToken: string | undefined;
    private readonly chatIds: Record<CanalTelegram, string | undefined>;
    private readonly timeoutMs: number;
    private readonly now: () => Date;

    constructor(config: TelegramAdapterConfig = {}) {
        this.botToken = limpiar(config.botToken ?? env.TELEGRAM_BOT_TOKEN);
        this.chatIds = {
            OPERACIONES: limpiar(config.chatIds?.operaciones ?? env.TELEGRAM_CHAT_ID_OPERACIONES),
            INVENTARIO: limpiar(config.chatIds?.inventario ?? env.TELEGRAM_CHAT_ID_INVENTARIO),
            ECOMMERCE: limpiar(config.chatIds?.ecommerce ?? env.TELEGRAM_CHAT_ID_ECOMMERCE),
        };
        this.timeoutMs = config.timeoutMs ?? TIMEOUT_MS_DEFAULT;
        this.now = config.now ?? (() => new Date());
    }

    async enviarNotificacion(payload: NotificacionPayload): Promise<boolean> {
        try {
            const chatId = this.resolverChatId(payload);
            if (!this.botToken || !chatId) {
                console.warn('[TelegramAdapter] Notificación omitida: falta token o chat_id', {
                    tipo: payload?.tipo,
                });
                return false;
            }
            return await this.enviar(this.botToken, chatId, payload);
        } catch (error) {
            // Red de seguridad final: ningún fallo puede propagarse al flujo de negocio.
            this.logFallo('Error inesperado al notificar', payload?.tipo, error);
            return false;
        }
    }

    // ---------------------------------------------------------------------------
    // Métodos de conveniencia
    // ---------------------------------------------------------------------------

    notificarDescuadreCaja(datos: {
        ubicacionNombre: string;
        cajeroNombre: string;
        tipoDescuadre: 'SOBRANTE' | 'FALTANTE';
        montoCop: number;
        observacion?: string;
    }): Promise<boolean> {
        const lineas = [
            `Sede: ${datos.ubicacionNombre}`,
            `Cajero: ${datos.cajeroNombre}`,
            `Tipo: ${datos.tipoDescuadre}`,
            `Monto: ${formatearCop(datos.montoCop)}`,
        ];
        if (datos.observacion) lineas.push(`Observación: ${datos.observacion}`);
        return this.enviarNotificacion({
            tipo: 'ALERTA_DESCUADRE_CAJA',
            asunto: `Descuadre de caja (${datos.tipoDescuadre})`,
            cuerpo: lineas.join('\n'),
        });
    }

    notificarIncidenciaDespacho(datos: {
        pedidoCodigo: string;
        tiendaOrigenNombre: string;
        motivo: string;
        pasoACustodiaCentral: boolean;
    }): Promise<boolean> {
        const lineas = [
            `Pedido: ${datos.pedidoCodigo}`,
            `Tienda: ${datos.tiendaOrigenNombre}`,
            `Motivo: ${datos.motivo}`,
        ];
        if (datos.pasoACustodiaCentral) {
            lineas.push('Asignación forzosa en custodia a Bodega Central (incidencia de stock).');
        }
        return this.enviarNotificacion({
            tipo: 'INCIDENCIA_PEDIDO',
            asunto: 'No puedo despachar',
            cuerpo: lineas.join('\n'),
        });
    }

    notificarNuevoPedidoWeb(datos: {
        pedidoCodigo: string;
        totalCop: number;
        ciudadDestino: string;
        tiendaAsignadaNombre: string;
    }): Promise<boolean> {
        return this.enviarNotificacion({
            tipo: 'NUEVO_PEDIDO_WEB',
            asunto: 'Nuevo pedido web',
            cuerpo: [
                `Pedido: ${datos.pedidoCodigo}`,
                `Total: ${formatearCop(datos.totalCop)}`,
                `Ciudad destino: ${datos.ciudadDestino}`,
                `Tienda asignada: ${datos.tiendaAsignadaNombre}`,
            ].join('\n'),
        });
    }

    notificarReservaVencida(datos: {
        pedidoCodigo: string;
        unidadesLiberadas: number;
        minutosExpirados: number;
    }): Promise<boolean> {
        return this.enviarNotificacion({
            tipo: 'RESERVA_VENCIDA_LIBERADA',
            asunto: 'Reserva vencida y liberada',
            cuerpo: [
                `Pedido: ${datos.pedidoCodigo}`,
                `Unidades liberadas: ${datos.unidadesLiberadas}`,
                `Minutos de expiración: ${datos.minutosExpirados}`,
            ].join('\n'),
        });
    }

    // ---------------------------------------------------------------------------
    // Internos
    // ---------------------------------------------------------------------------

    private resolverChatId(payload: NotificacionPayload): string | undefined {
        const explicito = limpiar(payload.destinatario);
        if (explicito) return explicito;
        const canal = CANAL_POR_TIPO[payload.tipo];
        return canal ? this.chatIds[canal] : undefined;
    }

    private formatearMensaje(payload: NotificacionPayload): string {
        const emoji = EMOJI_POR_TIPO[payload.tipo] ?? '🔔';
        const partes = [
            `${emoji} <b>${escapeHtml(sanitizarTexto(payload.asunto))}</b>`,
            `🕒 ${escapeHtml(formatearFechaColombia(this.now()))}`,
            '',
            escapeHtml(sanitizarTexto(payload.cuerpo)),
        ];

        if (payload.datosExtra) {
            const extras = Object.entries(payload.datosExtra)
                .filter(([clave, valor]) => !esClaveSensible(clave) && valor !== undefined && valor !== null)
                .filter(([, valor]) => typeof valor !== 'object')
                .map(
                    ([clave, valor]) =>
                        `• ${escapeHtml(sanitizarTexto(clave))}: ${escapeHtml(sanitizarTexto(String(valor)))}`,
                );
            if (extras.length > 0) partes.push('', ...extras);
        }

        const texto = partes.join('\n');
        return texto.length > TELEGRAM_MAX_LENGTH
            ? `${texto.slice(0, TELEGRAM_MAX_LENGTH - 1)}…`
            : texto;
    }

    private async enviar(botToken: string, chatId: string, payload: NotificacionPayload): Promise<boolean> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: this.formatearMensaje(payload),
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                console.warn(`${TAG} Telegram respondió con error HTTP`, {
                    tipo: payload.tipo,
                    status: response.status,
                });
                return false;
            }
            return true;
        } catch (error) {
            this.logFallo('Fallo de red o timeout al llamar a Telegram', payload.tipo, error);
            return false;
        } finally {
            clearTimeout(timer);
        }
    }

    private logFallo(mensaje: string, tipo: TipoNotificacion | undefined, error: unknown): void {
        const nombre = error instanceof Error ? error.name : 'Error';
        let detalle = error instanceof Error ? error.message : String(error);
        // El token viaja en la URL: jamás debe aparecer en logs.
        if (this.botToken) detalle = detalle.split(this.botToken).join('[TOKEN-OCULTO]');
        console.warn(`${TAG} ${mensaje}`, { tipo, error: nombre, detalle });
    }
}

export const telegramNotificationAdapter = new TelegramNotificationAdapter();
export default telegramNotificationAdapter;