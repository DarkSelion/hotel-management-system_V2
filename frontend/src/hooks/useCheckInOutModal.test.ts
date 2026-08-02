import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCheckInOutModal } from './useCheckInOutModal'
import type { Guest, Reservation, Room } from '@/types'

const { mockPerform } = vi.hoisted(() => ({ mockPerform: vi.fn() }))

vi.mock('@/hooks/useApi', () => ({
  useCheckInOutWithPayment: () => ({ perform: mockPerform, isLoading: false }),
}))

function makeReservation(): Reservation {
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
  }
}

describe('useCheckInOutModal', () => {
  beforeEach(() => {
    mockPerform.mockReset()
  })

  it('opens on a reservation and clears when closed', () => {
    const { result } = renderHook(() => useCheckInOutModal('check-in'))
    const res = makeReservation()

    expect(result.current.isOpen).toBe(false)
    act(() => result.current.open(res))
    expect(result.current.isOpen).toBe(true)
    expect(result.current.target).toBe(res)

    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
    expect(result.current.target).toBeNull()
  })

  it('confirms without a method when none selected', async () => {
    mockPerform.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCheckInOutModal('check-in'))
    const res = makeReservation()
    act(() => result.current.open(res))

    await act(async () => {
      await result.current.confirm(undefined, undefined)
    })
    expect(mockPerform).toHaveBeenCalledWith('check-in', res, undefined, undefined)
    expect(result.current.isOpen).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('passes the selected method and amount through to perform', async () => {
    mockPerform.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCheckInOutModal('check-in'))
    const res = makeReservation()
    act(() => result.current.open(res))

    await act(async () => {
      await result.current.confirm('cash', 330)
    })
    expect(mockPerform).toHaveBeenCalledWith('check-in', res, 'cash', 330)
    expect(result.current.isOpen).toBe(false)
  })

  it('surfaces a recorded-payment failure with the retry message', async () => {
    const failure = new Error('boom') as Error & { paymentRecorded?: boolean }
    failure.paymentRecorded = true
    mockPerform.mockRejectedValue(failure)
    const { result } = renderHook(() => useCheckInOutModal('check-out'))
    const res = makeReservation()
    act(() => result.current.open(res))

    await act(async () => {
      await result.current.confirm('gcash', 330)
    })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.error?.paymentRecorded).toBe(true)
    expect(result.current.error?.message).toMatch(/Payment was recorded, but check-out failed/)
  })

  it('coerces both method and amount to undefined on retry', async () => {
    const failure = new Error('boom') as Error & { paymentRecorded?: boolean }
    failure.paymentRecorded = true
    mockPerform.mockRejectedValueOnce(failure)
    const { result } = renderHook(() => useCheckInOutModal('check-in'))
    const res = makeReservation()
    act(() => result.current.open(res))

    await act(async () => {
      await result.current.confirm('cash', 165)
    })
    expect(result.current.error?.paymentRecorded).toBe(true)

    mockPerform.mockResolvedValueOnce(undefined)
    await act(async () => {
      await result.current.confirm('gcash', 999)
    })
    expect(mockPerform).toHaveBeenLastCalledWith('check-in', res, undefined, undefined)
    expect(result.current.isOpen).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('falls back to the server message when no payment was recorded', async () => {
    mockPerform.mockRejectedValue(new Error('server down'))
    const { result } = renderHook(() => useCheckInOutModal('check-out'))
    const res = makeReservation()
    act(() => result.current.open(res))

    await act(async () => {
      await result.current.confirm(undefined, undefined)
    })
    expect(result.current.error?.paymentRecorded).toBe(false)
    expect(result.current.error?.message).toBe('server down')
  })
})
