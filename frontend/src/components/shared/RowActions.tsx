import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TONES = {
  neutral: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  danger: 'bg-red-100 text-red-700 hover:bg-red-200',
  success: 'bg-green-100 text-green-700 hover:bg-green-200',
  info: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  warning: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
} as const

export type RowActionTone = keyof typeof TONES

interface RowActionsProps {
  children: ReactNode
}

export function RowActions({ children }: RowActionsProps) {
  return (
    <div className="inline-flex h-8 items-stretch overflow-hidden rounded-lg border border-border divide-x divide-border">
      {children}
    </div>
  )
}

interface RowActionButtonProps {
  tone?: RowActionTone
  title?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  icon?: ReactNode
  label?: string
}

export function RowActionButton({ tone = 'neutral', title, onClick, icon, label }: RowActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      square={!label}
      className={cn('rounded-none border-0', label && 'px-2.5 text-xs', TONES[tone])}
      title={title}
      onClick={onClick}
    >
      {icon}
      {label && <span>{label}</span>}
    </Button>
  )
}
