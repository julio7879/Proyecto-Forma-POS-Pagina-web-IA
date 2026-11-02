import { Router } from 'express';

export const pedidosWebRouter = Router();

// Módulo 11: Tienda Web, Checkout, Algoritmo DANE y Reservas (RF-WEB)
pedidosWebRouter.get('/health', (_req, res) => {
  res.json({ modulo: '11-pedidos-web', status: 'ready' });
});
