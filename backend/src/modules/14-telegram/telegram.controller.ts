import type { Request, Response } from 'express';
import { TelegramBotService } from '../../shared/infrastructure/telegram/TelegramBotService.js';
import type { RegistrarReciboDTO, EnviarReciboDTO } from './telegram.schema.js';
import { AppError } from '../../shared/domain/AppError.js';

export class TelegramController {
  static async registrarRecibo(req: Request, res: Response) {
    const dto = req.body as RegistrarReciboDTO;
    const telegramService = TelegramBotService.getInstance();
    const resultado = telegramService.registrarTicketTemporal(dto);

    res.status(200).json({
      ok: true,
      mensaje: 'Recibo registrado exitosamente para Telegram (válido por 24 horas)',
      datos: resultado,
    });
  }

  static async enviarRecibo(req: Request, res: Response) {
    const dto = req.body as EnviarReciboDTO;
    const telegramService = TelegramBotService.getInstance();
    const resultado = await telegramService.enviarReciboPorTelegram(dto.chatId, dto.consecutivo);

    res.status(200).json({
      ok: true,
      mensaje: resultado.mensaje,
      datos: resultado,
    });
  }

  static async obtenerRecibo(req: Request, res: Response) {
    const rawConsecutivo = req.params.consecutivo;
    const consecutivo = Array.isArray(rawConsecutivo) ? rawConsecutivo[0] : rawConsecutivo;
    if (!consecutivo) {
      throw AppError.badRequest('El consecutivo es requerido');
    }

    const telegramService = TelegramBotService.getInstance();
    const registro = telegramService.obtenerTicket(consecutivo);

    if (!registro) {
      throw AppError.notFound(`Recibo ${consecutivo} no encontrado o ha expirado.`);
    }

    res.status(200).json({
      ok: true,
      consecutivo,
      datos: registro,
    });
  }
}
