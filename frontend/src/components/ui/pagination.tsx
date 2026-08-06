import { cn } from '../../lib/utils'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  function getPageNumbers() {
    const pages: (number | '...')[] = []
    const delta = 2
    const left = Math.max(2, currentPage - delta)
    const right = Math.min(lastPage - 1, currentPage + delta)

    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < lastPage - 1) pages.push('...')
    if (lastPage > 1) pages.push(lastPage)

    return pages
  }

  const btnBase = 'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors'

  return (
    <div className="flex items-center gap-1">
      <button
        className={cn(btnBase, 'text-muted hover:bg-bg', currentPage <= 1 && 'pointer-events-none opacity-50')}
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        className={cn(btnBase, 'text-muted hover:bg-bg', currentPage <= 1 && 'pointer-events-none opacity-50')}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {getPageNumbers().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-muted">
            ...
          </span>
        ) : (
          <button
            key={page}
            className={cn(
              btnBase,
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-foreground hover:bg-bg',
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ),
      )}
      <button
        className={cn(btnBase, 'text-muted hover:bg-bg', currentPage >= lastPage && 'pointer-events-none opacity-50')}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        className={cn(btnBase, 'text-muted hover:bg-bg', currentPage >= lastPage && 'pointer-events-none opacity-50')}
        onClick={() => onPageChange(lastPage)}
        disabled={currentPage >= lastPage}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  )
}
