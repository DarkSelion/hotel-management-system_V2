import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
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
    />
  )
}
