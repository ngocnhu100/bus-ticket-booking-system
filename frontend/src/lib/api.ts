import { getAccessToken } from '@/api/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type Json = Record<string, unknown>

export async function postJSON<T extends Json = Json>(
  path: string,
  payload?: Json,
  init?: RequestInit
): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
    ...init,
  })

  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string
  }

  if (!response.ok) {
    throw new Error(data?.message ?? 'Something went wrong. Please try again.')
  }

  return data
}

export { API_BASE_URL }
