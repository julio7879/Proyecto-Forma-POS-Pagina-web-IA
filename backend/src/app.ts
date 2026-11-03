import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { errorHandler } from './shared/middlewares/errorHandler.js';
import { identidadRouter, authRouter } from './modules/01-identidad/index.js';
import { ubicacionesRouter } from './modules/02-ubicaciones/index.js';
import { catalogoRouter } from './modules/03-catalogo/index.js';
import { inventarioRouter } from './modules/04-inventario/index.js';
import { comprasRouter } from './modules/05-compras/index.js';
import { trasladosRouter } from './modules/06-traslados/index.js';
import { cajaRouter } from './modules/07-caja/index.js';
import { ventasPosRouter } from './modules/08-ventas-pos/index.js';
import { descuentosRouter } from './modules/09-descuentos/index.js';
import { devolucionesCambiosRouter } from './modules/10-devoluciones-cambios/index.js';
import { pedidosWebRouter } from './modules/11-pedidos-web/index.js';
import { reportesAuditoriaRouter } from './modules/12-reportes-auditoria/index.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Verificación de estado de la API
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    moneda: 'COP',
    timezone: 'America/Bogota',
  });
});

// 12 Módulos de Dominio (Vertical Slices)
app.use('/api/auth', authRouter);
app.use('/api/identidad', identidadRouter);
app.use('/api/ubicaciones', ubicacionesRouter);
app.use('/api/catalogo', catalogoRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/compras', comprasRouter);
app.use('/api/traslados', trasladosRouter);
app.use('/api/caja', cajaRouter);
app.use('/api/ventas-pos', ventasPosRouter);
app.use('/api/descuentos', descuentosRouter);
app.use('/api/devoluciones', devolucionesCambiosRouter);
app.use('/api/pedidos-web', pedidosWebRouter);
app.use('/api/reportes', reportesAuditoriaRouter);

// Manejador centralizado de errores
app.use(errorHandler);
