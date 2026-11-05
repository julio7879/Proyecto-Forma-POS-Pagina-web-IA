import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import nodemailer from 'nodemailer';
import { app } from '../../../app.js';
import { EmailService, formatMoneyCOP } from '../../../shared/infrastructure/email/EmailService.js';

describe('Módulo 13: Notificaciones y Servicio Híbrido de Correo (Alta Costura FORMA)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Utilidad Financiera formatMoneyCOP (RN-GEN-04)', () => {
    it('debe formatear enteros COP sin decimales con símbolo de moneda', () => {
      const resultado = formatMoneyCOP(145000);
      expect(resultado).toContain('145.000');
      expect(resultado).not.toContain(',00');
    });

    it('debe redondear valores si por error entraran con decimales flotantes', () => {
      const resultado = formatMoneyCOP(145000.45);
      expect(resultado).toContain('145.000');
    });
  });

  describe('2. EmailService - Modo Híbrido y Generación de Correo', () => {
    it('debe generar el correo HTML de confirmación de pedido con paleta oficial y desglose financiero', async () => {
      const emailService = EmailService.getInstance();

      const mockSendMail = vi.fn().mockResolvedValue({
        messageId: '<test-message-id-forma-001@forma.com>',
      });

      vi.spyOn(emailService, 'getTransporter').mockResolvedValue({
        sendMail: mockSendMail,
      } as any);

      const datosPedido = {
        codigo: 'PED-2026-849201',
        clienteNombre: 'Camila Echeverri',
        clienteEmail: 'camila@ejemplo.com',
        ciudadDestino: 'Medellín',
        direccionEntrega: 'Cra 43A # 1-50, El Poblado',
        sedeAsignada: 'Sede Poblado (Medellín)',
        metodoPago: 'WOMPI_TARJETA',
        totalCOP: 320000,
        subtotalCOP: 350000,
        descuentoCOP: 30000,
        ivaCOP: 51092,
        items: [
          {
            nombre: 'Vestido Seda Gala',
            talla: 'M',
            color: 'Vinotinto',
            sku: 'VES-SED-01',
            cantidad: 1,
            precioCOP: 350000,
          },
        ],
      };

      const resultado = await emailService.enviarConfirmacionPedidoWeb(datosPedido);

      expect(resultado.ok).toBe(true);
      expect(resultado.messageId).toBe('<test-message-id-forma-001@forma.com>');
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const mailOptions = mockSendMail.mock.calls[0]![0];
      expect(mailOptions.to).toBe('camila@ejemplo.com');
      expect(mailOptions.subject).toContain('PED-2026-849201');
      
      const html = mailOptions.html as string;
      // Validar paleta oficial
      expect(html).toContain('#661521'); // Vinotinto
      expect(html).toContain('#D19650'); // Dorado
      expect(html).toContain('PED-2026-849201');
      expect(html).toContain('RECIBIDO');
      expect(html).toContain('Reserva Blanda');
      expect(html).toContain('Vestido Seda Gala');
      expect(html).toContain('VES-SED-01');
      expect(html).toContain('Sede Poblado (Medellín)');
      expect(html).toContain('/soporte?codigo=PED-2026-849201');
    });

    it('debe implementar NotificacionPort para avisos generales del sistema', async () => {
      const emailService = EmailService.getInstance();
      const mockSendMail = vi.fn().mockResolvedValue({
        messageId: '<alerta-caja-123@forma.com>',
      });

      vi.spyOn(emailService, 'getTransporter').mockResolvedValue({
        sendMail: mockSendMail,
      } as any);

      const ok = await emailService.enviarNotificacion({
        destinatario: 'admin@forma.com',
        asunto: 'Alerta de Descuadre en Sede Unicentro',
        cuerpo: 'Se detectó diferencia superior a $50.000 COP en el cierre ciego.',
        tipo: 'ALERTA_DESCUADRE_CAJA',
      });

      expect(ok).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Endpoint HTTP POST /api/notificaciones/pedido-web', () => {
    it('debe responder 200 OK y despachar el correo de confirmación', async () => {
      const emailService = EmailService.getInstance();
      vi.spyOn(emailService, 'enviarConfirmacionPedidoWeb').mockResolvedValue({
        ok: true,
        mensaje: 'Notificación de correo enviada exitosamente',
        previewUrl: 'https://ethereal.email/message/test-preview-123',
        messageId: 'msg-123',
      });

      const res = await request(app)
        .post('/api/notificaciones/pedido-web')
        .send({
          codigo: 'PED-2026-99012',
          clienteNombre: 'Esteban Morales',
          clienteEmail: 'esteban@forma.com',
          ciudadDestino: 'Bogotá',
          direccionEntrega: 'Calle 85 # 11-53, Chapinero',
          sedeAsignada: 'Bodega Central',
          metodoPago: 'ADDI',
          totalCOP: 180000,
          items: [
            {
              nombre: 'Camisa Lino Cuello Nerú',
              talla: 'L',
              color: 'Blanco Hueso',
              sku: 'CAM-LIN-02',
              cantidad: 1,
              precioCOP: 180000,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensaje).toBe('Notificación de correo enviada exitosamente');
      expect(res.body.previewUrl).toBe('https://ethereal.email/message/test-preview-123');
    });

    it('debe responder 400 Bad Request si faltan campos obligatorios o el email es inválido', async () => {
      const res = await request(app)
        .post('/api/notificaciones/pedido-web')
        .send({
          codigo: 'PED-2026-INVALID',
          clienteEmail: 'correo-no-valido',
          // Faltan nombre, ciudad, items, etc.
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('debe responder 200 OK y enviar correo de bienvenida al registrarse un nuevo cliente', async () => {
      const emailService = EmailService.getInstance();
      vi.spyOn(emailService, 'enviarBienvenidaRegistro').mockResolvedValue({
        ok: true,
        mensaje: 'Correo de bienvenida enviado exitosamente',
        previewUrl: 'https://ethereal.email/message/test-welcome-preview',
        messageId: 'msg-welcome-123',
      });

      const res = await request(app)
        .post('/api/notificaciones/bienvenida')
        .send({
          clienteNombre: 'Valentina Santos',
          clienteEmail: 'valentina@forma.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensaje).toBe('Correo de bienvenida enviado exitosamente');
      expect(res.body.previewUrl).toBe('https://ethereal.email/message/test-welcome-preview');
    });
  });
});
