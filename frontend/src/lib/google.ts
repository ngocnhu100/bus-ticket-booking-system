type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
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
          }) => void
          prompt: (
            callback?: (notification: GooglePromptNotification) => void
          ) => void
        }
      }
    }
  }
}

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  import.meta.env.REACT_APP_GOOGLE_CLIENT_ID ??
  ''

export const isGoogleOAuthReady = () =>
  Boolean(window.google?.accounts?.id && googleClientId)

export function getGoogleIdToken() {
  return new Promise<string>((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google OAuth is not available.'))
      return
    }

    if (!googleClientId) {
      reject(new Error('Missing Google client ID.'))
      return
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: GoogleCredentialResponse) => {
        if (response?.credential) {
          resolve(response.credential)
        } else {
          reject(new Error('Google did not return a valid credential.'))
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    window.google.accounts.id.prompt(
      (notification?: GooglePromptNotification) => {
        if (!notification) return
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          reject(new Error('Google sign-in was cancelled.'))
        }
      }
    )
  })
}

export {}
