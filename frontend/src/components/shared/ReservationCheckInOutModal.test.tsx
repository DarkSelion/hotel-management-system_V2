import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReservationCheckInOutModal } from './ReservationCheckInOutModal'
import type { Guest, Reservation, Room } from '@/types'

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

describe('ReservationCheckInOutModal', () => {
  it('shows the guest info table with guest and room', () => {
    render(
      <ReservationCheckInOutModal
        mode="check-in"
        reservation={reservation()}
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Guest')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Stay')).toBeInTheDocument()
    expect(screen.getByText('Check In Guest')).toBeInTheDocument()
  })

  it('shows the outstanding-balance warning when there is a due amount', () => {
    render(
      <ReservationCheckInOutModal
        mode="check-in"
        reservation={reservation({ due_amount: 330, payment_status: 'unpaid' })}
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText(/Outstanding balance: ₱330/)).toBeInTheDocument()
    expect(screen.getByText('Guest will still be checked in.')).toBeInTheDocument()
  })

  it('does not warn when the reservation is fully paid', () => {
    render(
      <ReservationCheckInOutModal
        mode="check-in"
        reservation={reservation({ due_amount: 0, payment_status: 'paid' })}
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.queryByText(/Outstanding balance/i)).not.toBeInTheDocument()
  })

  it('shows the check-out title and balance warning in check-out mode', () => {
    render(
      <ReservationCheckInOutModal
        mode="check-out"
        reservation={reservation({ status: 'checked_in', due_amount: 120 })}
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Check Out Guest')).toBeInTheDocument()
    expect(screen.getByText(/Outstanding balance: ₱120/)).toBeInTheDocument()
    expect(screen.getByText('Guest will still be checked out.')).toBeInTheDocument()
  })
})
