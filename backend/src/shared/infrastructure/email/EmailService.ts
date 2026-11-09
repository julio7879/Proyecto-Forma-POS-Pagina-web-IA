import nodemailer, { type Transporter } from 'nodemailer';
import type { NotificacionPort, NotificacionPayload } from '../../ports/NotificacionPort.js';

export interface ItemPedidoEmail {
  nombre: string;
  talla?: string | undefined;
  color?: string | undefined;
  sku: string;
  cantidad: number;
  precioCOP: number;
}

export interface PedidoConfirmacionEmailDTO {
  codigo: string;
  clienteNombre: string;
  clienteEmail: string;
  ciudadDestino: string;
  direccionEntrega: string;
  sedeAsignada: string;
  metodoPago: string;
  totalCOP: number;
  subtotalCOP?: number | undefined;
  descuentoCOP?: number | undefined;
  ivaCOP?: number | undefined;
  items: ItemPedidoEmail[];
}

export interface RegistroBienvenidaEmailDTO {
  clienteNombre: string;
  clienteEmail: string;
}

export interface PedidoEstadoActualizadoEmailDTO {
  codigo: string;
  clienteNombre: string;
  clienteEmail: string;
  nuevoEstado: string;
  nuevoEstadoTexto: string;
  descripcionEstado?: string | undefined;
  sedeAsignada?: string | undefined;
  guiaTransportadora?: string | undefined;
  transportadora?: string | undefined;
}

export interface ResultadoEnvioEmail {
  ok: boolean;
  mensaje: string;
  messageId?: string | undefined;
  previewUrl: string | null;
}

/**
 * Formatea valores monetarios en Pesos Colombianos Enteros (RN-GEN-04)
 */
export function formatMoneyCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount));
}

export class EmailService implements NotificacionPort {
  private static instance: EmailService;
  private transporter: Transporter | null = null;
  private testAccountInitialized = false;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Obtiene o inicializa el transporte de correo según las variables de entorno (Modo Híbrido).
   */
  public async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
    if (isTestEnv) {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return this.transporter;
    }

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log(`📧 [EmailService] Conectado a transporte SMTP real (${host || 'smtp.gmail.com'}:${port})`);
      return this.transporter;
    }

    // Modo Híbrido: Ethereal Email para entornos de desarrollo / staging sin credenciales privadas
    try {
      if (!this.testAccountInitialized) {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.testAccountInitialized = true;
        console.log(`📧 [EmailService] Modo de prueba activo. Cuenta Ethereal creada: ${testAccount.user}`);
      }
    } catch (err: any) {
      // Fallback local en caso de ausencia de conexión a internet durante pruebas unitarias
      console.warn(`⚠️ [EmailService] No se pudo conectar con Ethereal (${err.message}). Usando transporte simulado en memoria.`);
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    return this.transporter!;
  }

  /**
   * Implementación de NotificacionPort para avisos generales del sistema
   */
  async enviarNotificacion(payload: NotificacionPayload): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const from = process.env.EMAIL_FROM || '"FORMA Alta Costura" <notificaciones@forma.com>';

      const info = await transporter.sendMail({
        from,
        to: payload.destinatario,
        subject: `[FORMA] ${payload.asunto}`,
        text: payload.cuerpo,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FAF7F2; border-radius: 12px; border: 1px solid #E7DED2;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #661521; margin: 0; font-size: 24px; letter-spacing: 2px;">F O R M A</h1>
              <p style="color: #D19650; font-size: 11px; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 1px;">Alta Costura Colombiana</p>
            </div>
            <div style="background: #FFFFFF; padding: 20px; border-radius: 8px; border: 1px solid #E7DED2;">
              <h3 style="color: #661521; margin-top: 0;">${payload.asunto}</h3>
              <p style="color: #333333; line-height: 1.6; white-space: pre-line;">${payload.cuerpo}</p>
            </div>
          </div>
        `,
      });

      let previewUrl: string | false = false;
      try {
        previewUrl = nodemailer.getTestMessageUrl(info);
      } catch {
        previewUrl = false;
      }

      if (previewUrl) {
        console.log(`📧 [EmailService] Notificación enviada. Vista previa: ${previewUrl}`);
      }

      return true;
    } catch (err: any) {
      console.error(`❌ [EmailService] Error al enviar notificación: ${err.message}`);
      return false;
    }
  }

  /**
   * Enviar correo con diseño de alta costura al confirmar un pedido web
   */
  async enviarConfirmacionPedidoWeb(datos: PedidoConfirmacionEmailDTO): Promise<ResultadoEnvioEmail> {
    const transporter = await this.getTransporter();
    const from = process.env.EMAIL_FROM || '"FORMA Alta Costura" <pedidos@forma.com>';
    const baseUrl = process.env.STOREFRONT_URL || 'http://localhost:5173';
    const trackingUrl = `${baseUrl}/rastreo?codigo=${encodeURIComponent(datos.codigo)}`;

    // Cálculo y validación de desglose financiero en COP entero (RN-GEN-04)
    const total = Math.round(datos.totalCOP);
    const subtotal = datos.subtotalCOP !== undefined
      ? Math.round(datos.subtotalCOP)
      : datos.items.reduce((acc, it) => acc + Math.round(it.cantidad * it.precioCOP), 0);
    const descuento = datos.descuentoCOP !== undefined
      ? Math.round(datos.descuentoCOP)
      : Math.max(0, subtotal - total);
    
    // IVA 19% incluido en prendas colombianas (Base gravable = Total / 1.19)
    const ivaCalculado = Math.round(total - Math.round(total / 1.19));
    const ivaFinal = datos.ivaCOP !== undefined ? Math.round(datos.ivaCOP) : ivaCalculado;

    const filasItemsHtml = datos.items.map((item) => `
      <tr style="border-bottom: 1px solid #E7DED2;">
        <td style="padding: 12px 8px; text-align: left;">
          <strong style="color: #171717; font-size: 13px;">${item.nombre}</strong><br />
          <span style="color: #666666; font-size: 11px;">
            ${item.talla ? `Talla: <strong>${item.talla}</strong> | ` : ''}
            ${item.color ? `Color: <strong>${item.color}</strong> | ` : ''}
            SKU: <span style="font-family: monospace;">${item.sku}</span>
          </span>
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #171717; font-size: 13px; font-weight: 600;">
          ${item.cantidad}
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #171717; font-size: 13px;">
          ${formatMoneyCOP(item.precioCOP)}
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #661521; font-size: 13px; font-weight: bold;">
          ${formatMoneyCOP(item.cantidad * item.precioCOP)}
        </td>
      </tr>
    `).join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirmación de Pedido ${datos.codigo} - FORMA</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F7F4EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4EE; padding: 32px 12px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E7DED2; box-shadow: 0 10px 25px rgba(102, 21, 33, 0.06);">
                
                <!-- Encabezado Alta Costura FORMA -->
                <tr>
                  <td style="background-color: #661521; padding: 36px 24px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 30px; letter-spacing: 5px; font-weight: 700;">F O R M A</h1>
                    <p style="color: #D19650; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600;">
                      Atelier & Prêt-à-Porter Multisede
                    </p>
                  </td>
                </tr>

                <!-- Franja de Estado del Pedido -->
                <tr>
                  <td style="background-color: #FAF6EF; padding: 18px 24px; border-bottom: 1px solid #E7DED2; text-align: center;">
                    <span style="display: inline-block; background-color: #661521; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                      Estado: RECIBIDO
                    </span>
                    <p style="margin: 8px 0 0 0; color: #661521; font-size: 13px; font-weight: 600;">
                      ¡Tu reserva de inventario ha sido asegurada con éxito en nuestro Kardex!
                    </p>
                    <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 11px; line-height: 1.4;">
                      Tus prendas se encuentran protegidas bajo <strong>Reserva Blanda</strong> mientras nuestro equipo alista y empaca tu orden.
                    </p>
                  </td>
                </tr>

                <!-- Saludo y Código -->
                <tr>
                  <td style="padding: 28px 28px 16px 28px;">
                    <h2 style="color: #171717; margin: 0 0 8px 0; font-size: 20px;">
                      Estimado/a ${datos.clienteNombre},
                    </h2>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0;">
                      Agradecemos tu preferencia por la moda colombiana de autor. Hemos recibido y procesado satisfactoriamente tu pedido en nuestra plataforma omnicanal.
                    </p>

                    <!-- Caja Destacada de Código -->
                    <div style="margin: 20px 0; padding: 16px; background-color: #FDFBF8; border: 1.5px dashed #D19650; border-radius: 10px; text-align: center;">
                      <span style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Código Único de Pedido</span>
                      <strong style="color: #661521; font-size: 22px; font-family: monospace; letter-spacing: 2px;">
                        ${datos.codigo}
                      </strong>
                    </div>
                  </td>
                </tr>

                <!-- Tabla de Prendas -->
                <tr>
                  <td style="padding: 0 28px;">
                    <h3 style="color: #661521; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 10px 0; border-bottom: 2px solid #661521; padding-bottom: 6px;">
                      Detalle de Prendas Adquiridas
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #F8F5EE; color: #661521; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          <th style="padding: 8px; text-align: left;">Prenda</th>
                          <th style="padding: 8px; text-align: center;">Cant.</th>
                          <th style="padding: 8px; text-align: right;">Unitario</th>
                          <th style="padding: 8px; text-align: right;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filasItemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Resumen Financiero en COP -->
                <tr>
                  <td style="padding: 20px 28px;">
                    <table width="100%" cellpadding="4" cellspacing="0" style="color: #374151; font-size: 13px;">
                      <tr>
                        <td style="text-align: right; width: 70%; padding: 4px 8px;">Subtotal Bruto:</td>
                        <td style="text-align: right; width: 30%; padding: 4px 8px; font-weight: 500;">
                          ${formatMoneyCOP(subtotal)}
                        </td>
                      </tr>
                      ${descuento > 0 ? `
                        <tr>
                          <td style="text-align: right; color: #B91C1C; padding: 4px 8px;">Descuentos Aplicados:</td>
                          <td style="text-align: right; color: #B91C1C; font-weight: 600; padding: 4px 8px;">
                            -${formatMoneyCOP(descuento)}
                          </td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="text-align: right; color: #6B7280; font-size: 11px; padding: 4px 8px;">
                          IVA discriminado (19% incluido):
                        </td>
                        <td style="text-align: right; color: #6B7280; font-size: 11px; padding: 4px 8px;">
                          ${formatMoneyCOP(ivaFinal)}
                        </td>
                      </tr>
                      <tr style="border-top: 2px solid #E7DED2;">
                        <td style="text-align: right; font-size: 16px; font-weight: 700; color: #661521; padding: 12px 8px 4px 8px;">
                          TOTAL A PAGAR:
                        </td>
                        <td style="text-align: right; font-size: 18px; font-weight: 800; color: #661521; padding: 12px 8px 4px 8px;">
                          ${formatMoneyCOP(total)} COP
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Información de Envío y Despacho Multisede -->
                <tr>
                  <td style="padding: 0 28px 24px 28px;">
                    <div style="background-color: #FBF9F5; border: 1px solid #E7DED2; border-radius: 10px; padding: 16px;">
                      <h4 style="margin: 0 0 10px 0; color: #661521; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        Logística y Despacho Multisede
                      </h4>
                      <table width="100%" cellpadding="2" cellspacing="0" style="font-size: 12px; color: #4B5563;">
                        <tr>
                          <td style="width: 40%; font-weight: 600;">Sede de Asignación:</td>
                          <td style="width: 60%; color: #171717;">${datos.sedeAsignada}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Dirección de Entrega:</td>
                          <td style="color: #171717;">${datos.direccionEntrega}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Ciudad de Destino:</td>
                          <td style="color: #171717;">${datos.ciudadDestino}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Método de Pago:</td>
                          <td style="color: #171717;">${datos.metodoPago}</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Botón CTA de Rastreo en Tiempo Real -->
                <tr>
                  <td style="padding: 8px 28px 32px 28px; text-align: center;">
                    <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #661521; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px; border: 1.5px solid #D19650; box-shadow: 0 4px 12px rgba(102, 21, 33, 0.25);">
                      Rastrear Pedido en Tiempo Real &rarr;
                    </a>
                    <p style="margin: 12px 0 0 0; font-size: 11px; color: #9CA3AF;">
                      O consulta directamente en: <a href="${trackingUrl}" style="color: #D19650;">${trackingUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Pie de Página Institucional -->
                <tr>
                  <td style="background-color: #1A1A1A; padding: 24px; text-align: center; color: #9CA3AF; font-size: 11px; line-height: 1.5;">
                    <strong style="color: #E7DED2; letter-spacing: 1.5px;">FORMA S.A.S. — ALTA COSTURA</strong><br />
                    Medellín · Bogotá · Cali · Barranquilla · Colombia<br />
                    Garantía legal de 30 días calendario para cambios en tiendas físicas.<br />
                    © ${new Date().getFullYear()} FORMA. Todos los derechos reservados.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from,
      to: datos.clienteEmail,
      subject: `Confirmación de Pedido ${datos.codigo} - FORMA Alta Costura`,
      html: htmlBody,
    });

    let previewUrl: string | null = null;
    try {
      const etherealUrl = nodemailer.getTestMessageUrl(info);
      if (etherealUrl) {
        previewUrl = etherealUrl;
        console.log(`📧 [EmailService] Vista previa Ethereal para pedido ${datos.codigo}: ${previewUrl}`);
      }
    } catch {
      previewUrl = null;
    }

    return {
      ok: true,
      mensaje: 'Notificación de correo enviada exitosamente',
      messageId: info.messageId,
      previewUrl,
    };
  }

  /**
   * Enviar correo con diseño de alta costura al registrarse una nueva cuenta cliente
   */
  async enviarBienvenidaRegistro(datos: RegistroBienvenidaEmailDTO): Promise<ResultadoEnvioEmail> {
    const transporter = await this.getTransporter();
    const from = process.env.EMAIL_FROM || '"FORMA Alta Costura" <bienvenida@forma.com>';
    const baseUrl = process.env.STOREFRONT_URL || 'http://localhost:5173';
    const catalogoUrl = `${baseUrl}/#catalogo-grid`;
    const cuentaUrl = `${baseUrl}/cuenta`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bienvenido a FORMA Alta Costura</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F7F4EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4EE; padding: 32px 12px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E7DED2; box-shadow: 0 10px 25px rgba(102, 21, 33, 0.06);">
                
                <!-- Encabezado Alta Costura FORMA -->
                <tr>
                  <td style="background-color: #661521; padding: 36px 24px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 30px; letter-spacing: 5px; font-weight: 700;">F O R M A</h1>
                    <p style="color: #D19650; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600;">
                      Atelier & Prêt-à-Porter Colombiano
                    </p>
                  </td>
                </tr>

                <!-- Franja de Bienvenida -->
                <tr>
                  <td style="background-color: #FAF6EF; padding: 18px 24px; border-bottom: 1px solid #E7DED2; text-align: center;">
                    <span style="display: inline-block; background-color: #D19650; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                      Membresía Oficial Activada
                    </span>
                    <p style="margin: 8px 0 0 0; color: #661521; font-size: 14px; font-weight: 700;">
                      ¡Bienvenido/a a la casa de alta costura FORMA!
                    </p>
                  </td>
                </tr>

                <!-- Mensaje Principal -->
                <tr>
                  <td style="padding: 28px 28px 16px 28px;">
                    <h2 style="color: #171717; margin: 0 0 12px 0; font-size: 20px;">
                      Hola ${datos.clienteNombre},
                    </h2>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                      Es un placer darte la bienvenida a nuestra boutique omnicanal. Tu cuenta con el correo <strong style="color: #661521;">${datos.clienteEmail}</strong> ha sido verificada y registrada exitosamente en nuestra plataforma oficial.
                    </p>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      A partir de este momento tienes acceso exclusivo a nuestras colecciones de autor, despacho prioritario a nivel nacional y trazabilidad oficial de cada orden en tiempo real.
                    </p>

                    <!-- Beneficios Destacados -->
                    <div style="background-color: #FBF9F5; border: 1px solid #E7DED2; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                      <h4 style="margin: 0 0 12px 0; color: #661521; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        Tus Privilegios como Miembro FORMA:
                      </h4>
                      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #374151;">
                        <tr>
                          <td style="width: 28px; vertical-align: top; color: #D19650; font-size: 16px;">✦</td>
                          <td><strong>Prendas 100% de Autor:</strong> Fibras orgánicas colombianas con trazabilidad artesanal de origen.</td>
                        </tr>
                        <tr>
                          <td style="width: 28px; vertical-align: top; color: #D19650; font-size: 16px;">✦</td>
                          <td><strong>Despacho Multisede:</strong> Envíos con cobertura DANE desde nuestras boutiques en Cúcuta, Bucaramanga y Ocaña.</td>
                        </tr>
                        <tr>
                          <td style="width: 28px; vertical-align: top; color: #D19650; font-size: 16px;">✦</td>
                          <td><strong>Protección al Consumidor:</strong> 5 días de retracto web y 30 días de garantía conforme a la Ley 1480.</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Botones de Acción -->
                    <div style="text-align: center; padding: 8px 0 16px 0;">
                      <a href="${catalogoUrl}" target="_blank" style="display: inline-block; background-color: #661521; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px; border: 1.5px solid #D19650; box-shadow: 0 4px 12px rgba(102, 21, 33, 0.25); margin: 6px;">
                        Explorar Colección &rarr;
                      </a>
                      <a href="${cuentaUrl}" target="_blank" style="display: inline-block; background-color: #FFFFFF; color: #50322A; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 50px; border: 1px solid #D19650; margin: 6px;">
                        Ver Mi Cuenta
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Pie de Página Institucional -->
                <tr>
                  <td style="background-color: #1A1A1A; padding: 24px; text-align: center; color: #9CA3AF; font-size: 11px; line-height: 1.5;">
                    <strong style="color: #E7DED2; letter-spacing: 1.5px;">FORMA S.A.S. — ALTA COSTURA</strong><br />
                    Boutiques Físicas en Cúcuta (Centro y Caobos) · Bucaramanga · Ocaña<br />
                    Atención al cliente: soporte@forma.com<br />
                    © ${new Date().getFullYear()} FORMA. Todos los derechos reservados.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from,
      to: datos.clienteEmail,
      subject: `¡Bienvenido a FORMA Alta Costura! - Confirmación de Cuenta`,
      html: htmlBody,
    });

    let previewUrl: string | null = null;
    try {
      const etherealUrl = nodemailer.getTestMessageUrl(info);
      if (etherealUrl) {
        previewUrl = etherealUrl;
        console.log(`📧 [EmailService] Vista previa Ethereal para bienvenida ${datos.clienteEmail}: ${previewUrl}`);
      }
    } catch {
      previewUrl = null;
    }

    return {
      ok: true,
      mensaje: 'Correo de bienvenida enviado exitosamente',
      messageId: info.messageId,
      previewUrl,
    };
  }

  /**
   * Notificación por correo de cambio de estado de pedido web en alta costura
   */
  async enviarActualizacionEstadoPedido(
    datos: PedidoEstadoActualizadoEmailDTO
  ): Promise<ResultadoEnvioEmail> {
    const transporter = await this.getTransporter();
    const from = process.env.EMAIL_FROM || '"Tienda FORMA" <julioveg567@gmail.com>';
    const baseUrl = process.env.STOREFRONT_URL || 'http://localhost:5173';
    const rastreoUrl = `${baseUrl}/rastreo?codigo=${encodeURIComponent(datos.codigo)}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Actualización de Pedido #${datos.codigo} - Tienda FORMA</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F7F4EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4EE; padding: 32px 12px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E7DED2; box-shadow: 0 10px 25px rgba(102, 21, 33, 0.06);">
                
                <!-- Encabezado Alta Costura FORMA -->
                <tr>
                  <td style="background-color: #661521; padding: 36px 24px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 700;">T I E N D A   F O R M A</h1>
                    <p style="color: #D19650; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600;">
                      Actualización Oficial de Pedido
                    </p>
                  </td>
                </tr>

                <!-- Contenido Principal -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <div style="background-color: #FDF9F5; border-left: 4px solid #D19650; padding: 18px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #855829; font-weight: 700;">Novedad de Despacho</span>
                      <h2 style="margin: 4px 0 0 0; font-size: 18px; color: #50322A; font-weight: 700;">
                        Tu pedido #${datos.codigo} ahora está: <span style="color: #661521;">${datos.nuevoEstadoTexto}</span>
                      </h2>
                    </div>

                    <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 16px 0;">
                      Estimado(a) <strong>${datos.clienteNombre}</strong>,
                    </p>
                    <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0 0 20px 0;">
                      ${datos.descripcionEstado || 'Te notificamos que tu pedido ha avanzado satisfactoriamente en nuestro flujo de preparación y logística.'}
                    </p>

                    <!-- Tarjeta de Detalles del Despacho -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAFAF9; border-radius: 12px; padding: 16px; margin-bottom: 28px; border: 1px solid #E7DED2;">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #6B7280;">Sede de Alistamiento:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #1F2937; font-weight: 600; text-align: right;">${datos.sedeAsignada || 'Punto Centro (Cúcuta)'}</td>
                      </tr>
                      ${datos.transportadora ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #6B7280;">Transportadora:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #1F2937; font-weight: 600; text-align: right;">${datos.transportadora}</td>
                      </tr>` : ''}
                      ${datos.guiaTransportadora ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #6B7280;">Número de Guía:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #661521; font-weight: 700; font-family: monospace; text-align: right;">${datos.guiaTransportadora}</td>
                      </tr>` : ''}
                    </table>

                    <!-- Botón de Trazabilidad -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${rastreoUrl}" style="background-color: #661521; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; letter-spacing: 1px; display: inline-block;">
                        Ver Trazabilidad en Tiempo Real
                      </a>
                    </div>

                    <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 24px 0 0 0;">
                      Puedes consultar en cualquier momento el estado de tu pedido ingresando a la sección <a href="${rastreoUrl}" style="color: #D19650; text-decoration: underline;">Mi Cuenta / Trazabilidad</a>.
                    </p>
                  </td>
                </tr>

                <!-- Pie de Página Institucional -->
                <tr>
                  <td style="background-color: #1A1A1A; padding: 24px; text-align: center; color: #9CA3AF; font-size: 11px; line-height: 1.5;">
                    <strong style="color: #E7DED2; letter-spacing: 1.5px;">FORMA S.A.S. — TIENDA OFICIAL</strong><br />
                    Atención al cliente: soporte@forma.com<br />
                    © ${new Date().getFullYear()} FORMA. Todos los derechos reservados.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from,
      to: datos.clienteEmail,
      subject: `Actualización de Pedido #${datos.codigo}: ${datos.nuevoEstadoTexto} - Tienda FORMA`,
      html: htmlBody,
    });

    let previewUrl: string | null = null;
    try {
      const etherealUrl = nodemailer.getTestMessageUrl(info);
      if (etherealUrl) {
        previewUrl = etherealUrl;
      }
    } catch {
      previewUrl = null;
    }

    return {
      ok: true,
      mensaje: 'Notificación de cambio de estado enviada exitosamente',
      messageId: info.messageId,
      previewUrl,
    };
  }
}
