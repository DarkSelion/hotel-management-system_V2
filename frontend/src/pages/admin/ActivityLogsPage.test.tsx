import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import ActivityLogsPage from './ActivityLogsPage'
import type { ActivityLog, PaginatedResponse, User } from '@/types'

const { mockUseActivityLogs, mockUseStaffAssignable } = vi.hoisted(() => ({
  mockUseActivityLogs: vi.fn(),
  mockUseStaffAssignable: vi.fn(),
}))

vi.mock('@/hooks/useApi', () => ({
  useActivityLogs: (_params?: Record<string, unknown>) => mockUseActivityLogs(_params),
  useStaffAssignable: () => mockUseStaffAssignable(),
}))

function staff(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    role: { id: 1, name: 'Admin', slug: 'admin', permissions: [] },
    is_active: true,
    created_at: '2026-01-01T00:00:00.000000Z',
    ...overrides,
  }
}

function log(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: 1,
    action: 'created',
    module: 'reservations',
    description: 'Created reservation #BK-2026-0001',
    created_at: '2026-08-01T10:00:00.000000Z',
    ...overrides,
  }
}

function paginated(logs: ActivityLog[]): PaginatedResponse<ActivityLog> {
  return {
    data: logs,
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: logs.length,
  }
}

function renderPage() {
  mockUseActivityLogs.mockReturnValue({
    data: paginated([log()]),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })
  mockUseStaffAssignable.mockReturnValue({ data: [staff()], isLoading: false, error: null })
  return render(<ActivityLogsPage />)
}

describe('ActivityLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff activity rows with actor name', () => {
    mockUseActivityLogs.mockReturnValue({
      data: paginated([log({ id: 1, user_id: 1, user: staff() })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseStaffAssignable.mockReturnValue({ data: [staff()], isLoading: false, error: null })
    render(<ActivityLogsPage />)

    expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0)
    expect(screen.getByText('Created reservation #BK-2026-0001')).toBeTruthy()
    expect(screen.getAllByText('Reservations').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Created').length).toBeGreaterThan(0)
  })

  it('renders Guest badge for guest activity rows', () => {
    mockUseActivityLogs.mockReturnValue({
      data: paginated([log({ id: 2, user_id: null, description: 'Guest Maria created reservation' })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseStaffAssignable.mockReturnValue({ data: [staff()], isLoading: false, error: null })
    render(<ActivityLogsPage />)

    expect(screen.getByText('Guest Maria created reservation')).toBeTruthy()
    expect(screen.getAllByText('Guest').length).toBeGreaterThan(0)
  })

  it('renders scope filter options', () => {
    renderPage()
    const scopeSelect = screen.getAllByRole('combobox')[0]
    expect(within(scopeSelect).getByRole('option', { name: 'All Actors' })).toBeTruthy()
    expect(within(scopeSelect).getByRole('option', { name: 'Guest' })).toBeTruthy()
    expect(within(scopeSelect).getByRole('option', { name: 'Staff' })).toBeTruthy()
  })

  it('renders empty state when no logs', () => {
    mockUseActivityLogs.mockReturnValue({
      data: paginated([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseStaffAssignable.mockReturnValue({ data: [staff()], isLoading: false, error: null })
    render(<ActivityLogsPage />)

    expect(screen.getByText('No data found')).toBeTruthy()
  })

  it('renders error state and retry', () => {
    mockUseActivityLogs.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
      refetch: vi.fn(),
    })
    mockUseStaffAssignable.mockReturnValue({ data: [staff()], isLoading: false, error: null })
    render(<ActivityLogsPage />)

    expect(screen.getByText('Failed to load activity logs')).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
  })
})
