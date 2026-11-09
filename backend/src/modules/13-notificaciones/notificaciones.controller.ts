import type { Request, Response } from 'express';
import { EmailService } from '../../shared/infrastructure/email/EmailService.js';
import type { NotificarPedidoWebDTO, NotificarBienvenidaDTO, NotificarEstadoPedidoDTO } from './notificaciones.schema.js';

export class NotificacionesController {
  static async notificarPedidoWeb(req: Request, res: Response) {
    const dto = req.body as NotificarPedidoWebDTO;
    const emailService = EmailService.getInstance();

    const resultado = await emailService.enviarConfirmacionPedidoWeb({
      codigo: dto.codigo,
      clienteNombre: dto.clienteNombre,
      clienteEmail: dto.clienteEmail,
      ciudadDestino: dto.ciudadDestino,
      direccionEntrega: dto.direccionEntrega,
      sedeAsignada: dto.sedeAsignada,
      metodoPago: dto.metodoPago,
      totalCOP: dto.totalCOP,
      subtotalCOP: dto.subtotalCOP,
      descuentoCOP: dto.descuentoCOP,
      ivaCOP: dto.ivaCOP,
      items: dto.items,
    });

    res.status(200).json({
      ok: true,
      mensaje: 'Notificación de correo enviada exitosamente',
      previewUrl: resultado.previewUrl || null,
      messageId: resultado.messageId,
    });
  }

  static async notificarBienvenida(req: Request, res: Response) {
    const dto = req.body as NotificarBienvenidaDTO;
    const emailService = EmailService.getInstance();

    const resultado = await emailService.enviarBienvenidaRegistro({
      clienteNombre: dto.clienteNombre,
      clienteEmail: dto.clienteEmail,
    });

    res.status(200).json({
      ok: true,
      mensaje: 'Correo de bienvenida enviado exitosamente',
      previewUrl: resultado.previewUrl || null,
      messageId: resultado.messageId,
    });
  }

  static async notificarEstadoPedido(req: Request, res: Response) {
    const dto = req.body as NotificarEstadoPedidoDTO;
    const emailService = EmailService.getInstance();

    const resultado = await emailService.enviarActualizacionEstadoPedido({
      codigo: dto.codigo,
      clienteNombre: dto.clienteNombre,
      clienteEmail: dto.clienteEmail,
      nuevoEstado: dto.nuevoEstado,
      nuevoEstadoTexto: dto.nuevoEstadoTexto,
      descripcionEstado: dto.descripcionEstado,
      sedeAsignada: dto.sedeAsignada,
      guiaTransportadora: dto.guiaTransportadora,
      transportadora: dto.transportadora,
    });

    res.status(200).json({
      ok: true,
      mensaje: 'Notificación de cambio de estado enviada exitosamente',
      previewUrl: resultado.previewUrl || null,
      messageId: resultado.messageId,
    });
  }
}
