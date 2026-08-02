import { useState, useMemo, useCallback } from 'react'
import {
  useReservations, useCheckInOutWithPayment, useCancelReservation,
} from '@/hooks/useApi'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ReservationRowActions } from '@/components/shared/ReservationRowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ReservationDetailModal } from '@/components/shared/ReservationDetailModal'
import { ReservationFormModal } from '@/components/shared/ReservationFormModal'
import { ReservationCheckInOutModal } from '@/components/shared/ReservationCheckInOutModal'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Reservation } from '@/types'

export default function CheckInPage() {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('check_in')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null)

  const [checkInTarget, setCheckInTarget] = useState<Reservation | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      status: 'confirmed',
      page,
      sort_field: sortField,
      sort_dir: sortDir,
    }
    if (search) params.search = search
    return params
  }, [page, sortField, sortDir, search])

  const { data: reservationsData, isLoading, error, refetch } = useReservations(queryParams)
  const { perform, isLoading: frontDeskLoading } = useCheckInOutWithPayment()
  const cancelReservation = useCancelReservation()

  const reservations = reservationsData?.data ?? []
  const totalPages = reservationsData?.last_page ?? 1
  const sortBy = sortDir === 'asc' ? sortField : `-${sortField}`

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleSort = useCallback((key: string) => {
    setSortField(prevField => {
      if (prevField === key) {
        setSortDir(prevDir => prevDir === 'asc' ? 'desc' : 'asc')
        return prevField
      }
      setSortDir('asc')
      return key
    })
  }, [])

  function openDetailModal(reservation: Reservation) {
    setSelectedReservation(reservation)
    setShowDetailModal(true)
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

  async function handleCheckInConfirm(paymentMethod?: 'cash' | 'gcash') {
    if (!checkInTarget) return
    try {
      await perform('check-in', checkInTarget, paymentMethod)
      setCheckInTarget(null)
      setCheckInError(null)
    } catch (err) {
      if ((err as { paymentRecorded?: boolean }).paymentRecorded) {
        setCheckInError('Payment was recorded, but check-in failed. Retry to finish check-in — the amount has already been collected.')
      }
    }
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

  const columns: Column<Reservation>[] = useMemo(() => [
    {
      key: 'reservation_number',
      label: 'Reservation #',
      sortable: true,
      render: (r) => <span className="font-medium">{r.reservation_number}</span>,
    },
    {
      key: 'guest',
      label: 'Guest',
      sortable: false,
      className: 'truncate max-w-[300px]',
      render: (r) => (
        <span>{r.guest?.first_name} {r.guest?.last_name}</span>
      ),
    },
    {
      key: 'room',
      label: 'Room',
      sortable: false,
      render: (r) => <span>{r.room?.room_number ?? '-'}</span>,
    },
    {
      key: 'check_in',
      label: 'Check In',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => <span>{formatDateDisplay(r.check_in)}</span>,
    },
    {
      key: 'adults',
      label: 'Guests',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (r) => (
        <span>{r.adults} Adult{r.adults !== 1 ? 's' : ''}{r.children > 0 ? `, ${r.children} Child${r.children !== 1 ? 'ren' : ''}` : ''}</span>
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
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      className: 'whitespace-nowrap tabular-nums',
      render: (r) => <span className="font-medium">{formatCurrency(r.total_amount)}</span>,
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
          onCancel={() => setCancelTarget(r)}
          onCheckIn={() => setCheckInTarget(r)}
          alwaysAllowCheckIn
        />
      ),
    },
  ], [])

  return (
    <div>
      <PageHeader
        title="Check In"
        description="Guests arriving today — confirmed reservations ready for check-in"
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

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Reservation"
        message={`Cancel the reservation for ${cancelTarget?.guest?.first_name ?? ''} ${cancelTarget?.guest?.last_name ?? ''}?`}
        confirmLabel="Cancel Reservation"
        variant="danger"
        isLoading={cancelReservation.isPending}
      />
    </div>
  )
}
