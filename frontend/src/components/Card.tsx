import type { HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement>

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft-xl backdrop-blur',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
