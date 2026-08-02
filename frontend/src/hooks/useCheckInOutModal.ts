import { useCallback, useState } from 'react'
import { useCheckInOutWithPayment } from '@/hooks/useApi'
import type { Reservation } from '@/types'

export type CheckInOutError = { message: string; paymentRecorded: boolean } | null

export function useCheckInOutModal(action: 'check-in' | 'check-out') {
  const [target, setTarget] = useState<Reservation | null>(null)
  const [error, setError] = useState<CheckInOutError>(null)
  const { perform, isLoading } = useCheckInOutWithPayment()

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

  const confirm = useCallback(
    async (paymentMethod?: 'cash' | 'gcash', amount?: number) => {
      if (!target) return
      try {
        const isRetry = error?.paymentRecorded
        await perform(action, target, isRetry ? undefined : paymentMethod, isRetry ? undefined : amount)
        setTarget(null)
        setError(null)
      } catch (err) {
        const e = err as { paymentRecorded?: boolean; message?: string }
        setError({
          message: e.paymentRecorded
            ? `Payment was recorded, but ${verb} failed. Retry to finish ${verb} — the amount has already been collected.`
            : (e.message || `${Verb} failed. Please try again.`),
          paymentRecorded: !!e.paymentRecorded,
        })
      }
    },
    [action, target, error, perform, verb, Verb],
  )

  return {
    target,
    error,
    isLoading,
    isOpen: !!target,
    open,
    close,
    confirm,
  }
}
