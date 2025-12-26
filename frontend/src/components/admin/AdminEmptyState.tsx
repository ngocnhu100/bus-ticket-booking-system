import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface AdminEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
