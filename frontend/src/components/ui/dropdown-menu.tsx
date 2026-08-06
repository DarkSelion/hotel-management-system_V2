import { useState, useRef, useEffect, useLayoutEffect } from 'react'
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
  const [anchor, setAnchor] = useState<{ top: number; left: number; right: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    setAnchor({ top: rect.bottom + 4, left: rect.left, right: rect.right })
    setIsOpen(true)
  }

  function closeMenu() {
    setIsOpen(false)
    setAnchor(null)
  }

  useLayoutEffect(() => {
    if (!isOpen || !anchor || !menuRef.current) return
    const menu = menuRef.current
    const { width } = menu.getBoundingClientRect()
    const margin = 8
    let left = align === 'right' ? anchor.right - width : anchor.left
    left = Math.min(Math.max(left, margin), Math.max(window.innerWidth - width - margin, margin))
    menu.style.left = `${left}px`
    menu.style.top = `${anchor.top}px`
    menu.style.visibility = 'visible'
  }, [isOpen, anchor, align])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    function handleScrollOrResize() {
      closeMenu()
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu()
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [isOpen])

  return (
    <div ref={wrapperRef} className="inline-block">
      <div onClick={() => (isOpen ? closeMenu() : openMenu())}>{trigger}</div>
      {isOpen && anchor && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
          className={cn(
            'z-[60] min-w-[8.5rem] rounded-lg border border-border bg-card py-0.5 shadow-xl ring-1 ring-black/10',
          )}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div className="my-1 border-t border-border" />}
              <button
                className={cn(
                  'flex w-full items-center gap-2 px-2.5 py-1.5 text-[13px] transition-colors',
                  item.danger ? 'text-danger hover:bg-danger/10' : 'text-foreground hover:bg-bg',
                )}
                onClick={() => {
                  item.onClick?.()
                  closeMenu()
                }}
              >
                {item.icon && <span className="h-3.5 w-3.5">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
