import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GoogleIcon from '@/components/GoogleIcon'
import { requestGoogleIdToken } from '@/lib/googleAuth'
import { login, loginWithGoogle, storeTokens } from '@/api/auth'
import { hasErrors, validateLogin } from '@/lib/validation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

const initialState = { identifier: '', password: '' }

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({ identifier: '', password: '' })
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }
  const { login: authLogin } = useAuth()
  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateLogin(form)

    if (hasErrors(validation)) {
      setErrors(validation)
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
      setStatus({
        type: 'error',
        message: error.message || 'Unable to sign in right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToForgotPassword = (event) => {
    event.preventDefault()
    navigate('/forgot-password')
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setStatus({ type: 'idle', message: '' })

    try {
      const idToken = await requestGoogleIdToken()
      const authData = await loginWithGoogle({ idToken })

      authLogin(authData)

      setStatus({
        type: 'success',
        message: 'Google sign-in successful. Redirecting...',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Google sign-in failed. Please try again.',
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <section
        className="flex min-h-screen items-center justify-center px-4 py-12 
  bg-gradient-to-br 
  from-background 
  via-background 
  to-primary/10 
  dark:to-primary/20"
      >
        <Card className="w-full max-w-lg border-none shadow-2xl shadow-indigo-100">
          <CardHeader className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Bus Ticket Booking System
            </p>
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
                  {status.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="my-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                'Contacting Google…'
              ) : (
                <span className="flex w-full items-center justify-center gap-2">
                  <GoogleIcon className="h-5 w-5" />
                  Continue with Google
                </span>
              )}
            </Button>

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
