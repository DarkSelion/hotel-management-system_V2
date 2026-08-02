import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useDashboardStats,
  useDashboardRevenue,
  useBookingSources,
  useRecentActivities,
  useReservations,
} from '@/hooks/useApi'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { BOOKING_SOURCES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  DollarSign, Percent, DoorOpen, CalendarCheck, LogIn, LogOut, Clock, SprayCan,
  Activity, RefreshCw, Calendar, ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend as RechartsLegend,
} from 'recharts'
import type { Reservation } from '@/types'

const PIE_COLORS = ['#c9a84c', '#1e3a5f', '#10b981', '#f59e0b', '#6b7280']

const formatDate = (dateStr: string) =>
  formatDateDisplay(dateStr)

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function PieChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <Skeleton className="h-[250px] w-[250px] rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats()
  const { data: revenueData, isLoading: revenueLoading } = useDashboardRevenue()
  const { data: sources, isLoading: sourcesLoading } = useBookingSources()
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities()
  const { data: reservationsData, isLoading: reservationsLoading, error: reservationsError } = useReservations({ per_page: 5 })

  const [chartTab, setChartTab] = useState<'revenue' | 'bookings'>('revenue')

  const initialLoading = statsLoading && !stats
  const hasError = statsError || reservationsError

  const reservations = reservationsData?.data ?? []
  const revenueChartData = revenueData ?? []
  const mappedSources = (sources ?? []).map((s) => ({
    ...s,
    source: BOOKING_SOURCES.find((b) => b.value === s.source)?.label ?? s.source,
  }))

  const totalDirtyRooms = stats ? stats.total_rooms - stats.available_rooms : 0

  if (hasError) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Hotel overview & statistics" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <div className="mb-4 rounded-full bg-danger/10 p-3 text-danger">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Failed to load dashboard</h3>
          <p className="mb-4 text-sm text-muted">Something went wrong. Please try again.</p>
          <Button variant="primary" onClick={() => refetchStats()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Hotel overview & statistics" />

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {initialLoading ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </>
        ) : stats ? (
          <>
            <StatCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Today's Revenue"
              value={formatCurrency(stats.today_revenue)}
              trend="up"
              trendValue="+12.5%"
              accent="gold"
            />
            <StatCard
              icon={<Percent className="h-5 w-5" />}
              label="Occupancy Rate"
              value={`${Math.round(stats.occupancy_rate)}%`}
              accent="primary"
            />
            <StatCard
              icon={<DoorOpen className="h-5 w-5" />}
              label="Available Rooms"
              value={`${stats.available_rooms} / ${stats.total_rooms}`}
              accent="success"
            />
            <StatCard
              icon={<CalendarCheck className="h-5 w-5" />}
              label="Booked Rooms"
              value={stats.booked_rooms}
              accent="warning"
            />
            <StatCard
              icon={<LogIn className="h-5 w-5" />}
              label="Check-ins Today"
              value={stats.check_ins_today}
              accent="success"
            />
            <StatCard
              icon={<LogOut className="h-5 w-5" />}
              label="Check-outs Today"
              value={stats.check_outs_today}
              accent="danger"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Pending Reservations"
              value={stats.pending_reservations}
              accent="warning"
            />
            <StatCard
              icon={<SprayCan className="h-5 w-5" />}
              label="Housekeeping (Dirty)"
              value={totalDirtyRooms}
              accent="danger"
            />
          </>
        ) : null}
      </div>

      {/* Occupancy Progress Bar */}
      {stats && !statsLoading && (
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Current Occupancy</span>
              <span className="font-semibold text-primary">{Math.round(stats.occupancy_rate)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all duration-500"
                style={{ width: `${Math.min(stats.occupancy_rate, 100)}%` }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          {revenueLoading ? (
            <ChartSkeleton />
          ) : revenueChartData && revenueChartData.length > 0 ? (
            <RevenueChart
              data={revenueChartData}
              activeTab={chartTab}
              onTabChange={(tab) => setChartTab(tab)}
            />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Booking Sources */}
        <div>
          {sourcesLoading ? (
            <PieChartSkeleton />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Booking Sources</h3>
              {mappedSources && mappedSources.length > 0 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mappedSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={84}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="source"
                      >
                        {mappedSources.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <RechartsLegend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-sm text-muted">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-sm text-gray-500">
                  No booking data available
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities & Latest Reservations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-0">
                {activities.slice(0, 7).map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`relative flex items-start gap-3 pb-4 ${
                      index < Math.min(activities.length, 7) - 1
                        ? 'border-l-2 border-border pl-4'
                        : 'pl-4'
                    }`}
                  >
                    <div
                      className={`absolute left-0 mt-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-card ${
                        getActivityColor(activity.module)
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {activity.description || activity.action}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-3 text-muted">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Reservations */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Reservations</CardTitle>
            <Link
              to="/reservations"
              className="group flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {reservationsLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : reservations.length > 0 ? (
              <div className="divide-y divide-border">
                {reservations.map((reservation: Reservation) => {
                  const initials = reservation.guest
                    ? `${reservation.guest.first_name?.[0] ?? ''}${reservation.guest.last_name?.[0] ?? ''}`.toUpperCase()
                    : '?'
                  const statusColors: Record<string, string> = {
                    pending: 'border-l-amber-400',
                    confirmed: 'border-l-blue-400',
                    checked_in: 'border-l-emerald-400',
                    checked_out: 'border-l-gray-400',
                    cancelled: 'border-l-rose-400',
                    no_show: 'border-l-rose-400',
                  }
                  return (
                    <div
                      key={reservation.id}
                      className={`flex items-center gap-4 border-l-4 ${statusColors[reservation.status] || 'border-l-gray-300'} px-6 py-4 transition-colors hover:bg-gray-50`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {reservation.guest?.first_name} {reservation.guest?.last_name}
                        </p>
                        <p className="text-xs text-muted">
                          {reservation.reservation_number} Â· Room {reservation.room?.room_number ?? '-'}
                        </p>
                      </div>
                      <div className="hidden sm:block text-xs text-muted">
                        {formatDate(reservation.check_in)} â†’ {formatDate(reservation.check_out)}
                      </div>
                      <StatusBadge status={reservation.status} />
                      <span className="shrink-0 text-sm font-semibold text-gray-900">
                        {formatCurrency(reservation.total_amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-3 text-muted">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted">No reservations found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getActivityColor(module: string): string {
  const map: Record<string, string> = {
    reservation: 'bg-primary',
    payment: 'bg-success',
    guest: 'bg-gold',
    room: 'bg-warning',
    housekeeping: 'bg-info',
    maintenance: 'bg-danger',
  }
  return map[module] || 'bg-muted'
}
