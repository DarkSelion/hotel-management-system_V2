import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

const accentMap: Record<string, { iconBg: string; iconText: string }> = {
  primary: { iconBg: 'bg-primary/10', iconText: 'text-primary' },
  gold: { iconBg: 'bg-gold/10', iconText: 'text-gold-dark' },
  success: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
  warning: { iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
  danger: { iconBg: 'bg-rose-50', iconText: 'text-rose-600' },
  info: { iconBg: 'bg-sky-50', iconText: 'text-sky-600' },
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
  accent?: keyof typeof accentMap
}

export function StatCard({ icon, label, value, trend, trendValue, accent = 'primary' }: StatCardProps) {
  const colors = accentMap[accent] || accentMap.primary

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colors.iconBg, colors.iconText)}>
            {icon}
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </span>
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend === 'up' ? 'text-emerald-600' : 'text-rose-500',
            )}
          >
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendValue}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-gray-400 group-hover:text-gray-500">
            {trend === 'up' ? 'Increased' : 'Decreased'}
          </span>
        )}
      </div>
    </div>
  )
}
