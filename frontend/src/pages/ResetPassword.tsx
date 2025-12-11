import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { resetPassword } from '@/api/auth'
import { strongPasswordPattern } from '@/lib/validation'
import { ThemeToggle } from '@/components/ThemeToggle'

interface FormState {
  password: string
  confirmPassword: string
}

interface StatusState {
  type: 'idle' | 'success' | 'error'
  message: string
}

const initialForm: FormState = { password: '', confirmPassword: '' }

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string>('')
  const [status, setStatus] = useState<StatusState>({
    type: 'idle',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const token = searchParams.get('token') ?? ''

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      setError('Reset link is invalid or expired.')
      return
    }

    if (!strongPasswordPattern.test(form.password)) {
      setError(
        'Password must include upper, lower, number, special char, min 8 chars.'
      )
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })

    try {
      await resetPassword({
        token,
        newPassword: form.password,
        confirmPassword: form.confirmPassword,
      })
      setStatus({
        type: 'success',
        message:
          'Password reset successfully. You can now log in with your new password.',
      })
      setForm(initialForm)
    } catch (err) {
      setStatus({
        type: 'error',
        message:
          (err as Error).message || 'Unable to reset password right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToLogin = () => navigate('/login', { replace: true })

  const isSuccess = status.type === 'success'

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
              Reset your password
            </CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isSuccess ? (
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting…' : 'Reset password'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {status.message}
                </div>
                <Button className="w-full" onClick={handleBackToLogin}>
                  Go to login
                </Button>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Remembered your password?{' '}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={handleBackToLogin}
              >
                Back to login
              </button>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
