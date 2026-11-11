// frontend/src/shared/auth/__tests__/PortalAuthStorageAndIsolation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectPortalContext,
  getPortalAuth,
  setPortalAuth,
  clearPortalAuth,
} from '../portalAuthStorage';

describe('Aislamiento de Sesiones por Portal y Guardrails de Rol (DEF-01, DEF-02)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('[DEF-01] Aislamiento 100% Independiente entre Storefront, POS y Admin', () => {
    it('almacena las sesiones en espacios completamente segregados sin colisión', () => {
      // 1. Iniciar sesión en Storefront como Cliente
      setPortalAuth('storefront', {
        token: 'token-cliente-storefront',
        usuario: { id: 101, rol: 'CLIENTE', nombreCompleto: 'Valentina Duque' },
      });

      // 2. Iniciar sesión en POS como Vendedor
      setPortalAuth('pos', {
        token: 'token-vendedor-pos',
        usuario: { id: 2, rol: 'VENDEDOR', nombreCompleto: 'Camilo Mendoza' },
        sede: 'Punto Centro (Cúcuta)',
      });

      // 3. Iniciar sesión en Admin como Administrador
      setPortalAuth('admin', {
        token: 'token-admin-general',
        usuario: { id: 1, rol: 'ADMIN', nombreCompleto: 'Dirección General' },
      });

      // Verificar que cada portal mantiene intacto su propio token y usuario
      const sfAuth = getPortalAuth('storefront');
      expect(sfAuth.token).toBe('token-cliente-storefront');
      expect(sfAuth.usuario?.nombreCompleto).toBe('Valentina Duque');
      expect(sfAuth.usuario?.rol).toBe('CLIENTE');

      const posAuth = getPortalAuth('pos');
      expect(posAuth.token).toBe('token-vendedor-pos');
      expect(posAuth.usuario?.nombreCompleto).toBe('Camilo Mendoza');
      expect(posAuth.usuario?.rol).toBe('VENDEDOR');
      expect(posAuth.sede).toBe('Punto Centro (Cúcuta)');

      const adminAuth = getPortalAuth('admin');
      expect(adminAuth.token).toBe('token-admin-general');
      expect(adminAuth.usuario?.nombreCompleto).toBe('Dirección General');
      expect(adminAuth.usuario?.rol).toBe('ADMIN');
    });

    it('cerrar sesión en Storefront NO expulsa ni altera la sesión activa en POS ni en Admin', () => {
      // Sembrar sesiones en los 3 portales
      setPortalAuth('storefront', {
        token: 'token-cliente',
        usuario: { id: 102, rol: 'CLIENTE', nombreCompleto: 'Cliente Activo' },
      });
      setPortalAuth('pos', {
        token: 'token-pos-cajero',
        usuario: { id: 4, rol: 'VENDEDOR', nombreCompleto: 'Daniela Gómez' },
        sede: 'Punto Bucaramanga',
      });
      setPortalAuth('admin', {
        token: 'token-admin-activo',
        usuario: { id: 1, rol: 'ADMIN', nombreCompleto: 'Admin' },
      });

      // Ejecutar logout en Storefront
      clearPortalAuth('storefront');

      // Storefront debe quedar vacío
      const sfAuth = getPortalAuth('storefront');
      expect(sfAuth.token).toBeNull();
      expect(sfAuth.usuario).toBeNull();

      // POS y Admin deben continuar 100% activos con sus credenciales intactas
      const posAuth = getPortalAuth('pos');
      expect(posAuth.token).toBe('token-pos-cajero');
      expect(posAuth.usuario?.nombreCompleto).toBe('Daniela Gómez');

      const adminAuth = getPortalAuth('admin');
      expect(adminAuth.token).toBe('token-admin-activo');
      expect(adminAuth.usuario?.nombreCompleto).toBe('Admin');
    });

    it('cerrar sesión en POS NO expulsa al cliente en Storefront ni al Administrador', () => {
      setPortalAuth('storefront', {
        token: 'token-cliente',
        usuario: { id: 103, rol: 'CLIENTE', nombreCompleto: 'Sofía' },
      });
      setPortalAuth('pos', {
        token: 'token-pos',
        usuario: { id: 2, rol: 'VENDEDOR', nombreCompleto: 'Camilo' },
      });

      // Logout en POS
      clearPortalAuth('pos');

      const posAuth = getPortalAuth('pos');
      expect(posAuth.token).toBeNull();
      expect(posAuth.usuario).toBeNull();

      // Storefront sigue intacto
      const sfAuth = getPortalAuth('storefront');
      expect(sfAuth.token).toBe('token-cliente');
      expect(sfAuth.usuario?.nombreCompleto).toBe('Sofía');
    });
  });

  describe('[DEF-02] Infiltración de Clientes E-commerce en el Sistema POS ("Andrew" como Empleado)', () => {
    it('BLOQUEA ESTRICTAMENTE a cualquier usuario con rol CLIENTE que intente operar en POS', () => {
      // Simular que un cliente e-commerce ("Andrew Weniston") se registró en Storefront
      localStorage.setItem(
        'usuario',
        JSON.stringify({
          id: 31,
          nombreCompleto: 'Andrew Weniston',
          correo: 'wenistonandrew@gmail.com',
          rol: 'CLIENTE',
        })
      );
      localStorage.setItem('token', 'jwt-token-andrew');

      // Consultar la autenticación en el contexto POS
      const posAuth = getPortalAuth('pos');

      // Debe retornar isRoleDenied: true y usuario: null (no puede operar la caja)
      expect(posAuth.isRoleDenied).toBe(true);
      expect(posAuth.usuario).toBeNull();
      expect(posAuth.token).toBeNull();
      expect(posAuth.deniedReason).toBe(
        'Esta cuenta pertenece a un cliente de Tienda Forma. Solo personal autorizado puede operar la terminal POS.'
      );
    });

    it('permite operar en POS únicamente a personal con rol VENDEDOR o ADMIN', () => {
      // 1. Probar Vendedor legítimo
      setPortalAuth('pos', {
        token: 'token-valeria',
        usuario: {
          id: 8,
          nombreCompleto: 'Valeria Restrepo',
          correo: 'vendedor.caobos@forma.com',
          rol: 'VENDEDOR',
        },
        sede: 'Punto Caobos (Cúcuta)',
      });

      const posAuthVendedor = getPortalAuth('pos');
      expect(posAuthVendedor.isRoleDenied).toBe(false);
      expect(posAuthVendedor.usuario?.nombreCompleto).toBe('Valeria Restrepo');
      expect(posAuthVendedor.usuario?.rol).toBe('VENDEDOR');

      // 2. Probar Administrador en POS
      setPortalAuth('pos', {
        token: 'token-admin',
        usuario: {
          id: 1,
          nombreCompleto: 'Dirección General',
          correo: 'admin@forma.com',
          rol: 'ADMIN',
        },
        sede: 'Punto Centro (Cúcuta)',
      });

      const posAuthAdmin = getPortalAuth('pos');
      expect(posAuthAdmin.isRoleDenied).toBe(false);
      expect(posAuthAdmin.usuario?.rol).toBe('ADMIN');
    });
  });

    it('Storefront RECHAZA terminantemente cuentas con rol ADMIN o VENDEDOR (nunca las abre como cliente en tienda)', () => {
      // Iniciar sesión en Admin
      setPortalAuth('admin', {
        token: 'token-admin-maestro',
        usuario: { id: 1, rol: 'ADMIN', nombreCompleto: 'Dirección General' },
      });

      // Consultar autenticación en contexto Storefront (Tienda Web)
      const sfAuth = getPortalAuth('storefront');
      // No debe existir sesión en la tienda para el admin
      expect(sfAuth.token).toBeNull();
      expect(sfAuth.usuario).toBeNull();

      // Si existe un usuario en claves genéricas con rol ADMIN, Storefront debe ignorarlo
      localStorage.setItem(
        'usuario',
        JSON.stringify({ id: 1, rol: 'ADMIN', nombreCompleto: 'Dirección General' })
      );
      localStorage.setItem('token', 'token-admin-maestro');
      const sfAuthFromGeneric = getPortalAuth('storefront');
      expect(sfAuthFromGeneric.token).toBeNull();
      expect(sfAuthFromGeneric.usuario).toBeNull();
    });

    it('cerrar sesión en Admin NO expulsa al cliente en Storefront', () => {
      setPortalAuth('storefront', {
        token: 'token-cliente-fiel',
        usuario: { id: 77, rol: 'CLIENTE', nombreCompleto: 'Camila Torres' },
      });
      setPortalAuth('admin', {
        token: 'token-admin-temp',
        usuario: { id: 1, rol: 'ADMIN', nombreCompleto: 'Admin' },
      });

      // Cerrar sesión en Admin
      clearPortalAuth('admin');

      const adminAuth = getPortalAuth('admin');
      expect(adminAuth.token).toBeNull();
      expect(adminAuth.usuario).toBeNull();

      // Storefront sigue 100% activo
      const sfAuth = getPortalAuth('storefront');
      expect(sfAuth.token).toBe('token-cliente-fiel');
      expect(sfAuth.usuario?.nombreCompleto).toBe('Camila Torres');
    });

  describe('Detección Automática de Contexto de Portal', () => {
    it('reconoce el portal según la ruta activa', () => {
      expect(detectPortalContext()).toBe('storefront');
    });
  });

  describe('Canasta Storefront aislada por usuario', () => {
    it('usa una clave distinta para cada correo del portal Storefront', async () => {
      const { getCartStorageKey } = await import(
        '../../../features/storefront/context/StorefrontCartContext'
      );

      setPortalAuth('storefront', {
        token: 'token-a',
        usuario: { id: 1, correo: 'ana@forma.com', rol: 'CLIENTE' },
      });
      expect(getCartStorageKey()).toBe('forma_cart_ana@forma.com');

      setPortalAuth('storefront', {
        token: 'token-b',
        usuario: { id: 2, correo: 'beto@forma.com', rol: 'CLIENTE' },
      });
      expect(getCartStorageKey()).toBe('forma_cart_beto@forma.com');
    });
  });
});
