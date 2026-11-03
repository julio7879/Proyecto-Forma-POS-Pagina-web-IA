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

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

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