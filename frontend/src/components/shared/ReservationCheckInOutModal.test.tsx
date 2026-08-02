import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReservationCheckInOutModal } from './ReservationCheckInOutModal'
import type { Guest, Payment, Reservation, Room } from '@/types'

vi.mock('@/components/shared/PaymentModal', () => ({
  PaymentModal: ({
    isOpen,
    onSuccess,
    confirmLabel,
  }: {
    isOpen: boolean
    onSuccess?: (payment: Payment) => void
    confirmLabel?: string
  }) =>
    isOpen ? (
      <button
        onClick={() =>
          onSuccess?.({
            id: 99,
            reservation_id: 1,
            amount: 330,
            payment_method: 'cash',
            status: 'completed',
            created_at: '2026-10-01T00:00:00.000000Z',
          } as Payment)
        }
      >
        stub-{confirmLabel}
      </button>
    ) : null,
}))

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    reservation_number: 'BK-2026-0001',
    guest: { first_name: 'John', last_name: 'Doe' } as Guest,
    room: { room_number: '101' } as Room,
    status: 'confirmed',
    check_in: '2026-10-10',
    check_out: '2026-10-12',
    adults: 2,
    children: 0,
    total_amount: 330,
    paid_amount: 0,
    due_amount: 330,
    payment_status: 'unpaid',
    created_at: '2026-10-01T00:00:00.000000Z',
    ...overrides,
  }
}

type OnConfirm = () => void
type OnConfirmAfterPayment = (payment?: Payment) => void
type ModalError = { message: string; paymentRecorded: boolean }

function renderModal(overrides: {
  mode?: 'check-in' | 'check-out'
  reservation?: Reservation
  error?: ModalError | null
  onConfirm?: ReturnType<typeof vi.fn<OnConfirm>>
  onConfirmAfterPayment?: ReturnType<typeof vi.fn<OnConfirmAfterPayment>>
} = {}) {
  const onConfirm = overrides.onConfirm ?? vi.fn<OnConfirm>()
  const onConfirmAfterPayment = overrides.onConfirmAfterPayment ?? vi.fn<OnConfirmAfterPayment>()
  const result = render(
    <ReservationCheckInOutModal
      mode={overrides.mode ?? 'check-in'}
      reservation={overrides.reservation ?? reservation()}
      isOpen
      error={overrides.error ?? null}
      onClose={vi.fn()}
      onConfirm={onConfirm}
      onConfirmAfterPayment={onConfirmAfterPayment}
    />,
  )
  return { onConfirm, onConfirmAfterPayment, rerender: result.rerender }
}

describe('ReservationCheckInOutModal', () => {
  it('shows the guest info table with guest, room, stay and payment rows', () => {
    renderModal()

    expect(screen.getByText('Guest')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Stay')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByText('Unpaid')).toBeInTheDocument()
    expect(screen.getByText('Check In Guest')).toBeInTheDocument()
  })

  it('renders payment status labels', () => {
    renderModal({ reservation: reservation({ payment_status: 'paid', due_amount: 0 }) })
    expect(screen.getByText('Paid in full')).toBeInTheDocument()

    const { unmount } = render(
      <ReservationCheckInOutModal
        mode="check-in"
        reservation={reservation({
          payment_status: 'paid',
          due_amount: 0,
          payments: [{ payment_method: 'cash' } as Payment],
        })}
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('Paid in full · Cash')).toBeInTheDocument()
    unmount()

    render(
      <ReservationCheckInOutModal
        mode="check-in"
        reservation={reservation({ payment_status: 'partial', paid_amount: 100, due_amount: 230 })}
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText(/Partial — ₱100\.00 of ₱330\.00 paid/)).toBeInTheDocument()
  })

  it('does not show the balance banner or Record Payment when fully paid', () => {
    renderModal({ reservation: reservation({ due_amount: 0, payment_status: 'paid' }) })

    expect(screen.queryByText(/Outstanding balance/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Record Payment/ })).not.toBeInTheDocument()
  })

  it('checks in without a payment when no payment is recorded', () => {
    const { onConfirm } = renderModal()

    expect(screen.getByText(/payments are optional/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Check In' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('opens the shared payment modal from Record Payment', () => {
    renderModal()

    fireEvent.click(screen.getByRole('button', { name: /Record Payment/ }))
    expect(screen.getByRole('button', { name: 'stub-Record & Check In' })).toBeInTheDocument()
  })

  it('records a payment then triggers check-in automatically via onSuccess', () => {
    const { onConfirmAfterPayment } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: /Record Payment/ }))
    fireEvent.click(screen.getByRole('button', { name: 'stub-Record & Check In' }))

    expect(onConfirmAfterPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 330 }))
  })

  it('uses the check-out verb in labels', () => {
    renderModal({ mode: 'check-out', reservation: reservation({ status: 'checked_in' }) })

    expect(screen.getByText('Check Out Guest')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Out' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Record Payment/ }))
    expect(screen.getByRole('button', { name: 'stub-Record & Check Out' })).toBeInTheDocument()
  })

  it('shows a retry state when a payment was recorded but the status change failed', () => {
    const { onConfirmAfterPayment } = renderModal({
      mode: 'check-out',
      reservation: reservation({ status: 'checked_in', due_amount: 330 }),
      error: {
        message: 'Payment was recorded, but check-out failed. Retry to finish check-out — the amount has already been collected.',
        paymentRecorded: true,
      },
    })

    expect(screen.getByText(/Payment was recorded, but check-out failed/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Record Payment/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry Check Out' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry Check Out' }))
    expect(onConfirmAfterPayment).toHaveBeenCalled()
  })

  it('retry never re-opens the payment modal after a recorded-payment failure', () => {
    const { rerender, onConfirmAfterPayment } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: /Record Payment/ }))
    expect(screen.getByRole('button', { name: 'stub-Record & Check In' })).toBeInTheDocument()

    rerender(
      <ReservationCheckInOutModal
        mode="check-in"
        reservation={reservation({ due_amount: 330 })}
        isOpen
        error={{
          message: 'Payment was recorded, but check-in failed.',
          paymentRecorded: true,
        }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onConfirmAfterPayment={onConfirmAfterPayment}
      />,
    )

    expect(screen.getByRole('button', { name: 'Retry Check In' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry Check In' }))
    expect(onConfirmAfterPayment).toHaveBeenCalled()
  })

  it('keeps Record Payment visible when the payment itself failed', () => {
    const { onConfirm } = renderModal({
      mode: 'check-out',
      reservation: reservation({ status: 'checked_in', due_amount: 330 }),
      error: {
        message: 'The amount field is required.',
        paymentRecorded: false,
      },
    })

    expect(screen.getByText('The amount field is required.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Record Payment/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Out' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Check Out' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
