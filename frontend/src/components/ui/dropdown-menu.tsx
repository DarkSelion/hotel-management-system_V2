import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick?: () => void
  divider?: boolean
  danger?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'left' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[12rem] rounded-lg border border-border bg-card py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div className="my-1 border-t border-border" />}
              <button
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                  item.danger ? 'text-danger hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
                )}
                onClick={() => {
                  item.onClick?.()
                  setIsOpen(false)
                }}
              >
                {item.icon && <span className="h-4 w-4">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
