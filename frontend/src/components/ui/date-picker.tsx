import { useState, useRef, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  min?: string
  max?: string
  placeholder?: string
  error?: string
  className?: string
  label?: string
  clearable?: boolean
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function parseDate(str: string): Date | null {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime()
}

export function DatePicker({ value, onChange, min, max, placeholder = 'Select date', error, className, label, clearable = false }: DatePickerProps) {
  const selected = parseDate(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1))
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        popupRef.current && !popupRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPopupStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${Math.max(4, rect.left)}px`,
        zIndex: 9999,
        minWidth: '288px',
      })
    }
  }, [open])

  useEffect(() => {
    if (selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [value])

  const grid = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [viewMonth])

  const minDate = min ? parseDate(min) : null
  const maxDate = max ? parseDate(max) : null

  function prevMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  function selectDay(day: number) {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    if (minDate && isBefore(d, minDate)) return
    if (maxDate && isBefore(maxDate, d)) return
    onChange(toStr(d))
    setOpen(false)
  }

  const display = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  const calendar = (
    <div ref={popupRef} style={popupStyle} className="rounded-xl border border-border bg-card shadow-lg animate-in fade-in duration-150">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button type="button" onClick={prevMonth} className="rounded-md p-1.5 text-muted hover:bg-cream hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <button type="button" onClick={nextMonth} className="rounded-md p-1.5 text-muted hover:bg-cream hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-4 pb-1">
        {DAYS.map(d => (
          <div key={d} className="py-1 text-center text-[11px] font-medium text-muted">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 px-4 pb-4">
        {grid.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />
          const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
          const isToday = isSameDay(d, today)
          const isSelected = !!selected && isSameDay(d, selected)
          const isDisabled = !!(minDate && isBefore(d, minDate)) || !!(maxDate && isBefore(maxDate, d))

          return (
            <button
              key={`d-${i}`}
              type="button"
              disabled={isDisabled}
              onClick={() => selectDay(day)}
              className={cn(
                'mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all',
                isSelected
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : isToday
                    ? 'bg-gold/15 text-gold-dark font-semibold ring-1 ring-gold/30'
                    : isDisabled
                      ? 'text-border cursor-not-allowed'
                      : 'text-foreground hover:bg-cream hover:text-primary',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className={cn('', className)} ref={wrapperRef}>
      {label && <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-10 w-full items-center rounded-lg border bg-card px-3 py-2 text-sm text-left ring-offset-card transition-colors',
            'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary',
            error ? 'border-danger focus-visible:ring-danger/50' : 'border-border',
            !selected && 'text-muted',
            clearable && selected && 'pr-8',
          )}
        >
          <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted" />
          <span className="flex-1 truncate">{display || placeholder}</span>
        </button>

        {clearable && selected && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
              setOpen(false)
            }}
            className="absolute right-2 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {open && ReactDOM.createPortal(calendar, document.body)}
      </div>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
