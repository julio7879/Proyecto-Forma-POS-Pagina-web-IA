import { formatMoneyCOP } from '../email/EmailService.js';
import { AppError } from '../../domain/AppError.js';

export interface TicketItemPOS {
  sku: string;
  nombre: string;
  talla?: string | undefined;
  color?: string | undefined;
  cantidad: number;
  precioUnitarioCop?: number | undefined;
  totalCop: number;
  descuentoCop?: number | undefined;
}

export interface TicketPOSData {
  consecutivo: string;
  nombreTienda?: string | undefined;
  nombreSede?: string | undefined;
  direccionSede?: string | undefined;
  telefonoSede?: string | undefined;
  fechaHora?: string | undefined;
  cajeroNombre?: string | undefined;
  clienteNombre?: string | undefined;
  clienteDocumento?: string | undefined;
  items: TicketItemPOS[];
  subtotalCop?: number | undefined;
  descuentoTotalCop?: number | undefined;
  ivaDiscriminadoCop?: number | undefined;
  totalNetoCop: number;
  metodoPago: string;
  montoRecibidoCop?: number | undefined;
  cambioCop?: number | undefined;
  referenciaTransferencia?: string | undefined;
}

interface TicketAlmacenado {
  ticket: TicketPOSData;
  ticketText: string;
  expiraEn: number; // Timestamp en milisegundos
}

export class TelegramBotService {
  private static instance: TelegramBotService;
  // Almacén en memoria indexado por consecutivo (TTL: 24 horas)
  private ticketsMemoria: Map<string, TicketAlmacenado> = new Map();
  private readonly TTL_24_HORAS = 24 * 60 * 60 * 1000;

  // Mapeo en memoria de teléfono celular (normalizado) a chatId de Telegram
  private telefonosAChatId: Map<string, number> = new Map();

  private pollingActivo: boolean = false;
  private ultimoUpdateId: number = 0;

  private normalizarTelefono(tel: string): string {
    const digitos = tel.replace(/\D/g, '');
    return digitos.slice(-10);
  }

  private constructor() {
    // Limpieza periódica cada hora de tickets expirados
    setInterval(() => {
      this.limpiarTicketsExpirados();
    }, 60 * 60 * 1000).unref();

    // Auto-iniciar polling si el bot token está presente
    this.iniciarPolling();
  }

  public iniciarPolling() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || this.pollingActivo) return;
    this.pollingActivo = true;

    console.log(`🤖 [TelegramBotService] Iniciando escucha en vivo para @${process.env.TELEGRAM_BOT_USERNAME || 'Forma_Venta_Bot'}...`);

    const poll = async () => {
      if (!this.pollingActivo) return;
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.ultimoUpdateId + 1}&timeout=10`;
        const res = await fetch(url);
        const data = (await res.json()) as any;

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.ultimoUpdateId = update.update_id;
            const msg = update.message;

            // Caso 1: El usuario comparte su contacto de celular con el bot
            if (msg && msg.contact && msg.contact.phone_number && msg.chat && msg.chat.id) {
              const telNorm = this.normalizarTelefono(String(msg.contact.phone_number));
              this.telefonosAChatId.set(telNorm, msg.chat.id);
              console.log(`📱 [TelegramBotService] Celular ${telNorm} vinculado a ChatId ${msg.chat.id}`);

              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  text: `✅ *¡Tu celular (${msg.contact.phone_number}) ha sido vinculado exitosamente!*\n\nA partir de ahora, cada vez que compres en boutiques FORMA, solo dile tu número al cajero y te llegará tu recibo aquí automáticamente.`,
                  parse_mode: 'Markdown',
                  reply_markup: { remove_keyboard: true },
                }),
              });
              continue;
            }

            if (msg && msg.text && msg.chat && msg.chat.id) {
              const text = msg.text.trim();
              const chatId = msg.chat.id;

              if (text.startsWith('/start')) {
                const partes = text.split(' ');
                if (partes.length > 1 && partes[1].startsWith('recibo_')) {
                  const consecutivo = partes[1].replace('recibo_', '');
                  const registro = this.obtenerTicket(consecutivo);
                  if (registro) {
                    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: chatId,
                        text: registro.ticketText,
                        parse_mode: 'Markdown',
                      }),
                    });
                  } else {
                    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: chatId,
                        text: `🧾 *FORMA ATELIER*\n\nNo se encontró un recibo activo con la referencia \`${consecutivo}\`. Verifique con su asesor en tienda.`,
                        parse_mode: 'Markdown',
                      }),
                    });
                  }
                } else {
                  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `✨ *Bienvenido a FORMA Atelier & POS* ✨\n\nPuedes presionar el botón abajo para *Vincular tu celular* y recibir tus recibos automáticamente en caja:`,
                      parse_mode: 'Markdown',
                      reply_markup: {
                        keyboard: [
                          [{ text: '📱 Vincular mi número de celular', request_contact: true }],
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true,
                      },
                    }),
                  });
                }
              }
            }
          }
        }
      } catch (err: any) {
        // En caso de corte o timeout, continuar silenciosamente
      }

      if (this.pollingActivo) {
        setTimeout(poll, 1500);
      }
    };

    poll();
  }

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  private normalizarConsecutivo(consecutivo: string): string {
    return consecutivo.replace(/^#/, '').trim().toUpperCase();
  }

  private limpiarTicketsExpirados() {
    const ahora = Date.now();
    for (const [clave, item] of this.ticketsMemoria.entries()) {
      if (item.expiraEn < ahora) {
        this.ticketsMemoria.delete(clave);
      }
    }
  }

  /**
   * Genera el texto del recibo POS formateado con Markdown para Telegram
   */
  public formatearTicketMarkdown(ticket: TicketPOSData): string {
    const sede = ticket.nombreSede || 'Atelier Principal';
    const consecutivo = ticket.consecutivo;
    const fecha = ticket.fechaHora || new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    const cajero = ticket.cajeroNombre || 'Cajero de Turno';
    const cliente = ticket.clienteNombre || 'Consumidor Final';

    const subtotal = ticket.subtotalCop !== undefined
      ? ticket.subtotalCop
      : ticket.items.reduce((acc, it) => acc + it.totalCop, 0);

    const total = ticket.totalNetoCop;
    const descuento = ticket.descuentoTotalCop || 0;
    const iva = ticket.ivaDiscriminadoCop !== undefined
      ? ticket.ivaDiscriminadoCop
      : Math.round(total - Math.round(total / 1.19));

    const lineasItems = ticket.items.map((it) => {
      const desc = it.descuentoCop && it.descuentoCop > 0
        ? ` (Desc: -${formatMoneyCOP(it.descuentoCop)})`
        : '';
      const tallaColor = (it.talla || it.color)
        ? ` [${it.talla || 'U'}/${it.color || 'ST'}]`
        : '';
      return `• ${it.cantidad}x *${it.nombre}*${tallaColor}\n  SKU: \`${it.sku}\` — ${formatMoneyCOP(it.totalCop)}${desc}`;
    }).join('\n');

    let detallePago = `💳 Medio de Pago: *${ticket.metodoPago}*`;
    if (ticket.metodoPago === 'EFECTIVO' && ticket.montoRecibidoCop !== undefined) {
      detallePago += `\n💵 Recibido: ${formatMoneyCOP(ticket.montoRecibidoCop)}`;
      if (ticket.cambioCop !== undefined) {
        detallePago += `\n🔄 Cambio: ${formatMoneyCOP(ticket.cambioCop)}`;
      }
    } else if (ticket.metodoPago === 'TRANSFERENCIA' && ticket.referenciaTransferencia) {
      detallePago += `\n🏦 Ref. Bancaria: \`${ticket.referenciaTransferencia}\``;
    }

    return [
      `🧾 *FORMA — ALTA COSTURA*`,
      `🏛️ Sede: *${sede}*`,
      `🔖 Comprobante: *${consecutivo}*`,
      `📅 Fecha: ${fecha}`,
      `👤 Cajero: ${cajero}`,
      `🛍️ Cliente: ${cliente}`,
      `────────────────────────`,
      `*PRENDAS FACTURADAS:*`,
      lineasItems,
      `────────────────────────`,
      `Subtotal: ${formatMoneyCOP(subtotal)}`,
      descuento > 0 ? `🏷️ Descuento: -${formatMoneyCOP(descuento)}` : '',
      `🏛️ IVA discriminado (19% inc.): ${formatMoneyCOP(iva)}`,
      `*💵 TOTAL: ${formatMoneyCOP(total)} COP*`,
      detallePago,
      `────────────────────────`,
      `✨ _¡Gracias por su compra en FORMA!_`,
      `_Conserve este comprobante para cambios de talla o prenda dentro de 30 días calendario en cualquiera de nuestras tiendas físicas._`,
    ].filter(Boolean).join('\n');
  }

  /**
   * Genera enlaces de Telegram (deep link al bot y enlace directo para compartir)
   */
  public generarEnlaceTelegram(consecutivo: string, ticketText: string) {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'FormaOmniPosBot';
    const consecutivoLimpio = this.normalizarConsecutivo(consecutivo);

    const deepLinkBot = `https://t.me/${botUsername}?start=recibo_${consecutivoLimpio}`;
    const shareUrl = `https://t.me/share/url?url=https://forma.com&text=${encodeURIComponent(ticketText)}`;

    return {
      deepLinkBot,
      shareUrl,
    };
  }

  /**
   * Registra un ticket POS en memoria durante 24 horas y retorna los enlaces de Telegram
   */
  public registrarTicketTemporal(ticket: TicketPOSData) {
    const clave = this.normalizarConsecutivo(ticket.consecutivo);
    const ticketText = this.formatearTicketMarkdown(ticket);
    const expiraEn = Date.now() + this.TTL_24_HORAS;

    this.ticketsMemoria.set(clave, {
      ticket,
      ticketText,
      expiraEn,
    });

    const enlaces = this.generarEnlaceTelegram(ticket.consecutivo, ticketText);

    return {
      consecutivo: ticket.consecutivo,
      consecutivoNormalizado: clave,
      ticketText,
      ...enlaces,
    };
  }

  /**
   * Obtiene un ticket almacenado si aún no ha expirado
   */
  public obtenerTicket(consecutivo: string) {
    const clave = this.normalizarConsecutivo(consecutivo);
    const registro = this.ticketsMemoria.get(clave);

    if (!registro) {
      return null;
    }

    if (registro.expiraEn < Date.now()) {
      this.ticketsMemoria.delete(clave);
      return null;
    }

    return {
      ticket: registro.ticket,
      ticketText: registro.ticketText,
    };
  }

  /**
   * Envía el recibo por Telegram al chatId o número de celular indicado vía Bot API
   */
  public async enviarReciboPorTelegram(chatIdODestino: string, consecutivo: string) {
    const registro = this.obtenerTicket(consecutivo);
    if (!registro) {
      throw AppError.notFound(`No se encontró el recibo ${consecutivo} o ha expirado (válido por 24h).`);
    }

    // Resolver si viene un número de teléfono celular vinculado
    let chatIdFinal = chatIdODestino.trim();
    const soloDigitos = chatIdODestino.replace(/\D/g, '');
    if (soloDigitos.length >= 7 && !chatIdODestino.startsWith('-')) {
      const tel10 = this.normalizarTelefono(soloDigitos);
      const mappedChatId = this.telefonosAChatId.get(tel10);
      if (mappedChatId) {
        chatIdFinal = String(mappedChatId);
        console.log(`📱 [TelegramBotService] Número ${tel10} resuelto a ChatId ${chatIdFinal}`);
      }
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      // Modo Simulado: Entorno local / pruebas sin bot configurado
      console.log(`🤖 [TelegramBotService] (Modo Simulado) Envío de recibo a ChatId: ${chatIdFinal}\n${registro.ticketText}`);
      return {
        ok: true,
        simulado: true,
        mensaje: 'Recibo procesado en modo simulado (TELEGRAM_BOT_TOKEN no configurado en entorno).',
        chatId: chatIdFinal,
        consecutivo,
      };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatIdFinal,
          text: registro.ticketText,
          parse_mode: 'Markdown',
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok || !data.ok) {
        const desc = String(data.description || '');
        if (desc.includes('chat not found')) {
          throw AppError.badRequest(
            `El destinatario (${chatIdODestino}) no ha iniciado @Forma_Venta_Bot todavía. Por privacidad de Telegram, la persona debe abrir el bot al menos una vez para recibir mensajes.`
          );
        }
        throw new Error(desc || 'Error reportado por la API de Telegram');
      }

      return {
        ok: true,
        simulado: false,
        mensaje: 'Recibo enviado por Telegram exitosamente',
        chatId: chatIdFinal,
        messageId: data.result?.message_id,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.error(`❌ [TelegramBotService] Error al contactar API Telegram: ${err.message}`);
      throw AppError.internal(`Fallo al enviar recibo vía Telegram: ${err.message}`);
    }
  }
}
