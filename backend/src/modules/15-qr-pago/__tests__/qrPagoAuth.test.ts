import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';

/**
 * Guardrails F0 del cobro QR:
 * - iniciar, aprobar y consultar estado exigen JWT de ADMIN/VENDEDOR.
 * - aprobar ya no crea sesiones fantasma.
 * - el detalle de solo lectura sigue público para la pantalla del cliente.
 */
describe('QR Pago · guardrails F0', () => {
  it('rechaza iniciar una sesión QR sin JWT', async () => {
    const res = await request(app)
      .post('/api/qr-pago/iniciar')
      .send({ consecutivo: 'MED-F0-1', totalCop: 1000 });

    expect(res.status).toBe(401);
  });

  it('rechaza aprobar un pago sin JWT', async () => {
    const res = await request(app).post('/api/qr-pago/aprobar/MED-F0-1');

    expect(res.status).toBe(401);
  });

  it('rechaza consultar el estado sin JWT', async () => {
    const res = await request(app).get('/api/qr-pago/estado/MED-F0-1');

    expect(res.status).toBe(401);
  });

  it('mantiene público el detalle de solo lectura', async () => {
    const res = await request(app).get('/api/qr-pago/detalle/MED-F0-1');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.estado).toBe('PENDIENTE');
  });
});
