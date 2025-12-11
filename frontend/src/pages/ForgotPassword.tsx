import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
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
import { requestPasswordReset } from '@/api/auth'
import { emailPattern } from '@/lib/validation'
import { ThemeToggle } from '@/components/ThemeToggle'

interface FormState {
  email: string
}

interface StatusState {
  type: 'idle' | 'success' | 'error'
  message: string
}

const initialState: FormState = { email: '' }

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState<string>('')
  const [status, setStatus] = useState<StatusState>({
    type: 'idle',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm({ email: event.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!emailPattern.test(form.email)) {
      setError('Enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })

    try {
      await requestPasswordReset({ email: form.email })
      setStatus({
        type: 'success',
        message: 'If an account exists, a reset link has been sent.',
      })
      setForm(initialState)
    } catch (err) {
      setStatus({
        type: 'error',
        message:
          (err as Error).message || 'Unable to send reset link right now.',
      })
    } finally {
      setIsSubmitting(false)
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
        <Card className="w-full max-w-lg border-none shadow-2xl shadow-indigo-100">
          <CardHeader className="space-y-3 text-center">
            <div
              className="flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🚌</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                BusGo
              </span>
            </div>
            <CardTitle className="text-3xl font-semibold">
              Forgot your password?
            </CardTitle>
            <CardDescription>
              Enter the email associated with your account and we will send
              instructions to reset it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
                {error && (
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
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
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Remembered your password?{' '}
              <Link to="/login" className="font-semibold text-primary">
                Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
