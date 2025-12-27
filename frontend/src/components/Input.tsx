import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

type InputProps = {
  label: string
  error?: string
  hint?: string
  hideLabel?: boolean
} & InputHTMLAttributes<HTMLInputElement>

export default function Input({
  label,
  error,
  hint,
  hideLabel = false,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name ?? label

  return (
    <label className="block text-left">
      {!hideLabel && (
        <span className="text-sm font-medium text-slate-600">{label}</span>
      )}
      <input
        id={inputId}
        className={cn(
          'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
          className
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {hint && !error && (
        <span
          id={`${inputId}-hint`}
          className="mt-1 block text-xs text-slate-500"
        >
          {hint}
        </span>
      )}
      {error && (
        <span
          id={`${inputId}-error`}
          className="mt-1 block text-xs font-medium text-rose-500"
        >
          {error}
        </span>
      )}
    </label>
  )
}
