import { cn } from '../../lib/utils'

interface StatCardProps {
  icon?: React.ReactNode
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
  variant?: 'default' | 'compact' | 'hero'
}

export function StatCard({ icon, label, value, trend, trendValue, variant = 'default' }: StatCardProps) {
  if (variant === 'compact') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums text-gray-900">{value}</span>
          {trend && trendValue && (
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              {trend === 'up' ? '+' : ''}{trendValue}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums text-gray-900">{value}</span>
          {trend && trendValue && (
            <span
              className={cn(
                'text-sm font-medium',
                trend === 'up' ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              {trend === 'up' ? '+' : ''}{trendValue}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-gray-900">{value}</span>
        {trend && trendValue && (
          <span
            className={cn(
              'text-xs font-medium',
              trend === 'up' ? 'text-emerald-600' : 'text-rose-500',
            )}
          >
            {trend === 'up' ? '+' : ''}{trendValue}
          </span>
        )}
      </div>
    </div>
  )
}
