/**
 * Cliente HTTP centralizado con inyección de Idempotency-Key (RN-GEN-08)
 * y propagación de códigos de estado y detalles de validación del backend.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
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

  const rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
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
    // Preservamos status, código de error y detalles de validación para la UI
    const error: any = new Error(data.error?.message || data.message || 'Error en la petición');
    error.status = response.status;
    error.code = data.error?.code;
    error.detalles = data.error?.detalles;
    throw error;
  }

  return data as T;
}