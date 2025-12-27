import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminTablePaginationProps {
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export const AdminTablePagination: React.FC<AdminTablePaginationProps> = ({
  currentPage,
  totalPages,
  total,
  onPageChange,
  isLoading = false,
}) => {
  if (totalPages <= 1 || isLoading) return null

  return (
    <div className="px-6 py-4 border-t border-border flex items-center justify-center">
      <p className="text-sm text-muted-foreground mr-2">
        Page {currentPage} of {totalPages} • {total} total results
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-input bg-background p-2 text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1
          const isNearCurrent = Math.abs(pageNum - currentPage) <= 1
          const isFirst = pageNum === 1
          const isLast = pageNum === totalPages

          if (!isNearCurrent && !isFirst && !isLast) {
            if (pageNum === 2 || pageNum === totalPages - 1) {
              return (
                <span key={pageNum} className="px-2 py-1 text-muted-foreground">
                  ...
                </span>
              )
            }
            return null
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                pageNum === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background text-foreground hover:bg-muted'
              }`}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-input bg-background p-2 text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
