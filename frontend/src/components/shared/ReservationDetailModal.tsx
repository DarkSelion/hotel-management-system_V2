import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { BOOKING_SOURCES } from '@/lib/constants'
import { Pencil } from 'lucide-react'
import type { Reservation } from '@/types'

interface ReservationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
  onEdit: (reservation: Reservation) => void
}

export function ReservationDetailModal({ isOpen, onClose, reservation, onEdit }: ReservationDetailModalProps) {
  if (!reservation) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reservation ${reservation.reservation_number ?? ''}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted">Guest</label>
            <p className="text-sm font-medium">{reservation.guest?.first_name} {reservation.guest?.last_name}</p>
            <p className="text-xs text-muted">{reservation.guest?.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Room</label>
            <p className="text-sm font-medium">{reservation.room?.room_number ?? '-'}</p>
            <p className="text-xs text-muted">{reservation.room?.room_type?.name ?? ''}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Check In</label>
            <p className="text-sm">{formatDateDisplay(reservation.check_in)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Check Out</label>
            <p className="text-sm">{formatDateDisplay(reservation.check_out)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Guests</label>
            <p className="text-sm">{reservation.adults} Adult(s), {reservation.children} Child(ren)</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Source</label>
            <p className="text-sm">{reservation.source ? BOOKING_SOURCES.find(s => s.value === reservation.source)?.label ?? reservation.source : '-'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Status</label>
            <div className="mt-0.5"><StatusBadge status={reservation.status} /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Payment</label>
            <div className="mt-0.5"><StatusBadge status={reservation.payment_status} /></div>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted">Total Amount</label>
            <p className="text-lg font-bold">{formatCurrency(reservation.total_amount)}</p>
            <div className="mt-1 flex gap-4 text-xs text-muted">
              <span>Paid: {formatCurrency(reservation.paid_amount)}</span>
              <span>Due: {formatCurrency(reservation.due_amount)}</span>
            </div>
          </div>
          {reservation.special_requests && (
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted">Special Requests</label>
              <p className="text-sm">{reservation.special_requests}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => onEdit(reservation)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    </Modal>
  )
}
