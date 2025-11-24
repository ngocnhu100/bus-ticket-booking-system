import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import GoogleIcon from '../components/GoogleIcon'
import Input from '../components/Input'
import { postJSON } from '../lib/api'
import { hasErrors, validateCredentials } from '../lib/validation'

export default function Register() {
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
      await postJSON('/auth/register', form)
      setStatus({ type: 'success', message: 'Account created! Redirecting you to login...' })
      setTimeout(() => navigate('/login', { replace: true, state: { fromRegister: true } }), 1000)
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to create your account.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    setStatus({ type: 'idle', message: '' })
    setIsGoogleLoading(true)

    try {
      await postJSON('/auth/oauth/google')
      setStatus({ type: 'success', message: 'Google sign-up successful! Redirecting...' })
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Google sign-up failed.' })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Getting started</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign up to manage your bookings seamlessly.
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
            autoComplete="new-password"
            placeholder="Create a strong password"
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
            Create account
          </Button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          By continuing you agree to our Terms of Service and acknowledge our Privacy Policy.
        </p>

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
          onClick={handleGoogleSignup}
          isLoading={isGoogleLoading}
        >
          Continue with Google
        </Button>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
