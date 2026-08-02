import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
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

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={isCheckIn ? 'Check In Guest' : 'Check Out Guest'}
      confirmLabel={isCheckIn ? 'Check In' : 'Check Out'}
      confirmVariant="primary"
      icon={null}
      isLoading={isLoading}
    >
      <div className="mt-4 w-full space-y-3 text-left">
        {reservation && (
          <dl className="divide-y divide-border rounded-lg border border-border bg-gray-50/70 text-sm">
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted">Guest</dt>
              <dd className="font-medium text-gray-900">{guestName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted">Room</dt>
              <dd className="font-medium text-gray-900">Room {roomNumber}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted">Stay</dt>
              <dd className="font-medium text-gray-900">
                {formatDateDisplay(reservation.check_in)} – {formatDateDisplay(reservation.check_out)}
              </dd>
            </div>
          </dl>
        )}

        {hasBalance && reservation && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">
                Outstanding balance: {formatCurrency(reservation.due_amount)}
              </p>
              <p className="text-[13px] text-amber-700">
                Guest will still be checked {isCheckIn ? 'in' : 'out'}.
              </p>
            </div>
          </div>
        )}
      </div>
    </ConfirmDialog>
  )
}
