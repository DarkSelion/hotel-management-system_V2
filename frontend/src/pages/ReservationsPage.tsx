import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useReservations, useCancelReservation, useCheckInOutWithPayment, useMarkNoShow, useRefreshOverdue,
} from '@/hooks/useApi'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { isAdminRole } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ReservationDetailModal } from '@/components/shared/ReservationDetailModal'
import { ReservationFormModal } from '@/components/shared/ReservationFormModal'
import { ReservationCheckInOutModal } from '@/components/shared/ReservationCheckInOutModal'
import { ReservationRowActions } from '@/components/shared/ReservationRowActions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import type { Reservation } from '@/types'
import {
  Plus, RefreshCw, AlertTriangle,
} from 'lucide-react'

function formatDate(dateStr: string) {
  return formatDateDisplay(dateStr)
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

export default function ReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const statusFilter = searchParams.get('status') ?? ''
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('-created_at')
  const [page, setPage] = useState(1)

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)

  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null)
  const [noShowTarget, setNoShowTarget] = useState<Reservation | null>(null)
  const [checkInTarget, setCheckInTarget] = useState<Reservation | null>(null)
  const [checkOutTarget, setCheckOutTarget] = useState<Reservation | null>(null)
  const [checkInError, setCheckInError] = useState<{ message: string; paymentRecorded: boolean } | null>(null)
  const [checkOutError, setCheckOutError] = useState<{ message: string; paymentRecorded: boolean } | null>(null)

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      page,
      sort: sortBy,
    }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return params
  }, [page, sortBy, search, statusFilter, dateFrom, dateTo])

  const { data: reservationsData, isLoading, error, refetch } = useReservations(queryParams)

  const cancelReservation = useCancelReservation()
  const { perform, isLoading: frontDeskLoading } = useCheckInOutWithPayment()
  const markNoShow = useMarkNoShow()
  const refreshOverdue = useRefreshOverdue()
  const role = useAuthStore((s) => s.user?.role ?? '')
  const isAdmin = isAdminRole(role)

  const reservations = reservationsData?.data ?? []
  const totalPages = reservationsData?.last_page ?? 1

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setPage(1)
    setSearchParams((prev) => {
      if (value) {
        prev.set('status', value)
      } else {
        prev.delete('status')
      }
      return prev
    })
  }, [setSearchParams])

  const handleSort = useCallback((key: string) => {
    setSortBy(prev => prev === key ? `-${key}` : prev === `-${key}` ? key : key)
  }, [])

  function openDetailModal(reservation: Reservation) {
    setSelectedReservation(reservation)
    setShowDetailModal(true)
  }

  function openNewForm() {
    setEditingReservation(null)
    setShowFormModal(true)
  }

  function openEditForm(reservation: Reservation) {
    setEditingReservation(reservation)
    setShowDetailModal(false)
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
    setEditingReservation(null)
  }

  function openCancelDialog(reservation: Reservation) {
    setCancelTarget(reservation)
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return
    try {
      await cancelReservation.mutateAsync(cancelTarget.id)
      setCancelTarget(null)
    } catch {
      // handled by react-query
    }
  }

  async function handleCheckInConfirm(paymentMethod?: 'cash' | 'gcash', amount?: number) {
    if (!checkInTarget) return
    try {
      const isRetry = checkInError?.paymentRecorded
      await perform('check-in', checkInTarget, isRetry ? undefined : paymentMethod, isRetry ? undefined : amount)
      setCheckInTarget(null)
      setCheckInError(null)
    } catch (err) {
      const e = err as { paymentRecorded?: boolean; message?: string }
      setCheckInError({
        message: e.paymentRecorded
          ? 'Payment was recorded, but check-in failed. Retry to finish check-in — the amount has already been collected.'
          : (e.message || 'Check-in failed. Please try again.'),
        paymentRecorded: !!e.paymentRecorded,
      })
    }
  }

  async function handleCheckOutConfirm(paymentMethod?: 'cash' | 'gcash', amount?: number) {
    if (!checkOutTarget) return
    try {
      const isRetry = checkOutError?.paymentRecorded
      await perform('check-out', checkOutTarget, isRetry ? undefined : paymentMethod, isRetry ? undefined : amount)
      setCheckOutTarget(null)
      setCheckOutError(null)
    } catch (err) {
      const e = err as { paymentRecorded?: boolean; message?: string }
      setCheckOutError({
        message: e.paymentRecorded
          ? 'Payment was recorded, but check-out failed. Retry to finish check-out — the amount has already been collected.'
          : (e.message || 'Check-out failed. Please try again.'),
        paymentRecorded: !!e.paymentRecorded,
      })
    }
  }

  async function handleMarkNoShowConfirm() {
    if (!noShowTarget) return
    try {
      await markNoShow.mutateAsync(noShowTarget.id)
      setNoShowTarget(null)
    } catch {
      // handled by react-query
    }
  }

  const columns: Column<Reservation>[] = useMemo(() => [
    {
      key: 'reservation_number',
      label: 'Reservation #',
      sortable: true,
      render: (r) => (
        <button
          onClick={() => openDetailModal(r)}
          className="block max-w-[160px] truncate text-primary hover:underline"
        >
          {r.reservation_number}
        </button>
      ),
    },
    {
      key: 'guest',
      label: 'Guest',
      sortable: true,
      className: 'truncate max-w-[300px]',
      render: (r) => (
        <span>{r.guest?.first_name} {r.guest?.last_name}</span>
      ),
    },
    {
      key: 'room',
      label: 'Room',
      sortable: true,
      render: (r) => <span>{r.room?.room_number ?? '-'}</span>,
    },
    {
      key: 'check_in',
      label: 'Check In',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => <span>{formatDate(r.check_in)}</span>,
    },
    {
      key: 'check_out',
      label: 'Check Out',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => <span>{formatDate(r.check_out)}</span>,
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      className: 'whitespace-nowrap tabular-nums',
      render: (r) => <span className="font-medium">{formatCurrency(r.total_amount)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={r.status} />
          {r.status === 'confirmed' && r.is_overdue && (
            <Badge variant="warning">
              <AlertTriangle className="h-3 w-3" />
              Overdue
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => <StatusBadge status={r.payment_status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'whitespace-nowrap',
      render: (r) => (
        <ReservationRowActions
          reservation={r}
          onView={() => openDetailModal(r)}
          onEdit={() => openEditForm(r)}
          onCancel={() => openCancelDialog(r)}
          onCheckIn={() => setCheckInTarget(r)}
          onCheckOut={() => setCheckOutTarget(r)}
          onMarkNoShow={() => setNoShowTarget(r)}
        />
      ),
    },
  ], [])

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Manage hotel reservations"
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => refreshOverdue.mutate()}
                disabled={refreshOverdue.isPending}
                title="Re-run overdue detection for No Show review"
              >
                <RefreshCw className={cn('h-4 w-4', refreshOverdue.isPending && 'animate-spin')} />
                Refresh Overdue
              </Button>
            )}
            <Button variant="primary" onClick={openNewForm}>
              <Plus className="h-4 w-4" />
              New Reservation
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search by reservation # or guest name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="w-44">
              <Select value={statusFilter} onChange={handleStatusFilterChange}>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-44">
              <DatePicker
                value={dateFrom}
                onChange={(v) => { setDateFrom(v); setPage(1) }}
                placeholder="From date"
              />
            </div>
            <div className="w-44">
              <DatePicker
                value={dateTo}
                onChange={(v) => { setDateTo(v); setPage(1) }}
                placeholder="To date"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={reservations}
            loading={isLoading}
            error={error ? 'Failed to load reservations' : null}
            sortBy={sortBy}
            onSort={handleSort}
            pagination={reservationsData ? {
              currentPage: page,
              lastPage: totalPages,
              total: reservationsData.total,
              from: (reservationsData.current_page - 1) * reservationsData.per_page + 1,
              to: Math.min(reservationsData.current_page * reservationsData.per_page, reservationsData.total),
              onPageChange: setPage,
            } : undefined}
            onRetry={() => refetch()}
            keyExtractor={(r) => r.id}
          />
        </CardContent>
      </Card>

      <ReservationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        reservation={selectedReservation}
        onEdit={openEditForm}
      />

      <ReservationFormModal
        isOpen={showFormModal}
        onClose={closeFormModal}
        reservation={editingReservation}
      />

      <ReservationCheckInOutModal
        mode="check-in"
        reservation={checkInTarget}
        isOpen={!!checkInTarget}
        isLoading={frontDeskLoading}
        error={checkInError}
        onClose={() => {
          setCheckInTarget(null)
          setCheckInError(null)
        }}
        onConfirm={handleCheckInConfirm}
      />

      <ReservationCheckInOutModal
        mode="check-out"
        reservation={checkOutTarget}
        isOpen={!!checkOutTarget}
        isLoading={frontDeskLoading}
        error={checkOutError}
        onClose={() => {
          setCheckOutTarget(null)
          setCheckOutError(null)
        }}
        onConfirm={handleCheckOutConfirm}
      />

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action may be subject to cancellation fees based on the hotel's cancellation policy."
        confirmLabel="Cancel Reservation"
        variant="danger"
        isLoading={cancelReservation.isPending}
      />

      <ConfirmDialog
        isOpen={!!noShowTarget}
        onClose={() => setNoShowTarget(null)}
        onConfirm={handleMarkNoShowConfirm}
        title="Mark as No Show"
        message={`Mark the reservation for ${noShowTarget?.guest?.first_name ?? ''} ${noShowTarget?.guest?.last_name ?? ''} as No Show? The room will be released and a no-show fee may apply.`}
        confirmLabel="Mark No Show"
        variant="danger"
        isLoading={markNoShow.isPending}
      />
    </div>
  )
}
