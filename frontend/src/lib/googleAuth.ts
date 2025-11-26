const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const MESSAGE_TYPE = 'bus-ticket/google-oauth-code'
const STATE_KEY = 'bus-ticket-google-oauth-state'
const POPUP_FEATURES =
  'width=500,height=650,left=100,top=100,resizable=yes,scrollbars=yes,status=yes'
const SCOPES = ['openid', 'email', 'profile']
const CANCELLED_MESSAGE = 'Google sign-in was cancelled.'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const googleClientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? ''

const configuredRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? ''

const ensureBrowserEnv = () => {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in is only available in the browser.')
  }
}

const getRedirectUri = () => {
  if (configuredRedirectUri) {
    return configuredRedirectUri
  }
  ensureBrowserEnv()
  return `${window.location.origin}/auth/google/callback`
}

const assertClientConfig = () => {
  if (!googleClientId) {
    throw new Error(
      'Missing Google client ID. Please set VITE_GOOGLE_CLIENT_ID.'
    )
  }
  if (!googleClientSecret) {
    throw new Error(
      'Missing Google client secret. Please set VITE_GOOGLE_CLIENT_SECRET.'
    )
  }
}

const randomState = (length = 32) => {
  ensureBrowserEnv()
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length)
    window.crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, length)
  }
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
}

const buildAuthUrl = (state: string) => {
  const url = new URL(AUTH_URL)
  url.searchParams.set('client_id', googleClientId)
  url.searchParams.set('redirect_uri', getRedirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES.join(' '))
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'select_account')
  url.searchParams.set('state', state)
  return url.toString()
}

const exchangeCodeForIdToken = async (code: string) => {
  assertClientConfig()
  const body = new URLSearchParams({
    code,
    client_id: googleClientId,
    client_secret: googleClientSecret,
    redirect_uri: getRedirectUri(),
    grant_type: 'authorization_code',
  })

  let response: Response
  try {
    response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch {
    throw new Error('Unable to reach Google token endpoint. Please try again.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      (data?.error_description as string) ||
      (data?.error as string) ||
      'Google authorization could not be completed.'
    throw new Error(message)
  }

  const idToken = data?.id_token
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google did not return an ID token.')
  }

  return idToken
}

export async function requestGoogleIdToken() {
  ensureBrowserEnv()
  assertClientConfig()

  const state = randomState()
  const authUrl = buildAuthUrl(state)

  try {
    window.sessionStorage?.setItem(STATE_KEY, state)
  } catch {
    // _error không còn được dùng → bỏ tên biến
  }

  const popup = window.open(authUrl, 'google-oauth', POPUP_FEATURES)

  if (!popup) {
    throw new Error(
      'Popup blocked. Please allow popups from this site and try again.'
    )
  }

  popup.focus()

  return new Promise<string>((resolve, reject) => {
    let completed = false

    const cleanup = () => {
      completed = true
      window.removeEventListener('message', handleMessage)
      window.clearInterval(closeWatcher)
      try {
        window.sessionStorage?.removeItem(STATE_KEY)
      } catch {
        // _error không còn được dùng → bỏ tên biến
      }
      if (!popup.closed) {
        popup.close()
      }
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data ?? {}
      if (data?.type !== MESSAGE_TYPE) return

      const expectedState = window.sessionStorage?.getItem(STATE_KEY) ?? state

      cleanup()

      if (data.error) {
        reject(new Error(data.error))
        return
      }

      if (!data.state || data.state !== expectedState) {
        reject(
          new Error('Google sign-in could not be verified. Please try again.')
        )
        return
      }

      if (!data.code) {
        reject(new Error('Google did not return an authorization code.'))
        return
      }

      try {
        const idToken = await exchangeCodeForIdToken(data.code as string)
        resolve(idToken)
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error('Unable to complete Google sign-in.')
        )
      }
    }

    const closeWatcher = window.setInterval(() => {
      if (completed) return
      if (popup.closed) {
        cleanup()
        reject(new Error(CANCELLED_MESSAGE))
      }
    }, 400)

    window.addEventListener('message', handleMessage)
  })
}

export const GOOGLE_OAUTH_MESSAGE_TYPE = MESSAGE_TYPE
export const GOOGLE_OAUTH_STATE_KEY = STATE_KEY
export const GOOGLE_OAUTH_CANCELLED_MESSAGE = CANCELLED_MESSAGE
export const getGoogleRedirectUri = getRedirectUri
