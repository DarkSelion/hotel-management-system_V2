import { useState, useMemo } from 'react'
import { usePayments, useCreatePayment, useReservations } from '@/hooks/useApi'
import type { Payment, Reservation } from '@/types'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActions, RowActionButton } from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { DatePicker } from '@/components/ui/date-picker'
import { PAYMENT_METHODS } from '@/lib/constants'
import {
  Plus, Eye, Banknote, Smartphone,
  Loader2, AlertCircle,
} from 'lucide-react'

interface PaymentExtended extends Payment {
  reservation?: Reservation
}

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const PAYMENT_TYPE_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'partial', label: 'Partial' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'refund', label: 'Refund' },
]

const METHOD_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  gcash: <Smartphone className="h-4 w-4" />,
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return formatDateDisplay(dateStr)
}

export default function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('-paid_at')
  const [page, setPage] = useState(1)

  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentExtended | null>(null)

  const [formReservationId, setFormReservationId] = useState<number | ''>('')
  const [formAmount, setFormAmount] = useState(0)
  const [formMethod, setFormMethod] = useState('cash')
  const [formType, setFormType] = useState('full')
  const [formReference, setFormReference] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({})

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = { page, sort: sortBy }
    if (search) params.search = search
    if (methodFilter) params.payment_method = methodFilter
    if (statusFilter) params.status = statusFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return params
  }, [page, sortBy, search, methodFilter, statusFilter, dateFrom, dateTo])

  const { data: paymentsData, isLoading, error, refetch } = usePayments(queryParams)
  const { data: reservationsData } = useReservations({ per_page: 100, status: 'checked_in,checked_out,confirmed' })
  const createPayment = useCreatePayment()

  const payments = (paymentsData?.data ?? []) as PaymentExtended[]
  const reservations = (reservationsData?.data ?? []) as Reservation[]
  const totalPages = paymentsData?.last_page ?? 1

  function openDetailModal(payment: PaymentExtended) {
    setSelectedPayment(payment)
    setShowDetailModal(true)
  }

  function openNewForm() {
    setFormReservationId('')
    setFormAmount(0)
    setFormMethod('cash')
    setFormType('full')
    setFormReference('')
    setFormNotes('')
    setFormErrors({})
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
  }

  function handleReservationSelect(id: number) {
    setFormReservationId(id)
    const res = reservations.find(r => r.id === id)
    if (res) {
      setFormAmount(res.due_amount ?? res.total_amount)
    }
  }

  function validateForm(): boolean {
    const errors: Partial<Record<string, string>> = {}
    if (formReservationId === '') errors.reservation_id = 'Reservation is required'
    if (formAmount <= 0) errors.amount = 'Amount must be greater than 0'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleFormSubmit() {
    if (!validateForm()) return

    const payload = {
      reservation_id: Number(formReservationId),
      amount: formAmount,
      payment_method: formMethod,
      payment_type: formType,
      reference_number: formReference || undefined,
      notes: formNotes || undefined,
    }

    createPayment.mutate(payload, { onSuccess: closeFormModal })
  }

  function getMethodLabel(method: string) {
    return PAYMENT_METHODS.find(m => m.value === method)?.label ?? method
  }

  function getGuestName(payment: PaymentExtended) {
    return payment.reservation?.guest
      ? `${payment.reservation.guest.first_name} ${payment.reservation.guest.last_name}`
      : '-'
  }

  function handleSort(key: string) {
    setSortBy(prev => prev === key ? `-${key}` : prev === `-${key}` ? key : key)
  }

  const columns: Column<PaymentExtended>[] = [
    {
      key: 'reference_number',
      label: 'Reference #',
      sortable: true,
      className: 'font-medium',
      render: (r) => (
        <button onClick={() => openDetailModal(r)} className="text-primary hover:underline">
          {r.reference_number ?? `PAY-${r.id}`}
        </button>
      ),
    },
    {
      key: 'guest',
      label: 'Guest',
      sortable: true,
      render: (r) => <span>{getGuestName(r)}</span>,
    },
    {
      key: 'reservation_id',
      label: 'Reservation #',
      render: (r) => <span>{r.reservation?.reservation_number ?? `#${r.reservation_id}`}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (r) => <span className="font-medium">{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'payment_method',
      label: 'Method',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {METHOD_ICONS[r.payment_method] ?? null}
          <span>{getMethodLabel(r.payment_method)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'paid_at',
      label: 'Date',
      sortable: true,
      render: (r) => <span>{formatDate(r.paid_at ?? r.created_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <RowActions>
          <RowActionButton
            tone="neutral"
            title="View"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => openDetailModal(r)}
          />
        </RowActions>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track and manage all payments."
        actions={
          <Button variant="gold" onClick={openNewForm}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search by reference or guest name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <div className="w-44">
              <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1) }}>
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-44">
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
                {PAYMENT_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-44">
              <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1) }} placeholder="From date" />
            </div>
            <div className="w-44">
              <DatePicker value={dateTo} onChange={(v) => { setDateTo(v); setPage(1) }} placeholder="To date" />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={payments}
            loading={isLoading}
            error={error ? 'Failed to load payments' : null}
            sortBy={sortBy}
            onSort={handleSort}
            pagination={paymentsData ? {
              currentPage: page,
              lastPage: totalPages,
              total: paymentsData.total,
              from: (paymentsData.current_page - 1) * paymentsData.per_page + 1,
              to: Math.min(paymentsData.current_page * paymentsData.per_page, paymentsData.total),
              onPageChange: setPage,
            } : undefined}
            onRetry={() => refetch()}
            keyExtractor={(r) => r.id}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted">Reference Number</label>
                <p className="text-sm font-medium text-gray-900">{selectedPayment.reference_number ?? `PAY-${selectedPayment.id}`}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Status</label>
                <div className="mt-0.5"><StatusBadge status={selectedPayment.status} /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Amount</label>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Payment Method</label>
                <p className="flex items-center gap-1.5 text-sm text-gray-900">
                  {METHOD_ICONS[selectedPayment.payment_method] ?? null}
                  {getMethodLabel(selectedPayment.payment_method)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Date</label>
                <p className="text-sm text-gray-900">{formatDate(selectedPayment.paid_at ?? selectedPayment.created_at)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Receipt Number</label>
                <p className="text-sm text-gray-900">RCT-{selectedPayment.id.toString().padStart(5, '0')}</p>
              </div>
            </div>

            {selectedPayment.reservation && (
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-900">Reservation Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted">Reservation:</span>
                    <span className="ml-1 font-medium">{selectedPayment.reservation.reservation_number}</span>
                  </div>
                  <div>
                    <span className="text-muted">Guest:</span>
                    <span className="ml-1">{selectedPayment.reservation.guest?.first_name} {selectedPayment.reservation.guest?.last_name}</span>
                  </div>
                  <div>
                    <span className="text-muted">Room:</span>
                    <span className="ml-1">{selectedPayment.reservation.room?.room_number ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted">Total Amount:</span>
                    <span className="ml-1 font-medium">{formatCurrency(selectedPayment.reservation.total_amount)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted" />
            <p className="text-sm text-muted">Could not load payment details.</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showFormModal}
        onClose={closeFormModal}
        title="Record Payment"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Reservation</label>
            <Select
              value={formReservationId ? String(formReservationId) : ''}
              onChange={(e) => handleReservationSelect(Number(e.target.value))}
              error={formErrors.reservation_id}
            >
              <option value="" disabled>Select a reservation</option>
              {reservations.map(r => (
                <option key={r.id} value={r.id}>
                  #{r.reservation_number} - {r.guest?.first_name} {r.guest?.last_name} (Due: {formatCurrency(r.due_amount)})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (₱)"
              type="number"
              min={0}
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(Number(e.target.value))}
              error={formErrors.amount}
            />
            <Select label="Payment Type" value={formType} onChange={(e) => setFormType(e.target.value)}>
              {PAYMENT_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <Select label="Payment Method" value={formMethod} onChange={(e) => setFormMethod(e.target.value)}>
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>

          <Input
            label="Reference / Transaction ID"
            placeholder="TXN-123456"
            value={formReference}
            onChange={(e) => setFormReference(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="flex h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-card placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Payment notes..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={closeFormModal} disabled={createPayment.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleFormSubmit} disabled={createPayment.isPending}>
            {createPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </div>
      </Modal>

    </div>
  )
}
