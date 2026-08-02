import { useCallback, useState } from 'react'
import { useCheckInOutWithPayment } from '@/hooks/useApi'
import type { Payment, Reservation } from '@/types'

export type CheckInOutError = { message: string; paymentRecorded: boolean } | null

export function useCheckInOutModal(action: 'check-in' | 'check-out') {
  const [target, setTarget] = useState<Reservation | null>(null)
  const [error, setError] = useState<CheckInOutError>(null)
  const { performStatusChange, isLoading } = useCheckInOutWithPayment()

  const verb = action === 'check-in' ? 'check-in' : 'check-out'
  const Verb = action === 'check-in' ? 'Check-in' : 'Check-out'

  const open = useCallback((reservation: Reservation) => {
    setTarget(reservation)
    setError(null)
  }, [])

  const close = useCallback(() => {
    setTarget(null)
    setError(null)
  }, [])

  const runStatusChange = useCallback(
    async (paymentRecorded: boolean) => {
      if (!target) return
      try {
        await performStatusChange(action, target)
        setTarget(null)
        setError(null)
      } catch (err) {
        const e = err as { message?: string }
        setError({
          message: paymentRecorded
            ? `Payment was recorded, but ${verb} failed. Retry to finish ${verb} — the amount has already been collected.`
            : (e.message || `${Verb} failed. Please try again.`),
          paymentRecorded,
        })
      }
    },
    [action, target, performStatusChange, verb, Verb],
  )

  const confirm = useCallback(() => runStatusChange(false), [runStatusChange])

  const confirmAfterPayment = useCallback(
    (payment?: Payment) => {
      if (!target) return
      if (payment?.status === 'completed') {
        setTarget((prev) => {
          if (!prev) return prev
          const paidAmount = (prev.paid_amount ?? 0) + payment.amount
          const dueAmount = Math.max(0, prev.total_amount - paidAmount)
          return {
            ...prev,
            paid_amount: paidAmount,
            due_amount: dueAmount,
            payment_status: dueAmount <= 0 ? 'paid' : 'partial',
          }
        })
      }
      return runStatusChange(true)
    },
    [target, runStatusChange],
  )

  return {
    target,
    error,
    isLoading,
    isOpen: !!target,
    open,
    close,
    confirm,
    confirmAfterPayment,
  }
}
