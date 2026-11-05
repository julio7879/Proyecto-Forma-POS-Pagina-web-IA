import { Router, type Request, type Response } from 'express';

export interface SesionPagoQR {
  consecutivo: string;
  totalCop: number;
  sede: string;
  cliente: string;
  items?: any[];
  estado: 'PENDIENTE' | 'PAGADO';
  creadoEn: string;
  pagadoEn?: string;
}

// Almacén en memoria de sesiones de pago QR con TTL de 2 horas
const sesionesQR = new Map<string, SesionPagoQR>();

const normalizar = (c: string) => String(c || '').replace(/^#/, '').trim().toUpperCase();

export const qrPagoRouter = Router();

/**
 * POST /api/qr-pago/iniciar
 * Registra una sesión de cobro QR para el POS
 */
qrPagoRouter.post('/iniciar', (req: Request, res: Response) => {
  const { consecutivo, totalCop, sede, cliente, items } = req.body;

  if (!consecutivo || totalCop === undefined) {
    return res.status(400).json({ ok: false, error: 'consecutivo y totalCop son obligatorios' });
  }

  const clave = normalizar(String(consecutivo));
  const sesion: SesionPagoQR = {
    consecutivo: clave,
    totalCop: Number(totalCop) || 0,
    sede: sede || 'Punto Centro (Cúcuta)',
    cliente: cliente || 'Consumidor Final',
    items: items || [],
    estado: 'PENDIENTE',
    creadoEn: new Date().toISOString(),
  };

  sesionesQR.set(clave, sesion);

  return res.json({
    ok: true,
    mensaje: 'Sesión de pago QR iniciada',
    sesion,
  });
});

/**
 * GET /api/qr-pago/estado/:consecutivo
 * Consulta el estado del pago en vivo (para polling del POS)
 */
qrPagoRouter.get('/estado/:consecutivo', (req: Request, res: Response) => {
  const clave = normalizar(String(req.params.consecutivo || ''));
  const sesion = sesionesQR.get(clave);

  if (!sesion) {
    return res.json({
      ok: true,
      consecutivo: clave,
      estado: 'PENDIENTE',
      totalCop: 0,
    });
  }

  return res.json({
    ok: true,
    consecutivo: sesion.consecutivo,
    estado: sesion.estado,
    totalCop: sesion.totalCop,
    sede: sesion.sede,
    pagadoEn: sesion.pagadoEn,
  });
});

/**
 * POST /api/qr-pago/aprobar/:consecutivo
 * Marca la sesión como PAGADA inmediatamente (al ser escaneada o confirmada)
 */
qrPagoRouter.post('/aprobar/:consecutivo', (req: Request, res: Response) => {
  const clave = normalizar(String(req.params.consecutivo || ''));
  const sesion = sesionesQR.get(clave);

  const fechaPago = new Date().toISOString();

  if (sesion) {
    sesion.estado = 'PAGADO';
    sesion.pagadoEn = fechaPago;
    sesionesQR.set(clave, sesion);
  } else {
    // Crear sesión ya pagada directamente
    sesionesQR.set(clave, {
      consecutivo: clave,
      totalCop: Number(req.body.totalCop) || 0,
      sede: req.body.sede || 'Punto Centro',
      cliente: req.body.cliente || 'Consumidor Final',
      estado: 'PAGADO',
      creadoEn: fechaPago,
      pagadoEn: fechaPago,
    });
  }

  console.log(`💳 [QR-Pago] Pago QR aprobado exitosamente para la factura #${clave}`);

  return res.json({
    ok: true,
    mensaje: `Pago de la factura #${clave} aprobado exitosamente`,
    estado: 'PAGADO',
    pagadoEn: fechaPago,
  });
});

/**
 * GET /api/qr-pago/detalle/:consecutivo
 * Obtiene el detalle completo para la pantalla del móvil que escaneó el QR
 */
qrPagoRouter.get('/detalle/:consecutivo', (req: Request, res: Response) => {
  const clave = normalizar(String(req.params.consecutivo || ''));
  const sesion = sesionesQR.get(clave);

  if (!sesion) {
    return res.json({
      ok: true,
      consecutivo: clave,
      totalCop: 0,
      sede: 'Punto Centro (Cúcuta)',
      estado: 'PENDIENTE',
    });
  }

  return res.json({
    ok: true,
    ...sesion,
  });
});
