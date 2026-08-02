import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  variant?: 'danger' | 'warning'
  confirmLabel?: string
  isLoading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Confirm',
  isLoading,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-4 rounded-full p-3 ${
            variant === 'danger' ? 'bg-red-100 text-danger' : 'bg-amber-100 text-warning'
          }`}
        >
          {variant === 'danger' ? (
            <Trash2 className="h-6 w-6" />
          ) : (
            <AlertTriangle className="h-6 w-6" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-muted">{message}</p>
        {children}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'gold'}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
