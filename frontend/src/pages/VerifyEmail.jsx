import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { verifyEmail } from '@/api/auth'

const initialStatus = { state: 'idle', message: '' }

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(initialStatus)

  const token = searchParams.get('token') ?? ''

  useEffect(() => {
    let isMounted = true

    if (!token) {
      setStatus({ state: 'error', message: 'Verification link is missing or expired.' })
      return () => {
        isMounted = false
      }
    }

    setStatus({ state: 'loading', message: 'Confirming your email…' })

    const runVerification = async () => {
      try {
        const data = await verifyEmail({ token })
        if (!isMounted) return

        const successMessage = data?.message || 'Your email has been verified successfully.'
        setStatus({ state: 'success', message: successMessage })
      } catch (error) {
        if (!isMounted) return
        setStatus({
          state: 'error',
          message: error?.message || 'Unable to verify your email right now. Please try again later.',
        })
      }
    }

    runVerification()

    return () => {
      isMounted = false
    }
  }, [token])

  const handleBackToLogin = () => navigate('/login', { replace: true })

  const isLoading = status.state === 'loading'
  const isSuccess = status.state === 'success'
  const isError = status.state === 'error'

  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12">
      <Card className="w-full max-w-lg border-none shadow-2xl shadow-indigo-100">
        <CardHeader className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Bus Ticket Booking System
          </p>
          <CardTitle className="text-3xl font-semibold">Verify your email</CardTitle>
          <CardDescription>
            {isLoading
              ? 'We are validating your verification link.'
              : 'Complete this final step to activate your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status.message && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                isError
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {status.message}
            </div>
          )}

          {isLoading && (
            <p className="text-center text-sm text-muted-foreground">This may take a few seconds…</p>
          )}

          {isSuccess && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                You can now sign in using your email and password.
              </p>
              <Button className="w-full" onClick={handleBackToLogin}>
                Go to login
              </Button>
            </div>
          )}

          {isError && !isLoading && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If the issue persists, request a new verification email from the login page.
              </p>
              <Button variant="outline" className="w-full" onClick={handleBackToLogin}>
                Back to login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
