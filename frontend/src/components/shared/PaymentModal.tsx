import { useEffect, useState } from 'react'
import { useCreatePayment } from '@/hooks/useApi'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Banknote, Smartphone, Loader2, AlertCircle } from 'lucide-react'
import type { Payment, Reservation } from '@/types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  reservation?: Reservation | null
  reservations?: Reservation[]
  confirmLabel?: string
  hideHalf?: boolean
  onSuccess?: (payment: Payment) => void
}

function dueOf(reservation: Reservation | null): number {
  return reservation?.due_amount ?? 0
}

function clampAmount(value: number, max: number): number {
  return Math.min(Math.max(value, 0), max)
}

export function PaymentModal({
  isOpen,
  onClose,
  reservation,
  reservations,
  confirmLabel = 'Record Payment',
  hideHalf = false,
  onSuccess,
}: PaymentModalProps) {
  const createPayment = useCreatePayment()
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [method, setMethod] = useState<'cash' | 'gcash'>('cash')
  const [amount, setAmount] = useState(0)
  const [tendered, setTendered] = useState(0)
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  const activeReservation = reservation ?? selectedReservation
  const due = dueOf(activeReservation)

  useEffect(() => {
    if (!isOpen) return
    setMethod('cash')
    setReference('')
    setError(null)
    if (reservation) {
      setAmount(dueOf(reservation))
      setTendered(dueOf(reservation))
    } else {
      setSelectedReservation(null)
      setAmount(0)
      setTendered(0)
    }
  }, [isOpen, reservation])

  function handleReservationSelect(id: number) {
    const res = reservations?.find((r) => r.id === id) ?? null
    setSelectedReservation(res)
    const next = dueOf(res)
    setAmount(next)
    setTendered(next)
    setError(null)
  }

  function handleAmountChange(next: number) {
    const clamped = clampAmount(next, due)
    setAmount(clamped)
    setTendered(clamped)
  }

  function handleTenderedChange(next: number) {
    setTendered(clampAmount(next, Number.MAX_SAFE_INTEGER))
  }

  const changeDue = Math.max(0, tendered - amount)
  const stillOwes = Math.max(0, amount - tendered)
  const canSubmit = !!activeReservation && amount > 0 && !createPayment.isPending

  async function handleSubmit() {
    if (!activeReservation) {
      setError('Select a reservation first.')
      return
    }
    if (amount <= 0) {
      setError('Enter an amount to collect.')
      return
    }
    try {
      const payment = (await createPayment.mutateAsync({
        reservation_id: activeReservation.id,
        amount,
        payment_method: method,
        payment_type: amount >= due ? 'full' : 'partial',
        reference_number: reference.trim() || undefined,
        status: method === 'gcash' ? 'pending' : 'completed',
      })) as unknown as Payment
      onSuccess?.(payment)
      onClose()
    } catch (err) {
      const e = err as { message?: string }
      setError(e.message || 'Payment failed. Please try again.')
    }
  }

  const methodTabClass = (active: boolean) =>
    cn(
      'flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
        : 'border-border bg-white text-gray-700 hover:bg-gray-100',
    )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="lg">
      <div className="space-y-4">
        {!reservation && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Reservation</label>
            <Select
              value={selectedReservation ? String(selectedReservation.id) : ''}
              onChange={(e) => handleReservationSelect(Number(e.target.value))}
            >
              <option value="" disabled>Select a reservation</option>
              {(reservations ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.reservation_number} - {r.guest?.first_name} {r.guest?.last_name} (Due: {formatCurrency(dueOf(r))})
                </option>
              ))}
            </Select>
          </div>
        )}

        {activeReservation && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-border bg-gray-50/70 px-3 py-2.5 text-sm">
            <span className="text-muted text-left">Guest</span>
            <span className="font-medium text-gray-900 text-right">
              {activeReservation.guest?.first_name} {activeReservation.guest?.last_name}
            </span>
            <span className="text-muted text-left">Room</span>
            <span className="font-medium text-gray-900 text-right">Room {activeReservation.room?.room_number ?? '-'}</span>
            <span className="text-muted text-left">Stay</span>
            <span className="font-medium text-gray-900 text-right">
              {formatDateDisplay(activeReservation.check_in)} – {formatDateDisplay(activeReservation.check_out)}
            </span>
            <span className="text-muted text-left">Balance due</span>
            <span className="font-semibold text-gray-900 text-right">{formatCurrency(due)}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={() => setMethod('cash')} className={methodTabClass(method === 'cash')}>
            <Banknote className="h-4 w-4" />
            Cash
          </button>
          <button type="button" onClick={() => setMethod('gcash')} className={methodTabClass(method === 'gcash')}>
            <Smartphone className="h-4 w-4" />
            GCash
          </button>
        </div>

        {method === 'cash' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Amount to collect</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAmountChange(due)}
                    className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
                  >
                    Full
                  </button>
                  {!hideHalf && (
                    <button
                      type="button"
                      onClick={() => handleAmountChange(Math.round(due / 2))}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
                    >
                      Half
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₱</span>
                <input
                  type="number"
                  aria-label="Amount to collect"
                  min={0}
                  max={due}
                  step="0.01"
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-card py-2 pl-7 pr-3 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Cash tendered</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₱</span>
                <input
                  type="number"
                  aria-label="Cash tendered"
                  min={0}
                  step="0.01"
                  value={tendered}
                  onChange={(e) => handleTenderedChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-card py-2 pl-7 pr-3 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {changeDue > 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                <span className="font-medium text-emerald-800">Change due</span>
                <span className="text-lg font-bold text-emerald-900">{formatCurrency(changeDue)}</span>
              </div>
            ) : (
              stillOwes > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm">
                  <span className="font-medium text-amber-800">Guest still owes</span>
                  <span className="text-lg font-bold text-amber-900">{formatCurrency(stillOwes)}</span>
                </div>
              )
            )}

            <Input
              label="Reference / Transaction ID"
              placeholder="Optional for cash"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        )}

        {method === 'gcash' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Amount to collect</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAmountChange(due)}
                    className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
                  >
                    Full
                  </button>
                  {!hideHalf && (
                    <button
                      type="button"
                      onClick={() => handleAmountChange(Math.round(due / 2))}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
                    >
                      Half
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₱</span>
                <input
                  type="number"
                  aria-label="Amount to collect"
                  min={0}
                  max={due}
                  step="0.01"
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-card py-2 pl-7 pr-3 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            <Input
              label="Reference / Transaction ID"
              placeholder="GCash reference or transaction ID"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Recorded as <span className="font-medium">pending</span> — verify on the Payments page.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={createPayment.isPending}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {createPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
