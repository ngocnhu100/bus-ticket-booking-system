type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptNotification = {
  isNotDisplayed?: () => boolean
  isSkippedMoment?: () => boolean
  isDismissedMoment?: () => boolean
  getMomentType?: () => string
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
  getDismissedReason?: () => string
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
            ux_mode?: 'popup' | 'redirect'
            context?: 'signin' | 'signup' | 'use'
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: (
            callback?: (notification: GooglePromptNotification) => void
          ) => void
        }
      }
    }
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const CANCELLED_MESSAGE = 'Google sign-in was cancelled.'

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let googleSdkPromise: Promise<void> | null = null

const ensureGoogleSdk = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google OAuth is not available.'))
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  if (!googleSdkPromise) {
    googleSdkPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`)
      if (existingScript && existingScript.dataset.loaded === 'true') {
        resolve()
        return
      }

      const script = existingScript ?? document.createElement('script')
      script.src = GOOGLE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => {
        script.dataset.loaded = 'true'
        if (window.google?.accounts?.id) {
          resolve()
        } else {
          googleSdkPromise = null
          reject(new Error('Google OAuth SDK loaded without the accounts API.'))
        }
      }
      script.onerror = () => {
        googleSdkPromise = null
        reject(new Error('Failed to load Google OAuth SDK.'))
      }
      if (!existingScript) {
        document.head.appendChild(script)
      }
    })
  }

  return googleSdkPromise
}

export const isGoogleOAuthReady = () =>
  Boolean(googleClientId && typeof window !== 'undefined' && window.google?.accounts?.id)

type GoogleSignInOptions = {
  onCredential: (idToken: string) => Promise<void> | void
  uxMode?: 'popup' | 'redirect'
}

export async function startGoogleSignIn({
  onCredential,
  uxMode = 'popup',
}: GoogleSignInOptions) {
  if (!googleClientId) {
    throw new Error('Missing Google client ID. Please set VITE_GOOGLE_CLIENT_ID.')
  }

  if (typeof onCredential !== 'function') {
    throw new Error('Google sign-in requires an onCredential handler.')
  }

  await ensureGoogleSdk()

  if (!window.google?.accounts?.id) {
    throw new Error('Google OAuth is not available.')
  }

  const googleAccounts = window.google.accounts.id

  return new Promise<void>((resolve, reject) => {
    let isSettled = false

    const succeed = () => {
      if (isSettled) return
      isSettled = true
      resolve()
    }

    const fail = (message: string) => {
      if (isSettled) return
      isSettled = true
      reject(new Error(message))
    }

    googleAccounts.initialize({
      client_id: googleClientId,
      callback: async (response: GoogleCredentialResponse) => {
        if (!response?.credential) {
          fail('Google did not return a valid credential.')
          return
        }

        try {
          await onCredential(response.credential)
          succeed()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Google sign-in failed.'
          fail(message)
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: uxMode,
      context: 'signin',
      use_fedcm_for_prompt: uxMode === 'redirect',
    })

    googleAccounts.prompt((notification?: GooglePromptNotification) => {
      if (!notification || isSettled) return

      const shouldHandle =
        notification.isNotDisplayed?.() ||
        notification.isSkippedMoment?.() ||
        notification.isDismissedMoment?.()

      if (!shouldHandle) {
        return
      }

      const reason =
        notification.getNotDisplayedReason?.() ??
        notification.getSkippedReason?.() ??
        notification.getDismissedReason?.()

      const message = (() => {
        if (reason === 'user_cancel' || reason === 'tap_outside' || reason === 'cancel_called') {
          return CANCELLED_MESSAGE
        }
        if (reason === 'credential_returned') {
          return null
        }
        switch (reason) {
          case 'fedcm_disabled':
            return 'Your browser blocked Google sign-in. Allow third-party sign-in near the address bar or re-enable FedCM in Site Settings.'
          case 'browser_not_supported':
            return 'Google sign-in is not supported in this browser. Try Chrome or a Chromium-based browser.'
          case 'missing_client_id':
          case 'invalid_client':
            return 'Google sign-in is misconfigured. Please verify the Google client ID.'
          case 'secure_http_required':
            return 'Google sign-in requires HTTPS or localhost. Use https://localhost or configure HTTPS.'
          default:
            return 'Google sign-in could not start. Please try again.'
        }
      })()

      if (message) {
        fail(message)
      }
    })
  })
}

export {}
