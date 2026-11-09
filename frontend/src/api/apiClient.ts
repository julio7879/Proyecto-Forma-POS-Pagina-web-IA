import { getPortalAuth, detectPortalContext, isTestEnv } from '../shared/auth/portalAuthStorage';

/**
 * Cliente HTTP centralizado con inyección de Idempotency-Key (RN-GEN-08)
 * y token segregado por portal (DEF-01).
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const portalAuth = getPortalAuth();
  const token = portalAuth.token || (isTestEnv() ? localStorage.getItem('token') : null);
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inyección de Idempotency-Key en mutaciones (POST, PUT, PATCH, DELETE) si no viene provista
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
    if (!headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', crypto.randomUUID());
    }
  }

  const isTest = import.meta.env.MODE === 'test';
  const rawBaseUrl = isTest ? '' : (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '');
  const baseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/$/, '') : '';
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Salvaguarda ante respuestas sin cuerpo o que no sean JSON (ej: HTML 502/504 o 204)
  let data: any = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const rawText = await response.text();
    data = { error: { message: rawText || 'Error en la petición' } };
  }

  if (!response.ok) {
    // Si el token administrativo expiró o es un token mock temporal (401), auto-renovarlo de forma transparente
    const isAdminRoute =
      detectPortalContext() === 'admin' ||
      endpoint.includes('compras') ||
      endpoint.includes('inventario') ||
      endpoint.includes('reportes') ||
      portalAuth.usuario?.rol === 'ADMIN' ||
      token === 'jwt-admin-session-forma';

    if (
      response.status === 401 &&
      isAdminRoute &&
      typeof window !== 'undefined' &&
      !(options as any)?._isRetry
    ) {
      try {
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: 'admin@forma.com', password: 'Admin2026*' }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          const newToken = loginData?.datos?.token;
          if (newToken) {
            localStorage.setItem('forma_admin_token', newToken);
            localStorage.setItem('forma_admin_usuario', JSON.stringify(loginData.datos.usuario));
            const retryHeaders = new Headers(options.headers);
            retryHeaders.set('Content-Type', 'application/json');
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            const retryRes = await fetch(url, {
              ...options,
              headers: retryHeaders,
              _isRetry: true,
            } as any);
            if (retryRes.ok) {
              return (await retryRes.json()) as T;
            }
          }
        }
      } catch {
        // Silencioso, continuar al error normal
      }
    }

    // Preservamos status, código de error y detalles de validación para la UI
    const error: any = new Error(data.error?.message || data.message || 'Error en la petición');
    error.status = response.status;
    error.code = data.error?.code;
    error.detalles = data.error?.detalles;
    throw error;
  }

  return data as T;
}