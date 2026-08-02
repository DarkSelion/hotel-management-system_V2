import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import type { Reservation } from '@/types'

interface ReservationCheckInOutModalProps {
  mode: 'check-in' | 'check-out'
  reservation: Reservation | null
  isOpen: boolean
  isLoading?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: (paymentMethod?: 'cash' | 'gcash') => void
}

export function ReservationCheckInOutModal({
  mode,
  reservation,
  isOpen,
  isLoading,
  error,
  onClose,
  onConfirm,
}: ReservationCheckInOutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'gcash' | null>(null)

  useEffect(() => {
    setSelectedMethod(null)
  }, [reservation?.id])

  const isCheckIn = mode === 'check-in'
  const guestName = reservation ? `${reservation.guest?.first_name ?? ''} ${reservation.guest?.last_name ?? ''}`.trim() : ''
  const roomNumber = reservation?.room?.room_number ?? '-'
  const hasBalance = !!reservation && reservation.due_amount > 0

  const verb = isCheckIn ? 'Check In' : 'Check Out'
  const confirmLabel = error
    ? `Retry ${verb}`
    : selectedMethod === 'cash'
      ? `Confirm Cash & ${verb}`
      : selectedMethod === 'gcash'
        ? `Confirm GCash & ${verb}`
        : verb

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
      onConfirm={() => onConfirm(selectedMethod ?? undefined)}
      title={isCheckIn ? 'Check In Guest' : 'Check Out Guest'}
      confirmLabel={confirmLabel}
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
            <span>{error}</span>
          </div>
        )}

        {hasBalance && reservation && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-amber-900">
                Outstanding balance: {formatCurrency(reservation.due_amount)}
              </p>
              <p className="text-[13px] text-amber-700">
                {!selectedMethod && `Guest will still be checked ${isCheckIn ? 'in' : 'out'}.`}
              </p>
              {!error && (
                <div className="mt-3 border-t border-amber-200 pt-2">
                  <p className="text-xs font-medium text-amber-800">How is the guest paying?</p>
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod(selectedMethod === 'cash' ? null : 'cash')}
                      className={cn(
                        'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                        selectedMethod === 'cash'
                          ? 'border-amber-900 bg-amber-900 text-white shadow-sm'
                          : 'border-amber-300 bg-white/60 text-amber-900 hover:bg-amber-100',
                      )}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethod(selectedMethod === 'gcash' ? null : 'gcash')}
                      className={cn(
                        'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                        selectedMethod === 'gcash'
                          ? 'border-amber-900 bg-amber-900 text-white shadow-sm'
                          : 'border-amber-300 bg-white/60 text-amber-900 hover:bg-amber-100',
                      )}
                    >
                      GCash
                    </button>
                  </div>
                  {selectedMethod === 'gcash' && (
                    <p className="mt-1.5 text-[11px] text-amber-700">
                      Recorded as pending — verify on the Payments page.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ConfirmDialog>
  )
}
