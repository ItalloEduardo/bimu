const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errMsg =
      typeof data.error === 'string'
        ? data.error
        : typeof data.error === 'object' && data.error !== null
          ? 'Verifique os campos do formulário'
          : data.message || `Erro ${res.status}`
    const err = new Error(errMsg) as Error & { data?: unknown }
    err.data = data
    throw err
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (path: string) => request<undefined>(path, { method: 'DELETE' }),
}
