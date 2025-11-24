import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import GoogleIcon from '../components/GoogleIcon'
import Input from '../components/Input'
import { postJSON } from '../lib/api'
import { hasErrors, validateCredentials } from '../lib/validation'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateCredentials(form)

    if (hasErrors(validation)) {
      setErrors(validation)
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })

    try {
      await postJSON('/auth/login', form)
      setStatus({ type: 'success', message: 'Login successful. Redirecting you now...' })
      setTimeout(() => navigate('/dashboard', { replace: true }), 900)
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to sign in right now.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setStatus({ type: 'idle', message: '' })
    setIsGoogleLoading(true)

    try {
      await postJSON('/auth/oauth/google')
      setStatus({ type: 'success', message: 'Google sign-in successful. Redirecting you now...' })
      setTimeout(() => navigate('/dashboard', { replace: true }), 900)
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Google sign-in failed.' })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          {status.message && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                status.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {status.message}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          leadingIcon={<GoogleIcon className="h-5 w-5" />}
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
        >
          Continue with Google
        </Button>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  )
}
