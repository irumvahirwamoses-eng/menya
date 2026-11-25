import { translateCurrent } from '../i18n'

export class ApiError extends Error {
  status: number
  details?: Array<{ path: string; message: string }>

  constructor(message: string, status: number, details?: Array<{ path: string; message: string }>) {
    super(message)
    this.status = status
    this.details = details
  }
}

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

function authHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return headers
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) return false
      const data = (await response.json()) as { accessToken: string }
      setAccessToken(data.accessToken)
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const request = (): Promise<Response> =>
    fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      headers: authHeaders(init),
    })

  let response = await request()

  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession()
    if (refreshed) {
      response = await request()
    } else {
      setAccessToken(null)
      window.dispatchEvent(new CustomEvent('menya:auth-expired'))
    }
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(
      translateCurrent(data?.error ?? 'The request could not be completed.'),
      response.status,
      data?.details,
    )
  }

  return data as T
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    api<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
}
