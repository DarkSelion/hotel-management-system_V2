import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency } from '@/lib/format'
import { AlertTriangle } from 'lucide-react'
import type { Reservation } from '@/types'

interface ReservationCheckInOutModalProps {
  mode: 'check-in' | 'check-out'
  reservation: Reservation | null
  isOpen: boolean
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ReservationCheckInOutModal({
  mode,
  reservation,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: ReservationCheckInOutModalProps) {
  const isCheckIn = mode === 'check-in'
  const guestName = reservation ? `${reservation.guest?.first_name ?? ''} ${reservation.guest?.last_name ?? ''}`.trim() : ''
  const roomNumber = reservation?.room?.room_number ?? '-'
  const hasBalance = !!reservation && reservation.due_amount > 0

  const message = isCheckIn
    ? `Check in ${guestName} in room ${roomNumber}?`
    : `Check out ${guestName} from room ${roomNumber}?`

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={isCheckIn ? 'Check In Guest' : 'Check Out Guest'}
      message={message}
      confirmLabel={isCheckIn ? 'Check In' : 'Check Out'}
      variant="warning"
      isLoading={isLoading}
    >
      {hasBalance && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Outstanding balance of {formatCurrency(reservation!.due_amount)} — you can still proceed.
        </div>
      )}
    </ConfirmDialog>
  )
}
