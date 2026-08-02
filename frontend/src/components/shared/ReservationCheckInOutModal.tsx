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
  error?: { message: string; paymentRecorded: boolean } | null
  onClose: () => void
  onConfirm: (paymentMethod?: 'cash' | 'gcash', amount?: number) => void
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
  const [amount, setAmount] = useState(0)

  useEffect(() => {
    setSelectedMethod(null)
    setAmount(reservation?.due_amount ?? 0)
  }, [reservation?.id, error?.paymentRecorded])

  const isCheckIn = mode === 'check-in'
  const guestName = reservation ? `${reservation.guest?.first_name ?? ''} ${reservation.guest?.last_name ?? ''}`.trim() : ''
  const roomNumber = reservation?.room?.room_number ?? '-'
  const hasBalance = !!reservation && reservation.due_amount > 0
  const isRetry = error?.paymentRecorded === true

  const verb = isCheckIn ? 'Check In' : 'Check Out'
  const confirmLabel = isRetry
    ? `Retry ${verb}`
    : selectedMethod === 'cash'
      ? `Confirm Cash & ${verb}`
      : selectedMethod === 'gcash'
        ? `Confirm GCash & ${verb}`
        : verb

  const confirmDisabled = !!selectedMethod && amount <= 0

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
        if (isRetry) onConfirm(undefined, undefined)
        else if (selectedMethod) onConfirm(selectedMethod, amount)
        else onConfirm(undefined, undefined)
      }}
      title={isCheckIn ? 'Check In Guest' : 'Check Out Guest'}
      confirmLabel={confirmLabel}
      confirmVariant="primary"
      icon={null}
      isLoading={isLoading}
      disabled={confirmDisabled}
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
              <p className="text-[13px] text-amber-700">
                {(!selectedMethod || isRetry) && `Guest will still be checked ${isCheckIn ? 'in' : 'out'}.`}
              </p>
              {!isRetry && (
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

                  {selectedMethod && (
                    <div className="mt-2 border-t border-amber-200 pt-2">
                      <p className="text-xs font-medium text-amber-800">Amount</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-amber-700">
                            ₱
                          </span>
                          <input
                            type="number"
                            aria-label="Amount to collect"
                            min={0}
                            max={reservation.due_amount}
                            step="0.01"
                            value={amount}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value)
                              const next = Number.isNaN(parsed)
                                ? 0
                                : Math.min(Math.max(parsed, 0), reservation.due_amount)
                              setAmount(next)
                            }}
                            className="w-full rounded-md border border-amber-300 bg-white/60 py-1.5 pl-6 pr-2 text-xs font-medium text-amber-900 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setAmount(reservation.due_amount)}
                          className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
                        >
                          Full
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount(Math.round(reservation.due_amount / 2))}
                          className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
                        >
                          Half
                        </button>
                      </div>
                      {amount <= 0 && (
                        <p className="mt-1 text-[11px] text-amber-700">
                          Enter an amount to collect.
                        </p>
                      )}
                    </div>
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
