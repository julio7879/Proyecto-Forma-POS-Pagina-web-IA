import { Router } from 'express';
export { InventoryLedgerService } from './InventoryLedgerService.js';

export const inventarioRouter = Router();

// Módulo 04: Motor de Inventario y Kardex Inmutable (RF-INV)
inventarioRouter.get('/health', (_req, res) => {
  res.json({ modulo: '04-inventario', status: 'ready' });
});
