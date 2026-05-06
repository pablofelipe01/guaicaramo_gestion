/**
 * Utilidades de autenticación para Client Components.
 * NO importar desde archivos con 'server-only'.
 */

/**
 * Retorna los headers HTTP con el token JWT del usuario autenticado.
 * Seguro para usar en cualquier contexto (SSR/CSR) ya que verifica `window`.
 */
export function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return {
    Authorization: `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Wrapper de fetch que inyecta automáticamente el token de autenticación.
 * Úsalo en lugar de `fetch` + `getAuthHeaders()` para reducir boilerplate.
 */
export function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  })
}
