import React from 'react'

interface AdminTableRowProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  isHoverable?: boolean
}

export const AdminTableRow: React.FC<AdminTableRowProps> = ({
  children,
  onClick,
  className = '',
  isHoverable = true,
}) => {
  return (
    <tr
      onClick={onClick}
      className={`${isHoverable ? 'hover:bg-muted/50' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  )
}

interface AdminTableCellProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export const AdminTableCell: React.FC<AdminTableCellProps> = ({
  children,
  align = 'left',
  className = '',
}) => {
  const baseClass = 'px-4 py-4 text-sm'
  const alignClass =
    align === 'center'
      ? 'text-center flex justify-center items-center'
      : align === 'right'
        ? 'text-right flex justify-end items-center'
        : 'text-left'

  return (
    <td className={`${baseClass} ${alignClass} ${className}`}>{children}</td>
  )
}
