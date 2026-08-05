import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RevenueData } from '@/types'

interface RevenueChartProps {
  data: RevenueData[]
  activeTab: 'revenue' | 'bookings'
  onTabChange: (tab: 'revenue' | 'bookings') => void
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color?: string; dataKey?: string }>
  label?: string
}

export function RevenueChart({ data, activeTab, onTabChange }: RevenueChartProps) {
  const activeColor = '#1e3a5f'

  const summary = useMemo(() => {
    if (!data || data.length === 0) return null
    const valueKey = activeTab === 'revenue' ? 'revenue' : 'bookings'
    const midpoint = Math.ceil(data.length / 2)
    const recent = data.slice(midpoint)
    const prior = data.slice(0, midpoint)

    const recentTotal = recent.reduce((sum, d) => sum + Number(d[valueKey]), 0)
    const priorTotal = prior.reduce((sum, d) => sum + Number(d[valueKey]), 0)
    let change: number | null = null
    if (priorTotal > 0) {
      change = ((recentTotal - priorTotal) / priorTotal) * 100
    }

    return { recentTotal, priorTotal, change }
  }, [data, activeTab])

  const tabTotals = useMemo(() => {
    if (!data || data.length === 0) return { revenue: 0, bookings: 0 }
    const midpoint = Math.ceil(data.length / 2)
    const recent = data.slice(midpoint)
    return {
      revenue: recent.reduce((sum, d) => sum + Number(d.revenue), 0),
      bookings: recent.reduce((sum, d) => sum + Number(d.bookings), 0),
    }
  }, [data])

  const formatNumber = (val: number) => `${Math.round(val)}`

  const tickFormatter = (val: number) => {
    if (activeTab === 'revenue') {
      return val >= 1000 ? `₱${Math.round(val / 1000)}k` : `₱${val}`
    }
    return val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`
  }

  const tabs: Array<{ id: 'revenue' | 'bookings'; label: string; total: number }> = [
    { id: 'revenue', label: 'Revenue', total: tabTotals.revenue },
    { id: 'bookings', label: 'Bookings', total: tabTotals.bookings },
  ]

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (!active || !payload?.length) return null
    const entry = payload[0]
    const value = activeTab === 'revenue' ? formatCurrency(entry.value) : `${entry.value} bookings`
    const labelDate = label
      ? new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : ''

    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-lg ring-1 ring-black/5">
        <p className="text-xs text-gray-500">{labelDate}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Revenue Overview</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {activeTab === 'revenue'
              ? '30-day revenue trend and booking volume'
              : '30-day booking volume and revenue trend'}
          </p>
        </div>

        {/* Pill toggle */}
        <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.25 text-xs font-semibold',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-200 text-gray-400',
                  )}
                >
                  {tab.id === 'revenue'
                    ? formatCurrency(tab.total)
                    : formatNumber(tab.total)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-gray-900">
            {activeTab === 'revenue'
              ? formatCurrency(summary.recentTotal)
              : formatNumber(summary.recentTotal)}
          </span>
          {summary.change !== null && summary.change !== 0 && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                summary.change > 0 ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              {summary.change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {summary.change > 0 ? '+' : ''}
              {summary.change.toFixed(1)}%
              <span className="text-gray-400">vs prior</span>
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} horizontal={true} stroke="#e5e7eb" strokeWidth={1} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(val) => {
                const d = new Date(val || '')
                return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`
              }}
              padding={{ left: 12, right: 12 }}
            />
             <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={tickFormatter}
              width={56}
              tickCount={5}
              domain={[0, 'dataMax + ' + (activeTab === 'revenue' ? 2000 : 20)]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1d5db', strokeWidth: 1 }} />
            <Area
              type="natural"
              dataKey={activeTab === 'revenue' ? 'revenue' : 'bookings'}
              stroke={activeColor}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              fillOpacity={1}
              isAnimationActive={true}
              animationDuration={1200}
              animationBegin={0}
              dot={false}
              activeDot={{
                r: 5,
                fill: activeColor,
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
