import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { TelegramBotService } from '../../../shared/infrastructure/telegram/TelegramBotService.js';

describe('Módulo 14: Servicio y Bot de Telegram para Recibos POS', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const ticketEjemplo = {
    consecutivo: '#MED-0042',
    nombreTienda: 'FORMA S.A.S.',
    nombreSede: 'Sede El Poblado',
    cajeroNombre: 'Juan Cajero',
    clienteNombre: 'Valentina Duque',
    items: [
      {
        sku: 'BLU-SEDA-01',
        nombre: 'Blusa Seda Carmín',
        talla: 'S',
        color: 'Rojo Carmín',
        cantidad: 2,
        totalCop: 220000,
        descuentoCop: 20000,
      },
    ],
    subtotalCop: 240000,
    descuentoTotalCop: 20000,
    ivaDiscriminadoCop: 35126,
    totalNetoCop: 220000,
    metodoPago: 'EFECTIVO',
    montoRecibidoCop: 250000,
    cambioCop: 30000,
  };

  describe('1. TelegramBotService - Registro en Memoria y Formateo Markdown', () => {
    it('debe registrar un ticket y generar deepLinkBot y shareUrl limpios', () => {
      const telegramService = TelegramBotService.getInstance();
      const resultado = telegramService.registrarTicketTemporal(ticketEjemplo);

      expect(resultado.consecutivo).toBe('#MED-0042');
      expect(resultado.consecutivoNormalizado).toBe('MED-0042');
      expect(resultado.deepLinkBot).toContain('recibo_MED-0042');
      expect(resultado.shareUrl).toContain('https://t.me/share/url');
      expect(resultado.ticketText).toContain('FORMA — ALTA COSTURA');
      expect(resultado.ticketText).toContain('Sede El Poblado');
      expect(resultado.ticketText).toContain('MED-0042');
      expect(resultado.ticketText).toContain('Blusa Seda Carmín');
      expect(resultado.ticketText).toContain('BLU-SEDA-01');
      expect(resultado.ticketText).toContain('TOTAL:');
    });

    it('debe permitir recuperar el ticket almacenado sin el prefijo numeral (#)', () => {
      const telegramService = TelegramBotService.getInstance();
      telegramService.registrarTicketTemporal(ticketEjemplo);

      const recuperadoConHash = telegramService.obtenerTicket('#MED-0042');
      const recuperadoSinHash = telegramService.obtenerTicket('MED-0042');

      expect(recuperadoConHash).not.toBeNull();
      expect(recuperadoSinHash).not.toBeNull();
      expect(recuperadoConHash?.ticket.consecutivo).toBe('#MED-0042');
    });

    it('debe retornar null al consultar un consecutivo inexistente', () => {
      const telegramService = TelegramBotService.getInstance();
      const noExiste = telegramService.obtenerTicket('CONSEC-INEXISTENTE-999');
      expect(noExiste).toBeNull();
    });
  });

  describe('2. TelegramBotService - Envío vía Bot API', () => {
    it('debe operar en modo simulado si TELEGRAM_BOT_TOKEN no está presente', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const telegramService = TelegramBotService.getInstance();
      telegramService.registrarTicketTemporal(ticketEjemplo);

      const resultado = await telegramService.enviarReciboPorTelegram('123456789', 'MED-0042');
      expect(resultado.ok).toBe(true);
      expect(resultado.simulado).toBe(true);
    });

    it('debe llamar a la API de Telegram vía fetch si TELEGRAM_BOT_TOKEN está configurado', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token-secret-123';
      const telegramService = TelegramBotService.getInstance();
      telegramService.registrarTicketTemporal(ticketEjemplo);

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 88442 } }),
      } as any);

      const resultado = await telegramService.enviarReciboPorTelegram('987654321', 'MED-0042');

      expect(resultado.ok).toBe(true);
      expect(resultado.simulado).toBe(false);
      expect(resultado.messageId).toBe(88442);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.telegram.org/botmock-bot-token-secret-123/sendMessage',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('3. Endpoints HTTP /api/telegram', () => {
    it('POST /api/telegram/registrar-recibo registra y retorna enlaces', async () => {
      const res = await request(app)
        .post('/api/telegram/registrar-recibo')
        .send(ticketEjemplo);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.deepLinkBot).toContain('recibo_MED-0042');
      expect(res.body.datos.shareUrl).toBeDefined();
    });

    it('GET /api/telegram/recibo/:consecutivo retorna los datos del recibo', async () => {
      // Registrar primero
      await request(app)
        .post('/api/telegram/registrar-recibo')
        .send(ticketEjemplo);

      const res = await request(app).get('/api/telegram/recibo/MED-0042');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.ticketText).toContain('FORMA — ALTA COSTURA');
    });

    it('GET /api/telegram/recibo/:consecutivo retorna 404 para recibos no registrados', async () => {
      const res = await request(app).get('/api/telegram/recibo/NO-EXISTE-XYZ');
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it('POST /api/telegram/enviar-recibo procesa el envío al chatId', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      await request(app)
        .post('/api/telegram/registrar-recibo')
        .send(ticketEjemplo);

      const res = await request(app)
        .post('/api/telegram/enviar-recibo')
        .send({
          chatId: '55443322',
          consecutivo: 'MED-0042',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.simulado).toBe(true);
    });
  });
});
