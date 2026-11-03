import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { prisma } from '../../../config/database.js';
import { generateToken, UserPermissionCache } from '../../../shared/middlewares/authPermission.js';

describe('Módulo 02: Gestión de Ubicaciones y Desactivación Segura (RN-UBI, MOD-02)', () => {
  let adminToken: string;
  let vendedorToken: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    UserPermissionCache.clear();

    adminToken = generateToken({
      userId: 1,
      correo: 'admin@forma.com',
      rol: 'ADMIN',
    });

    vendedorToken = generateToken({
      userId: 2,
      correo: 'vendedor@forma.com',
      rol: 'VENDEDOR',
    });

    // Mock usuario en BD para requireAuth
    vi.spyOn(prisma.usuario, 'findUnique').mockImplementation((async ({ where }: any) => {
      if (where.id === 1) {
        return {
          id: 1,
          correo: 'admin@forma.com',
          rol: 'ADMIN',
          activo: true,
          ubicacionId: null,
          topeDescuentoPorc: 100,
          permVender: true,
          permCaja: true,
          permDescuentoManual: true,
          permAnularVentas: true,
          permDevoluciones: true,
          permVerInventario: true,
          permSolicitarTraslado: true,
          permRecibirTraslado: true,
          permVerOtrosPuntos: true,
          permPedidosWeb: true,
          permVerVentasPunto: true,
        } as any;
      }
      if (where.id === 2) {
        return {
          id: 2,
          correo: 'vendedor@forma.com',
          rol: 'VENDEDOR',
          activo: true,
          ubicacionId: 2,
          topeDescuentoPorc: 5,
          permVender: true,
          permCaja: true,
          permDescuentoManual: false,
          permAnularVentas: false,
          permDevoluciones: false,
          permVerInventario: true,
          permSolicitarTraslado: true,
          permRecibirTraslado: false,
          permVerOtrosPuntos: false,
          permPedidosWeb: false,
          permVerVentasPunto: true,
        } as any;
      }
      return null;
    }) as any);
  });

  describe('1. Creación de Ubicaciones (POST /api/ubicaciones)', () => {
    it('debe crear un punto de venta exitosamente con datos válidos (HTTP 201)', async () => {
      vi.spyOn(prisma.ubicacion, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.ubicacion, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.municipioDane, 'findUnique').mockResolvedValue({
        codigoDane: '54001',
        nombre: 'Cúcuta',
        departamentoCodigo: '54',
      } as any);

      vi.spyOn(prisma.ubicacion, 'create').mockResolvedValue({
        id: 3,
        nombre: 'Tienda Unicentro Cúcuta',
        tipo: 'PUNTO_VENTA',
        municipioDaneId: '54001',
        direccion: 'Av. Libertadores # 10-20',
        activa: true,
        despachaWeb: true,
        prioridadDespacho: 10,
        baseCajaCop: 200000,
      } as any);

      vi.spyOn(prisma.registroAuditoria, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/ubicaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Tienda Unicentro Cúcuta',
          tipo: 'PUNTO_VENTA',
          municipioDaneId: '54001',
          direccion: 'Av. Libertadores # 10-20',
          despachaWeb: true,
          prioridadDespacho: 10,
          baseCajaCop: 200000,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.nombre).toBe('Tienda Unicentro Cúcuta');
    });

    it('debe rechazar la creación si un vendedor intenta crear una ubicación (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/ubicaciones')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nombre: 'Tienda No Autorizada',
          tipo: 'PUNTO_VENTA',
          municipioDaneId: '54001',
          direccion: 'Calle Falsa 123',
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
    });

    it('debe rechazar crear una segunda Bodega Central con conflicto 409 (RN-UBI-01)', async () => {
      // Simular que ya existe una Central registrada
      vi.spyOn(prisma.ubicacion, 'findFirst').mockResolvedValue({
        id: 1,
        nombre: 'Bodega Central Fontibón',
        tipo: 'CENTRAL',
      } as any);

      const res = await request(app)
        .post('/api/ubicaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Segunda Bodega Central',
          tipo: 'CENTRAL',
          municipioDaneId: '11001',
          direccion: 'Calle 100 # 20-30',
        });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain('Ya existe una Bodega Central');
    });
  });

  describe('2. Desactivación Segura de Ubicaciones (PATCH /api/ubicaciones/:id/desactivar - RN-UBI-05)', () => {
    it('debe rechazar desactivar la Bodega Central (Condición 1 - HTTP 422)', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          ubicacion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 1,
              nombre: 'Bodega Central Principal',
              tipo: 'CENTRAL',
              activa: true,
            }),
          },
        });
      });

      const res = await request(app)
        .patch('/api/ubicaciones/1/desactivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivo: 'Intento de cierre de Central' });

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain('Bodega Central nunca puede ser desactivada');
    });

    it('debe rechazar desactivar una sede si aún posee stock físico remanente (Condición 2 - HTTP 422)', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          ubicacion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              nombre: 'Punto Centro',
              tipo: 'PUNTO_VENTA',
              activa: true,
            }),
          },
          saldoStock: {
            aggregate: vi.fn().mockResolvedValue({
              _sum: { fisico: 15, noVendible: 0 },
            }),
          },
        });
      });

      const res = await request(app)
        .patch('/api/ubicaciones/2/desactivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain('aún posee stock remanente: 15 unidades físicas');
    });

    it('debe rechazar desactivar si tiene traslados abiertos en curso (Condición 3 - HTTP 422)', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          ubicacion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              nombre: 'Punto Centro',
              tipo: 'PUNTO_VENTA',
              activa: true,
            }),
          },
          saldoStock: {
            aggregate: vi.fn().mockResolvedValue({
              _sum: { fisico: 0, noVendible: 0 },
            }),
          },
          traslado: {
            count: vi.fn().mockResolvedValue(2), // 2 traslados abiertos
          },
        });
      });

      const res = await request(app)
        .patch('/api/ubicaciones/2/desactivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain('traslado(s) inter-sedes abierto(s)');
    });

    it('debe rechazar desactivar si tiene pedidos web asignados en curso (Condición 4 - HTTP 422)', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          ubicacion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              nombre: 'Punto Centro',
              tipo: 'PUNTO_VENTA',
              activa: true,
            }),
          },
          saldoStock: {
            aggregate: vi.fn().mockResolvedValue({
              _sum: { fisico: 0, noVendible: 0 },
            }),
          },
          traslado: {
            count: vi.fn().mockResolvedValue(0),
          },
          pedidoWeb: {
            count: vi.fn().mockResolvedValue(1), // 1 pedido web pendiente
          },
        });
      });

      const res = await request(app)
        .patch('/api/ubicaciones/2/desactivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain('pedido(s) web asignado(s) pendiente(s)');
    });

    it('debe rechazar desactivar si tiene una sesión de caja ABIERTA (Condición 5 - HTTP 422)', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          ubicacion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              nombre: 'Punto Centro',
              tipo: 'PUNTO_VENTA',
              activa: true,
            }),
          },
          saldoStock: {
            aggregate: vi.fn().mockResolvedValue({
              _sum: { fisico: 0, noVendible: 0 },
            }),
          },
          traslado: {
            count: vi.fn().mockResolvedValue(0),
          },
          pedidoWeb: {
            count: vi.fn().mockResolvedValue(0),
          },
          sesionCaja: {
            count: vi.fn().mockResolvedValue(1), // 1 sesión abierta
          },
        });
      });

      const res = await request(app)
        .patch('/api/ubicaciones/2/desactivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain('sesión de caja ABIERTA');
    });

    it('debe desactivar exitosamente la sede cuando cumple las 5 condiciones (HTTP 200 OK)', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          ubicacion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              nombre: 'Punto Centro',
              tipo: 'PUNTO_VENTA',
              activa: true,
            }),
            update: vi.fn().mockResolvedValue({
              id: 2,
              nombre: 'Punto Centro',
              tipo: 'PUNTO_VENTA',
              activa: false,
              despachaWeb: false,
            }),
          },
          saldoStock: {
            aggregate: vi.fn().mockResolvedValue({
              _sum: { fisico: 0, noVendible: 0 },
            }),
          },
          traslado: {
            count: vi.fn().mockResolvedValue(0),
          },
          pedidoWeb: {
            count: vi.fn().mockResolvedValue(0),
          },
          sesionCaja: {
            count: vi.fn().mockResolvedValue(0),
          },
          registroAuditoria: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const res = await request(app)
        .patch('/api/ubicaciones/2/desactivar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivo: 'Cierre definitivo de sucursal comercial' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.activa).toBe(false);
      expect(res.body.mensaje).toContain('desactivada de forma segura');
    });
  });

  describe('3. Invariante de Inmutabilidad y Borrado Lógico (RN-GEN-03, RN-GEN-07)', () => {
    it('debe rechazar terminantemente cualquier intento de DELETE físico (HTTP 400)', async () => {
      const res = await request(app)
        .delete('/api/ubicaciones/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain('El borrado físico de sedes está prohibido');
    });
  });
});
