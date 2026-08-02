import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentModal } from '@/components/shared/PaymentModal'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { AlertCircle, AlertTriangle, Banknote } from 'lucide-react'
import type { Payment, Reservation } from '@/types'

interface ReservationCheckInOutModalProps {
  mode: 'check-in' | 'check-out'
  reservation: Reservation | null
  isOpen: boolean
  isLoading?: boolean
  error?: { message: string; paymentRecorded: boolean } | null
  onClose: () => void
  onConfirm: () => void
  onConfirmAfterPayment?: (payment?: Payment) => void
}

export function ReservationCheckInOutModal({
  mode,
  reservation,
  isOpen,
  isLoading,
  error,
  onClose,
  onConfirm,
  onConfirmAfterPayment,
}: ReservationCheckInOutModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    if (!isOpen) setShowPaymentModal(false)
  }, [isOpen])

  const isCheckIn = mode === 'check-in'
  const guestName = reservation ? `${reservation.guest?.first_name ?? ''} ${reservation.guest?.last_name ?? ''}`.trim() : ''
  const roomNumber = reservation?.room?.room_number ?? '-'
  const hasBalance = !!reservation && reservation.due_amount > 0
  const isRetry = error?.paymentRecorded === true

  const verb = isCheckIn ? 'Check In' : 'Check Out'

  const lastPaymentMethod = reservation?.payments?.[0]?.payment_method
  const paymentLabel =
    reservation?.payment_status === 'paid'
      ? `Paid in full${lastPaymentMethod ? ` · ${lastPaymentMethod === 'gcash' ? 'GCash' : 'Cash'}` : ''}`
      : reservation?.payment_status === 'partial'
        ? `Partial — ${formatCurrency(reservation.paid_amount)} of ${formatCurrency(reservation.total_amount)} paid`
        : reservation?.payment_status === 'unpaid'
          ? 'Unpaid'
          : (reservation?.payment_status ?? '-')

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => {
        if (isRetry) onConfirmAfterPayment?.()
        else onConfirm()
      }}
      title={isCheckIn ? 'Check In Guest' : 'Check Out Guest'}
      confirmLabel={isRetry ? `Retry ${verb}` : verb}
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
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted">Payment</dt>
              <dd className="font-medium text-gray-900">
                {reservation.payment_status === 'unpaid' ? (
                  <StatusBadge status="unpaid" />
                ) : (
                  paymentLabel
                )}
              </dd>
            </div>
          </dl>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error.message}</span>
          </div>
        )}

        {hasBalance && reservation && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-amber-900">
                Outstanding balance: {formatCurrency(reservation.due_amount)}
              </p>
              {!isRetry && (
                <p className="text-[13px] text-amber-700">
                  Guest will still be checked {isCheckIn ? 'in' : 'out'} — payments are optional.
                </p>
              )}
              {!isRetry && (
                <Button
                  variant="gold"
                  className="mt-2"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Banknote className="h-4 w-4" />
                  Record Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        reservation={reservation}
        confirmLabel={isCheckIn ? 'Record & Check In' : 'Record & Check Out'}
        onSuccess={(payment) => {
          setShowPaymentModal(false)
          onConfirmAfterPayment?.(payment)
        }}
      />
    </ConfirmDialog>
  )
}
