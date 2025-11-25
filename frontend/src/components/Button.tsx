import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  isLoading?: boolean
  leadingIcon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-600 text-white shadow-soft-xl hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary:
    'bg-white text-slate-900 border border-slate-200 hover:border-brand-200 focus-visible:ring-brand-200',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-200',
}

export default function Button({
  variant = 'primary',
  fullWidth,
  isLoading,
  leadingIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none',
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
      )}
      {!isLoading && leadingIcon}
      <span>{children}</span>
    </button>
  )
}
