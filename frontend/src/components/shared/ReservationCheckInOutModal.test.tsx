import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReservationCheckInOutModal } from './ReservationCheckInOutModal'
import type { Guest, Payment, Reservation, Room } from '@/types'

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

type OnConfirm = (paymentMethod?: 'cash' | 'gcash') => void

function renderModal(overrides: {
  mode?: 'check-in' | 'check-out'
  reservation?: Reservation
  error?: string | null
  onConfirm?: ReturnType<typeof vi.fn<OnConfirm>>
} = {}) {
  const onConfirm = overrides.onConfirm ?? vi.fn<OnConfirm>()
  render(
    <ReservationCheckInOutModal
      mode={overrides.mode ?? 'check-in'}
      reservation={overrides.reservation ?? reservation()}
      isOpen
      error={overrides.error ?? null}
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  )
  return { onConfirm }
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

  it('does not show the payment toggle or balance warning when fully paid', () => {
    renderModal({ reservation: reservation({ due_amount: 0, payment_status: 'paid' }) })

    expect(screen.queryByText(/Outstanding balance/i)).not.toBeInTheDocument()
    expect(screen.queryByText('How is the guest paying?')).not.toBeInTheDocument()
  })

  it('confirms without a payment method when nothing is selected', () => {
    const { onConfirm } = renderModal()

    expect(screen.getByText('Guest will still be checked in.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Check In' }))
    expect(onConfirm).toHaveBeenCalledWith(undefined)
  })

  it('records cash payment: labels the button and passes the method', () => {
    const { onConfirm } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Cash' }))
    expect(screen.getByRole('button', { name: 'Confirm Cash & Check In' })).toBeInTheDocument()
    expect(screen.queryByText('Guest will still be checked in.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cash & Check In' }))
    expect(onConfirm).toHaveBeenCalledWith('cash')
  })

  it('records GCash payment: shows pending note and passes the method', () => {
    const { onConfirm } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'GCash' }))
    expect(screen.getByRole('button', { name: 'Confirm GCash & Check In' })).toBeInTheDocument()
    expect(screen.getByText(/Recorded as pending — verify on the Payments page/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm GCash & Check In' }))
    expect(onConfirm).toHaveBeenCalledWith('gcash')
  })

  it('uses the check-out verb in labels', () => {
    renderModal({
      mode: 'check-out',
      reservation: reservation({ status: 'checked_in' }),
    })

    expect(screen.getByText('Check Out Guest')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Out' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cash' }))
    expect(screen.getByRole('button', { name: 'Confirm Cash & Check Out' })).toBeInTheDocument()
  })

  it('shows a retry state when a payment was recorded but the status change failed', () => {
    const { onConfirm } = renderModal({
      mode: 'check-out',
      reservation: reservation({ status: 'checked_in', due_amount: 330 }),
      error: 'Payment was recorded, but check-out failed. Retry to finish check-out — the amount has already been collected.',
    })

    expect(screen.getByText(/Payment was recorded, but check-out failed/i)).toBeInTheDocument()
    expect(screen.queryByText('How is the guest paying?')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry Check Out' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry Check Out' }))
    expect(onConfirm).toHaveBeenCalledWith(undefined)
  })
})
