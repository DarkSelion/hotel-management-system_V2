import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PaymentsPage from './PaymentsPage'
import type { Payment, Reservation } from '@/types'

const { mockUsePayments, mockUseReservations } = vi.hoisted(() => ({
  mockUsePayments: vi.fn(),
  mockUseReservations: vi.fn(),
}))

vi.mock('@/hooks/useApi', () => ({
  usePayments: (params?: Record<string, unknown>) => mockUsePayments(params),
  useReservations: (params?: Record<string, unknown>) => mockUseReservations(params),
  useCreatePayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePayment: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePayment: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}))

vi.mock('@/components/shared/PaymentModal', () => ({
  PaymentModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="payment-modal-stub" /> : null,
}))

function payment(overrides: Partial<Payment & { reservation?: Reservation }> = {}): Payment & { reservation?: Reservation } {
  return {
    id: 1,
    reservation_id: 1,
    amount: 330,
    payment_method: 'cash',
    status: 'completed',
    paid_at: '2026-10-01T00:00:00.000000Z',
    created_at: '2026-10-01T00:00:00.000000Z',
    reference_number: 'REF-001',
    reservation: {
      id: 1,
      reservation_number: 'BK-2026-0001',
      total_amount: 330,
      guest: { first_name: 'John', last_name: 'Doe' },
      room: { room_number: '101' },
    } as unknown as Reservation,
    ...overrides,
  }
}

function renderPage() {
  mockUsePayments.mockReturnValue({
    data: {
      data: [payment()],
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 1,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })
  mockUseReservations.mockReturnValue({ data: { data: [] }, isLoading: false })
  return render(<PaymentsPage />)
}

describe('PaymentsPage', () => {
  beforeEach(() => {
    mockUsePayments.mockReset()
    mockUseReservations.mockReset()
  })

  it('defaults to a paid_at sort with page 1', () => {
    renderPage()
    expect(mockUsePayments).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, sort: '-paid_at' }),
    )
  })

  it('passes search, method and status filters to the API', () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Search by reference or guest name...'), {
      target: { value: 'REF-001' },
    })
    const combos = screen.getAllByRole('combobox')
    fireEvent.change(combos[0], { target: { value: 'gcash' } })
    fireEvent.change(combos[1], { target: { value: 'pending' } })

    const params = mockUsePayments.mock.calls.at(-1)?.[0]
    expect(params).toEqual(
      expect.objectContaining({
        page: 1,
        sort: '-paid_at',
        search: 'REF-001',
        payment_method: 'gcash',
        status: 'pending',
      }),
    )
  })

  it('passes date range filters to the API', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /From date/ }))
    fireEvent.click(screen.getAllByRole('button', { name: '1' }).at(-1)!)

    const params = mockUsePayments.mock.calls.at(-1)?.[0]
    expect(params).toEqual(expect.objectContaining({ date_from: expect.stringMatching(/^\d{4}-\d{2}-01$/) }))
  })

  it('opens the record payment modal', () => {
    renderPage()
    expect(screen.queryByTestId('payment-modal-stub')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Record Payment' }))
    expect(screen.getByTestId('payment-modal-stub')).toBeInTheDocument()
  })

  it('opens the payment detail modal from a reference link', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'REF-001' }))
    expect(screen.getByText('Payment Details')).toBeInTheDocument()
    expect(screen.getByText('Reference Number')).toBeInTheDocument()
    expect(screen.getAllByText('₱330.00').length).toBeGreaterThan(0)
  })
})
