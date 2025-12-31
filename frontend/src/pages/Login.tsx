import { useState } from 'react'
import type { FormEvent, ChangeEvent, MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { login, loginWithGoogle, resendVerificationEmail } from '@/api/auth'
import { hasErrors, validateLogin } from '@/lib/validation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

interface FormState {
  identifier: string
  password: string
}

interface ErrorState {
  identifier: string
  password: string
}

interface StatusState {
  type: 'idle' | 'success' | 'error'
  message: string
  code?: string
}

interface ResendState {
  isLoading: boolean
  message: string
  type: 'idle' | 'success' | 'error'
}

const initialState: FormState = {
  identifier: '',
  password: '',
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<ErrorState>({
    identifier: '',
    password: '',
  })
  const [status, setStatus] = useState<StatusState>({
    type: 'idle',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [resendState, setResendState] = useState<ResendState>({
    isLoading: false,
    message: '',
    type: 'idle',
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof ErrorState]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }
  const { login: authLogin } = useAuth()
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateLogin(form)

    if (hasErrors(validation)) {
      setErrors(validation as unknown as ErrorState)
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })

    try {
      const authData = await login(form) // Gọi API từ auth.js
      authLogin(authData) // Dùng context để lưu và redirect dựa trên role
      setStatus({
        type: 'success',
        message: 'Login successful. Redirecting...',
      })
    } catch (error) {
      const errorMessage =
        (error as Error).message || 'Unable to sign in right now.'
      const errorCode = (error as { code?: string }).code || ''
      setStatus({
        type: 'error',
        message: errorMessage,
        code: errorCode,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToForgotPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    navigate('/forgot-password')
  }

  const handleResendVerification = async (
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    if (!form.identifier) {
      setResendState({
        isLoading: false,
        message: 'Please enter your email address',
        type: 'error',
      })
      return
    }

    setResendState({ isLoading: true, message: '', type: 'idle' })

    try {
      await resendVerificationEmail({ email: form.identifier })
      setResendState({
        isLoading: false,
        message:
          'Verification email sent successfully. Please check your inbox.',
        type: 'success',
      })
    } catch (error) {
      setResendState({
        isLoading: false,
        message:
          (error as Error).message || 'Failed to resend verification email',
        type: 'error',
      })
    }
  }

  const handleGoogleSuccess = async (credential: string) => {
    setStatus({ type: 'idle', message: '' })

    try {
      const authData = await loginWithGoogle({ idToken: credential })
      authLogin(authData)
      setStatus({
        type: 'success',
        message: 'Google sign-in successful. Redirecting...',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Google sign-in failed. Please try again.',
      })
    }
  }

  const handleGoogleError = (error: Error) => {
    setStatus({
      type: 'error',
      message: error.message || 'Google sign-in failed. Please try again.',
    })
  }

  return (
    <>
      <div
        className="flex items-center justify-center gap-2 cursor-pointer absolute top-4 left-4"
        onClick={() => navigate('/')}
      >
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">🚌</span>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          BusGo
        </span>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <section
        className="flex min-h-screen items-center justify-center px-4 py-12 
  bg-linear-to-br 
  from-background 
  via-background 
  to-primary/10 
  dark:to-primary/20"
      >
        <Card className="w-full max-w-lg border-none shadow-2xl shadow-indigo-100">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl font-semibold">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="identifier">Email</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  placeholder="you@example.com"
                  autoComplete="username"
                  value={form.identifier}
                  onChange={handleChange}
                />
                {errors.identifier && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.identifier}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.password}
                  </p>
                )}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {status.message && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    status.type === 'error'
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <div className="mb-2">{status.message}</div>
                  {status.type === 'error' && status.code === 'AUTH_005' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={resendState.isLoading}
                      className="w-full"
                    >
                      {resendState.isLoading
                        ? 'Sending...'
                        : 'Resend Verification Email'}
                    </Button>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>

              {resendState.message && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    resendState.type === 'error'
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {resendState.message}
                </div>
              )}
            </form>

            <div className="my-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-primary">
                Register now
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
