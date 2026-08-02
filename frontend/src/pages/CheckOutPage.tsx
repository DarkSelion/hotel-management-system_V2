import { useState, useMemo, useCallback } from 'react'
import {
  useReservations,
} from '@/hooks/useApi'
import { useCheckInOutModal } from '@/hooks/useCheckInOutModal'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ReservationRowActions } from '@/components/shared/ReservationRowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ReservationDetailModal } from '@/components/shared/ReservationDetailModal'
import { ReservationFormModal } from '@/components/shared/ReservationFormModal'
import { ReservationCheckInOutModal } from '@/components/shared/ReservationCheckInOutModal'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Reservation } from '@/types'

export default function CheckOutPage() {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('check_out')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)

  const checkOutModal = useCheckInOutModal('check-out')
  const { open: openCheckOut, close: closeCheckOut, confirm: confirmCheckOut } = checkOutModal

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      status: 'checked_in',
      page,
      sort_field: sortField,
      sort_dir: sortDir,
    }
    if (search) params.search = search
    return params
  }, [page, sortField, sortDir, search])

  const { data: reservationsData, isLoading, error, refetch } = useReservations(queryParams)

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
      key: 'check_out',
      label: 'Check Out',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => <span>{formatDateDisplay(r.check_out)}</span>,
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
      key: 'due_amount',
      label: 'Due',
      sortable: true,
      className: 'whitespace-nowrap tabular-nums',
      render: (r) => (
        <span className={r.due_amount > 0 ? 'font-medium text-danger' : 'text-success'}>
          {formatCurrency(r.due_amount)}
        </span>
      ),
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
          onCheckOut={() => openCheckOut(r)}
        />
      ),
    },
  ], [openCheckOut])

  return (
    <div>
      <PageHeader
        title="Check Out"
        description="Guests departing today — checked-in reservations ready for check-out"
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
        mode="check-out"
        reservation={checkOutModal.target}
        isOpen={checkOutModal.isOpen}
        isLoading={checkOutModal.isLoading}
        error={checkOutModal.error}
        onClose={closeCheckOut}
        onConfirm={confirmCheckOut}
      />
    </div>
  )
}
