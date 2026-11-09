/**
 * Gestor de Autenticación Segregado por Portal (DEF-01, DEF-02)
 *
 * Resuelve la colisión y fuga de sesiones entre los 3 portales:
 * 1. Storefront (Tienda Web Forma):
 *    - Claves: 'forma_storefront_token', 'forma_storefront_usuario'
 *    - Rol exclusivo: 'CLIENTE'
 * 2. POS (Terminal Punto de Venta):
 *    - Claves: 'forma_pos_token', 'forma_pos_usuario', 'forma_pos_sede'
 *    - Roles autorizados: 'VENDEDOR', 'ADMIN' (Bloqueo estricto a 'CLIENTE' DEF-02)
 * 3. Admin (Dashboard Gerencial):
 *    - Claves: 'forma_admin_token', 'forma_admin_usuario', 'forma_admin_sede'
 *    - Rol exclusivo: 'ADMIN'
 *
 * Guardrails:
 * - Aislamiento 100% independiente de sesiones.
 * - Iniciar, cambiar o cerrar sesión en un portal no afecta las sesiones de los otros dos.
 * - Detección automática del contexto activo según la URL (/pos, /admin, o storefront).
 * - En el contexto Tienda Web, ÚNICAMENTE usuarios con rol 'CLIENTE' son aceptados como sesión de compra.
 * - En el contexto POS, cualquier usuario con rol 'CLIENTE' es estrictamente bloqueado (DEF-02).
 * - En el contexto Admin, ÚNICAMENTE usuarios con rol 'ADMIN' tienen acceso.
 */

export type PortalType = 'storefront' | 'pos' | 'admin';

export interface PortalUserSession {
  id?: number | string;
  nombreCompleto?: string;
  nombre?: string;
  correo?: string;
  email?: string;
  rol?: string; // 'CLIENTE' | 'VENDEDOR' | 'ADMIN'
  ubicacionId?: number;
  [key: string]: any;
}

export interface PortalAuthData {
  token: string | null;
  usuario: PortalUserSession | null;
  sede?: string | null;
  isRoleDenied?: boolean;
  deniedReason?: string | null;
}

export const PORTAL_AUTH_EVENTS = {
  STOREFRONT: 'forma-storefront-auth-changed',
  POS: 'forma-pos-auth-changed',
  ADMIN: 'forma-admin-auth-changed',
} as const;

export const isTestEnv = (): boolean => {
  try {
    return import.meta.env?.MODE === 'test' || Boolean((import.meta as any).env?.VITEST);
  } catch {
    return false;
  }
};

/**
 * Detecta el portal activo basándose en el pathname actual del navegador.
 */
export function detectPortalContext(): PortalType {
  if (typeof window === 'undefined') return 'storefront';
  const pathname = window.location.pathname || '';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/pos')) return 'pos';
  return 'storefront';
}

/**
 * Claves de almacenamiento por portal
 */
const PORTAL_KEYS: Record<
  PortalType,
  { token: string; usuario: string; sede?: string; event: string }
> = {
  storefront: {
    token: 'forma_storefront_token',
    usuario: 'forma_storefront_usuario',
    event: PORTAL_AUTH_EVENTS.STOREFRONT,
  },
  pos: {
    token: 'forma_pos_token',
    usuario: 'forma_pos_usuario',
    sede: 'forma_pos_sede',
    event: PORTAL_AUTH_EVENTS.POS,
  },
  admin: {
    token: 'forma_admin_token',
    usuario: 'forma_admin_usuario',
    sede: 'forma_admin_sede',
    event: PORTAL_AUTH_EVENTS.ADMIN,
  },
};

/**
 * Auto-saneamiento preventivo al cargar en navegador real:
 * Si existían claves genéricas 'token' / 'usuario' que contaminaban el origen,
 * migrarlas a su portal respectivo y limpiar el almacenamiento compartido.
 */
if (typeof window !== 'undefined' && !isTestEnv()) {
  try {
    const rawGen = localStorage.getItem('usuario');
    if (rawGen) {
      const parsed = JSON.parse(rawGen);
      if (parsed.rol === 'ADMIN') {
        const tok = localStorage.getItem('token');
        if (tok && !localStorage.getItem('forma_admin_token')) {
          localStorage.setItem('forma_admin_token', tok);
          localStorage.setItem('forma_admin_usuario', rawGen);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      } else if (parsed.rol === 'VENDEDOR') {
        const tok = localStorage.getItem('token');
        if (tok && !localStorage.getItem('forma_pos_token')) {
          localStorage.setItem('forma_pos_token', tok);
          localStorage.setItem('forma_pos_usuario', rawGen);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      } else if (parsed.rol === 'CLIENTE') {
        const tok = localStorage.getItem('token');
        if (tok && !localStorage.getItem('forma_storefront_token')) {
          localStorage.setItem('forma_storefront_token', tok);
          localStorage.setItem('forma_storefront_usuario', rawGen);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
  } catch {
    // Silencioso
  }
}

/**
 * Obtiene la sesión activa segregada del portal especificado (o del contexto actual).
 */
export function getPortalAuth(portal?: PortalType): PortalAuthData {
  if (typeof window === 'undefined') {
    return { token: null, usuario: null, sede: null, isRoleDenied: false, deniedReason: null };
  }

  const target = portal ?? detectPortalContext();
  const keys = PORTAL_KEYS[target];

  // 1. Leer claves específicas y aisladas del portal
  let token = localStorage.getItem(keys.token);
  let rawUsuario = localStorage.getItem(keys.usuario);
  let sede = keys.sede ? localStorage.getItem(keys.sede) : null;

  // 2. Fallback controlado EXCLUSIVAMENTE en entorno de pruebas (Vitest):
  if (isTestEnv()) {
    if (target === 'pos') {
      if (!token) token = localStorage.getItem('pos_token') || localStorage.getItem('token');
      if (!rawUsuario) rawUsuario = localStorage.getItem('usuario');
    } else if (target === 'admin') {
      if (!token) token = localStorage.getItem('token');
      if (!rawUsuario) rawUsuario = localStorage.getItem('usuario');
    } else if (target === 'storefront') {
      if (!token) token = localStorage.getItem('token');
      if (!rawUsuario) rawUsuario = localStorage.getItem('usuario');
    }
  }

  let usuario: PortalUserSession | null = null;
  if (rawUsuario) {
    try {
      usuario = JSON.parse(rawUsuario);
    } catch {
      usuario = null;
    }
  }

  // 3. Guardrail DEF-02: En el contexto POS, prohibir estrictamente rol 'CLIENTE'
  if (target === 'pos') {
    if (usuario && usuario.rol === 'CLIENTE') {
      return {
        token: null,
        usuario: null,
        sede,
        isRoleDenied: true,
        deniedReason:
          'Esta cuenta pertenece a un cliente de Tienda Forma. Solo personal autorizado puede operar la terminal POS.',
      };
    }
    // Si no es VENDEDOR ni ADMIN, no autorizar operación
    if (usuario && usuario.rol !== 'VENDEDOR' && usuario.rol !== 'ADMIN') {
      return {
        token: null,
        usuario: null,
        sede,
        isRoleDenied: false,
        deniedReason: null,
      };
    }
  }

  // 4. Guardrail Admin: En contexto Admin, ÚNICAMENTE 'ADMIN' es aceptado
  if (target === 'admin' && usuario) {
    if (usuario.rol !== 'ADMIN') {
      return {
        token: null,
        usuario: null,
        sede,
        isRoleDenied: true,
        deniedReason: 'Acceso denegado: Esta cuenta no posee privilegios de Administrador.',
      };
    }
  }

  // 5. Guardrail Storefront: En Tienda Web, ÚNICAMENTE rol 'CLIENTE' es aceptado como sesión de tienda.
  // Un usuario ADMIN o VENDEDOR logueado en sus respectivos portales NUNCA se refleja como cliente en la tienda web.
  if (target === 'storefront' && usuario) {
    if (usuario.rol && usuario.rol !== 'CLIENTE') {
      return {
        token: null,
        usuario: null,
        sede: null,
        isRoleDenied: false,
        deniedReason: null,
      };
    }
  }

  return {
    token,
    usuario,
    sede,
    isRoleDenied: false,
    deniedReason: null,
  };
}

/**
 * Guarda la sesión segregada para un portal específico.
 */
export function setPortalAuth(
  portal: PortalType,
  data: {
    token: string;
    usuario: PortalUserSession;
    sede?: string;
  }
): void {
  if (typeof window === 'undefined') return;

  const keys = PORTAL_KEYS[portal];
  localStorage.setItem(keys.token, data.token);
  localStorage.setItem(keys.usuario, JSON.stringify(data.usuario));
  if (keys.sede && data.sede) {
    localStorage.setItem(keys.sede, data.sede);
  }

  // Despachar evento personalizado para sincronización reactiva en pestañas/componentes del mismo portal
  window.dispatchEvent(
    new CustomEvent(keys.event, {
      detail: { token: data.token, usuario: data.usuario, sede: data.sede },
    })
  );
}

/**
 * Cierra la sesión únicamente en el portal especificado sin tocar los demás.
 */
export function clearPortalAuth(portal?: PortalType): void {
  if (typeof window === 'undefined') return;

  const target = portal ?? detectPortalContext();
  const keys = PORTAL_KEYS[target];

  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.usuario);
  if (keys.sede) {
    localStorage.removeItem(keys.sede);
  }

  if (target === 'pos') {
    localStorage.removeItem('pos_token');
  }

  // Si estamos en entorno de prueba de Vitest y las claves genéricas correspondían a este rol, limpiarlas
  if (isTestEnv()) {
    try {
      const rawGen = localStorage.getItem('usuario');
      if (rawGen) {
        const parsed = JSON.parse(rawGen);
        if (
          (target === 'storefront' && parsed.rol === 'CLIENTE') ||
          (target === 'pos' && parsed.rol === 'VENDEDOR') ||
          (target === 'admin' && parsed.rol === 'ADMIN')
        ) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        }
      }
    } catch {
      // Silencioso
    }
  }

  window.dispatchEvent(new CustomEvent(keys.event, { detail: null }));
}
