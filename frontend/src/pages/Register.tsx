import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GoogleIcon from '@/components/GoogleIcon'
import { requestGoogleIdToken } from '@/lib/googleAuth'
import { hasErrors, validateRegister } from '@/lib/validation'
import { loginWithGoogle, registerAccount, storeTokens } from '@/api/auth'
import { ThemeToggle } from '@/components/ThemeToggle'

interface FormState {
  email: string
  phone: string
  password: string
  fullName: string
  role: string
}

interface ErrorState {
  email: string
  phone: string
  password: string
  fullName: string
  role: string
}

interface StatusState {
  type: 'idle' | 'success' | 'error'
  message: string
}

const initialState: FormState = {
  email: '',
  phone: '+84',
  password: '',
  fullName: '',
  role: 'passenger',
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<ErrorState>({
    email: '',
    phone: '',
    password: '',
    fullName: '',
    role: '',
  })
  const [status, setStatus] = useState<StatusState>({
    type: 'idle',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof ErrorState]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateRegister(form)

    if (hasErrors(validation)) {
      setErrors(validation as unknown as ErrorState)
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })

    try {
      await registerAccount(form)
      setStatus({
        type: 'success',
        message: 'Account created! Redirecting you to login…',
      })
      setTimeout(() => navigate('/login', { replace: true }), 800)
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to create your account.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    setStatus({ type: 'idle', message: '' })
    setIsGoogleLoading(true)

    try {
      const idToken = await requestGoogleIdToken()
      const authData = await loginWithGoogle({ idToken })

      if (authData) {
        storeTokens(authData)
        setStatus({
          type: 'success',
          message: 'Google sign-in successful. Redirecting now…',
        })
        setTimeout(() => navigate('/dashboard', { replace: true }), 600)
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error)?.message || 'Google sign-in failed.',
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <section
        className="flex min-h-screen items-center justify-center px-4 py-12 
      bg-gradient-to-br from-background via-background to-primary/10 
      dark:to-primary/20"
      >
        <Card className="w-full max-w-2xl border-none shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Bus Ticket Booking System
            </p>
            <CardTitle className="text-3xl font-semibold">Register</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-6 md:grid-cols-2"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Nguyen Van A"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={handleChange}
                />
                {errors.fullName && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Vietnamese phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+84901234567"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Use +84 followed by 8–9 digits.
                </p>
                {errors.phone && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Must include uppercase, lowercase, number, special character,
                  min 8 characters.
                </p>
                {errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <input type="hidden" name="role" value={form.role} />

              {status.message && (
                <div
                  className={`md:col-span-2 rounded-lg border px-4 py-3 text-sm ${
                    status.type === 'error'
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <div className="md:col-span-2 flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Create account'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By continuing you agree to our Terms of Service and
                  acknowledge our Privacy Policy.
                </p>
              </div>
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
              onClick={handleGoogleSignup}
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
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
