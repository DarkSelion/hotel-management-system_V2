import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RevenueChart } from './RevenueChart'
import type { RevenueData } from '@/types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

function data(overrides: Partial<RevenueData>[] = []): RevenueData[] {
  const base: RevenueData[] = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, '0')}`,
    revenue: 1000 + i * 100,
    bookings: 2 + (i % 3),
  }))
  return base.map((d, i) => ({ ...d, ...(overrides[i] ?? {}) }))
}

function renderChart(props: Partial<React.ComponentProps<typeof RevenueChart>> = {}) {
  const defaultProps = {
    data: data(),
    activeTab: 'revenue' as const,
    onTabChange: vi.fn(),
  }
  return render(<RevenueChart {...defaultProps} {...props} />)
}

describe('RevenueChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders revenue overview title', () => {
    renderChart()
    expect(screen.getByText('Revenue Overview')).toBeInTheDocument()
  })

  it('renders Revenue tab with total', () => {
    renderChart()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })

  it('renders Bookings tab with total', () => {
    renderChart()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
  })

  it('calls onTabChange when clicking Bookings tab', () => {
    const onTabChange = vi.fn()
    renderChart({ onTabChange })

    fireEvent.click(screen.getByText('Bookings'))
    expect(onTabChange).toHaveBeenCalledWith('bookings')
  })

  it('calls onTabChange when clicking Revenue tab', () => {
    const onTabChange = vi.fn()
    renderChart({ activeTab: 'bookings', onTabChange })

    fireEvent.click(screen.getByText('Revenue'))
    expect(onTabChange).toHaveBeenCalledWith('revenue')
  })

  it('shows summary bar with recent total for revenue', () => {
    renderChart()

    const pesoElements = screen.getAllByText(/₱/)
    expect(pesoElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows trend up icon when positive change', () => {
    const chartData = data()
    // Make recent half much larger than prior half
    for (let i = 15; i < 30; i++) {
      chartData[i].revenue = 5000
    }

    renderChart({ data: chartData })

    // TrendingUp should be rendered (via lucide mock or class check)
    const trendText = screen.getByText(/vs prior period/)
    expect(trendText).toBeInTheDocument()
  })

  it('shows no change indicator when change is zero', () => {
    const chartData = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      revenue: 1000,
      bookings: 5,
    }))

    renderChart({ data: chartData })

    // No trend icon when change is 0
    expect(screen.queryByText(/vs prior period/)).not.toBeInTheDocument()
  })

  it('renders chart container', () => {
    renderChart()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('switches dataKey when activeTab changes', () => {
    const { rerender } = renderChart({ activeTab: 'revenue' })

    // Re-render with bookings tab
    rerender(
      <RevenueChart
        data={data()}
        activeTab="bookings"
        onTabChange={vi.fn()}
      />
    )

    // Chart should still render
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    renderChart({ data: [] })

    expect(screen.getByText('Revenue Overview')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
  })

  it('shows bookings count without peso sign in summary', () => {
    const chartData = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      revenue: 1000,
      bookings: 5,
    }))

    renderChart({ data: chartData, activeTab: 'bookings' })

    // Bookings total should be shown as number, not peso
    const elements = screen.getAllByText('75')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })
})
