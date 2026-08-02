import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReservationRowActions } from './ReservationRowActions'
import type { Guest, Reservation, Room } from '@/types'

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    reservation_number: 'BK-2026-0001',
    guest: {} as Guest,
    room: {} as Room,
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

describe('ReservationRowActions', () => {
  it('shows View, Edit, Cancel and Check In for a confirmed non-overdue reservation', () => {
    render(
      <ReservationRowActions
        reservation={reservation()}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onCheckIn={vi.fn()}
      />,
    )

    expect(screen.getByTitle('View')).toBeInTheDocument()
    expect(screen.getByTitle('Edit')).toBeInTheDocument()
    expect(screen.getByTitle('Cancel')).toBeInTheDocument()
    expect(screen.getByTitle('Check In')).toBeInTheDocument()
    expect(screen.queryByTitle('Mark No Show')).not.toBeInTheDocument()
  })

  it('replaces Check In with Mark No Show on an overdue confirmed reservation', () => {
    render(
      <ReservationRowActions
        reservation={reservation({ is_overdue: true })}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onCheckIn={vi.fn()}
        onMarkNoShow={vi.fn()}
      />,
    )

    expect(screen.getByTitle('Mark No Show')).toBeInTheDocument()
    expect(screen.queryByTitle('Check In')).not.toBeInTheDocument()
  })

  it('keeps Check In on an overdue reservation when alwaysAllowCheckIn is set', () => {
    render(
      <ReservationRowActions
        reservation={reservation({ is_overdue: true })}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onCheckIn={vi.fn()}
        onMarkNoShow={vi.fn()}
        alwaysAllowCheckIn
      />,
    )

    expect(screen.getByTitle('Check In')).toBeInTheDocument()
    expect(screen.queryByTitle('Mark No Show')).not.toBeInTheDocument()
  })

  it('shows only View for cancelled reservations', () => {
    render(
      <ReservationRowActions
        reservation={reservation({ status: 'cancelled' })}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByTitle('View')).toBeInTheDocument()
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Cancel')).not.toBeInTheDocument()
  })

  it('shows View, Edit and Check Out for checked-in reservations', () => {
    render(
      <ReservationRowActions
        reservation={reservation({ status: 'checked_in' })}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onCheckOut={vi.fn()}
      />,
    )

    expect(screen.getByTitle('View')).toBeInTheDocument()
    expect(screen.getByTitle('Edit')).toBeInTheDocument()
    expect(screen.getByTitle('Check Out')).toBeInTheDocument()
    expect(screen.queryByTitle('Check In')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Cancel')).not.toBeInTheDocument()
  })

  it('does not render Check In when no onCheckIn handler is provided', () => {
    render(
      <ReservationRowActions
        reservation={reservation()}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.queryByTitle('Check In')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Cancel')).not.toBeInTheDocument()
  })

  it('fires the View handler when the View button is clicked', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()

    render(
      <ReservationRowActions
        reservation={reservation()}
        onView={onView}
        onEdit={vi.fn()}
      />,
    )

    await user.click(screen.getByTitle('View'))
    expect(onView).toHaveBeenCalledTimes(1)
  })
})
