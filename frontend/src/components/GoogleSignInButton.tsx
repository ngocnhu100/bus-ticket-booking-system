import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import GoogleIcon from '@/components/GoogleIcon'

type GoogleCredentialResponse = {
  credential?: string
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => Promise<void> | void
  onError?: (error: Error) => void
  disabled?: boolean
}

declare global {
  interface Window {
    handleGoogleCredential?: (response: GoogleCredentialResponse) => void
  }
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      const err = 'Google Client ID is not configured'
      setError(err)
      onError?.(new Error(err))
      return
    }

    console.log('🔵 Initializing Google Sign-In button...')

    // Create global callback
    window.handleGoogleCredential = async (
      response: GoogleCredentialResponse
    ) => {
      console.log('🔵 Google credential received')
      if (!response.credential) {
        const err = 'No credential received from Google'
        setError(err)
        onError?.(new Error(err))
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        await onSuccess(response.credential)
        console.log('✅ Google sign-in successful')
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to authenticate')
        console.error('❌ Authentication error:', error)
        setError(error.message)
        onError?.(error)
      } finally {
        setIsLoading(false)
      }
    }

    // Load Google SDK
    const existingScript = document.querySelector(
      'script[src*="accounts.google.com/gsi/client"]'
    )

    if (!existingScript) {
      console.log('🔵 Loading Google SDK...')
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true

      script.onload = () => {
        console.log('✅ Google SDK loaded')
        initializeButton()
      }

      script.onerror = () => {
        const err = 'Failed to load Google SDK'
        console.error('❌', err)
        setError(err)
        onError?.(new Error(err))
      }

      document.head.appendChild(script)
    } else if (window.google?.accounts?.id) {
      console.log('✅ Google SDK already loaded')
      initializeButton()
    } else {
      // Script exists but not loaded yet, wait for it
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval)
          initializeButton()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkInterval)
        if (!window.google?.accounts?.id) {
          const err = 'Google SDK failed to initialize'
          setError(err)
          onError?.(new Error(err))
        }
      }, 5000)
    }

    function initializeButton() {
      if (!buttonRef.current || disabled) return

      try {
        console.log('🔵 Rendering Google button...')

        window.google?.accounts?.id?.initialize({
          client_id: clientId,
          callback: window.handleGoogleCredential!,
          auto_select: false,
        })

        window.google?.accounts?.id?.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: buttonRef.current.offsetWidth || 350,
          text: 'continue_with',
          shape: 'rectangular',
        })

        console.log('✅ Google button rendered')
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to initialize Google button')
        console.error('❌ Initialization error:', error)
        setError(error.message)
        onError?.(error)
      }
    }

    return () => {
      delete window.handleGoogleCredential
    }
  }, [onSuccess, onError, disabled])

  if (error) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 text-base font-medium border-destructive/50 hover:bg-destructive/5 rounded-md"
        disabled={true}
      >
        <span className="flex w-full items-center justify-center gap-3 text-destructive">
          <GoogleIcon className="h-5 w-5" />
          {error}
        </span>
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 text-base font-medium hover:bg-accent rounded-md"
        disabled={true}
      >
        <span className="flex w-full items-center justify-center gap-3">
          <GoogleIcon className="h-5 w-5 animate-pulse" />
          Continue with Google
        </span>
      </Button>
    )
  }

  return (
    <div
      ref={buttonRef}
      className="w-full [&>div]:!w-full [&>div>div]:!w-full [&>div>div>iframe]:!w-full [&>div>div>iframe]:!h-11"
      style={{ minHeight: '44px', borderRadius: '4px', overflow: 'hidden' }}
    />
  )
}
