import React from 'react'

interface AdminTableProps {
  columns: {
    key: string
    label: string
    className?: string
    align?: 'left' | 'center' | 'right'
  }[]
  children: React.ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
}

export const AdminTable: React.FC<AdminTableProps> = ({
  columns,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No records found',
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading records...</p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <table className="w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                } ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}
