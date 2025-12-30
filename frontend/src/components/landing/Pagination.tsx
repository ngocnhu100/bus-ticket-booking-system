import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (items: number) => void
  itemsPerPage?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPage = 10,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5
    const halfWindow = Math.floor(maxPagesToShow / 2)

    let startPage = Math.max(1, currentPage - halfWindow)
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) pages.push('...')
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const getItemsPerPageOptions = () => {
    const defaultOptions = [5, 10, 20, 50]
    if (defaultOptions.includes(itemsPerPage)) {
      return defaultOptions
    }
    // Add current itemsPerPage if not in defaults, and sort
    return [...defaultOptions, itemsPerPage].sort((a, b) => a - b)
  }

  const pageNumbers = getPageNumbers()
  const itemsPerPageOptions = getItemsPerPageOptions()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-card rounded-lg border border-border">
      {/* Left section: Items per page */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Show:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange?.(parseInt(e.target.value))}
          className="px-3 py-1.5 rounded border border-input bg-background text-foreground text-sm cursor-pointer hover:border-primary transition-colors min-w-24"
        >
          {itemsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option} trips
            </option>
          ))}
        </select>
      </div>

      {/* Center section: Page numbers */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {pageNumbers.map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page === 'string'}
            className={cn(
              'h-9 min-w-9 px-3 rounded-md text-sm font-medium transition-colors',
              page === '...'
                ? 'cursor-default text-muted-foreground'
                : page === currentPage
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-accent text-foreground cursor-pointer border border-border'
            )}
          >
            {page}
          </button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right section: Page info */}
      <div className="text-sm text-muted-foreground whitespace-nowrap">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )
}
