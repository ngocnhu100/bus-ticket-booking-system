import { useEffect, useState } from 'react'
import { GOOGLE_OAUTH_MESSAGE_TYPE } from '@/lib/googleAuth'

export default function AuthGoogleCallback() {
  const [message, setMessage] = useState('Completing Google sign-in…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    const payload = {
      type: GOOGLE_OAUTH_MESSAGE_TYPE,
      state: state ?? undefined,
      ...(error
        ? { error: errorDescription || error || 'Google sign-in was cancelled.' }
        : { code: code ?? undefined }),
    }

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin)
      window.close()
      return
    }

    if (error) {
      setMessage(`Unable to complete Google sign-in: ${errorDescription || error}`)
    } else if (!code) {
      setMessage('Google did not provide an authorization code. You can close this tab.')
    } else {
      setMessage('Unable to reach the original window. Please return and try again.')
    }
  }, [])

  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-indigo-50 px-4">
      <div className="max-w-lg rounded-xl border bg-white/90 p-8 text-center shadow-lg shadow-indigo-100">
        <p className="text-lg font-semibold text-primary">{message}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          You can safely close this tab and return to the original window.
        </p>
      </div>
    </section>
  )
}
