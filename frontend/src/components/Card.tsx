import type { HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement>

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border bg-card text-card-foreground p-8 shadow-soft-xl backdrop-blur border-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
