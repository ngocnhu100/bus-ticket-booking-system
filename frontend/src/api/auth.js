const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const REFRESH_TOKEN_KEY = 'refreshToken'

let accessTokenInMemory = null

const setAccessToken = (token) => {
  accessTokenInMemory = token ?? null
  if (token) {
    console.log('🔐 Access token set', { hasToken: !!token })
  } else {
    console.log('🔐 Access token cleared')
  }
}

export const getAccessToken = () => {
  const token = accessTokenInMemory
  console.log('🔐 Getting access token:', { hasToken: !!token })
  return token
}
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export function clearTokens() {
  setAccessToken(null)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function buildHeaders(extraHeaders = {}, token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
}

/**
 * @param {string} path
 * @param {object} [options={}]
 * @param {any} [options.body]
 * @param {string} [options.token]
 * @param {string} [options.method='POST']
 * @param {object} [options.headers]
 * @param {object} [options...]
 */
export async function request(
  path,
  { body, token, method = 'POST', headers, ...options } = {}
) {
  const resolvedToken = token || getAccessToken()
  console.log(`[FE Request] ${method} ${path}`, {
    body,
    token: resolvedToken ? '[TOKEN]' : null,
    headers,
  })

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(headers, resolvedToken),
      ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      ...options,
    })
  } catch (networkError) {
    const error = new Error(networkError?.message || 'Failed to fetch')
    error.code = 'NETWORK_ERROR'
    throw error
  }

  let data = null
  try {
    data = await response.json()
  } catch (error) {
    data = null
  }

  const isError = !response.ok || (data && data.success === false)
  if (isError) {
    // Handle OLD JWT TOKEN error - force logout
    if (
      response.status === 401 &&
      data?.error?.code === 'AUTH_004' &&
      data?.error?.action === 'FORCE_LOGOUT'
    ) {
      console.error('[Auth] Old JWT token detected - forcing logout')

      // Check if user was logged in before clearing
      const wasLoggedIn = localStorage.getItem('user')

      clearTokens()
      localStorage.removeItem('user')

      // Only show alert and redirect if user was actually logged in
      if (wasLoggedIn) {
        // Show alert to user
        alert('Your session is outdated. Please login again to continue.')

        // Redirect to login
        window.location.href = '/login'
      }

      const error = new Error(
        data.error.message || 'Session expired - please login again'
      )
      error.code = 'AUTH_004'
      throw error
    }

    // If unauthorized and we have a refresh token, try to refresh
    if (
      response.status === 401 &&
      getRefreshToken() &&
      !path.includes('/auth/refresh')
    ) {
      //if (response.status === 401 && getRefreshToken() && !token) {
      try {
        await refreshAccessToken()
        // Retry the request with the new token
        return request(path, {
          body,
          token: getAccessToken(),
          method,
          headers,
          ...options,
        })
      } catch (refreshError) {
        // Refresh failed, clear tokens
        clearTokens()
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw refreshError
      }
    }

    const message =
      data?.error?.message ||
      'Unable to complete the request. Please try again.'
    const error = new Error(message)
    error.code = data?.error?.code || response.status
    throw error
  }

  return data
}

export async function login({ identifier, password }) {
  const payload = { identifier, password }
  const response = await request('/auth/login', { body: payload })
  return response?.data
}

export async function registerAccount({
  email,
  phone,
  password,
  fullName,
  role = 'passenger',
}) {
  const payload = { email, phone, password, fullName, role }
  const response = await request('/auth/register', { body: payload })
  return response?.data
}

export async function loginWithGoogle({ idToken }) {
  const payload = { idToken }
  const response = await request('/auth/oauth/google', { body: payload })
  return response?.data
}

export async function requestPasswordReset({ email }) {
  const payload = { email }
  const response = await request('/auth/forgot-password', { body: payload })
  return response?.data
}

export async function resetPassword({ token, newPassword, confirmPassword }) {
  const payload = { token, newPassword, confirmPassword }
  const response = await request('/auth/reset-password', { body: payload })
  return response?.data
}

export async function verifyEmail({ token }) {
  if (!token) {
    throw new Error('Missing verification token.')
  }

  const response = await request(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
    }
  )
  return response?.data
}

export function storeTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    setAccessToken(accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await request('/auth/refresh', {
    body: { refreshToken },
    method: 'POST',
  })

  const { accessToken } = response.data
  setAccessToken(accessToken)
  return accessToken
}
